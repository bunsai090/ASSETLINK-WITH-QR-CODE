import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { AlertTriangle, Search, Wrench, ChevronDown, CheckCircle, ArrowUpCircle, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, addHours, parseISO } from 'date-fns';
import { calculateDeadline, SLA_HOURS } from '@/lib/slaUtils';

const STATUSES = ['Pending', 'Approved', 'In Progress', 'Completed', 'Rejected', 'Escalated'];

export default function RepairRequests() {
    const { currentUser } = useAuth();
    const role = currentUser?.role || 'teacher';
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [selected, setSelected] = useState(null);
    const [notes, setNotes] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [verificationFeedback, setVerificationFeedback] = useState('');
    const [scheduledStartDate, setScheduledStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadRequests(); }, []);

    async function loadRequests() {
        const data = await base44.entities.RepairRequest.list('-created_date', 200);
        setRequests(data);
        setLoading(false);
    }

    const filtered = requests.filter(r => {
        const matchSearch = !search || r.asset_name?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        const matchPriority = filterPriority === 'all' || r.priority === filterPriority;
        return matchSearch && matchStatus && matchPriority;
    });

    async function updateStatus(id, status, extraData = {}) {
        setSaving(true);
        await base44.entities.RepairRequest.update(id, { status, ...extraData });

        // Notify the reporter by email on meaningful status changes
        const req = requests.find(r => r.id === id);
        if (req?.reported_by_email && ['Approved', 'Rejected', 'Escalated', 'Completed'].includes(status)) {
            const statusMessages = {
                Approved: `Your repair request for "${req.asset_name}" has been APPROVED by the principal and will be assigned to maintenance staff shortly.`,
                Rejected: `Your repair request for "${req.asset_name}" has been REJECTED.${extraData.principal_notes ? `\n\nPrincipal's note: ${extraData.principal_notes}` : ''}`,
                Escalated: `Your repair request for "${req.asset_name}" has been ESCALATED to a higher authority.${extraData.escalated_reason ? `\n\nReason: ${extraData.escalated_reason}` : ''}`,
                Completed: `Great news! Your repair request for "${req.asset_name}" has been marked as COMPLETED.`,
            };
            await base44.integrations.Core.SendEmail({
                to: req.reported_by_email,
                subject: `Repair Request Update — ${req.asset_name} [${status}]`,
                body: `Dear ${req.reported_by_name || 'Teacher'},\n\n${statusMessages[status]}\n\n📋 Request #: ${req.request_number || id}\n🏫 School: ${req.school_name || 'N/A'}\n🔧 Asset: ${req.asset_name}\n\nLog in to AssetLink to view the full details.\n\n— AssetLink Notification System`,
            });
        }

        toast.success(`Status updated to ${status}`);
        setSaving(false);
        setSelected(null);
        loadRequests();
    }

    async function handleApprove() {
        await updateStatus(selected.id, 'Approved', {
            principal_notes: notes,
            assigned_to_name: assignedTo,
        });
    }

    async function handleAssign() {
        const slaDeadline = calculateDeadline(scheduledStartDate, selected.priority);
        
        await updateStatus(selected.id, 'In Progress', {
            assigned_to_name: assignedTo,
            assigned_to_email: assignedTo,
            scheduled_start_date: scheduledStartDate,
            sla_deadline: slaDeadline.toISOString(),
        });
        
        // Create maintenance task
        await base44.entities.MaintenanceTask.create({
            repair_request_id: selected.id,
            request_number: selected.request_number,
            asset_name: selected.asset_name,
            school_name: selected.school_name,
            assigned_to_email: assignedTo,
            assigned_to_name: assignedTo,
            priority: selected.priority,
            status: 'Assigned',
            scheduled_start_date: scheduledStartDate,
            start_date: scheduledStartDate, // Initially same as scheduled
            sla_deadline: slaDeadline.toISOString(),
            reschedule_count: 0
        });
    }

    async function handleConfirmComplete() {
        await updateStatus(selected.id, 'Completed', { teacher_confirmation: true, completed_date: new Date().toISOString().split('T')[0] });
    }

    // BACKEND: Teacher verifies repair is satisfactory (marks repair as completed)
    async function handleVerifyRepair() {
        setSaving(true);
        // Find and update the related maintenance task
        const allTasks = await base44.entities.MaintenanceTask.list('-created_date', 500);
        const relatedTask = allTasks.find(t => t.repair_request_id === selected.id);
        
        if (relatedTask) {
            await base44.entities.MaintenanceTask.update(relatedTask.id, {
                status: 'Completed',
                teacher_confirmation: true,
                verified_by_email: currentUser?.email,
                verified_date: new Date().toISOString().split('T')[0],
            });
        }

        await updateStatus(selected.id, 'Completed', { 
            teacher_confirmation: true, 
            completed_date: new Date().toISOString().split('T')[0]
        });
        setVerificationFeedback('');
        toast.success('Repair verified and closed');
        setSaving(false);
    }

    // BACKEND: Teacher rejects repair, sends back to maintenance
    async function handleRejectRepair() {
        if (!verificationFeedback.trim()) {
            toast.error('Please provide feedback on why repair is not satisfactory');
            return;
        }
        setSaving(true);
        
        // Find and update the related maintenance task back to "In Progress"
        const allTasks = await base44.entities.MaintenanceTask.list('-created_date', 500);
        const relatedTask = allTasks.find(t => t.repair_request_id === selected.id);
        
        if (relatedTask) {
            await base44.entities.MaintenanceTask.update(relatedTask.id, {
                status: 'In Progress',
                teacher_verification_notes: verificationFeedback,
            });
        }

        // Keep repair in "In Progress" and add teacher notes
        await base44.entities.RepairRequest.update(selected.id, {
            teacher_verification_notes: verificationFeedback,
        });

        // Notify maintenance staff
        if (relatedTask?.assigned_to_email) {
            await base44.integrations.Core.SendEmail({
                to: relatedTask.assigned_to_email,
                subject: `⚠️ Repair Needs Rework — ${selected.asset_name}`,
                body: `Dear ${relatedTask.assigned_to_name || 'Maintenance Staff'},\n\nThe teacher has reviewed the repair on "${selected.asset_name}" and indicated it needs additional work.\n\n📋 Request #: ${selected.request_number}\n🏫 School: ${selected.school_name}\n\n📝 Teacher's Feedback:\n${verificationFeedback}\n\nPlease return to this task and address the issues mentioned above.\n\n— AssetLink Notification System`,
            });
        }

        toast.success('Repair rejected. Maintenance staff notified.');
        setVerificationFeedback('');
        setSaving(false);
        setSelected(null);
        loadRequests();
    }

    async function handleEscalate() {
        await updateStatus(selected.id, 'Escalated', { escalated_reason: notes });
    }

    const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Repair Requests</h1>
                <p className="text-muted-foreground text-sm mt-1">Track and manage all damage reports</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search requests..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Priority" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        {['Critical', 'High', 'Medium', 'Low'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin" /></div>
            ) : (
                <div className="space-y-3">
                    {filtered.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground bg-card rounded-2xl border border-border">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No repair requests found</p>
                        </div>
                    ) : [...filtered].sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)).map(req => (
                        <div
                            key={req.id}
                            onClick={() => { setSelected(req); setNotes(''); setAssignedTo(req.assigned_to_name || ''); }}
                            className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${req.priority === 'Critical' ? 'bg-red-500' : req.priority === 'High' ? 'bg-orange-400' : req.priority === 'Medium' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-foreground text-sm">{req.asset_name}</h3>
                                        <StatusBadge status={req.priority} />
                                        <StatusBadge status={req.status} />
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>
                                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                                        {req.school_name && <span>{req.school_name}</span>}
                                        {req.reported_by_name && <span>by {req.reported_by_name}</span>}
                                        {req.created_date && <span>{format(new Date(req.created_date), 'MMM d, yyyy')}</span>}
                                        {req.assigned_to_name && <span className="text-teal">→ {req.assigned_to_name}</span>}
                                    </div>
                                </div>
                                {req.photo_url && (
                                    <img src={req.photo_url} alt="damage" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-border" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Repair Request Details</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <StatusBadge status={selected.status} size="md" />
                                <StatusBadge status={selected.priority} size="md" />
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><p className="text-muted-foreground text-xs">Asset</p><p className="font-medium">{selected.asset_name}</p></div>
                                <div><p className="text-muted-foreground text-xs">Code</p><p className="font-medium">{selected.asset_code || '—'}</p></div>
                                <div><p className="text-muted-foreground text-xs">School</p><p className="font-medium">{selected.school_name || '—'}</p></div>
                                <div><p className="text-muted-foreground text-xs">Reported By</p><p className="font-medium">{selected.reported_by_name || selected.reported_by_email || '—'}</p></div>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs mb-1">Damage Description</p>
                                <p className="text-sm bg-muted p-3 rounded-xl">{selected.description}</p>
                            </div>
                            {selected.photo_url && (
                                <img src={selected.photo_url} alt="damage" className="w-full rounded-xl object-cover max-h-48" />
                            )}
                            {selected.principal_notes && (
                                <div>
                                    <p className="text-muted-foreground text-xs mb-1">Principal Notes</p>
                                    <p className="text-sm bg-muted p-3 rounded-xl">{selected.principal_notes}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="space-y-3 pt-2 border-t border-border">
                                {(role === 'principal' || role === 'admin') && selected.status === 'Pending' && (
                                    <div className="space-y-2">
                                        <Label className="text-xs">Assign To / Notes</Label>
                                        <Input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="Maintenance staff name" />
                                        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes..." rows={2} />
                                        <div className="flex gap-2">
                                            <Button onClick={handleApprove} disabled={saving} className="flex-1 bg-teal hover:bg-teal/90 text-white text-sm">
                                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                            </Button>
                                            <Button onClick={() => updateStatus(selected.id, 'Rejected')} variant="outline" disabled={saving} className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-sm">
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {(role === 'principal' || role === 'admin') && selected.status === 'Approved' && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Assign To Maintenance</Label>
                                                <Input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="Name or email" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Target Start Date</Label>
                                                <Input type="date" value={scheduledStartDate} onChange={e => setScheduledStartDate(e.target.value)} />
                                            </div>
                                        </div>
                                        
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-muted-foreground">SLA Duration ({selected.priority})</span>
                                                <span className="font-medium text-foreground">{SLA_HOURS[selected.priority]} Hours</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Deadline to Complete</span>
                                                <span className="font-semibold text-teal">
                                                    {format(calculateDeadline(scheduledStartDate, selected.priority), 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                        </div>

                                        <Button onClick={handleAssign} disabled={saving || !assignedTo} className="w-full bg-teal hover:bg-teal/90 text-white text-sm">
                                            <Wrench className="w-4 h-4 mr-1" /> Assign & Start Repair
                                        </Button>
                                    </div>
                                )}
                                {(role === 'teacher' || role === 'admin') && selected.status === 'In Progress' && (
                                    <div className="space-y-2">
                                        <Label className="text-xs">Verify Repair Completion</Label>
                                        <p className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-2">
                                            Maintenance has completed this repair. Please inspect the asset and indicate whether the repair is satisfactory.
                                        </p>
                                        <Textarea value={verificationFeedback} onChange={e => setVerificationFeedback(e.target.value)} placeholder="If rejecting: provide feedback on what needs rework (optional for approval)" rows={2} />
                                        <div className="flex gap-2">
                                            <Button onClick={handleVerifyRepair} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
                                                <CheckCircle className="w-4 h-4 mr-1" /> Approve & Close
                                            </Button>
                                            <Button onClick={handleRejectRepair} disabled={saving || !verificationFeedback.trim()} variant="outline" className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50 text-sm">
                                                ↩️ Reject & Rework
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {(role === 'principal' || role === 'admin' || role === 'supervisor') && !['Escalated', 'Completed', 'Rejected'].includes(selected.status) && (
                                    <div className="space-y-2">
                                        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Escalation reason..." rows={2} />
                                        <Button onClick={handleEscalate} variant="outline" disabled={saving} className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 text-sm">
                                            <ArrowUpCircle className="w-4 h-4 mr-1" /> Escalate
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
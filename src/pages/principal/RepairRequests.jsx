import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { AlertTriangle, Search, CheckCircle, ArrowUpCircle, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { sileo } from 'sileo';
import { format } from 'date-fns';
import { calculateDeadline, SLA_HOURS } from '@/lib/slaUtils';

const STATUSES = ['Pending', 'Approved', 'In Progress', 'Completed', 'Rejected', 'Escalated'];

export default function PrincipalRepairRequests() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selected, setSelected] = useState(null);
    const [notes, setNotes] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [scheduledStartDate, setScheduledStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadRequests(); }, []);

    async function loadRequests() {
        const data = await base44.entities.RepairRequest.list('-created_date', 200);
        // Principals usually see requests for their own school
        // For now, we list all because mock data doesn't have strict school association for the user
        setRequests(data);
        setLoading(false);
    }

    const filtered = requests.filter(r => {
        const matchSearch = !search || r.asset_name?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        return matchSearch && matchStatus;
    });

    async function updateStatus(id, status, extraData = {}) {
        setSaving(true);
        await base44.entities.RepairRequest.update(id, { status, ...extraData });
        sileo.success({
            title: 'Status Updated',
            description: `The repair request has been successfully moved to: ${status}.`
        });
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
            start_date: scheduledStartDate,
            sla_deadline: slaDeadline.toISOString(),
            reschedule_count: 0
        });
    }

    async function handleEscalate() {
        await updateStatus(selected.id, 'Escalated', { escalated_reason: notes });
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Repair Approvals</h1>
                <p className="text-muted-foreground text-sm mt-1">Review and manage repair requests from teachers</p>
            </div>

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
                    ) : filtered.map(req => (
                        <div
                            key={req.id}
                            onClick={() => { setSelected(req); setNotes(''); setAssignedTo(req.assigned_to_name || ''); }}
                            className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${req.priority === 'Critical' ? 'bg-red-500' : req.priority === 'High' ? 'bg-orange-400' : 'bg-amber-400'}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-foreground text-sm">{req.asset_name}</h3>
                                        <StatusBadge status={req.priority} />
                                        <StatusBadge status={req.status} />
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>
                                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                                        <span>{req.school_name}</span>
                                        <span>by {req.reported_by_name}</span>
                                        <span>{req.created_date ? format(new Date(req.created_date), 'MMM d, yyyy') : ''}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Review Repair Request</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <StatusBadge status={selected.status} />
                                <StatusBadge status={selected.priority} />
                            </div>
                            <div className="bg-muted p-3 rounded-xl">
                                <p className="text-xs text-muted-foreground mb-1">Teacher's Note:</p>
                                <p className="text-sm">{selected.description}</p>
                            </div>
                            
                            <div className="space-y-3 pt-2 border-t border-border">
                                {selected.status === 'Pending' && (
                                    <div className="space-y-2">
                                        <Label className="text-xs">Instruction/Note for Maintenance</Label>
                                        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add internal notes..." rows={2} />
                                        <div className="flex gap-2">
                                            <Button onClick={handleApprove} disabled={saving} className="flex-1 bg-teal hover:bg-teal/90 text-white">
                                                Approve
                                            </Button>
                                            <Button onClick={() => updateStatus(selected.id, 'Rejected')} variant="outline" className="flex-1 text-red-600">
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {selected.status === 'Approved' && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Assign Maintenance Staff</Label>
                                                <Input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="Name" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Start Date</Label>
                                                <Input type="date" value={scheduledStartDate} onChange={e => setScheduledStartDate(e.target.value)} />
                                            </div>
                                        </div>
                                        <Button onClick={handleAssign} disabled={saving || !assignedTo} className="w-full bg-teal hover:bg-teal/90 text-white">
                                            <Wrench className="w-4 h-4 mr-1" /> Assign Staff
                                        </Button>
                                    </div>
                                )}
                                {!['Escalated', 'Completed'].includes(selected.status) && (
                                    <div className="pt-2">
                                        <Button onClick={handleEscalate} variant="ghost" className="w-full text-purple-600 text-xs">
                                            <ArrowUpCircle className="w-3 h-3 mr-1" /> Escalate to Supervisor
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

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { AlertTriangle, Search, CheckCircle, ArrowUpCircle, Wrench, ChevronRight, School, UserCircle, Send, X, Check, Image as ImageIcon, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { sileo } from 'sileo';
import { format } from 'date-fns';
import { calculateDeadline } from '@/lib/slaUtils';

const STATUSES = ['Pending', 'Approved', 'In Progress', 'Completed', 'Rejected', 'Escalated'];

export default function PrincipalRepairRequests() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selected, setSelected] = useState(null);
    const [notes, setNotes] = useState('');
    const [escalationReason, setEscalationReason] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [maintenanceStaff, setMaintenanceStaff] = useState([]);
    const [scheduledStartDate, setScheduledStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [saving, setSaving] = useState(false);
    const [escalationAttempted, setEscalationAttempted] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'repair_requests'),
            (snapshot) => {
                const requestsList = snapshot.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => {
                        const dateA = a.created_at?.toDate?.() ?? new Date(0);
                        const dateB = b.created_at?.toDate?.() ?? new Date(0);
                        return dateB - dateA;
                    });
                setRequests(requestsList);
                setLoading(false);
            },
            (error) => {
                console.error('RepairRequests fetch error:', error);
                setLoading(false);
            }
        );

        const staffQuery = query(collection(db, 'users'), where('role', '==', 'maintenance'));
        const unsubscribeStaff = onSnapshot(staffQuery, (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setMaintenanceStaff(list);
        });

        return () => {
            unsubscribe();
            unsubscribeStaff();
        };
    }, []);

    const filtered = requests.filter(r => {
        const matchSearch = !search || r.asset_name?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        return matchSearch && matchStatus;
    });

    async function updateRequest(id, status, extraData = {}) {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'repair_requests', id), { 
                status, 
                ...extraData,
                updated_at: serverTimestamp() 
            });
            
            sileo.success({
                title: 'Status Updated',
                description: `Successfully updated request to: ${status}.`
            });
            setSelected(null);
        } catch (error) {
            sileo.error({ title: 'Update Failed', description: 'Could not update request status.' });
        } finally {
            setSaving(false);
        }
    }

    async function handleApprove() {
        if (!assignedTo) {
            sileo.error({ title: 'Staff Required', description: 'Please select a maintenance staff to handle the repair.' });
            return;
        }

        const slaDeadline = calculateDeadline(scheduledStartDate, selected.priority);
        
        setSaving(true);
        try {
            // 1. Update Repair Request
            await updateDoc(doc(db, 'repair_requests', selected.id), {
                status: 'In Progress',
                principal_notes: notes,
                assigned_to_name: assignedTo,
                approved_by_name: currentUser?.full_name,
                approved_at: serverTimestamp(),
                scheduled_start_date: scheduledStartDate,
                sla_deadline: slaDeadline.toISOString(),
                updated_at: serverTimestamp()
            });
            
            // 2. Create Maintenance Task
            await addDoc(collection(db, 'maintenance_tasks'), {
                repair_request_id: selected.id,
                request_number: selected.request_number || `RR-${Date.now().toString().slice(-6)}`,
                asset_name: selected.asset_name,
                description: selected.description || '',
                photo_url: selected.photo_url || '',
                reported_by_name: selected.reported_by_name || '',
                asset_code: selected.asset_code || '',
                school_name: selected.school_name || currentUser?.school_name || '',
                assigned_to_name: assignedTo,
                priority: selected.priority,
                status: 'Assigned',
                scheduled_start_date: scheduledStartDate,
                sla_deadline: slaDeadline.toISOString(),
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            });

            sileo.success({
                title: 'Request Approved',
                description: `Assigned to ${assignedTo} and scheduled for ${scheduledStartDate}.`
            });
            setSelected(null);
        } catch (error) {
            sileo.error({ title: 'Approval Failed', description: 'Could not process the approval.' });
        } finally {
            setSaving(false);
        }
    }

    async function handleReject() {
        if (!notes.trim()) {
            sileo.error({ title: 'Reason Required', description: 'Please provide a reason for rejection in the notes field.' });
            return;
        }
        await updateRequest(selected.id, 'Rejected', {
            principal_notes: notes,
            rejected_by_name: currentUser?.full_name,
            rejected_at: serverTimestamp()
        });
    }

    async function handleEscalate() {
        setEscalationAttempted(true);
        if (!escalationReason.trim()) {
            sileo.warning({
                title: 'Escalation Reason Required',
                description: 'Please provide a reason before escalating this request to the supervisor.'
            });
            return;
        }
        await updateRequest(selected.id, 'Escalated', { 
            escalated_reason: escalationReason,
            escalated_by_name: currentUser?.full_name,
            escalated_at: serverTimestamp()
        });
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="px-1">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Repair Approvals</h1>
                <p className="text-muted-foreground text-sm mt-1">Review and manage repair requests from teachers.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-teal transition-colors" />
                    <Input placeholder="Search requests..." className="pl-9 bg-card border-border" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-48 bg-card border-border"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-teal/20 border-t-teal rounded-full animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {filtered.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground bg-card rounded-2xl border border-dashed border-border/60">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No repair requests found</p>
                        </div>
                    ) : (
                        filtered.map(req => (
                            <div
                                key={req.id}
                                onClick={() => { 
                                    setSelected(req); 
                                    setNotes(''); 
                                    setEscalationReason('');
                                    setEscalationAttempted(false);
                                    setAssignedTo(req.assigned_to_name || ''); 
                                }}
                                className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg hover:border-teal/30 transition-all cursor-pointer group animate-in slide-in-from-bottom-2 duration-300"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-1.5 self-stretch rounded-full flex-shrink-0 ${req.priority === 'Critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : req.priority === 'High' ? 'bg-orange-400' : 'bg-teal'}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                            <h3 className="font-bold text-foreground text-sm tracking-tight">{req.asset_name}</h3>
                                            <StatusBadge status={req.priority} />
                                            <StatusBadge status={req.status} />
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-1 italic">{req.description}</p>
                                        <div className="flex flex-wrap gap-4 mt-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><School className="w-3 h-3" /> {req.school_name || 'Generic School'}</span>
                                            <span className="flex items-center gap-1"><UserCircle className="w-3 h-3" /> by {req.reported_by_name}</span>
                                            <span>{req.created_at ? format(req.created_at.toDate(), 'MMM d, yyyy') : ''}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal transition-colors" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="sm:max-w-lg rounded-2xl border-none">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight">Repair Request Details</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-6 pt-2 overflow-y-auto max-h-[85vh] pr-1 custom-scrollbar">
                            <div className="flex gap-2">
                                <StatusBadge status={selected.status} />
                                <StatusBadge status={selected.priority} />
                            </div>

                            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm pb-4 border-b border-slate-100">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset</p>
                                    <p className="font-bold text-slate-700">{selected.asset_name}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Code</p>
                                    <p className="font-bold text-slate-700">{selected.asset_code || 'N/A'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">School</p>
                                    <p className="font-bold text-orange-600">{selected.school_name || 'Generic School'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reported By</p>
                                    <p className="font-bold text-slate-700">{selected.reported_by_name}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Damage Description</p>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{selected.description}"</p>
                                </div>
                            </div>

                            {selected.photo_url && (
                                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                    <img src={selected.photo_url} alt="Evidence" className="w-full h-auto object-cover max-h-[250px]" />
                                </div>
                            )}
                            
                            <div className="space-y-4 pt-4 border-t border-border">
                                {['Pending', 'Approved'].includes(selected.status) && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wide text-slate-700">Assign To Maintenance</Label>
                                            <Select value={assignedTo} onValueChange={setAssignedTo}>
                                                <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200">
                                                    <SelectValue placeholder="Select maintenance staff..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {maintenanceStaff.map(staff => (
                                                        <SelectItem key={staff.email} value={staff.full_name}>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-sm">{staff.full_name}</span>
                                                                <span className="text-[10px] text-muted-foreground uppercase">{staff.specialization || 'General Staff'}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Textarea 
                                                value={notes} 
                                                onChange={e => setNotes(e.target.value)} 
                                                placeholder="Add notes..." 
                                                rows={3} 
                                                className="rounded-xl bg-white border-slate-200" 
                                            />
                                        </div>

                                        <div className="flex gap-3">
                                            <Button onClick={handleApprove} disabled={saving} className="flex-1 bg-[#14b8a6] hover:bg-[#0d9488] text-white font-bold h-11 rounded-xl gap-2">
                                                <Check className="w-4 h-4" /> Approve
                                            </Button>
                                            <Button onClick={handleReject} variant="outline" disabled={saving} className="flex-1 text-red-500 border-red-100 hover:bg-red-50 font-bold h-11 rounded-xl">
                                                Reject
                                            </Button>
                                        </div>

                                        <div className="pt-4 space-y-3">
                                            <div className="space-y-1">
                                                <Textarea 
                                                    value={escalationReason} 
                                                    onChange={e => { setEscalationReason(e.target.value); setEscalationAttempted(false); }} 
                                                    placeholder="Escalation reason... (required)" 
                                                    rows={2} 
                                                    className={`rounded-xl bg-white transition-all ${
                                                        escalationAttempted && !escalationReason.trim()
                                                            ? 'border-amber-400 ring-2 ring-amber-300/50 bg-amber-50'
                                                            : 'border-slate-200'
                                                    }`}
                                                />
                                                {escalationAttempted && !escalationReason.trim() && (
                                                    <p className="text-xs font-bold text-amber-600 flex items-center gap-1">
                                                        ⚠ A reason is required to escalate this request.
                                                    </p>
                                                )}
                                            </div>
                                            <Button onClick={handleEscalate} variant="outline" disabled={saving} className="w-full text-[#9333ea] border-[#f3e8ff] bg-[#faf5ff] hover:bg-[#f3e8ff] font-bold h-11 rounded-xl gap-2 uppercase text-[10px] tracking-widest">
                                                <ArrowUpCircle className="w-4 h-4" /> Escalate
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {selected.status === 'In Progress' && (
                                    <div className="p-4 bg-teal/5 border border-teal/10 rounded-xl">
                                        <p className="text-sm font-bold text-teal text-center">This request is already assigned and in progress.</p>
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

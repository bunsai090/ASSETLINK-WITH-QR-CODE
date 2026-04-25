import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { AlertTriangle, Search, CheckCircle, ArrowUpCircle, Wrench, ChevronRight, School, UserCircle, Send, X, Check, Image as ImageIcon, Hash, Clock, ShieldCheck, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { sileo } from 'sileo';
import { format } from 'date-fns';
import { calculateDeadline } from '@/lib/slaUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
        const fetchRequests = async () => {
            const { data, error } = await supabase
                .from('repair_requests')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (data) setRequests(data);
            setLoading(false);
        };

        const fetchStaff = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'maintenance');
            
            if (data) setMaintenanceStaff(data);
        };

        fetchRequests();
        fetchStaff();

        const channelRequests = supabase
            .channel('repair_requests_principal')
            .on('postgres_changes', { event: '*', table: 'repair_requests' }, () => {
                fetchRequests();
            })
            .subscribe();

        const channelStaff = supabase
            .channel('staff_sync')
            .on('postgres_changes', { event: '*', table: 'profiles' }, () => {
                fetchStaff();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channelRequests);
            supabase.removeChannel(channelStaff);
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
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('repair_requests')
                .update({ 
                    status, 
                    ...extraData,
                    updated_at: now
                })
                .eq('id', id);

            if (error) throw error;
            
            sileo.success({
                title: 'Status Updated',
                description: `Successfully updated request to: ${status}.`
            });
            setSelected(null);
        } catch (error) {
            console.error('Update error:', error);
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
            const now = new Date().toISOString();
            const { error: rrError } = await supabase
                .from('repair_requests')
                .update({
                    status: 'In Progress',
                    principal_notes: notes,
                    assigned_to_name: assignedTo,
                    approved_by_name: currentUser?.full_name,
                    approved_at: now,
                    scheduled_start_date: scheduledStartDate,
                    sla_deadline: slaDeadline.toISOString(),
                    updated_at: now
                })
                .eq('id', selected.id);

            if (rrError) throw rrError;
            
            const { error: mtError } = await supabase
                .from('maintenance_tasks')
                .insert([{
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
                    created_at: now,
                    updated_at: now
                }]);

            if (mtError) throw mtError;

            sileo.success({
                title: 'Request Approved',
                description: `Assigned to ${assignedTo} and scheduled for ${scheduledStartDate}.`
            });
            setSelected(null);
        } catch (error) {
            console.error('Approval error:', error);
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
        const now = new Date().toISOString();
        await updateRequest(selected.id, 'Rejected', {
            principal_notes: notes,
            rejected_by_name: currentUser?.full_name,
            rejected_at: now
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
        const now = new Date().toISOString();
        await updateRequest(selected.id, 'Escalated', { 
            escalated_reason: escalationReason,
            escalated_by_name: currentUser?.full_name,
            escalated_at: now
        });
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Repair Approvals</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Administrative oversight of institutional repairs.
                    </p>
                </div>
            </div>

            {/* Tactical Status Toggles */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Filter registry..." 
                        className="pl-9 h-9 bg-white border-border text-sm w-full focus-visible:ring-1 focus-visible:ring-primary/50" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9 bg-white text-sm">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Table layout */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-sm text-muted-foreground">
                        No pending maneuvers detected.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-muted/30">
                            <span className="label-mono">Asset Request</span>
                            <span className="label-mono hidden sm:block">Priority</span>
                            <span className="label-mono">Status</span>
                            <span className="label-mono hidden sm:block">Date</span>
                        </div>
                        {filtered.map(req => (
                            <div key={req.id} onClick={() => { 
                                setSelected(req); 
                                setNotes(''); 
                                setEscalationReason('');
                                setEscalationAttempted(false);
                                setAssignedTo(req.assigned_to_name || ''); 
                            }} className="data-row grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-foreground truncate">{req.asset_name}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{req.description}</p>
                                </div>
                                <div className="hidden sm:flex items-center">
                                    <StatusBadge status={req.priority || 'Medium'} size="sm" />
                                </div>
                                <div className="flex items-center">
                                    <StatusBadge status={req.status} size="sm" />
                                </div>
                                <div className="hidden sm:flex items-center">
                                    <span className="text-xs text-muted-foreground">
                                        {req.created_at ? format(new Date(req.created_at), 'MMM d, yyyy') : ''}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-card border border-border shadow-lg rounded-xl">
                    {selected && (
                        <div className="flex flex-col max-h-[80vh]">
                            <div className="p-6 border-b border-border bg-muted/20">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex gap-2">
                                        <StatusBadge status={selected.status} size="sm" />
                                        <StatusBadge status={selected.priority} size="sm" />
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground">#{selected.asset_code || '---'}</span>
                                </div>
                                <h2 className="text-xl font-semibold tracking-tight text-foreground">{selected.asset_name}</h2>
                            </div>

                            <div className="p-6 space-y-6 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Reported By</Label>
                                        <p className="text-sm font-medium text-foreground">{selected.reported_by_name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">School</Label>
                                        <p className="text-sm font-medium text-foreground">{selected.school_name || 'Central Hub'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Date</Label>
                                        <p className="text-sm font-medium text-foreground">
                                            {selected.created_at ? format(new Date(selected.created_at), 'MMM d, yyyy') : 'Recently'}
                                        </p>
                                    </div>
                                    {selected.sla_deadline && (
                                        <div>
                                            <Label className="text-xs text-red-500">Deadline</Label>
                                            <p className="text-sm font-medium text-red-500">
                                                {format(new Date(selected.sla_deadline), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-foreground">Incident Description</Label>
                                    <div className="bg-white p-4 rounded-lg border border-border text-sm">
                                        {selected.description}
                                    </div>
                                </div>

                                {selected.photo_url && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-foreground">Evidence Photo</Label>
                                        <div className="rounded-lg overflow-hidden border border-border">
                                            <img src={selected.photo_url} alt="Damage evidence" className="w-full h-auto object-cover max-h-64" />
                                        </div>
                                    </div>
                                )}
                                
                                {['Pending', 'Approved'].includes(selected.status) && (
                                    <div className="space-y-4 pt-4 border-t border-border">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-medium text-foreground">Assign Staff</Label>
                                                <Select value={assignedTo} onValueChange={setAssignedTo}>
                                                    <SelectTrigger className="h-9 bg-white text-sm">
                                                        <SelectValue placeholder="Select maintenance..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {maintenanceStaff.map(staff => (
                                                            <SelectItem key={staff.email} value={staff.full_name}>
                                                                {staff.full_name} ({staff.specialization || 'General'})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs font-medium text-foreground">Principal Notes</Label>
                                                <Textarea 
                                                    value={notes} 
                                                    onChange={e => setNotes(e.target.value)} 
                                                    placeholder="Optional directives..." 
                                                    className="min-h-[36px] h-9 bg-white text-sm py-2" 
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button 
                                                onClick={handleReject} 
                                                variant="outline" 
                                                disabled={saving} 
                                                className="flex-1 h-9 text-sm text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-200"
                                            >
                                                Reject
                                            </Button>
                                            <Button 
                                                onClick={handleApprove} 
                                                disabled={saving} 
                                                className="flex-1 h-9 text-sm bg-[hsl(172,75%,17%)] hover:bg-[hsl(172,75%,22%)] text-white"
                                            >
                                                {saving ? 'Processing...' : 'Approve Repair'}
                                            </Button>
                                        </div>

                                        <div className="pt-4 space-y-2 border-t border-border">
                                            <Label className="text-xs font-medium text-amber-600">Escalate Issue</Label>
                                            <div className="flex gap-2">
                                                <Input 
                                                    value={escalationReason} 
                                                    onChange={e => { setEscalationReason(e.target.value); setEscalationAttempted(false); }} 
                                                    placeholder="Reason for escalation..." 
                                                    className={`h-9 text-sm flex-1 ${escalationAttempted && !escalationReason.trim() ? 'border-red-400' : ''}`}
                                                />
                                                <Button 
                                                    onClick={handleEscalate} 
                                                    variant="outline" 
                                                    disabled={saving} 
                                                    className="h-9 text-sm text-amber-600 border-amber-200 hover:bg-amber-50"
                                                >
                                                    Escalate
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selected.status === 'In Progress' && (
                                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-center">
                                        <p className="text-sm font-medium text-primary flex items-center justify-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> Repair is currently assigned and in progress
                                        </p>
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

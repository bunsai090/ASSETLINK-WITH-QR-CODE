import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, getDocs, where, addDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { AlertTriangle, Search, Wrench, ChevronDown, CheckCircle, ArrowUpCircle, User, MessageSquare, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { sileo } from 'sileo';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
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

    useEffect(() => {
        const q = query(collection(db, 'repair_requests'), orderBy('created_at', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filtered = requests.filter(r => {
        const matchSearch = !search || r.asset_name?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        const matchPriority = filterPriority === 'all' || r.priority === filterPriority;
        return matchSearch && matchStatus && matchPriority;
    });

    async function updateStatus(id, status, extraData = {}) {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'repair_requests', id), { 
                status, 
                ...extraData,
                updated_at: serverTimestamp() 
            });
            sileo.success({ title: 'Status Updated', description: `Request marked as ${status}.` });
        } catch (error) {
            sileo.error({ title: 'Sync Failed', description: 'Could not update request status.' });
        } finally {
            setSaving(false);
            setSelected(null);
        }
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
        await addDoc(collection(db, 'maintenance_tasks'), {
            repair_request_id: selected.id,
            request_number: selected.request_number,
            asset_name: selected.asset_name,
            school_name: selected.school_name || 'N/A',
            assigned_to_email: assignedTo,
            assigned_to_name: assignedTo,
            priority: selected.priority,
            status: 'Assigned',
            scheduled_start_date: scheduledStartDate,
            start_date: scheduledStartDate,
            sla_deadline: slaDeadline.toISOString(),
            reschedule_count: 0,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
        });
    }

    const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };

    return (
        <div className="space-y-10 animate-fade-in pb-20 relative z-10 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1.5 font-sans">
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                        Service <span className="text-primary italic">Pipelines</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        Strategic oversight of {requests.length} active restoration workflows across the district.
                    </p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-2 rounded-2xl border border-border shadow-sm">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input 
                        placeholder="Search pipelines by asset or description..." 
                        className="pl-12 h-12 bg-transparent border-none ring-0 focus-visible:ring-0 text-sm font-medium placeholder:text-muted-foreground/50" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full md:w-44 h-12 bg-slate-50 border-none rounded-xl font-bold text-[10px] uppercase tracking-widest px-6 transition-colors hover:bg-slate-100">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border">
                            <SelectItem value="all">Every State</SelectItem>
                            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                        <SelectTrigger className="w-full md:w-40 h-12 bg-slate-50 border-none rounded-xl font-bold text-[10px] uppercase tracking-widest px-6 transition-colors hover:bg-slate-100">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border">
                            <SelectItem value="all">All Priorities</SelectItem>
                            {['Critical', 'High', 'Medium', 'Low'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-40">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-1">
                    {filtered.length === 0 ? (
                        <div className="text-center py-40 bg-slate-50 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
                            <AlertTriangle className="w-16 h-16 mb-4 text-muted-foreground opacity-20" />
                            <h3 className="text-xl font-serif font-bold text-foreground">Pipeline Silent</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-1 text-muted-foreground opacity-60">No active logistics encountered</p>
                        </div>
                    ) : [...filtered].sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)).map((req, idx) => (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            key={req.id}
                            onClick={() => { setSelected(req); setNotes(''); setAssignedTo(req.assigned_to_name || ''); }}
                            className="bg-white rounded-xl border border-transparent hover:border-border p-5 flex items-center gap-6 cursor-pointer group transition-all duration-300 hover:bg-slate-50"
                        >
                            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-white shadow-sm transition-colors">
                                <Wrench className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                    <h3 className="font-serif font-black text-lg text-foreground tracking-tight group-hover:text-primary transition-colors">{req.asset_name}</h3>
                                    <StatusBadge status={req.priority} size="sm" />
                                    <StatusBadge status={req.status} size="sm" />
                                </div>
                                <p className="text-xs text-muted-foreground font-medium line-clamp-1 opacity-60 italic leading-relaxed mb-3">"{req.description}"</p>
                                <div className="flex flex-wrap items-center gap-6">
                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                                        <Shield className="w-3 h-3" /> {req.school_name || 'Campus'}
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                                        <User className="w-3 h-3" /> {req.reported_by_name?.split(' ')[0] || 'System'}
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                                        <Clock className="w-3 h-3" /> {req.created_at ? format(req.created_at.toDate(), 'MMM d') : ''}
                                    </div>
                                    {req.assigned_to_name && (
                                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary italic">
                                            <Wrench className="w-3 h-3" /> Assigned: {req.assigned_to_name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {req.photo_url && (
                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-border shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500 shadow-sm">
                                    <img src={req.photo_url} alt="damage" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronDown className="w-5 h-5 text-muted-foreground -rotate-90" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="sm:max-w-2xl rounded-2xl border border-border p-0 overflow-hidden bg-white shadow-2xl">
                    {selected && (
                        <div className="flex flex-col">
                            {/* Modal Header/Hero */}
                            <div className="p-8 pb-6 border-b border-border bg-slate-50/50">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex gap-2">
                                        <StatusBadge status={selected.status} size="sm" />
                                        <StatusBadge status={selected.priority} size="sm" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">Logistics ID: {selected.request_number || 'SYNC-PENDING'}</span>
                                </div>
                                <h2 className="text-3xl font-serif font-black text-foreground tracking-tight leading-none mb-2">{selected.asset_name}</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{selected.asset_code || 'UNCODED RESOURCE'}</p>
                            </div>

                            <div className="p-8 space-y-8 custom-scrollbar max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Origin Campus</p>
                                        <p className="font-serif font-bold text-lg text-foreground">{selected.school_name || 'District Center'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Reported By</p>
                                        <p className="font-serif font-bold text-lg text-foreground">{selected.reported_by_name || 'System Auto'}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">Incident Narrative</p>
                                    <div className="bg-slate-50 p-6 rounded-xl border border-border italic text-sm font-medium leading-relaxed text-foreground/80">
                                        "{selected.description}"
                                    </div>
                                </div>

                                {selected.photo_url && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">Visual Proof</p>
                                        <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                                            <img src={selected.photo_url} alt="damage" className="w-full h-auto object-cover max-h-80" />
                                        </div>
                                    </div>
                                )}

                                {/* Admin/Principal Actions */}
                                {(role === 'principal' || role === 'admin') && (selected.status === 'Pending' || selected.status === 'Approved') && (
                                    <div className="space-y-6 pt-8 border-t border-border">
                                        <div className="space-y-4">
                                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Assign Logistics Command</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Maintenance Staff</Label>
                                                    <Input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="Email address" className="h-12 rounded-xl bg-slate-50 border-border font-bold placeholder:font-medium text-sm" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Scheduled Date</Label>
                                                    <Input type="date" value={scheduledStartDate} onChange={e => setScheduledStartDate(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-border font-bold text-sm" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Administrative Notes</Label>
                                                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Specific operational instructions..." rows={3} className="rounded-xl bg-slate-50 border-border font-bold p-4 text-sm" />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-4">
                                            <Button onClick={handleAssign} disabled={saving || !assignedTo} className="flex-1 h-14 bg-primary hover:bg-primary/95 text-primary-foreground font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/10 text-[10px]">
                                                <Wrench className="w-4 h-4 mr-2" /> Assign Personnel
                                            </Button>
                                            {selected.status === 'Pending' && (
                                                <Button onClick={() => updateStatus(selected.id, 'Rejected', { principal_notes: notes })} variant="outline" disabled={saving} className="flex-1 h-14 border-border text-rose-600 hover:bg-rose-50 font-black uppercase tracking-widest rounded-xl text-[10px] transition-all">
                                                    Reject Case
                                                </Button>
                                            )}
                                        </div>
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
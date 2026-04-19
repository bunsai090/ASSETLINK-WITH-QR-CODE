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

            {/* Filters Bar Area */}
            <div className="flex flex-col md:flex-row gap-6 bg-white p-4 rounded-[2rem] border border-border shadow-sm group hover:shadow-xl transition-all duration-500">
                <div className="relative flex-1 group/search">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-all group-focus-within/search:text-primary group-focus-within/search:scale-110" />
                    <Input 
                        placeholder="Search tactical pipelines by asset or telemetry..." 
                        className="pl-16 h-14 bg-slate-50/50 border-none ring-0 focus-visible:ring-0 text-sm font-bold placeholder:text-muted-foreground/30 rounded-2xl group-hover/search:bg-slate-50 transition-all font-sans" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                </div>
                <div className="flex gap-3">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full md:w-52 h-14 bg-white border-border rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] px-8 transition-all hover:bg-slate-50 hover:shadow-md">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border shadow-2xl">
                            <SelectItem value="all">Total Registry</SelectItem>
                            {STATUSES.map(s => <SelectItem key={s} value={s} className="font-bold text-[11px] uppercase tracking-wider">{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                        <SelectTrigger className="w-full md:w-48 h-14 bg-white border-border rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] px-8 transition-all hover:bg-slate-50 hover:shadow-md">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border shadow-2xl">
                            <SelectItem value="all">Every Priority</SelectItem>
                            {['Critical', 'High', 'Medium', 'Low'].map(p => <SelectItem key={p} value={p} className="font-bold text-[11px] uppercase tracking-wider">{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-40">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filtered.length === 0 ? (
                        <div className="text-center py-40 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-border flex flex-col items-center justify-center">
                            <AlertTriangle className="w-20 h-20 mb-6 text-muted-foreground opacity-20" />
                            <h3 className="text-2xl font-serif font-black text-foreground">Pipeline <span className="text-primary italic">Static</span></h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-2 text-muted-foreground opacity-40 italic">Zero active logistics encountered</p>
                        </div>
                    ) : [...filtered].sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)).map((req, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 + (idx * 0.05) }}
                            key={req.id}
                            onClick={() => { setSelected(req); setNotes(''); setAssignedTo(req.assigned_to_name || ''); }}
                            className="bg-white rounded-[2.5rem] border border-border p-8 flex items-center gap-10 cursor-pointer group transition-all duration-500 hover:bg-white hover:shadow-2xl hover:shadow-primary/5 active:scale-[0.99] border-transparent hover:border-primary/20 relative"
                        >
                            <div className="w-20 h-20 rounded-[1.8rem] bg-slate-50 border border-border flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm group-hover:rotate-12">
                                <Wrench className="w-8 h-8 group-hover:rotate-[-45deg] transition-transform duration-700" />
                            </div>
                            <div className="flex-1 min-w-0 font-sans">
                                <div className="flex flex-wrap items-center gap-4 mb-3">
                                    <h3 className="font-serif font-black text-2xl text-foreground tracking-tight group-hover:text-primary transition-all duration-300">{req.asset_name}</h3>
                                    <div className="flex gap-2.5">
                                        <StatusBadge status={req.priority} size="sm" />
                                        <StatusBadge status={req.status} size="sm" />
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground/60 font-medium line-clamp-1 italic leading-relaxed mb-6 group-hover:text-foreground transition-colors">"{req.description}"</p>
                                <div className="flex flex-wrap items-center gap-8 border-t border-slate-50 pt-6">
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
                                        <Shield className="w-4 h-4" /> {req.school_name || 'Operational Zone'}
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
                                        <User className="w-4 h-4" /> {req.reported_by_name?.split(' ')[0] || 'Registry'}
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
                                        <Clock className="w-4 h-4" /> {req.created_at ? format(req.created_at.toDate(), 'MMM d, yyyy') : 'Recent'}
                                    </div>
                                    {req.assigned_to_name && (
                                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">
                                            <Wrench className="w-3.5 h-3.5" /> Assigned: {req.assigned_to_name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {req.photo_url ? (
                                <div className="w-32 h-32 rounded-[2rem] overflow-hidden border border-border shrink-0 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 shadow-xl group-hover:rotate-1">
                                    <img src={req.photo_url} alt="damage" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-32 h-32 rounded-[2rem] bg-slate-50/50 border border-dashed border-border flex items-center justify-center shrink-0 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <MessageSquare className="w-10 h-10" />
                                </div>
                            )}
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                    <ChevronDown className="w-6 h-6 -rotate-90" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Detailed Tactical Briefing Modal */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="sm:max-w-3xl rounded-[2.5rem] border border-border p-0 overflow-hidden bg-white shadow-3xl font-sans">
                    {selected && (
                        <div className="flex flex-col">
                            {/* Modal Header/Hero Area */}
                            <div className="p-12 pb-10 border-b border-border bg-slate-50/50 relative overflow-hidden group/modal">
                                <div className="flex items-center justify-between mb-10 relative z-10">
                                    <div className="flex gap-3">
                                        <StatusBadge status={selected.status} size="sm" />
                                        <StatusBadge status={selected.priority} size="sm" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 italic">Tactical Briefing: {selected.request_number || 'REGISTRY-PENDING'}</span>
                                </div>
                                <h2 className="text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1] mb-3 relative z-10">{selected.asset_name}</h2>
                                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary relative z-10 italic">{selected.asset_code || 'UNSCANNED RESOURCE'}</p>
                                <Wrench className="absolute -right-10 -bottom-10 w-64 h-64 text-primary/5 -rotate-12 group-hover/modal:rotate-0 transition-transform duration-1000" />
                            </div>

                            <div className="p-12 space-y-12 custom-scrollbar max-h-[65vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-1.5 pt-4 border-t border-slate-100">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 italic">Origin Coordinate</p>
                                        <p className="font-serif font-black text-2xl text-foreground">{selected.school_name || 'Central District'}</p>
                                    </div>
                                    <div className="space-y-1.5 pt-4 border-t border-slate-100">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 italic">Operational Lead</p>
                                        <p className="font-serif font-black text-2xl text-foreground">{selected.reported_by_name || 'System Registry'}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 ml-2 italic">Status Report / Incident Narrative</p>
                                    <div className="bg-slate-50/50 p-10 rounded-[1.8rem] border border-border italic text-base font-medium leading-relaxed text-foreground/70 shadow-inner group/quote transition-all duration-500 hover:bg-white">
                                        <span className="text-4xl text-primary font-serif font-black opacity-20 absolute -translate-x-6 -translate-y-4">"</span>
                                        {selected.description}
                                        <span className="text-4xl text-primary font-serif font-black opacity-20 absolute translate-x-2 translate-y-2">"</span>
                                    </div>
                                </div>

                                {selected.photo_url && (
                                    <div className="space-y-5 pt-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 ml-2 italic">Visual Telemetry</p>
                                            <span className="text-[9px] font-black text-primary px-3 py-1 bg-primary/5 rounded-lg border border-primary/10 uppercase tracking-widest">Captured High-Resolution</span>
                                        </div>
                                        <div className="rounded-[2rem] overflow-hidden border border-border shadow-2xl group/img relative">
                                            <img src={selected.photo_url} alt="damage" className="w-full h-auto object-cover max-h-[450px] group-hover:scale-105 transition-transform duration-1000" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                )}

                                {/* Admin/Principal Strategic Controls */}
                                {(role === 'principal' || role === 'admin') && (selected.status === 'Pending' || selected.status === 'Approved') && (
                                    <div className="space-y-10 pt-12 border-t border-border">
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                                    <Wrench className="w-5 h-5" />
                                                </div>
                                                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary italic">Logistics Command Authorization</h3>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-2 italic">Maintenance Personnel Entry</Label>
                                                    <Input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="Email of Lead Engineer" className="h-16 rounded-2xl bg-slate-50/50 border-border font-black placeholder:font-medium placeholder:text-muted-foreground/20 text-sm p-6 focus-visible:bg-white focus-visible:ring-primary/20 transition-all font-sans" />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-2 italic">Scheduled Tactical Launch</Label>
                                                    <Input type="date" value={scheduledStartDate} onChange={e => setScheduledStartDate(e.target.value)} className="h-16 rounded-2xl bg-slate-50/50 border-border font-black text-sm p-6 focus-visible:bg-white focus-visible:ring-primary/20 transition-all font-sans" />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-2 italic">Strategic Operational Directives</Label>
                                                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Specify critical constraints or tactical requirements for the restoration engineer..." rows={4} className="rounded-[1.8rem] bg-slate-50/50 border-border font-bold p-8 text-sm placeholder:font-medium placeholder:text-muted-foreground/20 focus-visible:bg-white focus-visible:ring-primary/20 transition-all font-sans shadow-inner" />
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-5 mt-6">
                                            <Button onClick={handleAssign} disabled={saving || !assignedTo} className="flex-[2] h-20 bg-primary hover:bg-primary/95 text-primary-foreground font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/20 text-[11px] transition-all active:scale-[0.98] group">
                                                <Wrench className="w-5 h-5 mr-3 group-hover:rotate-45 transition-transform" /> {saving ? "SYNCHRONIZING..." : "Authorize Restoration Command"}
                                            </Button>
                                            {selected.status === 'Pending' && (
                                                <Button onClick={() => updateStatus(selected.id, 'Rejected', { principal_notes: notes })} variant="outline" disabled={saving} className="flex-1 h-20 border-border text-rose-600 hover:bg-rose-50 font-black uppercase tracking-[0.2em] rounded-2xl text-[11px] transition-all active:scale-[0.98] italic">
                                                    Seal & Reject Case
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
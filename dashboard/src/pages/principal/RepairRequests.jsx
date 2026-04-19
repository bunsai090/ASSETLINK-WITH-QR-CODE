import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
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
        const unsubscribe = onSnapshot(
            collection(db, 'repair_requests'),
            (snapshot) => {
                const requestsList = snapshot.docs.map(doc => {
                    /** @type {any} */
                    const data = doc.data();
                    return { ...data, id: doc.id };
                }).sort((a, b) => {
                    /** @type {any} */ const reqA = a;
                    /** @type {any} */ const reqB = b;
                    const dateA = reqA.created_at?.toDate ? reqA.created_at.toDate() : new Date(0);
                    const dateB = reqB.created_at?.toDate ? reqB.created_at.toDate() : new Date(0);
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
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-10"
        >
            <motion.div variants={itemVariants} className="px-1 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Administrative Oversight</span>
                    </div>
                    <h1 className="text-4xl font-serif font-black text-foreground tracking-tighter leading-none">Repair <span className="text-primary italic">Approvals</span></h1>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-2 opacity-60">Authentication tier: Institutional Command</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative group w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                            placeholder="Filter registry..." 
                            className="h-12 pl-11 bg-white border-border rounded-xl shadow-sm focus:ring-primary/20"
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-12 w-full sm:w-48 bg-white border-border rounded-xl shadow-sm">
                            <SelectValue placeholder="Status Filter" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border">
                            <SelectItem value="all">Comprehensive View</SelectItem>
                            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex justify-center py-32">
                    <div className="w-12 h-12 border-8 border-primary/10 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <motion.div 
                    variants={containerVariants}
                    className="grid grid-cols-1 gap-4"
                >
                    <AnimatePresence mode="popLayout">
                        {filtered.length === 0 ? (
                            <motion.div 
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-32 text-muted-foreground bg-white rounded-[2.5rem] border border-dashed border-border/60 shadow-inner"
                            >
                                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-border/50">
                                    <ShieldCheck className="w-10 h-10 text-muted-foreground/10" />
                                </div>
                                <h3 className="text-xl font-serif font-black text-foreground tracking-tight italic">Registry Clear</h3>
                                <p className="text-xs font-medium opacity-50 uppercase tracking-widest mt-1">No pending maneuvers detected</p>
                            </motion.div>
                        ) : (
                            filtered.map(req => (
                                <motion.div
                                    key={req.id}
                                    layout
                                    variants={itemVariants}
                                    onClick={() => { 
                                        setSelected(req); 
                                        setNotes(''); 
                                        setEscalationReason('');
                                        setEscalationAttempted(false);
                                        setAssignedTo(req.assigned_to_name || ''); 
                                    }}
                                    className="bg-white rounded-[2rem] border border-border p-6 hover:shadow-2xl hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/5 transition-all duration-500" />
                                    
                                    <div className="flex items-start gap-6 relative z-10">
                                        <div className={`w-1.5 self-stretch rounded-full flex-shrink-0 ${req.priority === 'Critical' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : req.priority === 'High' ? 'bg-orange-400' : 'bg-primary shadow-[0_0_15px_rgba(20,184,166,0.2)]'}`} />
                                        
                                        <div className="flex-1 min-w-0 py-1">
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <h3 className="text-lg font-serif font-black text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">{req.asset_name}</h3>
                                                <div className="flex gap-2">
                                                    <StatusBadge status={req.priority} />
                                                    <StatusBadge status={req.status} />
                                                </div>
                                            </div>
                                            
                                            <p className="text-sm text-foreground/70 font-medium line-clamp-1 italic tracking-tight mb-4">"{req.description}"</p>
                                            
                                            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-50">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-border/50">
                                                        <School className="w-4 h-4 text-muted-foreground/60" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{req.school_name || 'Protocol Hub'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-border/50">
                                                        <UserCircle className="w-4 h-4 text-muted-foreground/60" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Reported: {req.reported_by_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-border/50">
                                                        <Clock className="w-4 h-4 text-muted-foreground/60" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{req.created_at?.toDate ? format(req.created_at.toDate(), 'MMM d, yyyy') : 'Recently'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 border border-border group-hover:bg-primary group-hover:border-primary transition-all self-center">
                                            <ChevronRight className="w-6 h-6 text-muted-foreground/30 group-hover:text-white transition-all group-hover:translate-x-0.5" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                    {selected && (
                        <div className="flex flex-col max-h-[90vh]">
                            {/* Dialog Hero */}
                            <div className="p-8 pt-10 bg-slate-50/50 border-b border-border relative">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl opacity-50" />
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={selected.status} />
                                            <StatusBadge status={selected.priority} />
                                        </div>
                                        <h2 className="text-3xl font-serif font-black text-foreground tracking-tighter leading-none mt-2">{selected.asset_name}</h2>
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">Registry Identifier #{selected.asset_code || '---'}</p>
                                    </div>
                                    <div className="w-20 h-20 rounded-[1.5rem] bg-white shadow-xl shadow-black/5 flex items-center justify-center border border-border">
                                        <Activity className="w-10 h-10 text-primary/40" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Reporting Node</span>
                                            <p className="text-sm font-bold text-foreground italic flex items-center gap-2">
                                                <UserCircle className="w-3.5 h-3.5 text-primary/60" /> {selected.reported_by_name}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Host Institution</span>
                                            <p className="text-sm font-bold text-foreground italic flex items-center gap-2">
                                                <School className="w-3.5 h-3.5 text-primary/60" /> {selected.school_name || 'Central Hub'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-1 text-right">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Submission Timestamp</span>
                                            <p className="text-sm font-bold text-foreground italic">
                                                {selected.created_at?.toDate ? format(selected.created_at.toDate(), 'MMMM d, yyyy') : 'Recently'}
                                            </p>
                                        </div>
                                        {selected.sla_deadline && (
                                            <div className="space-y-1 text-right">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 text-red-400">Resolution Deadline</span>
                                                <p className="text-sm font-bold text-red-500 italic">
                                                    {format(new Date(selected.sla_deadline), 'MMMM d, yyyy')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Incident Intelligence</span>
                                    <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-border/50 shadow-inner">
                                        <p className="text-sm font-medium text-foreground leading-relaxed italic tracking-tight">"{selected.description}"</p>
                                    </div>
                                </div>

                                {selected.photo_url && (
                                    <div className="rounded-[2rem] overflow-hidden border border-border shadow-xl hover:shadow-2xl transition-all duration-500 group">
                                        <img 
                                            src={selected.photo_url} 
                                            alt="Incident Visual Intelligence" 
                                            className="w-full h-auto object-cover max-h-[300px] group-hover:scale-105 transition-transform duration-700" 
                                        />
                                    </div>
                                )}
                                
                                {['Pending', 'Approved'].includes(selected.status) && (
                                    <div className="space-y-8 pt-8 border-t border-border">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Personnel Assignment</Label>
                                                <Select value={assignedTo} onValueChange={setAssignedTo}>
                                                    <SelectTrigger className="h-14 rounded-2xl bg-white border-border shadow-sm">
                                                        <SelectValue placeholder="Command selection..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-border">
                                                        {maintenanceStaff.map(staff => (
                                                            <SelectItem key={staff.email} value={staff.full_name}>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-sm tracking-tight">{staff.full_name}</span>
                                                                    <span className="text-[9px] text-primary/60 uppercase font-black tracking-widest">{staff.specialization || 'Strategic Operative'}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Operations Log</Label>
                                                <Textarea 
                                                    value={notes} 
                                                    onChange={e => setNotes(e.target.value)} 
                                                    placeholder="Operational directives..." 
                                                    className="rounded-2xl bg-white border-border min-h-[56px] py-4" 
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <Button 
                                                onClick={handleApprove} 
                                                disabled={saving} 
                                                className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase text-[11px] tracking-[0.3em] rounded-2xl shadow-xl shadow-primary/20 gap-3"
                                            >
                                                <Check className="w-5 h-5" /> Initialize Unit
                                            </Button>
                                            <Button 
                                                onClick={handleReject} 
                                                variant="outline" 
                                                disabled={saving} 
                                                className="flex-1 h-14 text-red-500 border-red-100 hover:bg-red-50 font-black uppercase text-[11px] tracking-[0.3em] rounded-2xl"
                                            >
                                                Decline Sequence
                                            </Button>
                                        </div>

                                        <div className="pt-6 space-y-4 bg-amber-50/30 p-6 rounded-[2.5rem] border border-amber-100">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 italic">Strategic Escalation</Label>
                                                <Textarea 
                                                    value={escalationReason} 
                                                    onChange={e => { setEscalationReason(e.target.value); setEscalationAttempted(false); }} 
                                                    placeholder="Specify critical deviation reason..." 
                                                    className={`rounded-2xl bg-white transition-all shadow-sm ${
                                                        escalationAttempted && !escalationReason.trim()
                                                            ? 'border-red-400 ring-2 ring-red-300/20'
                                                            : 'border-border'
                                                    }`}
                                                />
                                            </div>
                                            <Button 
                                                onClick={handleEscalate} 
                                                variant="outline" 
                                                disabled={saving} 
                                                className="w-full h-14 text-purple-600 border-purple-100 bg-white hover:bg-purple-50 font-black uppercase text-[10px] tracking-[0.4em] rounded-2xl gap-3 shadow-md"
                                            >
                                                <ArrowUpCircle className="w-5 h-5" /> Escalate to Oversight
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {selected.status === 'In Progress' && (
                                    <div className="p-8 bg-primary/5 border border-primary/10 rounded-[2.5rem] text-center">
                                        <p className="text-sm font-black text-primary uppercase tracking-[0.2em] italic flex items-center justify-center gap-3">
                                            <Activity className="w-4 h-4" /> Operations Active: Unit in designated custody
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}

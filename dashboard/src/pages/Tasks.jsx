import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { Wrench, CheckCircle, Clock, AlertCircle, ChevronDown, Package, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { sileo } from 'sileo';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const TASK_STATUSES = ['Assigned', 'In Progress', 'On Hold', 'Completed', 'Pending Teacher Verification'];

export default function Tasks() {
    const { currentUser } = useAuth();
    const role = currentUser?.role || 'maintenance';
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ status: '', notes: '', materials_used: '', actual_cost: '' });
    const [saving, setSaving] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        const q = query(collection(db, 'maintenance_tasks'), orderBy('updated_at', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = (/** @type {any[]} */ (snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))));
            const filtered = role === 'maintenance'
                ? data.filter(t => (t.assigned_to_email === currentUser?.email) || (t.assigned_to_name?.toLowerCase().includes(currentUser?.full_name?.toLowerCase())))
                : data;
            setTasks(filtered);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [currentUser, role]);

    function openTask(task) {
        setSelected(task);
        setForm({ status: task.status, notes: task.notes || '', materials_used: task.materials_used || '', actual_cost: task.actual_cost || '' });
    }

    async function handleUpdate() {
        setSaving(true);
        try {
            const updateData = {
                status: form.status,
                notes: form.notes,
                materials_used: form.materials_used,
                actual_cost: form.actual_cost ? parseFloat(form.actual_cost) : null,
                updated_at: serverTimestamp()
            };
            
            if (form.status === 'Completed') {
                updateData.completed_date = new Date().toISOString().split('T')[0];
                updateData.status = 'Pending Teacher Verification';
            }

            if (selected.repair_request_id) {
                await updateDoc(doc(db, 'repair_requests', selected.repair_request_id), {
                    status: updateData.status,
                    maintenance_notes: form.notes,
                    updated_at: serverTimestamp()
                });
            }

            await updateDoc(doc(db, 'maintenance_tasks', selected.id), updateData);
            sileo.success({ title: 'Task Updated', description: 'Logistics data synchronized.' });
            setSelected(null);
        } catch (error) {
            sileo.error({ title: 'Sync Failure', description: 'Could not update task record.' });
        } finally {
            setSaving(false);
        }
    }

    const displayed = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus);
    const counts = {
        Assigned: tasks.filter(t => t.status === 'Assigned').length,
        'In Progress': tasks.filter(t => t.status === 'In Progress').length,
        Completed: tasks.filter(t => t.status === 'Completed' || t.status === 'Pending Teacher Verification').length,
    };

    return (
        <div className="space-y-10 animate-fade-in pb-20 relative z-10 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1.5 font-sans">
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                        Restoration <span className="text-primary italic">Tasks</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        Managing {tasks.length} tactical service orders assigned to your personnel.
                    </p>
                </div>
            </div>

            {/* tactical Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Assigned', count: counts.Assigned, icon: Clock, color: 'text-amber-600 bg-amber-50' },
                    { label: 'In Operation', count: counts['In Progress'], icon: Wrench, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Fulfilled', count: counts.Completed, icon: CheckCircle, color: 'text-primary bg-primary/5' },
                ].map(({ label, count, icon: Icon, color }) => (
                    <motion.div 
                        whileHover={{ y: -4 }}
                        key={label} 
                        className="bg-white rounded-2xl border border-border p-8 flex items-center justify-between shadow-sm transition-all"
                    >
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{label}</p>
                            <p className="text-4xl font-serif font-black text-foreground">{count}</p>
                        </div>
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-transparent shadow-sm", color)}>
                            <Icon className="w-6 h-6" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-2 rounded-2xl border border-border shadow-sm">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full h-12 bg-slate-50 border-none rounded-xl font-bold px-6 flex items-center justify-between transition-colors hover:bg-slate-100">
                        <div className="flex items-center gap-3">
                            <Shield className="w-4 h-4 text-primary" />
                            <span className="text-[10px] uppercase tracking-widest text-foreground">Taxonomy: {filterStatus === 'all' ? 'Universal Registry' : filterStatus}</span>
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border">
                        <SelectItem value="all">Universal Registry</SelectItem>
                        {TASK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex justify-center py-40">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {displayed.length === 0 ? (
                        <div className="col-span-full text-center py-40 bg-slate-50 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
                            <Wrench className="w-16 h-16 mb-4 text-muted-foreground opacity-20" />
                            <h3 className="text-xl font-serif font-black text-foreground">Workshop Static</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-1 text-muted-foreground opacity-60">Zero active service orders encountered</p>
                        </div>
                    ) : displayed.map((task, idx) => (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            key={task.id}
                            onClick={() => openTask(task)}
                            className="group relative flex flex-col bg-white rounded-2xl p-8 transition-all duration-300 border border-transparent hover:border-border hover:bg-slate-50/50 cursor-pointer shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-start justify-between mb-8">
                                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-white group-hover:text-primary transition-all duration-300 shadow-sm border border-transparent group-hover:border-border">
                                    <Wrench className="w-7 h-7 group-hover:rotate-45 transition-transform" />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <StatusBadge status={task.priority || 'Medium'} size="sm" />
                                    <StatusBadge status={task.status} size="sm" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-serif font-black text-foreground tracking-tight group-hover:text-primary transition-colors leading-tight">{task.asset_name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-primary px-2.5 py-1 bg-primary/5 rounded-lg border border-primary/10 uppercase tracking-widest">{task.request_number || 'PENDING'}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest truncate max-w-[200px] italic">• {task.school_name}</span>
                                </div>
                                {task.notes && (
                                    <div className="mt-6 p-5 rounded-xl bg-slate-50 italic text-[11px] font-medium text-muted-foreground/70 leading-relaxed border border-border line-clamp-2">
                                        "{task.notes}"
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
                                <div className="flex items-center gap-2 text-muted-foreground/40">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                                        {task.created_date ? format(new Date(task.created_date), 'MMM d, yyyy') : 'Recently Logged'}
                                    </span>
                                </div>
                                <div className="text-[9px] font-black text-primary uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 translate-x-3 group-hover:translate-x-0 transition-all duration-300 italic">
                                    Execute Protocol →
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Update Modal */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="sm:max-w-xl rounded-2xl border border-border p-0 overflow-hidden bg-white shadow-2xl font-sans">
                    <div className="p-8 pb-6 border-b border-border bg-slate-50/50">
                        <DialogTitle className="text-3xl font-serif font-black tracking-tight text-foreground">
                            Execute <span className="text-primary italic">Sync</span>
                        </DialogTitle>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mt-1">Operational status update</p>
                    </div>

                    {selected && (
                        <div className="p-8 space-y-8">
                            <div className="flex items-center gap-5 p-5 rounded-xl bg-slate-50 border border-border">
                                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/10 transition-transform hover:rotate-2">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-lg font-serif font-black text-foreground leading-none">{selected.asset_name}</p>
                                    <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mt-1.5">{selected.school_name || 'District Campus'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Lifecycle State</Label>
                                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-border font-bold text-xs uppercase tracking-widest px-5 hover:bg-slate-100 transition-colors"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl border-border">
                                            {TASK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Materials Logistics</Label>
                                    <Input value={form.materials_used} onChange={e => setForm({ ...form, materials_used: e.target.value })} placeholder="Registry materials..." className="h-12 rounded-xl bg-slate-50 border-border font-bold placeholder:font-medium text-xs px-5 focus-visible:bg-white" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Service Intelligence (Notes)</Label>
                                    <Textarea rows={4} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Log specific tactical adjustments..." className="rounded-xl bg-slate-50 border-border font-bold p-5 text-xs placeholder:font-medium focus-visible:bg-white transition-all" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Operational Cost (PHP)</Label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-lg">₱</span>
                                        <Input type="number" value={form.actual_cost} onChange={e => setForm({ ...form, actual_cost: e.target.value })} placeholder="0.00" className="h-14 rounded-xl bg-slate-50 border-border font-black text-xl pl-10 focus-visible:bg-white" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-3 pt-6">
                                <Button onClick={handleUpdate} disabled={saving} className="h-14 bg-primary hover:bg-primary/95 text-primary-foreground font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-[0.98] text-[10px]">
                                    {saving ? 'Synchronizing Archive...' : (form.status === 'Completed' ? 'Fulfil & Verification Request' : 'Execute Update')}
                                </Button>
                                <Button variant="ghost" onClick={() => setSelected(null)} className="text-muted-foreground/50 hover:text-rose-600 font-bold uppercase text-[9px] tracking-[0.3em] transition-colors">Abort Process</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
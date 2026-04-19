import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { AlertTriangle, Search, Wrench, CheckCircle, Clock, Shield, Star, MessageSquare } from 'lucide-react';
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

const STATUSES = ['Pending', 'Approved', 'In Progress', 'Completed', 'Rejected', 'Escalated', 'Pending Teacher Verification'];

export default function TeacherRepairRequests() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selected, setSelected] = useState(null);
    const [verificationFeedback, setVerificationFeedback] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = onSnapshot(
            collection(db, 'repair_requests'),
            (snapshot) => {
                const all = snapshot.docs.map(doc => {
                    /** @type {any} */
                    const data = doc.data();
                    return { ...data, id: doc.id };
                });
                const teacherEmail = currentUser.email?.toLowerCase();
                const teacherName = currentUser.full_name?.toLowerCase();
                
                const mine = all
                    .filter(r => {
                        const emailMatches = r.reported_by_email?.toLowerCase() === teacherEmail;
                        const nameMatches = r.reported_by_name?.toLowerCase() === teacherName;
                        const schoolMatches = r.school_id === currentUser.school_id;
                        
                        // Verification items for their school OR their own reports
                        const needsVerification = r.status === 'Pending Teacher Verification';
                        
                        return emailMatches || nameMatches || (needsVerification && schoolMatches);
                    })
                    .sort((a, b) => {
                        const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(0);
                        const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(0);
                        return dateB - dateA;
                    });
                setRequests(mine);
                setLoading(false);
            },
            (error) => {
                console.error('Teacher RepairRequests error:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    const filtered = requests.filter(r => {
        const matchSearch = !search || r.asset_name?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        return matchSearch && matchStatus;
    });

    async function handleVerifyRepair() {
        setSaving(true);
        try {
            // 1. Update the Repair Request
            await updateDoc(doc(db, 'repair_requests', selected.id), { 
                status: 'Completed',
                teacher_confirmation: true, 
                completed_at: serverTimestamp(),
                updated_at: serverTimestamp()
            });

            // 2. Synchronize with Maintenance Tasks
            const taskQuery = query(collection(db, 'maintenance_tasks'), where('repair_request_id', '==', selected.id));
            const taskSnapshot = await getDocs(taskQuery);
            
            const syncPromises = taskSnapshot.docs.map(taskDoc => 
                updateDoc(doc(db, 'maintenance_tasks', taskDoc.id), {
                    status: 'Completed',
                    updated_at: serverTimestamp()
                })
            );
            await Promise.all(syncPromises);

            sileo.success({
                title: 'Repair Verified',
                description: 'The restoration protocol has been successfully finalized.'
            });
            setSelected(null);
        } catch (error) {
            sileo.error({ title: 'Sync Failure', description: 'Could not verify the restoration cycle.' });
        } finally {
            setSaving(false);
        }
    }

    async function handleRejectRepair() {
        if (!verificationFeedback.trim()) {
            sileo.error({
                title: 'Intelligence Required',
                description: 'Please provide detailed feedback explaining the restoration failure.'
            });
            return;
        }
        setSaving(true);
        try {
            await updateDoc(doc(db, 'repair_requests', selected.id), {
                status: 'In Progress',
                teacher_verification_notes: verificationFeedback,
                updated_at: serverTimestamp()
            });

            const taskQuery = query(collection(db, 'maintenance_tasks'), where('repair_request_id', '==', selected.id));
            const taskSnapshot = await getDocs(taskQuery);
            
            const syncPromises = taskSnapshot.docs.map(taskDoc => 
                updateDoc(doc(db, 'maintenance_tasks', taskDoc.id), {
                    status: 'In Progress',
                    notes: `REWORK REQUESTED: ${verificationFeedback}`, 
                    updated_at: serverTimestamp()
                })
            );
            await Promise.all(syncPromises);

            sileo.success({
                title: 'Tactical Rework Initiated',
                description: 'Feedback synchronized for immediate restoration adjustment.'
            });
            setVerificationFeedback('');
            setSelected(null);
        } catch (error) {
            sileo.error({ title: 'Sync Failure', description: 'Could not broadcast feedback.' });
        } finally {
            setSaving(false);
        }
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
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
            className="space-y-12 pb-20 relative z-10"
        >
            {/* Header Area */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-1.5">
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                        Restoration <span className="text-primary italic">Reports</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        Tracking your submitted cases through the district restoration lifecycle.
                    </p>
                </div>
            </motion.div>

            {/* Tactical Status Toggles */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 bg-white p-3 rounded-[1.5rem] border border-border shadow-sm">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input 
                        placeholder="Scan reports by asset designation..." 
                        className="pl-14 h-14 bg-transparent border-none ring-0 focus-visible:ring-0 text-sm font-bold placeholder:text-muted-foreground/30" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-64 h-14 bg-slate-50 border-none rounded-xl font-black text-[10px] uppercase tracking-widest px-8 transition-colors hover:bg-slate-100">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            <SelectValue placeholder="Registry State" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border font-sans">
                        <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">Universal Registry</SelectItem>
                        {STATUSES.map(s => <SelectItem key={s} value={s} className="text-[10px] font-black uppercase tracking-widest">{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </motion.div>

            {loading ? (
                <div className="flex justify-center py-40">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filtered.length === 0 ? (
                        <motion.div variants={itemVariants} className="col-span-full text-center py-40 bg-white rounded-[2.5rem] border border-dashed border-border flex flex-col items-center justify-center">
                            <Star className="w-20 h-20 mb-6 text-primary opacity-20" />
                            <h3 className="text-2xl font-serif font-black text-foreground tracking-tight italic">System Integrity Normal</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-1 text-muted-foreground opacity-60">No active reports encountered in your sector</p>
                        </motion.div>
                    ) : (
                        filtered.map((req, idx) => (
                            <motion.div
                                variants={itemVariants}
                                key={req.id}
                                onClick={() => setSelected(req)}
                                className={cn(
                                    "group relative flex flex-col bg-white rounded-[2.5rem] p-10 transition-all duration-500 border border-transparent hover:border-border hover:bg-slate-50/50 cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)]",
                                    req.status === 'Pending Teacher Verification' && "ring-2 ring-primary ring-offset-8 ring-offset-background bg-primary/5 border-primary/20"
                                )}
                            >
                                <div className="flex items-start justify-between mb-8">
                                    <div className={cn(
                                        "w-16 h-16 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 shadow-sm border border-transparent",
                                        req.status === 'Pending Teacher Verification' ? "bg-primary text-white" : "bg-slate-50 text-muted-foreground group-hover:bg-white group-hover:text-primary group-hover:border-border"
                                    )}>
                                        <Wrench className="w-8 h-8" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2 text-[10px]">
                                        <StatusBadge status={req.priority || 'Medium'} size="xs" />
                                        <StatusBadge status={req.status} size="xs" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-serif font-black text-foreground tracking-tight group-hover:text-primary transition-colors leading-tight">{req.asset_name}</h3>
                                    <p className="text-xs text-muted-foreground font-medium line-clamp-2 opacity-60 italic leading-relaxed">"{req.description}"</p>
                                </div>
                                
                                <div className="flex items-center justify-between mt-10 pt-8 border-t border-border/40">
                                    <div className="flex items-center gap-2 text-muted-foreground/30">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{req.created_at?.toDate ? format(req.created_at.toDate(), 'MMM d, yyyy') : ''}</span>
                                    </div>
                                    {req.status === 'Pending Teacher Verification' ? (
                                        <div className="text-[9px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">Action Required • Verify →</div>
                                    ) : (
                                        <div className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.2em] group-hover:text-primary transition-colors italic">Registry Detail →</div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Verification & Detail Modal */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border border-border p-0 overflow-hidden bg-white shadow-2xl font-sans">
                    {selected && (
                        <div className="flex flex-col max-h-[90vh] overflow-hidden">
                            <div className="p-10 pb-8 border-b border-border bg-slate-50/50 shrink-0">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex gap-2">
                                        <StatusBadge status={selected.status} size="sm" />
                                        <StatusBadge status={selected.priority} size="sm" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 italic">Pipeline # {selected.request_number || 'SYNC-PENDING'}</span>
                                </div>
                                <h2 className="text-4xl font-serif font-black text-foreground tracking-tighter leading-none mb-2">{selected.asset_name}</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">{selected.school_name || 'District Campus'}</p>
                            </div>

                            <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 ml-1">Incident Registry</p>
                                    <div className="bg-white p-8 rounded-3xl border border-border/80 italic text-sm font-medium leading-[1.8] text-foreground shadow-sm">
                                        "{selected.description}"
                                    </div>
                                </div>

                                {selected.maintenance_notes && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 ml-1">Staff Fulfillment Log</p>
                                        <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 italic text-sm font-bold leading-[1.8] text-primary shadow-sm relative">
                                            <div className="absolute top-8 left-4 w-1 h-3 bg-primary/40 rounded-full" />
                                            "{selected.maintenance_notes}"
                                            <div className="mt-6 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-primary/40 opacity-60">
                                                <span>Technician: {selected.maintenance_staff_name || 'Restoration Specialist'}</span>
                                                <span>Settlement Cost: <span className="text-amber-600 font-serif">₱{selected.actual_cost?.toLocaleString() || '0'}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selected.photo_url && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 ml-1">Visual Evidence Archive</p>
                                        <div className="rounded-[2rem] overflow-hidden border border-border shadow-2xl">
                                            <img src={selected.photo_url} alt="Damage evidence" className="w-full h-auto object-cover max-h-96" />
                                        </div>
                                    </div>
                                )}

                                {selected.status === 'Pending Teacher Verification' && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-8 pt-10 border-t border-border"
                                    >
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-serif font-black text-foreground tracking-tight">Restoration <span className="text-primary italic">Validation</span></h3>
                                            <p className="text-xs text-muted-foreground font-medium">Verify the integrity of the repair. If unresolved, provide tactical feedback for rework.</p>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">Observational Feedback</Label>
                                            <Textarea 
                                                value={verificationFeedback} 
                                                onChange={e => setVerificationFeedback(e.target.value)} 
                                                placeholder="Document any remaining operational friction..." 
                                                className="rounded-2xl bg-slate-50 border-border focus:bg-white min-h-[120px] p-6 text-sm font-bold shadow-inner"
                                            />
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <Button onClick={handleVerifyRepair} disabled={saving} className="flex-1 h-16 bg-primary hover:bg-primary/95 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                                                {saving ? 'Synchronizing...' : (
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4" /> Full Verification Success
                                                    </div>
                                                )}
                                            </Button>
                                            <Button onClick={handleRejectRepair} variant="ghost" className="flex-1 h-16 text-rose-600 hover:bg-rose-50 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all">
                                                Request Restoration Adjustments
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {selected.status === 'Completed' && (
                                    <div className="pt-10 border-t border-border flex flex-col items-center gap-8">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">Restoration Settlement Authenticator</p>
                                            <h3 className="text-2xl font-serif font-black text-foreground">Provenance <span className="text-primary italic">Archive</span></h3>
                                        </div>
                                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-border shadow-inner flex flex-col items-center gap-6 group">
                                            <div className="relative p-4 bg-white rounded-3xl shadow-xl border border-border group-hover:scale-[1.02] transition-transform duration-500 cursor-pointer"
                                                 onClick={() => window.open(`${window.location.origin}/repair-report?id=${selected.id}`, '_blank')}>
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/repair-report?id=${selected.id}`)}&margin=8`}
                                                    alt="Repair Report QR Code"
                                                    className="w-48 h-48"
                                                />
                                                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl">
                                                    <Star className="w-10 h-10 text-primary animate-pulse" />
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] text-center max-w-[240px] leading-relaxed">
                                                Scan to access immutable service history, cost audit & visual settlement proofs
                                            </p>
                                            <Button
                                                variant="outline"
                                                className="h-12 border-border text-primary font-black uppercase tracking-[0.2em] text-[10px] px-8 rounded-xl bg-white shadow-sm hover:shadow-lg transition-all"
                                                onClick={() => window.open(`${window.location.origin}/repair-report?id=${selected.id}`, '_blank')}
                                            >
                                                Open Report Node
                                            </Button>
                                        </div>
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

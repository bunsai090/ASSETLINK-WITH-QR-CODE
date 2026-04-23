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
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Restoration Reports</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Tracking your submitted cases through the district restoration lifecycle.
                    </p>
                </div>
            </div>

            {/* Tactical Status Toggles */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Scan reports by asset designation..." 
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
                        No active reports encountered in your sector.
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
                            <div key={req.id} onClick={() => setSelected(req)} className="data-row grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-foreground truncate">{req.asset_name}</p>
                                        {req.status === 'Pending Teacher Verification' && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
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
                                        {req.created_at?.toDate ? format(req.created_at.toDate(), 'MMM d, yyyy') : ''}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Verification & Detail Modal */}
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
                                    <span className="text-xs font-mono text-muted-foreground">#{selected.request_number || 'PENDING'}</span>
                                </div>
                                <h2 className="text-xl font-semibold tracking-tight text-foreground">{selected.asset_name}</h2>
                                <p className="text-sm text-muted-foreground">{selected.school_name || 'District Campus'}</p>
                            </div>

                            <div className="p-6 space-y-6 overflow-y-auto">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-foreground">Incident Description</Label>
                                    <div className="bg-white p-4 rounded-lg border border-border text-sm">
                                        {selected.description}
                                    </div>
                                </div>

                                {selected.maintenance_notes && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-foreground">Maintenance Notes</Label>
                                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 text-sm text-primary">
                                            {selected.maintenance_notes}
                                            <div className="mt-4 flex items-center justify-between text-xs font-medium opacity-80">
                                                <span>Technician: {selected.maintenance_staff_name || 'N/A'}</span>
                                                <span>Cost: ₱{selected.actual_cost?.toLocaleString() || '0'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selected.photo_url && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-foreground">Evidence Photo</Label>
                                        <div className="rounded-lg overflow-hidden border border-border">
                                            <img src={selected.photo_url} alt="Damage evidence" className="w-full h-auto object-cover max-h-64" />
                                        </div>
                                    </div>
                                )}

                                {selected.status === 'Pending Teacher Verification' && (
                                    <div className="space-y-4 pt-4 border-t border-border">
                                        <div>
                                            <h3 className="text-sm font-semibold text-foreground">Verify Restoration</h3>
                                            <p className="text-xs text-muted-foreground">Please confirm if the repair meets your expectations.</p>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-foreground">Feedback Notes</Label>
                                            <Textarea 
                                                value={verificationFeedback} 
                                                onChange={e => setVerificationFeedback(e.target.value)} 
                                                placeholder="Enter any issues if unresolved..." 
                                                className="h-24 bg-white border-border text-sm"
                                            />
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <Button onClick={handleRejectRepair} variant="outline" className="flex-1 h-9 text-sm text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-200">
                                                Request Rework
                                            </Button>
                                            <Button onClick={handleVerifyRepair} disabled={saving} className="flex-1 h-9 text-sm bg-[hsl(172,75%,17%)] hover:bg-[hsl(172,75%,22%)] text-white">
                                                {saving ? 'Saving...' : 'Verify Successful'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {selected.status === 'Completed' && (
                                    <div className="pt-6 border-t border-border flex flex-col items-center gap-4">
                                        <div className="p-4 bg-white rounded-xl shadow-sm border border-border">
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${window.location.origin}/repair-report?id=${selected.id}`)}&margin=8`}
                                                alt="Repair Report QR Code"
                                                className="w-32 h-32"
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="h-9 text-sm"
                                            onClick={() => window.open(`${window.location.origin}/repair-report?id=${selected.id}`, '_blank')}
                                        >
                                            View Report Document
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

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { AlertTriangle, Search, Wrench, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { sileo } from 'sileo';
import { format } from 'date-fns';

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

    // Handle URL parameters for direct linking
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id && requests.length > 0) {
            const req = requests.find(r => r.id === id);
            if (req) setSelected(req);
        }
    }, [requests]);

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = onSnapshot(
            collection(db, 'repair_requests'),
            (snapshot) => {
                const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                // Debug: log what's coming from Firebase
                const teacherEmail = currentUser.email?.toLowerCase();
                const teacherName = currentUser.full_name?.toLowerCase();
                console.log('[AssetLink] Teacher email:', teacherEmail, '| name:', teacherName);
                console.log('[AssetLink] All requests from Firebase:', all.map(r => ({
                    id: r.id,
                    reported_by_email: r.reported_by_email,
                    reported_by_name: r.reported_by_name,
                    status: r.status,
                    description: r.description?.slice(0, 40)
                })));
                
                const mine = all
                    .filter(r => {
                        const emailMatches = r.reported_by_email?.toLowerCase() === teacherEmail;
                        const nameMatches = r.reported_by_name?.toLowerCase() === teacherName;
                        // Also include if the status is Pending Teacher Verification and it's in the same school
                        // this helps if the email/name match is slightly off but it belongs to the teacher's school
                        const schoolMatches = r.school_id === currentUser.school_id;
                        
                        return emailMatches || nameMatches || (r.status === 'Pending Teacher Verification' && schoolMatches);
                    })
                    .sort((a, b) => {
                        const dateA = a.created_at?.toDate?.() ?? new Date(0);
                        const dateB = b.created_at?.toDate?.() ?? new Date(0);
                        return dateB - dateA;
                    });
                console.log('[AssetLink] Filtered (mine):', mine.length, 'of', all.length);
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
            const { getDocs, query, collection, where } = await import('firebase/firestore');
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
                description: 'The repair has been successfully verified and marked as completed.'
            });
            setSelected(null);
        } catch (error) {
            sileo.error({ title: 'Update Failed', description: 'Could not verify the repair.' });
        } finally {
            setSaving(false);
        }
    }

    async function handleRejectRepair() {
        if (!verificationFeedback.trim()) {
            sileo.error({
                title: 'Feedback Required',
                description: 'Please provide feedback explaining what needs to be fixed.'
            });
            return;
        }
        setSaving(true);
        try {
            // 1. Update the Repair Request
            await updateDoc(doc(db, 'repair_requests', selected.id), {
                status: 'In Progress',
                teacher_verification_notes: verificationFeedback,
                updated_at: serverTimestamp()
            });

            // 2. Synchronize with Maintenance Tasks
            const { getDocs, query, collection, where } = await import('firebase/firestore');
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
                title: 'Rework Requested',
                description: 'Feedback has been sent to the maintenance team for rework.'
            });
            setVerificationFeedback('');
            setSelected(null);
        } catch (error) {
            sileo.error({ title: 'Update Failed', description: 'Could not send feedback.' });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="px-1">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">My Repair Reports</h1>
                <p className="text-muted-foreground text-sm mt-1">Track the status of assets you reported as damaged.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-teal transition-colors" />
                    <Input placeholder="Search your reports..." className="pl-9 bg-card border-border" value={search} onChange={e => setSearch(e.target.value)} />
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
                            <p className="font-medium">No reports found</p>
                            <p className="text-xs mt-1">Submit a report to see it tracked here.</p>
                        </div>
                    ) : (
                        filtered.map(req => (
                            <div
                                key={req.id}
                                onClick={() => setSelected(req)}
                                className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg hover:border-teal/30 transition-all cursor-pointer group animate-in slide-in-from-bottom-2 duration-300"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal/10 group-hover:text-teal transition-colors flex-shrink-0">
                                        <Wrench className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                            <h3 className="font-bold text-foreground text-base tracking-tight">{req.asset_name}</h3>
                                            <StatusBadge status={req.status} />
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-1 italic">{req.description}</p>
                                        <div className="flex items-center gap-3 mt-3">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                {req.created_at ? format(req.created_at.toDate(), 'MMM d, yyyy') : ''}
                                            </p>
                                            {req.request_number && (
                                                <span className="text-[10px] font-bold text-teal bg-teal/5 px-2 py-0.5 rounded border border-teal/10">
                                                    #{req.request_number}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {req.status === 'Pending Teacher Verification' && (
                                        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse shadow-sm shadow-blue-500/20">
                                            ACTION NEEDED
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl border-none">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight">Request Details</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-6 pt-2">
                            <div className="flex justify-between items-center">
                                <StatusBadge status={selected.status} size="md" />
                                <span className="text-xs font-bold text-muted-foreground">ID: {selected.request_number}</span>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Your Damage Report:</p>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{selected.description}</p>
                                </div>

                                {selected.maintenance_notes && (
                                    <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                                        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1.5">Staff Service Report:</p>
                                        <p className="text-sm font-medium text-teal-900 leading-relaxed">"{selected.maintenance_notes}"</p>
                                        {selected.maintenance_staff_name && (
                                            <p className="text-[10px] font-bold text-teal-700/60 mt-2 text-right">
                                                — Performed by {selected.maintenance_staff_name}
                                            </p>
                                        )}
                                        
                                        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-teal-200/50">
                                            <div>
                                                <p className="text-[10px] font-bold text-teal-600/70 uppercase tracking-widest">Materials Used</p>
                                                <p className="text-xs font-bold text-teal-800 mt-0.5">{selected.materials_used || 'None provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-teal-600/70 uppercase tracking-widest">Total Cost</p>
                                                <p className="text-xs font-black text-amber-600 mt-0.5">₱{selected.actual_cost?.toLocaleString() || '0'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selected.photo_url && (
                                    <div className="rounded-xl overflow-hidden border border-border">
                                        <img src={selected.photo_url} alt="Damage evidence" className="w-full h-auto" />
                                    </div>
                                )}
                            </div>

                            {selected.status === 'Pending Teacher Verification' && (
                                <div className="space-y-4 pt-4 border-t border-border">
                                    <div>
                                        <p className="text-sm font-bold text-foreground">Verify This Repair</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">The maintenance team completed this task. Did it solve the issue?</p>
                                    </div>
                                    <Textarea 
                                        value={verificationFeedback} 
                                        onChange={e => setVerificationFeedback(e.target.value)} 
                                        placeholder="Add notes for the staff if needed..." 
                                        className="rounded-xl bg-slate-50 border-slate-200 focus:bg-white min-h-[100px]"
                                    />
                                    <div className="flex gap-3">
                                        <Button onClick={handleVerifyRepair} disabled={saving} className="flex-1 bg-teal hover:bg-teal/90 text-white font-bold h-11 rounded-xl">
                                            Yes, fixed!
                                        </Button>
                                        <Button onClick={handleRejectRepair} variant="outline" className="flex-1 border-red-100 text-red-600 hover:bg-red-50 font-bold h-11 rounded-xl">
                                            Not yet
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {selected.status === 'Completed' && (
                                <div className="pt-4 border-t border-border space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-foreground">Repair Report QR</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Scan to view the full service report.</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-teal text-teal font-bold rounded-xl text-xs gap-1.5"
                                            onClick={() => {
                                                const url = `${window.location.origin}/repair-report?id=${selected.id}`;
                                                window.open(url, '_blank');
                                            }}
                                        >
                                            Open Report Page
                                        </Button>
                                    </div>
                                    <div className="flex flex-col items-center bg-slate-50 rounded-xl border border-slate-200 p-4 gap-3">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${window.location.origin}/repair-report?id=${selected.id}`)}&margin=8`}
                                            alt="Repair Report QR Code"
                                            className="rounded-lg"
                                        />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                            Scan to view proof, staff report &amp; cost
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { AlertTriangle, Search, Wrench, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { sileo } from 'sileo';
import { format } from 'date-fns';

const STATUSES = ['Pending', 'Approved', 'In Progress', 'Completed', 'Rejected', 'Escalated'];

export default function TeacherRepairRequests() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selected, setSelected] = useState(null);
    const [verificationFeedback, setVerificationFeedback] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadRequests(); }, []);

    async function loadRequests() {
        const data = await base44.entities.RepairRequest.list('-created_date', 200);
        // Teachers see all requests for now, but usually filtered to their own reports
        const myRequests = data.filter(r => r.reported_by_email === currentUser?.email);
        setRequests(myRequests.length > 0 ? myRequests : data);
        setLoading(false);
    }

    const filtered = requests.filter(r => {
        const matchSearch = !search || r.asset_name?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        return matchSearch && matchStatus;
    });

    async function handleVerifyRepair() {
        setSaving(true);
        await base44.entities.RepairRequest.update(selected.id, { 
            status: 'Completed',
            teacher_confirmation: true, 
            completed_date: new Date().toISOString().split('T')[0]
        });
        sileo.success({
            title: 'Repair Verified',
            description: 'The repair has been successfully verified and marked as completed.'
        });
        setSaving(false);
        setSelected(null);
        loadRequests();
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
        await base44.entities.RepairRequest.update(selected.id, {
            status: 'In Progress',
            teacher_verification_notes: verificationFeedback,
        });
        sileo.success({
            title: 'Rework Requested',
            description: 'Feedback has been sent to the maintenance team for rework.'
        });
        setVerificationFeedback('');
        setSaving(false);
        setSelected(null);
        loadRequests();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">My Repair Reports</h1>
                <p className="text-muted-foreground text-sm mt-1">Track the status of assets you reported as damaged</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search your reports..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
                            <p>No reports found</p>
                        </div>
                    ) : filtered.map(req => (
                        <div
                            key={req.id}
                            onClick={() => setSelected(req)}
                            className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-foreground text-sm">{req.asset_name}</h3>
                                        <StatusBadge status={req.status} />
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{req.description}</p>
                                    <p className="text-xs text-muted-foreground mt-2">{req.created_date ? format(new Date(req.created_date), 'MMM d, yyyy') : ''}</p>
                                </div>
                                {req.status === 'Pending Teacher Verification' && (
                                    <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold animate-pulse">ACTION NEEDED</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Report Details</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4">
                            <StatusBadge status={selected.status} size="md" />
                            <div className="bg-muted p-3 rounded-xl">
                                <p className="text-xs text-muted-foreground mb-1">Your Report:</p>
                                <p className="text-sm">{selected.description}</p>
                            </div>

                            {selected.status === 'Pending Teacher Verification' && (
                                <div className="space-y-3 pt-2 border-t border-border">
                                    <p className="text-sm font-medium text-foreground">Verify Repair</p>
                                    <p className="text-xs text-muted-foreground">The maintenance team has finished the work. Is it satisfactory?</p>
                                    <Textarea value={verificationFeedback} onChange={e => setVerificationFeedback(e.target.value)} placeholder="Feedback for maintenance (optional if approving, required if rejecting)" rows={2} />
                                    <div className="flex gap-2">
                                        <Button onClick={handleVerifyRepair} disabled={saving} className="flex-1 bg-teal hover:bg-teal/90 text-white">
                                            Yes, it's fixed
                                        </Button>
                                        <Button onClick={handleRejectRepair} variant="outline" className="flex-1 border-orange-200 text-orange-600">
                                            No, needs rework
                                        </Button>
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

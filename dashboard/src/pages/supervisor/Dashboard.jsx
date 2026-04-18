import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import { Package, AlertTriangle, School, ShieldCheck } from 'lucide-react';

export default function SupervisorDashboard() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubRequests = onSnapshot(
            collection(db, 'repair_requests'),
            (snap) => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const sorted = list.sort((a, b) => {
                    const dateA = a.created_at?.toDate?.() ?? new Date(0);
                    const dateB = b.created_at?.toDate?.() ?? new Date(0);
                    return dateB - dateA;
                });
                setRequests(sorted);
                setLoading(false); // Done loading initial data
            }
        );
        const unsubAssets = onSnapshot(
            collection(db, 'assets'),
            (snap) => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const sorted = list.sort((a, b) => {
                    const dateA = a.created_at?.toDate?.() ?? new Date(0);
                    const dateB = b.created_at?.toDate?.() ?? new Date(0);
                    return dateB - dateA;
                });
                setAssets(sorted);
            }
        );
        return () => { unsubRequests(); unsubAssets(); };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin" />
            </div>
        );
    }



    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Supervisor Overview</h1>
                <p className="text-muted-foreground mt-1">Monitoring all assets and repair requests under your jurisdiction.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard title="Total Assets" value={assets.length} subtitle="All assets" icon={Package} color="blue" />
                <StatsCard title="Open Requests" value={requests.filter(r => !['Completed', 'Rejected'].includes(r.status)).length} subtitle="Unresolved" icon={AlertTriangle} color="amber" />
                <StatsCard title="Critical Issues" value={requests.filter(r => r.priority === 'Critical').length} subtitle="Urgent attention" icon={ShieldCheck} color="red" />
            </div>
            {/* Escalated across all schools */}
            <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-base font-semibold text-foreground mb-4">Escalated Issues</h2>
                <div className="space-y-3">
                    {requests.filter(r => r.status === 'Escalated').length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No escalated issues across all schools.</p>
                    ) : requests.filter(r => r.status === 'Escalated').map(req => (
                        <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                            <AlertTriangle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{req.asset_name}</p>
                                <p className="text-xs text-muted-foreground">{req.school_name} · {req.escalated_reason || 'No reason provided'}</p>
                            </div>
                            <StatusBadge status="Escalated" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

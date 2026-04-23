import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import { Package, AlertTriangle, School, ShieldCheck, Activity, MapPin, TrendingUp } from 'lucide-react';

export default function SupervisorDashboard() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubRequests = onSnapshot(collection(db, 'repair_requests'), (snap) => {
            const list = snap.docs
                .map(doc => /** @type {any} */({ ...doc.data(), id: doc.id }))
                .sort((a, b) => {
                    const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(0);
                    const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(0);
                    return dateB - dateA;
                });
            setRequests(list);
            setLoading(false);
        });

        const unsubAssets = onSnapshot(collection(db, 'assets'), (snap) => {
            setAssets(snap.docs.map(doc => /** @type {any} */({ ...doc.data(), id: doc.id })));
        });

        return () => { unsubRequests(); unsubAssets(); };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const openRequestsCount = requests.filter(r => !['Completed', 'Rejected'].includes(r.status)).length;
    const criticalCount = requests.filter(r => r.priority === 'Critical').length;
    const escalated = requests.filter(r => r.status === 'Escalated');

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground tracking-tight">Regional Oversight</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        District-wide view · {assets.length} assets · {openRequestsCount} open issues
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card border border-border">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    <span className="label-mono text-foreground">94.2% Operational</span>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard title="Total Assets" value={assets.length} subtitle="Regional inventory" icon={Package} color="blue" />
                <StatsCard title="Open Requests" value={openRequestsCount} subtitle="Active resolution" icon={AlertTriangle} color="amber" />
                <StatsCard title="Critical Issues" value={criticalCount} subtitle="Urgent intervention" icon={ShieldCheck} color="red" />
            </div>

            {/* Escalated Incidents Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-md bg-rose-50 border border-rose-200/60 flex items-center justify-center">
                            <Activity className="w-3.5 h-3.5 text-rose-500" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Escalated Incidents</h2>
                            <p className="label-mono text-muted-foreground mt-0.5">Critical anomalies requiring oversight</p>
                        </div>
                    </div>
                    <span className="label-mono text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
                        {escalated.length} incidents
                    </span>
                </div>

                {escalated.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <ShieldCheck className="w-8 h-8 text-emerald-500/30 mb-3" />
                        <p className="text-sm font-medium text-muted-foreground/60">No escalated incidents</p>
                        <p className="text-xs text-muted-foreground/40 mt-1">All issues are within normal parameters.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-2.5 bg-muted/30">
                            <span className="label-mono">Asset / School</span>
                            <span className="label-mono">Priority</span>
                            <span className="label-mono">Status</span>
                        </div>
                        {escalated.map((req) => (
                            <div key={req.id} className="data-row grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-4 hover:bg-muted/30 transition-colors">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{req.asset_name}</p>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="label-mono text-muted-foreground flex items-center gap-1">
                                            <School className="w-3 h-3" /> {req.school_name}
                                        </span>
                                        {req.location && (
                                            <span className="label-mono text-muted-foreground flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {req.location}
                                            </span>
                                        )}
                                    </div>
                                    {req.escalated_reason && (
                                        <p className="text-xs text-muted-foreground mt-1 italic truncate">"{req.escalated_reason}"</p>
                                    )}
                                </div>
                                <StatusBadge status={req.priority} size="sm" />
                                <StatusBadge status="Escalated" size="sm" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

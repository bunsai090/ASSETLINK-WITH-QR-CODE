import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import { Package, AlertTriangle, School, ShieldCheck } from 'lucide-react';

export default function SupervisorDashboard() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [assets, setAssets] = useState([]);
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const [r, a, s] = await Promise.all([
                base44.entities.RepairRequest.list('-created_date', 200),
                base44.entities.Asset.list('-created_date', 200),
                base44.entities.School.list('-created_date', 50),
            ]);
            setRequests(r);
            setAssets(a);
            setSchools(s);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin" />
            </div>
        );
    }

    const bySchool = schools.map(s => ({
        name: s.name,
        total: requests.filter(r => r.school_name === s.name).length,
        pending: requests.filter(r => r.school_name === s.name && r.status === 'Pending').length,
        inProgress: requests.filter(r => r.school_name === s.name && r.status === 'In Progress').length,
        completed: requests.filter(r => r.school_name === s.name && r.status === 'Completed').length,
        critical: requests.filter(r => r.school_name === s.name && r.priority === 'Critical').length,
    }));

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Supervisor Overview</h1>
                <p className="text-muted-foreground mt-1">Monitoring all schools under your jurisdiction.</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Schools" value={schools.length} subtitle="Under monitoring" icon={School} color="teal" />
                <StatsCard title="Total Assets" value={assets.length} subtitle="All schools" icon={Package} color="blue" />
                <StatsCard title="Open Requests" value={requests.filter(r => !['Completed', 'Rejected'].includes(r.status)).length} subtitle="Unresolved" icon={AlertTriangle} color="amber" />
                <StatsCard title="Critical Issues" value={requests.filter(r => r.priority === 'Critical').length} subtitle="Urgent attention" icon={ShieldCheck} color="red" />
            </div>
            {/* Per-school breakdown */}
            <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-base font-semibold text-foreground mb-5">School-by-School Status</h2>
                {bySchool.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <School className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No schools registered yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bySchool.map(s => (
                            <div key={s.name} className="p-4 rounded-xl border border-border bg-background">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold text-foreground text-sm">{s.name}</p>
                                    <div className="flex gap-2">
                                        {s.critical > 0 && <StatusBadge status="Critical" />}
                                        <span className="text-xs text-muted-foreground">{s.total} requests</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    {[{ label: 'Pending', val: s.pending, col: 'text-amber-600' }, { label: 'In Progress', val: s.inProgress, col: 'text-blue-600' }, { label: 'Completed', val: s.completed, col: 'text-emerald-600' }].map(({ label, val, col }) => (
                                        <div key={label} className="bg-muted rounded-lg py-2">
                                            <p className={`text-lg font-bold ${col}`}>{val}</p>
                                            <p className="text-xs text-muted-foreground">{label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import { Package, AlertTriangle, Wrench, Clock, TrendingUp, ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function TeacherDashboard() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const [r, a] = await Promise.all([
                base44.entities.RepairRequest.list('-created_date', 200),
                base44.entities.Asset.list('-created_date', 200),
            ]);
            setRequests(r);
            setAssets(a);
            setLoading(false);
        }
        load();
    }, []);

    const recent = requests.slice(0, 5);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Welcome back, {currentUser?.full_name?.split(' ')[0] || 'Teacher'} 👋
                    </h1>
                    <p className="text-muted-foreground mt-1">Here's what's happening with your school assets today.</p>
                </div>
                <Link to="/report-damage">
                    <Button className="bg-teal hover:bg-teal/90 text-white gap-2">
                        <Plus className="w-4 h-4" /> Report Damage
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Total Assets" value={assets.length} subtitle="Registered assets" icon={Package} color="teal" />
                <StatsCard title="Pending Repairs" value={requests.filter(r => r.status === 'Pending').length} subtitle="Awaiting action" icon={Clock} color="amber" />
                <StatsCard title="In Progress" value={requests.filter(r => r.status === 'In Progress').length} subtitle="Active repairs" icon={Wrench} color="blue" />
                <StatsCard title="Critical Issues" value={requests.filter(r => r.priority === 'Critical').length} subtitle="Urgent attention" icon={AlertTriangle} color="red" />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Requests */}
                <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-semibold text-foreground">Recent Repair Requests</h2>
                        <Link to="/repair-requests">
                            <Button variant="ghost" size="sm" className="text-teal hover:text-teal gap-1 text-xs">
                                View all <ArrowRight className="w-3 h-3" />
                            </Button>
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recent.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No repair requests yet</p>
                            </div>
                        ) : recent.map(req => (
                            <Link key={req.id} to={`/repair-requests?id=${req.id}`}>
                                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer">
                                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                        <Wrench className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{req.asset_name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{req.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <StatusBadge status={req.status} />
                                        <span className="text-xs text-muted-foreground">
                                            {req.created_date ? format(new Date(req.created_date), 'MMM d') : ''}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                    <div className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="text-base font-semibold text-foreground mb-4">Request Overview</h2>
                        <div className="space-y-3">
                            {[
                                { label: 'Pending', count: requests.filter(r => r.status === 'Pending').length, total: requests.length, color: 'bg-amber-400' },
                                { label: 'In Progress', count: requests.filter(r => r.status === 'In Progress').length, total: requests.length, color: 'bg-blue-400' },
                                { label: 'Completed', count: requests.filter(r => r.status === 'Completed').length, total: requests.length, color: 'bg-emerald-400' },
                            ].map(({ label, count, total, color }) => (
                                <div key={label}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">{label}</span>
                                        <span className="font-medium text-foreground">{count}</span>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${color} transition-all duration-500`}
                                            style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-teal to-teal/80 rounded-2xl p-6 text-white">
                        <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
                        <p className="text-sm font-medium opacity-80">Resolution Rate</p>
                        <p className="text-3xl font-bold mt-1">
                            {requests.length > 0 ? Math.round((requests.filter(r => r.status === 'Completed').length / requests.length) * 100) : 0}%
                        </p>
                        <p className="text-xs opacity-70 mt-1">of all requests completed</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

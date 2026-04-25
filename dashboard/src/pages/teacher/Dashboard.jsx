import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import { Package, AlertTriangle, Wrench, Clock, TrendingUp, Plus, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function TeacherDashboard() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const fetchData = async () => {
            const [assetsRes, requestsRes] = await Promise.all([
                supabase.from('assets').select('*').order('created_at', { ascending: false }),
                supabase.from('repair_requests').select('*').order('created_at', { ascending: false })
            ]);

            if (assetsRes.data) setAssets(assetsRes.data);
            if (requestsRes.data) {
                const teacherEmail = currentUser.email?.toLowerCase();
                const teacherName = currentUser.full_name?.toLowerCase();
                const filtered = requestsRes.data.filter(r => {
                    const emailMatches = r.reported_by_email?.toLowerCase() === teacherEmail;
                    const nameMatches = r.reported_by_name?.toLowerCase() === teacherName;
                    const schoolMatches = r.school_id === currentUser.school_id;
                    return emailMatches || nameMatches || (r.status === 'Pending Teacher Verification' && schoolMatches);
                });
                setRequests(filtered);
            }
            setLoading(false);
        };

        fetchData();

        const channelAssets = supabase.channel('teacher_assets_sync').on('postgres_changes', { event: '*', table: 'assets' }, fetchData).subscribe();
        const channelRequests = supabase.channel('teacher_requests_sync').on('postgres_changes', { event: '*', table: 'repair_requests' }, fetchData).subscribe();

        return () => {
            supabase.removeChannel(channelAssets);
            supabase.removeChannel(channelRequests);
        };
    }, [currentUser]);

    const recent = requests.slice(0, 5);
    const pending = requests.filter(r => r.status === 'Pending').length;
    const inProgress = requests.filter(r => r.status === 'In Progress').length;
    const critical = requests.filter(r => r.priority === 'Critical').length;
    const completed = requests.filter(r => r.status === 'Completed').length;
    const resolutionRate = requests.length > 0 ? Math.round((completed / requests.length) * 100) : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground tracking-tight">
                        Good {getGreeting()}, {currentUser?.full_name?.split(' ')[0] || 'Teacher'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Tracking {assets.length} assets · {pending} pending reviews
                    </p>
                </div>
                <Link to="/report-damage">
                    <Button size="sm" className="h-8 px-3 text-xs font-medium bg-primary hover:bg-primary/90 text-white rounded-lg gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        Report Damage
                    </Button>
                </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Assets" value={assets.length} subtitle="Managed equipment" icon={Package} color="teal" />
                <StatsCard title="Pending" value={pending} subtitle="Awaiting review" icon={Clock} color="amber" />
                <StatsCard title="In Progress" value={inProgress} subtitle="Active work orders" icon={Wrench} color="blue" />
                <StatsCard title="Critical" value={critical} subtitle="High priority" icon={AlertTriangle} color="red" />
            </div>

            {/* Main content grid */}
            <div className="grid lg:grid-cols-3 gap-4">
                {/* Recent Requests Table */}
                <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Department Reports</h2>
                            <p className="label-mono text-muted-foreground mt-0.5">Latest repair requests</p>
                        </div>
                        <Link to="/repair-requests">
                            <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground">
                                View all <ArrowUpRight className="w-3 h-3" />
                            </Button>
                        </Link>
                    </div>

                    {recent.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Package className="w-8 h-8 text-muted-foreground/20 mb-3" />
                            <p className="text-sm font-medium text-muted-foreground/60">No active requests</p>
                            <p className="text-xs text-muted-foreground/40 mt-1">Your department queue is clear.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {/* Table header */}
                            <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-2.5 bg-muted/30">
                                <span className="label-mono">Asset</span>
                                <span className="label-mono">Priority</span>
                                <span className="label-mono">Status</span>
                            </div>
                            {recent.map((req) => (
                                <Link key={req.id} to={`/repair-requests?id=${req.id}`}>
                                    <div className="data-row grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-muted/30 transition-colors">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{req.asset_name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{req.description}</p>
                                        </div>
                                        <StatusBadge status={req.priority} size="sm" />
                                        <div className="flex flex-col items-end gap-1">
                                            <StatusBadge status={req.status} size="sm" />
                                            <span className="label-mono text-muted-foreground/50">
                                                {req.created_at ? format(new Date(req.created_at), 'MMM d') : ''}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div className="space-y-4">
                    {/* Status Breakdown */}
                    <div className="bg-card border border-border rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-foreground mb-4">Request Status</h2>
                        <div className="space-y-3">
                            {[
                                { label: 'Pending', count: pending, total: requests.length, color: 'bg-amber-500' },
                                { label: 'In Progress', count: inProgress, total: requests.length, color: 'bg-sky-500' },
                                { label: 'Completed', count: completed, total: requests.length, color: 'bg-emerald-500' },
                            ].map(({ label, count, total, color }) => (
                                <div key={label}>
                                    <div className="flex justify-between mb-1.5">
                                        <span className="label-mono text-muted-foreground">{label}</span>
                                        <span className="label-mono text-foreground">{count} / {total}</span>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn('h-full rounded-full transition-all duration-700', color)}
                                            style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resolution Rate */}
                    <div className="bg-[hsl(222,47%,9%)] border border-[hsl(222,35%,16%)] rounded-xl p-5 text-white">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="label-mono text-white/40">Resolution Rate</span>
                        </div>
                        <div className="text-5xl font-bold text-white tracking-tight leading-none mb-1">
                            {resolutionRate}<span className="text-2xl text-white/40">%</span>
                        </div>
                        <p className="text-xs text-white/40 mt-3">
                            {completed} of {requests.length} requests resolved
                        </p>
                        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                style={{ width: `${resolutionRate}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
}

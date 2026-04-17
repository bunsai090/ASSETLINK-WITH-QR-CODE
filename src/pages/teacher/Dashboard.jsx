import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import { Package, AlertTriangle, Wrench, Clock, TrendingUp, ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function TeacherDashboard() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        // Listen for Real-Time Assets
        const assetsQuery = query(
            collection(db, 'assets'),
            orderBy('created_at', 'desc')
        );

        const unsubscribeAssets = onSnapshot(assetsQuery, (snapshot) => {
            const assetsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAssets(assetsList);
        });

        // Listen for Real-Time Repair Requests
        const requestsQuery = query(
            collection(db, 'repair_requests'),
            orderBy('created_at', 'desc')
        );

        const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
            const teacherEmail = currentUser.email?.toLowerCase();
            const teacherName = currentUser.full_name?.toLowerCase();
            
            const requestsList = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(r => {
                    const emailMatches = r.reported_by_email?.toLowerCase() === teacherEmail;
                    const nameMatches = r.reported_by_name?.toLowerCase() === teacherName;
                    const schoolMatches = r.school_id === currentUser.school_id;
                    
                    return emailMatches || nameMatches || (r.status === 'Pending Teacher Verification' && schoolMatches);
                });
                
            setRequests(requestsList);
            setLoading(false);
        });

        return () => {
            unsubscribeAssets();
            unsubscribeRequests();
        };
    }, [currentUser]);

    const recent = requests.slice(0, 5);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-teal/20 border-t-teal rounded-full animate-spin" />
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
                    <p className="text-muted-foreground mt-1 tracking-tight">Here's what's happening with your school assets today.</p>
                </div>
                <Link to="/report-damage">
                    <Button className="bg-teal hover:bg-teal/90 text-white gap-2 shadow-sm rounded-xl px-6">
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
                <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-semibold text-foreground">Recent Repair Requests</h2>
                        <Link to="/repair-requests">
                            <Button variant="ghost" size="sm" className="text-teal hover:text-teal hover:bg-teal/5 gap-1 text-xs font-bold">
                                View all <ArrowRight className="w-3 h-3" />
                            </Button>
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recent.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">No repair requests yet</p>
                            </div>
                        ) : recent.map(req => (
                            <Link key={req.id} to={`/repair-requests?id=${req.id}`}>
                                <div className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-accent/50 transition-all cursor-pointer border border-transparent hover:border-border">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                        <Wrench className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-foreground truncate">{req.asset_name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{req.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <StatusBadge status={req.status} />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            {req.created_at ? format(req.created_at.toDate(), 'MMM d') : ''}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                        <h2 className="text-base font-semibold text-foreground mb-5">Request Overview</h2>
                        <div className="space-y-4">
                            {[
                                { label: 'Pending', count: requests.filter(r => r.status === 'Pending').length, total: requests.length, color: 'bg-amber-400' },
                                { label: 'In Progress', count: requests.filter(r => r.status === 'In Progress').length, total: requests.length, color: 'bg-blue-400' },
                                { label: 'Completed', count: requests.filter(r => r.status === 'Completed').length, total: requests.length, color: 'bg-emerald-400' },
                            ].map(({ label, count, total, color }) => (
                                <div key={label}>
                                    <div className="flex justify-between text-xs font-bold mb-1.5 uppercase tracking-wide">
                                        <span className="text-muted-foreground">{label}</span>
                                        <span className="text-foreground">{count}</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
                                            style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#008080] to-[#006666] rounded-2xl p-6 text-white shadow-lg shadow-teal/20">
                        <TrendingUp className="w-8 h-8 mb-3 opacity-90" />
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80">Resolution Rate</p>
                        <p className="text-4xl font-black mt-1">
                            {requests.length > 0 ? Math.round((requests.filter(r => r.status === 'Completed').length / requests.length) * 100) : 0}%
                        </p>
                        <p className="text-xs font-medium opacity-70 mt-1">Total tasks completed</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
            
            const requestsList = (/** @type {any[]} */ (snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))))
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
            <div className="flex items-center justify-center min-vh-50">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in relative z-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1.5 font-sans">
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                        Welcome back, <span className="text-primary italic">{currentUser?.full_name?.split(' ')[0] || 'Teacher'}</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        Monitoring {assets.length} school assets in your department. Everything is synchronized.
                    </p>
                </div>
                <Link to="/report-damage" className="shrink-0">
                    <Button size="lg" className="bg-primary hover:bg-primary/95 text-primary-foreground gap-3 shadow-lg shadow-primary/10 rounded-xl px-10 h-14 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Plus className="w-5 h-5" /> Report Damage
                    </Button>
                </Link>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Assets" value={assets.length} subtitle="Managed equipment" icon={Package} color="teal" />
                <StatsCard title="Queued" value={requests.filter(r => r.status === 'Pending').length} subtitle="Awaiting review" icon={Clock} color="amber" />
                <StatsCard title="In Flight" value={requests.filter(r => r.status === 'In Progress').length} subtitle="Active work orders" icon={Wrench} color="blue" />
                <StatsCard title="Critical" value={requests.filter(r => r.priority === 'Critical').length} subtitle="Urgent issues" icon={AlertTriangle} color="red" />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Recent Requests Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-foreground">Department Reports</h2>
                            <p className="text-xs text-muted-foreground mt-1 font-medium italic opacity-60">Latest updates from your resource reports</p>
                        </div>
                        <Link to="/repair-requests">
                            <Button variant="outline" size="sm" className="rounded-full border-primary/20 text-primary hover:bg-primary/5 gap-2 px-5 font-bold h-9">
                                View History <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-1">
                        {recent.length === 0 ? (
                            <div className="text-center py-20 rounded-xl bg-slate-50 border border-dashed border-border flex flex-col items-center justify-center opacity-60">
                                <Package className="w-12 h-12 text-muted-foreground/40 mb-4" />
                                <h3 className="text-lg font-bold text-foreground">Clear Queue</h3>
                                <p className="text-xs text-muted-foreground max-w-[200px] mt-2 font-medium">No active repair requests found for your department.</p>
                            </div>
                        ) : (
                            recent.map((req, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={req.id}
                                >
                                    <Link to={`/repair-requests?id=${req.id}`}>
                                        <div className="group flex items-center gap-5 p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-border">
                                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-white shadow-sm transition-colors">
                                                <Wrench className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="font-black text-foreground text-sm tracking-tight truncate group-hover:text-primary transition-colors">{req.asset_name}</p>
                                                    <StatusBadge status={req.priority} size="sm" />
                                                </div>
                                                <p className="text-[10px] font-bold text-muted-foreground line-clamp-1 opacity-60">{req.description}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <StatusBadge status={req.status} size="sm" />
                                                <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none mt-1">
                                                    {req.created_at ? format(req.created_at.toDate(), 'MMM dd') : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Side Column */}
                <div className="space-y-8">
                    {/* Progress Overview Card */}
                    <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
                        <h2 className="text-xl font-serif font-bold text-foreground mb-8">Department Health</h2>
                        <div className="space-y-6">
                            {[
                                { label: 'Pending', count: requests.filter(r => r.status === 'Pending').length, total: requests.length, color: 'bg-amber-500' },
                                { label: 'Active', count: requests.filter(r => r.status === 'In Progress').length, total: requests.length, color: 'bg-primary' },
                                { label: 'Resolved', count: requests.filter(r => r.status === 'Completed').length, total: requests.length, color: 'bg-emerald-500' },
                            ].map(({ label, count, total, color }) => (
                                <div key={label} className="group">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{label}</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-black text-foreground">{count}</span>
                                            <span className="text-[10px] text-muted-foreground opacity-40">/ {total}</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={cn("h-full rounded-full transition-all group-hover:brightness-110", color)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resolution Rate (The "Vibe" Card) */}
                    <div className="relative overflow-hidden bg-sidebar rounded-2xl p-8 text-white shadow-xl shadow-primary/10 group border border-sidebar-border">
                        <TrendingUp className="w-8 h-8 mb-6 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Resolution Success</span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-6xl font-serif font-black tracking-tighter italic">
                                {requests.length > 0 ? Math.round((requests.filter(r => r.status === 'Completed').length / requests.length) * 100) : 0}%
                            </span>
                        </div>
                        <div className="mt-8 p-5 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-[11px] font-medium text-white/50 leading-relaxed italic">
                                Maintenance synchronization is <span className="text-primary not-italic font-bold">Stable</span>. Critical assets are being restored efficiently.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

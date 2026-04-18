import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import { CalendarDays, AlertTriangle, Clock, Wrench, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO, isToday } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PrincipalDashboard() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(collection(db, 'repair_requests'), orderBy('created_at', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-vh-50">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const pendingApproval = requests.filter(r => r.status === 'Pending');
    const escalated = requests.filter(r => r.status === 'Escalated');
    const inProgress = requests.filter(r => r.status === 'In Progress');
    const completed = requests.filter(r => r.status === 'Completed');
    const scheduledToday = requests.filter(r => r.scheduled_start_date && isToday(parseISO(r.scheduled_start_date)) && r.status === 'Approved');

    return (
        <div className="space-y-10 animate-fade-in relative z-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1.5 font-sans">
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                        Executive <span className="text-primary italic">Oversight</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        {pendingApproval.length > 0 
                            ? `Authorized repairs: ${pendingApproval.length} requests are awaiting your review.`
                            : "Strategic management of institutional resources and maintenance pipelines."}
                    </p>
                    
                    {scheduledToday.length > 0 && (
                        <div className="mt-4 flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/10 rounded-full w-fit group">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                            </span>
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] group-hover:tracking-tight transition-all duration-500">
                                {scheduledToday.length} Active restorations today
                            </span>
                        </div>
                    )}
                </div>
                <Link to="/repair-requests" className="shrink-0">
                    <Button size="lg" className="bg-primary hover:bg-primary/95 text-primary-foreground gap-3 shadow-lg shadow-primary/10 rounded-xl px-10 h-14 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <AlertTriangle className="w-5 h-5" /> Review Requests
                    </Button>
                </Link>
            </div>

            {/* Principal Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Pending" value={pendingApproval.length} subtitle="Authorize repairs" icon={Clock} color="amber" />
                <StatsCard title="In Flight" value={inProgress.length} subtitle="Active work orders" icon={Wrench} color="blue" />
                <StatsCard title="Critical" value={escalated.length} subtitle="Attention required" icon={AlertTriangle} color="red" />
                <StatsCard title="Restored" value={completed.length} subtitle="Successfully fixed" icon={CheckCircle} color="green" />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Approval List Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-foreground">Pending Decisions</h2>
                            <p className="text-xs text-muted-foreground mt-1 font-medium italic opacity-60">Authorize critical infrastructure repairs</p>
                        </div>
                        <Link to="/repair-requests">
                            <Button variant="outline" size="sm" className="rounded-full border-primary/20 text-primary hover:bg-primary/5 gap-2 px-5 font-bold h-9">
                                View Full Queue <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-1">
                        {pendingApproval.length === 0 ? (
                            <div className="text-center py-20 rounded-xl bg-slate-50 border border-dashed border-border flex flex-col items-center justify-center">
                                <CheckCircle className="w-12 h-12 text-emerald-500 mb-4 opacity-40" />
                                <h3 className="text-lg font-bold text-foreground">Workspace Clear</h3>
                                <p className="text-xs text-muted-foreground max-w-[200px] mt-2 font-medium">No pending requests — all systems are synchronized.</p>
                            </div>
                        ) : (
                            pendingApproval.slice(0, 6).map((req, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={req.id}
                                >
                                    <Link to="/repair-requests">
                                        <div className="group flex items-center gap-5 p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-border">
                                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-white shadow-sm transition-colors">
                                                <AlertTriangle className={cn(
                                                    "w-4 h-4",
                                                    req.priority === 'Critical' ? 'text-rose-500' : 'text-amber-500'
                                                )} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-foreground tracking-tight truncate group-hover:text-primary transition-colors">{req.asset_name}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground mt-0.5 opacity-60">{req.reported_by_name} · {req.school_name}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <StatusBadge status={req.priority} size="sm" />
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

                {/* Progress Overview */}
                <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
                    <h2 className="text-xl font-serif font-bold text-foreground mb-8">System Health</h2>
                    <div className="space-y-8">
                        {[
                            { label: 'Pending', count: pendingApproval.length, total: requests.length, color: 'bg-amber-500' },
                            { label: 'Deployed', count: inProgress.length, total: requests.length, color: 'bg-primary' },
                            { label: 'Resolved', count: completed.length, total: requests.length, color: 'bg-emerald-500' },
                            { label: 'Attention', count: escalated.length, total: requests.length, color: 'bg-rose-500' }
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
                                        animate={{ width: requests.length > 0 ? `${(count / requests.length) * 100}%` : '0%' }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={cn("h-full rounded-full transition-all group-hover:brightness-110", color)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Vibe Summary */}
                    <div className="mt-12 p-6 rounded-2xl bg-slate-50 border border-border">
                        <div className="flex items-center gap-3 mb-3">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Intelligence Insight</span>
                        </div>
                        <p className="text-xs font-medium text-foreground leading-relaxed italic opacity-70">
                            Maintenance velocity is <span className="text-primary font-bold not-italic">Synchronized</span>. Infrastructure restorations are proceeding according to SLA targets.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
function TrendingUp({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
    )
}

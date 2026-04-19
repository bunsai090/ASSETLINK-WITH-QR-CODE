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
            const list = snapshot.docs.map(doc => {
                /** @type {any} */
                const data = doc.data();
                return { ...data, id: doc.id };
            });
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12 pb-20 relative z-10"
        >
            {/* Header Section */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-1.5 translate-y-2">
                    <h1 className="text-4xl md:text-6xl font-serif font-black text-foreground tracking-tighter leading-[1] mb-2">
                        Executive <span className="text-primary italic">Oversight</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        {pendingApproval.length > 0 
                            ? `Strategic Review Ready: ${pendingApproval.length} restoration reqs await authorization.`
                            : "Orchestrating institutional excellence through high-fidelity resource management."}
                    </p>
                    
                    {scheduledToday.length > 0 && (
                        <motion.div 
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="mt-6 flex items-center gap-3 px-5 py-2.5 bg-primary/5 border border-primary/10 rounded-full w-fit group cursor-default"
                        >
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                            </span>
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] group-hover:tracking-[0.1em] transition-all duration-700">
                                {scheduledToday.length} Active restorations today
                            </span>
                        </motion.div>
                    )}
                </div>
                <Link to="/repair-requests" className="shrink-0">
                    <Button size="lg" className="h-16 px-10 rounded-[1.25rem] bg-primary hover:bg-primary/95 text-white gap-3 shadow-xl shadow-primary/20 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <AlertTriangle className="w-5 h-5" /> Review Requests
                    </Button>
                </Link>
            </motion.div>

            {/* Principal Stats Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Pending" value={pendingApproval.length} subtitle="Decision required" icon={Clock} color="amber" />
                <StatsCard title="In Flight" value={inProgress.length} subtitle="Active workorders" icon={Wrench} color="blue" />
                <StatsCard title="Attention" value={escalated.length} subtitle="Critical priority" icon={AlertTriangle} color="red" />
                <StatsCard title="Restored" value={completed.length} subtitle="Asset lifecycle" icon={CheckCircle} color="teal" />
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Approval List Card */}
                <motion.div 
                    variants={itemVariants} 
                    className="lg:col-span-2 bg-white rounded-[2.5rem] border border-border p-10 shadow-sm relative overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                            <h2 className="text-3xl font-serif font-black text-foreground tracking-tighter">Decisional <span className="text-primary italic">Queue</span></h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">Strategic infrastructure repair authorization</p>
                        </div>
                        <Link to="/repair-requests">
                            <Button variant="outline" className="h-10 px-6 rounded-full border-border text-[9px] font-black uppercase tracking-widest hover:bg-slate-50">
                                Unified Queue <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-1 relative z-10">
                        {pendingApproval.length === 0 ? (
                            <div className="text-center py-24 rounded-[2rem] bg-slate-50/50 border border-dashed border-border flex flex-col items-center justify-center">
                                <CheckCircle className="w-16 h-16 text-emerald-500/20 mb-4" />
                                <h3 className="text-xl font-serif font-black text-foreground italic opacity-40">Workspace Synchronized</h3>
                                <p className="text-xs text-muted-foreground max-w-[200px] mt-2 font-medium opacity-40">All requests have been addressed.</p>
                            </div>
                        ) : (
                            pendingApproval.slice(0, 6).map((req, idx) => (
                                <motion.div
                                    variants={itemVariants}
                                    key={req.id}
                                >
                                    <Link to="/repair-requests">
                                        <div className="group flex items-center gap-6 p-5 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-border/40">
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:shadow-md transition-all">
                                                <AlertTriangle className={cn(
                                                    "w-5 h-5",
                                                    req.priority === 'Critical' ? 'text-rose-500' : 'text-amber-500'
                                                )} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-foreground text-sm tracking-tight truncate group-hover:text-primary transition-colors uppercase italic leading-none">{req.asset_name}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground/40 mt-1 italic leading-none">{req.reported_by_name} · {req.school_name}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                <StatusBadge status={req.priority} size="sm" />
                                                <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] leading-none">
                                                    {req.created_at?.toDate ? format(req.created_at.toDate(), 'MMM dd') : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Progress Overview */}
                <div className="space-y-8">
                    <motion.div 
                        variants={itemVariants}
                        className="bg-white rounded-[2.5rem] border border-border p-10 shadow-sm"
                    >
                        <h2 className="text-xl font-serif font-black text-foreground mb-10">System <span className="text-primary italic">Health</span></h2>
                        <div className="space-y-10">
                            {[
                                { label: 'Auth Required', count: pendingApproval.length, total: requests.length, color: 'bg-amber-500', icon: Clock },
                                { label: 'Operational', count: inProgress.length, total: requests.length, color: 'bg-primary', icon: Wrench },
                                { label: 'Resolved', count: completed.length, total: requests.length, color: 'bg-emerald-500', icon: CheckCircle },
                                { label: 'Attention', count: escalated.length, total: requests.length, color: 'bg-rose-500', icon: AlertTriangle }
                            ].map(({ label, count, total, color, icon: Icon }) => (
                                <div key={label} className="group">
                                    <div className="flex justify-between items-end mb-3">
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-3 h-3 text-muted-foreground/30" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{label}</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{count}</span>
                                            <span className="text-[8px] font-black text-muted-foreground/20 italic">/ {total}</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-black/[0.02]">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: requests.length > 0 ? `${(count / requests.length) * 100}%` : '0%' }}
                                            viewport={{ once: false }}
                                            transition={{ duration: 1.5, ease: "circOut" }}
                                            className={cn("h-full rounded-full transition-all group-hover:brightness-110 duration-1000", color)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Vibe Summary */}
                        <div className="mt-14 p-6 rounded-[2rem] bg-slate-50/50 border border-border/50 group hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary italic leading-none">Intelligence Stream</span>
                            </div>
                            <p className="text-[11px] font-medium text-foreground/60 leading-[1.6] italic">
                                Maintenance velocity is <span className="text-primary font-black not-italic uppercase tracking-widest leading-none">Synchronized</span>. Restoration protocols are exceeding benchmark SLA targets across the district.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}

function TrendingUp({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
    )
}

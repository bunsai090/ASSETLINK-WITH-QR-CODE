import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import { AlertTriangle, Wrench, CheckCircle, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSLAStatus } from '@/lib/slaUtils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function MaintenanceDashboard() {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const tasksQuery = query(
            collection(db, 'maintenance_tasks')
        );

        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const tasksList = (/** @type {any[]} */ (snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))));
            // Client-side sorting by date (descending)
            const sorted = tasksList.sort((a, b) => {
                const dateA = (a.created_at)?.toDate?.() ?? new Date(0);
                const dateB = (b.created_at)?.toDate?.() ?? new Date(0);
                return dateB - dateA;
            });
            setTasks(sorted);
            setLoading(false);
        }, (error) => {
            console.error('[AssetLink] Maintenance Dashboard Listener Error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const myTasks = tasks.filter(t =>
        t.assigned_to_email === currentUser?.email ||
        t.assigned_to_name?.toLowerCase().includes(currentUser?.full_name?.toLowerCase() || '')
    );

    const myAssigned = myTasks.filter(t => t.status === 'Assigned');
    const myInProgress = myTasks.filter(t => t.status === 'In Progress');
    const myCompleted = myTasks.filter(t => t.status === 'Completed' || t.status === 'Pending Teacher Verification');
    const myOnHold = myTasks.filter(t => t.status === 'On Hold');
    const overdueTasks = myTasks.filter(t => getSLAStatus(t) === 'overdue' && t.status !== 'Completed');

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
                        Personnel <span className="text-primary italic">Workboard</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        Hello, {currentUser?.full_name?.split(' ')[0] || 'Staff'}. Tracking {myTasks.length} assigned maintenance operations across the campus.
                    </p>
                    
                    {overdueTasks.length > 0 && (
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="mt-4 flex items-center gap-3 px-4 py-2 bg-rose-50 border border-rose-100 rounded-full w-fit group"
                        >
                            <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                            <span className="text-[10px] font-black text-rose-700 uppercase tracking-[0.2em] group-hover:tracking-tight transition-all duration-500">
                                Overdue: {overdueTasks.length} Tasks require attention
                            </span>
                        </motion.div>
                    )}
                </div>
                <Link to="/tasks" className="shrink-0">
                    <Button size="lg" className="bg-primary hover:bg-primary/95 text-primary-foreground gap-3 shadow-lg shadow-primary/10 rounded-xl px-10 h-14 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Wrench className="w-5 h-5" /> Manage Tasks
                    </Button>
                </Link>
            </div>

            {/* Tactical Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Assigned" value={myAssigned.length} subtitle="New deployment" icon={Clock} color="blue" />
                <StatsCard title="Active" value={myInProgress.length} subtitle="Operations" icon={Wrench} color="amber" />
                <StatsCard title="Stalled" value={myOnHold.length} subtitle="Blocked items" icon={AlertTriangle} color="red" />
                <StatsCard title="Completed" value={myCompleted.length} subtitle="Success history" icon={CheckCircle} color="teal" />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Workload List Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-8 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8 px-2 relative z-10">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-foreground">Operational Queue</h2>
                            <p className="text-xs text-muted-foreground mt-1 font-medium italic opacity-60">High-priority maintenance requirements</p>
                        </div>
                        <Link to="/tasks">
                            <Button variant="outline" size="sm" className="rounded-full border-primary/20 text-primary hover:bg-primary/5 gap-2 px-5 font-bold h-9">
                                View Full Queue <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-1 relative z-10">
                        {[...myAssigned, ...myInProgress].length === 0 ? (
                            <div className="text-center py-20 rounded-xl bg-slate-50 border border-dashed border-border flex flex-col items-center justify-center opacity-60">
                                <CheckCircle className="w-12 h-12 text-emerald-500 mb-4 opacity-40" />
                                <h3 className="text-lg font-bold text-foreground">No Active Tasks</h3>
                                <p className="text-xs text-muted-foreground max-w-[200px] mt-2 font-medium">Your queue is fully clear. Ready for deployment.</p>
                            </div>
                        ) : (
                            [...myAssigned, ...myInProgress].slice(0, 5).map((task, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={task.id}
                                >
                                    <Link to="/tasks">
                                        <div className="group flex items-center gap-5 p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-border">
                                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-white shadow-sm transition-colors">
                                                <motion.div animate={{ rotate: task.status === 'In Progress' ? 360 : 0 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                                                    <Wrench className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </motion.div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-foreground tracking-tight truncate group-hover:text-primary transition-colors uppercase">
                                                    {task.asset_name}
                                                </p>
                                                <p className="text-[10px] font-bold text-muted-foreground mt-0.5 opacity-60">{task.school_name || "Campus-Wide"} · Priority: {task.priority || 'Normal'}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <StatusBadge status={task.status} size="sm" />
                                                <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none mt-1">
                                                    {task.created_at ? format(task.created_at.toDate(), 'MMM dd') : 'Recent'}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Efficiency Analytics */}
                <div className="space-y-8">
                    <div className="bg-sidebar rounded-2xl p-8 text-white shadow-xl shadow-primary/10 relative overflow-hidden group border border-sidebar-border">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 leading-none">Performance Matrix</span>
                            </div>
                            
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-serif font-black tracking-tighter italic">
                                    {myTasks.length > 0 ? Math.round((myCompleted.length / myTasks.length) * 100) : 0}%
                                </span>
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Velocity</span>
                            </div>
                            
                            <div className="mt-8 space-y-4">
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden p-0.5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: myTasks.length > 0 ? `${(myCompleted.length / myTasks.length) * 100}%` : '0%' }}
                                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                                        className="h-full bg-primary rounded-full" 
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/20">
                                    <span>Resolution Rate</span>
                                    <span className="text-white/40">{myCompleted.length} / {myTasks.length} Done</span>
                                </div>
                            </div>

                            <div className="mt-10 p-5 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-[11px] font-medium text-white/60 leading-relaxed italic">
                                    "Your resolution velocity is currently <span className="text-primary not-italic font-bold">Optimal</span>. Campus standards are being exceeded."
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Link Card */}
                    <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
                        <h3 className="text-lg font-serif font-bold text-foreground mb-6">Staff Quick-Actions</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Link to="/calendar" className="group">
                                <div className="p-4 rounded-xl bg-slate-50 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all text-center">
                                    <Clock className="w-5 h-5 mx-auto mb-2 text-muted-foreground/60 group-hover:text-primary transition-all" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-all">Timeline</span>
                                </div>
                            </Link>
                            <Link to="/tasks" className="group">
                                <div className="p-4 rounded-xl bg-slate-50 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all text-center">
                                    <Wrench className="w-5 h-5 mx-auto mb-2 text-muted-foreground/60 group-hover:text-primary transition-all" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-all">Tasks</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

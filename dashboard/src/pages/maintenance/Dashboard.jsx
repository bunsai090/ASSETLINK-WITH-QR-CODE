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
            const tasksList = snapshot.docs.map(doc => {
                /** @type {any} */
                const data = doc.data();
                return { ...data, id: doc.id };
            });
            // Client-side sorting by date (descending)
            const sorted = tasksList.sort((a, b) => {
                /** @type {any} */ const taskA = a;
                /** @type {any} */ const taskB = b;
                const dateA = taskA.created_at?.toDate ? taskA.created_at.toDate() : new Date(0);
                const dateB = taskB.created_at?.toDate ? taskB.created_at.toDate() : new Date(0);
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
                <div className="space-y-1.5">
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
                            className="mt-6 flex items-center gap-3 px-5 py-2.5 bg-rose-50 border border-rose-100 rounded-full w-fit group"
                        >
                            <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                            <span className="text-[10px] font-black text-rose-700 uppercase tracking-[0.2em] group-hover:tracking-tight transition-all duration-500">
                                Overdue: {overdueTasks.length} Tasks require attention
                            </span>
                        </motion.div>
                    )}
                </div>
                <Link to="/tasks" className="shrink-0">
                    <Button size="lg" className="h-16 px-10 rounded-[1.25rem] bg-primary hover:bg-primary/95 text-white gap-3 shadow-xl shadow-primary/20 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Wrench className="w-5 h-5" /> Manage Tasks
                    </Button>
                </Link>
            </motion.div>

            {/* Tactical Stats Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Assigned" value={myAssigned.length} subtitle="New deployment" icon={Clock} color="blue" />
                <StatsCard title="Active" value={myInProgress.length} subtitle="Operations" icon={Wrench} color="amber" />
                <StatsCard title="Stalled" value={myOnHold.length} subtitle="Blocked items" icon={AlertTriangle} color="red" />
                <StatsCard title="Completed" value={myCompleted.length} subtitle="Success history" icon={CheckCircle} color="teal" />
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Workload List Card */}
                <motion.div 
                    variants={itemVariants}
                    className="lg:col-span-2 bg-white rounded-[2.5rem] border border-border p-10 shadow-sm relative overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h2 className="text-2xl font-serif font-black text-foreground">Operational <span className="text-primary italic">Queue</span></h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">High-priority maintenance requirements</p>
                        </div>
                        <Link to="/tasks">
                            <Button variant="outline" className="h-10 px-6 rounded-full border-border text-[9px] font-black uppercase tracking-widest hover:bg-slate-50">
                                View Full Queue <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-1 relative z-10">
                        {[...myAssigned, ...myInProgress].length === 0 ? (
                            <div className="text-center py-24 rounded-[2rem] bg-slate-50/50 border border-dashed border-border/50 flex flex-col items-center justify-center">
                                <CheckCircle className="w-16 h-16 text-emerald-500/20 mb-4" />
                                <h3 className="text-xl font-serif font-black text-foreground italic opacity-40">No Active Tasks</h3>
                                <p className="text-xs text-muted-foreground max-w-[200px] mt-2 font-medium opacity-40">Your queue is fully clear. Ready for deployment.</p>
                            </div>
                        ) : (
                            [...myAssigned, ...myInProgress].slice(0, 5).map((task, idx) => (
                                <motion.div
                                    variants={itemVariants}
                                    key={task.id}
                                >
                                    <Link to="/tasks">
                                        <div className="group flex items-center gap-6 p-5 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-border/40">
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:shadow-md transition-all">
                                                <motion.div animate={{ rotate: task.status === 'In Progress' ? 360 : 0 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                                                    <Wrench className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                                </motion.div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-foreground text-sm tracking-tight truncate group-hover:text-primary transition-colors uppercase">
                                                    {task.asset_name}
                                                </p>
                                                <p className="text-[10px] font-bold text-muted-foreground/40 mt-1 italic">{task.school_name || "Campus-Wide"} · Priority: {task.priority || 'Normal'}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                <StatusBadge status={task.status} size="sm" />
                                                <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] leading-none">
                                                    {task.created_at ? format(task.created_at.toDate(), 'MMM dd') : 'Recent'}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Efficiency Analytics */}
                <div className="space-y-8">
                    <motion.div 
                        variants={itemVariants}
                        className="bg-[#054a29] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-primary/20 relative overflow-hidden group"
                    >
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 leading-none italic">Performance Matrix</span>
                            </div>
                            
                            <div className="flex items-baseline gap-3 mt-2">
                                <span className="text-7xl font-serif font-black tracking-tighter italic leading-none">
                                    {myTasks.length > 0 ? Math.round((myCompleted.length / myTasks.length) * 100) : 0}%
                                </span>
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Velocity</span>
                            </div>
                            
                            <div className="mt-10 space-y-4">
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: myTasks.length > 0 ? `${(myCompleted.length / myTasks.length) * 100}%` : '0%' }}
                                        viewport={{ once: false }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                        className="h-full bg-primary rounded-full transition-all duration-1000" 
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/20">
                                    <span>Resolution Rate</span>
                                    <span className="text-white/40 italic">{myCompleted.length} / {myTasks.length} Done</span>
                                </div>
                            </div>

                            <div className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                                <p className="text-[11px] font-medium text-white/50 leading-relaxed italic">
                                    Resolution velocity is <span className="text-primary not-italic font-black uppercase tracking-widest">Optimal</span>. Campus standards are being exceeded.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Link Card */}
                    <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-border p-10 shadow-sm">
                        <h3 className="text-xl font-serif font-black text-foreground mb-8">Quick <span className="text-primary italic">Actions</span></h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Link to="/calendar" className="group">
                                <div className="p-6 rounded-[1.5rem] bg-slate-50 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all text-center">
                                    <Clock className="w-5 h-5 mx-auto mb-3 text-muted-foreground/40 group-hover:text-primary transition-all" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-all">Timeline</span>
                                </div>
                            </Link>
                            <Link to="/tasks" className="group">
                                <div className="p-6 rounded-[1.5rem] bg-slate-50 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all text-center">
                                    <Wrench className="w-5 h-5 mx-auto mb-3 text-muted-foreground/40 group-hover:text-primary transition-all" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-all">Tasks</span>
                                </div>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}

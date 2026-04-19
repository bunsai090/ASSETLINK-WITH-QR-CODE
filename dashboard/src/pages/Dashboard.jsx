import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import { Package, AlertTriangle, Wrench, CheckCircle, Clock, TrendingUp, ArrowRight, Plus, School, BarChart3, Users, ShieldCheck, CalendarDays, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, isToday, parseISO } from 'date-fns';
import { getSLAStatus } from '@/lib/slaUtils';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
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

export default function Dashboard() {
    const { currentUser } = useAuth();
    const role = currentUser?.role || 'teacher';
    const [requests, setRequests] = useState([]);
    const [assets, setAssets] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const [r, a, t, s] = await Promise.all([
                base44.entities.RepairRequest.list('-created_date', 200),
                base44.entities.Asset.list('-created_date', 200),
                base44.entities.MaintenanceTask.list('-created_date', 200),
                base44.entities.School.list('-created_date', 50),
            ]);
            setRequests(r);
            setAssets(a);
            setTasks(t);
            setSchools(s);
            setLoading(false);
        }
        load();
    }, []);

    const myTasks = tasks.filter(t =>
        t.assigned_to_email === currentUser?.email ||
        t.assigned_to_name?.toLowerCase().includes(currentUser?.full_name?.toLowerCase() || '')
    );

    const recent = requests.slice(0, 5);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 italic">Synchronizing Operational Hub...</p>
            </div>
        );
    }

    // ── PRINCIPAL DASHBOARD ──────────────────────────────────────────────
    if (role === 'principal') {
        const pendingApproval = requests.filter(r => r.status === 'Pending');
        const escalated = requests.filter(r => r.status === 'Escalated');
        const inProgress = requests.filter(r => r.status === 'In Progress');
        const completed = requests.filter(r => r.status === 'Completed');
        
        return (
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-12 pb-20"
            >
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
                    <div className="space-y-1.5">
                        <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                            Welcome back, <span className="text-primary italic">{currentUser?.full_name?.split(' ')[0] || 'Administrator'}</span> 👋
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                            Command oversight for <span className="text-foreground font-bold">Registry Analysis & Deployment</span>.
                        </p>
                        {requests.filter(r => r.scheduled_start_date && isToday(parseISO(r.scheduled_start_date)) && r.status === 'Approved').length > 0 && (
                            <div className="mt-4 bg-primary/5 border border-primary/10 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-3 w-fit shadow-sm">
                                <CalendarDays className="w-4 h-4" />
                                <span>{requests.filter(r => r.scheduled_start_date && isToday(parseISO(r.scheduled_start_date)) && r.status === 'Approved').length} repairs scheduled for today's cycle.</span>
                            </div>
                        )}
                    </div>
                    <Link to="/repair-requests">
                        <Button className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                            <AlertTriangle className="w-4 h-4 mr-3" /> Execute Case Review
                        </Button>
                    </Link>
                </motion.div>

                <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard title="Awaiting Command" value={pendingApproval.length} subtitle="Pending Approval" icon={Clock} color="amber" />
                    <StatsCard title="In Progress" value={inProgress.length} subtitle="Active Deployment" icon={Wrench} color="blue" />
                    <StatsCard title="Escalations" value={escalated.length} subtitle="Priority Intervention" icon={AlertTriangle} color="red" />
                    <StatsCard title="Finalized" value={completed.length} subtitle="Case Settlements" icon={CheckCircle} color="green" />
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-[2.5rem] border border-border p-10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-400/20" />
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-serif font-black text-foreground">Pending <span className="text-amber-600 italic">Clearance</span></h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">Institutional Priority Queue</p>
                            </div>
                            <Link to="/repair-requests">
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary gap-2 text-[10px] font-black uppercase tracking-widest">
                                    Full Registry <ArrowRight className="w-3 h-3" />
                                </Button>
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {pendingApproval.length === 0 ? (
                                <div className="text-center py-16 opacity-30">
                                    <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No pending requests identified<br/>Registry Clear</p>
                                </div>
                            ) : pendingApproval.slice(0, 6).map(req => (
                                <Link key={req.id} to="/repair-requests">
                                    <div className="flex items-center gap-5 p-5 rounded-[1.5rem] border border-border hover:bg-slate-50 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                                        <div className={cn(
                                            "w-2 h-14 rounded-full flex-shrink-0 transition-transform group-hover:scale-y-110",
                                            req.priority === 'Critical' ? 'bg-red-500' : req.priority === 'High' ? 'bg-orange-500' : 'bg-amber-500'
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-foreground truncate group-hover:text-primary transition-colors">{req.asset_name}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground/60 truncate uppercase tracking-widest mt-0.5">{req.school_name} · {req.reported_by_name}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            <StatusBadge status={req.priority} size="xs" />
                                            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tabular-nums">
                                                {req.created_date ? format(new Date(req.created_date), 'MMM dd') : ''}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-border p-10 shadow-sm flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-serif font-black text-foreground">Registry <span className="text-primary italic">Density</span></h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1 mb-8">Systemic Deployment Metrics</p>
                            
                            <div className="space-y-6">
                                {[{ label: 'Pending', count: pendingApproval.length, color: 'bg-amber-500' }, { label: 'In Progress', count: inProgress.length, color: 'bg-blue-500' }, { label: 'Finalized', count: completed.length, color: 'bg-emerald-500' }, { label: 'Escalations', count: escalated.length, color: 'bg-rose-500' }].map(({ label, count, color }) => (
                                    <div key={label}>
                                        <div className="flex justify-between text-[11px] mb-2">
                                            <span className="font-black uppercase tracking-widest text-muted-foreground/60">{label}</span>
                                            <span className="font-black tabular-nums">{count}</span>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                whileInView={{ width: requests.length > 0 ? `${(count / requests.length) * 100}%` : '0%' }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1, ease: 'circOut' }}
                                                className={cn("h-full rounded-full", color)} 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-10 p-6 bg-primary rounded-3xl text-white shadow-xl shadow-primary/20">
                            <TrendingUp className="w-8 h-8 mb-3 opacity-50" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Resolution Velocity</p>
                            <p className="text-4xl font-serif font-black tracking-tighter mt-1">{requests.length > 0 ? Math.round((completed.length / requests.length) * 100) : 0}%</p>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    // ── MAINTENANCE DASHBOARD ────────────────────────────────────────────
    if (role === 'maintenance') {
        const myAssigned = myTasks.filter(t => t.status === 'Assigned');
        const myInProgress = myTasks.filter(t => t.status === 'In Progress');
        const myCompleted = myTasks.filter(t => t.status === 'Completed');
        const myOnHold = myTasks.filter(t => t.status === 'On Hold');

        return (
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-12 pb-20"
            >
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
                    <div className="space-y-1.5">
                        <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                            Welcome back, <span className="text-primary italic">{currentUser?.full_name?.split(' ')[0] || 'Technical Corps'}</span> 👋
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                            Operational workboard for <span className="text-foreground font-bold">Infrastructure Restoration</span>.
                        </p>
                        {myTasks.filter(t => getSLAStatus(t) === 'overdue' && t.status !== 'Completed').length > 0 && (
                            <div className="mt-4 bg-rose-50 border border-rose-100 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-3 w-fit shadow-sm animate-pulse-subtle">
                                <ShieldAlert className="w-4 h-4" />
                                <span>CRITICAL: {myTasks.filter(t => getSLAStatus(t) === 'overdue' && t.status !== 'Completed').length} TASKS EXCEEDED SLA PROTOCOLS!</span>
                            </div>
                        )}
                    </div>
                    <Link to="/tasks">
                        <Button className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                            <Wrench className="w-4 h-4 mr-3" /> My Technical Queue
                        </Button>
                    </Link>
                </motion.div>

                <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard title="Assigned Tasks" value={myAssigned.length} subtitle="New Logistics" icon={Clock} color="blue" />
                    <StatsCard title="Active Work" value={myInProgress.length} subtitle="In Progress" icon={Wrench} color="amber" />
                    <StatsCard title="On Hold" value={myOnHold.length} subtitle="Paused Cycle" icon={AlertTriangle} color="red" />
                    <StatsCard title="Finalized" value={myCompleted.length} subtitle="Resolved Cases" icon={CheckCircle} color="green" />
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-[2.5rem] border border-border p-10 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-serif font-black text-foreground">Active <span className="text-primary italic">Deployments</span></h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">Field-Active Resolution Pipeline</p>
                            </div>
                            <Link to="/tasks">
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary gap-2 text-[10px] font-black uppercase tracking-widest">
                                    Full Workboard <ArrowRight className="w-3 h-3" />
                                </Button>
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {[...myAssigned, ...myInProgress].length === 0 ? (
                                <div className="text-center py-16 opacity-30">
                                    <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No active deployments<br/>System Standby</p>
                                </div>
                            ) : [...myAssigned, ...myInProgress].slice(0, 6).map(task => (
                                <Link key={task.id} to="/tasks">
                                    <div className="flex items-center gap-5 p-5 rounded-[1.5rem] border border-border hover:bg-slate-50 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                            <Wrench className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-foreground truncate group-hover:text-primary transition-colors">{task.asset_name}</p>
                                            <p className="text-[10px] font-black text-muted-foreground/60 truncate uppercase tracking-widest mt-0.5 italic">{task.school_name}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            <StatusBadge status={task.status} size="xs" />
                                            <StatusBadge status={task.priority || 'Medium'} size="xs" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-6">
                        <div className="bg-white rounded-[2.5rem] border border-border p-10 shadow-sm flex flex-col justify-between h-fit">
                             <div className="mb-6">
                                <h2 className="text-xl font-serif font-black text-foreground">Resource <span className="text-primary italic">Velocity</span></h2>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mt-1 italic">Personal Completion Index</p>
                             </div>
                             <div className="flex items-end justify-between mb-2 px-1">
                                <span className="text-[40px] font-serif font-black tracking-tighter text-primary leading-none">
                                    {myTasks.length > 0 ? Math.round((myCompleted.length / myTasks.length) * 100) : 0}%
                                </span>
                                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1 tabular-nums">{myCompleted.length}/{myTasks.length} CASES</span>
                             </div>
                             <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: myTasks.length > 0 ? `${(myCompleted.length / myTasks.length) * 100}%` : '0%' }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.2, ease: 'circOut' }}
                                    className="h-full bg-primary rounded-full" 
                                />
                             </div>
                        </div>

                        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/40 transition-all duration-700" />
                           <TrendingUp className="w-8 h-8 mb-4 opacity-30" />
                           <h3 className="text-lg font-serif font-black italic tracking-tight">Tactical Efficiency</h3>
                           <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1 leading-relaxed">System metrics indicate high-fidelity resolution speeds for your current workflow sector.</p>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    // ── SUPERVISOR DASHBOARD ─────────────────────────────────────────────
    if (role === 'supervisor') {
        const bySchool = schools.map(s => ({
            name: s.name,
            total: requests.filter(r => r.school_name === s.name).length,
            pending: requests.filter(r => r.school_name === s.name && r.status === 'Pending').length,
            inProgress: requests.filter(r => r.school_name === s.name && r.status === 'In Progress').length,
            completed: requests.filter(r => r.school_name === s.name && r.status === 'Completed').length,
            critical: requests.filter(r => r.school_name === s.name && r.priority === 'Critical').length,
        }));

        return (
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-12 pb-20"
            >
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
                    <div className="space-y-1.5">
                        <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                            Welcome back, <span className="text-primary italic">{currentUser?.full_name?.split(' ')[0] || 'District Head'}</span> 👋
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                            Jurisdictional monitoring for <span className="text-foreground font-bold">Regional Asset Deployment</span>.
                        </p>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard title="Institution Registry" value={schools.length} subtitle="Active Campuses" icon={School} color="teal" />
                    <StatsCard title="Total Inventory" value={assets.length} subtitle="Jurisdictional Assets" icon={Package} color="blue" />
                    <StatsCard title="Operational Gaps" value={requests.filter(r => !['Completed', 'Rejected'].includes(r.status)).length} subtitle="Open Requests" icon={AlertTriangle} color="amber" />
                    <StatsCard title="Intervention Alert" value={requests.filter(r => r.priority === 'Critical').length} subtitle="Critical Registry" icon={ShieldCheck} color="red" />
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-[2.5rem] border border-border p-10 shadow-sm">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="text-2xl font-serif font-black text-foreground">Regional <span className="text-primary italic">Registry</span></h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">Multi-Institutional Intelligence</p>
                            </div>
                        </div>
                        {bySchool.length === 0 ? (
                            <div className="text-center py-20 opacity-20">
                                <School className="w-16 h-16 mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No institutional registry units detected</p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-6">
                                {bySchool.map(s => (
                                    <div key={s.name} className="p-6 rounded-[2rem] border border-border bg-slate-50/50 hover:bg-white hover:border-primary/20 hover:shadow-xl transition-all duration-300 group">
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <p className="text-xs font-black text-muted-foreground/30 uppercase tracking-widest italic leading-none truncate">Campus Sector</p>
                                                <p className="font-serif font-black text-foreground group-hover:text-primary transition-colors mt-1 leading-tight line-clamp-1">{s.name}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {s.critical > 0 && (
                                                    <div className="w-6 h-6 rounded-lg bg-rose-600 flex items-center justify-center text-white text-[10px] font-black animate-pulse-subtle shadow-lg shadow-rose-200">!</div>
                                                )}
                                                <span className="text-[10px] font-black tabular-nums text-muted-foreground/60 bg-white border border-border px-2 py-1 rounded-md">{s.total}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[{ label: 'Wait', val: s.pending, col: 'text-amber-600' }, { label: 'Active', val: s.inProgress, col: 'text-blue-600' }, { label: 'Done', val: s.completed, col: 'text-emerald-600' }].map(({ label, val, col }) => (
                                                <div key={label} className="bg-white rounded-xl py-3 border border-border/50 text-center shadow-inner">
                                                    <p className={cn("text-lg font-serif font-black", col)}>{val}</p>
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">{label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-rose-50 rounded-[2.5rem] border border-rose-100 p-10 shadow-sm flex flex-col h-full max-h-[600px]">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-serif font-black text-rose-600">Escalation <span className="text-rose-400 italic">Queue</span></h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600/40 mt-1 italic leading-none">Intervention Required</p>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            {requests.filter(r => r.status === 'Escalated').length === 0 ? (
                                <div className="text-center py-20 opacity-30">
                                    <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Intervention Ledger Clear</p>
                                </div>
                            ) : requests.filter(r => r.status === 'Escalated').map(req => (
                                <div key={req.id} className="p-6 rounded-[1.5rem] bg-white border border-rose-100 shadow-sm group hover:border-rose-400 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-600/50 italic">Strategic Alert</p>
                                        <StatusBadge status="Escalated" size="xs" />
                                    </div>
                                    <p className="text-sm font-black text-foreground group-hover:text-rose-600 transition-colors truncate">{req.asset_name}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase mt-1 truncate">{req.school_name} · Sector {req.location || 'N/A'}</p>
                                    <div className="mt-3 p-3 bg-rose-50/50 rounded-xl border border-rose-100 italic">
                                        <p className="text-[10px] font-bold text-rose-700/60 leading-relaxed">&ldquo;{req.escalated_reason || 'Registry unspecified escalation manual required.'}&rdquo;</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12 pb-20"
        >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
                <div className="space-y-1.5">
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                        Welcome back, <span className="text-primary italic">{currentUser?.full_name?.split(' ')[0] || 'Member'}</span> 👋
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        Operational intelligence for <span className="text-foreground font-bold">Campus Infrastructure Registry</span>.
                    </p>
                </div>
                {(role === 'teacher' || role === 'admin') && (
                    <Link to="/report-damage">
                        <Button className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                            <Plus className="w-4 h-4 mr-3" /> Report Protocol Violation
                        </Button>
                    </Link>
                )}
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Total Registry" value={assets.length} subtitle="Institutional Assets" icon={Package} color="teal" />
                <StatsCard title="Awaiting Command" value={requests.filter(r => r.status === 'Pending').length} subtitle="Pending Repairs" icon={Clock} color="amber" />
                <StatsCard title="Active Protocol" value={requests.filter(r => r.status === 'In Progress').length} subtitle="Active Repairs" icon={Wrench} color="blue" />
                <StatsCard title="Intervention Alert" value={requests.filter(r => r.priority === 'Critical').length} subtitle="Critical Registry" icon={AlertTriangle} color="red" />
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-[2.5rem] border border-border p-10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-serif font-black text-foreground">Logistics <span className="text-primary italic">Registry</span></h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1 italic">Recent Protocol Adaptations</p>
                        </div>
                        <Link to="/repair-requests">
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary gap-2 text-[10px] font-black uppercase tracking-widest">
                                Full History <ArrowRight className="w-3 h-3" />
                            </Button>
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {recent.length === 0 ? (
                            <div className="text-center py-20 opacity-30">
                                <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Registry Empty<br/>No historical records found</p>
                            </div>
                        ) : recent.map(req => (
                            <Link key={req.id} to={`/repair-requests?id=${req.id}`}>
                                <div className="flex items-center gap-5 p-5 rounded-[1.5rem] border border-border hover:bg-slate-50 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                        <Wrench className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-foreground truncate group-hover:text-primary transition-colors">{req.asset_name}</p>
                                        <p className="text-[10px] font-black text-muted-foreground/60 truncate uppercase tracking-widest mt-0.5 line-clamp-1 italic">{req.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                        <StatusBadge status={req.status} size="xs" />
                                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tabular-nums">
                                            {req.created_date ? format(new Date(req.created_date), 'MMM dd') : ''}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-border p-10 shadow-sm h-fit">
                        <h2 className="text-2xl font-serif font-black text-foreground mb-1">Inflow <span className="text-primary italic">Log</span></h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mb-8 italic leading-none">Operational Stage Distribution</p>
                        
                        <div className="space-y-6">
                            {[
                                { label: 'Awaiting Cmd', count: requests.filter(r => r.status === 'Pending').length, total: requests.length, color: 'bg-amber-500' },
                                { label: 'Active Cycle', count: requests.filter(r => r.status === 'In Progress').length, total: requests.length, color: 'bg-blue-500' },
                                { label: 'Settlement', count: requests.filter(r => r.status === 'Completed').length, total: requests.length, color: 'bg-emerald-500' },
                            ].map(({ label, count, total, color }) => (
                                <div key={label}>
                                    <div className="flex justify-between text-[11px] mb-2 px-1">
                                        <span className="font-black uppercase tracking-widest text-muted-foreground/50">{label}</span>
                                        <span className="font-black text-foreground tabular-nums">{count}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            whileInView={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1, ease: 'circOut' }}
                                            className={cn("h-full rounded-full", color)} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-primary rounded-[2.5rem] p-10 text-white shadow-2xl shadow-primary/20 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all duration-700" />
                        <TrendingUp className="w-8 h-8 mb-4 opacity-50" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Settlement Velocity</p>
                        <p className="text-[40px] font-serif font-black tracking-tighter mt-1 leading-none italic">
                            {requests.length > 0 ? Math.round((requests.filter(r => r.status === 'Completed').length / requests.length) * 100) : 0}%
                        </p>
                        <p className="text-[9px] font-bold opacity-40 mt-2 uppercase tracking-widest">Protocol Fulfillment Rate</p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
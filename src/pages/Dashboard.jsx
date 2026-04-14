import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import { Package, AlertTriangle, Wrench, CheckCircle, Clock, TrendingUp, ArrowRight, Plus, School, BarChart3, Users, ShieldCheck, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, isToday, isAfter, parseISO } from 'date-fns';
import { getSLAStatus } from '@/lib/slaUtils';

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
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin" />
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
            <div className="space-y-8 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Principal Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Review and prioritize repair requests for your school.</p>
                        {requests.filter(r => r.scheduled_start_date && isToday(parseISO(r.scheduled_start_date)) && r.status === 'Approved').length > 0 && (
                            <div className="mt-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2 text-sm text-teal-700 flex items-center gap-2 w-fit">
                                <CalendarDays className="w-4 h-4" />
                                <span>{requests.filter(r => r.scheduled_start_date && isToday(parseISO(r.scheduled_start_date)) && r.status === 'Approved').length} repairs scheduled to start today.</span>
                            </div>
                        )}
                    </div>
                    <Link to="/repair-requests">
                        <Button className="bg-teal hover:bg-teal/90 text-white gap-2"><AlertTriangle className="w-4 h-4" /> Review Requests</Button>
                    </Link>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard title="Awaiting Approval" value={pendingApproval.length} subtitle="Need your action" icon={Clock} color="amber" />
                    <StatsCard title="In Progress" value={inProgress.length} subtitle="Assigned to staff" icon={Wrench} color="blue" />
                    <StatsCard title="Escalated" value={escalated.length} subtitle="Needs higher authority" icon={AlertTriangle} color="red" />
                    <StatsCard title="Completed" value={completed.length} subtitle="Resolved repairs" icon={CheckCircle} color="green" />
                </div>
                {/* Pending approval list */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-semibold text-foreground">Pending Your Approval</h2>
                        <Link to="/repair-requests"><Button variant="ghost" size="sm" className="text-teal gap-1 text-xs">View all <ArrowRight className="w-3 h-3" /></Button></Link>
                    </div>
                    <div className="space-y-3">
                        {pendingApproval.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No pending requests — you're all caught up!</p>
                            </div>
                        ) : pendingApproval.slice(0, 6).map(req => (
                            <Link key={req.id} to="/repair-requests">
                                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer">
                                    <div className={`w-1.5 h-12 rounded-full flex-shrink-0 ${req.priority === 'Critical' ? 'bg-red-500' : req.priority === 'High' ? 'bg-orange-400' : 'bg-amber-400'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{req.asset_name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{req.description}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{req.school_name} · {req.reported_by_name}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <StatusBadge status={req.priority} />
                                        <span className="text-xs text-muted-foreground">{req.created_date ? format(new Date(req.created_date), 'MMM d') : ''}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
                {/* Progress overview */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <h2 className="text-base font-semibold text-foreground mb-4">Overall Progress</h2>
                    <div className="space-y-3">
                        {[{ label: 'Pending', count: pendingApproval.length, color: 'bg-amber-400' }, { label: 'In Progress', count: inProgress.length, color: 'bg-blue-400' }, { label: 'Completed', count: completed.length, color: 'bg-emerald-400' }, { label: 'Escalated', count: escalated.length, color: 'bg-purple-400' }].map(({ label, count, color }) => (
                            <div key={label}>
                                <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">{label}</span><span className="font-medium">{count}</span></div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: requests.length > 0 ? `${(count / requests.length) * 100}%` : '0%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── MAINTENANCE DASHBOARD ────────────────────────────────────────────
    if (role === 'maintenance') {
        const myAssigned = myTasks.filter(t => t.status === 'Assigned');
        const myInProgress = myTasks.filter(t => t.status === 'In Progress');
        const myCompleted = myTasks.filter(t => t.status === 'Completed');
        const myOnHold = myTasks.filter(t => t.status === 'On Hold');
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">My Workboard</h1>
                        <p className="text-muted-foreground mt-1">Hello {currentUser?.full_name?.split(' ')[0]} — here are your assigned tasks.</p>
                        {myTasks.filter(t => getSLAStatus(t) === 'overdue' && t.status !== 'Completed').length > 0 && (
                            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-700 flex items-center gap-2 w-fit">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Critical: {myTasks.filter(t => getSLAStatus(t) === 'overdue' && t.status !== 'Completed').length} tasks are past the SLA deadline!</span>
                            </div>
                        )}
                    </div>
                    <Link to="/tasks">
                        <Button className="bg-teal hover:bg-teal/90 text-white gap-2"><Wrench className="w-4 h-4" /> View All Tasks</Button>
                    </Link>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard title="Assigned" value={myAssigned.length} subtitle="New tasks" icon={Clock} color="blue" />
                    <StatsCard title="In Progress" value={myInProgress.length} subtitle="Active work" icon={Wrench} color="amber" />
                    <StatsCard title="On Hold" value={myOnHold.length} subtitle="Paused" icon={AlertTriangle} color="red" />
                    <StatsCard title="Completed" value={myCompleted.length} subtitle="Done" icon={CheckCircle} color="green" />
                </div>
                {/* Active tasks */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-semibold text-foreground">Active Tasks</h2>
                        <Link to="/tasks"><Button variant="ghost" size="sm" className="text-teal gap-1 text-xs">View all <ArrowRight className="w-3 h-3" /></Button></Link>
                    </div>
                    <div className="space-y-3">
                        {[...myAssigned, ...myInProgress].length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No active tasks right now</p>
                            </div>
                        ) : [...myAssigned, ...myInProgress].slice(0, 6).map(task => (
                            <Link key={task.id} to="/tasks">
                                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer">
                                    <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
                                        <Wrench className="w-4 h-4 text-teal" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{task.asset_name}</p>
                                        <p className="text-xs text-muted-foreground">{task.school_name}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <StatusBadge status={task.status} />
                                        <StatusBadge status={task.priority || 'Medium'} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
                {/* Completion bar */}
                <div className="bg-gradient-to-br from-teal to-teal/70 rounded-2xl p-6 text-white">
                    <p className="text-sm font-medium opacity-80 mb-1">Your Completion Rate</p>
                    <p className="text-4xl font-bold">{myTasks.length > 0 ? Math.round((myCompleted.length / myTasks.length) * 100) : 0}%</p>
                    <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: myTasks.length > 0 ? `${(myCompleted.length / myTasks.length) * 100}%` : '0%' }} />
                    </div>
                    <p className="text-xs opacity-70 mt-2">{myCompleted.length} of {myTasks.length} tasks completed</p>
                </div>
            </div>
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

    // ── TEACHER / ADMIN DASHBOARD (default) ─────────────────────────────
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Welcome back, {currentUser?.full_name?.split(' ')[0] || 'User'} 👋
                    </h1>
                    <p className="text-muted-foreground mt-1">Here's what's happening with your school assets today.</p>
                </div>
                {(role === 'teacher' || role === 'admin') && (
                    <Link to="/report-damage">
                        <Button className="bg-teal hover:bg-teal/90 text-white gap-2">
                            <Plus className="w-4 h-4" /> Report Damage
                        </Button>
                    </Link>
                )}
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
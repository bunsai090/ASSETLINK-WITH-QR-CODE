import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import { AlertTriangle, Wrench, CheckCircle, Clock, ArrowUpRight, TrendingUp, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSLAStatus } from '@/lib/slaUtils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function MaintenanceDashboard() {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;
        const tasksQuery = query(collection(db, 'maintenance_tasks'));
        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const list = snapshot.docs.map(doc => /** @type {any} */({ ...doc.data(), id: doc.id }));
            const sorted = list.sort((a, b) => {
                const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(0);
                const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(0);
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
    const activeTasks = [...myAssigned, ...myInProgress];
    const resolutionRate = myTasks.length > 0 ? Math.round((myCompleted.length / myTasks.length) * 100) : 0;

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
                        Workboard
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Hello, {currentUser?.full_name?.split(' ')[0] || 'Staff'} · {myTasks.length} assigned tasks
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {overdueTasks.length > 0 && (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-rose-50 border border-rose-200/60">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                            <span className="label-mono text-rose-600">{overdueTasks.length} overdue</span>
                        </div>
                    )}
                    <Link to="/tasks">
                        <Button size="sm" className="h-8 px-3 text-xs font-medium bg-primary hover:bg-primary/90 text-white rounded-lg gap-1.5">
                            <Wrench className="w-3.5 h-3.5" />
                            Manage Tasks
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Assigned" value={myAssigned.length} subtitle="New deployment" icon={Clock} color="blue" />
                <StatsCard title="Active" value={myInProgress.length} subtitle="In operation" icon={Wrench} color="amber" />
                <StatsCard title="On Hold" value={myOnHold.length} subtitle="Blocked items" icon={AlertTriangle} color="red" />
                <StatsCard title="Completed" value={myCompleted.length} subtitle="Resolved" icon={CheckCircle} color="teal" />
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-4">
                {/* Active Task Queue */}
                <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Operational Queue</h2>
                            <p className="label-mono text-muted-foreground mt-0.5">Active maintenance tasks</p>
                        </div>
                        <Link to="/tasks">
                            <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground">
                                View all <ArrowUpRight className="w-3 h-3" />
                            </Button>
                        </Link>
                    </div>

                    {activeTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <CheckCircle className="w-8 h-8 text-emerald-500/30 mb-3" />
                            <p className="text-sm font-medium text-muted-foreground/60">No active tasks</p>
                            <p className="text-xs text-muted-foreground/40 mt-1">Your queue is fully clear.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-2.5 bg-muted/30">
                                <span className="label-mono">Asset / Location</span>
                                <span className="label-mono">Status</span>
                                <span className="label-mono">Date</span>
                            </div>
                            {activeTasks.slice(0, 5).map((task) => (
                                <Link key={task.id} to="/tasks">
                                    <div className="data-row grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-muted/30 transition-colors">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{task.asset_name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                {task.school_name || 'Campus-Wide'} · {task.priority || 'Normal'}
                                            </p>
                                        </div>
                                        <StatusBadge status={task.status} size="sm" />
                                        <span className="label-mono text-muted-foreground/50 text-right">
                                            {task.created_at ? format(task.created_at.toDate(), 'MMM d') : 'Recent'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div className="space-y-4">
                    {/* Performance card */}
                    <div className="bg-[hsl(222,47%,9%)] border border-[hsl(222,35%,16%)] rounded-xl p-5 text-white">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="label-mono text-white/40">Performance</span>
                        </div>
                        <div className="text-5xl font-bold text-white tracking-tight leading-none">
                            {resolutionRate}<span className="text-2xl text-white/40">%</span>
                        </div>
                        <p className="text-xs text-white/40 mt-3">
                            {myCompleted.length} / {myTasks.length} tasks resolved
                        </p>
                        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                style={{ width: `${resolutionRate}%` }}
                            />
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-card border border-border rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <Link to="/calendar">
                                <div className="p-4 rounded-lg bg-muted/50 hover:bg-muted border border-border hover:border-border/80 transition-all text-center group">
                                    <CalendarDays className="w-4 h-4 mx-auto mb-2 text-muted-foreground group-hover:text-foreground transition-colors" />
                                    <span className="label-mono text-muted-foreground group-hover:text-foreground transition-colors">Schedule</span>
                                </div>
                            </Link>
                            <Link to="/tasks">
                                <div className="p-4 rounded-lg bg-muted/50 hover:bg-muted border border-border hover:border-border/80 transition-all text-center group">
                                    <Wrench className="w-4 h-4 mx-auto mb-2 text-muted-foreground group-hover:text-foreground transition-colors" />
                                    <span className="label-mono text-muted-foreground group-hover:text-foreground transition-colors">Tasks</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

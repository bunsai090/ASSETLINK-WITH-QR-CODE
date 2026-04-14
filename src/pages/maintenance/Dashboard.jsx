import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import { AlertTriangle, Wrench, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSLAStatus } from '@/lib/slaUtils';

export default function MaintenanceDashboard() {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await base44.entities.MaintenanceTask.list('-created_date', 200);
            setTasks(data);
            setLoading(false);
        }
        load();
    }, []);

    const myTasks = tasks.filter(t =>
        t.assigned_to_email === currentUser?.email ||
        t.assigned_to_name?.toLowerCase().includes(currentUser?.full_name?.toLowerCase() || '')
    );

    const myAssigned = myTasks.filter(t => t.status === 'Assigned');
    const myInProgress = myTasks.filter(t => t.status === 'In Progress');
    const myCompleted = myTasks.filter(t => t.status === 'Completed');
    const myOnHold = myTasks.filter(t => t.status === 'On Hold');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin" />
            </div>
        );
    }

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

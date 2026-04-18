import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
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
        if (!currentUser) return;

        const tasksQuery = query(
            collection(db, 'maintenance_tasks')
        );

        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Client-side sorting by date (descending)
            const sorted = tasksList.sort((a, b) => {
                const dateA = a.created_at?.toDate?.() ?? new Date(0);
                const dateB = b.created_at?.toDate?.() ?? new Date(0);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-teal/20 border-t-teal rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-1">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight italic">Personnel Workboard</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Hello, {currentUser?.full_name?.split(' ')[0] || 'Staff'} — Tracking your assigned tasks.</p>
                    
                    {myTasks.filter(t => getSLAStatus(t) === 'overdue' && t.status !== 'Completed').length > 0 && (
                        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-2 text-xs font-bold text-red-600 flex items-center gap-2 w-fit shadow-sm">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>ATTENTION: {myTasks.filter(t => getSLAStatus(t) === 'overdue' && t.status !== 'Completed').length} TASKS EXCEEDED SLA DEADLINE</span>
                        </div>
                    )}
                </div>
                <Link to="/tasks">
                    <Button className="bg-teal hover:bg-teal/90 text-white gap-2 font-bold h-11 px-6 rounded-xl shadow-lg shadow-teal/20">
                        <Wrench className="w-4 h-4" /> My Tasks
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Assigned" value={myAssigned.length} subtitle="New pipeline" icon={Clock} color="blue" />
                <StatsCard title="Active" value={myInProgress.length} subtitle="Under repair" icon={Wrench} color="amber" />
                <StatsCard title="On Hold" value={myOnHold.length} subtitle="Blocked" icon={AlertTriangle} color="red" />
                <StatsCard title="Total Done" value={myCompleted.length} subtitle="History" icon={CheckCircle} color="teal" />
            </div>

            {/* Active tasks */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm overflow-hidden relative">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-base font-bold text-foreground">Active Workload</h2>
                    <Link to="/tasks">
                        <Button variant="ghost" size="sm" className="text-teal hover:text-teal hover:bg-teal/5 gap-1 text-xs font-bold uppercase tracking-widest">
                            Manager <ArrowRight className="w-3 h-3" />
                        </Button>
                    </Link>
                </div>
                <div className="space-y-3">
                    {[...myAssigned, ...myInProgress].length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest">Workspace is clear</p>
                        </div>
                    ) : [...myAssigned, ...myInProgress].slice(0, 5).map(task => (
                        <Link key={task.id} to="/tasks">
                            <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                                <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <Wrench className="w-5 h-5 text-teal" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-foreground truncate uppercase tracking-tight">{task.asset_name}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{task.school_name || 'Assigned School'}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                    <StatusBadge status={task.status} />
                                    <StatusBadge status={task.priority || 'Medium'} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Performance Overview */}
            <div className="bg-gradient-to-br from-teal to-teal/80 rounded-2xl p-7 text-white shadow-xl shadow-teal/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform duration-700">
                    <CheckCircle className="w-32 h-32" />
                </div>
                <div className="relative">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Efficiency Rating</p>
                    <p className="text-5xl font-black italic">
                        {myTasks.length > 0 ? Math.round((myCompleted.length / myTasks.length) * 100) : 0}%
                    </p>
                    <div className="mt-5 h-2.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <div 
                            className="h-full bg-white rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: myTasks.length > 0 ? `${(myCompleted.length / myTasks.length) * 100}%` : '0%' }}
                        />
                    </div>
                    <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-widest opacity-70">
                        <span>Performance Goal</span>
                        <span>{myCompleted.length} / {myTasks.length} Completed</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin" />
            </div>
        );
    }

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
                                    <span className="text-xs text-muted-foreground">{req.created_at ? format(req.created_at.toDate(), 'MMM d') : ''}</span>
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

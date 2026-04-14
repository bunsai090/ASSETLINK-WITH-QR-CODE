// @ts-nocheck
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, ShieldAlert, MapPin, Clock, CalendarDays } from 'lucide-react';
import { isBefore, parseISO, isAfter } from 'date-fns';
import { Button } from '@/components/ui/button';
import StatusBadge from '../components/StatusBadge';
import StatsCard from '../components/StatsCard';
import { format, subDays } from 'date-fns';

const COLORS = ['#0d9488', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function SupervisorOversight() {
    const { currentUser } = useAuth();
    const role = currentUser?.role || 'supervisor';
    const [requests, setRequests] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterSchool, setFilterSchool] = useState('all');

    useEffect(() => {
        async function load() {
            const [r, s, t] = await Promise.all([
                base44.entities.RepairRequest.list('-created_date', 1000),
                base44.entities.School.list('-created_date', 100),
                base44.entities.MaintenanceTask.list('-created_date', 1000),
            ]);
            setRequests(r || []);
            setSchools(s || []);
            setTasks(t || []);
            setLoading(false);
        }
        load();
    }, []);

    // Filter by school if selected
    const filtered = filterSchool === 'all' 
        ? requests 
        : requests.filter(r => r.school_name === filterSchool);

    // Escalation queue - only Escalated status
    const escalatedRequests = filtered.filter(r => r.status === 'Escalated');

    // Repairs per school
    const schoolMetrics = schools.map(school => {
        const schoolRequests = requests.filter(r => r.school_name === school.name);
        const schoolTasks = tasks.filter(t => t.school_name === school.name);
        const completedOnTime = schoolTasks.filter(t => t.status === 'Completed' && t.completion_date && t.sla_deadline && !isAfter(parseISO(t.completion_date), parseISO(t.sla_deadline))).length;
        const totalCompleted = schoolTasks.filter(t => t.status === 'Completed').length;
        
        return {
            name: school.name,
            pending: schoolRequests.filter(r => r.status === 'Pending').length,
            approved: schoolRequests.filter(r => r.status === 'Approved').length,
            inProgress: schoolRequests.filter(r => r.status === 'In Progress').length,
            completed: totalCompleted,
            escalated: schoolRequests.filter(r => r.status === 'Escalated').length,
            onTimeRate: totalCompleted > 0 ? Math.round((completedOnTime / totalCompleted) * 100) : 0,
            avgReschedule: schoolTasks.length > 0 ? (schoolTasks.reduce((sum, t) => sum + (t.reschedule_count || 0), 0) / schoolTasks.length).toFixed(1) : 0
        };
    });

    // Cost tracking by school (actual_cost from tasks)
    const schoolCosts = schools.map(school => {
        const schoolRequests = requests.filter(r => r.school_name === school.name);
        const totalCost = schoolRequests.reduce((sum, r) => {
            return sum + (parseFloat(r.estimated_cost) || 0);
        }, 0);
        return {
            name: school.name.length > 15 ? school.name.slice(0, 15) + '...' : school.name,
            cost: totalCost,
        };
    }).filter(s => s.cost > 0).sort((a, b) => b.cost - a.cost).slice(0, 8);

    // Status distribution
    const statusData = ['Pending', 'Approved', 'In Progress', 'Completed', 'Escalated'].map(s => ({
        name: s,
        value: filtered.filter(r => r.status === s).length,
    })).filter(d => d.value > 0);

    // Timeline - repairs over last 14 days
    const timeline = Array.from({ length: 14 }, (_, i) => {
        const d = subDays(new Date(), 13 - i);
        const dateStr = format(d, 'yyyy-MM-dd');
        return {
            date: format(d, 'MMM d'),
            new: filtered.filter(r => r.created_date?.startsWith(dateStr)).length,
            completed: filtered.filter(r => r.completed_date?.startsWith(dateStr)).length,
        };
    });

    const stats = {
        total: filtered.length,
        escalated: escalatedRequests.length,
        avgResolutionTime: (() => {
            const completed = filtered.filter(r => r.status === 'Completed' && r.created_date && r.completed_date);
            if (!completed.length) return 0;
            const avg = completed.reduce((sum, r) => {
                const diff = new Date(r.completed_date).getTime() - new Date(r.created_date).getTime();
                return sum + diff / (1000 * 60 * 60 * 24);
            }, 0) / completed.length;
            return Math.round(avg);
        })(),
        criticalCount: filtered.filter(r => r.priority === 'Critical' && !['Completed', 'Rejected'].includes(r.status)).length,
    };

    if (loading) {
        return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Oversight Dashboard</h1>
                    <p className="text-muted-foreground text-sm mt-1">Multi-school repair monitoring & escalation management</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatsCard title="On-Time Delivery" value={(() => {
                    const completedTasks = tasks.filter(t => t.status === 'Completed' && t.completion_date && t.sla_deadline);
                    if (completedTasks.length === 0) return '0%';
                    const onTimeCount = completedTasks.filter(t => !isAfter(parseISO(t.completion_date), parseISO(t.sla_deadline))).length;
                    return Math.round((onTimeCount / completedTasks.length) * 100) + '%';
                })()} icon={Clock} color="text-teal-600 bg-teal-100" />
                <StatsCard title="Avg Reschedules" value={(() => {
                    if (tasks.length === 0) return '0.0';
                    const avg = tasks.reduce((sum, t) => sum + (t.reschedule_count || 0), 0) / tasks.length;
                    return avg.toFixed(1);
                })()} icon={CalendarDays} color="text-amber-600 bg-amber-100" />
                <StatsCard title="Escalated" value={stats.escalated} icon={ShieldAlert} color="text-red-600 bg-red-100" />
                <StatsCard title="Critical Open" value={stats.criticalCount} icon={AlertTriangle} color="text-orange-600 bg-orange-100" />
            </div>

            {/* School Filter */}
            <div className="flex gap-2 flex-wrap">
                <Button 
                    onClick={() => setFilterSchool('all')}
                    variant={filterSchool === 'all' ? 'default' : 'outline'}
                    size="sm"
                    className={filterSchool === 'all' ? 'bg-teal hover:bg-teal/90 text-white' : ''}
                >
                    All Schools
                </Button>
                {schools.map(school => (
                    <Button 
                        key={school.id}
                        onClick={() => setFilterSchool(school.name)}
                        variant={filterSchool === school.name ? 'default' : 'outline'}
                        size="sm"
                        className={filterSchool === school.name ? 'bg-teal hover:bg-teal/90 text-white' : ''}
                    >
                        {school.name.slice(0, 12)}
                    </Button>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Distribution */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-semibold text-foreground mb-4">Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" label>
                                {statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* On-Time Performance by School */}
                <div className="bg-card rounded-2xl border border-border p-6 lg:col-span-2">
                    <h3 className="font-semibold text-foreground mb-4">On-Time Performance (%)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={schoolMetrics.slice(0, 6)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={10} interval={0} />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Bar dataKey="onTimeRate" name="On-Time %" fill="#0d9488" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Escalation Queue */}
            {escalatedRequests.length > 0 && (
                <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <h3 className="font-semibold text-foreground">Escalation Queue ({escalatedRequests.length})</h3>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {escalatedRequests.map(req => (
                            <div key={req.id} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-red-100">
                                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-foreground">{req.asset_name}</p>
                                    <p className="text-xs text-muted-foreground">{req.school_name}</p>
                                    <p className="text-xs text-red-600 mt-1">{req.escalated_reason}</p>
                                </div>
                                <StatusBadge status={req.priority} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Timeline Chart */}
            <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">Repair Activity (Last 14 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeline}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="new" stroke="#3b82f6" name="New Repairs" strokeWidth={2} />
                        <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Costs by School */}
            {schoolCosts.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="font-semibold text-foreground mb-4">Resource Allocation (Estimated Costs)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={schoolCosts} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={120} fontSize={11} />
                            <Tooltip formatter={(value) => `PHP ${value}`} />
                            <Bar dataKey="cost" fill="#0d9488" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

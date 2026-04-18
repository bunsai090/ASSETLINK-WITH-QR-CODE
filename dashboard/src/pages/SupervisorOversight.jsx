// @ts-nocheck
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, ShieldAlert, MapPin, Clock, CalendarDays, CheckCircle } from 'lucide-react';
import { isBefore, parseISO, isAfter, format, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import StatusBadge from '../components/StatusBadge';
import StatsCard from '../components/StatsCard';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
        <div className="space-y-12 animate-fade-in pb-20 relative z-10 font-sans">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-1.5">
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                        Strategic <span className="text-primary italic">Oversight</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        Multi-institutional infrastructure monitoring and escalation authority.
                    </p>
                </div>
            </div>

            {/* Tactical Metrics Hub */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Strategic SLA', val: (() => {
                        const completedTasks = tasks.filter(t => t.status === 'Completed' && t.completion_date && t.sla_deadline);
                        if (completedTasks.length === 0) return '100%';
                        const onTimeCount = completedTasks.filter(t => !isAfter(parseISO(t.completion_date), parseISO(t.sla_deadline))).length;
                        return Math.round((onTimeCount / completedTasks.length) * 100) + '%';
                    })(), icon: Clock, color: 'text-primary' },
                    { label: 'Cycle Friction', val: (() => {
                        if (tasks.length === 0) return '0.0';
                        const avg = tasks.reduce((sum, t) => sum + (t.reschedule_count || 0), 0) / tasks.length;
                        return avg.toFixed(1);
                    })(), icon: CalendarDays, color: 'text-amber-600' },
                    { label: 'Escalation Protocol', val: stats.escalated, icon: ShieldAlert, color: 'text-rose-600' },
                    { label: 'Critical Assets', val: stats.criticalCount, icon: AlertTriangle, color: 'text-orange-600' }
                ].map((kpi, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={kpi.label} 
                        className="bg-white p-6 rounded-[2rem] border border-border shadow-sm flex flex-col gap-4 group hover:shadow-xl transition-all duration-500"
                    >
                        <div className="flex items-center justify-between">
                            <div className={cn("w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-white transition-all duration-500", kpi.color)}>
                                <kpi.icon className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{kpi.label}</span>
                                <span className={cn("text-3xl font-serif font-black tracking-tighter", kpi.color)}>{kpi.val}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Strategic Filters */}
            <div className="flex gap-3 flex-wrap bg-white p-2 rounded-2xl border border-border shadow-sm w-fit">
                <Button 
                    onClick={() => setFilterSchool('all')}
                    variant="ghost"
                    className={cn(
                        "h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        filterSchool === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-slate-50'
                    )}
                >
                    Universal Registry
                </Button>
                {schools.map(school => (
                    <Button 
                        key={school.id}
                        onClick={() => setFilterSchool(school.name)}
                        variant="ghost"
                        className={cn(
                            "h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            filterSchool === school.name ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-slate-50'
                        )}
                    >
                        {school.name.length > 20 ? school.name.slice(0, 18) + '...' : school.name}
                    </Button>
                ))}
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Status Distribution */}
                <div className="bg-white rounded-[2.5rem] border border-border p-10 shadow-sm flex flex-col">
                    <div className="mb-8">
                        <h3 className="text-xl font-serif font-black text-foreground">Status <span className="text-primary italic">Density</span></h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">Operational Stage Classification</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} dataKey="value" stroke="none">
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'white', 
                                        borderRadius: '24px', 
                                        border: '1px solid #e2e8f0', 
                                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
                                        padding: '16px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        fontFamily: 'Fraunces, serif'
                                    }} 
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        {statusData.map((d, i) => (
                            <div key={d.name} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-border">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{d.name}</span>
                                    <span className="text-sm font-black text-foreground">{d.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Delivery Performance */}
                <div className="bg-white rounded-[2.5rem] border border-border p-10 shadow-sm lg:col-span-2">
                    <div className="mb-8 flex justify-between items-end">
                        <div>
                            <h3 className="text-xl font-serif font-black text-foreground">Regional <span className="text-primary italic">Accuracy</span></h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">SLA Compliance Index (%)</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={380}>
                        <BarChart data={schoolMetrics.slice(0, 6)} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                fontSize={10} 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontWeight: 800 }} 
                                dy={10}
                            />
                            <YAxis 
                                domain={[0, 100]} 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontWeight: 800 }} 
                            />
                            <Tooltip 
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ 
                                    backgroundColor: 'white', 
                                    borderRadius: '24px', 
                                    border: '1px solid #e2e8f0', 
                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
                                    padding: '16px',
                                    fontSize: '12px',
                                    fontFamily: 'Fraunces, serif'
                                }} 
                            />
                            <Bar dataKey="onTimeRate" name="Compliance Rate" fill="#054a29" radius={[12, 12, 4, 4]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tactical Intelligence Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Escalation Queue */}
                <div className={cn(
                    "rounded-[2.5rem] border p-10 shadow-sm flex flex-col",
                    escalatedRequests.length > 0 ? "bg-rose-50 border-rose-100" : "bg-white border-border"
                )}>
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-serif font-black text-foreground">Authority <span className="text-rose-600 italic">Intervention</span></h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">Escalated Lifecycle Protocols</p>
                        </div>
                        {escalatedRequests.length > 0 && (
                            <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-xl shadow-rose-200 animate-pulse-subtle">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {escalatedRequests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                                <CheckCircle className="w-12 h-12 text-primary mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">System Integrity Clear<br/>No active escalations detected</p>
                            </div>
                        ) : (
                            escalatedRequests.map(req => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={req.id} 
                                    className="flex flex-col gap-3 bg-white p-6 rounded-3xl border border-rose-100 shadow-sm group hover:border-rose-300 transition-all"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-600/40">Urgent Intervention</span>
                                            <p className="font-serif font-black text-foreground group-hover:text-rose-600 transition-colors leading-tight">{req.asset_name}</p>
                                        </div>
                                        <StatusBadge status={req.priority} size="xs" />
                                    </div>
                                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{req.school_name || 'District Campus'}</p>
                                    <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 mt-1">
                                        <p className="text-[10px] font-bold text-rose-700 italic leading-relaxed">&ldquo;{req.escalated_reason}&rdquo;</p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Repair Timeline */}
                <div className="bg-white rounded-[2.5rem] border border-border p-10 shadow-sm lg:col-span-2">
                    <div className="mb-8">
                        <h3 className="text-xl font-serif font-black text-foreground">Tactical <span className="text-primary italic">Velocity</span></h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">14-Day Distribution Cycle</p>
                    </div>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={timeline} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="date" 
                                fontSize={10} 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontWeight: 800 }} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontWeight: 800 }} 
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'white', 
                                    borderRadius: '24px', 
                                    border: '1px solid #e2e8f0', 
                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
                                    padding: '16px',
                                    fontSize: '12px',
                                    fontFamily: 'Fraunces, serif'
                                }} 
                            />
                            <Legend 
                                verticalAlign="top" 
                                align="right" 
                                iconType="circle"
                                wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}
                            />
                            <Line type="monotone" dataKey="new" stroke="#054a29" name="Inflow Registry" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 3 }} />
                            <Line type="monotone" dataKey="completed" stroke="#94a3b8" name="Settlement Cycle" strokeWidth={4} strokeDasharray="8 6" dot={{ r: 0 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Fiscal Resource Allocation */}
            {schoolCosts.length > 0 && (
                <div className="bg-white rounded-[2.5rem] border border-border p-10 shadow-sm">
                    <div className="mb-8">
                        <h3 className="text-xl font-serif font-black text-foreground">Fiscal <span className="text-primary italic">Allocation</span></h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">Regional Budgetary Deployment</p>
                    </div>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={schoolCosts} layout="vertical" margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 800 }} />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={120} 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#054a29', fontWeight: 900, fontSize: 11, fontFamily: 'Fraunces, serif' }} 
                            />
                            <Tooltip 
                                formatter={(value) => `₱ ${value.toLocaleString()}`} 
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ 
                                    backgroundColor: 'white', 
                                    borderRadius: '24px', 
                                    border: '1px solid #e2e8f0', 
                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
                                    padding: '16px',
                                    fontSize: '12px',
                                    fontFamily: 'Inter, sans-serif',
                                    fontWeight: '800'
                                }} 
                            />
                            <Bar dataKey="cost" fill="#054a29" radius={[0, 12, 12, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

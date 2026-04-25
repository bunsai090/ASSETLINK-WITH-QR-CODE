import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, Download, BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

const COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#10b981'];

export default function Analytics() {
    const [requests, setRequests] = useState([]);
    const [assets, setAssets] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        
        const fetchData = async () => {
            const [reqs, asts, tsks] = await Promise.all([
                supabase.from('repair_requests').select('*'),
                supabase.from('assets').select('*'),
                supabase.from('maintenance_tasks').select('*')
            ]);

            if (reqs.data) setRequests(reqs.data);
            if (asts.data) setAssets(asts.data);
            if (tsks.data) setTasks(tsks.data);
            setLoading(false);
        };

        fetchData();

        const channel = supabase
            .channel('analytics_sync')
            .on('postgres_changes', { event: '*', table: 'repair_requests' }, fetchData)
            .on('postgres_changes', { event: '*', table: 'assets' }, fetchData)
            .on('postgres_changes', { event: '*', table: 'maintenance_tasks' }, fetchData)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Status distribution
    const statusData = ['Pending', 'Approved', 'In Progress', 'Completed', 'Rejected', 'Escalated'].map(s => ({
        name: s,
        value: requests.filter(r => r.status === s).length,
    })).filter(d => d.value > 0);

    // Priority distribution
    const priorityData = ['Critical', 'High', 'Medium', 'Low'].map(p => ({
        name: p,
        value: requests.filter(r => r.priority === p).length,
    }));

    // Category distribution for assets
    const categoryData = ['Furniture', 'Electronics', 'Laboratory Equipment', 'Sports Equipment', 'Books & Materials', 'Appliances', 'Structural', 'Other'].map(c => ({
        name: c.length > 12 ? c.slice(0, 12) + '...' : c,
        assets: assets.filter(a => a.category === c).length,
        damaged: requests.filter(r => assets.find(a => a.id === r.asset_id && a.category === c)).length,
    })).filter(d => d.assets > 0);

    // Requests over last 7 days
    const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        const dateStr = format(d, 'yyyy-MM-dd');
        return {
            date: format(d, 'MMM d'),
            requests: requests.filter(r => {
                const date = r.created_at ? new Date(r.created_at) : null;
                return date && format(date, 'yyyy-MM-dd') === dateStr;
            }).length,
            completed: requests.filter(r => {
                const date = r.completed_at ? new Date(r.completed_at) : null;
                return date && format(date, 'yyyy-MM-dd') === dateStr;
            }).length,
        };
    });

    const avgResolutionTime = (() => {
        const completedRes = requests.filter(r => r.status === 'Completed' && r.created_at && r.completed_at);
        if (!completedRes.length) return 0;
        const avg = completedRes.reduce((sum, r) => {
            const start = new Date(r.created_at).getTime();
            const end = new Date(r.completed_at).getTime();
            const diff = end - start;
            return sum + diff / (1000 * 60 * 60 * 24);
        }, 0) / completedRes.length;
        return Math.round(avg);
    })();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-up">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Institutional Intelligence</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Synthesized operational data and infrastructure performance metrics.
                    </p>
                </div>
                <Button variant="outline" className="h-9 gap-2 text-sm bg-white border-border">
                    <Download className="w-4 h-4" /> Export Report
                </Button>
            </div>

            {/* Tactical Metrics Hub */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Universal Inflow', val: requests.length, icon: BarChart3, color: 'text-foreground' },
                    { label: 'Settlement Ratio', val: `${requests.length > 0 ? Math.round((requests.filter(r => r.status === 'Completed').length / requests.length) * 100) : 0}%`, icon: TrendingUp, color: 'text-emerald-600' },
                    { label: 'Velocity Index', val: `${avgResolutionTime}d`, icon: Activity, color: 'text-blue-600' },
                    { label: 'Escalation Potential', val: requests.filter(r => r.priority === 'Critical').length, icon: TrendingUp, color: 'text-rose-600' }
                ].map((kpi, idx) => (
                    <div 
                        key={kpi.label} 
                        className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col gap-3"
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                                <kpi.icon className={cn("w-5 h-5", kpi.color)} />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="label-mono text-muted-foreground">{kpi.label}</span>
                                <span className={cn("text-2xl font-bold tracking-tight mt-1", kpi.color)}>{kpi.val}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Status Allocation */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-foreground">Status Distribution</h3>
                        <p className="label-mono text-muted-foreground mt-0.5">Operational lifecycle segmenting</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center min-h-[300px]">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie 
                                    data={statusData} 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={80} 
                                    outerRadius={100} 
                                    paddingAngle={2} 
                                    dataKey="value" 
                                    stroke="none"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'white', 
                                        borderRadius: '8px', 
                                        border: '1px solid #e2e8f0', 
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                        fontSize: '12px'
                                    }} 
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    align="center" 
                                    iconType="circle"
                                    wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Priority Distribution */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-foreground">Critical Density</h3>
                        <p className="label-mono text-muted-foreground mt-0.5">Registry priority stratification</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center min-h-[300px]">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    fontSize={12} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b' }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b' }} 
                                    fontSize={12}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ 
                                        backgroundColor: 'white', 
                                        borderRadius: '8px', 
                                        border: '1px solid #e2e8f0', 
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                        fontSize: '12px'
                                    }} 
                                />
                                <Bar dataKey="value" fill="hsl(172,75%,17%)" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Timeline Analysis */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm lg:col-span-2">
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-foreground">Strategic Velocity</h3>
                        <p className="label-mono text-muted-foreground mt-0.5">7-Day distribution inflow metrics</p>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={last7} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="date" 
                                    fontSize={12} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b' }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b' }} 
                                    fontSize={12}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'white', 
                                        borderRadius: '8px', 
                                        border: '1px solid #e2e8f0', 
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                        fontSize: '12px'
                                    }} 
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    align="right" 
                                    iconType="circle"
                                    wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }}
                                />
                                <Line type="monotone" dataKey="requests" stroke="hsl(172,75%,17%)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Registry Inflow" />
                                <Line type="monotone" dataKey="completed" stroke="#94a3b8" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} name="Resolution Output" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Categorical Breakdown */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm lg:col-span-2">
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-foreground">Asset Allocation</h3>
                        <p className="label-mono text-muted-foreground mt-0.5">Registry volume vs damage frequency</p>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    fontSize={12} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b' }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748b' }} 
                                    fontSize={12}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ 
                                        backgroundColor: 'white', 
                                        borderRadius: '8px', 
                                        border: '1px solid #e2e8f0', 
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                        fontSize: '12px'
                                    }} 
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    align="right" 
                                    iconType="circle"
                                    wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }}
                                />
                                <Bar dataKey="assets" fill="hsl(172,75%,17%)" radius={[4, 4, 0, 0]} barSize={24} name="Total Inventory" />
                                <Bar dataKey="damaged" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} name="Damage Registry" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

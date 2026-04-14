import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, Download, BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsCard from '../../components/StatsCard';
import { format, subDays } from 'date-fns';

const COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#10b981'];

export default function Analytics() {
    const [requests, setRequests] = useState([]);
    const [assets, setAssets] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const [r, a, t] = await Promise.all([
                base44.entities.RepairRequest.list('-created_date', 500),
                base44.entities.Asset.list('-created_date', 500),
                base44.entities.MaintenanceTask.list('-created_date', 500),
            ]);
            setRequests(r);
            setAssets(a);
            setTasks(t);
            setLoading(false);
        }
        load();
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
            requests: requests.filter(r => r.created_date?.startsWith(dateStr)).length,
            completed: requests.filter(r => r.completed_date?.startsWith(dateStr)).length,
        };
    });

    const avgResolutionTime = (() => {
        const completed = requests.filter(r => r.status === 'Completed' && r.created_date && r.completed_date);
        if (!completed.length) return 0;
        const avg = completed.reduce((sum, r) => {
            const diff = new Date(r.completed_date).getTime() - new Date(r.created_date).getTime();
            return sum + diff / (1000 * 60 * 60 * 24);
        }, 0) / completed.length;
        return Math.round(avg);
    })();

    if (loading) {
        return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                    <p className="text-muted-foreground text-sm mt-1">Insights on asset management and repair performance</p>
                </div>
                <Button variant="outline" className="gap-2 self-start sm:self-auto">
                    <Download className="w-4 h-4" /> Export Report
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Total Requests" value={requests.length} icon={BarChart3} color="teal" />
                <StatsCard title="Completion Rate" value={`${requests.length > 0 ? Math.round((requests.filter(r => r.status === 'Completed').length / requests.length) * 100) : 0}%`} icon={TrendingUp} color="green" />
                <StatsCard title="Avg. Resolution" value={`${avgResolutionTime}d`} subtitle="days to complete" icon={Activity} color="blue" />
                <StatsCard title="Critical Issues" value={requests.filter(r => r.priority === 'Critical').length} icon={TrendingUp} color="red" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Status Chart */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <h2 className="text-base font-semibold text-foreground mb-5">Request Status Distribution</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Priority Chart */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <h2 className="text-base font-semibold text-foreground mb-5">Requests by Priority</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={priorityData} barSize={32}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Trend Chart */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <h2 className="text-base font-semibold text-foreground mb-5">Requests Trend (Last 7 Days)</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={last7}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="requests" stroke="#0d9488" strokeWidth={2} dot={{ r: 4 }} name="Submitted" />
                            <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Completed" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Asset Categories */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <h2 className="text-base font-semibold text-foreground mb-5">Assets by Category</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={categoryData} barSize={20}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="assets" fill="#0d9488" radius={[4, 4, 0, 0]} name="Total Assets" />
                            <Bar dataKey="damaged" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Damage Reports" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

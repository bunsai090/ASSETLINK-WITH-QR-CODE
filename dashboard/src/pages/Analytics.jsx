import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, Download, BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsCard from '../components/StatsCard';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#10b981'];

export default function Analytics() {
    const [requests, setRequests] = useState([]);
    const [assets, setAssets] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        
        // Listen to Repair Requests
        const unsubRequests = onSnapshot(collection(db, 'repair_requests'), (snap) => {
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(list);
        }, (err) => console.error("Repair Requests Error:", err));

        // Listen to Assets
        const unsubAssets = onSnapshot(collection(db, 'assets'), (snap) => {
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAssets(list);
        }, (err) => console.error("Assets Error:", err));

        // Listen to Maintenance Tasks
        const unsubTasks = onSnapshot(collection(db, 'maintenance_tasks'), (snap) => {
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTasks(list);
            setLoading(false);
        }, (err) => {
            console.error("Maintenance Tasks Error:", err);
            setLoading(false);
        });

        return () => {
            unsubRequests();
            unsubAssets();
            unsubTasks();
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
            requests: requests.filter(r => r.created_at?.toDate && format(r.created_at.toDate(), 'yyyy-MM-dd') === dateStr).length,
            completed: requests.filter(r => r.completed_at?.toDate && format(r.completed_at.toDate(), 'yyyy-MM-dd') === dateStr).length,
        };
    });

    const avgResolutionTime = (() => {
        const completedRes = requests.filter(r => r.status === 'Completed' && r.created_at?.toDate && r.completed_at?.toDate);
        if (!completedRes.length) return 0;
        const avg = completedRes.reduce((sum, r) => {
            const diff = r.completed_at.toDate().getTime() - r.created_at.toDate().getTime();
            return sum + diff / (1000 * 60 * 60 * 24);
        }, 0) / completedRes.length;
        return Math.round(avg);
    })();

    if (loading) {
        return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin" /></div>;
    }

    return (
        <div className="space-y-12 animate-fade-in pb-20 relative z-10 font-sans">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-1.5">
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                        Institutional <span className="text-primary italic">Intelligence</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        Synthesized operational data and infrastructure performance metrics.
                    </p>
                </div>
                <Button variant="outline" className="h-14 px-8 rounded-2xl border-border bg-white hover:bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transition-all active:scale-[0.98]">
                    <Download className="w-4 h-4 mr-3 text-primary" /> Export Intelligence Report
                </Button>
            </div>

            {/* Tactical Metrics Hub */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Universal Inflow', val: requests.length, icon: BarChart3, color: 'text-primary' },
                    { label: 'Settlement Ratio', val: `${requests.length > 0 ? Math.round((requests.filter(r => r.status === 'Completed').length / requests.length) * 100) : 0}%`, icon: TrendingUp, color: 'text-emerald-600' },
                    { label: 'Velocity Index', val: `${avgResolutionTime}d`, icon: Activity, color: 'text-blue-600' },
                    { label: 'Escalation Potential', val: requests.filter(r => r.priority === 'Critical').length, icon: TrendingUp, color: 'text-rose-600' }
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Allocation */}
                <div className="bg-white rounded-[2.5rem] border border-border p-10 shadow-sm flex flex-col">
                    <div className="mb-8">
                        <h3 className="text-xl font-serif font-black text-foreground">Status <span className="text-primary italic">Distribution</span></h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">Operational Lifecycle Segmenting</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center min-h-[300px]">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={75} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none">
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
                                <Legend 
                                    verticalAlign="bottom" 
                                    align="center" 
                                    iconType="circle"
                                    wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '800', letterSpacing: '1px', opacity: 0.6 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Priority Distribution */}
                <div className="bg-white rounded-[2.5rem] border border-border p-10 shadow-sm flex flex-col">
                    <div className="mb-8">
                        <h3 className="text-xl font-serif font-black text-foreground">Critical <span className="text-primary italic">Density</span></h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">Registry Priority Stratification</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center min-h-[300px]">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                                        fontWeight: '700',
                                        fontFamily: 'Fraunces, serif'
                                    }} 
                                />
                                <Bar dataKey="value" fill="#054a29" radius={[12, 12, 4, 4]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Timeline Analysis */}
                <div className="bg-white rounded-[2.5rem] border border-border p-10 shadow-sm lg:col-span-2">
                    <div className="mb-8">
                        <h3 className="text-xl font-serif font-black text-foreground">Strategic <span className="text-primary italic">Velocity</span></h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">7-Day Distribution Inflow Metrics</p>
                    </div>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={last7} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                                    wrapperStyle={{ paddingBottom: '40px', fontSize: '10px', fontWeight: '800', letterSpacing: '1px' }}
                                />
                                <Line type="monotone" dataKey="requests" stroke="#054a29" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 8, strokeWidth: 4, stroke: '#fff' }} name="Registry Inflow" />
                                <Line type="monotone" dataKey="completed" stroke="#94a3b8" strokeWidth={4} strokeDasharray="8 6" dot={{ r: 0 }} activeDot={{ r: 8, strokeWidth: 4, stroke: '#fff' }} name="Resolution Output" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Categorical Breakdown */}
                <div className="bg-white rounded-[2.5rem] border border-border p-10 shadow-sm lg:col-span-2">
                    <div className="mb-8">
                        <h3 className="text-xl font-serif font-black text-foreground">Asset <span className="text-primary italic">Allocation</span></h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">Registry Volume vs Damage Frequency</p>
                    </div>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                                <Legend 
                                    verticalAlign="top" 
                                    align="right" 
                                    iconType="circle"
                                    wrapperStyle={{ paddingBottom: '40px', fontSize: '10px', fontWeight: '800', letterSpacing: '1px' }}
                                />
                                <Bar dataKey="assets" fill="#054a29" radius={[12, 12, 0, 0]} barSize={24} name="Total Inventory" />
                                <Bar dataKey="damaged" fill="#f59e0b" radius={[12, 12, 0, 0]} barSize={24} name="Damage Registry" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
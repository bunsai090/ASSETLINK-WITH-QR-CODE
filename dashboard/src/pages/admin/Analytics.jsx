import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, Download, BarChart3, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsCard from '../../components/StatsCard';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Furniture', 'Electronics', 'Laboratory Equipment', 'Sports Equipment', 'Books & Materials', 'Appliances', 'Structural', 'Other'];
const COLORS = ['#2dd4bf', '#f59e0b', '#3b82f6', '#f43f5e', '#6366f1', '#10b981'];

export default function Analytics() {
    const [requests, setRequests] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeRequests = onSnapshot(query(collection(db, 'repair_requests')), (snapshot) => {
            setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubscribeAssets = onSnapshot(query(collection(db, 'assets')), (snapshot) => {
            setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => {
            unsubscribeRequests();
            unsubscribeAssets();
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

    // Category distribution
    const categoryData = CATEGORIES.map(c => ({
        name: c.length > 12 ? c.slice(0, 12) + '...' : c,
        assets: assets.filter(a => a.category === c).length,
        damaged: requests.filter(r => {
            const asset = assets.find(a => a.id === r.asset_id);
            return asset && asset.category === c;
        }).length,
    })).filter(d => d.assets > 0);

    // Trend last 7 days
    const last7 = Array.from({ length: 7 }, (_, i) => {
        const targetDate = subDays(new Date(), 6 - i);
        const dateKey = format(targetDate, 'yyyy-MM-dd');
        
        return {
            date: format(targetDate, 'MMM d'),
            requests: requests.filter(r => {
                const rDate = r.created_at?.toDate ? format(r.created_at.toDate(), 'yyyy-MM-dd') : null;
                return rDate === dateKey;
            }).length,
            completed: requests.filter(r => {
                const cDate = r.completed_at?.toDate ? format(r.completed_at.toDate(), 'yyyy-MM-dd') : null;
                return cDate === dateKey;
            }).length,
        };
    });

    const avgResolutionTime = (() => {
        const completed = requests.filter(r => r.status === 'Completed' && r.created_at && r.completed_at);
        if (!completed.length) return 0;
        const avg = completed.reduce((sum, r) => {
            const diff = r.completed_at.toDate().getTime() - r.created_at.toDate().getTime();
            return sum + diff / (1000 * 60 * 60 * 24);
        }, 0) / completed.length;
        return Math.round(avg);
    })();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-vh-50">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in pb-20">
             {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground tracking-tight">
                        Operational <span className="text-primary italic">Intelligence</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-80">
                        Real-time data synchronization and performance metrics for campus resource management.
                    </p>
                </div>
                <Button size="lg" variant="outline" className="shrink-0 h-12 rounded-2xl border-primary/20 text-primary hover:bg-primary/5 gap-2 px-6 font-bold shadow-xl shadow-primary/5">
                    <Download className="w-4 h-4" /> Generate Report
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Pipeline" value={requests.length} subtitle="Total reports" icon={BarChart3} color="teal" />
                <StatsCard title="Velocity" value={`${requests.length > 0 ? Math.round((requests.filter(r => r.status === 'Completed').length / requests.length) * 100) : 0}%`} subtitle="Completion rate" icon={TrendingUp} color="green" />
                <StatsCard title="Resolution" value={`${avgResolutionTime}d`} subtitle="Average cycle time" icon={Activity} color="blue" />
                <StatsCard title="Emergency" value={requests.filter(r => r.priority === 'Critical').length} subtitle="Critical alerts" icon={AlertTriangle} color="red" />
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Status Chart Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white dark:border-white/5 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                >
                    <div className="mb-8">
                        <h2 className="text-xl font-serif font-bold text-foreground">Status Distribution</h2>
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mt-1">Lifecycle segmentation</p>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                            />
                            <Legend iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Priority Chart Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white dark:border-white/5 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                >
                    <div className="mb-8">
                        <h2 className="text-xl font-serif font-bold text-foreground">Priority Matrix</h2>
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mt-1">Urgency classification</p>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={priorityData} barSize={40}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                            <Bar dataKey="value" fill="#2dd4bf" radius={[10, 10, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Trend Chart Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white dark:border-white/5 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                >
                    <div className="mb-8">
                        <h2 className="text-xl font-serif font-bold text-foreground">Operational Trend</h2>
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mt-1">7-Day restoration cycle</p>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={last7}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                            <Legend iconType="plainline" />
                            <Line type="monotone" dataKey="requests" stroke="#2dd4bf" strokeWidth={4} dot={{ r: 6, fill: '#2dd4bf', strokeWidth: 0 }} activeDot={{ r: 8 }} name="Submitted" />
                            <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 8 }} name="Restored" />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Asset Categories Chart */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white dark:border-white/5 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                >
                    <div className="mb-8">
                        <h2 className="text-xl font-serif font-bold text-foreground">Resource Taxonomy</h2>
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mt-1">Inventory vulnerability by sector</p>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={categoryData} barSize={24} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold' }} width={80} />
                            <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                            <Legend iconType="circle" />
                            <Bar dataKey="assets" fill="#2dd4bf" radius={[0, 6, 6, 0]} name="Total Inventory" />
                            <Bar dataKey="damaged" fill="#f59e0b" radius={[0, 6, 6, 0]} name="Incident Reports" />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>
        </div>
    );
}

function AlertTriangle({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
    )
}

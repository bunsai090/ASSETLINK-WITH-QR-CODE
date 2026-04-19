import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import { Package, AlertTriangle, Wrench, Clock, TrendingUp, ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function TeacherDashboard() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        // Listen for Real-Time Assets
        const assetsQuery = query(
            collection(db, 'assets'),
            orderBy('created_at', 'desc')
        );

        const unsubscribeAssets = onSnapshot(assetsQuery, (snapshot) => {
            const assetsList = snapshot.docs.map(doc => {
                /** @type {any} */
                const data = doc.data();
                return { ...data, id: doc.id };
            });
            setAssets(assetsList);
        });

        // Listen for Real-Time Repair Requests
        const requestsQuery = query(
            collection(db, 'repair_requests'),
            orderBy('created_at', 'desc')
        );

        const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
            const teacherEmail = currentUser.email?.toLowerCase();
            const teacherName = currentUser.full_name?.toLowerCase();
            
            const requestsList = snapshot.docs.map(doc => {
                /** @type {any} */
                const data = doc.data();
                return { ...data, id: doc.id };
            })
            .filter(r => {
                const emailMatches = r.reported_by_email?.toLowerCase() === teacherEmail;
                const nameMatches = r.reported_by_name?.toLowerCase() === teacherName;
                const schoolMatches = r.school_id === currentUser.school_id;
                
                return emailMatches || nameMatches || (r.status === 'Pending Teacher Verification' && schoolMatches);
            });
                
            setRequests(requestsList);
            setLoading(false);
        });

        return () => {
            unsubscribeAssets();
            unsubscribeRequests();
        };
    }, [currentUser]);

    const recent = requests.slice(0, 5);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-vh-50">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12 pb-20 relative z-10"
        >
            {/* Header Section */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-1.5">
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                        Welcome back, <span className="text-primary italic">{currentUser?.full_name?.split(' ')[0] || 'Teacher'}</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        Monitoring {assets.length} school assets in your department. Everything is synchronized.
                    </p>
                </div>
                <Link to="/report-damage" className="shrink-0">
                    <Button size="lg" className="h-16 px-10 rounded-[1.25rem] bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                        <Plus className="w-5 h-5 mr-3" /> Report Damage
                    </Button>
                </Link>
            </motion.div>

            {/* Premium Stats Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Assets" value={assets.length} subtitle="Managed equipment" icon={Package} color="teal" />
                <StatsCard title="Queued" value={requests.filter(r => r.status === 'Pending').length} subtitle="Awaiting review" icon={Clock} color="amber" />
                <StatsCard title="In Flight" value={requests.filter(r => r.status === 'In Progress').length} subtitle="Active work orders" icon={Wrench} color="blue" />
                <StatsCard title="Critical" value={requests.filter(r => r.priority === 'Critical').length} subtitle="Urgent issues" icon={AlertTriangle} color="red" />
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Recent Requests Card */}
                <motion.div 
                    variants={itemVariants}
                    className="lg:col-span-2 bg-white rounded-[2.5rem] border border-border p-10 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-serif font-black text-foreground">Department <span className="text-primary italic">Reports</span></h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">Latest updates from your resource reports</p>
                        </div>
                        <Link to="/repair-requests">
                            <Button variant="outline" className="h-10 px-6 rounded-full border-border text-[9px] font-black uppercase tracking-widest hover:bg-slate-50">
                                View History <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-1">
                        {recent.length === 0 ? (
                            <div className="text-center py-24 rounded-[2rem] bg-slate-50/50 border border-dashed border-border/50 flex flex-col items-center justify-center">
                                <Package className="w-16 h-16 text-muted-foreground/10 mb-4" />
                                <h3 className="text-xl font-serif font-black text-foreground italic opacity-40">Clear Queue</h3>
                                <p className="text-xs text-muted-foreground max-w-[200px] mt-2 font-medium opacity-40">No active repair requests found for your department.</p>
                            </div>
                        ) : (
                            recent.map((req, idx) => (
                                <motion.div
                                    variants={itemVariants}
                                    key={req.id}
                                >
                                    <Link to={`/repair-requests?id=${req.id}`}>
                                        <div className="group flex items-center gap-6 p-5 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-border/40">
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:shadow-md transition-all">
                                                <Wrench className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <p className="font-black text-foreground text-sm tracking-tight truncate group-hover:text-primary transition-colors">{req.asset_name}</p>
                                                    <StatusBadge status={req.priority} size="sm" />
                                                </div>
                                                <p className="text-[10px] font-bold text-muted-foreground/40 line-clamp-1 italic">{req.description}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                <StatusBadge status={req.status} size="sm" />
                                                <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] leading-none">
                                                    {req.created_at?.toDate ? format(req.created_at.toDate(), 'MMM dd') : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Right Side Column */}
                <div className="space-y-8">
                    {/* Progress Overview Card */}
                    <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-border p-10 shadow-sm">
                        <h2 className="text-xl font-serif font-black text-foreground mb-8">Department <span className="text-primary italic">Health</span></h2>
                        <div className="space-y-8">
                            {[
                                { label: 'Pending', count: requests.filter(r => r.status === 'Pending').length, total: requests.length, color: 'bg-amber-500' },
                                { label: 'Active', count: requests.filter(r => r.status === 'In Progress').length, total: requests.length, color: 'bg-primary' },
                                { label: 'Resolved', count: requests.filter(r => r.status === 'Completed').length, total: requests.length, color: 'bg-emerald-500' },
                            ].map(({ label, count, total, color }) => (
                                <div key={label} className="group">
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{label}</span>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-lg font-serif font-black text-foreground leading-none">{count}</span>
                                            <span className="text-[10px] font-bold text-muted-foreground opacity-30">/ {total}</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                                            viewport={{ once: false }}
                                            transition={{ duration: 1.5, ease: "circOut" }}
                                            className={cn("h-full rounded-full", color)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Resolution Rate (The "Vibe" Card) */}
                    <motion.div 
                        variants={itemVariants}
                        className="relative overflow-hidden bg-[#054a29] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-primary/20 group"
                    >
                        <TrendingUp className="w-10 h-10 mb-8 text-primary shadow-2xl" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic">Resolution Success</span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-7xl font-serif font-black tracking-tighter italic leading-none">
                                {requests.length > 0 ? Math.round((requests.filter(r => r.status === 'Completed').length / requests.length) * 100) : 0}%
                            </span>
                        </div>
                        <div className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                            <p className="text-[11px] font-medium text-white/50 leading-relaxed italic">
                                Maintenance synchronization is <span className="text-primary not-italic font-black uppercase tracking-widest">Stable</span>. Critical assets are being restored efficiently.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}

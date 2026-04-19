import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import { Package, AlertTriangle, School, ShieldCheck, Activity, MapPin, TrendingUp, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SupervisorDashboard() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubRequests = onSnapshot(
            collection(db, 'repair_requests'),
            (snap) => {
                const list = snap.docs.map(doc => {
                    /** @type {any} */
                    const data = doc.data();
                    return { ...data, id: doc.id };
                });
                const sorted = list.sort((a, b) => {
                    /** @type {any} */ const reqA = a;
                    /** @type {any} */ const reqB = b;
                    const dateA = reqA.created_at?.toDate ? reqA.created_at.toDate() : new Date(0);
                    const dateB = reqB.created_at?.toDate ? reqB.created_at.toDate() : new Date(0);
                    return dateB - dateA;
                });
                setRequests(sorted);
                setLoading(false);
            }
        );
        const unsubAssets = onSnapshot(
            collection(db, 'assets'),
            (snap) => {
                const list = snap.docs.map(doc => {
                    /** @type {any} */
                    const data = doc.data();
                    return { ...data, id: doc.id };
                });
                const sorted = list.sort((a, b) => {
                    /** @type {any} */ const assetA = a;
                    /** @type {any} */ const assetB = b;
                    const dateA = assetA.created_at?.toDate ? assetA.created_at.toDate() : new Date(0);
                    const dateB = assetB.created_at?.toDate ? assetB.created_at.toDate() : new Date(0);
                    return dateB - dateA;
                });
                setAssets(sorted);
            }
        );
        return () => { unsubRequests(); unsubAssets(); };
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="w-12 h-12 border-8 border-primary/10 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const openRequestsCount = requests.filter(r => !['Completed', 'Rejected'].includes(r.status)).length;
    const criticalCount = requests.filter(r => r.priority === 'Critical').length;

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-10 pb-10"
        >
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">District Jurisdiction</span>
                    </div>
                    <h1 className="text-4xl font-serif font-black text-foreground tracking-tighter leading-none">Supervisor <span className="text-primary italic">Overview</span></h1>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-2 opacity-60">Authentication Tier: Regional Command</p>
                </div>
                
                <div className="bg-white px-6 py-4 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">District Health</p>
                        <p className="text-sm font-black text-foreground italic">94.2% Operational</p>
                    </div>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard title="Total Assets" value={assets.length} subtitle="Regional Inventory" icon={Package} color="blue" className="rounded-[2.5rem] p-8" />
                <StatsCard title="Open Requests" value={openRequestsCount} subtitle="Active Resolution" icon={AlertTriangle} color="amber" className="rounded-[2.5rem] p-8" />
                <StatsCard title="Critical Issues" value={criticalCount} subtitle="Urgent Intervention" icon={ShieldCheck} color="red" className="rounded-[2.5rem] p-8" />
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-border overflow-hidden shadow-2xl shadow-black/[0.02]">
                <div className="px-10 py-8 border-b border-border bg-slate-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center shadow-sm">
                            <Activity className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-serif font-black text-foreground tracking-tighter leading-none">Escalated <span className="text-primary italic">Incidents</span></h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mt-1.5">Critical anomalies requiring Oversight</p>
                        </div>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-white border border-border px-5 py-2.5 rounded-full text-muted-foreground/60 shadow-sm">
                        {requests.filter(r => r.status === 'Escalated').length} Priorities
                    </span>
                </div>
                
                <div className="p-4">
                    <div className="space-y-4">
                        {requests.filter(r => r.status === 'Escalated').length === 0 ? (
                            <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border border-dashed border-border/50">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-border/40">
                                    <ShieldCheck className="w-10 h-10 text-muted-foreground/10" />
                                </div>
                                <h3 className="text-xl font-serif font-black text-foreground italic tracking-tight">Pristine Command</h3>
                                <p className="text-xs font-medium opacity-50 uppercase tracking-widest mt-1">No escalated maneuvers detected</p>
                            </div>
                        ) : requests.filter(r => r.status === 'Escalated').map(req => (
                            <div key={req.id} className="group p-8 rounded-[2rem] bg-white border border-border hover:border-primary/30 hover:shadow-xl transition-all flex items-start gap-8">
                                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shrink-0 group-hover:bg-primary group-hover:border-primary transition-colors">
                                    <AlertTriangle className="w-7 h-7 text-red-500 group-hover:text-white transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0 py-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-serif font-black text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">{req.asset_name}</h3>
                                        <StatusBadge status="Escalated" />
                                    </div>
                                    <p className="text-sm font-bold text-foreground/70 italic tracking-tight mb-4">"{req.escalated_reason || 'Strategic deviation reported'}"</p>
                                    
                                    <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-border/50">
                                                <School className="w-4 h-4 text-muted-foreground/40" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{req.school_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-border/50">
                                                <MapPin className="w-4 h-4 text-muted-foreground/40" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{req.location || 'Unknown Coordinates'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="self-center">
                                    <button className="w-12 h-12 rounded-2xl bg-slate-50 border border-border flex items-center justify-center hover:bg-primary hover:border-primary transition-all group/btn shadow-sm active:scale-95">
                                        <ArrowRight className="w-6 h-6 text-muted-foreground/30 group-hover/btn:text-white transition-all" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { 
    Eye, Search, Filter, ArrowUpRight, 
    ShieldAlert, Activity, CheckCircle2, 
    School, Package, AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

export default function SupervisorOversight() {
    const { currentUser } = useAuth();
    const [assets, setAssets] = useState([]);
    const [requests, setRequests] = useState([]);
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Real-time listeners for strategic oversight
        const unsubAssets = onSnapshot(query(collection(db, 'assets')), (snapshot) => {
            setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubRequests = onSnapshot(query(collection(db, 'repair_requests')), (snapshot) => {
            setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubSchools = onSnapshot(query(collection(db, 'schools'), orderBy('name', 'asc')), (snapshot) => {
            setSchools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => { unsubAssets(); unsubRequests(); unsubSchools(); };
    }, []);

    // Oversight Analytics Calculation
    const getSchoolStats = (schoolId) => {
        const schoolAssets = assets.filter(a => a.school_id === schoolId);
        const schoolRequests = requests.filter(r => r.school_id === schoolId);
        
        return {
            totalAssets: schoolAssets.length,
            criticalRequests: schoolRequests.filter(r => r.priority === 'Critical' && r.status !== 'Resolved').length,
            pendingRequests: schoolRequests.filter(r => r.status === 'Pending').length,
            healthScore: schoolAssets.length > 0 
                ? Math.round(((schoolAssets.length - schoolRequests.filter(r => r.status !== 'Resolved').length) / schoolAssets.length) * 100)
                : 100
        };
    };

    const overallStats = {
        totalAssets: assets.length,
        activeCrisis: requests.filter(r => r.priority === 'Critical' && r.status !== 'Resolved').length,
        operationalDelta: requests.filter(r => r.status === 'Pending').length,
        avgHealth: schools.length > 0 ? Math.round(schools.reduce((acc, s) => acc + getSchoolStats(s.id).healthScore, 0) / schools.length) : 0
    };

    const containerVariants = {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-12 animate-fade-in pb-20 relative z-10 font-sans">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-1.5">
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                        Strategic <span className="text-primary italic">Oversight</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        High-fidelity monitoring of institutional resource health and tactical repair cycles.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text"
                            placeholder="Filter institutes by name or jurisdiction..."
                            className="w-full h-14 pl-12 pr-6 bg-white border border-border rounded-2xl text-[13px] font-bold placeholder:font-medium placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/20 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Strategic Metrics Grid */}
            <motion.div 
                variants={containerVariants}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {[
                    { label: 'Asset Inventory', value: overallStats.totalAssets, icon: Package, color: 'text-primary' },
                    { label: 'Active Crisis', value: overallStats.activeCrisis, icon: ShieldAlert, color: 'text-rose-600' },
                    { label: 'Operational Delta', value: overallStats.operationalDelta, icon: Activity, color: 'text-amber-500' },
                    { label: 'Jurisdictional Health', value: `${overallStats.avgHealth}%`, icon: CheckCircle2, color: 'text-emerald-500' }
                ].map((stat, i) => (
                    <motion.div 
                        key={i}
                        variants={itemVariants}
                        className="bg-white rounded-[2.5rem] border border-border p-8 shadow-sm flex flex-col gap-4 group hover:shadow-xl transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <stat.icon className={cn("w-8 h-8", stat.color)} />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 italic">{stat.label}</span>
                            <div className="text-4xl font-serif font-black text-foreground tracking-tighter">{stat.value}</div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Jurisdictional Grid */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-serif font-black text-foreground">Institutional <span className="text-primary italic">Status Registry</span></h3>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic flex items-center gap-2">Real-time Stream <Activity className="w-3 h-3" /></span>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {loading ? (
                        Array(4).fill(0).map((_, i) => (
                            <div key={i} className="h-64 rounded-[2.5rem] bg-slate-50 animate-pulse border border-border" />
                        ))
                    ) : schools.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((school, idx) => {
                        const stats = getSchoolStats(school.id);
                        return (
                            <motion.div 
                                key={school.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white rounded-[2.5rem] border border-border overflow-hidden group hover:shadow-2xl transition-all duration-500"
                            >
                                <div className="p-8 lg:p-10 flex flex-col md:flex-row gap-10">
                                    {/* Left: Info */}
                                    <div className="flex-1 space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-border text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                    <School className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-2xl font-serif font-black text-foreground tracking-tight leading-none truncate max-w-[250px]">{school.name}</h4>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">{school.division || 'Jurisdiction Pending'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 pt-2">
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Total Inventory</span>
                                                <div className="text-xl font-bold text-foreground flex items-center gap-2">
                                                    {stats.totalAssets}
                                                    <Package className="w-3.5 h-3.5 text-primary/30" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Priority Events</span>
                                                <div className={cn(
                                                    "text-xl font-bold flex items-center gap-2",
                                                    stats.criticalRequests > 0 ? "text-rose-600" : "text-foreground"
                                                )}>
                                                    {stats.criticalRequests}
                                                    <ShieldAlert className={cn("w-3.5 h-3.5", stats.criticalRequests > 0 ? "text-rose-600" : "text-muted-foreground/20")} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex gap-3">
                                            <button className="h-10 px-5 rounded-xl bg-slate-50 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-primary hover:text-white transition-all">
                                                Full Analytics
                                            </button>
                                            <button className="h-10 px-5 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-slate-50 transition-all">
                                                Contact Lead
                                            </button>
                                        </div>
                                    </div>

                                    {/* Right: Score Gauge */}
                                    <div className="flex flex-col items-center justify-center gap-2 px-8 py-6 bg-slate-50/50 rounded-[2rem] border border-border/50 min-w-[160px]">
                                        <div className="relative w-24 h-24 flex items-center justify-center">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle
                                                    cx="48" cy="48" r="42"
                                                    fill="none" stroke="currentColor"
                                                    strokeWidth="8" className="text-slate-200"
                                                />
                                                <motion.circle
                                                    cx="48" cy="48" r="42"
                                                    fill="none" stroke="currentColor"
                                                    strokeWidth="8" strokeLinecap="round"
                                                    strokeDasharray={264}
                                                    initial={{ strokeDashoffset: 264 }}
                                                    animate={{ strokeDashoffset: 264 - (264 * stats.healthScore) / 100 }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    className={cn(
                                                        stats.healthScore > 80 ? "text-emerald-500" : stats.healthScore > 50 ? "text-amber-500" : "text-rose-600"
                                                    )}
                                                />
                                            </svg>
                                            <span className="absolute text-2xl font-serif font-black text-foreground tracking-tighter">{stats.healthScore}%</span>
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1 italic">Score Integrity</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

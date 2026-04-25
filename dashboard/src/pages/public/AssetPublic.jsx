import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import StatusBadge from '../../components/StatusBadge';
import { Package, Wrench, Calendar, MapPin, Tag, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function AssetPublic() {
    const urlParams = new URLSearchParams(window.location.search);
    const assetId = urlParams.get('id');
    const [asset, setAsset] = useState(null);
    const [repairs, setRepairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!assetId) { setNotFound(true); setLoading(false); return; }
        async function load() {
            try {
                const { data: assetData, error: assetError } = await supabase
                    .from('assets')
                    .select('*')
                    .eq('id', assetId)
                    .single();
                
                if (assetError || !assetData) { setNotFound(true); setLoading(false); return; }
                setAsset(assetData);

                const { data: repairsData, error: repairsError } = await supabase
                    .from('repair_requests')
                    .select('*')
                    .eq('asset_id', assetId)
                    .order('created_at', { ascending: false });
                
                if (repairsData) setRepairs(repairsData);
                setLoading(false);
            } catch (error) {
                console.error("Error loading asset:", error);
                setNotFound(true);
                setLoading(false);
            }
        }
        load();
    }, [assetId]);

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

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-8 border-primary/10 border-t-primary rounded-full animate-spin" />
        </div>
    );

    if (notFound) return (
        <div className="flex items-center justify-center min-h-[60vh] text-center p-10 animate-in fade-in zoom-in duration-500">
            <div className="bg-white rounded-[3rem] p-16 shadow-2xl shadow-black/5 border border-border/40 max-w-md w-full">
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-border/50">
                    <Package className="w-12 h-12 text-muted-foreground/20" />
                </div>
                <h2 className="text-3xl font-serif font-black text-foreground tracking-tighter">Asset Not <span className="text-primary italic">Found</span></h2>
                <p className="text-muted-foreground mt-4 font-medium opacity-60">This unit does not exist in our active registry or has been decommissioned.</p>
                <Button variant="ghost" className="mt-8 font-black uppercase text-[10px] tracking-[0.2em] opacity-40 hover:opacity-100" onClick={() => window.history.back()}>Return to Headquarters</Button>
            </div>
        </div>
    );

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl mx-auto space-y-8 pb-20 relative z-10"
        >
            {/* Branding Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between px-2 pt-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-[1rem] flex items-center justify-center shadow-xl shadow-primary/20">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-serif font-black tracking-tight text-foreground uppercase">Asset<span className="text-primary italic">Link</span></h2>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 leading-none">Security Protocol Active</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 block">Timestamp</span>
                    <span className="text-[10px] font-black text-foreground">{format(new Date(), 'HH:mm:ss')}</span>
                </div>
            </motion.div>

            {/* Hero Asset Card */}
            <motion.div 
                variants={itemVariants}
                className="bg-white rounded-[2.5rem] border border-border shadow-2xl shadow-primary/5 overflow-hidden relative"
            >
                <div className="h-3 bg-primary absolute top-0 left-0 w-full" />
                <div className="p-10 pt-14">
                    <div className="flex flex-col gap-8">
                        <div className="flex items-start justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Unit Identification</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tighter leading-[0.9] text-balance">{asset.name}</h1>
                                <p className="text-sm font-black text-muted-foreground/40 mt-1 uppercase tracking-widest leading-none">System Registry #{asset.asset_code}</p>
                            </div>
                            <div className="w-24 h-24 rounded-[2rem] bg-slate-50 flex items-center justify-center border border-border/50 shrink-0 shadow-inner">
                                <Package className="w-12 h-12 text-primary/30" />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.1em] bg-slate-50 border border-border px-5 py-2.5 rounded-2xl text-foreground/60 shadow-sm">{asset.category}</span>
                            <div className="scale-110 origin-left">
                                <StatusBadge status={asset.condition} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50/50 border-t border-border grid grid-cols-2 divide-x divide-border">
                    {[
                        { icon: MapPin, label: 'Tactical Location', value: asset.location || '—' },
                        { icon: Tag, label: 'Host Institution', value: asset.school_name || '—' },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="p-8 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 flex items-center gap-2">
                                <Icon className="w-3.5 h-3.5" /> {label}
                            </span>
                            <p className="text-sm font-black text-foreground/80 truncate leading-tight italic tracking-tight">{value}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Extended Logistics Metadata */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-border p-10 shadow-sm grid grid-cols-2 gap-10">
                <div className="space-y-2 border-r border-border/50 pr-5">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" /> Procurement Date
                    </span>
                    <p className="text-sm font-black text-foreground/70 tracking-tight leading-none italic">
                        {asset.created_at ? format(new Date(asset.created_at), 'MMMM d, yyyy') : 'Registry Empty'}
                    </p>
                </div>
                <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5" /> Service Cycles
                    </span>
                    <p className="text-sm font-black text-foreground/70 tracking-tight leading-none italic uppercase">{repairs.length} Historical Events</p>
                </div>
            </motion.div>

            {/* Repair History Container */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
                <div className="px-10 py-8 border-b border-border bg-slate-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center shadow-sm">
                            <Wrench className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-serif font-black text-foreground tracking-tighter leading-none">Resolution <span className="text-primary italic">Timeline</span></h2>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mt-1">Lifecycle event logs</p>
                        </div>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-white border border-border px-4 py-2 rounded-full text-muted-foreground/60 shadow-sm">{repairs.length} Records</span>
                </div>
                <div className="divide-y divide-border">
                    {repairs.length === 0 ? (
                        <div className="text-center py-24 px-10">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-border/50">
                                <AlertTriangle className="w-10 h-10 text-muted-foreground/10" />
                            </div>
                            <h3 className="text-xl font-serif font-black text-foreground italic mb-2 tracking-tight">Pristine Status Protocol</h3>
                            <p className="text-xs text-muted-foreground font-medium opacity-50 max-w-[240px] mx-auto">No adjustive maneuvers have been initialized for this architectural unit.</p>
                        </div>
                    ) : repairs.map((r, idx) => (
                        <div key={r.id} className="p-10 hover:bg-slate-50/30 transition-all group flex gap-8">
                            <div className="flex flex-col items-center gap-2 pt-1 border-r border-border pr-8 min-w-[120px] shrink-0">
                                <span className="text-sm font-black text-foreground leading-none">{r.created_at ? format(new Date(r.created_at), 'MMM d') : '-'}</span>
                                <span className="text-[10px] font-black uppercase text-muted-foreground/30 tracking-widest leading-none">{r.created_at ? format(new Date(r.created_at), 'yyyy') : '-'}</span>
                            </div>
                            <div className="flex-1 min-w-0 space-y-4">
                                <p className="text-base font-black text-foreground leading-tight group-hover:text-primary transition-colors tracking-tight">{r.description}</p>
                                <div className="flex flex-wrap items-center gap-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                                        <span className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-tighter leading-none italic">Verified by {r.reported_by_name || 'Protocol'}</span>
                                    </div>
                                    {r.maintenance_notes && (
                                        <div className="text-[10px] font-black text-primary italic bg-primary/[0.03] px-3 py-1 rounded-full border border-primary/10 tracking-tight leading-none">Intelligence Attached</div>
                                    )}
                                </div>
                                {r.maintenance_notes && (
                                    <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-border/50 text-[13px] text-muted-foreground leading-relaxed italic border-l-8 border-l-primary/10 tracking-tight font-medium shadow-inner">
                                        "{r.maintenance_notes}"
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 items-end flex-shrink-0 pt-1">
                                <div className="scale-100 origin-right shadow-sm rounded-full">
                                    <StatusBadge status={r.status} />
                                </div>
                                <div className="scale-90 origin-right opacity-50">
                                    <StatusBadge status={r.priority} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* High-Intent Cta Section */}
            <motion.div 
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
                className="bg-primary rounded-[3rem] p-12 text-center text-white shadow-[0_40px_80px_-20px_rgba(0,128,128,0.3)] relative overflow-hidden group cursor-pointer"
            >
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-[80px] group-hover:bg-white/20 transition-all duration-700" />
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <h3 className="text-2xl md:text-3xl font-serif font-black italic tracking-tighter">Incident Command Center</h3>
                    </div>
                    <p className="text-sm md:text-base font-medium opacity-80 max-w-sm mx-auto leading-relaxed tracking-tight">Authenticated personnel may initialize a restoration request directly via the secure dashboard.</p>
                    <div className="pt-8">
                        <Button className="h-16 px-12 bg-white text-primary hover:bg-[#FDFCF7] rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-[0.98] gap-3">
                            Signal Restoration <ArrowRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Regulatory Footer */}
            <motion.div variants={itemVariants} className="text-center pt-12 border-t border-border/40 opacity-20">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground italic leading-none">Proprietary Nexus Technology · AssetLink Deployment v2.4.0</p>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-foreground mt-4 opacity-50">Confidentiality Protocol Active · Secure Session Verified</p>
            </motion.div>
        </motion.div>
    );
}


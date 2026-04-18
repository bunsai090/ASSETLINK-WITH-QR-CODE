import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '../components/StatusBadge';
import { Package, Wrench, Calendar, MapPin, Tag, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

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
            const allAssets = await base44.entities.Asset.list('-created_date', 500);
            const found = allAssets.find(a => a.id === assetId);
            if (!found) { setNotFound(true); setLoading(false); return; }
            setAsset(found);
            const allRepairs = await base44.entities.RepairRequest.list('-created_date', 500);
            setRepairs(allRepairs.filter(r => r.asset_id === assetId));
            setLoading(false);
        }
        load();
    }, [assetId]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin" />
        </div>
    );

    if (notFound) return (
        <div className="flex items-center justify-center min-h-screen text-center p-6">
            <div>
                <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground">Asset Not Found</h2>
                <p className="text-muted-foreground mt-2">This asset does not exist or has been removed.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFCF7] font-sans pb-20">
            {/* Branding Header */}
            <div className="bg-white border-b border-border py-6 px-6 sticky top-0 z-50 shadow-sm">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-serif font-black tracking-tight text-foreground uppercase">Asset<span className="text-primary italic">Link</span></h2>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 leading-none">Security Protocol Active</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-6 space-y-8 animate-fade-in">
                {/* Hero Asset Card */}
                <div className="bg-white rounded-[2.5rem] border border-border shadow-2xl shadow-primary/5 overflow-hidden relative">
                    <div className="h-3 bg-primary absolute top-0 left-0 w-full" />
                    <div className="p-10 pt-12">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Asset Identification</span>
                                    <h1 className="text-4xl font-serif font-black text-foreground tracking-tight leading-tight">{asset.name}</h1>
                                    <p className="text-sm font-bold text-muted-foreground opacity-60">System Registry #{asset.asset_code}</p>
                                </div>
                                <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center border border-border">
                                    <Package className="w-10 h-10 text-primary/40" />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-slate-50 border border-border px-4 py-2 rounded-xl text-foreground/60">{asset.category}</span>
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
                            <div key={label} className="p-6 space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 flex items-center gap-2">
                                    <Icon className="w-3 h-3" /> {label}
                                </span>
                                <p className="text-sm font-black text-foreground/80 truncate leading-tight italic">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Extended Logistics Metadata */}
                <div className="bg-white rounded-[2rem] border border-border p-8 shadow-sm grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Procurement Date
                        </span>
                        <p className="text-xs font-bold text-foreground/70">
                            {asset.purchase_date ? format(new Date(asset.purchase_date), 'MMMM d, yyyy') : 'Registry Empty'}
                        </p>
                    </div>
                    <div className="space-y-1 uppercase">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 flex items-center gap-2">
                            <Wrench className="w-3 h-3" /> Service Cycles
                        </span>
                        <p className="text-xs font-bold text-foreground/70">{repairs.length} Historical Adjustments</p>
                    </div>
                </div>

                {/* Refined Maintenance Timeline */}
                <div className="bg-white rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
                    <div className="px-10 py-6 border-b border-border bg-slate-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center">
                                <Wrench className="w-4 h-4 text-primary" />
                            </div>
                            <h2 className="text-sm font-serif font-black text-foreground tracking-tight">Resolution <span className="text-primary italic">Timeline</span></h2>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-white border border-border px-3 py-1.5 rounded-full text-muted-foreground/60">{repairs.length} Records</span>
                    </div>

                    <div className="divide-y divide-border">
                        {repairs.length === 0 ? (
                            <div className="text-center py-20 px-10">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/50">
                                    <AlertTriangle className="w-8 h-8 text-muted-foreground/20" />
                                </div>
                                <h3 className="text-lg font-serif font-black text-foreground italic mb-1">Pristine Protocol</h3>
                                <p className="text-xs text-muted-foreground font-medium opacity-60">No adjustive maneuvers have been recorded for this asset.</p>
                            </div>
                        ) : (
                            repairs.map((r, idx) => (
                                <div key={r.id} className="p-8 hover:bg-slate-50/30 transition-colors group flex gap-6">
                                    <div className="flex flex-col items-center gap-2 pt-1 border-r border-border pr-6 min-w-[100px]">
                                        <span className="text-[10px] font-black text-foreground leading-none">{r.created_date ? format(new Date(r.created_date), 'MMM d') : '-'}</span>
                                        <span className="text-[9px] font-black uppercase text-muted-foreground/30 tracking-tighter leading-none">{r.created_date ? format(new Date(r.created_date), 'yyyy') : '-'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-3">
                                        <p className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors">{r.description}</p>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                                <span className="text-[10px] font-bold text-muted-foreground/60">Reported by {r.reported_by_name || 'System Protocol'}</span>
                                            </div>
                                            {r.maintenance_notes && (
                                                <div className="text-[10px] font-black text-primary italic bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">Active Documentation Attached</div>
                                            )}
                                        </div>
                                        {r.maintenance_notes && (
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-border/50 text-xs text-muted-foreground leading-relaxed italic border-l-4 border-l-primary">
                                                "{r.maintenance_notes}"
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 items-end flex-shrink-0">
                                        <div className="scale-90 origin-right">
                                            <StatusBadge status={r.status} />
                                        </div>
                                        <div className="scale-90 origin-right">
                                            <StatusBadge status={r.priority} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* High-Intent Link Section */}
                <div className="bg-primary rounded-[2.5rem] p-10 text-center text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-all duration-700" />
                    <div className="relative z-10 space-y-2">
                        <h3 className="text-2xl font-serif font-black italic tracking-tight">Institutional Alert Protocol</h3>
                        <p className="text-sm font-medium opacity-80 max-w-sm mx-auto leading-relaxed">System scan verified. Authenticated personnel may file reports via the headquarters dashboard.</p>
                        <div className="pt-6">
                            <button className="h-14 px-10 bg-white text-primary rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#FDFCF7] transition-all shadow-xl active:scale-[0.98]">
                                Signal Incident Command
                            </button>
                        </div>
                    </div>
                </div>

                {/* Regulatory Footer */}
                <div className="text-center pt-8 border-t border-border opacity-30">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground italic">Proprietary Nexus Technology · AssetLink Secure Systems</p>
                </div>
            </div>
        </div>
    );
}
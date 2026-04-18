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
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            {/* Asset Header */}
            <div className="bg-card rounded-2xl border border-border p-6 flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal/10 flex items-center justify-center flex-shrink-0">
                    <Package className="w-7 h-7 text-teal" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground">{asset.name}</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">#{asset.asset_code}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">{asset.category}</span>
                        {asset.condition && <StatusBadge status={asset.condition} />}
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="bg-card rounded-2xl border border-border p-5 grid grid-cols-2 gap-4">
                {[
                    { icon: MapPin, label: 'Location', value: asset.location || '—' },
                    { icon: Tag, label: 'School', value: asset.school_name || '—' },
                    { icon: Calendar, label: 'Purchase Date', value: asset.purchase_date ? format(new Date(asset.purchase_date), 'MMM d, yyyy') : '—' },
                    { icon: Wrench, label: 'Repair Requests', value: repairs.length },
                ].map(({ icon: Icon, label, value }) => (
                    <div key={label}>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                            <Icon className="w-3.5 h-3.5" /> {label}
                        </div>
                        <p className="text-sm font-semibold text-foreground">{value}</p>
                    </div>
                ))}
            </div>

            {/* Repair History */}
            <div className="bg-card rounded-2xl border border-border">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                    <Wrench className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">Repair History</h2>
                    <span className="ml-auto text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{repairs.length}</span>
                </div>
                <div className="divide-y divide-border">
                    {repairs.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No repair history yet</p>
                        </div>
                    ) : repairs.map(r => (
                        <div key={r.id} className="px-5 py-4 flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${r.priority === 'Critical' ? 'bg-red-500' : r.priority === 'High' ? 'bg-orange-400' : 'bg-amber-400'}`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground">{r.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Reported by {r.reported_by_name || 'Unknown'} · {r.created_date ? format(new Date(r.created_date), 'MMM d, yyyy') : ''}
                                </p>
                                {r.maintenance_notes && <p className="text-xs text-muted-foreground mt-1 italic">Note: {r.maintenance_notes}</p>}
                            </div>
                            <div className="flex flex-col gap-1 items-end flex-shrink-0">
                                <StatusBadge status={r.status} />
                                <StatusBadge status={r.priority} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Report link */}
            <div className="bg-teal/5 border border-teal/20 rounded-2xl p-5 text-center">
                <p className="text-sm text-teal font-medium">📷 Scanned this QR code?</p>
                <p className="text-xs text-muted-foreground mt-1">Log in to AssetLink to file a damage report for this asset.</p>
            </div>
        </div>
    );
}
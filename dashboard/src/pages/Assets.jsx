import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { Package, Plus, Search, QrCode, Edit2, Trash2, Printer, CheckSquare, Square } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Furniture', 'Electronics', 'Laboratory Equipment', 'Sports Equipment', 'Books & Materials', 'Appliances', 'Structural', 'Other'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged', 'Condemned'];

export default function Assets() {
    const { currentUser } = useAuth();
    const role = currentUser?.role || 'teacher';
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterCondition, setFilterCondition] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', asset_code: '', category: 'Furniture', condition: 'Good', location: '', school_name: '', description: '' });
    const [saving, setSaving] = useState(false);
    const [selected, setSelected] = useState(new Set());
    const [selectMode, setSelectMode] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    /** @type {React.MutableRefObject<HTMLDivElement | null>} */
    const qrSheetRef = useRef(null);

    useEffect(() => { loadAssets(); }, []);

    function toggleSelect(id) {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleSelectAll() {
        if (selected.size === filtered.length) setSelected(new Set());
        else setSelected(new Set(filtered.map(a => a.id)));
    }

    function getAssetUrl(assetId) {
        return `${window.location.origin}/asset-view?id=${assetId}`;
    }

    function getQrUrl(assetId) {
        const url = encodeURIComponent(getAssetUrl(assetId));
        return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${url}&margin=8`;
    }

    async function handlePrintPdf() {
        if (selected.size === 0) return;
        setGeneratingPdf(true);
        await new Promise(r => setTimeout(r, 800)); // let QR images load
        const canvas = await html2canvas(qrSheetRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const ratio = canvas.height / canvas.width;
        const imgH = pageW * ratio;
        let y = 0;
        while (y < imgH) {
            if (y > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, -y, pageW, imgH);
            y += pageH;
        }
        pdf.save('asset-qr-codes.pdf');
        setGeneratingPdf(false);
    }

    async function loadAssets() {
        const data = await base44.entities.Asset.list('-created_date', 200);
        setAssets(data);
        setLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const filtered = assets.filter(a => {
        const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.asset_code?.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCategory === 'all' || a.category === filterCategory;
        const matchCond = filterCondition === 'all' || a.condition === filterCondition;
        return matchSearch && matchCat && matchCond;
    });

    function openCreate() {
        setEditing(null);
        setForm({ name: '', asset_code: '', category: 'Furniture', condition: 'Good', location: '', school_name: '', description: '' });
        setShowModal(true);
    }

    function openEdit(asset) {
        setEditing(asset);
        setForm({ name: asset.name, asset_code: asset.asset_code, category: asset.category, condition: asset.condition, location: asset.location || '', school_name: asset.school_name || '', description: asset.description || '' });
        setShowModal(true);
    }

    async function handleSave() {
        if (!form.name || !form.asset_code) { toast.error('Name and Asset Code are required'); return; }
        setSaving(true);
        if (editing) {
            await base44.entities.Asset.update(editing.id, form);
            toast.success('Asset updated');
        } else {
            await base44.entities.Asset.create(form);
            toast.success('Asset created');
        }
        setSaving(false);
        setShowModal(false);
        loadAssets();
    }

    async function handleDelete(id) {
        if (!confirm('Delete this asset?')) return;
        await base44.entities.Asset.delete(id);
        toast.success('Asset deleted');
        loadAssets();
    }

    return (
        <div className="space-y-10 animate-fade-in pb-20 relative z-10 font-sans">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-1.5">
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                        Asset <span className="text-primary italic">Registry</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        Strategic oversight of school infrastructure and logistics across the district.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-border shadow-sm">
                    {selectMode && selected.size > 0 && (
                        <Button onClick={handlePrintPdf} disabled={generatingPdf} variant="outline" className="h-12 border-primary text-primary hover:bg-primary/5 font-black uppercase tracking-widest text-[10px] px-6 rounded-xl shadow-lg shadow-primary/5 transition-all">
                            <Printer className="w-4 h-4 mr-2" /> {generatingPdf ? 'GENERATING REQUISITION...' : `PRINT LOGISTICS (${selected.size})`}
                        </Button>
                    )}
                    <Button 
                        onClick={() => { setSelectMode(s => !s); setSelected(new Set()); }} 
                        variant={selectMode ? 'secondary' : 'outline'} 
                        className={cn(
                            "h-12 border-border font-black uppercase tracking-widest text-[10px] px-6 rounded-xl transition-all",
                            selectMode ? "bg-slate-100 border-transparent" : "hover:bg-slate-50"
                        )}
                    >
                        <QrCode className="w-4 h-4 mr-2" /> {selectMode ? 'EXIT PROTOCOL' : 'QR GENERATOR'}
                    </Button>
                    {(role === 'admin' || role === 'principal') && (
                        <Button onClick={openCreate} className="h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] px-6 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                            <Plus className="w-4 h-4 mr-2" /> ENLIST ASSET
                        </Button>
                    )}
                </div>
            </div>

            {/* Selection Bar */}
            {selectMode && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 bg-primary text-white border border-primary/20 rounded-2xl px-6 py-4 shadow-xl shadow-primary/10"
                >
                    <button onClick={toggleSelectAll} className="flex items-center gap-3 font-black uppercase tracking-widest text-[10px] hover:opacity-80 transition-opacity">
                        <div className="w-5 h-5 rounded-md border-2 border-white/40 flex items-center justify-center bg-white/10">
                            {selected.size === filtered.length ? <CheckSquare className="w-3 h-3 text-white" /> : <div className="w-2 h-2 rounded-[1px] bg-white/20" />}
                        </div>
                        {selected.size === filtered.length ? 'Deselect All' : 'Select All Records'}
                    </button>
                    <div className="w-px h-4 bg-white/20 mx-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{selected.size} Registry Points Identified</span>
                    {selected.size > 0 && <span className="text-[9px] font-bold italic ml-auto opacity-60">Ready for synchronized QR generation protocol.</span>}
                </motion.div>
            )}

            {/* Filter Hub */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-3xl border border-border shadow-sm">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Search Registry..." 
                        className="h-14 pl-12 bg-slate-50 border-transparent placeholder:text-muted-foreground/30 font-bold tracking-tight rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-inner" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                </div>
                <div className="flex gap-4">
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="h-14 w-full md:w-52 bg-slate-50 border-transparent font-bold tracking-tight rounded-2xl focus:ring-1 focus:ring-primary/20 transition-all shadow-inner">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border shadow-2xl font-sans">
                            <SelectItem value="all" className="font-bold py-3">All Categories</SelectItem>
                            {CATEGORIES.map(c => <SelectItem key={c} value={c} className="font-medium py-3">{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filterCondition} onValueChange={setFilterCondition}>
                        <SelectTrigger className="h-14 w-full md:w-48 bg-slate-50 border-transparent font-bold tracking-tight rounded-2xl focus:ring-1 focus:ring-primary/20 transition-all shadow-inner">
                            <SelectValue placeholder="Condition" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border shadow-2xl font-sans">
                            <SelectItem value="all" className="font-bold py-3">All Conditions</SelectItem>
                            {CONDITIONS.map(c => <SelectItem key={c} value={c} className="font-medium py-3">{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.length === 0 ? (
                        <div className="col-span-full bg-white rounded-3xl border border-dashed border-border py-24 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-6 text-muted-foreground/20">
                                <Package className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-serif font-black text-foreground">Registry Empty</h3>
                            <p className="text-muted-foreground text-sm font-medium mt-2">No infrastructure records matched your search parameters.</p>
                        </div>
                    ) : (
                        filtered.map(asset => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={asset.id}
                                onClick={selectMode ? () => toggleSelect(asset.id) : undefined}
                                className={cn(
                                    "bg-white rounded-[2.5rem] border transition-all group flex flex-col p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden",
                                    selectMode ? "cursor-pointer" : "cursor-default",
                                    selectMode && selected.has(asset.id) ? "border-primary ring-4 ring-primary/5 bg-slate-50/50" : "border-border"
                                )}
                            >
                                <div className="flex items-start justify-between mb-8">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-primary border border-border group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                                            <Package className="w-7 h-7" />
                                        </div>
                                        {selectMode && (
                                            <div className={cn(
                                                "absolute -top-3 -right-3 w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all duration-500",
                                                selected.has(asset.id) ? "bg-primary border-slate-50 scale-110 shadow-lg shadow-primary/20" : "bg-white border-slate-100 scale-90"
                                            )}>
                                                {selected.has(asset.id) && <span className="text-white text-xs font-black">✓</span>}
                                            </div>
                                        )}
                                    </div>
                                    {!selectMode && (role === 'admin' || role === 'principal') && (
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                            <button onClick={(e) => { e.stopPropagation(); openEdit(asset); }} className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all shadow-sm">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }} className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="space-y-1.5 mb-8">
                                    <h3 className="font-serif font-black text-foreground text-xl leading-tight group-hover:text-primary transition-colors">{asset.name}</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">Registry Code: {asset.asset_code}</p>
                                </div>

                                <div className="mt-auto space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary/20 w-1/2" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">Lifecycle Status</span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest bg-slate-50 border border-border text-muted-foreground/60 px-3 py-1.5 rounded-lg">{asset.category}</span>
                                        {asset.condition && <StatusBadge status={asset.condition} size="xs" />}
                                    </div>

                                    {(asset.location || asset.school_name) && (
                                        <div className="pt-4 border-t border-slate-50 flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Strategic Location</span>
                                                <p className="text-xs font-bold text-foreground/70 truncate max-w-[180px]">{asset.location || asset.school_name}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Hidden QR Sheet for PDF rendering */}
            {selectMode && selected.size > 0 && (
                <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none">
                    <div ref={qrSheetRef} style={{ width: 794, padding: 40, backgroundColor: '#fff', fontFamily: 'Inter, sans-serif' }}>
                        <div style={{ marginBottom: 32, borderBottom: '2px solid #054a29', paddingBottom: 24 }}>
                            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#054a29', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>AssetLink Registry Identification</h2>
                            <p style={{ fontSize: 13, color: '#64748b', marginTop: 8, fontWeight: 500 }}>Operational Synchronized Log · {new Date().toLocaleDateString()} · Access restricted to authorized personnel</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                            {filtered.filter(a => selected.has(a.id)).map(asset => (
                                <div key={asset.id} style={{ border: '1px solid #e2e8f0', borderRadius: 20, padding: 24, textAlign: 'center', backgroundColor: '#ffffff', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, backgroundColor: '#054a29', borderRadius: '20px 20px 0 0' }} />
                                    <img
                                        src={getQrUrl(asset.id)}
                                        alt={asset.name}
                                        crossOrigin="anonymous"
                                        style={{ width: 140, height: 140, margin: '0 auto 16px' }}
                                    />
                                    <p style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', margin: '0 0 4px', textTransform: 'uppercase' }}>{asset.name}</p>
                                    <p style={{ fontSize: 11, fontWeight: 800, color: '#054a29', margin: '0 0 4px', letterSpacing: '1px' }}>REG: #{asset.asset_code}</p>
                                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                                        <p style={{ fontSize: 10, color: '#64748b', margin: 0, fontWeight: 600 }}>LOC: {asset.location || 'N/A'}</p>
                                        <p style={{ fontSize: 9, color: '#94a3b8', margin: '4px 0 0', fontWeight: 500 }}>{asset.school_name || 'DISTRICT CAMPUS'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Asset Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border border-border p-0 overflow-hidden bg-white shadow-2xl font-sans">
                    <div className="p-10 pb-8 border-b border-border bg-slate-50/50">
                        <DialogTitle className="text-4xl font-serif font-black tracking-tight text-foreground">
                            {editing ? 'Modify' : 'Enlist'} <span className="text-primary italic">Asset</span>
                        </DialogTitle>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mt-2 italic">Infrastructure Logistics Registry Update</p>
                    </div>

                    <div className="p-10 space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Nomenclature Identification *</Label>
                                <Input 
                                    value={form.name} 
                                    onChange={e => setForm({ ...form, name: e.target.value })} 
                                    placeholder="Registry name for asset..." 
                                    className="h-14 bg-slate-50 border-transparent placeholder:text-muted-foreground/30 font-bold tracking-tight rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-inner px-6"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Registry Serial *</Label>
                                <Input 
                                    value={form.asset_code} 
                                    onChange={e => setForm({ ...form, asset_code: e.target.value })} 
                                    placeholder="ASSET-000" 
                                    className="h-14 bg-slate-50 border-transparent placeholder:text-muted-foreground/30 font-bold tracking-tight rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-inner px-6"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Tactical Deployment Zone</Label>
                                <Input 
                                    value={form.location} 
                                    onChange={e => setForm({ ...form, location: e.target.value })} 
                                    placeholder="Deployment Room/Sector" 
                                    className="h-14 bg-slate-50 border-transparent placeholder:text-muted-foreground/30 font-bold tracking-tight rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-inner px-6"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Registry Category</Label>
                                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                                    <SelectTrigger className="h-14 bg-slate-50 border-transparent font-bold tracking-tight rounded-2xl focus:ring-1 focus:ring-primary/20 transition-all shadow-inner px-6">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border shadow-2xl font-sans">
                                        {CATEGORIES.map(c => <SelectItem key={c} value={c} className="font-medium py-3">{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Structural Integrity State</Label>
                                <Select value={form.condition} onValueChange={v => setForm({ ...form, condition: v })}>
                                    <SelectTrigger className="h-14 bg-slate-50 border-transparent font-bold tracking-tight rounded-2xl focus:ring-1 focus:ring-primary/20 transition-all shadow-inner px-6">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border shadow-2xl font-sans">
                                        {CONDITIONS.map(c => <SelectItem key={c} value={c} className="font-medium py-3">{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Strategic Institution</Label>
                                <Input 
                                    value={form.school_name} 
                                    onChange={e => setForm({ ...form, school_name: e.target.value })} 
                                    placeholder="Assigned Campus/Institution" 
                                    className="h-14 bg-slate-50 border-transparent placeholder:text-muted-foreground/30 font-bold tracking-tight rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-inner px-6"
                                />
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Tactical Brief / Logistics Data</Label>
                                <Input 
                                    value={form.description} 
                                    onChange={e => setForm({ ...form, description: e.target.value })} 
                                    placeholder="Operational notes and specifications..." 
                                    className="h-14 bg-slate-50 border-transparent placeholder:text-muted-foreground/30 font-bold tracking-tight rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-inner px-6"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-6">
                            <Button 
                                onClick={handleSave} 
                                disabled={saving} 
                                className="h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] text-[10px]"
                            >
                                {saving ? "SYNCHRONIZING..." : (editing ? "FINALIZE MODIFICATIONS" : "EXECUTE ENLISTMENT PROTOCOL")}
                            </Button>
                            <Button variant="ghost" onClick={() => setShowModal(false)} className="text-muted-foreground/50 hover:text-foreground font-bold uppercase text-[9px] tracking-[0.3em] transition-colors">Abort Cycle</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
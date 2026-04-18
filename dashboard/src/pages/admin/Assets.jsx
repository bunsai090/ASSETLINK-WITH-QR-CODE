import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { Package, Plus, Search, QrCode, Edit2, Trash2, Printer, CheckSquare, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { sileo } from 'sileo';
import { motion, AnimatePresence } from 'framer-motion';
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

    useEffect(() => {
        const assetsQuery = query(collection(db, 'assets'), orderBy('created_at', 'desc'));
        const unsubscribe = onSnapshot(assetsQuery, (snapshot) => {
            const assetsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAssets(assetsList);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filtered = assets.filter(a => {
        const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.asset_code?.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCategory === 'all' || a.category === filterCategory;
        const matchCond = filterCondition === 'all' || a.condition === filterCondition;
        return matchSearch && matchCat && matchCond;
    });

    // ... (helper functions keep logic same)
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

    function handleOpenQrTab() {
        if (selected.size === 0) return;
        const selectedAssets = filtered.filter(a => selected.has(a.id));

        const cards = selectedAssets.map(asset => {
            const qrUrl = getQrUrl(asset.id);
            return `
                <div class="qr-card">
                    <img src="${qrUrl}" alt="${asset.name}" crossorigin="anonymous" />
                    <p class="name">${asset.name}</p>
                    <p class="code">ID: ${asset.asset_code}</p>
                    ${asset.location ? `<p class="loc">${asset.location}</p>` : ''}
                </div>`;
        }).join('');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Asset QR Codes - AssetLink</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, sans-serif; background: #f8fafc; }
        .toolbar {
            position: fixed; top: 0; left: 0; right: 0; z-index: 100;
            background: #fff; border-bottom: 2px solid #e2e8f0;
            display: flex; align-items: center; justify-content: space-between;
            padding: 16px 32px;
        }
        .toolbar h1 { font-size: 18px; font-weight: 900; color: #008080; letter-spacing: -0.5px; }
        .toolbar p { font-size: 12px; color: #64748b; margin-top: 2px; }
        .btn-download {
            background: #008080; color: #fff; border: none;
            padding: 10px 24px; border-radius: 12px;
            font-size: 13px; font-weight: 800; letter-spacing: 0.5px;
            cursor: pointer; display: flex; align-items: center; gap: 8px;
            transition: background 0.2s;
        }
        .btn-download:hover { background: #006666; }
        .sheet { padding: 100px 32px 48px; max-width: 900px; margin: 0 auto; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .qr-card {
            border: 2px dashed #008080; border-radius: 16px;
            padding: 20px; text-align: center; background: #fff;
        }
        .qr-card img { width: 140px; height: 140px; margin: 0 auto 12px; display: block; }
        .name { font-size: 13px; font-weight: 900; color: #008080; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .code { font-size: 11px; font-weight: 700; color: #64748b; }
        .loc { font-size: 10px; color: #94a3b8; margin-top: 2px; }
        @media print { .toolbar { display: none; } .sheet { padding-top: 0; } }
    </style>
</head>
<body>
    <div class="toolbar">
        <div>
            <h1>📋 AssetLink QR Codes</h1>
            <p>${selectedAssets.length} asset label${selectedAssets.length > 1 ? 's' : ''} selected</p>
        </div>
        <button class="btn-download" onclick="downloadQR()">⬇ Download PDF</button>
    </div>
    <div class="sheet">
        <div class="grid">${cards}</div>
    </div>
    <script>
        function downloadQR() {
            window.print();
        }
    <\/script>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }

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
        if (!form.name || !form.asset_code) { 
            sileo.error({ title: 'Validation Error', description: 'Name and Code are required.' }); 
            return; 
        }
        setSaving(true);
        try {
            if (editing) {
                await updateDoc(doc(db, 'assets', editing.id), { ...form, updated_at: serverTimestamp() });
                sileo.success({ title: 'Asset Updated', description: `Successfully updated ${form.name}.` });
            } else {
                await addDoc(collection(db, 'assets'), { ...form, created_at: serverTimestamp(), updated_at: serverTimestamp() });
                sileo.success({ title: 'Asset Created', description: `Successfully added ${form.name}.` });
            }
            setShowModal(false);
        } catch (error) {
            sileo.error({ title: 'Save Failed', description: 'Could not save asset information.' });
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Permanently delete this asset?')) return;
        try {
            await deleteDoc(doc(db, 'assets', id));
            sileo.success({ title: 'Asset Deleted', description: 'Registration has been removed.' });
        } catch (error) {
            sileo.error({ title: 'Delete Failed', description: 'Could not remove the asset.' });
        }
    }

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground tracking-tight">
                        Inventory <span className="text-primary italic">Control</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-80">
                        {assets.length} items registered across the campus ecosystem.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 shrink-0">
                    {selectMode && selected.size > 0 && (
                        <Button onClick={handleOpenQrTab} variant="outline" className="h-12 border-primary/20 text-primary font-bold rounded-2xl gap-2 px-6 shadow-xl shadow-primary/5">
                            <Printer className="w-4 h-4" /> {`Export Selected (${selected.size})`}
                        </Button>
                    )}
                    {(role === 'admin' || role === 'principal' || role === 'supervisor') && (
                        <Button onClick={() => { setSelectMode(s => !s); setSelected(new Set()); }} variant={selectMode ? 'secondary' : 'outline'} className="h-12 rounded-2xl gap-2 px-6 font-bold transition-all border-border hover:border-primary/20">
                            <QrCode className="w-4 h-4" /> {selectMode ? 'Dismiss Labels' : 'Print Labels'}
                        </Button>
                    )}
                    {(role === 'admin' || role === 'principal' || role === 'supervisor') && (
                        <Button onClick={openCreate} className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl gap-2 px-8 shadow-xl shadow-primary/20">
                            <Plus className="w-5 h-5" /> New Registration
                        </Button>
                    )}
                </div>
            </div>

            {/* Select All Bar */}
            <AnimatePresence>
                {selectMode && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-4 bg-primary/[0.03] border border-primary/10 rounded-3xl px-6 py-4 text-sm"
                    >
                        <button onClick={toggleSelectAll} className="flex items-center gap-2 text-primary font-black hover:opacity-80 uppercase tracking-tighter transition-all">
                            {selected.size === filtered.length ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                            {selected.size === filtered.length ? 'Deselect Range' : 'Select Full Range'}
                        </button>
                        <div className="w-1 h-1 rounded-full bg-primary/20" />
                        <span className="text-muted-foreground font-bold tracking-tight uppercase text-[10px]">{selected.size} specific units selected</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-4 rounded-[2rem] border border-white dark:border-white/5 shadow-sm">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Search registry by name, serial, or code..." 
                        className="pl-11 h-12 bg-transparent border-none ring-0 focus-visible:ring-0 text-foreground font-medium placeholder:text-muted-foreground/50" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                </div>
                <div className="flex gap-4">
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="w-full md:w-56 h-12 bg-white/50 dark:bg-slate-800/50 rounded-2xl border-white dark:border-white/5 shadow-sm font-bold text-xs uppercase tracking-widest px-6">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            <SelectItem value="all">Comprehensive View</SelectItem>
                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-40">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.length === 0 ? (
                        <div className="col-span-full text-center py-40 bg-white/30 dark:bg-slate-900/20 rounded-[3rem] border border-dashed border-border/60 flex flex-col items-center justify-center grayscale opacity-40">
                            <Package className="w-20 h-20 mb-6" />
                            <h3 className="text-2xl font-serif font-bold text-foreground">Registry Empty</h3>
                            <p className="text-xs font-black uppercase tracking-[0.3em] mt-2">Zero matching data points</p>
                        </div>
                    ) : filtered.map((asset, idx) => (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            key={asset.id}
                            onClick={selectMode ? () => toggleSelect(asset.id) : undefined}
                            className={cn(
                                "group relative flex flex-col bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-6 transition-all duration-500 border-2",
                                selectMode ? "cursor-pointer" : "cursor-default",
                                selectMode && selected.has(asset.id) 
                                    ? "border-primary ring-4 ring-primary/5 bg-primary/5" 
                                    : "border-transparent hover:border-primary/20 hover:shadow-2xl hover:shadow-black/5"
                            )}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="relative">
                                    <div className={cn(
                                        "w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-500",
                                        selectMode && selected.has(asset.id) 
                                            ? "bg-primary text-white scale-110 rotate-3 shadow-lg shadow-primary/20" 
                                            : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:rotate-3"
                                    )}>
                                        <Package className="w-7 h-7" />
                                    </div>
                                    {selectMode && (
                                        <div className={cn(
                                            "absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-lg transition-all",
                                            selected.has(asset.id) ? "bg-primary border-primary scale-110" : "bg-white border-slate-200"
                                        )}>
                                            {selected.has(asset.id) && <span className="text-white text-[10px] font-black italic">✓</span>}
                                        </div>
                                    )}
                                </div>
                                {!selectMode && (role === 'admin' || role === 'principal') && (
                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                        <button onClick={(e) => { e.stopPropagation(); openEdit(asset); }} className="p-2.5 rounded-xl bg-white border border-border text-muted-foreground hover:text-primary hover:border-primary shadow-sm transition-all active:scale-90">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }} className="p-2.5 rounded-xl bg-white border border-border text-muted-foreground hover:text-rose-500 hover:border-rose-200 shadow-sm transition-all active:scale-90">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <h3 className="font-serif font-black text-lg text-foreground leading-[1.1] truncate group-hover:text-primary transition-colors">{asset.name}</h3>
                                <div className="flex flex-wrap items-center gap-2 overflow-hidden">
                                    <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 uppercase tracking-widest whitespace-nowrap">
                                        {asset.asset_code}
                                    </span>
                                    {asset.location && (
                                        <span className="text-[11px] font-bold text-muted-foreground line-clamp-1 italic tracking-tight opacity-70">
                                            {asset.location}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-8">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 border border-slate-100 dark:border-white/5 rounded-full px-3 py-1">
                                    {asset.category}
                                </span>
                                {asset.condition && <StatusBadge status={asset.condition} />}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Asset Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-none p-10 bg-white/95 backdrop-blur-2xl">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-3xl font-serif font-bold tracking-tight">
                            {editing ? (
                                <>Edit <span className="text-primary italic">Record</span></>
                            ) : (
                                <>Register <span className="text-primary italic">Asset</span></>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Asset Identity</Label>
                                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dell Smart Hub - Lab Alpha" className="h-14 rounded-2xl bg-secondary/30 border-none font-bold placeholder:font-medium" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Serial / Code</Label>
                                <Input value={form.asset_code} onChange={e => setForm({ ...form, asset_code: e.target.value })} placeholder="AL-001" className="h-14 rounded-2xl bg-secondary/30 border-none font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Tactical Category</Label>
                                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-secondary/30 border-none font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl">{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Current State</Label>
                                <Select value={form.condition} onValueChange={v => setForm({ ...form, condition: v })}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-secondary/30 border-none font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl">{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Precise Location</Label>
                                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Faculty Wing - Rm 3" className="h-14 rounded-2xl bg-secondary/30 border-none font-bold" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 mt-10">
                        <Button onClick={handleSave} disabled={saving} className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 text-sm">
                            {saving ? 'Synchronizing...' : (editing ? 'Submit Changes' : 'Execute Registration')}
                        </Button>
                        <Button variant="ghost" onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground font-bold uppercase text-[10px] tracking-widest">Abort Process</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

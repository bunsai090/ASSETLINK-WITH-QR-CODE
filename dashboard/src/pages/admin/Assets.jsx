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
                <div className="space-y-1.5 translate-y-2">
                    <h1 className="text-4xl md:text-6xl font-serif font-black text-foreground tracking-tighter leading-[1] mb-2 text-balance">
                        Inventory <span className="text-primary italic">Control</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        {assets.length} architectural units registered across the campus ecosystem.
                    </p>
                </div>
                <div className="flex flex-wrap gap-4 shrink-0">
                    {selectMode && selected.size > 0 && (
                        <Button onClick={handleOpenQrTab} variant="outline" className="h-16 px-8 rounded-[1.25rem] border-primary/20 text-primary font-bold gap-2 shadow-xl shadow-primary/5 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Printer className="w-5 h-5" /> {`Export Labels (${selected.size})`}
                        </Button>
                    )}
                    {(role === 'admin' || role === 'principal' || role === 'supervisor') && (
                        <Button onClick={() => { setSelectMode(s => !s); setSelected(new Set()); }} variant={selectMode ? 'secondary' : 'outline'} className="h-16 rounded-[1.25rem] gap-3 px-8 font-bold transition-all border-border hover:border-primary/20 hover:scale-[1.02] active:scale-[0.98]">
                            <QrCode className="w-5 h-5" /> {selectMode ? 'Dismiss Labels' : 'Batch Labels'}
                        </Button>
                    )}
                    {(role === 'admin' || role === 'principal' || role === 'supervisor') && (
                        <Button onClick={openCreate} className="h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-[1.25rem] gap-3 px-10 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Plus className="w-6 h-6" /> New Registration
                        </Button>
                    )}
                </div>
            </motion.div>

            {/* Select All Bar */}
            <AnimatePresence>
                {selectMode && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -10 }}
                        className="flex items-center gap-6 bg-primary/[0.03] border border-primary/10 rounded-[2rem] px-8 py-5 text-sm"
                    >
                        <button onClick={toggleSelectAll} className="flex items-center gap-3 text-primary font-black hover:opacity-80 uppercase tracking-tighter transition-all">
                            {selected.size === filtered.length ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                            {selected.size === filtered.length ? 'Deselect Universe' : 'Select Visible Universe'}
                        </button>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                        <span className="text-muted-foreground font-black uppercase text-[10px] tracking-[0.1em] opacity-60">{selected.size} architectural units staged</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filters Bar */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-6 p-2 bg-border/20 rounded-[2.5rem] border border-border/40 overflow-hidden shadow-sm backdrop-blur-3xl">
                <div className="relative flex-1 group">
                    <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all scale-100 group-focus-within:scale-110" />
                    <Input 
                        placeholder="Search registry by name, serial, or taxonomy..." 
                        className="pl-16 h-16 bg-transparent border-none ring-0 focus-visible:ring-0 text-foreground font-bold text-lg placeholder:text-muted-foreground/30 placeholder:font-medium tracking-tight" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                </div>
                <div className="flex gap-4 p-2">
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="w-full md:w-64 h-12 bg-white rounded-[1.25rem] border-border shadow-sm font-black text-[10px] uppercase tracking-[0.2em] px-8 hover:border-primary/40 transition-all">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[1.5rem] border-border p-2">
                            <SelectItem value="all" className="rounded-xl font-bold uppercase text-[9px] tracking-widest">Comprehensive View</SelectItem>
                            {CATEGORIES.map(c => <SelectItem key={c} value={c} className="rounded-xl font-bold uppercase text-[9px] tracking-widest">{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex justify-center py-60">
                    <div className="w-16 h-16 border-8 border-primary/10 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.length === 0 ? (
                        <div className="col-span-full text-center py-60 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-border/40 flex flex-col items-center justify-center">
                            <motion.div 
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            >
                                <Package className="w-24 h-24 mb-8 text-muted-foreground opacity-20" />
                            </motion.div>
                            <h3 className="text-3xl font-serif font-black text-foreground tracking-tighter">Registry <span className="text-primary italic">Empty</span></h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-3 opacity-40">Zero matching data points detected</p>
                        </div>
                    ) : (filtered.map((asset, idx) => (
                        <motion.div
                            variants={itemVariants}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            key={asset.id}
                            onClick={selectMode ? () => toggleSelect(asset.id) : undefined}
                            className={cn(
                                "group relative flex flex-col bg-white rounded-[2.5rem] p-8 transition-all duration-500 border-2",
                                selectMode ? "cursor-pointer" : "cursor-default",
                                selectMode && selected.has(asset.id) 
                                    ? "border-primary ring-8 ring-primary/5 bg-primary/5 shadow-2xl" 
                                    : "border-transparent hover:border-border hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.1)] shadow-sm"
                            )}
                        >
                            <div className="flex items-start justify-between mb-8">
                                <div className="relative">
                                    <div className={cn(
                                        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500",
                                        selectMode && selected.has(asset.id) 
                                            ? "bg-primary text-white scale-110 rotate-3 shadow-2xl shadow-primary/40" 
                                            : "bg-border/20 text-muted-foreground group-hover:bg-primary group-hover:text-white group-hover:rotate-6 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-primary/30 shadow-sm"
                                    )}>
                                        <Package className="w-8 h-8" />
                                    </div>
                                    {selectMode && (
                                        <div className={cn(
                                            "absolute -top-2 -right-2 w-8 h-8 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all",
                                            selected.has(asset.id) ? "bg-primary border-white scale-110" : "bg-white border-border"
                                        )}>
                                            {selected.has(asset.id) && <span className="text-white text-[12px] font-black italic">✓</span>}
                                        </div>
                                    )}
                                </div>
                                {!selectMode && (role === 'admin' || role === 'principal') && (
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300">
                                        <button onClick={(e) => { e.stopPropagation(); openEdit(asset); }} className="p-3 rounded-2xl bg-white border border-border text-muted-foreground hover:text-primary hover:border-primary hover:scale-110 shadow-sm transition-all active:scale-95">
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }} className="p-3 rounded-2xl bg-white border border-border text-muted-foreground hover:text-rose-500 hover:border-rose-200 hover:scale-110 shadow-sm transition-all active:scale-95">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-3">
                                <h3 className="font-serif font-black text-xl text-foreground leading-[1] truncate group-hover:text-primary transition-colors pr-2 tracking-tight">{asset.name}</h3>
                                <div className="flex flex-wrap items-center gap-3 overflow-hidden">
                                    <span className="text-[10px] font-black text-primary bg-primary/[0.07] px-3 py-1 rounded-full border border-primary/10 uppercase tracking-widest whitespace-nowrap">
                                        {asset.asset_code}
                                    </span>
                                    {asset.location && (
                                        <span className="text-[12px] font-bold text-muted-foreground line-clamp-1 italic tracking-tight opacity-50">
                                            {asset.location}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2.5 mt-10">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 border-2 border-border/30 rounded-full px-4 py-1.5 flex items-center">
                                    {asset.category}
                                </span>
                                {asset.condition && <div className="scale-90 origin-left"><StatusBadge status={asset.condition} /></div>}
                            </div>
                        </motion.div>
                    )))}
                </motion.div>
            )}

            {/* Asset Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-xl rounded-[3rem] border-none p-12 bg-white/95 backdrop-blur-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] ring-1 ring-black/5">
                    <DialogHeader className="mb-10 text-left">
                        <DialogTitle className="text-4xl font-serif font-black tracking-tighter">
                            {editing ? (
                                <>Edit <span className="text-primary italic">Record</span></>
                            ) : (
                                <>Register <span className="text-primary italic">Asset</span></>
                            )}
                        </DialogTitle>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40 mt-2">Inventory lifecycle management protocol</p>
                    </DialogHeader>
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="col-span-2 space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1 opacity-60">Asset Identity</Label>
                                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dell Smart Hub - Lab Alpha" className="h-16 rounded-[1.25rem] bg-border/20 border-none font-black text-lg placeholder:font-medium placeholder:opacity-30 tracking-tight px-7 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all" />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1 opacity-60">Serial / Code</Label>
                                <Input value={form.asset_code} onChange={e => setForm({ ...form, asset_code: e.target.value })} placeholder="AL-001" className="h-16 rounded-[1.25rem] bg-border/20 border-none font-black tracking-widest px-7 focus-visible:ring-2 focus-visible:ring-primary/20" />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1 opacity-60">Taxonomy Category</Label>
                                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                                    <SelectTrigger className="h-16 rounded-[1.25rem] bg-border/20 border-none font-black px-7 uppercase tracking-widest text-[11px] focus-visible:ring-2 focus-visible:ring-primary/20"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl">{CATEGORIES.map(c => <SelectItem key={c} value={c} className="font-bold uppercase tracking-widest text-[10px]">{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1 opacity-60">Unit Status</Label>
                                <Select value={form.condition} onValueChange={v => setForm({ ...form, condition: v })}>
                                    <SelectTrigger className="h-16 rounded-[1.25rem] bg-border/20 border-none font-black px-7 uppercase tracking-widest text-[11px]"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl">{CONDITIONS.map(c => <SelectItem key={c} value={c} className="font-bold uppercase tracking-widest text-[10px]">{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1 opacity-60">Precise Location</Label>
                                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Rooms, Wings, Floors..." className="h-16 rounded-[1.25rem] bg-border/20 border-none font-black px-7" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 mt-12">
                        <Button onClick={handleSave} disabled={saving} className="h-20 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] rounded-[1.5rem] shadow-2xl shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98] text-lg">
                            {saving ? 'Synchronizing Intelligence...' : (editing ? 'Apply Amendments' : 'Execute Registration')}
                        </Button>
                        <Button variant="ghost" onClick={() => setShowModal(false)} className="h-12 text-muted-foreground hover:text-foreground font-black uppercase text-[10px] tracking-[0.3em] opacity-40 hover:opacity-100 transition-all">Terminate Process</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}

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
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Inventory Control</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Tracking {assets.length} architectural units
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {selectMode && selected.size > 0 && (
                        <Button onClick={handleOpenQrTab} variant="outline" className="h-9 text-sm gap-2">
                            <Printer className="w-4 h-4" /> Export Labels ({selected.size})
                        </Button>
                    )}
                    {(role === 'admin' || role === 'principal' || role === 'supervisor') && (
                        <Button onClick={() => { setSelectMode(s => !s); setSelected(new Set()); }} variant={selectMode ? 'secondary' : 'outline'} className="h-9 text-sm gap-2">
                            <QrCode className="w-4 h-4" /> {selectMode ? 'Dismiss' : 'Batch Labels'}
                        </Button>
                    )}
                    {(role === 'admin' || role === 'principal' || role === 'supervisor') && (
                        <Button onClick={openCreate} className="h-9 bg-[hsl(172,75%,17%)] hover:bg-[hsl(172,75%,22%)] text-white text-sm gap-2">
                            <Plus className="w-4 h-4" /> New Asset
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search registry by name, serial, or taxonomy..." 
                        className="pl-9 h-9 bg-white border-border text-sm w-full focus-visible:ring-1 focus-visible:ring-primary/50" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9 bg-white text-sm">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Select All Bar (if selectMode) */}
            {selectMode && (
                <div className="flex items-center gap-4 bg-muted/50 border border-border rounded-lg px-4 py-2 text-sm">
                    <button onClick={toggleSelectAll} className="flex items-center gap-2 text-primary font-medium hover:underline">
                        {selected.size === filtered.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        {selected.size === filtered.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-muted-foreground">| {selected.size} selected</span>
                </div>
            )}

            {/* Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-sm text-muted-foreground">
                        No assets found matching your criteria.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        <div className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_2fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-muted/30">
                            <span className="label-mono w-5"></span>
                            <span className="label-mono">Asset Details</span>
                            <span className="label-mono hidden sm:block">Category</span>
                            <span className="label-mono">Status</span>
                            <span className="label-mono w-16"></span>
                        </div>
                        {filtered.map(asset => (
                            <div key={asset.id} className="data-row grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_2fr_1fr_1fr_auto] gap-4 items-center px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer" onClick={selectMode ? () => toggleSelect(asset.id) : undefined}>
                                <div className="w-5 flex items-center justify-center">
                                    {selectMode ? (
                                        selected.has(asset.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground/40" />
                                    ) : (
                                        <Package className="w-4 h-4 text-muted-foreground/40" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{asset.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{asset.asset_code} {asset.location && `• ${asset.location}`}</p>
                                </div>
                                <div className="hidden sm:flex items-center">
                                    <span className="text-xs text-muted-foreground">{asset.category}</span>
                                </div>
                                <div className="flex items-center">
                                    <StatusBadge status={asset.condition} size="sm" />
                                </div>
                                <div className="w-16 flex justify-end gap-1">
                                    {!selectMode && (role === 'admin' || role === 'principal') && (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); openEdit(asset); }} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted">
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }} className="p-1.5 text-muted-foreground hover:text-rose-500 transition-colors rounded-md hover:bg-rose-500/10">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Asset Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md p-6 bg-card border border-border rounded-xl shadow-lg">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                            {editing ? 'Edit Asset' : 'Register Asset'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-foreground">Asset Name</Label>
                            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dell Smart Hub" className="h-9 bg-white border-border text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-foreground">Serial / Code</Label>
                                <Input value={form.asset_code} onChange={e => setForm({ ...form, asset_code: e.target.value })} placeholder="AL-001" className="h-9 bg-white border-border text-sm" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-foreground">Category</Label>
                                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                                    <SelectTrigger className="h-9 bg-white border-border text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-foreground">Condition</Label>
                                <Select value={form.condition} onValueChange={v => setForm({ ...form, condition: v })}>
                                    <SelectTrigger className="h-9 bg-white border-border text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-foreground">Location</Label>
                                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Room 101" className="h-9 bg-white border-border text-sm" />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
                        <Button variant="ghost" onClick={() => setShowModal(false)} className="h-9 text-sm">Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="h-9 bg-[hsl(172,75%,17%)] hover:bg-[hsl(172,75%,22%)] text-white text-sm px-4">
                            {saving ? 'Saving...' : (editing ? 'Update' : 'Create')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

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

    useEffect(() => {
        const assetsQuery = query(collection(db, 'assets'), orderBy('created_at', 'desc'));
        const unsubscribe = onSnapshot(assetsQuery, (snapshot) => {
            const assetsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAssets(assetsList);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

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
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight italic">Inventory Control</h1>
                    <p className="text-muted-foreground text-sm mt-1">Register and track all official school resources.</p>
                </div>
                <div className="flex gap-2">
                    {selectMode && selected.size > 0 && (
                        <Button onClick={handleOpenQrTab} variant="outline" className="h-10 border-teal text-teal font-bold rounded-xl gap-2 shadow-sm">
                            <Printer className="w-4 h-4" /> {`Print QR (${selected.size})`}
                        </Button>
                    )}
                    {(role === 'admin' || role === 'principal' || role === 'supervisor') && (
                        <Button onClick={() => { setSelectMode(s => !s); setSelected(new Set()); }} variant={selectMode ? 'secondary' : 'outline'} className="h-10 rounded-xl gap-2 font-bold transition-all">
                            <QrCode className="w-4 h-4" /> {selectMode ? 'Cancel' : 'Labels'}
                        </Button>
                    )}
                    {(role === 'admin' || role === 'principal' || role === 'supervisor') && (
                        <Button onClick={openCreate} className="h-10 bg-teal hover:bg-teal/90 text-white font-bold rounded-xl gap-2 shadow-lg shadow-teal/20">
                            <Plus className="w-4 h-4" /> Add Asset
                        </Button>
                    )}
                </div>
            </div>

            {/* Select all bar */}
            {selectMode && (
                <div className="flex items-center gap-3 bg-teal/5 border border-teal/20 rounded-2xl px-5 py-3 text-sm animate-in zoom-in-95 duration-200">
                    <button onClick={toggleSelectAll} className="flex items-center gap-2 text-teal font-black hover:underline uppercase tracking-tighter">
                        {selected.size === filtered.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        {selected.size === filtered.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-muted-foreground font-medium">{selected.size} items selected</span>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-teal transition-colors" />
                    <Input placeholder="Search assets by name or code..." className="pl-9 bg-card border-border h-11" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-48 bg-card border-border h-11"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-teal/20 border-t-teal rounded-full animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.length === 0 ? (
                        <div className="col-span-full text-center py-24 text-muted-foreground bg-card rounded-2xl border border-dashed border-border/60 uppercase font-bold tracking-widest text-xs">
                            <Package className="w-12 h-12 mx-auto mb-4 opacity-10" />
                            No matches found in inventory
                        </div>
                    ) : filtered.map(asset => (
                        <div
                            key={asset.id}
                            onClick={selectMode ? () => toggleSelect(asset.id) : undefined}
                            className={`bg-card rounded-2xl border-2 p-5 flex flex-col hover:shadow-xl transition-all group cursor-${selectMode ? 'pointer' : 'default'} ${selectMode && selected.has(asset.id) ? 'border-teal bg-teal/5 ring-1 ring-teal' : 'border-border'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="relative">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${selectMode && selected.has(asset.id) ? 'bg-teal text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <Package className="w-6 h-6" />
                                    </div>
                                    {selectMode && (
                                        <div className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-sm ${selected.has(asset.id) ? 'bg-teal border-teal' : 'bg-white border-slate-200'}`}>
                                            {selected.has(asset.id) && <span className="text-white text-[11px] font-black italic">✓</span>}
                                        </div>
                                    )}
                                </div>
                                {!selectMode && (role === 'admin' || role === 'principal') && (
                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); openEdit(asset); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-foreground transition-all">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-foreground text-sm uppercase tracking-tight leading-tight">{asset.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black text-teal bg-teal/5 px-1.5 py-0.5 rounded border border-teal/10 uppercase tracking-widest">{asset.asset_code}</span>
                                    {asset.location && <span className="text-[10px] font-bold text-muted-foreground line-clamp-1 italic">{asset.location}</span>}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-5">
                                <span className="text-[10px] font-bold text-slate-400 border border-slate-100 rounded px-2 py-0.5">{asset.category}</span>
                                {asset.condition && <StatusBadge status={asset.condition} />}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md rounded-2xl border-none">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">{editing ? 'Edit Asset Record' : 'Assign New Asset'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Asset Designation</Label>
                                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Smart TV - Grade 10" className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Asset Code</Label>
                                <Input value={form.asset_code} onChange={e => setForm({ ...form, asset_code: e.target.value })} placeholder="TV-10A" className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Category</Label>
                                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Condition</Label>
                                <Select value={form.condition} onValueChange={v => setForm({ ...form, condition: v })}>
                                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                                    <SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Room / Location</Label>
                                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Room 204" className="h-11 rounded-xl" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button onClick={handleSave} disabled={saving} className="h-12 bg-teal hover:bg-teal/90 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-teal/20 transition-all active:scale-95">
                            {saving ? 'Processing...' : (editing ? 'Apply Changes' : 'Register Asset')}
                        </Button>
                        <Button variant="ghost" onClick={() => setShowModal(false)} className="text-slate-400 font-bold uppercase text-[10px]">Cancel</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

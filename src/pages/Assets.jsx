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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Assets</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage all school assets</p>
                </div>
                <div className="flex gap-2">
                    {selectMode && selected.size > 0 && (
                        <Button onClick={handlePrintPdf} disabled={generatingPdf} variant="outline" className="gap-2 border-teal text-teal hover:bg-teal/5">
                            <Printer className="w-4 h-4" /> {generatingPdf ? 'Generating...' : `Print QR (${selected.size})`}
                        </Button>
                    )}
                    <Button onClick={() => { setSelectMode(s => !s); setSelected(new Set()); }} variant={selectMode ? 'secondary' : 'outline'} className="gap-2">
                        <QrCode className="w-4 h-4" /> {selectMode ? 'Cancel Selection' : 'QR Codes'}
                    </Button>
                    {(role === 'admin' || role === 'principal') && (
                        <Button onClick={openCreate} className="bg-teal hover:bg-teal/90 text-white gap-2">
                            <Plus className="w-4 h-4" /> Add Asset
                        </Button>
                    )}
                </div>
            </div>

            {/* Select all bar */}
            {selectMode && (
                <div className="flex items-center gap-3 bg-teal/5 border border-teal/20 rounded-xl px-4 py-2.5 text-sm">
                    <button onClick={toggleSelectAll} className="flex items-center gap-2 text-teal font-medium hover:underline">
                        {selected.size === filtered.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        {selected.size === filtered.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-muted-foreground">{selected.size} of {filtered.length} selected</span>
                    {selected.size > 0 && <span className="text-xs text-teal ml-auto">Click assets to select · Click &quot;Print QR&quot; to generate PDF</span>}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search assets..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterCondition} onValueChange={setFilterCondition}>
                    <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Condition" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Conditions</SelectItem>
                        {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin" /></div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.length === 0 ? (
                        <div className="col-span-full text-center py-16 text-muted-foreground">
                            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No assets found</p>
                        </div>
                    ) : filtered.map(asset => (
                        <div
                            key={asset.id}
                            onClick={selectMode ? () => toggleSelect(asset.id) : undefined}
                            className={`bg-card rounded-2xl border-2 p-4 hover:shadow-md transition-all group cursor-${selectMode ? 'pointer' : 'default'} ${selectMode && selected.has(asset.id) ? 'border-teal bg-teal/5' : 'border-border'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="relative w-10 h-10">
                                    <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
                                        <Package className="w-5 h-5 text-teal" />
                                    </div>
                                    {selectMode && (
                                        <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected.has(asset.id) ? 'bg-teal border-teal' : 'bg-white border-border'}`}>
                                            {selected.has(asset.id) && <span className="text-white text-[10px] font-bold">✓</span>}
                                        </div>
                                    )}
                                </div>
                                {!selectMode && (role === 'admin' || role === 'principal') && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(asset)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => handleDelete(asset.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <h3 className="font-semibold text-foreground text-sm">{asset.name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">#{asset.asset_code}</p>
                            {asset.location && <p className="text-xs text-muted-foreground mt-0.5">{asset.location}</p>}
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{asset.category}</span>
                                {asset.condition && <StatusBadge status={asset.condition} />}
                            </div>
                            {asset.school_name && (
                                <p className="text-xs text-muted-foreground mt-2 truncate">{asset.school_name}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Hidden QR Sheet for PDF rendering */}
            {selectMode && selected.size > 0 && (
                <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none">
                    <div ref={qrSheetRef} style={{ width: 794, padding: 32, backgroundColor: '#fff', fontFamily: 'Inter, sans-serif' }}>
                        <div style={{ marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>AssetLink — QR Code Sheet</h2>
                            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Generated {new Date().toLocaleDateString()} · Scan to view asset status &amp; repair history</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                            {filtered.filter(a => selected.has(a.id)).map(asset => (
                                <div key={asset.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, textAlign: 'center', backgroundColor: '#f8fafc' }}>
                                    <img
                                        src={getQrUrl(asset.id)}
                                        alt={asset.name}
                                        crossOrigin="anonymous"
                                        style={{ width: 120, height: 120, margin: '0 auto 10px' }}
                                    />
                                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>{asset.name}</p>
                                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px' }}>#{asset.asset_code}</p>
                                    {asset.location && <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{asset.location}</p>}
                                    {asset.school_name && <p style={{ fontSize: 10, color: '#94a3b8', margin: '4px 0 0' }}>{asset.school_name}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5 col-span-2">
                                <Label>Asset Name *</Label>
                                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Classroom Chair" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Asset Code *</Label>
                                <Input value={form.asset_code} onChange={e => setForm({ ...form, asset_code: e.target.value })} placeholder="e.g. CHR-001" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Location / Room</Label>
                                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Room 101" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Category</Label>
                                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Condition</Label>
                                <Select value={form.condition} onValueChange={v => setForm({ ...form, condition: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <Label>School Name</Label>
                                <Input value={form.school_name} onChange={e => setForm({ ...form, school_name: e.target.value })} placeholder="e.g. Mabini Elementary School" />
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <Label>Description</Label>
                                <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes..." />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-teal hover:bg-teal/90 text-white">
                            {saving ? 'Saving...' : (editing ? 'Save Changes' : 'Add Asset')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Camera, Upload, Search, AlertTriangle, CheckCircle, QrCode, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sileo } from 'sileo';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ReportDamage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [assets, setAssets] = useState([]);
    const [assetSearch, setAssetSearch] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [form, setForm] = useState({ description: '', priority: 'Medium' });
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [showQR, setShowQR] = useState(false);
    /** @type {React.MutableRefObject<HTMLInputElement | null>} */
    const fileRef = useRef(null);

    useEffect(() => {
        const assetsQuery = query(collection(db, 'assets'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(assetsQuery, (snapshot) => {
            const assetsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAssets(assetsList);
        });
        return () => unsubscribe();
    }, []);

    const filteredAssets = assets.filter(a =>
        !assetSearch || a.name?.toLowerCase().includes(assetSearch.toLowerCase()) || a.asset_code?.toLowerCase().includes(assetSearch.toLowerCase())
    );

    function handlePhoto(e) {
        const file = e.target.files[0];
        if (!file) return;
        setPhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
    }

    async function handleSubmit() {
        if (!selectedAsset || !form.description) { 
            sileo.error({
                title: 'Missing Information',
                description: 'Please select an asset and provide a damage description before submitting.'
            }); 
            return; 
        }
        setSubmitting(true);
        try {
            const reqNum = `RR-${Date.now().toString().slice(-6)}`;
            
            await addDoc(collection(db, 'repair_requests'), {
                request_number: reqNum,
                asset_id: selectedAsset.id,
                asset_name: selectedAsset.name,
                asset_code: selectedAsset.asset_code,
                school_name: selectedAsset.school_name || '',
                school_id: selectedAsset.school_id || '',
                reported_by_email: currentUser?.email?.toLowerCase(),
                reported_by_name: currentUser?.full_name || 'Teacher',
                description: form.description,
                priority: form.priority,
                photo_url: null, 
                status: 'Pending',
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            });

            sileo.success({
                title: 'Report Submitted',
                description: 'Your damage report has been successfully recorded and sent for review.'
            });
            setDone(true);
        } catch (err) {
            sileo.error({
                title: 'Submission Failed',
                description: 'We could not record your damage report. Please try again.'
            });
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    }

    if (done) {
        return (
            <div className="max-w-md mx-auto text-center py-16 space-y-4">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Report Submitted!</h2>
                <p className="text-muted-foreground">Your damage report has been successfully recorded. The principal will review it and assign maintenance staff shortly.</p>
                <div className="flex gap-3 justify-center pt-4">
                    <Button variant="outline" onClick={() => { setDone(false); setSelectedAsset(null); setForm({ description: '', priority: 'Medium' }); setPhoto(null); setPhotoPreview(null); }}>
                        Report Another
                    </Button>
                    <Button onClick={() => navigate('/repair-requests')} className="bg-teal hover:bg-teal/90 text-white font-medium shadow-sm transition-all hover:scale-105 active:scale-95">
                        View Requests
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 px-4">
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Report Damage</h1>
                <p className="text-muted-foreground mt-1.5 school-subtitle">Capture and describe asset damage to request a repair.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start px-4">
                
                {/* LEFT COLUMN: Evidence Preview/Capture */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold text-foreground/80">1. Evidence Photo</Label>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 italic">Recommended</span>
                        </div>
                        <div
                            onClick={() => fileRef.current && fileRef.current.click()}
                            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group min-h-[320px] flex flex-col items-center justify-center ${photoPreview ? 'border-teal/30 bg-teal/5' : 'border-slate-200 hover:border-teal/50 hover:bg-teal/[0.02] bg-slate-50/50'}`}
                        >
                            {photoPreview ? (
                                <div className="relative group w-full">
                                    <div className="rounded-xl overflow-hidden shadow-lg border border-white aspect-[4/3] relative">
                                        <img src={photoPreview} alt="preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera className="w-8 h-8 text-white drop-shadow-md" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={e => { e.stopPropagation(); setPhoto(null); setPhotoPreview(null); }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-red-600 transition-all z-20"
                                        title="Remove photo"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="py-8 space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:bg-teal/10 group-hover:text-teal transition-all duration-300 shadow-sm font-bold">
                                        <Camera className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-slate-900">Take a photo of the damage</p>
                                        <p className="text-xs text-slate-500">Tap to use camera or upload from gallery</p>
                                    </div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-[10px] font-bold text-slate-600 rounded-lg uppercase tracking-wide">
                                        <Upload className="w-3 h-3" /> Max 10MB
                                    </div>
                                </div>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
                        
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 italic text-xs text-slate-500 leading-relaxed">
                            <span className="font-bold text-slate-700">Tip:</span> Clear photos help the maintenance team understand the issue before arriving on site.
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Selection & Metadata */}
                <div className="lg:col-span-7 space-y-8">
                    
                    {/* Step 2: Asset Identification */}
                    <div className="space-y-4">
                        <Label className="text-sm font-semibold text-foreground/80">2. Select Asset</Label>
                        
                        {!selectedAsset ? (
                            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-4">
                                <div className="flex gap-2">
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-teal transition-colors" />
                                        <Input 
                                            placeholder="Search asset (e.g. Chair, PC-001)..." 
                                            className="pl-9 ring-offset-background focus-visible:ring-1 focus-visible:ring-teal" 
                                            value={assetSearch} 
                                            onChange={e => setAssetSearch(e.target.value)} 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-1">
                                    {filteredAssets.length === 0 ? (
                                        <div className="text-center py-10 opacity-50">
                                            <Package className="w-10 h-10 mx-auto text-slate-200 mb-2" />
                                            <p className="text-xs text-slate-400 font-medium">No assets matching your search.</p>
                                        </div>
                                    ) : (
                                        filteredAssets.map(asset => (
                                            <div
                                                key={asset.id}
                                                onClick={() => setSelectedAsset(asset)}
                                                className="flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-teal/30 hover:bg-teal/[0.02] cursor-pointer transition-all duration-200 group"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal/10 group-hover:text-teal transition-colors flex-shrink-0">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">{asset.name}</p>
                                                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter truncate">
                                                        {asset.asset_code}
                                                    </p>
                                                </div>
                                                <CheckCircle className="w-4 h-4 text-slate-100 group-hover:text-teal/40 transition-colors" />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-teal/[0.03] rounded-2xl border border-teal/20 p-4 shadow-sm flex items-center justify-between group animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center text-teal shadow-inner">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900">{selectedAsset.name}</h3>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-teal/10 text-teal rounded uppercase tracking-wider">{selectedAsset.asset_code}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{selectedAsset.location} • {selectedAsset.school_name}</p>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setSelectedAsset(null)} 
                                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                    title="Change asset"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Step 3: Description & Severity */}
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold text-foreground/80">3. Damage Details</Label>
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Required</span>
                            </div>
                            <Textarea
                                rows={5}
                                placeholder="Describe the issue in detail..."
                                className="resize-none rounded-xl border-slate-200 focus:border-teal ring-offset-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Priority Level</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {['Low', 'Medium', 'High', 'Critical'].map(level => {
                                    const active = form.priority === level;
                                    return (
                                        <button
                                            key={level}
                                            onClick={() => setForm({...form, priority: level})}
                                            className={`py-2.5 px-2 rounded-lg text-xs font-semibold transition-all border ${active 
                                                ? (level === 'Critical' ? 'bg-red-500 border-red-500 text-white shadow-md' : 'bg-teal border-teal text-white shadow-md')
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'}`}
                                        >
                                            {level}
                                        </button>
                                    );
                                })}
                            </div>
                            {form.priority === 'Critical' && (
                                <p className="text-[10px] font-bold text-red-500 mt-2 flex items-center gap-1.5 animate-pulse">
                                    <AlertTriangle className="w-3 h-3" /> Principal will be notified immediately.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Final Action */}
                    <div className="pt-4 pb-12">
                        <Button 
                            onClick={handleSubmit} 
                            disabled={submitting || !selectedAsset || !form.description} 
                            className="w-full h-14 bg-teal hover:bg-teal/90 text-white font-bold text-lg rounded-2xl shadow-lg shadow-teal/20 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                        >
                            {submitting ? "Submitting..." : "Submit Damage Report"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

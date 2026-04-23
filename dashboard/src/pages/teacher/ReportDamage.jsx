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
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-inner border border-primary/20">
                    <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight">Report Submitted</h2>
                <p className="text-sm text-muted-foreground">Your damage report has been successfully recorded. The principal will review it and assign maintenance staff shortly.</p>
                <div className="flex gap-3 justify-center pt-4">
                    <Button variant="outline" className="h-9 text-sm" onClick={() => { setDone(false); setSelectedAsset(null); setForm({ description: '', priority: 'Medium' }); setPhoto(null); setPhotoPreview(null); }}>
                        Report Another
                    </Button>
                    <Button onClick={() => navigate('/repair-requests')} className="h-9 text-sm bg-[hsl(172,75%,17%)] hover:bg-[hsl(172,75%,22%)] text-white">
                        View Requests
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Report Damage</h1>
                    <p className="text-sm text-muted-foreground mt-1">Capture and describe asset damage to request a repair.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT COLUMN: Evidence Preview/Capture */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-foreground">Evidence Photo</Label>
                            <span className="text-xs text-muted-foreground">Optional</span>
                        </div>
                        <div
                            onClick={() => fileRef.current && fileRef.current.click()}
                            className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors min-h-[240px] flex flex-col items-center justify-center ${photoPreview ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50 bg-muted/20'}`}
                        >
                            {photoPreview ? (
                                <div className="relative group w-full">
                                    <div className="rounded-lg overflow-hidden border border-border aspect-[4/3] relative">
                                        <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera className="w-8 h-8 text-white drop-shadow-md" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={e => { e.stopPropagation(); setPhoto(null); setPhotoPreview(null); }}
                                        className="absolute -top-2 -right-2 bg-background border border-border text-foreground rounded-full w-8 h-8 flex items-center justify-center shadow-sm hover:bg-muted transition-colors z-20"
                                        title="Remove photo"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="w-12 h-12 mx-auto bg-background border border-border rounded-lg flex items-center justify-center text-muted-foreground shadow-sm">
                                        <Camera className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground">Take a photo of the damage</p>
                                        <p className="text-xs text-muted-foreground">Tap to use camera or upload from gallery</p>
                                    </div>
                                    <div className="inline-flex items-center gap-2 px-2 py-1 bg-muted/50 border border-border text-xs text-muted-foreground rounded-md">
                                        <Upload className="w-3 h-3" /> Max 10MB
                                    </div>
                                </div>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
                        
                        <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground leading-relaxed">
                            <span className="font-medium text-foreground">Tip:</span> Clear photos help the maintenance team understand the issue before arriving on site.
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Selection & Metadata */}
                <div className="lg:col-span-7 space-y-6">
                    
                    {/* Step 2: Asset Identification */}
                    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <Label className="text-sm font-medium text-foreground">Asset Identification</Label>
                        
                        {!selectedAsset ? (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search asset (e.g. Chair, PC-001)..." 
                                        className="pl-9 h-9 bg-background border-border text-sm focus-visible:ring-1 focus-visible:ring-primary/50" 
                                        value={assetSearch} 
                                        onChange={e => setAssetSearch(e.target.value)} 
                                    />
                                </div>

                                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                    {filteredAssets.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Package className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                                            <p className="text-xs text-muted-foreground">No assets matching your search.</p>
                                        </div>
                                    ) : (
                                        filteredAssets.map(asset => (
                                            <div
                                                key={asset.id}
                                                onClick={() => setSelectedAsset(asset)}
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border"
                                            >
                                                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0 border border-border/50">
                                                    <Package className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">{asset.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{asset.asset_code}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-md bg-background border border-primary/20 flex items-center justify-center text-primary">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-medium text-foreground">{selectedAsset.name}</h3>
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">{selectedAsset.asset_code}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{selectedAsset.location} • {selectedAsset.school_name}</p>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setSelectedAsset(null)} 
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Step 3: Description & Severity */}
                    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium text-foreground">Damage Details</Label>
                                <span className="text-xs text-rose-500 font-medium">Required</span>
                            </div>
                            <Textarea
                                rows={4}
                                placeholder="Describe the issue in detail..."
                                className="resize-none bg-background border-border text-sm focus-visible:ring-1 focus-visible:ring-primary/50"
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-foreground">Priority Level</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {['Low', 'Medium', 'High', 'Critical'].map(level => {
                                    const active = form.priority === level;
                                    return (
                                        <button
                                            key={level}
                                            onClick={() => setForm({...form, priority: level})}
                                            className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors border ${active 
                                                ? (level === 'Critical' ? 'bg-rose-500 border-rose-600 text-white shadow-sm' : 'bg-primary border-primary text-white shadow-sm')
                                                : 'bg-background border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                                        >
                                            {level}
                                        </button>
                                    );
                                })}
                            </div>
                            {form.priority === 'Critical' && (
                                <p className="text-xs text-rose-500 mt-2 flex items-center gap-1.5 font-medium">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Principal will be notified immediately.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Final Action */}
                    <div className="pt-2">
                        <Button 
                            onClick={handleSubmit} 
                            disabled={submitting || !selectedAsset || !form.description} 
                            className="w-full h-10 text-sm font-medium bg-[hsl(172,75%,17%)] hover:bg-[hsl(172,75%,22%)] text-white shadow-sm transition-colors"
                        >
                            {submitting ? "Submitting..." : "Submit Damage Report"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

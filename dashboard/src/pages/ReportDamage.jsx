import { useState, useRef, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Camera, Upload, Search, AlertTriangle, CheckCircle, QrCode, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sileo } from 'sileo';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ReportDamage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [assets, setAssets] = useState([]);
    const [assetSearch, setAssetSearch] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [form, setForm] = useState({ description: '', priority: 'Medium' });
    const [photoPreview, setPhotoPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(query(collection(db, 'assets'), orderBy('created_at', 'desc')), (snapshot) => {
            setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const filteredAssets = assets.filter(a =>
        !assetSearch || a.name?.toLowerCase().includes(assetSearch.toLowerCase()) || a.asset_code?.toLowerCase().includes(assetSearch.toLowerCase())
    );

    function handlePhoto(e) {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoPreview(URL.createObjectURL(file));
    }

    async function handleSubmit() {
        if (!selectedAsset || !form.description) { 
            sileo.error({ title: 'Missing Info', description: 'Please select an asset and describe the damage.' }); 
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
                school_name: selectedAsset.school_name || 'N/A',
                school_id: selectedAsset.school_id || 'N/A',
                location: selectedAsset.location || 'N/A',
                reported_by_email: currentUser?.email || 'N/A',
                reported_by_name: currentUser?.full_name || 'Anonymous',
                description: form.description,
                priority: form.priority,
                photo_url: photoPreview || null, // Simplified for now
                status: 'Pending',
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
            });

            setDone(true);
            sileo.success({ title: 'Report Filed', description: 'Incident has been recorded in the sync pipeline.' });
        } catch (err) {
            sileo.error({ title: 'Submission Offline', description: 'Could not sync the report to the cloud.' });
        } finally {
            setSubmitting(false);
        }
    }

    if (done) {
        return (
            <div className="max-w-2xl mx-auto text-center py-20 space-y-8 animate-fade-in relative z-10">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-sm"
                >
                    <CheckCircle className="w-10 h-10 text-primary" />
                </motion.div>
                <div className="space-y-3">
                    <h2 className="text-4xl font-serif font-black text-foreground tracking-tight leading-tight">Report <span className="text-primary italic">Synchronized</span></h2>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto font-medium opacity-60 leading-relaxed">
                        The incident has been registered in the command registry. Administration will review and assign staff shortly.
                    </p>
                </div>
                <div className="flex gap-3 justify-center pt-8">
                    <Button variant="outline" size="lg" className="h-14 rounded-xl px-10 border-border hover:bg-slate-50 font-bold text-sm" onClick={() => { setDone(false); setSelectedAsset(null); setForm({ description: '', priority: 'Medium' }); setPhotoPreview(null); }}>
                        File Another
                    </Button>
                    <Button size="lg" onClick={() => navigate('/repair-requests')} className="h-14 bg-primary hover:bg-primary/95 text-primary-foreground font-black px-12 rounded-xl shadow-lg shadow-primary/10 text-sm">
                        View Pipeline
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-fade-in pb-20 relative z-10 font-sans">
            <div className="space-y-1.5">
                <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                    Incident <span className="text-primary italic">Reporting</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                    Capture technical evidence and initiate the rapid restoration protocol.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                
                {/* LEFT COLUMN: Visual Evidence */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                    <div className="space-y-4">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Visual Evidence</Label>
                        <div
                            onClick={() => fileRef.current?.click()}
                            className={cn(
                                "relative border border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 overflow-hidden group min-h-[400px] flex flex-col items-center justify-center bg-white shadow-sm",
                                photoPreview ? "border-primary/30" : "border-border hover:bg-slate-50"
                            )}
                        >
                            <AnimatePresence mode="wait">
                                {photoPreview ? (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        className="relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-sm"
                                    >
                                        <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="p-4 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                                                <Camera className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                        <button
                                            onClick={e => { e.stopPropagation(); setPhotoPreview(null); }}
                                            className="absolute top-4 right-4 bg-white text-rose-600 rounded-xl w-10 h-10 flex items-center justify-center shadow-lg hover:bg-rose-600 hover:text-white transition-all z-20"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-6 flex flex-col items-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-all duration-300 border border-border">
                                            <Camera className="w-10 h-10" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xl font-serif font-black text-foreground">Initiate Optics</p>
                                            <p className="text-xs font-bold text-muted-foreground tracking-tight opacity-40">Tap to capture or upload evidence</p>
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-[10px] font-black text-muted-foreground/60 rounded-full uppercase tracking-widest border border-border">
                                            <Upload className="w-3.5 h-3.5" /> 10MB Threshold
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
                        
                        <div className="p-6 rounded-2xl bg-slate-50 border border-border flex gap-4">
                            <AlertTriangle className="w-5 h-5 text-primary shrink-0" />
                            <p className="text-xs font-medium text-muted-foreground leading-relaxed opacity-80 mt-0.5 italic">
                                Clear, high-resolution documentation accelerates the diagnostic phase and material procurement efficiency.
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Formal Registry */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-10">
                    
                    {/* Step 2: Asset Identification */}
                    <div className="space-y-4">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Asset Identity</Label>
                        
                        <AnimatePresence mode="wait">
                            {!selectedAsset ? (
                                <motion.div 
                                    key="search"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6"
                                >
                                    <div className="flex gap-3">
                                        <div className="relative flex-1 group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input 
                                                placeholder="Search registry by name or operational code..." 
                                                className="pl-12 h-14 rounded-xl bg-slate-50 border-none font-bold placeholder:font-medium text-sm" 
                                                value={assetSearch} 
                                                onChange={e => setAssetSearch(e.target.value)} 
                                            />
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            onClick={() => setShowQR(!showQR)} 
                                            className={cn(
                                                "h-14 w-14 rounded-xl shrink-0 transition-all p-0 border-border",
                                                showQR ? "bg-primary border-primary text-white shadow-lg shadow-primary/10" : "hover:bg-slate-50"
                                            )}
                                        >
                                            <QrCode className="w-5 h-5" />
                                        </Button>
                                    </div>

                                    <div className="space-y-1 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                                        {filteredAssets.length === 0 ? (
                                            <div className="text-center py-12 opacity-40 flex flex-col items-center italic">
                                                <Package className="w-10 h-10 mb-3 text-muted-foreground" />
                                                <p className="text-xs font-bold">No assets found in registry</p>
                                            </div>
                                        ) : (
                                            filteredAssets.map(asset => (
                                                <div
                                                    key={asset.id}
                                                    onClick={() => setSelectedAsset(asset)}
                                                    className="flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-border hover:bg-slate-50 cursor-pointer transition-all duration-300 group"
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-white group-hover:text-primary shadow-sm transition-all flex-shrink-0">
                                                        <Package className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-serif font-black text-foreground truncate">{asset.name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{asset.asset_code}</span>
                                                            <span className="text-[9px] font-bold text-muted-foreground/40 uppercase">• {asset.location}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="selected"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-primary/5 rounded-2xl border border-primary/20 p-6 shadow-sm flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/10 transition-transform group-hover:rotate-1">
                                            <Package className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-serif font-black text-foreground leading-none">{selectedAsset.name}</h3>
                                                <span className="text-[9px] font-black px-2.5 py-1 bg-primary text-white rounded-lg uppercase tracking-[0.2em] leading-none mb-0.5">{selectedAsset.asset_code}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-muted-foreground/50 mt-1 uppercase tracking-widest">{selectedAsset.location} • {selectedAsset.school_name || 'District'}</p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => setSelectedAsset(null)} 
                                        className="text-muted-foreground/30 hover:text-rose-600 hover:bg-white rounded-xl w-12 h-12 transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Step 3: Logistics Details */}
                    <div className="bg-white rounded-2xl border border-border p-8 shadow-sm space-y-8">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Damage Diagnostics</Label>
                            <Textarea
                                rows={6}
                                placeholder="Describe the physical state, symptoms, and impact... (e.g. Structural fracture in base, persistent performance degradation)"
                                className="resize-none rounded-xl bg-slate-50 border-none font-bold text-sm p-6 placeholder:font-medium placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all focus-visible:bg-white"
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-6">
                            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Logistics Priority</Label>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {['Low', 'Medium', 'High', 'Critical'].map(level => {
                                    const active = form.priority === level;
                                    return (
                                        <button
                                            key={level}
                                            onClick={() => setForm({...form, priority: level})}
                                            className={cn(
                                                "h-11 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border",
                                                active 
                                                    ? (level === 'Critical' ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-primary border-primary text-white shadow-md')
                                                    : 'bg-slate-50 border-border text-muted-foreground/60 hover:border-border hover:bg-slate-100'
                                            )}
                                        >
                                            {level}
                                        </button>
                                    );
                                })}
                            </div>
                            {form.priority === 'Critical' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3 text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100 transition-all"
                                >
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <p className="text-[10px] font-bold tracking-tight uppercase leading-relaxed">Emergency Protocol: High-level tactical administration will be alerted via sync-pipeline immediately.</p>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Final Submission */}
                    <div className="flex flex-col gap-4">
                        <Button 
                            onClick={handleSubmit} 
                            disabled={submitting || !selectedAsset || !form.description} 
                            className="w-full h-16 bg-primary hover:bg-primary/95 text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/10 transition-all active:scale-[0.98] disabled:grayscale disabled:opacity-40"
                        >
                            {submitting ? (
                                <span className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <div className="flex items-center gap-3 uppercase tracking-[0.3em] text-sm">
                                    <Shield className="w-5 h-5" /> 
                                    Synchronize Report
                                </div>
                            )}
                        </Button>
                        <p className="text-[9px] text-center font-bold text-muted-foreground/40 uppercase tracking-[0.2em] italic">
                            {(!selectedAsset || !form.description) ? "Required data fields pending" : "Secure operational transmission active"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
    );
}

function Shield({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
    )
}

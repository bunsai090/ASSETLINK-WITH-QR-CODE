import { useState, useRef, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Camera, Upload, Search, AlertTriangle, CheckCircle, QrCode, X, Package, ShieldAlert, ArrowUpCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-1.5">
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                        Operational <span className="text-primary italic">Intelligence</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        Incident reporting and evidence synchronization registry.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Evidence Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="lg:col-span-5 space-y-8"
                >
                    <div className="bg-white rounded-[2.5rem] border border-border p-10 shadow-sm flex flex-col items-center justify-center min-h-[500px] group transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
                        <div className="relative w-full aspect-square max-w-[350px] flex flex-col items-center justify-center">
                            {photoPreview ? (
                                <div className="relative w-full h-full rounded-[2rem] overflow-hidden border border-border shadow-2xl group-hover:scale-[1.02] transition-transform duration-700">
                                    <img src={photoPreview} alt="damage" className="w-full h-full object-cover" />
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setPhotoPreview(null); }}
                                        className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-rose-600 hover:bg-white transition-all shadow-xl"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <label className="w-full h-full rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-primary/20 transition-all duration-500 group/label shadow-inner p-8 text-center">
                                    <div className="w-20 h-20 rounded-3xl bg-white border border-border flex items-center justify-center text-muted-foreground mb-6 shadow-sm group-hover/label:bg-primary group-hover/label:text-white group-hover/label:scale-110 transition-all duration-500">
                                        <ShieldAlert className="w-10 h-10" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-2 italic">Observation Chamber</span>
                                    <span className="text-xl font-serif font-black text-foreground">Awaiting <span className="text-primary italic">Visual Evidence</span></span>
                                    <p className="text-xs font-medium text-muted-foreground mt-4 leading-relaxed max-w-[200px]">Capture or upload real-time operational damage logs.</p>
                                    <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
                                </label>
                            )}
                        </div>

                        <div className="mt-8 flex flex-col items-center gap-2">
                            <div className="flex gap-1.5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all duration-700", photoPreview ? 'bg-primary scale-x-150' : 'bg-slate-200')} />
                                ))}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 italic">Registry Status: {photoPreview ? 'Evidence Captured' : 'Awaiting Link'}</span>
                        </div>
                    </div>

                    <div className="bg-slate-50/50 border border-border rounded-[2.5rem] p-8 flex items-start gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center text-primary shadow-sm">
                            <Search className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Protocol Verification</span>
                            <p className="text-xs font-medium text-foreground/70 leading-relaxed italic mt-1">High-fidelity imagery ensures accelerated command approval and tactical resolution deployment.</p>
                        </div>
                    </div>
                </motion.div>

                {/* Form Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    className="lg:col-span-7 bg-white rounded-[2.5rem] border border-border p-10 shadow-sm"
                >
                    <div className="mb-10">
                        <h3 className="text-2xl font-serif font-black text-foreground">Incident <span className="text-primary italic">Nomenclature</span></h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mt-1">Tactical Asset Damage Logging</p>
                    </div>

                    <div className="space-y-10">
                        {/* Step 2: Asset Identification */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Asset Identity</Label>
                            
                            <AnimatePresence mode="wait">
                                {!selectedAsset ? (
                                    <motion.div 
                                        key="search"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="bg-slate-50 rounded-3xl border border-transparent p-6 shadow-inner space-y-6"
                                    >
                                        <div className="flex gap-3">
                                            <div className="relative flex-1 group">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input 
                                                    placeholder="Search registry by name or operational code..." 
                                                    className="pl-12 h-14 rounded-2xl bg-white border-none font-bold placeholder:font-medium text-sm shadow-sm" 
                                                    value={assetSearch} 
                                                    onChange={e => setAssetSearch(e.target.value)} 
                                                />
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                onClick={() => setShowQR(!showQR)} 
                                                className={cn(
                                                    "h-14 w-14 rounded-2xl shrink-0 transition-all p-0 border-border bg-white shadow-sm",
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
                                                        className="flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-border hover:bg-white cursor-pointer transition-all duration-300 group"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white shadow-sm transition-all flex-shrink-0">
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
                                        className="bg-primary/5 rounded-3xl border border-primary/20 p-6 shadow-sm flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20 transition-transform group-hover:rotate-1">
                                                <Package className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-2xl font-serif font-black text-foreground leading-none">{selectedAsset.name}</h3>
                                                    <span className="text-[9px] font-black px-2.5 py-1 bg-primary text-white rounded-lg uppercase tracking-[0.2em] leading-none mb-0.5">{selectedAsset.asset_code}</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-muted-foreground/50 mt-1 uppercase tracking-widest italic">{selectedAsset.location} • {selectedAsset.school_name || 'District Campus'}</p>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => setSelectedAsset(null)} 
                                            className="text-muted-foreground/30 hover:text-rose-600 hover:bg-white rounded-2xl w-12 h-12 transition-all"
                                        >
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Tactical Urgency</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Low', 'Medium', 'High', 'Critical'].map(level => {
                                        const active = form.priority === level;
                                        return (
                                            <button
                                                key={level}
                                                onClick={() => setForm({...form, priority: level})}
                                                className={cn(
                                                    "h-12 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border",
                                                    active 
                                                        ? (level === 'Critical' ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-primary border-primary text-white shadow-lg shadow-primary/10')
                                                        : 'bg-slate-50 border-transparent text-muted-foreground/40 hover:bg-slate-100'
                                                )}
                                            >
                                                {level}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Protocol Logic</Label>
                                <div className={cn(
                                    "p-4 rounded-2xl border transition-all h-12 flex items-center justify-center",
                                    form.priority === 'Critical' ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-transparent"
                                )}>
                                    <p className={cn(
                                        "text-[10px] font-black uppercase tracking-widest",
                                        form.priority === 'Critical' ? "text-rose-600" : "text-muted-foreground/40"
                                    )}>
                                        {form.priority === 'Critical' ? "Emergency Trigger Mode" : "Standard Cycle"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Damage Narrative</Label>
                            <Textarea 
                                rows={6} 
                                value={form.description} 
                                onChange={e => setForm({ ...form, description: e.target.value })} 
                                placeholder="Log specific logistics constraints, physical anomalies, or operational failures encountered..." 
                                className="resize-none rounded-[2rem] bg-slate-50 border-transparent font-bold text-sm p-8 placeholder:font-medium placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-inner"
                            />
                        </div>

                        <div className="flex flex-col gap-4 pt-6">
                            <Button 
                                onClick={handleSubmit} 
                                disabled={submitting || !selectedAsset || !form.description} 
                                className="h-20 bg-primary hover:bg-primary/95 text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-primary/30 transition-all active:scale-[0.98] group/btn text-[10px]"
                            >
                                {submitting ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        SYNCHRONIZING PROTOCOL...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <ArrowUpCircle className="w-6 h-6 group-hover:translate-y-[-2px] transition-transform" />
                                        FINALIZE & DISPATCH REGISTRY
                                    </div>
                                )}
                            </Button>
                            <p className="text-center text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/20 italic">Authorizing personnel: {currentUser?.full_name || 'Protocol Unknown'}</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}




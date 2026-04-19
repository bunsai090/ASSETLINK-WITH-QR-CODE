import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { School, Plus, Edit2, Trash2, MapPin, Phone, Mail, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Schools() {
    const { currentUser } = useAuth();
    const role = currentUser?.role || 'teacher';
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', address: '', region: '', division: '', principal_name: '', contact_email: '', contact_phone: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'schools'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setSchools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    function openCreate() {
        setEditing(null);
        setForm({ name: '', address: '', region: '', division: '', principal_name: '', contact_email: '', contact_phone: '' });
        setShowModal(true);
    }

    function openEdit(s) {
        setEditing(s);
        setForm({ name: s.name, address: s.address || '', region: s.region || '', division: s.division || '', principal_name: s.principal_name || '', contact_email: s.contact_email || '', contact_phone: s.contact_phone || '' });
        setShowModal(true);
    }

    async function handleSave() {
        if (!form.name) { toast.error('School name is required'); return; }
        setSaving(true);
        try {
            if (editing) {
                await updateDoc(doc(db, 'schools', editing.id), { 
                    ...form,
                    updated_at: serverTimestamp()
                });
                toast.success('School updated');
            } else {
                await addDoc(collection(db, 'schools'), {
                    ...form,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });
                toast.success('School added');
            }
            setShowModal(false);
        } catch (error) {
            toast.error('Failed to save school');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this school?')) return;
        try {
            await deleteDoc(doc(db, 'schools', id));
            toast.success('School deleted');
        } catch (error) {
            toast.error('Failed to delete school');
        }
    }

    return (
        <div className="space-y-12 animate-fade-in pb-20 relative z-10 font-sans">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-1.5">
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                        Institutional <span className="text-primary italic">Registries</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        Strategic management of academic campuses and jurisdictional assets.
                    </p>
                </div>
                {role === 'admin' && (
                    <Button 
                        onClick={openCreate} 
                        className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4 mr-3" /> Initialize New Institution
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 italic">Synchronizing Registries...</p>
                </div>
            ) : schools.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-[2.5rem] border border-border shadow-sm">
                    <School className="w-20 h-20 mx-auto mb-6 text-muted-foreground/20" />
                    <h3 className="text-2xl font-serif font-black text-foreground mb-2">Registry <span className="text-primary italic">Empty</span></h3>
                    <p className="text-muted-foreground max-w-xs mx-auto text-sm font-medium leading-relaxed opacity-60">No academic institutions have been identified in the current deployment zone.</p>
                    {role === 'admin' && (
                        <Button onClick={openCreate} variant="outline" className="mt-8 h-12 px-6 rounded-xl border-border text-[10px] font-black uppercase tracking-widest">
                            Add Primary Institution
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {schools.map((school, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={school.id} 
                            className="bg-white rounded-[2.5rem] border border-border p-8 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group relative overflow-hidden"
                        >
                            {/* Accent Bar */}
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-50 group-hover:bg-primary transition-colors" />
                            
                            <div className="flex items-start justify-between mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-500">
                                    <School className="w-8 h-8" />
                                </div>
                                {role === 'admin' && (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => openEdit(school)} 
                                            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-border hover:bg-white hover:shadow-md transition-all text-muted-foreground hover:text-primary"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(school.id)} 
                                            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-border hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all text-muted-foreground"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-serif font-black text-foreground tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors">{school.name}</h3>
                                    {school.division && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-primary/40" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">{school.division} Division</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-slate-50 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50/50 flex items-center justify-center border border-border/40">
                                            <MapPin className="w-4 h-4 text-muted-foreground/40" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">Deployment Zone</span>
                                            <span className="text-xs font-bold text-foreground/70 truncate max-w-[180px]">{school.address || "Sector Unspecified"}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50/50 flex items-center justify-center border border-border/40">
                                            <Users className="w-4 h-4 text-muted-foreground/40" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">Authority Lead</span>
                                            <span className="text-xs font-black text-primary italic leading-tight">{school.principal_name || "Protocol Pending"}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="flex flex-col gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5"><Mail className="w-2 h-2" /> Comms Channel</span>
                                            <span className="text-[10px] font-bold text-foreground truncate">{school.contact_email || "N/A"}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5"><Phone className="w-2 h-2" /> Tactical Line</span>
                                            <span className="text-[10px] font-bold text-foreground truncate">{school.contact_phone || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* School Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border border-border p-0 overflow-hidden bg-white shadow-2xl font-sans">
                    <div className="p-10 pb-8 border-b border-border bg-slate-50/50">
                        <DialogTitle className="text-4xl font-serif font-black tracking-tight text-foreground">
                            {editing ? 'Modify' : 'Initialize'} <span className="text-primary italic">Institution</span>
                        </DialogTitle>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mt-2 italic">Strategic Nexus Registry Update</p>
                    </div>

                    <div className="p-10 space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Nomenclature Identification *</Label>
                                <Input 
                                    value={form.name} 
                                    onChange={e => setForm({ ...form, name: e.target.value })} 
                                    placeholder="Registry name for institution..." 
                                    className="h-14 bg-slate-50 border-transparent placeholder:text-muted-foreground/30 font-bold tracking-tight rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-inner px-6"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Regional Jurisdiction</Label>
                                <Input 
                                    value={form.region} 
                                    onChange={e => setForm({ ...form, region: e.target.value })} 
                                    placeholder="e.g. Region IV-A" 
                                    className="h-14 bg-slate-50 border-transparent placeholder:text-muted-foreground/30 font-bold tracking-tight rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-inner px-6"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Division Sector</Label>
                                <Input 
                                    value={form.division} 
                                    onChange={e => setForm({ ...form, division: e.target.value })} 
                                    placeholder="e.g. Batangas Site" 
                                    className="h-14 bg-slate-50 border-transparent placeholder:text-muted-foreground/30 font-bold tracking-tight rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-inner px-6"
                                />
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Tactical Deployment Zone / Address</Label>
                                <Input 
                                    value={form.address} 
                                    onChange={e => setForm({ ...form, address: e.target.value })} 
                                    placeholder="Full street deployment coordinates..." 
                                    className="h-14 bg-slate-50 border-transparent placeholder:text-muted-foreground/30 font-bold tracking-tight rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-inner px-6"
                                />
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Institutional Authority lead</Label>
                                <Input 
                                    value={form.principal_name} 
                                    onChange={e => setForm({ ...form, principal_name: e.target.value })} 
                                    placeholder="Principal / Lead Administrator full name" 
                                    className="h-14 bg-slate-50 border-transparent placeholder:text-muted-foreground/30 font-bold tracking-tight rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-inner px-6"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Comms Channel / Email</Label>
                                <Input 
                                    type="email" 
                                    value={form.contact_email} 
                                    onChange={e => setForm({ ...form, contact_email: e.target.value })} 
                                    placeholder="contact@school.edu.ph" 
                                    className="h-14 bg-slate-50 border-transparent placeholder:text-muted-foreground/30 font-bold tracking-tight rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-inner px-6"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Tactical Line / Phone</Label>
                                <Input 
                                    value={form.contact_phone} 
                                    onChange={e => setForm({ ...form, contact_phone: e.target.value })} 
                                    placeholder="09xx-xxx-xxxx" 
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
                                {saving ? "SYNCHRONIZING..." : (editing ? "FINALIZE MODIFICATIONS" : "EXECUTE INITIALIZATION PROTOCOL")}
                            </Button>
                            <Button variant="ghost" onClick={() => setShowModal(false)} className="text-muted-foreground/50 hover:text-foreground font-bold uppercase text-[9px] tracking-[0.3em] transition-colors">Abort Initialization</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { Wrench, CheckCircle, Clock, AlertCircle, Camera, Image as ImageIcon, UploadCloud, X, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { sileo } from 'sileo';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const TASK_STATUSES = ['Assigned', 'In Progress', 'On Hold', 'Completed', 'Pending Teacher Verification'];

export default function Tasks() {
    const { currentUser } = useAuth();
    const role = currentUser?.role || 'maintenance';
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ status: '', notes: '', materials_used: '', actual_cost: '', completion_photo: '' });
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [saving, setSaving] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        if (!currentUser) return;

        let tasksQuery;
        if (role === 'maintenance') {
            // Maintenance staff only see tasks assigned to them
            tasksQuery = query(
                collection(db, 'maintenance_tasks'),
                where('assigned_to_name', '==', currentUser.full_name)
            );
        } else {
            // Admin/Principal see everything
            tasksQuery = query(
                collection(db, 'maintenance_tasks'),
                orderBy('created_at', 'desc')
            );
        }

        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const tasksList = snapshot.docs.map(doc => {
                /** @type {any} */
                const data = doc.data();
                return { ...data, id: doc.id };
            });
            
            // Client-side sorting by date (descending)
            const sorted = tasksList.sort((a, b) => {
                /** @type {any} */ const taskA = a;
                /** @type {any} */ const taskB = b;
                const dateA = taskA.created_at?.toDate ? taskA.created_at.toDate() : new Date(0);
                const dateB = taskB.created_at?.toDate ? taskB.created_at.toDate() : new Date(0);
                return dateB - dateA;
            });

            setTasks(sorted);
            setLoading(false);
        }, (error) => {
            console.error('[AssetLink] Maintenance Tasks Listener Error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, role]);

    function openTask(task) {
        setSelected(task);
        setForm({ 
            status: task.status, 
            notes: task.notes || '', 
            materials_used: task.materials_used || '', 
            actual_cost: task.actual_cost || '',
            completion_photo: task.completion_photo || ''
        });
    }

    async function compressImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                if (typeof event.target?.result !== 'string') return;
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                    }, 'image/jpeg', 0.7); // 70% quality
                };
            };
        });
    }

    async function handleFileUpload(e) {
        const rawFile = e.target.files[0];
        if (!rawFile) return;

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (cloudName === 'your_cloud_name' || !cloudName) {
            sileo.error({ title: 'Config Required', description: 'Please set your Cloudinary keys in the .env file.' });
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            // Still compress image before Cloudinary for speed
            const file = await compressImage(rawFile);
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);

            // Using XMLHttpRequest to track progress since Cloudinary doesn't support progress in simple fetch
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, true);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progress = (event.loaded / event.total) * 100;
                    setUploadProgress(progress);
                }
            };

            xhr.onload = () => {
                const response = JSON.parse(xhr.responseText);
                if (xhr.status === 200) {
                    setForm(prev => ({ ...prev, completion_photo: response.secure_url }));
                    setUploading(false);
                    sileo.success({ title: 'Upload Successful', description: 'Photo proof uploaded to Cloudinary.' });
                } else {
                    console.error(response);
                    sileo.error({ title: 'Upload Failed', description: response.error?.message || 'Check Cloudinary settings.' });
                    setUploading(false);
                }
            };

            xhr.onerror = () => {
                sileo.error({ title: 'Upload Error', description: 'Network error or CORS issue with Cloudinary.' });
                setUploading(false);
            };

            xhr.send(formData);
        } catch (err) {
            console.error(err);
            setUploading(false);
        }
    }

    async function handleUpdate() {
        setSaving(true);
        try {
            const updateData = {
                status: form.status,
                notes: form.notes,
                materials_used: form.materials_used,
                actual_cost: form.actual_cost ? parseFloat(form.actual_cost) : 0,
                completion_photo: form.completion_photo,
                updated_at: serverTimestamp()
            };

            // Business Logic: If marked as Completed, move to verification stage
            if (form.status === 'Completed') {
                updateData.status = 'Pending Teacher Verification';
                updateData.completed_at = serverTimestamp();
            }

            // 1. Update the Maintenance Task
            await updateDoc(doc(db, 'maintenance_tasks', selected.id), updateData);

            // 2. Sync status to the original Repair Request
            if (selected.repair_request_id) {
                await updateDoc(doc(db, 'repair_requests', selected.repair_request_id), {
                    status: updateData.status,
                    maintenance_notes: form.notes,
                    materials_used: form.materials_used,
                    actual_cost: updateData.actual_cost,
                    completion_photo: form.completion_photo,
                    maintenance_staff_name: selected.assigned_to_name,
                    updated_at: serverTimestamp()
                });
            }

            sileo.success({
                title: 'Task Synchronized',
                description: 'Status update successful! The teacher has been notified for verification.'
            });
            setSelected(null);
        } catch (error) {
            console.error(error);
            sileo.error({ title: 'Sync Error', description: 'Could not update task status.' });
        } finally {
            setSaving(false);
        }
    }

    const displayed = tasks.filter(t => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'Completed') {
            return t.status === 'Completed' || t.status === 'Pending Teacher Verification';
        }
        return t.status === filterStatus;
    });
    const counts = {
        Assigned: tasks.filter(t => t.status === 'Assigned').length,
        'In Progress': tasks.filter(t => t.status === 'In Progress').length,
        Completed: tasks.filter(t => t.status === 'Pending Teacher Verification' || t.status === 'Completed').length,
    };

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
            <motion.div variants={itemVariants} className="px-1">
                <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                    Service <span className="text-primary italic">Record</span>
                </h1>
                <p className="text-muted-foreground text-lg mt-2 font-medium tracking-tight opacity-70">
                    Manage and synchronize your assigned school restoration protocols.
                </p>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { label: 'Assigned', count: counts.Assigned, icon: Clock, color: 'text-blue-600 bg-blue-50/50 border-blue-100' },
                    { label: 'Active', count: counts['In Progress'], icon: Wrench, color: 'text-amber-600 bg-amber-50/50 border-amber-100' },
                    { label: 'Completed', count: counts.Completed, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50/50 border-emerald-100' },
                ].map(({ label, count, icon: Icon, color }) => (
                    <motion.div 
                        whileHover={{ y: -5 }}
                        key={label} 
                        className={cn("rounded-[2.5rem] border p-8 text-center transition-all duration-500", color)}
                    >
                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm border border-black/5">
                            <Icon className="w-7 h-7" />
                        </div>
                        <p className="text-4xl font-serif font-black tracking-tighter leading-none">{count}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mt-3">{label}</p>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center gap-4 bg-white p-2 rounded-[1.5rem] border border-border w-fit shadow-sm">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-64 h-12 bg-transparent border-none font-black text-[10px] uppercase tracking-widest px-6 focus:ring-0">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            <SelectValue placeholder="Registry State" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border">
                        <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">Universal Record</SelectItem>
                        {TASK_STATUSES.map(s => <SelectItem key={s} value={s} className="text-[10px] font-black uppercase tracking-widest">{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </motion.div>

            {loading ? (
                <div className="flex justify-center py-40">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {displayed.length === 0 ? (
                        <motion.div variants={itemVariants} className="text-center py-40 bg-white rounded-[2.5rem] border border-dashed border-border flex flex-col items-center justify-center">
                            <Wrench className="w-20 h-20 mx-auto mb-6 text-primary opacity-10" />
                            <h3 className="text-2xl font-serif font-black text-foreground tracking-tight italic">Clear Workload</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2 text-muted-foreground opacity-60">No maintenance protocols encountered in your schedule</p>
                        </motion.div>
                    ) : (
                        displayed.map((task, idx) => (
                            <motion.div
                                variants={itemVariants}
                                key={task.id}
                                onClick={() => openTask(task)}
                                className="bg-white rounded-[2.5rem] border border-border p-8 hover:shadow-[0_20px_50px_rgb(0,0,0,0.06)] hover:bg-slate-50/50 hover:border-primary/20 transition-all cursor-pointer group"
                            >
                                <div className="flex flex-col md:flex-row md:items-center gap-8">
                                    <div className="w-20 h-20 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-muted-foreground/30 group-hover:bg-primary group-hover:text-white transition-all duration-500 flex-shrink-0 shadow-inner group-hover:shadow-lg group-hover:shadow-primary/20">
                                        <Wrench className="w-10 h-10" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-4 flex-wrap mb-3">
                                            <h3 className="text-2xl font-serif font-black text-foreground tracking-tight group-hover:text-primary transition-colors leading-none">{task.asset_name}</h3>
                                            <div className="flex items-center gap-2">
                                                <StatusBadge status={task.priority || 'Medium'} size="xs" />
                                                <StatusBadge status={task.status} size="xs" />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                                            <span className="flex items-center gap-2 italic">{task.school_name || 'Assigned School'}</span>
                                            {task.request_number && (
                                                <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary rounded-full border border-primary/10">
                                                    SYNC # {task.request_number}
                                                </div>
                                            )}
                                        </div>
                                        {task.notes && <p className="text-xs text-muted-foreground/60 mt-6 italic font-medium leading-relaxed border-l-2 border-slate-100 pl-4 group-hover:border-primary/20 transition-colors">"{task.notes}"</p>}
                                    </div>
                                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0">
                                        <div className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.3em] font-sans">
                                            {task.created_at?.toDate ? format(task.created_at.toDate(), 'MMM d, yyyy') : 'Recent'}
                                        </div>
                                        <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-500">
                                            <ArrowRight className="w-5 h-5 translate-x-0 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl border-none">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight">Update Service Record</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-6 pt-2">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{selected.asset_name}</p>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">{selected.school_name} | Ref: {selected.request_number}</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Problem Reported</Label>
                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                    <p className="text-sm font-medium text-amber-900 italic leading-relaxed">
                                        "{selected.description || 'No description provided'}"
                                    </p>
                                    <p className="text-[10px] font-bold text-amber-700 mt-2 text-right">
                                        — Reported by {selected.reported_by_name || 'Teacher'}
                                    </p>
                                </div>
                            </div>

                            {selected.photo_url && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Damage Evidence</Label>
                                    <div className="rounded-xl overflow-hidden border border-slate-200">
                                        <img src={selected.photo_url} alt="Evidence" className="w-full h-auto object-cover max-h-[200px]" />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Task Completion Proof</Label>
                                    {form.completion_photo ? (
                                        <div className="relative group rounded-xl overflow-hidden border border-teal-200">
                                            <img src={form.completion_photo} alt="Proof" className="w-full h-auto object-cover max-h-[150px]" />
                                            <button onClick={() => setForm({...form, completion_photo: ''})} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                                            <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
                                            <div className="flex flex-col items-center gap-2">
                                                {uploading ? (
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 border-4 border-teal/20 border-t-teal rounded-full animate-spin mb-2" />
                                                        <span className="text-xs font-bold text-teal">{Math.round(uploadProgress)}% Uploading...</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <UploadCloud className="w-8 h-8 text-slate-300 group-hover:text-teal transition-colors" />
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Click to upload proof</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Current Progress</Label>
                                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                                        <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {TASK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Service Notes / Remarks</Label>
                                    <Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="What was done to the asset?" className="rounded-xl bg-slate-50 focus:bg-white min-h-[100px]" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Materials Used</Label>
                                        <Input value={form.materials_used} onChange={e => setForm({ ...form, materials_used: e.target.value })} placeholder="Nails, Wire, etc." className="h-11 rounded-xl bg-slate-50 focus:bg-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Total Cost (₱)</Label>
                                        <Input type="number" value={form.actual_cost} onChange={e => setForm({ ...form, actual_cost: e.target.value })} placeholder="0.00" className="h-11 rounded-xl bg-slate-50 focus:bg-white" />
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handleUpdate} disabled={saving} className="w-full h-12 bg-teal hover:bg-teal/90 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-teal/20 transition-all active:scale-95">
                                {saving ? 'Syncing...' : 'Submit Update'}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}

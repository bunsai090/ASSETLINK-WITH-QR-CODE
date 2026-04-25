import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

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

        const fetchTasks = async () => {
            let query = supabase.from('maintenance_tasks').select('*');
            
            if (role === 'maintenance') {
                query = query.eq('assigned_to_name', currentUser.full_name);
            }
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (data) setTasks(data);
            setLoading(false);
        };

        fetchTasks();

        const channel = supabase
            .channel('tasks_sync')
            .on('postgres_changes', { event: '*', table: 'maintenance_tasks' }, () => {
                fetchTasks();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
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

        // @ts-ignore
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        // @ts-ignore
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
            const now = new Date().toISOString();
            const updateData = {
                status: form.status,
                notes: form.notes,
                materials_used: form.materials_used,
                actual_cost: form.actual_cost ? parseFloat(form.actual_cost) : 0,
                completion_photo: form.completion_photo,
                updated_at: now
            };

            // Business Logic: If marked as Completed, move to verification stage
            if (form.status === 'Completed') {
                updateData.status = 'Pending Teacher Verification';
                updateData.completed_at = now;
            }

            // 1. Update the Maintenance Task
            const { error: mtError } = await supabase
                .from('maintenance_tasks')
                .update(updateData)
                .eq('id', selected.id);

            if (mtError) throw mtError;

            // 2. Sync status to the original Repair Request
            if (selected.repair_request_id) {
                const { error: rrError } = await supabase
                    .from('repair_requests')
                    .update({
                        status: updateData.status,
                        maintenance_notes: form.notes,
                        materials_used: form.materials_used,
                        actual_cost: updateData.actual_cost,
                        completion_photo: form.completion_photo,
                        maintenance_staff_name: selected.assigned_to_name,
                        updated_at: now
                    })
                    .eq('id', selected.repair_request_id);
                
                if (rrError) throw rrError;
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

    const [search, setSearch] = useState('');

    const displayed = tasks.filter(t => {
        const matchSearch = t.asset_name?.toLowerCase().includes(search.toLowerCase()) || 
                            t.school_name?.toLowerCase().includes(search.toLowerCase()) ||
                            t.request_number?.toLowerCase().includes(search.toLowerCase());
        
        if (!matchSearch) return false;
        if (filterStatus === 'all') return true;
        if (filterStatus === 'Completed') {
            return t.status === 'Completed' || t.status === 'Pending Teacher Verification';
        }
        return t.status === filterStatus;
    });

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Service Record</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage and synchronize your assigned school restoration protocols.
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Filter by asset, school, or request number..." 
                        className="pl-9 h-9 bg-white border-border text-sm w-full focus-visible:ring-1 focus-visible:ring-primary/50" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9 bg-white text-sm">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Universal Record</SelectItem>
                        {TASK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="p-12 text-center text-sm text-muted-foreground">
                        No maintenance protocols encountered in your schedule.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-muted/30">
                            <span className="label-mono">Asset & Request</span>
                            <span className="label-mono hidden sm:block">Priority</span>
                            <span className="label-mono">Status</span>
                            <span className="label-mono hidden sm:block">Date</span>
                        </div>
                        {displayed.map(task => (
                            <div key={task.id} onClick={() => openTask(task)} className="data-row grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-foreground truncate">{task.asset_name}</p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-muted-foreground truncate">{task.school_name}</p>
                                        <span className="text-[10px] text-muted-foreground/60">•</span>
                                        <p className="text-xs text-muted-foreground font-mono">{task.request_number}</p>
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <StatusBadge status={task.priority || 'Medium'} size="xs" />
                                </div>
                                <div>
                                    <StatusBadge status={task.status} size="xs" />
                                </div>
                                <div className="hidden sm:block text-xs text-muted-foreground">
                                    {task.created_at ? format(new Date(task.created_at), 'MMM d, yyyy') : 'Recent'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Service Record</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 pt-2">
                            <div className="bg-muted p-3 rounded-md border border-border">
                                <p className="text-sm font-medium text-foreground">{selected.asset_name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{selected.school_name} | Ref: {selected.request_number}</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Problem Reported</Label>
                                <div className="bg-amber-500/10 p-3 rounded-md border border-amber-500/20">
                                    <p className="text-sm text-foreground">
                                        "{selected.description || 'No description provided'}"
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2 text-right">
                                        — Reported by {selected.reported_by_name || 'Teacher'}
                                    </p>
                                </div>
                            </div>

                            {selected.photo_url && (
                                <div className="space-y-2">
                                    <Label>Damage Evidence</Label>
                                    <div className="rounded-md overflow-hidden border border-border">
                                        <img src={selected.photo_url} alt="Evidence" className="w-full h-auto object-cover max-h-[200px]" />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Task Completion Proof</Label>
                                    {form.completion_photo ? (
                                        <div className="relative group rounded-md overflow-hidden border border-border">
                                            <img src={form.completion_photo} alt="Proof" className="w-full h-auto object-cover max-h-[150px]" />
                                            <button onClick={() => setForm({...form, completion_photo: ''})} className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative border-2 border-dashed border-border rounded-md p-6 text-center hover:bg-muted transition-colors cursor-pointer group">
                                            <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
                                            <div className="flex flex-col items-center gap-2">
                                                {uploading ? (
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-2" />
                                                        <span className="text-xs text-muted-foreground">{Math.round(uploadProgress)}% Uploading...</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <UploadCloud className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        <span className="text-xs text-muted-foreground">Click to upload proof</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Current Progress</Label>
                                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {TASK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Service Notes / Remarks</Label>
                                    <Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="What was done to the asset?" className="h-auto min-h-[80px]" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Materials Used</Label>
                                        <Input value={form.materials_used} onChange={e => setForm({ ...form, materials_used: e.target.value })} placeholder="Nails, Wire, etc." className="h-9" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Total Cost (₱)</Label>
                                        <Input type="number" value={form.actual_cost} onChange={e => setForm({ ...form, actual_cost: e.target.value })} placeholder="0.00" className="h-9" />
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handleUpdate} disabled={saving} className="w-full">
                                {saving ? 'Syncing...' : 'Submit Update'}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

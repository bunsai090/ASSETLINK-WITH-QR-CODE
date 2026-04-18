import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { Wrench, CheckCircle, Clock, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';

// BACKEND: Validate task status transitions server-side to prevent invalid state changes
const TASK_STATUSES = ['Assigned', 'In Progress', 'On Hold', 'Completed', 'Pending Teacher Verification'];

export default function Tasks() {
    const { currentUser } = useAuth();
    const role = currentUser?.role || 'maintenance';
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ status: '', notes: '', materials_used: '', actual_cost: '' });
    const [saving, setSaving] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => { loadTasks(); }, []);

    async function loadTasks() {
        const data = await base44.entities.MaintenanceTask.list('-created_date', 200);
        // If maintenance role, filter to own tasks
        const filtered = role === 'maintenance'
            ? data.filter(t => t.assigned_to_email === currentUser?.email || t.assigned_to_name?.toLowerCase().includes(currentUser?.full_name?.toLowerCase()))
            : data;
        setTasks(filtered);
        setLoading(false);
    }

    function openTask(task) {
        setSelected(task);
        setForm({ status: task.status, notes: task.notes || '', materials_used: task.materials_used || '', actual_cost: task.actual_cost || '' });
    }

    async function handleUpdate() {
        setSaving(true);
        const updateData = {
            status: form.status,
            notes: form.notes,
            materials_used: form.materials_used,
            actual_cost: form.actual_cost ? parseFloat(form.actual_cost) : null,
        };
        if (form.status === 'Completed') {
            updateData.completed_date = new Date().toISOString().split('T')[0];
            // BACKEND: When setting Completed, actually set to "Pending Teacher Verification"
            // Teacher must verify repair is satisfactory before final closure
            updateData.status = 'Pending Teacher Verification';
        }
        if (selected.repair_request_id) {
            // Update repair request with maintenance notes
            const repairUpdate = { maintenance_notes: form.notes };
            // Keep repair request in "In Progress" state until teacher verifies
            await base44.entities.RepairRequest.update(selected.repair_request_id, repairUpdate);

            // Notify the teacher who filed the request
            const allRequests = await base44.entities.RepairRequest.list('-created_date', 500);
            const repairReq = allRequests.find(r => r.id === selected.repair_request_id);
            if (repairReq?.reported_by_email) {
                await base44.integrations.Core.SendEmail({
                    to: repairReq.reported_by_email,
                    subject: `✅ Repair Ready for Verification — ${selected.asset_name}`,
                    body: `Dear ${repairReq.reported_by_name || 'Teacher'},\n\nThe maintenance work on "${selected.asset_name}" has been COMPLETED and is ready for your verification.\n\n📋 Request #: ${selected.request_number || selected.repair_request_id}\n🏫 School: ${selected.school_name}\n🔧 Asset: ${selected.asset_name}${form.notes ? `\n\n📝 Maintenance Notes:\n${form.notes}` : ''}${form.materials_used ? `\n🛠 Materials Used: ${form.materials_used}` : ''}\n\nPlease inspect the asset and confirm whether the repair is satisfactory in AssetLink.\n\n— AssetLink Notification System`,
                });
            }
        }
        await base44.entities.MaintenanceTask.update(selected.id, updateData);
        toast.success('Task updated. Awaiting teacher verification.');
        setSaving(false);
        setSelected(null);
        loadTasks();
    }

    const displayed = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus);
    const counts = {
        Assigned: tasks.filter(t => t.status === 'Assigned').length,
        'In Progress': tasks.filter(t => t.status === 'In Progress').length,
        Completed: tasks.filter(t => t.status === 'Completed').length,
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Maintenance Tasks</h1>
                <p className="text-muted-foreground text-sm mt-1">View and update your assigned repair tasks</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Assigned', count: counts.Assigned, icon: Clock, color: 'text-blue-600 bg-blue-100' },
                    { label: 'In Progress', count: counts['In Progress'], icon: Wrench, color: 'text-amber-600 bg-amber-100' },
                    { label: 'Completed', count: counts.Completed, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-100' },
                ].map(({ label, count, icon: Icon, color }) => (
                    <div key={label} className="bg-card rounded-2xl border border-border p-4 text-center">
                        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{count}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Tasks</SelectItem>
                    {TASK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
            </Select>

            {loading ? (
                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin" /></div>
            ) : (
                <div className="space-y-3">
                    {displayed.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground bg-card rounded-2xl border border-border">
                            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No tasks {filterStatus !== 'all' ? `with status "${filterStatus}"` : 'assigned yet'}</p>
                        </div>
                    ) : displayed.map(task => (
                        <div
                            key={task.id}
                            onClick={() => openTask(task)}
                            className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all cursor-pointer"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0">
                                    <Wrench className="w-5 h-5 text-teal" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h3 className="font-semibold text-foreground text-sm">{task.asset_name}</h3>
                                        <StatusBadge status={task.priority || 'Medium'} />
                                        <StatusBadge status={task.status} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">{task.school_name}</p>
                                    {task.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.notes}</p>}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {task.created_date ? format(new Date(task.created_date), 'MMM d, yyyy') : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Update Modal */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Task</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4">
                            <div>
                                <p className="font-semibold text-foreground">{selected.asset_name}</p>
                                <p className="text-sm text-muted-foreground">{selected.school_name}</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Status</Label>
                                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TASK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Work Notes</Label>
                                <Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Describe the work done..." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Materials Used</Label>
                                    <Input value={form.materials_used} onChange={e => setForm({ ...form, materials_used: e.target.value })} placeholder="e.g. Nails, paint" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Actual Cost (PHP)</Label>
                                    <Input type="number" value={form.actual_cost} onChange={e => setForm({ ...form, actual_cost: e.target.value })} placeholder="0.00" />
                                </div>
                            </div>
                            <Button onClick={handleUpdate} disabled={saving} className="w-full bg-teal hover:bg-teal/90 text-white">
                                {saving ? 'Saving...' : 'Update Task'}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
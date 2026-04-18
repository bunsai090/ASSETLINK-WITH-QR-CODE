import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import StatusBadge from '../components/StatusBadge';
import { ChevronLeft, ChevronRight, CalendarDays, Wrench, AlertTriangle, Clock, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday, isBefore, isAfter, parseISO, startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';
import { getSLAStatus, getSLAColorClass } from '@/lib/slaUtils';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const PRIORITY_COLORS = {
    Critical: 'bg-red-100 border-red-300 text-red-800',
    High: 'bg-orange-100 border-orange-300 text-orange-800',
    Medium: 'bg-amber-100 border-amber-300 text-amber-800',
    Low: 'bg-slate-100 border-slate-300 text-slate-700',
};

const WORKLOAD_BG = (count) => {
    if (count === 0) return 'bg-background';
    if (count <= 2) return 'bg-emerald-50';
    if (count <= 4) return 'bg-amber-50';
    return 'bg-red-50';
};

const WORKLOAD_LABEL = (count) => {
    if (count === 0) return null;
    if (count <= 2) return { label: 'Light', color: 'text-emerald-600 bg-emerald-100' };
    if (count <= 4) return { label: 'Moderate', color: 'text-amber-600 bg-amber-100' };
    return { label: 'Heavy', color: 'text-red-600 bg-red-100' };
};

export default function MaintenanceCalendar() {
    const { currentUser } = useAuth();
    const role = currentUser?.role || 'teacher';
    const canEdit = role === 'maintenance';
    
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [tasksByDay, setTasksByDay] = useState({});
    const [unscheduled, setUnscheduled] = useState([]);
    const [pendingReschedule, setPendingReschedule] = useState(null);
    const [rescheduleReason, setRescheduleReason] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadTasks(); }, []);

    async function loadTasks() {
        const data = await base44.entities.MaintenanceTask.list('-created_date', 300);
        setTasks(data);
        distribute(data);
        setLoading(false);
    }

    function distribute(data) {
        const days = {};
        const unsched = [];
        for (let i = 0; i < 7; i++) {
            const key = format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i), 'yyyy-MM-dd');
            days[key] = [];
        }
        data.forEach(task => {
            if (task.start_date && days[task.start_date] !== undefined) {
                days[task.start_date].push(task);
            } else if (!task.start_date || task.status === 'Assigned') {
                unsched.push(task);
            } else {
                // Task scheduled outside current week, still include in its day bucket
                if (!days[task.start_date]) days[task.start_date] = [];
                days[task.start_date].push(task);
            }
        });
        setTasksByDay(days);
        setUnscheduled(unsched);
    }

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    function getDayKey(date) { return format(date, 'yyyy-MM-dd'); }

    function getDayTasks(date) {
        return tasksByDay[getDayKey(date)] || [];
    }

    async function onDragEnd(result) {
        if (!canEdit) {
            toast.error('Only Maintenance staff can reschedule tasks');
            return;
        }

        const { source, destination, draggableId } = result;
        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

        const taskId = draggableId;
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const destDate = destination.droppableId === 'unscheduled' ? null : destination.droppableId;
        
        // SLA CHECK: If moving to a date, check if it's past SLA
        if (destDate && task.sla_deadline) {
            const newDateEnd = endOfDay(parseISO(destDate));
            const deadline = parseISO(task.sla_deadline);
            
            if (isAfter(newDateEnd, deadline)) {
                // Past SLA! Need reason.
                setPendingReschedule({ taskId, destDate });
                setRescheduleReason('');
                return;
            }
        }

        await performUpdate(taskId, destDate);
    }

    async function performUpdate(taskId, destDate, reason = '') {
        setSaving(true);
        // Optimistic update
        const allTasks = [...tasks];
        const taskIdx = allTasks.findIndex(t => t.id === taskId);
        if (taskIdx === -1) return;
        
        const oldTask = allTasks[taskIdx];
        const updatedTask = { 
            ...oldTask, 
            start_date: destDate || null,
            reschedule_notes: reason ? (oldTask.reschedule_notes ? oldTask.reschedule_notes + '\n' : '') + reason : oldTask.reschedule_notes,
            reschedule_count: reason ? (oldTask.reschedule_count || 0) + 1 : (oldTask.reschedule_count || 0)
        };
        
        allTasks[taskIdx] = updatedTask;
        setTasks(allTasks);
        distribute(allTasks);

        try {
            const updatePayload = { 
                start_date: destDate || null 
            };
            
            if (reason) {
                updatePayload.reschedule_notes = updatedTask.reschedule_notes;
                updatePayload.reschedule_count = updatedTask.reschedule_count;
                
                // NOTIFY PRINCIPAL
                const repairReq = await base44.entities.RepairRequest.get(updatedTask.repair_request_id);
                if (repairReq?.reported_by_email) {
                    await base44.integrations.Core.SendEmail({
                        to: repairReq.reported_by_email,
                        subject: `📅 Task Rescheduled Past SLA — ${updatedTask.asset_name}`,
                        body: `Dear Principal,\n\nThe maintenance task for "${updatedTask.asset_name}" has been rescheduled past the initial SLA deadline.\n\n🛠️ Task: ${updatedTask.asset_name}\n🏫 School: ${updatedTask.school_name}\n📅 New Schedule: ${format(parseISO(destDate), 'PPPP')}\n⚠️ Deadline was: ${format(parseISO(updatedTask.sla_deadline), 'PPPP')}\n\n📝 Reason Provided:\n"${reason}"\n\nReschedule Count: ${updatedTask.reschedule_count}\n\n— AssetLink Monitoring`,
                    });
                }
            }

            await base44.entities.MaintenanceTask.update(taskId, updatePayload);
            toast.success(destDate ? `Task scheduled for ${format(parseISO(destDate), 'EEE, MMM d')}` : 'Task moved to unscheduled');
        } catch (err) {
            toast.error('Failed to update task');
            loadTasks(); // Rollback
        } finally {
            setSaving(false);
            setPendingReschedule(null);
        }
    }

    const today = startOfDay(new Date());

    const overdueTasks = tasks.filter(t =>
        t.start_date && isBefore(parseISO(t.start_date), today) && !['Completed'].includes(t.status)
    );

    if (loading) {
        return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin" /></div>;
    }

    return (
        <div className="space-y-10 animate-fade-in pb-20 relative z-10 font-sans">
            {/* Read-only banner for non-maintenance users */}
            {!canEdit && (
                <div className="flex items-center gap-4 bg-white border border-border rounded-2xl p-5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary border border-border shadow-sm">
                        <Lock className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground/70 leading-relaxed italic">
                        <strong className="text-foreground not-italic">View Only Registry</strong> — Access restricted to operational oversight. Rescheduling protocols are currently locked to your clearance level.
                    </p>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-1.5 font-sans">
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                        Operational <span className="text-primary italic">Calendar</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        {canEdit ? 'Synchronize tactical maintenance cycles across the district campus.' : 'District-wide maintenance deployment schedule.'}
                    </p>
                </div>
                
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-border shadow-sm">
                    <Button variant="outline" size="icon" onClick={() => setWeekStart(w => subWeeks(w, 1))} className="h-12 w-12 rounded-xl border-border hover:bg-slate-50 transition-all"><ChevronLeft className="w-5 h-5 text-muted-foreground/60" /></Button>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground px-4 min-w-[170px] text-center border-x border-border">
                        {format(weekStart, 'MMM d')} — {format(addDays(weekStart, 6), 'MMM d')}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setWeekStart(w => addWeeks(w, 1))} className="h-12 w-12 rounded-xl border-border hover:bg-slate-50 transition-all"><ChevronRight className="w-5 h-5 text-muted-foreground/60" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="h-12 border-border hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest px-5 rounded-xl ml-2">Today</Button>
                </div>
            </div>

            {/* Overdue banner */}
            {overdueTasks.length > 0 && (
                <div className="flex items-center gap-4 bg-rose-50/50 border border-rose-100 rounded-2xl p-5 group animate-pulse-subtle shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-rose-700 tracking-tight uppercase">
                        Protocol Alert: {overdueTasks.length} pending service order{overdueTasks.length > 1 ? 's' : ''} require immediate rescheduling.
                    </p>
                </div>
            )}

            {/* Legend & Grid Layout */}
            <div className="space-y-8">
                <div className="flex flex-wrap items-center gap-8 py-2">
                    <div className="flex items-center gap-4">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Workload Density</span>
                        <div className="flex gap-2">
                            {[{ label: 'Low', count: '1–2', color: 'bg-emerald-500' }, { label: 'Mid', count: '3–4', color: 'bg-amber-500' }, { label: 'High', count: '5+', color: 'bg-rose-500' }].map(w => (
                                <div key={w.label} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border rounded-lg shadow-sm">
                                    <div className={`w-2 h-2 rounded-full ${w.color}`} />
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{w.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="w-px h-8 bg-border hidden lg:block" />

                    <div className="flex items-center gap-4">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Priority Status</span>
                        <div className="flex gap-2">
                            {['Critical', 'High', 'Medium', 'Low'].map(p => (
                                <span key={p} className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest px-2.5 py-1.5 bg-slate-50 border border-transparent rounded-lg">{p}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    {/* Weekly grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                        {weekDays.map(day => {
                            const key = getDayKey(day);
                            const dayTasks = getDayTasks(day);
                            const workload = WORKLOAD_LABEL(dayTasks.length);
                            const overdue = isBefore(day, today);
                            const today_ = isToday(day);
                            
                            // Define density indicator color
                            let densityColor = "bg-border";
                            if (dayTasks.length > 0) densityColor = "bg-emerald-500";
                            if (dayTasks.length >= 3) densityColor = "bg-amber-500";
                            if (dayTasks.length >= 5) densityColor = "bg-rose-500";

                            return (
                                <div key={key} className={cn(
                                    "rounded-2xl border transition-all flex flex-col min-h-[350px] bg-white shadow-sm overflow-hidden",
                                    today_ ? 'ring-2 ring-primary ring-offset-2 scale-[1.02] z-10 border-primary' : 'border-border'
                                )}>
                                    {/* Day header */}
                                    <div className={cn(
                                        "px-5 py-5 border-b flex flex-col gap-3 relative",
                                        today_ ? 'bg-primary' : overdue && dayTasks.length > 0 ? 'bg-slate-50' : 'bg-white'
                                    )}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", today_ ? 'text-white/60' : 'text-muted-foreground/40')}>{format(day, 'EEEE')}</p>
                                                <p className={cn("text-2xl font-serif font-black mt-0.5", today_ ? 'text-white' : 'text-foreground')}>{format(day, 'dd')}</p>
                                            </div>
                                            {dayTasks.length > 0 && (
                                                <div className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest", today_ ? 'bg-white/20 text-white' : 'bg-slate-50 text-muted-foreground')}>
                                                    {dayTasks.length} Orders
                                                </div>
                                            )}
                                        </div>
                                        {/* Dynamic Density Bar */}
                                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden absolute bottom-0 left-0 right-0">
                                            <div 
                                                className={cn("h-full transition-all duration-500", today_ ? 'bg-white' : densityColor)} 
                                                style={{ width: `${Math.min(100, (dayTasks.length / 5) * 100)}%` }} 
                                            />
                                        </div>
                                    </div>

                                    {/* Droppable area */}
                                    <Droppable droppableId={key} isDropDisabled={!canEdit}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={cn(
                                                    "flex-1 p-3 space-y-3 transition-all duration-300 min-h-[200px] font-sans",
                                                    snapshot.isDraggingOver && canEdit ? 'bg-slate-50/50' : ''
                                                )}
                                            >
                                                {dayTasks.map((task, idx) => (
                                                    <Draggable key={task.id} draggableId={task.id} index={idx} isDragDisabled={!canEdit}>
                                                        {(prov, snap) => {
                                                            const slaStatus = getSLAStatus(task);
                                                            const priorityClass = task.priority === 'Critical' ? 'border-rose-200 bg-rose-50/30' : 
                                                                                task.priority === 'High' ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 bg-white';
                                                            return (
                                                                <div
                                                                    ref={prov.innerRef}
                                                                    {...prov.draggableProps}
                                                                    {...(canEdit ? prov.dragHandleProps : {})}
                                                                    className={cn(
                                                                        "p-3 rounded-xl border shadow-sm transition-all group relative",
                                                                        priorityClass,
                                                                        canEdit ? 'cursor-grab active:cursor-grabbing select-none hover:border-primary/30' : 'cursor-default',
                                                                        snap.isDragging ? 'shadow-xl rotate-1 z-50 ring-2 ring-primary/20' : ''
                                                                    )}
                                                                >
                                                                    <div className="flex justify-between items-start mb-2 gap-2">
                                                                        <p className="text-[11px] font-black text-foreground tracking-tight leading-tight uppercase truncate">{task.asset_name}</p>
                                                                        {task.reschedule_count > 0 && (
                                                                            <span className="flex-shrink-0 bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[8px] font-black tracking-tighter">R{task.reschedule_count}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col gap-2">
                                                                        <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest truncate italic">{task.school_name || 'District Campus'}</p>
                                                                        <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100">
                                                                            <div className={cn(
                                                                                "w-2 h-2 rounded-full",
                                                                                task.priority === 'Critical' ? 'bg-rose-500' : 'bg-primary'
                                                                            )} />
                                                                            {task.sla_deadline && (
                                                                                <div className={cn(
                                                                                    "flex items-center gap-1 text-[8px] font-black tracking-widest uppercase",
                                                                                    slaStatus === 'overdue' ? 'text-rose-600' : 'text-muted-foreground/40'
                                                                                )}>
                                                                                    <Clock className="w-2.5 h-2.5" />
                                                                                    {format(parseISO(task.sla_deadline), 'MM/dd')}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                                {dayTasks.length === 0 && !snapshot.isDraggingOver && (
                                                    <div className="flex flex-col items-center justify-center h-full opacity-10 pointer-events-none grayscale pt-10">
                                                        <CalendarDays className="w-8 h-8 mb-2" />
                                                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">{canEdit ? 'Drop Schedule' : 'No Data'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>

                    {/* Unscheduled tasks registry */}
                    <div className="bg-white rounded-2xl border border-border shadow-sm mt-10">
                        <div className="flex items-center gap-4 px-8 py-6 border-b border-sidebar-border bg-slate-50/50 rounded-t-2xl">
                            <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-muted-foreground shadow-sm">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-serif font-black text-foreground">Unscheduled <span className="text-primary italic">Registry</span></h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mt-1">Pending tactical deployment</p>
                            </div>
                            <span className="ml-auto text-[10px] font-black bg-primary text-white px-3 py-1 rounded-lg uppercase tracking-widest shadow-lg shadow-primary/10">{unscheduled.length} Orders</span>
                        </div>
                        <Droppable droppableId="unscheduled" direction="horizontal" isDropDisabled={!canEdit}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={cn(
                                        "flex flex-wrap gap-4 p-8 min-h-[140px] rounded-b-2xl transition-all duration-300",
                                        snapshot.isDraggingOver && canEdit ? 'bg-slate-50' : ''
                                    )}
                                >
                                    {unscheduled.length === 0 && !snapshot.isDraggingOver && (
                                        <div className="flex items-center justify-center w-full py-6 opacity-30 italic flex-col gap-2">
                                            <CheckCircle className="w-8 h-8 text-primary" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Universal Synchronization Complete</p>
                                        </div>
                                    )}
                                    {unscheduled.map((task, idx) => (
                                        <Draggable key={task.id} draggableId={task.id} index={idx} isDragDisabled={!canEdit}>
                                            {(prov, snap) => (
                                                <div
                                                    ref={prov.innerRef}
                                                    {...prov.draggableProps}
                                                    {...(canEdit ? prov.dragHandleProps : {})}
                                                    className={cn(
                                                        "p-4 rounded-xl border bg-white w-64 shadow-sm flex flex-col gap-3 transition-all",
                                                        task.priority === 'Critical' ? 'border-rose-200' : 'border-border',
                                                        canEdit ? 'cursor-grab active:cursor-grabbing hover:border-primary/20' : 'cursor-default',
                                                        snap.isDragging ? 'shadow-2xl scale-105 rotate-1 z-50 ring-2 ring-primary/20 bg-white' : ''
                                                    )}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-xs font-black text-foreground uppercase tracking-tight line-clamp-1">{task.asset_name}</p>
                                                        <div className={cn(
                                                            "w-2 h-2 rounded-full",
                                                            task.priority === 'Critical' ? 'bg-rose-500' : 'bg-primary'
                                                        )} />
                                                    </div>
                                                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest truncate italic">{task.school_name || "Region 7 Campus"}</p>
                                                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-primary/60">{task.priority || 'Standard'}</p>
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">{task.status || 'Assigned'}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                </DragDropContext>
            </div>

            {/* Reschedule Confirmation Modal */}
            <Dialog open={!!pendingReschedule} onOpenChange={() => setPendingReschedule(null)}>
                <DialogContent className="sm:max-w-xl rounded-2xl border border-border p-0 overflow-hidden bg-white shadow-2xl font-sans">
                    <div className="p-8 pb-6 border-b border-border bg-slate-50/50">
                        <DialogTitle className="text-3xl font-serif font-black tracking-tight text-foreground">
                            SLA <span className="text-rose-600 italic">Reschedule</span>
                        </DialogTitle>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600/60 mt-1 italic">Security protocol: Deadline breach imminent</p>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="bg-rose-50 p-6 rounded-xl border border-rose-100 flex items-start gap-4">
                            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-1" />
                            <p className="text-xs font-medium text-rose-800 leading-relaxed italic">
                                Rescheduling past the <strong className="text-rose-950 not-italic uppercase tracking-widest text-[10px]">Registry SLA</strong> requires formal administrative justification. Leadership will be notified.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1 italic">Justification Log</Label>
                            <Textarea 
                                rows={4} 
                                value={rescheduleReason} 
                                onChange={e => setRescheduleReason(e.target.value)} 
                                placeholder="Log specific logistics or technical constraints necessitating this shift..."
                                className="resize-none rounded-xl bg-slate-50 border-border font-bold text-sm p-6 placeholder:font-medium placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-rose-500/20 focus-visible:bg-white transition-all shadow-inner"
                            />
                        </div>

                        <div className="flex flex-col gap-3 pt-6">
                            <Button 
                                onClick={() => performUpdate(pendingReschedule.taskId, pendingReschedule.destDate, rescheduleReason)} 
                                disabled={saving || !rescheduleReason.trim()} 
                                className="h-16 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-rose-200 transition-all active:scale-[0.98] text-[10px]"
                            >
                                {saving ? "Synchronizing Protocol..." : "Execute Reschedule & Notify Authority"}
                            </Button>
                            <Button variant="ghost" onClick={() => setPendingReschedule(null)} className="text-muted-foreground/50 hover:text-foreground font-bold uppercase text-[9px] tracking-[0.3em] transition-colors">Abort Cycle</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
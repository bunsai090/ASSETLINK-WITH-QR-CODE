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
        <div className="space-y-12 animate-fade-in pb-20 relative z-10 font-sans">
            {/* Read-only banner for non-maintenance users */}
            {!canEdit && (
                <div className="flex items-center gap-6 bg-white border border-border rounded-[2rem] p-8 shadow-sm">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-primary border border-border shadow-inner">
                        <Lock className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Registry State: Sealed</span>
                        <p className="text-sm font-medium text-muted-foreground/70 leading-relaxed italic mt-1">
                            <strong className="text-foreground not-italic">View Only Clearance</strong> — Operational oversight active. Rescheduling protocols are currently locked to your administrative tier.
                        </p>
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-1.5 font-sans">
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight leading-[1.1]">
                        Operational <span className="text-primary italic">Logistics</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl font-medium tracking-tight opacity-70">
                        {canEdit ? 'Synchronize tactical maintenance cycles and service order distribution.' : 'District-wide maintenance deployment and restoration schedule.'}
                    </p>
                </div>
                
                <div className="flex items-center gap-4 bg-white p-3 rounded-[2rem] border border-border shadow-sm group hover:shadow-xl transition-all duration-500">
                    <Button variant="outline" size="icon" onClick={() => setWeekStart(w => subWeeks(w, 1))} className="h-14 w-14 rounded-2xl border-border hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"><ChevronLeft className="w-6 h-6 text-muted-foreground/60" /></Button>
                    <div className="flex flex-col items-center px-6 min-w-[200px] border-x border-border/50">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 mb-0.5">Deployment Window</span>
                        <div className="text-sm font-black text-foreground">
                            {format(weekStart, 'MMM d')} — {format(addDays(weekStart, 6), 'MMM d')}
                        </div>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setWeekStart(w => addWeeks(w, 1))} className="h-14 w-14 rounded-2xl border-border hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"><ChevronRight className="w-6 h-6 text-muted-foreground/60" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="h-14 border-border hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest px-8 rounded-2xl ml-2 shadow-sm hover:shadow-md transition-all">Present</Button>
                </div>
            </div>

            {/* Overdue Alert */}
            {overdueTasks.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-6 bg-rose-50 border border-rose-100 rounded-[2.5rem] p-10 shadow-2xl shadow-rose-200/20 group"
                >
                    <div className="w-20 h-20 rounded-[2rem] bg-rose-600 flex items-center justify-center text-white shadow-2xl shadow-rose-600/30 group-hover:scale-110 transition-transform duration-500">
                        <AlertTriangle className="w-10 h-10" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600/40">Critical Registry Violation</span>
                        <p className="text-xl font-serif font-black text-rose-900 leading-tight">
                        {overdueTasks.length} Service Orders <span className="italic text-rose-600">Breaching SLA</span>
                        </p>
                        <p className="text-xs font-medium text-rose-700/60 mt-1 italic tracking-tight">Personnel synchronization required to rectify imminent restoration lag.</p>
                    </div>
                </motion.div>
            )}

            {/* Legend & Parameters */}
            <div className="space-y-10">
                <div className="flex flex-wrap items-center gap-10 py-2">
                    <div className="flex items-center gap-5">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 italic">Resource Load</span>
                        <div className="flex gap-3">
                            {[{ label: 'Efficient', count: '1–2', color: 'bg-emerald-500 shadow-emerald-500/20' }, { label: 'Substantial', count: '3–4', color: 'bg-amber-500 shadow-amber-500/20' }, { label: 'Saturation', count: '5+', color: 'bg-rose-500 shadow-rose-500/20' }].map(w => (
                                <div key={w.label} className="flex items-center gap-3 px-5 py-3 bg-white border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group/item">
                                    <div className={`w-2.5 h-2.5 rounded-full ${w.color} shadow-lg`} />
                                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{w.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="w-px h-10 bg-border/50 hidden lg:block" />

                    <div className="flex items-center gap-5">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 italic">Priority Tiers</span>
                        <div className="flex gap-2.5">
                            {['Critical', 'High', 'Medium', 'Low'].map(p => (
                                <span key={p} className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest px-4 py-3 bg-slate-50 border border-transparent rounded-2xl hover:bg-white hover:border-border transition-all duration-300">{p}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    {/* Synchronized Weekly Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
                        {weekDays.map(day => {
                            const key = getDayKey(day);
                            const dayTasks = getDayTasks(day);
                            const overdue = isBefore(day, today);
                            const today_ = isToday(day);
                            
                            let densityColor = "bg-border";
                            if (dayTasks.length > 0) densityColor = "bg-emerald-500";
                            if (dayTasks.length >= 3) densityColor = "bg-amber-500";
                            if (dayTasks.length >= 5) densityColor = "bg-rose-500";

                            return (
                                <div key={key} className={cn(
                                    "rounded-[2.5rem] border transition-all duration-700 flex flex-col min-h-[450px] bg-white shadow-sm hover:shadow-xl hover:shadow-primary/5 group/day",
                                    today_ ? 'ring-[3px] ring-primary ring-offset-4 scale-[1.03] z-20 border-primary' : 'border-border'
                                )}>
                                    {/* Intelligence Header */}
                                    <div className={cn(
                                        "px-8 py-8 border-b flex flex-col gap-4 relative overflow-hidden transition-colors duration-500",
                                        today_ ? 'bg-primary' : overdue && dayTasks.length > 0 ? 'bg-slate-50' : 'bg-white'
                                    )}>
                                        <div className="flex items-center justify-between relative z-10">
                                            <div>
                                                <p className={cn("text-[10px] font-black uppercase tracking-[0.3em]", today_ ? 'text-white/50' : 'text-muted-foreground/30')}>
                                                    {format(day, 'EEEE')}
                                                </p>
                                                <p className={cn("text-3xl font-serif font-black mt-1", today_ ? 'text-white' : 'text-foreground')}>
                                                    {format(day, 'dd')}
                                                </p>
                                            </div>
                                            {dayTasks.length > 0 && (
                                                <div className={cn("px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm", today_ ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-slate-100 text-muted-foreground')}>
                                                    {dayTasks.length} <span className="opacity-50">Units</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Precision Depth Indicator */}
                                        <div className="h-1.5 w-full bg-slate-100/50 rounded-full overflow-hidden absolute bottom-0 left-0 right-0">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, (dayTasks.length / 5) * 100)}%` }}
                                                className={cn("h-full transition-all duration-1000 ease-out", today_ ? 'bg-white' : densityColor)} 
                                            />
                                        </div>
                                    </div>

                                    {/* Droppable Operations Area */}
                                    <Droppable droppableId={key} isDropDisabled={!canEdit}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={cn(
                                                    "flex-1 p-5 space-y-4 transition-all duration-500 min-h-[300px] font-sans",
                                                    snapshot.isDraggingOver && canEdit ? 'bg-slate-50/50' : ''
                                                )}
                                            >
                                                {dayTasks.map((task, idx) => (
                                                    <Draggable key={task.id} draggableId={task.id} index={idx} isDragDisabled={!canEdit}>
                                                        {(prov, snap) => {
                                                            const slaStatus = getSLAStatus(task);
                                                            const isCritical = task.priority === 'Critical';
                                                            return (
                                                                <div
                                                                    ref={prov.innerRef}
                                                                    {...prov.draggableProps}
                                                                    {...(canEdit ? prov.dragHandleProps : {})}
                                                                    className={cn(
                                                                        "p-5 rounded-[1.8rem] border shadow-sm transition-all duration-500 group relative",
                                                                        isCritical ? 'border-rose-200 bg-rose-50/20' : 'border-slate-100 bg-white hover:border-border',
                                                                        canEdit ? 'cursor-grab active:cursor-grabbing select-none hover:shadow-2xl hover:shadow-primary/5 hover:translate-y-[-4px]' : 'cursor-default',
                                                                        snap.isDragging ? 'shadow-2xl rotate-2 scale-105 z-50 ring-4 ring-primary/20 border-primary bg-white' : ''
                                                                    )}
                                                                >
                                                                    <div className="flex justify-between items-start mb-3 gap-3">
                                                                        <p className="text-sm font-black text-foreground tracking-tight leading-snug uppercase">{task.asset_name}</p>
                                                                        {task.reschedule_count > 0 && (
                                                                            <span className="flex-shrink-0 bg-primary text-white px-2 py-0.5 rounded-lg text-[9px] font-black tracking-tighter uppercase">R{task.reschedule_count}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col gap-3">
                                                                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest truncate italic">{task.school_name || 'Operational HQ'}</p>
                                                                        <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100/50">
                                                                            <div className={cn(
                                                                                "w-2.5 h-2.5 rounded-full shadow-lg transition-transform group-hover:scale-125 duration-500",
                                                                                isCritical ? 'bg-rose-500 shadow-rose-500/20' : 'bg-primary shadow-primary/20'
                                                                            )} />
                                                                            {task.sla_deadline && (
                                                                                <div className={cn(
                                                                                    "flex items-center gap-1.5 text-[9px] font-black tracking-[0.2em] uppercase",
                                                                                    slaStatus === 'overdue' ? 'text-rose-600' : 'text-muted-foreground/30'
                                                                                )}>
                                                                                    <Clock className="w-3 h-3" />
                                                                                    {format(parseISO(task.sla_deadline), 'MMM d')}
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
                                                    <div className="flex flex-col items-center justify-center h-full opacity-5 pointer-events-none grayscale py-20 transition-opacity duration-1000 group-hover/day:opacity-10">
                                                        <CalendarDays className="w-16 h-16 mb-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">{canEdit ? 'AWAITING DEPLOYMENT' : 'CLEAR REGISTRY'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pending Synchronization Registry */}
                    <div className="bg-white rounded-[2.5rem] border border-border shadow-sm mt-16 overflow-hidden group/unsched">
                        <div className="flex items-center gap-6 px-10 py-10 border-b border-sidebar-border bg-slate-50/50">
                            <div className="w-16 h-16 rounded-[1.8rem] bg-white border border-border flex items-center justify-center text-muted-foreground shadow-sm group-hover/unsched:scale-105 transition-transform duration-500">
                                <Clock className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-serif font-black text-foreground tracking-tight">Synchronized <span className="text-primary italic">Backlog</span></h2>
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 mt-1.5">Awaiting tactical calendar alignment</p>
                            </div>
                            <div className="ml-auto px-6 py-3 bg-primary text-white text-xs font-black rounded-2xl uppercase tracking-[0.2em] shadow-xl shadow-primary/20 group-hover/unsched:translate-x-[-10px] transition-transform duration-500">
                                {unscheduled.length} Pending <span className="opacity-50">Units</span>
                            </div>
                        </div>
                        <Droppable droppableId="unscheduled" direction="horizontal" isDropDisabled={!canEdit}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={cn(
                                        "flex flex-wrap gap-6 p-10 min-h-[220px] transition-all duration-700",
                                        snapshot.isDraggingOver && canEdit ? 'bg-slate-50' : ''
                                    )}
                                >
                                    {unscheduled.length === 0 && !snapshot.isDraggingOver && (
                                        <div className="flex items-center justify-center w-full py-16 opacity-10 italic flex-col gap-4">
                                            <CheckCircle className="w-20 h-20 text-primary" />
                                            <p className="text-[11px] font-black uppercase tracking-[0.4em]">Operational Synchronization Normalized</p>
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
                                                        "p-6 rounded-[2rem] border bg-white w-72 shadow-sm flex flex-col gap-4 transition-all duration-500",
                                                        task.priority === 'Critical' ? 'border-rose-200 shadow-rose-200/5' : 'border-border',
                                                        canEdit ? 'cursor-grab active:cursor-grabbing hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 hover:translate-y-[-4px]' : 'cursor-default',
                                                        snap.isDragging ? 'shadow-2xl scale-[1.08] rotate-2 z-50 ring-4 ring-primary/20 bg-white border-primary border-[2px]' : ''
                                                    )}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-sm font-black text-foreground uppercase tracking-tight line-clamp-1 group-hover:text-primary transition-colors">{task.asset_name}</p>
                                                        <div className={cn(
                                                            "w-3 h-3 rounded-full shadow-lg",
                                                            task.priority === 'Critical' ? 'bg-rose-500 shadow-rose-500/20' : 'bg-primary shadow-primary/20'
                                                        )} />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest truncate italic">{task.school_name || "Operational Zone VII"}</p>
                                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">{task.priority || 'Standard'}</p>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">{task.status || 'Assigned'}</p>
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

            {/* Tactical Reschedule Confirmation */}
            <Dialog open={!!pendingReschedule} onOpenChange={() => setPendingReschedule(null)}>
                <DialogContent className="sm:max-w-xl rounded-[2.5rem] border border-border p-0 overflow-hidden bg-white shadow-2xl font-sans">
                    <div className="p-10 pb-8 border-b border-border bg-slate-50/50">
                        <DialogTitle className="text-4xl font-serif font-black tracking-tight text-foreground">
                            SLA <span className="text-rose-600 italic">Override</span>
                        </DialogTitle>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-600/40 mt-1.5 italic">Security authorization: Deadline breach imminent</p>
                    </div>

                    <div className="p-10 space-y-10">
                        <div className="bg-rose-50 p-8 rounded-3xl border border-rose-100 flex items-start gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-xl shadow-rose-600/20 shrink-0">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-900/40">Protocol Warning</span>
                                <p className="text-sm font-medium text-rose-800 leading-relaxed italic">
                                    Rescheduling past the <strong className="text-rose-950 not-italic uppercase tracking-[0.3em] text-[11px]">Registry SLA</strong> requires formal tactical justification. Higher Command will be alerted.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-2 italic">Justification Log</Label>
                            <Textarea 
                                rows={4} 
                                value={rescheduleReason} 
                                onChange={e => setRescheduleReason(e.target.value)} 
                                placeholder="Log specific logistics constraints or personnel anomalies necessitating this shift..."
                                className="resize-none rounded-[2rem] bg-slate-50 border-transparent font-bold text-sm p-8 placeholder:font-medium placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-rose-500/20 focus-visible:bg-white transition-all shadow-inner"
                            />
                        </div>

                        <div className="flex flex-col gap-4 pt-6">
                            <Button 
                                onClick={() => performUpdate(pendingReschedule.taskId, pendingReschedule.destDate, rescheduleReason)} 
                                disabled={saving || !rescheduleReason.trim()} 
                                className="h-20 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-rose-600/30 transition-all active:scale-[0.98] text-[11px]"
                            >
                                {saving ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        SYNCHRONIZING...
                                    </div>
                                ) : "Execute Override & Alert Authority"}
                            </Button>
                            <Button variant="ghost" onClick={() => setPendingReschedule(null)} className="h-10 text-muted-foreground/40 hover:text-foreground font-black uppercase text-[10px] tracking-[0.4em] transition-colors italic">Abort Operational Shift</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
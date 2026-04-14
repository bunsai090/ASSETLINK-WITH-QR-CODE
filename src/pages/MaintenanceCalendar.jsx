import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import StatusBadge from '../components/StatusBadge';
import { ChevronLeft, ChevronRight, CalendarDays, Wrench, AlertTriangle, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday, isBefore, isAfter, parseISO, startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';
import { getSLAStatus, getSLAColorClass } from '@/lib/slaUtils';

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
        <div className="space-y-6">
            {/* Read-only banner for non-maintenance users */}
            {!canEdit && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-blue-700"><strong>View Only</strong> — Only Maintenance staff can reschedule tasks. You can view the calendar and see updates made by maintenance.</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Maintenance Calendar</h1>
                    <p className="text-muted-foreground text-sm mt-1">{canEdit ? 'Drag tasks between days to reschedule. Color indicates workload.' : 'View the maintenance schedule and workload.'}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setWeekStart(w => subWeeks(w, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                    <div className="text-sm font-medium text-foreground px-2 min-w-[160px] text-center">
                        {format(weekStart, 'MMM d')} — {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setWeekStart(w => addWeeks(w, 1))}><ChevronRight className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="text-teal border-teal/30 hover:bg-teal/5">Today</Button>
                </div>
            </div>

            {/* Overdue banner */}
            {overdueTasks.length > 0 && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span><strong>{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}</strong> — drag them to a new day to reschedule.</span>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-muted-foreground font-medium">Workload:</span>
                {[{ label: 'Light (1–2)', color: 'bg-emerald-100 text-emerald-700' }, { label: 'Moderate (3–4)', color: 'bg-amber-100 text-amber-700' }, { label: 'Heavy (5+)', color: 'bg-red-100 text-red-700' }].map(w => (
                    <span key={w.label} className={`px-2.5 py-1 rounded-full font-medium ${w.color}`}>{w.label}</span>
                ))}
                <span className="text-muted-foreground ml-2 font-medium">Priority:</span>
                {['Critical', 'High', 'Medium', 'Low'].map(p => (
                    <span key={p} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${PRIORITY_COLORS[p]}`}>{p}</span>
                ))}
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                {/* Weekly grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                    {weekDays.map(day => {
                        const key = getDayKey(day);
                        const dayTasks = getDayTasks(day);
                        const workload = WORKLOAD_LABEL(dayTasks.length);
                        const overdue = isBefore(day, today);
                        const today_ = isToday(day);
                        return (
                            <div key={key} className={`rounded-2xl border-2 transition-colors flex flex-col min-h-[200px] ${today_ ? 'border-teal' : overdue && dayTasks.length > 0 ? 'border-red-300' : 'border-border'} ${WORKLOAD_BG(dayTasks.length)}`}>
                                {/* Day header */}
                                <div className={`px-3 py-2.5 border-b border-inherit rounded-t-2xl flex items-center justify-between ${today_ ? 'bg-teal text-white' : overdue && dayTasks.length > 0 ? 'bg-red-50' : 'bg-card'}`}>
                                    <div>
                                        <p className={`text-xs font-semibold uppercase tracking-wide ${today_ ? 'text-white/80' : 'text-muted-foreground'}`}>{format(day, 'EEE')}</p>
                                        <p className={`text-lg font-bold leading-tight ${today_ ? 'text-white' : overdue && dayTasks.length > 0 ? 'text-red-600' : 'text-foreground'}`}>{format(day, 'd')}</p>
                                    </div>
                                    {workload && (
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${today_ ? 'bg-white/20 text-white' : workload.color}`}>{workload.label}</span>
                                    )}
                                </div>
                                {/* Droppable area */}
                                <Droppable droppableId={key} isDropDisabled={!canEdit}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 p-2 space-y-2 rounded-b-2xl transition-colors min-h-[120px] ${snapshot.isDraggingOver && canEdit ? 'bg-teal/10 ring-2 ring-inset ring-teal/30' : ''}`}
                                        >
                                            {dayTasks.map((task, idx) => (
                                                <Draggable key={task.id} draggableId={task.id} index={idx} isDragDisabled={!canEdit}>
                                                    {(prov, snap) => {
                                                        const slaStatus = getSLAStatus(task);
                                                        const slaClasses = getSLAColorClass(slaStatus);
                                                        return (
                                                            <div
                                                                ref={prov.innerRef}
                                                                {...prov.draggableProps}
                                                                {...(canEdit ? prov.dragHandleProps : {})}
                                                                className={`text-xs p-2 rounded-lg border-2 transition-shadow ${slaClasses} ${canEdit ? 'cursor-grab active:cursor-grabbing select-none' : 'cursor-default'} ${snap.isDragging ? 'shadow-lg rotate-1 opacity-90' : 'hover:shadow-sm'}`}
                                                            >
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <p className="font-bold truncate pr-1">{task.asset_name}</p>
                                                                    {task.reschedule_count > 0 && <span className="flex-shrink-0 bg-white/50 px-1 rounded text-[10px] font-bold">R{task.reschedule_count}</span>}
                                                                </div>
                                                                <p className="opacity-70 truncate text-[10px] mb-1.5">{task.school_name}</p>
                                                                <div className="flex items-center justify-between gap-1">
                                                                    <StatusBadge status={task.priority || 'Medium'} size="xs" />
                                                                    {task.sla_deadline && (
                                                                        <div className={`flex items-center gap-0.5 text-[10px] font-medium ${slaStatus === 'overdue' ? 'text-red-700' : 'text-muted-foreground'}`}>
                                                                            <Clock className="w-2.5 h-2.5" />
                                                                            {format(parseISO(task.sla_deadline), 'MM/dd')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                            {dayTasks.length === 0 && !snapshot.isDraggingOver && (
                                                <p className="text-xs text-muted-foreground/40 text-center pt-4">{canEdit ? 'Drop here' : '—'}</p>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>

                {/* Unscheduled tasks */}
                <div className="bg-card rounded-2xl border border-border">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold text-foreground">Unscheduled Tasks</h2>
                        <span className="ml-auto text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{unscheduled.length}</span>
                    </div>
                    <Droppable droppableId="unscheduled" direction="horizontal" isDropDisabled={!canEdit}>
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`flex flex-wrap gap-3 p-4 min-h-[80px] rounded-b-2xl transition-colors ${snapshot.isDraggingOver && canEdit ? 'bg-teal/5 ring-2 ring-inset ring-teal/20' : ''}`}
                            >
                                {unscheduled.length === 0 && !snapshot.isDraggingOver && (
                                    <p className="text-sm text-muted-foreground/50 py-2">All tasks are scheduled 🎉</p>
                                )}
                                {unscheduled.map((task, idx) => (
                                    <Draggable key={task.id} draggableId={task.id} index={idx} isDragDisabled={!canEdit}>
                                        {(prov, snap) => (
                                            <div
                                                ref={prov.innerRef}
                                                {...prov.draggableProps}
                                                {...(canEdit ? prov.dragHandleProps : {})}
                                                className={`text-xs p-2.5 rounded-xl border w-44 ${PRIORITY_COLORS[task.priority || 'Medium']} ${canEdit ? 'cursor-grab active:cursor-grabbing select-none' : 'cursor-default'} ${snap.isDragging ? 'shadow-lg rotate-1 opacity-90' : 'hover:shadow-sm'}`}
                                            >
                                                <p className="font-semibold truncate">{task.asset_name}</p>
                                                <p className="opacity-70 truncate mt-0.5">{task.school_name}</p>
                                                <div className="mt-1.5"><StatusBadge status={task.status} /></div>
                                                <div className="mt-1"><StatusBadge status={task.priority || 'Medium'} /></div>
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
    );
}
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import StatusBadge from '../../components/StatusBadge';
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
    if (count === 0) return 'bg-card';
    if (count <= 2) return 'bg-emerald-500/5';
    if (count <= 4) return 'bg-amber-500/5';
    return 'bg-destructive/5';
};

const WORKLOAD_LABEL = (count) => {
    if (count === 0) return null;
    if (count <= 2) return { label: 'Light', color: 'text-emerald-700 bg-emerald-500/10' };
    if (count <= 4) return { label: 'Moderate', color: 'text-amber-700 bg-amber-500/10' };
    return { label: 'Heavy', color: 'text-destructive bg-destructive/10' };
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

    useEffect(() => { 
        if (!currentUser?.full_name) return;
        
        const fetchTasks = async () => {
            const { data, error } = await supabase
                .from('maintenance_tasks')
                .select('*')
                .eq('assigned_to_name', currentUser.full_name);
            
            if (data) {
                setTasks(data);
                distribute(data);
            }
            setLoading(false);
        };

        fetchTasks();

        const channel = supabase
            .channel('calendar_tasks')
            .on('postgres_changes', { event: '*', table: 'maintenance_tasks' }, () => {
                fetchTasks();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser, weekStart]);

    const loadTasks = () => {};

    function distribute(data) {
        const days = {};
        const unsched = [];
        for (let i = 0; i < 7; i++) {
            const key = format(addDays(weekStart, i), 'yyyy-MM-dd');
            days[key] = [];
        }
        data.forEach(task => {
            const dateKey = task.scheduled_start_date;
            if (dateKey && days[dateKey] !== undefined) {
                days[dateKey].push(task);
            } else if (!dateKey) {
                unsched.push(task);
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
        try {
            const updatePayload = { 
                scheduled_start_date: destDate || null,
                updated_at: new Date().toISOString()
            };
            
            if (reason) {
                const task = tasks.find(t => t.id === taskId);
                updatePayload.reschedule_notes = (task?.reschedule_notes ? task.reschedule_notes + '\n' : '') + reason;
                updatePayload.reschedule_count = (task?.reschedule_count || 0) + 1;
            }

            const { error } = await supabase
                .from('maintenance_tasks')
                .update(updatePayload)
                .eq('id', taskId);

            if (error) throw error;
            
            toast.success(destDate ? `Task scheduled for ${format(parseISO(destDate), 'EEE, MMM d')}` : 'Task moved to unscheduled');
        } catch (err) {
            toast.error('Failed to update task');
        } finally {
            setSaving(false);
            setPendingReschedule(null);
        }
    }

    const today = startOfDay(new Date());

    const overdueTasks = tasks.filter(t =>
        t.scheduled_start_date && isBefore(parseISO(t.scheduled_start_date), today) && !['Completed'].includes(t.status)
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
                    <Button variant="outline" size="icon" onClick={() => { const next = subWeeks(weekStart, 1); setWeekStart(next); distribute(tasks); }}><ChevronLeft className="w-4 h-4" /></Button>
                    <div className="text-sm font-medium text-foreground px-2 min-w-[160px] text-center">
                        {format(weekStart, 'MMM d')} — {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => { const next = addWeeks(weekStart, 1); setWeekStart(next); distribute(tasks); }}><ChevronRight className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => { const next = startOfWeek(new Date(), { weekStartsOn: 1 }); setWeekStart(next); distribute(tasks); }} className="text-teal border-teal/30 hover:bg-teal/5">Today</Button>
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
                            <div key={key} className={`rounded-xl border flex flex-col min-h-[200px] overflow-hidden ${today_ ? 'border-primary shadow-sm ring-1 ring-primary/20' : overdue && dayTasks.length > 0 ? 'border-destructive/30' : 'border-border'} ${WORKLOAD_BG(dayTasks.length)}`}>
                                {/* Day header */}
                                <div className={`px-3 py-2.5 border-b flex items-center justify-between ${today_ ? 'bg-primary text-primary-foreground border-primary' : overdue && dayTasks.length > 0 ? 'bg-destructive/10 border-destructive/20' : 'bg-muted/30 border-border'}`}>
                                    <div>
                                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${today_ ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{format(day, 'EEE')}</p>
                                        <p className={`text-lg font-bold leading-tight ${today_ ? 'text-primary-foreground' : overdue && dayTasks.length > 0 ? 'text-destructive' : 'text-foreground'}`}>{format(day, 'd')}</p>
                                    </div>
                                    {workload && (
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${today_ ? 'bg-primary-foreground/20 text-primary-foreground' : workload.color}`}>{workload.label}</span>
                                    )}
                                </div>
                                {/* Droppable area */}
                                <Droppable droppableId={key} isDropDisabled={!canEdit}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 p-2 space-y-2 transition-colors min-h-[120px] ${snapshot.isDraggingOver && canEdit ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}`}
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
                                                                className={`text-xs p-3 rounded-lg border bg-card transition-shadow ${slaClasses} ${canEdit ? 'cursor-grab active:cursor-grabbing select-none' : 'cursor-default'} ${snap.isDragging ? 'shadow-lg rotate-1 opacity-90 ring-1 ring-primary' : 'hover:shadow-sm'}`}
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
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold text-foreground">Unscheduled Tasks</h2>
                        <span className="ml-auto text-xs bg-background border border-border text-muted-foreground px-2 py-0.5 rounded-full">{unscheduled.length}</span>
                    </div>
                    <Droppable droppableId="unscheduled" direction="horizontal" isDropDisabled={!canEdit}>
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`flex flex-wrap gap-3 p-4 min-h-[80px] transition-colors ${snapshot.isDraggingOver && canEdit ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}`}
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
                                                className={`text-xs p-3 bg-card rounded-lg border w-44 ${PRIORITY_COLORS[task.priority || 'Medium']} ${canEdit ? 'cursor-grab active:cursor-grabbing select-none' : 'cursor-default'} ${snap.isDragging ? 'shadow-lg rotate-1 opacity-90 ring-1 ring-primary' : 'hover:shadow-sm'}`}
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

            <Dialog open={!!pendingReschedule} onOpenChange={(open) => !open && setPendingReschedule(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>SLA Deadline Exceeded</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm border border-destructive/20">
                            This date is past the Service Level Agreement (SLA) deadline for this task. You must provide a reason for the delay.
                        </div>
                        <div className="space-y-2">
                            <Label>Reason for Delay</Label>
                            <Textarea 
                                value={rescheduleReason} 
                                onChange={e => setRescheduleReason(e.target.value)} 
                                placeholder="Why is this maintenance delayed?"
                            />
                        </div>
                        <Button 
                            className="w-full" 
                            disabled={!rescheduleReason.trim() || saving}
                            onClick={() => performUpdate(pendingReschedule.taskId, pendingReschedule.destDate, rescheduleReason)}
                        >
                            {saving ? 'Saving...' : 'Confirm Reschedule'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

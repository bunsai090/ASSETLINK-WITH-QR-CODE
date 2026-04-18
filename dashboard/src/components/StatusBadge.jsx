import { cn } from '@/lib/utils';

const statusConfig = {
    // Repair status
    Pending: { glassBg: 'bg-amber-400/10', text: 'text-amber-600', dot: 'bg-amber-500', border: 'border-amber-500/10' },
    Approved: { glassBg: 'bg-sky-400/10', text: 'text-sky-600', dot: 'bg-sky-500', border: 'border-sky-500/10' },
    'In Progress': { glassBg: 'bg-indigo-400/10', text: 'text-indigo-600', dot: 'bg-indigo-500', border: 'border-indigo-500/10' },
    Completed: { glassBg: 'bg-emerald-400/10', text: 'text-emerald-600', dot: 'bg-emerald-500', border: 'border-emerald-500/10' },
    Rejected: { glassBg: 'bg-rose-400/10', text: 'text-rose-600', dot: 'bg-rose-500', border: 'border-rose-500/10' },
    Escalated: { glassBg: 'bg-purple-400/10', text: 'text-purple-600', dot: 'bg-purple-500', border: 'border-purple-500/10' },
    
    // Priority
    Low: { glassBg: 'bg-slate-400/10', text: 'text-slate-500', dot: 'bg-slate-400', border: 'border-slate-500/10' },
    Medium: { glassBg: 'bg-amber-400/10', text: 'text-amber-600', dot: 'bg-amber-500', border: 'border-amber-500/10' },
    High: { glassBg: 'bg-orange-400/10', text: 'text-orange-600', dot: 'bg-orange-500', border: 'border-orange-500/10' },
    Critical: { glassBg: 'bg-rose-500/15', text: 'text-rose-600', dot: 'bg-rose-600', border: 'border-rose-500/20' },
    
    // Condition
    Excellent: { glassBg: 'bg-emerald-400/10', text: 'text-emerald-600', dot: 'bg-emerald-500', border: 'border-emerald-500/10' },
    Good: { glassBg: 'bg-green-400/10', text: 'text-green-600', dot: 'bg-green-500', border: 'border-green-500/10' },
    Fair: { glassBg: 'bg-yellow-400/10', text: 'text-yellow-600', dot: 'bg-yellow-500', border: 'border-yellow-500/10' },
    Poor: { glassBg: 'bg-orange-400/10', text: 'text-orange-600', dot: 'bg-orange-500', border: 'border-orange-500/10' },
    Damaged: { glassBg: 'bg-rose-400/10', text: 'text-rose-600', dot: 'bg-rose-500', border: 'border-rose-500/10' },
    Condemned: { glassBg: 'bg-slate-500/10', text: 'text-slate-600', dot: 'bg-slate-500', border: 'border-slate-500/10' },
    
    // Task
    Assigned: { glassBg: 'bg-sky-400/10', text: 'text-sky-600', dot: 'bg-sky-500', border: 'border-sky-500/10' },
    'On Hold': { glassBg: 'bg-amber-400/10', text: 'text-amber-600', dot: 'bg-amber-500', border: 'border-amber-500/10' },
    'Pending Teacher Verification': { glassBg: 'bg-sky-400/10', text: 'text-sky-600', dot: 'bg-sky-500', border: 'border-sky-500/10' },
};

export default function StatusBadge({ status, size = 'sm' }) {
    const config = statusConfig[status] || { glassBg: 'bg-slate-100/10', text: 'text-slate-500', dot: 'bg-slate-400', border: 'border-slate-500/10' };
    
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 font-bold rounded-full border backdrop-blur-md transition-all uppercase tracking-wider",
            config.glassBg, config.text, config.border,
            size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-3 py-1'
        )}>
            <span className={cn("w-1 h-1 rounded-full flex-shrink-0 animate-pulse", config.dot)} />
            {status}
        </span>
    );
}
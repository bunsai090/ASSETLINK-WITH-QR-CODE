import { cn } from '@/lib/utils';

const statusConfig = {
    // Repair status
    Pending: { bg: 'bg-amber-50 border-amber-200/70', text: 'text-amber-700', dot: 'bg-amber-400' },
    Approved: { bg: 'bg-sky-50 border-sky-200/70', text: 'text-sky-700', dot: 'bg-sky-400' },
    'In Progress': { bg: 'bg-indigo-50 border-indigo-200/70', text: 'text-indigo-700', dot: 'bg-indigo-400' },
    Completed: { bg: 'bg-emerald-50 border-emerald-200/70', text: 'text-emerald-700', dot: 'bg-emerald-400' },
    Rejected: { bg: 'bg-rose-50 border-rose-200/70', text: 'text-rose-700', dot: 'bg-rose-400' },
    Escalated: { bg: 'bg-purple-50 border-purple-200/70', text: 'text-purple-700', dot: 'bg-purple-400' },

    // Priority
    Low: { bg: 'bg-slate-50 border-slate-200/70', text: 'text-slate-600', dot: 'bg-slate-400' },
    Medium: { bg: 'bg-amber-50 border-amber-200/70', text: 'text-amber-700', dot: 'bg-amber-400' },
    High: { bg: 'bg-orange-50 border-orange-200/70', text: 'text-orange-700', dot: 'bg-orange-400' },
    Critical: { bg: 'bg-rose-50 border-rose-200/70', text: 'text-rose-700', dot: 'bg-rose-500' },

    // Asset condition
    Excellent: { bg: 'bg-emerald-50 border-emerald-200/70', text: 'text-emerald-700', dot: 'bg-emerald-400' },
    Good: { bg: 'bg-green-50 border-green-200/70', text: 'text-green-700', dot: 'bg-green-400' },
    Fair: { bg: 'bg-yellow-50 border-yellow-200/70', text: 'text-yellow-700', dot: 'bg-yellow-400' },
    Poor: { bg: 'bg-orange-50 border-orange-200/70', text: 'text-orange-700', dot: 'bg-orange-400' },
    Damaged: { bg: 'bg-rose-50 border-rose-200/70', text: 'text-rose-700', dot: 'bg-rose-400' },
    Condemned: { bg: 'bg-slate-50 border-slate-200/70', text: 'text-slate-600', dot: 'bg-slate-400' },

    // Task
    Assigned: { bg: 'bg-sky-50 border-sky-200/70', text: 'text-sky-700', dot: 'bg-sky-400' },
    'On Hold': { bg: 'bg-amber-50 border-amber-200/70', text: 'text-amber-700', dot: 'bg-amber-400' },
    'Pending Teacher Verification': { bg: 'bg-sky-50 border-sky-200/70', text: 'text-sky-700', dot: 'bg-sky-400' },
};

export default function StatusBadge({ status, size = 'sm' }) {
    const config = statusConfig[status] || {
        bg: 'bg-slate-50 border-slate-200/70',
        text: 'text-slate-600',
        dot: 'bg-slate-400'
    };

    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 font-medium rounded-md border whitespace-nowrap',
            config.bg, config.text,
            size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
        )}>
            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />
            {status}
        </span>
    );
}
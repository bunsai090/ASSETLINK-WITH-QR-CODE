import { cn } from '@/lib/utils';

const statusConfig = {
    // Repair status
    Pending: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    Approved: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    'In Progress': { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
    Completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    Rejected: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    Escalated: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
    // Priority
    Low: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
    Medium: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    High: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
    Critical: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-600' },
    // Condition
    Excellent: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    Good: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    Fair: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    Poor: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
    Damaged: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    Condemned: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-500' },
    // Task
    Assigned: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    'On Hold': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    'Pending Teacher Verification': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
};

export default function StatusBadge({ status, size = 'sm' }) {
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 font-medium rounded-full",
            config.bg, config.text,
            size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5'
        )}>
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", config.dot)} />
            {status}
        </span>
    );
}
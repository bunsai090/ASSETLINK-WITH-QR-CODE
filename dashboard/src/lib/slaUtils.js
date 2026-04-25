import { addHours, isBefore, isAfter, subHours, startOfDay, parseISO } from 'date-fns';

/**
 * SLA durations in hours based on priority
 */
export const SLA_HOURS = {
    Critical: 24,   // 1 day
    High: 48,       // 2 days
    Medium: 120,    // 5 days
    Low: 240,       // 10 days
};

/**
 * Calculates the SLA deadline based on a start date and priority
 * @param {string|Date} startDate 
 * @param {string} priority 
 * @returns {Date}
 */
export function calculateDeadline(startDate, priority) {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const hours = SLA_HOURS[priority] || SLA_HOURS.Medium;
    return addHours(start, hours);
}

/**
 * Determines the SLA status of a task
 * @param {Object} task 
 * @returns {'on-track' | 'warning' | 'overdue'}
 */
export function getSLAStatus(task) {
    if (task.status === 'Completed') return 'on-track';
    if (!task.sla_deadline) return 'on-track';

    const deadline = parseISO(task.sla_deadline);
    const now = new Date();

    // Red if past deadline
    if (isAfter(now, deadline)) return 'overdue';

    // Yellow if within 24 hours of deadline
    const warningThreshold = subHours(deadline, 24);
    if (isAfter(now, warningThreshold)) return 'warning';

    return 'on-track';
}

/**
 * Helper to get tailwind classes for SLA status
 * @param {string} status 
 * @returns {string}
 */
export function getSLAColorClass(status) {
    switch (status) {
        case 'overdue': return 'border-red-500 bg-red-50 text-red-700 shadow-[0_0_8px_rgba(239,68,68,0.2)]';
        case 'warning': return 'border-amber-400 bg-amber-50 text-amber-700';
        default: return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }
}

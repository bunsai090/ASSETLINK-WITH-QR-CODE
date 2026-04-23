import { cn } from '@/lib/utils';

const colorMap = {
    teal:   { dot: 'bg-emerald-500', num: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    amber:  { dot: 'bg-amber-500',   num: 'text-amber-600',   bg: 'bg-amber-50 border-amber-100' },
    red:    { dot: 'bg-rose-500',    num: 'text-rose-600',    bg: 'bg-rose-50 border-rose-100' },
    green:  { dot: 'bg-emerald-500', num: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    blue:   { dot: 'bg-sky-500',     num: 'text-sky-600',     bg: 'bg-sky-50 border-sky-100' },
    purple: { dot: 'bg-violet-500',  num: 'text-violet-600',  bg: 'bg-violet-50 border-violet-100' },
};

export default function StatsCard({ title, value, subtitle = '', icon: Icon, color = 'teal', trend = null, className = '' }) {
    const v = colorMap[color] || colorMap.teal;

    return (
        <div className={cn(
            'group relative bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-all duration-200 hover:border-border/80 cursor-default',
            className
        )}>
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
                <p className="label-mono text-muted-foreground">{title}</p>
                <div className={cn('w-7 h-7 rounded-md border flex items-center justify-center', v.bg)}>
                    <Icon className={cn('w-3.5 h-3.5', v.num)} />
                </div>
            </div>

            {/* Value */}
            <div className="flex items-end gap-2">
                <span className={cn('text-3xl font-bold tracking-tight leading-none', v.num)}>
                    {value}
                </span>
                {trend !== null && (
                    <span className={cn(
                        'text-[11px] font-medium px-1.5 py-0.5 rounded mb-0.5',
                        trend >= 0
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-emerald-50 text-emerald-600'
                    )}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>

            {subtitle && (
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">{subtitle}</p>
            )}

            {/* Bottom accent line on hover */}
            <div className={cn(
                'absolute bottom-0 left-5 right-5 h-px rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300',
                v.dot
            )} />
        </div>
    );
}
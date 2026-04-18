import { cn } from '@/lib/utils';

export default function StatsCard({ title, value, subtitle = '', icon: Icon, color = 'teal', trend = null }) {
    const colorMap = {
        teal: 'bg-teal/10 text-teal',
        amber: 'bg-amber-100 text-amber-600',
        red: 'bg-red-100 text-red-600',
        green: 'bg-emerald-100 text-emerald-600',
        blue: 'bg-blue-100 text-blue-600',
        purple: 'bg-purple-100 text-purple-600',
    };
    return (
        <div className="bg-card rounded-2xl border border-border p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", colorMap[color])}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground font-medium">{title}</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
                {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                {trend && (
                    <p className={cn("text-xs font-medium mt-1", trend > 0 ? 'text-red-500' : 'text-emerald-500')}>
                        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
                    </p>
                )}
            </div>
        </div>
    );
}
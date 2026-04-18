import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function StatsCard({ title, value, subtitle = '', icon: Icon, color = 'teal', trend = null }) {
    const colorVariants = {
        teal: {
            bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10',
            glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
            iconBg: 'bg-emerald-500 text-white'
        },
        amber: {
            bg: 'bg-amber-500/10 text-amber-600 border-amber-500/10',
            glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
            iconBg: 'bg-amber-500 text-white'
        },
        red: {
            bg: 'bg-rose-500/10 text-rose-600 border-rose-500/10',
            glow: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]',
            iconBg: 'bg-rose-500 text-white'
        },
        green: {
            bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10',
            glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
            iconBg: 'bg-emerald-500 text-white'
        },
        blue: {
            bg: 'bg-sky-500/10 text-sky-600 border-sky-500/10',
            glow: 'shadow-[0_0_20px_rgba(14,165,233,0.15)]',
            iconBg: 'bg-sky-500 text-white'
        },
        purple: {
            bg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/10',
            glow: 'shadow-[0_0_20px_rgba(99,102,241,0.15)]',
            iconBg: 'bg-indigo-500 text-white'
        },
    };

    const variant = colorVariants[color] || colorVariants.teal;

    return (
        <motion.div 
            whileHover={{ y: -4 }}
            className={cn(
                "relative group overflow-hidden bg-white rounded-2xl border border-border p-6 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-black/5"
            )}
        >
            <div className="flex items-start gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3", variant.iconBg)}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{title}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-3xl font-serif font-black text-foreground tracking-tighter italic">{value}</p>
                        {trend !== null && (
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", trend >= 0 ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100')}>
                                {trend > 0 ? '+' : ''}{trend}%
                            </span>
                        )}
                    </div>
                    {subtitle && <p className="text-xs text-muted-foreground mt-1 font-medium italic opacity-60 leading-tight">{subtitle}</p>}
                </div>
            </div>
            {/* Subtle accent border on hover */}
            <div className={cn("absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 opacity-60", variant.iconBg)} />
        </motion.div>
    );
}
import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import {
    Menu, X, LogOut, ChevronRight, QrCode, CalendarDays,
    School, ShieldAlert, Eye, LayoutDashboard, Package, AlertTriangle, Wrench, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sileo } from 'sileo';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher', 'principal', 'maintenance'] },
    { path: '/assets', label: 'Assets', icon: Package, roles: ['admin', 'teacher', 'principal'] },
    { path: '/repair-requests', label: 'Repair Requests', icon: AlertTriangle, roles: ['admin', 'teacher', 'principal'] },
    { path: '/report-damage', label: 'Report Damage', icon: AlertTriangle, roles: ['admin', 'teacher'] },
    { path: '/tasks', label: 'My Tasks', icon: Wrench, roles: ['admin', 'maintenance'] },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'principal'] },
    { path: '/calendar', label: 'Calendar', icon: CalendarDays, roles: ['admin', 'maintenance', 'principal'] },
    { path: '/schools', label: 'Schools', icon: School, roles: ['admin', 'supervisor'] },
    { path: '/oversight', label: 'Oversight', icon: Eye, roles: ['supervisor'] },
];

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const location = useLocation();
    const { currentUser, logout } = useAuth();
    const role = currentUser?.role || 'teacher';

    const visibleItems = navItems.filter(item => item.roles.includes(role));

    const handleLogout = () => {
        setLogoutModalOpen(false);
        logout();
        sileo.success({
            title: 'Logged Out Successfully',
            description: 'You have been safely logged out. See you again soon!'
        });
    };

    return (
        <div className="h-screen bg-background flex overflow-hidden">
            {/* Mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
                        onClick={() => setSidebarOpen(false)} 
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 h-screen w-72 bg-sidebar text-sidebar-foreground z-50 transform transition-transform duration-500 ease-[0.22, 1, 0.36, 1] lg:translate-x-0 lg:relative lg:z-auto lg:flex-shrink-0 border-r border-sidebar-border",
                sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full relative overflow-hidden">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3 px-8 h-24 flex-shrink-0 relative z-10">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[0.8rem] bg-[#054a29] shadow-lg shadow-[#054a29]/20 transform -rotate-3 transition-transform hover:rotate-0 overflow-hidden border border-white/10">
                            <img src="/logo.png" alt="AssetLink Logo" className="w-full h-full object-cover scale-110 shadow-inner" />
                        </div>
                        <div className="flex flex-col items-start leading-none gap-1">
                            <span className="text-xl font-serif font-black tracking-tight text-white italic">Asset<span className="text-primary-foreground/80 not-italic font-sans font-bold tracking-tighter ml-0.5">Link</span></span>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 whitespace-nowrap">
                                Resource Management
                            </span>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-white/40 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 relative z-10 custom-scrollbar">
                        <div className="px-5 mb-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20">Operational Hub</p>
                        </div>
                        {visibleItems.map(({ path, label, icon: Icon }) => {
                            const active = location.pathname === path;
                            return (
                                <Link
                                    key={path}
                                    to={path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-5 py-3.5 rounded-xl text-[13px] font-bold transition-all duration-300 group relative",
                                        active
                                            ? "bg-primary text-white shadow-lg shadow-black/20"
                                            : "text-white/50 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4 flex-shrink-0 transition-all", active ? "scale-110" : "group-hover:scale-110")} />
                                    <span className="tracking-tight">{label}</span>
                                    {active && (
                                        <motion.div 
                                            layoutId="sidebar-active-indicator"
                                            className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" 
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile Footer */}
                    <div className="mt-auto p-4 relative z-10 border-t border-white/5">
                        <div className="rounded-2xl p-4 transition-colors hover:bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
                                    <span className="text-xs font-black text-white uppercase italic">
                                        {currentUser?.full_name?.[0] || currentUser?.email?.[0] || 'U'}
                                    </span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <p className="text-sm font-bold text-white leading-tight truncate">
                                        {currentUser?.full_name || 'System User'}
                                    </p>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary-foreground/50 mt-1">
                                        {role} Persona
                                    </span>
                                </div>
                                <button
                                    onClick={() => setLogoutModalOpen(true)}
                                    className="ml-auto text-white/20 hover:text-rose-400 transition-colors p-2"
                                    title="Sign out"
                                >
                                    <LogOut className="w-4 h-4 transition-transform hover:-translate-x-1" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Background Grid Overlay */}
                <div className="al-grid-bg absolute inset-0 pointer-events-none opacity-[0.05]" aria-hidden="true" />
                
                {/* Top Header */}
                <header className="h-20 bg-background/95 backdrop-blur-md border-b border-border flex items-center px-4 lg:px-10 gap-4 sticky top-0 z-30 transition-all">
                    <button 
                        onClick={() => setSidebarOpen(true)} 
                        className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-border text-foreground/60 hover:text-foreground shadow-sm"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-1 bg-primary/20 rounded-full hidden sm:block" />
                        <h2 className="text-xs font-black text-primary/40 uppercase tracking-[0.2em]">
                            {location.pathname === '/' ? 'Overview' : location.pathname.split('/')[1].replace('-', ' ')}
                        </h2>
                    </div>

                    <div className="flex-1" />
                    
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-full bg-background border border-border shadow-sm group">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                                Operational Status
                            </span>
                        </div>
                        <div className="h-10 w-px bg-border mx-1 hidden sm:block" />
                        <ThemeToggle />
                    </div>
                </header>

                {/* Content Container */}
                <main className="flex-1 relative z-10 overflow-y-auto">
                    <div className="p-6 lg:p-10 max-w-7xl mx-auto min-h-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            {/* Logout Confirmation Modal */}
            <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl border-none p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold tracking-tight text-center">Sign out</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LogOut className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-muted-foreground">
                            Are you sure you want to log out? <br /> You will need your credentials to access the platform again.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setLogoutModalOpen(false)} className="flex-1 font-bold h-12 rounded-xl border-border">
                            Stay active
                        </Button>
                        <Button onClick={handleLogout} variant="destructive" className="flex-1 font-bold h-12 rounded-xl bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none">
                            Yes, Logout
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
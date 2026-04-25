import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import {
    Menu, X, LogOut, LayoutDashboard, Package, AlertTriangle,
    Wrench, BarChart3, CalendarDays, School, Eye, ChevronRight, Bell, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sileo } from 'sileo';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher', 'principal', 'maintenance'] },
    { path: '/assets', label: 'Assets', icon: Package, roles: ['admin', 'principal'] },
    { path: '/repair-requests', label: 'Repair Requests', icon: AlertTriangle, roles: ['admin', 'principal', 'teacher'] },
    { path: '/report-damage', label: 'Report Damage', icon: AlertTriangle, roles: ['teacher'] },
    { path: '/tasks', label: 'My Tasks', icon: Wrench, roles: ['admin', 'maintenance'] },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'principal'] },
    { path: '/calendar', label: 'Calendar', icon: CalendarDays, roles: ['admin', 'maintenance', 'principal'] },
    { path: '/schools', label: 'Schools', icon: School, roles: ['admin', 'principal'] },
    { path: '/profile', label: 'My Profile', icon: User, roles: ['admin', 'teacher', 'principal', 'maintenance'] },
];

const navGroups = [
    { label: 'Main', paths: ['/', '/assets', '/repair-requests', '/report-damage'] },
    { label: 'Operations', paths: ['/tasks', '/calendar'] },
    { label: 'Intelligence', paths: ['/analytics', '/schools', '/oversight'] },
    { label: 'Account', paths: ['/profile'] },
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
            title: 'Logged out',
            description: 'You have been safely logged out.'
        });
    };

    const pageTitle = location.pathname === '/'
        ? 'Overview'
        : location.pathname.slice(1).split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

    return (
        <div className="h-screen bg-background flex overflow-hidden">
            {/* Mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 h-screen w-[220px] bg-sidebar z-50 transform transition-transform duration-300 lg:translate-x-0 lg:relative lg:z-auto lg:flex-shrink-0 flex flex-col border-r border-sidebar-border",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Brand */}
                <div className="flex items-center gap-2.5 px-5 h-[56px] flex-shrink-0 border-b border-sidebar-border">
                    <div className="w-7 h-7 rounded-md bg-[hsl(var(--sidebar-primary))] flex items-center justify-center shadow-sm overflow-hidden">
                        <img src="/logo.png" alt="AssetLink" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-semibold text-sm text-white tracking-tight">AssetLink</span>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ml-auto lg:hidden text-sidebar-foreground/50 hover:text-white p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
                    {navGroups.map(group => {
                        const groupItems = visibleItems.filter(i => group.paths.includes(i.path));
                        if (groupItems.length === 0) return null;
                        return (
                            <div key={group.label} className="mb-5">
                                <p className="label-mono text-sidebar-foreground/30 px-3 mb-1.5">{group.label}</p>
                                <div className="space-y-0.5">
                                    {groupItems.map(({ path, label, icon: Icon }) => {
                                        const active = location.pathname === path;
                                        return (
                                            <Link
                                                key={path}
                                                to={path}
                                                onClick={() => setSidebarOpen(false)}
                                                className={cn('nav-item', active && 'active')}
                                            >
                                                <Icon className="w-[15px] h-[15px] flex-shrink-0" />
                                                <span>{label}</span>
                                                {active && (
                                                    <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* User */}
                <div className="p-3 border-t border-sidebar-border flex-shrink-0">
                    <div className="flex items-center gap-2.5 p-2 rounded-md hover:bg-sidebar-accent transition-colors group">
                        <Link
                            to="/profile"
                            onClick={() => setSidebarOpen(false)}
                            className="flex items-center gap-2.5 flex-1 min-w-0"
                        >
                            <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white border border-white/10">
                                {(currentUser?.full_name?.[0] || currentUser?.email?.[0] || 'U').toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-sidebar-accent-foreground truncate leading-tight">
                                    {currentUser?.full_name || 'System User'}
                                </p>
                                <p className="label-mono text-sidebar-foreground/40 leading-none mt-0.5">
                                    {role === 'admin' ? 'Principal' : role.charAt(0).toUpperCase() + role.slice(1)}
                                </p>
                            </div>
                        </Link>
                        <button
                            onClick={() => setLogoutModalOpen(true)}
                            title="Sign out"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-sidebar-foreground/40 hover:text-rose-400 p-1"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Bar */}
                <header className="h-[56px] bg-background border-b border-border flex items-center px-4 lg:px-6 gap-3 flex-shrink-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
                    >
                        <Menu className="w-4 h-4" />
                    </button>

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-[13px]">
                        <span className="text-muted-foreground font-medium">AssetLink</span>
                        <span className="text-border">/</span>
                        <span className="text-foreground font-semibold">{pageTitle}</span>
                    </div>

                    <div className="flex-1" />

                    {/* Right Controls */}
                    <div className="flex items-center gap-2">
                        {/* Live Status */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200/60 text-emerald-700">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                            </span>
                            <span className="label-mono text-emerald-700 text-[10px]">Operational</span>
                        </div>
                        <ThemeToggle />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            {/* Logout Modal */}
            <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
                <DialogContent className="sm:max-w-sm rounded-xl border border-border p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold text-foreground">Sign out</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground mt-1">
                        Are you sure you want to sign out? You'll need to log in again to access the platform.
                    </p>
                    <div className="flex gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setLogoutModalOpen(false)}
                            className="flex-1 h-9 text-sm font-medium rounded-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLogout}
                            variant="destructive"
                            className="flex-1 h-9 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700"
                        >
                            Sign out
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
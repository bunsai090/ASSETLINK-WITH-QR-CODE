import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
    LayoutDashboard, Package, AlertTriangle, Wrench, BarChart3,
    School, Menu, X, Bell, LogOut, ChevronRight, Shield, CalendarDays, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sileo } from 'sileo';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher', 'principal', 'maintenance', 'supervisor'] },
    { path: '/assets', label: 'Assets', icon: Package, roles: ['admin', 'teacher', 'principal', 'supervisor'] },
    { path: '/repair-requests', label: 'Repair Requests', icon: AlertTriangle, roles: ['admin', 'teacher', 'principal', 'supervisor'] },
    { path: '/report-damage', label: 'Report Damage', icon: AlertTriangle, roles: ['admin', 'teacher'] },
    { path: '/tasks', label: 'My Tasks', icon: Wrench, roles: ['admin', 'maintenance'] },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'principal', 'supervisor'] },
    { path: '/calendar', label: 'Calendar', icon: CalendarDays, roles: ['admin', 'maintenance', 'principal', 'supervisor'] },
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
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 h-screen w-64 bg-sidebar z-50 transform transition-transform duration-300 lg:translate-x-0 lg:relative lg:z-auto lg:flex-shrink-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
                        <div className="w-9 h-9 rounded-xl bg-teal flex items-center justify-center shadow-sm">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="text-sidebar-foreground font-bold text-lg tracking-tight">AssetLink</span>
                            <p className="text-xs text-sidebar-foreground/50 -mt-0.5">School Asset System</p>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                        {visibleItems.map(({ path, label, icon: Icon }) => {
                            const active = location.pathname === path;
                            return (
                                <Link
                                    key={path}
                                    to={path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                        active
                                            ? "bg-teal text-white shadow-sm"
                                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                                    )}
                                >
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    <span>{label}</span>
                                    {active && <ChevronRight className="w-3 h-3 ml-auto opacity-70" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User */}
                    <div className="mt-auto px-3 py-4 border-t border-sidebar-border">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <div className="w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-teal">
                                    {currentUser?.full_name?.[0] || currentUser?.email?.[0] || 'U'}
                                </span>
                            </div>
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-bold text-sidebar-foreground leading-tight">{currentUser?.full_name || 'User'}</p>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-teal bg-teal/10 px-1.5 py-0.5 rounded-full flex-shrink-0">{role}</span>
                                    </div>
                                    <p className="text-[10px] text-sidebar-foreground/50 break-all mt-0.5">{currentUser?.email}</p>
                                </div>
                            <button
                                onClick={() => setLogoutModalOpen(true)}
                                className="text-sidebar-foreground/40 hover:text-destructive transition-colors flex-shrink-0"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {/* Top bar */}
                <header className="h-20 bg-card/50 backdrop-blur-md border-b border-border flex items-center px-4 lg:px-8 gap-4 sticky top-0 z-30">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground/60 hover:text-foreground">
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex-1" />
                    {/* Bell icon removed per user request */}
                </header>
                <main className="flex-1 p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>

            {/* Logout Confirmation Modal */}
            <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl border-none">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight">Confirm Logout</DialogTitle>
                    </DialogHeader>
                    <div className="pt-2 pb-4">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to sign out of your account? You will need to log in again to access the system.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setLogoutModalOpen(false)} className="flex-1 font-bold h-11 rounded-xl">
                            Cancel
                        </Button>
                        <Button onClick={handleLogout} variant="destructive" className="flex-1 font-bold h-11 rounded-xl bg-red-500 hover:bg-red-600">
                            Yes, Log me out
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
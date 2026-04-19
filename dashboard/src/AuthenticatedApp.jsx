import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PageNotFound from './lib/PageNotFound';

// Auth Pages
import LocalLogin from './pages/auth/LocalLogin';
import LocalRegister from './pages/auth/LocalRegister';

// Layout
import Layout from './components/Layout';

// Dashboards
import DashboardTeacher from './pages/teacher/Dashboard';
import DashboardMaintenance from './pages/maintenance/Dashboard';
import DashboardPrincipal from './pages/principal/Dashboard';

// Admin/System Pages
import Assets from './pages/admin/Assets';
import Analytics from './pages/admin/Analytics';
import Schools from './pages/Schools';

// Repair & Damage Pages
import RepairRequestsTeacher from './pages/teacher/RepairRequests';
import ReportDamage from './pages/teacher/ReportDamage';
import RepairRequestsPrincipal from './pages/principal/RepairRequests';

// Maintenance Pages
import Tasks from './pages/maintenance/Tasks';
import MaintenanceCalendar from './pages/maintenance/MaintenanceCalendar';

// Supervisor Pages
import DashboardSupervisor from './pages/supervisor/Dashboard';
import SupervisorOversight from './pages/SupervisorOversight';

// Public Pages
import AssetPublic from './pages/public/AssetPublic';

const AuthenticatedApp = () => {
    const { currentUser, isLoadingAuth, authError } = useAuth();
    const role = currentUser?.role || 'teacher';

    // Show loading spinner
    if (isLoadingAuth) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    // Show login/register flows if not authenticated
    if (!currentUser) {
        return (
            <Routes>
                <Route path="/" element={<LocalLogin />} />
                <Route path="/login" element={<LocalLogin />} />
                <Route path="/register" element={<LocalRegister />} />
                <Route path="*" element={<LocalLogin />} />
            </Routes>
        );
    }

    // Handle authentication errors
    if (authError) {
        if (authError.type === 'user_not_registered') {
            return <UserNotRegisteredError />;
        }
    }

    // Role-based Dashboard selection
    const renderDashboard = () => {
        if (role === 'maintenance') return <DashboardMaintenance />;
        if (role === 'principal') return <DashboardPrincipal />;
        if (role === 'admin') return <DashboardPrincipal />; // Admins see Principal dashboard for oversight
        if (role === 'supervisor') return <DashboardSupervisor />;
        return <DashboardTeacher />; 
    };

    // Role-based Repair Requests selection
    const renderRepairRequests = () => {
        if (role === 'principal' || role === 'admin') return <RepairRequestsPrincipal />;
        return <RepairRequestsTeacher />;
    };

    // Render the main app
    return (
        <Routes>
            {/* Direct access to auth pages if specifically requested */}
            <Route path="/login" element={<LocalLogin />} />
            <Route path="/register" element={<LocalRegister />} />
            
            <Route element={<Layout />}>
                <Route path="/" element={renderDashboard()} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/repair-requests" element={renderRepairRequests()} />
                <Route path="/report-damage" element={<ReportDamage />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/calendar" element={<MaintenanceCalendar />} />
                <Route path="/schools" element={<Schools />} />
                <Route path="/oversight" element={<SupervisorOversight />} />
                <Route path="/asset-view" element={<AssetPublic />} />
                <Route path="*" element={<PageNotFound />} />
            </Route>
        </Routes>
    );
};

export default AuthenticatedApp;

import { Toaster } from "sileo";
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import LocalLogin from './pages/auth/LocalLogin';
import Layout from './components/Layout';
import DashboardAdmin from './pages/admin/Dashboard';
import DashboardTeacher from './pages/teacher/Dashboard';
import DashboardMaintenance from './pages/maintenance/Dashboard';
import DashboardSupervisor from './pages/supervisor/Dashboard';
import DashboardPrincipal from './pages/principal/Dashboard';

import Assets from './pages/admin/Assets';
import Analytics from './pages/admin/Analytics';
import Schools from './pages/admin/Schools';

import RepairRequestsTeacher from './pages/teacher/RepairRequests';
import ReportDamage from './pages/teacher/ReportDamage';

import RepairRequestsPrincipal from './pages/principal/RepairRequests';

import Tasks from './pages/maintenance/Tasks';
import MaintenanceCalendar from './pages/maintenance/MaintenanceCalendar';

import AssetPublic from './pages/public/AssetPublic';
import SupervisorOversight from './pages/supervisor/SupervisorOversight';

const AuthenticatedApp = () => {
    const { currentUser, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
    const role = currentUser?.role || 'teacher';

    // Show loading spinner while checking app public settings or auth
    if (isLoadingPublicSettings || isLoadingAuth) {
        return (
            <div className="fixed inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Handle authentication errors
    if (authError) {
        if (authError.type === 'user_not_registered') {
            return <UserNotRegisteredError />;
        } else if (authError.type === 'auth_required') {
            const isLocal = import.meta.env.VITE_BASE44_REAL_BACKEND !== 'true';
            if (isLocal) {
                return <LocalLogin />;
            }
            // Redirect to login automatically
            navigateToLogin();
            return null;
        }
    }

    // Role-based Dashboard selection
    const renderDashboard = () => {
        if (role === 'maintenance') return <DashboardMaintenance />;
        if (role === 'supervisor') return <DashboardSupervisor />;
        if (role === 'teacher') return <DashboardTeacher />;
        if (role === 'principal') return <DashboardPrincipal />;
        return <DashboardAdmin />;
    };

    // Role-based Repair Requests selection
    const renderRepairRequests = () => {
        if (role === 'principal') return <RepairRequestsPrincipal />;
        return <RepairRequestsTeacher />;
    };

    // Render the main app
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={renderDashboard()} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/repair-requests" element={renderRepairRequests()} />
                <Route path="/report-damage" element={<ReportDamage />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/schools" element={<Schools />} />
                <Route path="/calendar" element={<MaintenanceCalendar />} />
                <Route path="/asset-view" element={<AssetPublic />} />
                <Route path="/supervisor-oversight" element={<SupervisorOversight />} />
                <Route path="*" element={<PageNotFound />} />
            </Route>
        </Routes>
    );
};


function App() {

    return (
        <AuthProvider>
            <QueryClientProvider client={queryClientInstance}>
                <Router>
                    <AuthenticatedApp />
                </Router>
                <Toaster position="top-right" />
            </QueryClientProvider>
        </AuthProvider>
    )
}

export default App
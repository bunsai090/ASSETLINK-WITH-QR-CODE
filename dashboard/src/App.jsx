import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { ThemeProvider } from 'next-themes';
import { Toaster } from "sileo";

import { AuthProvider } from '@/lib/AuthContext';


import AuthenticatedApp from './AuthenticatedApp';
import RepairReportPublic from './pages/public/RepairReportPublic';

function App() {
    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <AuthProvider>

                    <Router>
                        <Routes>
                            {/* Public non-auth routes */}
                            <Route path="/repair-report" element={<RepairReportPublic />} />
                            
                            {/* Auth-protected or redirect-handled routes */}
                            <Route path="/*" element={<AuthenticatedApp />} />
                        </Routes>
                    </Router>
                    <Toaster position="top-right" />

            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [appPublicSettings, setAppPublicSettings] = useState(null);

    useEffect(() => {
        checkAppState();
    }, []);

    const checkAppState = async () => {
        try {
            setIsLoadingAuth(true);
            setAuthError(null);

            // BACKEND: This calls base44.auth.me() which should return authenticated user with role.
            // Backend must ensure:
            //   1. User role is verified against auth token/session
            //   2. Role is one of: admin, principal, supervisor, teacher, maintenance
            //   3. Role cannot be changed without admin action
            //   4. Role is checked on every protected endpoint
            // Get current user from the client (works with both real and mock)
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            setIsAuthenticated(true);
            setIsLoadingAuth(false);
            setIsLoadingPublicSettings(false);
        } catch (error) {
            console.error('Auth check failed:', error);

            // If auth fails, check if it's an auth_required error
            if (error.status === 401 || error.status === 403) {
                setAuthError({
                    type: 'auth_required',
                    message: 'Authentication required',
                });
            } else if (error.data?.extra_data?.reason === 'user_not_registered') {
                setAuthError({
                    type: 'user_not_registered',
                    message: 'User not registered for this app',
                });
            } else {
                // For local dev, just set a default user
                setUser(null);
                setIsAuthenticated(false);
            }

            setIsLoadingAuth(false);
            setIsLoadingPublicSettings(false);
        }
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        base44.auth.logout(window.location.origin + '/');
    };

    const navigateToLogin = () => {
        base44.auth.redirectToLogin(window.location.href);
    };

    return (
        <AuthContext.Provider value={{
            user,
            currentUser: user,  // alias used by pages
            isAuthenticated,
            isLoadingAuth,
            isLoadingPublicSettings,
            authError,
            appPublicSettings,
            logout,
            navigateToLogin,
            checkAppState,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

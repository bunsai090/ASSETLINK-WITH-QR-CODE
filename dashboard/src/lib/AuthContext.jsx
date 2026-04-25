import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        // Initial session check
        const initializeAuth = async () => {
            setIsLoadingAuth(true);
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error("Session initialization error:", error);
                setIsLoadingAuth(false);
                return;
            }

            if (session) {
                await fetchProfile(session.user);
            } else {
                setIsLoadingAuth(false);
            }
        };

        initializeAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                await fetchProfile(session.user);
            } else {
                setUser(null);
                setIsAuthenticated(false);
                setIsLoadingAuth(false);
            }
        });

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (supabaseUser) => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

            if (error) {
                // If profile doesn't exist yet (e.g. just registered), set basic user info
                if (error.code === 'PGRST116') {
                    setUser({
                        uid: supabaseUser.id,
                        email: supabaseUser.email,
                        role: null // Force selection
                    });
                    setIsAuthenticated(true);
                    return;
                }
                throw error;
            }

            if (profile) {
                setUser({
                    uid: supabaseUser.id,
                    email: supabaseUser.email,
                    ...profile
                });
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setAuthError({ type: 'data_fetch_error', message: error.message });
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const refreshProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await fetchProfile(session.user);
        }
    };

    const logout = async () => {
        // 1. Optimistically clear local state immediately
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);

        // 2. Force clear Supabase tokens from localStorage
        // This prevents zombie sessions if the server invalidates the token but the client hangs
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            console.error("Failed to clear local storage:", e);
        }

        // 3. Attempt to sign out from the server
        // We don't care if this hangs or fails because the user is already logged out locally
        try {
            // Timeout the signOut call just in case it hangs the browser
            await Promise.race([
                supabase.auth.signOut(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 2000))
            ]);
        } catch (error) {
            console.error("Logout server call failed or timed out:", error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            currentUser: user,
            isAuthenticated,
            isLoadingAuth,
            authError,
            logout,
            refreshProfile,
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

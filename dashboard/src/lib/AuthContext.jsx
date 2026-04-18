import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { base44 } from '../api/base44Client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        // Listen for Firebase Auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setIsLoadingAuth(true);
            if (firebaseUser) {
                try {
                    // Sync token with Base44 API client
                    const idToken = await firebaseUser.getIdToken();
                    base44.auth.setToken(idToken);

                    // Fetch additional user data (like role) from Firestore
                    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                    
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            ...userData
                        });
                        setIsAuthenticated(true);
                    } else {
                        // If no firestore doc, we set basic info but mark as not registered for safety
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            role: 'teacher' // Default fallback or handle error
                        });
                        setIsAuthenticated(true);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setAuthError({ type: 'data_fetch_error', message: error.message });
                }
            } else {
                base44.auth.setToken(null);
                setUser(null);
                setIsAuthenticated(false);
            }
            setIsLoadingAuth(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
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

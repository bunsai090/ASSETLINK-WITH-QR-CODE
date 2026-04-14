import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { DEMO_USERS } from '@/api/seedData';
import { Shield } from 'lucide-react';

export default function LocalLogin() {
    const { checkAppState } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (user) => {
        setIsLoading(true);
        try {
            // This bypasses real login and just stores the user 
            // via mockBase44's updateMe or loginViaEmailPassword
            // But we actually have loginViaEmailPassword mock defined.
            localStorage.setItem('assetlink_mock_current_user', JSON.stringify(user));
            await window.location.reload(); // Reload to let AuthContext grab the mocked user
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-slate-100">
                <div className="flex flex-col items-center justify-center text-center space-y-2 mb-8">
                    <div className="w-12 h-12 bg-teal text-primary-foreground rounded-xl flex items-center justify-center shadow-inner mb-2">
                        <Shield className="w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">AssetLink Dev Login</h1>
                    <p className="text-sm text-slate-500">
                        Choose a demo user role to test the application locally without a backend.
                    </p>
                </div>

                <div className="space-y-4">
                    {DEMO_USERS.map((user) => (
                        <Button 
                            key={user.id}
                            variant="outline"
                            className="w-full justify-start h-auto p-4 text-left border-slate-200 hover:border-teal hover:bg-teal/5 transition-all"
                            onClick={() => handleLogin(user)}
                            disabled={isLoading}
                        >
                            <div className="flex flex-col items-start min-w-0">
                                <span className="font-semibold text-slate-900">{user.full_name}</span>
                                <span className="text-sm text-slate-500 capitalize">{user.role} • {user.email}</span>
                            </div>
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}

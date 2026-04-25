import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { UserCircle, Wrench, CheckCircle2, ArrowRight, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sileo } from 'sileo';
import { cn } from '@/lib/utils';

export default function CompleteProfile() {
    const { currentUser, refreshProfile, logout } = useAuth();
    const [selectedRole, setSelectedRole] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const roles = [
        { id: 'teacher', label: 'Teacher', desc: 'Scan, report, and verify assets.', icon: UserCircle },
        { id: 'maintenance', label: 'Maintenance', desc: 'Execute and resolve repair tasks.', icon: Wrench },
    ];

    const handleSubmit = async () => {
        if (!selectedRole) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .insert({
                    id: currentUser.uid,
                    email: currentUser.email,
                    full_name: currentUser.full_name || currentUser.email.split('@')[0],
                    role: selectedRole,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            sileo.success({
                title: 'Profile Completed',
                description: `Welcome to AssetLink! You are now registered as ${selectedRole}.`
            });

            await refreshProfile();
        } catch (error) {
            console.error('Error saving profile:', error);
            sileo.error({
                title: 'Setup Failed',
                description: error.message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#022c22] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[450px] bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10"
            >
                <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Complete Your Profile</h1>
                            <p className="text-slate-500 text-sm mt-1">Select your role to get started with AssetLink.</p>
                        </div>
                        <button 
                            onClick={logout}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-rose-500"
                            title="Sign out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid gap-4 mb-8">
                        {roles.map((role) => (
                            <button
                                key={role.id}
                                onClick={() => setSelectedRole(role.id)}
                                className={cn(
                                    "relative flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300",
                                    selectedRole === role.id 
                                        ? "border-emerald-500 bg-emerald-50/50 ring-4 ring-emerald-500/10" 
                                        : "border-slate-100 hover:border-slate-200 bg-white"
                                )}
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                    selectedRole === role.id ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                                )}>
                                    <role.icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className={cn(
                                        "font-bold text-sm",
                                        selectedRole === role.id ? "text-emerald-900" : "text-slate-900"
                                    )}>
                                        {role.label}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">{role.desc}</p>
                                </div>
                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                    selectedRole === role.id 
                                        ? "border-emerald-500 bg-emerald-500 text-white" 
                                        : "border-slate-200"
                                )}>
                                    {selectedRole === role.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </div>
                            </button>
                        ))}
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedRole || isSubmitting}
                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                <span>Setting up...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <span>Continue to Dashboard</span>
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        )}
                    </Button>
                </div>

                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 overflow-hidden shadow-sm">
                        {currentUser?.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-slate-900 truncate">{currentUser?.email}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">New User Session</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

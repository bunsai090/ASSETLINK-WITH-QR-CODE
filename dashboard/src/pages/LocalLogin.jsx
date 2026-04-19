import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { DEMO_USERS } from '@/api/seedData';
import { Shield, Lock, ChevronRight, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LocalLogin() {
    const { currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (user) => {
        setIsLoading(true);
        try {
            localStorage.setItem('assetlink_mock_current_user', JSON.stringify(user));
            window.location.reload(); 
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6 font-sans relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[120px]" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-xl bg-white p-16 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] border border-slate-100 relative z-10"
            >
                <div className="flex flex-col items-center justify-center text-center space-y-6 mb-16">
                    <motion.div 
                        initial={{ scale: 0.8, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="w-24 h-24 bg-primary text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20 relative"
                    >
                        <Shield className="w-10 h-10" />
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-50">
                            <Fingerprint className="w-5 h-5 text-primary" />
                        </div>
                    </motion.div>
                    
                    <div className="space-y-3">
                        <h1 className="text-4xl font-serif font-black tracking-tight text-slate-900 leading-tight">
                            Strategic <span className="text-primary italic">Gateway</span>
                        </h1>
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">
                            Authorization Registry • Local Environment
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6 text-center opacity-60">Select Operational Persona</p>
                    
                    <div className="grid grid-cols-1 gap-4">
                        {DEMO_USERS.map((user, idx) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + (idx * 0.1) }}
                            >
                                <Button 
                                    variant="outline"
                                    className="w-full justify-between h-auto p-8 rounded-[1.8rem] border-slate-100 hover:border-primary/20 hover:bg-slate-50 transition-all duration-500 group relative overflow-hidden"
                                    onClick={() => handleLogin(user)}
                                    disabled={isLoading}
                                >
                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                            <Lock className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col items-start min-w-0 text-left">
                                            <span className="font-serif font-black text-xl text-slate-900 leading-tight group-hover:text-primary transition-colors">{user.full_name}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1 capitalize">
                                                {user.role} • {user.email}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="relative z-10 w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:translate-x-2 transition-all duration-500 shrink-0">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                    
                                    {/* Hover Background Accent */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-slate-50 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/20">
                        AssetLink Restoration Infrastructure • Version 4.0.2-BETA
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

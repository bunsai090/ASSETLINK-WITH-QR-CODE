import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Smartphone, Globe, Laptop, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from "react-router-dom";
import { sileo } from "sileo";
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

export default function LocalLogin() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            sileo.success({
                title: 'Login Successful',
                description: `Welcome back! Redirecting you...`
            });
        } catch (error) {
            let errorMsg = 'Invalid email or password. Please try again.';
            if (error.code === 'auth/user-not-found') errorMsg = 'This email is not registered.';
            else if (error.code === 'auth/wrong-password') errorMsg = 'Incorrect password.';
            
            sileo.error({
                title: 'Login Failed',
                description: errorMsg
            });
            setIsLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-background flex flex-col items-center justify-center px-4 py-8 font-sans">
            {/* Background Grid */}
            <div className="al-grid-bg absolute inset-0 pointer-events-none opacity-20" aria-hidden="true" />
            
            <div className="relative z-10 w-full max-w-[1200px] grid lg:grid-cols-2 gap-16 items-center">
                
                {/* Left side: Premium Brand Identity */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-12 text-center lg:text-left"
                >
                    <motion.div variants={itemVariants}>
                        <div className="flex items-center justify-center lg:justify-start gap-5">
                            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-primary/20 transform -rotate-6 group transition-transform hover:rotate-0 duration-700">
                                <QrCode className="w-9 h-9" />
                            </div>
                            <div className="flex flex-col items-start leading-[0.9]">
                                <h1 className="text-6xl md:text-7xl font-serif font-black tracking-tighter text-foreground">
                                    Asset<span className="text-primary">Link</span>
                                </h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mt-2 opacity-50">
                                    Strategic Resource Integrity
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-6">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-[1.1] max-w-md mx-auto lg:mx-0">
                            Institutional <span className="italic text-primary">Intelligence</span> for the modern educator.
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-[480px] mx-auto lg:mx-0 font-medium opacity-70">
                            Access the professional-grade infrastructure for school asset synchronization, maintenance tracking, and institutional accountability.
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="hidden lg:flex flex-wrap gap-8 pt-4">
                        {[
                            { label: 'Cloud Reporting', icon: Globe },
                            { label: 'QR Integration', icon: QrCode },
                            { label: 'Role-Based Access', icon: Laptop }
                        ].map((feat) => (
                            <div key={feat.label} className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-primary/60">
                                <feat.icon className="w-4 h-4" />
                                {feat.label}
                            </div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Right side: Authoritative Login Interface */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-[460px] mx-auto lg:ml-auto"
                >
                    <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-border relative overflow-hidden">
                        {/* Decorative Tag */}
                        <div className="absolute top-0 right-12 px-4 py-2 bg-primary/5 border border-t-0 border-primary/10 rounded-b-xl text-[9px] font-black uppercase tracking-tighter text-primary">
                            Secure Entry Point
                        </div>

                        <div className="mb-10">
                            <h2 className="text-3xl font-serif font-black text-foreground">Personnel Login</h2>
                            <p className="text-sm text-muted-foreground mt-2 font-medium opacity-60 italic">Authenticate to access institutional data</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="group">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1 mb-2 block group-focus-within:text-primary transition-colors">Identifier</label>
                                    <Input 
                                        type="email" 
                                        placeholder="School email address"
                                        className="h-14 bg-background border-border focus-visible:ring-primary rounded-xl text-base font-medium px-5 transition-all focus:bg-white"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="group relative">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1 mb-2 block group-focus-within:text-primary transition-colors">Access Credential</label>
                                    <div className="relative">
                                        <Input 
                                            type={showPassword ? "text" : "password"} 
                                            placeholder="••••••••••••"
                                            className="h-14 bg-background border-border focus-visible:ring-primary rounded-xl pr-14 text-base font-medium px-5 transition-all focus:bg-white"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={isLoading}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end">
                                <a href="#" className="text-xs text-primary font-bold hover:underline transition-all tracking-tight italic opacity-60 hover:opacity-100">
                                    Credentials Recovery?
                                </a>
                            </div>

                            <Button 
                                type="submit"
                                className="w-full h-16 bg-primary hover:bg-primary/95 text-primary-foreground text-lg font-bold rounded-xl shadow-xl shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99] gap-3"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Authenticating...' : (
                                    <>
                                        Authorize Access <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </Button>

                            <div className="pt-8 text-center">
                                <p className="text-xs text-muted-foreground font-medium">
                                    New personnel? <Link to="/register" className="text-primary font-bold hover:underline">Synchronize Account</Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>

            {/* Systems Footer */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 1.2 }}
                className="mt-16 text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground flex items-center gap-8"
            >
                <span>System Integrity V2.4.0</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                <span>© 2026 Institutional AssetLink</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                <div className="flex gap-4">
                    <span className="hover:text-primary cursor-pointer transition-colors">EN-US</span>
                    <span className="hover:text-primary cursor-pointer transition-colors text-primary font-black">PH-REG</span>
                </div>
            </motion.div>
        </div>
    );
}

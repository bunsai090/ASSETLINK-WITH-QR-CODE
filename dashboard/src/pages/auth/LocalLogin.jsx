import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Smartphone, Globe, Laptop, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate, Link } from "react-router-dom";
import { sileo } from "sileo";
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function LocalLogin() {
    const { refreshProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`,
                    queryParams: {
                        prompt: 'select_account'
                    }
                }
            });
            if (error) throw error;
        } catch (error) {
            sileo.error({
                title: 'Google Login Failed',
                description: error.message
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            sileo.success({
                title: 'Login Successful',
                description: `Welcome back! Redirecting you...`
            });
            
            // Trigger a manual profile refresh to ensure the AuthContext grabs the new session
            // Then rely on the App Router to handle the redirect based on the updated state.
            if (refreshProfile) {
                await refreshProfile();
            }
            navigate('/');
        } catch (error) {
            let errorMsg = error?.message || 'Invalid email or password. Please try again.';
            
            try {
                sileo.error({
                    title: 'Login Failed',
                    description: errorMsg
                });
            } catch (e) {
                console.error("Toast failed:", e);
                alert(errorMsg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-white flex overflow-hidden font-sans">
            {/* Left Panel: Login Form */}
            <div className="w-full lg:w-[45%] flex flex-col p-8 md:p-12 relative z-10 justify-center items-center">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col w-full max-w-[400px]"
                >
                    {/* Logo Area */}
                    <div className="mb-4">
                        <a href={import.meta.env.VITE_LANDING_PAGE_URL || "http://localhost:3000"} className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:rotate-6">
                                <QrCode className="w-6 h-6" />
                            </div>
                            <span className="text-2xl font-serif font-black tracking-tight text-foreground">
                                Asset<span className="text-primary">Link</span>
                            </span>
                        </a>
                    </div>

                    {/* Header */}
                    <div className="mb-4">
                        <h1 className="text-3xl font-serif font-black text-foreground tracking-tight mb-1">Log in</h1>
                        <p className="text-muted-foreground font-medium text-xs">Welcome back! Please enter your details.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/80 ml-1">Email</label>
                            <Input 
                                type="email" 
                                placeholder="Enter your email"
                                className="h-12 bg-white border-border focus-visible:ring-primary rounded-xl text-base px-4"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-sm font-bold text-foreground/80">Password</label>
                                <button type="button" className="text-xs font-bold text-primary hover:underline">Forgot password</button>
                            </div>
                            <div className="relative">
                                <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••"
                                    className="h-12 bg-white border-border focus-visible:ring-primary rounded-xl pr-12 text-base px-4"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 px-1">
                            <input type="checkbox" id="remember" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                            <label htmlFor="remember" className="text-sm font-medium text-muted-foreground">Remember for 30 days</label>
                        </div>

                        <Button 
                            type="submit"
                            className="w-full h-12 bg-primary hover:bg-primary/95 text-primary-foreground text-base font-bold rounded-xl transition-all active:scale-[0.98]"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </Button>

                        <Button 
                            type="button"
                            variant="outline"
                            onClick={handleGoogleLogin}
                            className="w-full h-12 border-border hover:bg-background rounded-xl gap-3 font-bold text-base transition-all active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign in with Google
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6">
                        <p className="text-sm text-muted-foreground font-medium">
                            Don't have an account? <Link to="/register" className="text-primary font-bold hover:underline">Sign up</Link>
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Right Panel: Visual Content */}
            <div className="hidden lg:flex w-[55%] bg-primary relative overflow-hidden items-center justify-center p-12">
                {/* Background Pattern Overlay */}
                <div className="absolute inset-0 opacity-10 al-grid-bg" />
                
                {/* Generated Visual */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative z-10 w-full h-full flex flex-col items-center justify-center text-white"
                >
                    <div className="relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl shadow-black/40 border border-white/20">
                        <img 
                            src="/login_visual.png" 
                            alt="AssetLink Dashboard Preview" 
                            className="w-full h-auto object-cover"
                        />
                        {/* Glassmorphic Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
                    </div>

                    <div className="mt-12 text-center max-w-md">
                        <h3 className="text-3xl font-serif font-bold mb-4">Welcome to your new dashboard</h3>
                        <p className="text-primary-foreground/80 font-medium leading-relaxed">
                            Log in to explore the changes we've made and manage your assets with precision.
                        </p>
                    </div>

                    {/* Floating Status Cards */}
                    <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-20 right-20 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl flex items-center gap-3"
                    >
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Status</span>
                            <span className="text-xs font-bold">Systems Operational</span>
                        </div>
                    </motion.div>
                </motion.div>


            </div>
        </div>
    );
}

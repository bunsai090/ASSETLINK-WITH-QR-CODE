import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Smartphone, Globe, Laptop, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from "react-router-dom";
import { sileo } from "sileo";
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

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
            // FIREBASE AUTHENTICATION
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            sileo.success({
                title: 'Login Successful',
                description: `Welcome back! Redirecting you to your dashboard...`
            });
            
            // Note: window.location.reload() or navigation is handled by AuthContext state change
        } catch (error) {
            let errorMsg = 'Invalid email or password. Please try again.';
            
            // Handle specific Firebase errors
            if (error.code === 'auth/user-not-found') {
                errorMsg = 'This email is not registered in our system.';
            } else if (error.code === 'auth/wrong-password') {
                errorMsg = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/invalid-email') {
                errorMsg = 'Please enter a valid email address.';
            }

            sileo.error({
                title: 'Login Failed',
                description: errorMsg
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex flex-col justify-center items-center px-4 py-8 sm:py-24">
            <div className="w-full max-w-[980px] grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                
                {/* Left Column: Branding */}
                <div className="text-center lg:text-left space-y-4 lg:mb-20">
                    <div className="flex items-center justify-center lg:justify-start gap-3">
                        <div className="w-10 h-10 bg-[#008080] text-white rounded-lg flex items-center justify-center shadow-lg">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h1 className="text-[#008080] text-5xl font-bold tracking-tight">AssetLink</h1>
                    </div>
                    <p className="text-2xl font-medium text-slate-800 leading-tight max-w-[500px] mx-auto lg:mx-0">
                        AssetLink helps you manage school resources and track maintenance history with ease.
                    </p>
                    
                    <div className="hidden lg:flex gap-6 pt-6 opacity-40">
                        <Globe className="w-8 h-8" />
                        <Laptop className="w-8 h-8" />
                        <Smartphone className="w-8 h-8" />
                    </div>
                </div>

                {/* Right Column: Login Card */}
                <div className="w-full max-w-[396px] mx-auto">
                    <div className="bg-white p-4 sm:p-5 rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)] border-none">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            <div className="space-y-3">
                                <Input 
                                    type="email" 
                                    placeholder="Email address"
                                    className="h-[52px] text-base px-4 border-[#dddfe2] focus-visible:ring-[#008080] focus-visible:border-[#008080]"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                                <div className="relative">
                                    <Input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Password"
                                        className="h-[52px] text-base px-4 border-[#dddfe2] focus-visible:ring-[#008080] focus-visible:border-[#008080]"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <Button 
                                type="submit"
                                className="w-full h-[48px] bg-[#008080] hover:bg-[#006666] text-white text-xl font-bold rounded-md transition-colors"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Authenticating...' : 'Log In'}
                            </Button>

                            <div className="text-center pt-2">
                                <a href="#" className="text-sm text-[#008080] hover:underline">Forgot password?</a>
                            </div>

                            <div className="border-t border-slate-200 pt-6 mt-2 text-center">
                                <Button 
                                    type="button"
                                    onClick={() => navigate('/register')}
                                    className="h-[48px] bg-[#42b72a] hover:bg-[#36a420] text-white text-lg font-bold px-4 rounded-md transition-colors"
                                >
                                    Create New Account
                                </Button>
                            </div>

                        </form>
                    </div>
                    
                    <p className="mt-7 text-center text-sm text-slate-600">
                        <Link to="/register" className="font-bold hover:underline cursor-pointer">Create a Page</Link> for a school, maintenance team or supervisor.
                    </p>
                </div>
            </div>

            {/* Language Footer */}
            <div className="w-full max-w-[980px] mt-24 pt-8 border-t border-slate-300 text-xs text-slate-500 space-y-3 hidden sm:block">
                <div className="flex flex-wrap gap-3">
                    <span className="cursor-pointer hover:underline">English (US)</span>
                    <span className="cursor-pointer hover:underline text-[#008080]">Filipino</span>
                    <span className="cursor-pointer hover:underline">Bisaya</span>
                </div>
                <div>
                   AssetLink © 2026
                </div>
            </div>
        </div>
    );
}

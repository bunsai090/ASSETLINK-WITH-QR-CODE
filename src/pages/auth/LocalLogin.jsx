import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEMO_USERS } from '@/api/seedData';
import { Shield, Smartphone, Globe, Laptop } from 'lucide-react';
import { sileo } from "sileo";

export default function LocalLogin() {
    const { checkAppState } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // For now, we simulate finding the user in our demo data
            const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
            
            if (user) {
                // Mock password check (accept anything for demo users)
                localStorage.setItem('assetlink_mock_current_user', JSON.stringify(user));
                sileo.success({
                    title: 'Login Successful',
                    description: `Welcome back, ${user.full_name}! Redirecting you to your dashboard...`
                });
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                sileo.error({
                    title: 'Login Failed',
                    description: 'The email address you entered wasn’t connected to an account. Please try again.'
                });
                setIsLoading(false);
            }
        } catch (err) {
            sileo.error({
                title: 'System Error',
                description: 'We encountered an unexpected problem. Please try refreshing the page.'
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
                    
                    {/* Decorative Icons for "Premium" feel */}
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
                                <Input 
                                    type="password" 
                                    placeholder="Password"
                                    className="h-[52px] text-base px-4 border-[#dddfe2] focus-visible:ring-[#008080] focus-visible:border-[#008080]"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <Button 
                                type="submit"
                                className="w-full h-[48px] bg-[#008080] hover:bg-[#006666] text-white text-xl font-bold rounded-md transition-colors"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Logging in...' : 'Log In'}
                            </Button>

                            <div className="text-center pt-2">
                                <a href="#" className="text-sm text-[#008080] hover:underline">Forgot password?</a>
                            </div>

                        </form>
                    </div>
                    
                    <p className="mt-7 text-center text-sm text-slate-600">
                        <span className="font-bold hover:underline cursor-pointer">Create a Page</span> for a school, maintenance team or supervisor.
                    </p>
                </div>
            </div>

            {/* Language Footer (Facebook style) */}
            <div className="w-full max-w-[980px] mt-24 pt-8 border-t border-slate-300 text-xs text-slate-500 space-y-3 hidden sm:block">
                <div className="flex flex-wrap gap-3">
                    <span className="cursor-pointer hover:underline">English (US)</span>
                    <span className="cursor-pointer hover:underline text-[#008080]">Filipino</span>
                    <span className="cursor-pointer hover:underline">Bisaya</span>
                    <span className="cursor-pointer hover:underline">Español</span>
                    <span className="cursor-pointer hover:underline">日本語</span>
                    <span className="cursor-pointer hover:underline">한국어</span>
                    <span className="cursor-pointer hover:underline">中文(简体)</span>
                </div>
                <div className="flex flex-wrap gap-4">
                    <span className="cursor-pointer hover:underline">Sign Up</span>
                    <span className="cursor-pointer hover:underline">Log In</span>
                    <span className="cursor-pointer hover:underline">Messenger</span>
                    <span className="cursor-pointer hover:underline">AssetLink Lite</span>
                    <span className="cursor-pointer hover:underline">Marketplace</span>
                    <span className="cursor-pointer hover:underline">Meta Pay</span>
                </div>
                <div>
                   AssetLink © 2026
                </div>
            </div>
        </div>
    );
}

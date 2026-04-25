import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    QrCode, Eye, EyeOff, ChevronLeft, ChevronRight, UserCircle, Mail, Lock, CheckCircle2,
    Phone, IdCard, Briefcase, MapPin, Building2, Wrench, Hash, ArrowLeft
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from 'framer-motion';
import { sileo } from "sileo";
import { supabase } from '@/lib/supabase';

export default function LocalRegister() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        suffix: '',
        email: '',
        phoneNumber: '',
        employeeId: '',
        password: '',
        role: '',
        department: '',
        roomNumber: '',
        schoolName: '',
        schoolId: '',
        specialization: ''
    });

    const roles = [
        { id: 'teacher', label: 'Teacher', desc: 'Scan, report, and verify assets.', icon: UserCircle },
        { id: 'maintenance', label: 'Maintenance', desc: 'Execute and resolve repair tasks.', icon: Wrench },
    ];

    const nextStep = () => {
        if (currentStep === 1 && !formData.role) {
            sileo.error({ title: 'Role Required', description: 'Please select your role to continue.' });
            return;
        }
        setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;
            if (!data.user) throw new Error("Synchronization failed.");

            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    full_name: `${formData.firstName} ${formData.lastName}${formData.suffix && formData.suffix !== 'none' ? ' ' + formData.suffix : ''}`,
                    email: formData.email,
                    phone_number: `+63${formData.phoneNumber}`,
                    employee_id: formData.employeeId,
                    role: formData.role,
                    ...(formData.role === 'teacher' && { department: formData.department, room_number: formData.roomNumber }),
                    ...(formData.role === 'maintenance' && { specialization: formData.specialization }),
                });

            if (profileError) throw profileError;

            await supabase.auth.signOut();
            sileo.success({ title: 'Success', description: 'Account created. Please login.' });
            setTimeout(() => navigate('/'), 2000);
        } catch (error) {
            sileo.error({ title: 'Error', description: error.message });
            setIsLoading(false);
        }
    };

    const slideVariants = {
        enter: (direction) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (direction) => ({ x: direction < 0 ? 50 : -50, opacity: 0 })
    };

    return (
        <div className="h-screen w-full bg-white flex overflow-hidden font-sans">
            {/* Left Panel: Register Form */}
            <div className="w-full lg:w-[45%] flex flex-col p-8 md:p-12 relative z-10 justify-center items-center">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col w-full max-w-[400px]"
                >
                    {/* Logo Area */}
                    <div className="mb-8">
                        <a href={import.meta.env.VITE_LANDING_PAGE_URL || "http://localhost:3000"} className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:rotate-6">
                                <QrCode className="w-6 h-6" />
                            </div>
                            <span className="text-2xl font-serif font-black tracking-tight text-foreground">
                                Asset<span className="text-primary">Link</span>
                            </span>
                        </a>
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex gap-2 mb-8">
                        {[1, 2, 3].map(step => (
                            <div 
                                key={step} 
                                className={`h-1 rounded-full transition-all duration-500 ${currentStep >= step ? 'w-12 bg-primary' : 'w-4 bg-border'}`} 
                            />
                        ))}
                    </div>

                    {/* Multi-step Form Content */}
                    <div className="flex-1">
                        <AnimatePresence mode="wait" custom={currentStep}>
                            <motion.div
                                key={currentStep}
                                custom={currentStep}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="max-w-md"
                            >
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h1 className="text-4xl font-serif font-black text-foreground tracking-tight mb-1">Your Role</h1>
                                            <p className="text-muted-foreground font-medium text-sm">Choose your job in the school.</p>
                                        </div>
                                        <div className="grid gap-4">
                                            {roles.map((role) => {
                                                const Icon = role.icon;
                                                return (
                                                    <button
                                                        key={role.id}
                                                        onClick={() => setFormData({...formData, role: role.id})}
                                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                                                            formData.role === role.id 
                                                            ? 'border-primary bg-primary/[0.02] shadow-sm' 
                                                            : 'border-border bg-white hover:border-primary/30'
                                                        }`}
                                                    >
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${formData.role === role.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                                            <Icon className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-base font-bold text-foreground">{role.label}</p>
                                                            <p className="text-xs text-muted-foreground font-medium leading-tight">{role.desc}</p>
                                                        </div>
                                                        {formData.role === role.id && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <Button onClick={nextStep} className="w-full h-12 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl gap-2 mt-4">
                                            Continue <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h1 className="text-4xl font-serif font-black text-foreground tracking-tight mb-1">Profile</h1>
                                            <p className="text-muted-foreground font-medium text-sm">Tell us more about yourself.</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-foreground/80 ml-1">First Name</label>
                                                    <Input className="h-11 rounded-xl" placeholder="First" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-foreground/80 ml-1">Last Name</label>
                                                    <Input className="h-11 rounded-xl" placeholder="Last" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-foreground/80 ml-1">Email</label>
                                                <Input className="h-11 rounded-xl" placeholder="school@email.com" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-foreground/80 ml-1">Phone</label>
                                                    <Input className="h-11 rounded-xl" placeholder="9XXXXXXXXX" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-foreground/80 ml-1">Employee ID</label>
                                                    <Input className="h-11 rounded-xl" placeholder="ID NO" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} />
                                                </div>
                                            </div>
                                            {/* Role Specifics */}
                                            {formData.role === 'teacher' && (
                                                <div className="grid grid-cols-2 gap-4 pt-2">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-primary/80 ml-1">Department</label>
                                                        <Input className="h-11 rounded-xl border-primary/20" placeholder="ICT / Science" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-primary/80 ml-1">Room</label>
                                                        <Input className="h-11 rounded-xl border-primary/20" placeholder="Room 204" value={formData.roomNumber} onChange={e => setFormData({...formData, roomNumber: e.target.value})} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-4">
                                            <Button variant="outline" onClick={prevStep} className="h-12 flex-1 rounded-xl font-bold">Back</Button>
                                            <Button onClick={nextStep} className="h-12 flex-[2] bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl">Next</Button>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h1 className="text-4xl font-serif font-black text-foreground tracking-tight mb-1">Password</h1>
                                            <p className="text-muted-foreground font-medium text-sm">Secure your account.</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-foreground/80 ml-1">Password</label>
                                                <div className="relative">
                                                    <Input 
                                                        type={showPassword ? "text" : "password"}
                                                        className="h-14 rounded-xl pr-12 text-lg"
                                                        placeholder="••••••••"
                                                        value={formData.password}
                                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                                    />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-2xl flex gap-3">
                                                <Lock className="w-5 h-5 text-primary shrink-0" />
                                                <p className="text-xs font-medium text-muted-foreground leading-relaxed italic">
                                                    Use at least 8 characters with a mix of letters and numbers for maximum security.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <Button variant="outline" onClick={prevStep} className="h-12 flex-1 rounded-xl font-bold" disabled={isLoading}>Back</Button>
                                            <Button onClick={handleSubmit} disabled={isLoading} className="h-12 flex-[2] bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl">
                                                {isLoading ? "Creating Account..." : "Create Account"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="mt-8">
                        <p className="text-sm text-muted-foreground font-medium">
                            Already have an account? <Link to="/" className="text-primary font-bold hover:underline">Log in</Link>
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Right Panel: Visual Content (Same as Login) */}
            <div className="hidden lg:flex w-[55%] bg-primary relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 opacity-10 al-grid-bg" />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative z-10 w-full h-full flex flex-col items-center justify-center text-white"
                >
                    <div className="relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl shadow-black/40 border border-white/20">
                        <img src="/login_visual.png" alt="Preview" className="w-full h-auto object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
                    </div>
                    <div className="mt-12 text-center max-w-md">
                        <h3 className="text-3xl font-serif font-bold mb-4">Start your journey with AssetLink</h3>
                        <p className="text-primary-foreground/80 font-medium leading-relaxed">
                            Join our community of teachers and staff managing school resources with efficiency and ease.
                        </p>
                    </div>
                    <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-20 right-20 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl flex items-center gap-3"
                    >
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Success</span>
                            <span className="text-xs font-bold">New Account Registered</span>
                        </div>
                    </motion.div>
                </motion.div>

            </div>
        </div>
    );
}

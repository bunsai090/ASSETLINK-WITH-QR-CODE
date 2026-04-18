import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    QrCode, Eye, EyeOff, ChevronLeft, ChevronRight, UserCircle, Mail, Lock, CheckCircle2,
    Phone, IdCard, Briefcase, MapPin, Building2, Wrench, School, Hash, ArrowLeft
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
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

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
        { id: 'principal', label: 'Principal', desc: 'Triage and oversee school maintenance.', icon: School },
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
        e.preventDefault();
        setIsLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                first_name: formData.firstName,
                last_name: formData.lastName,
                suffix: formData.suffix,
                full_name: `${formData.firstName} ${formData.lastName}${formData.suffix && formData.suffix !== 'none' ? ' ' + formData.suffix : ''}`,
                email: formData.email,
                phone_number: `+63${formData.phoneNumber}`,
                employee_id: formData.employeeId,
                role: formData.role,
                ...(formData.role === 'teacher' && { department: formData.department, room_number: formData.roomNumber }),
                ...(formData.role === 'principal' && { school_name: formData.schoolName, school_id: formData.schoolId }),
                ...(formData.role === 'maintenance' && { specialization: formData.specialization }),
                created_at: serverTimestamp(),
            });

            await signOut(auth);
            sileo.success({ title: 'Success', description: 'Account created. Please login.' });
            setTimeout(() => navigate('/'), 2000);
        } catch (error) {
            sileo.error({ title: 'Error', description: error.message });
            setIsLoading(false);
        }
    };

    const slideVariants = {
        enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (direction) => ({ x: direction < 0 ? 300 : -300, opacity: 0 })
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-background flex flex-col items-center justify-center px-4 py-8 font-sans">
            {/* Background Grid */}
            <div className="al-grid-bg absolute inset-0 pointer-events-none opacity-20" aria-hidden="true" />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[560px] relative z-10"
            >
                {/* Branding & Strategy Progress */}
                <div className="flex flex-col items-center mb-12">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 transform -rotate-3 transition-transform hover:rotate-0">
                            <QrCode className="w-7 h-7" />
                        </div>
                        <div className="flex flex-col items-start leading-[0.9]">
                            <h1 className="text-4xl font-serif font-black tracking-tight text-foreground">Asset<span className="text-primary">Link</span></h1>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-2 opacity-40">Account Synchronization</p>
                        </div>
                    </div>
                    
                    {/* Tactical Progress Bar */}
                    <div className="flex gap-2.5">
                        {[1, 2, 3].map(step => (
                            <div 
                                key={step} 
                                className={`h-1.5 rounded-full transition-all duration-700 ease-[0.22, 1, 0.36, 1] ${currentStep >= step ? 'w-10 bg-primary' : 'w-5 bg-border'}`} 
                            />
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-border p-10 md:p-14 relative overflow-hidden">
                    {/* Metadata Tag */}
                    <div className="absolute top-0 right-14 px-4 py-2 bg-primary/5 border border-t-0 border-primary/10 rounded-b-xl text-[8px] font-black uppercase tracking-tighter text-primary">
                        Personnel Enrolment Phase 0{currentStep}
                    </div>

                    <AnimatePresence mode="wait" custom={currentStep}>
                        <motion.div
                            key={currentStep}
                            custom={currentStep}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            {currentStep === 1 && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-3xl font-serif font-black tracking-tight text-foreground">Personnel Role</h2>
                                        <p className="text-sm text-muted-foreground mt-2 font-medium italic opacity-60">Specify your institutional function within the system.</p>
                                    </div>
                                    <div className="grid gap-3">
                                        {roles.map((role) => {
                                            const Icon = role.icon;
                                            return (
                                                <button
                                                    key={role.id}
                                                    onClick={() => setFormData({...formData, role: role.id})}
                                                    className={`group relative flex items-center gap-5 p-5 rounded-[1.25rem] border-2 transition-all duration-300 ${
                                                        formData.role === role.id 
                                                        ? 'border-primary bg-primary/[0.02] shadow-sm' 
                                                        : 'border-transparent bg-background/50 hover:bg-white hover:border-border'
                                                    }`}
                                                >
                                                    <div className={`p-3 rounded-xl transition-all duration-500 ${formData.role === role.id ? 'bg-primary text-white scale-110' : 'bg-secondary text-muted-foreground opacity-50'}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="text-left flex-1">
                                                        <p className={`text-base font-bold tracking-tight ${formData.role === role.id ? 'text-primary' : 'text-foreground'}`}>{role.label}</p>
                                                        <p className="text-[11px] font-medium text-muted-foreground/60 leading-snug">{role.desc}</p>
                                                    </div>
                                                    {formData.role === role.id && (
                                                        <motion.div layoutId="check" className="mr-2">
                                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                                        </motion.div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <Button onClick={nextStep} className="w-full h-16 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl gap-3 font-bold shadow-xl shadow-primary/10 text-lg transition-transform active:scale-[0.98]">
                                        Continue Enrolment <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-3xl font-serif font-black tracking-tight text-foreground">Profile Alignment</h2>
                                        <p className="text-sm text-muted-foreground mt-2 font-medium italic opacity-60 capitalize">Establishing identity for {formData.role} role.</p>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">Given Name</label>
                                                <Input className="h-14 bg-background border-border rounded-xl px-5 font-medium" placeholder="First" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">Surname</label>
                                                <Input className="h-14 bg-background border-border rounded-xl px-5 font-medium" placeholder="Last" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">Institutional Email</label>
                                            <Input className="h-14 bg-background border-border rounded-xl px-5 font-medium" placeholder="email@school.edu.ph" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">Mobile Contact</label>
                                                <div className="flex">
                                                    <div className="flex items-center justify-center px-4 bg-secondary border border-r-0 border-border rounded-l-xl text-xs font-black text-muted-foreground">+63</div>
                                                    <Input className="h-14 bg-background border-border rounded-l-none rounded-r-xl px-5 font-medium" placeholder="9XXXXXXXXX" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">Employee Hash</label>
                                                <Input className="h-14 bg-background border-border rounded-xl px-5 font-medium" placeholder="ID NO" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} />
                                            </div>
                                        </div>

                                        {/* Strategic Role-Based Metadata */}
                                        <div className="pt-2">
                                            {formData.role === 'teacher' && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Department</label>
                                                        <Input className="h-14 bg-primary/[0.01] border-primary/10 rounded-xl px-5 font-medium" placeholder="Science / ICT" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Assigned Unit</label>
                                                        <Input className="h-14 bg-primary/[0.01] border-primary/10 rounded-xl px-5 font-medium" placeholder="Room 204" value={formData.roomNumber} onChange={e => setFormData({...formData, roomNumber: e.target.value})} />
                                                    </div>
                                                </div>
                                            )}
                                            {formData.role === 'principal' && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">School Name</label>
                                                        <Input className="h-14 bg-primary/[0.01] border-primary/10 rounded-xl px-5 font-medium" placeholder="DepEd Institution" value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value})} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Registry ID</label>
                                                        <Input className="h-14 bg-primary/[0.01] border-primary/10 rounded-xl px-5 font-medium" placeholder="BEIS-ID" value={formData.schoolId} onChange={e => setFormData({...formData, schoolId: e.target.value})} />
                                                    </div>
                                                </div>
                                            )}
                                            {formData.role === 'maintenance' && (
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Operational Specialization</label>
                                                    <Select onValueChange={v => setFormData({...formData, specialization: v})} value={formData.specialization}>
                                                        <SelectTrigger className="h-14 bg-primary/[0.01] border-primary/10 rounded-xl px-5 font-medium">
                                                            <SelectValue placeholder="Identify focus area" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-border">
                                                            <SelectItem value="it">Technological Systems (IT)</SelectItem>
                                                            <SelectItem value="general">General Infrastructure</SelectItem>
                                                            <SelectItem value="electrical">Electrical Grid</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <Button variant="ghost" onClick={prevStep} className="h-16 flex-1 rounded-xl text-muted-foreground font-bold text-base hover:bg-background">Back</Button>
                                        <Button onClick={nextStep} className="h-16 flex-[2] bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl font-bold shadow-xl shadow-primary/10 text-lg transition-transform active:scale-[0.98]">Confirm Identity</Button>
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-3xl font-serif font-black tracking-tight text-foreground">Access Protocol</h2>
                                        <p className="text-sm text-muted-foreground mt-2 font-medium italic opacity-60">Finalize security credentials for system synchronization.</p>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">System Password</label>
                                            <div className="relative">
                                                <Input 
                                                    type={showPassword ? "text" : "password"}
                                                    className="h-16 bg-background border-border rounded-xl px-5 font-medium text-lg pr-14"
                                                    placeholder="••••••••••••"
                                                    value={formData.password}
                                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none">
                                                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-secondary border border-border">
                                            <div className="flex gap-3">
                                                <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed italic">
                                                    Infrastructure security mandates at least 8 characters, including alphanumeric combinations to maintain institutional data integrity.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-6">
                                        <Button variant="ghost" onClick={prevStep} className="h-16 flex-1 rounded-xl text-muted-foreground font-bold text-base hover:bg-background" disabled={isLoading}>Back</Button>
                                        <Button onClick={handleSubmit} disabled={isLoading} className="h-16 flex-[2] bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl font-bold shadow-2xl shadow-primary/20 text-lg transition-transform active:scale-[0.98]">
                                            {isLoading ? "Provisioning..." : "Initialize Registry"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="mt-12 text-center">
                    <Link to="/" className="group inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-all">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Return to Authentication Portal
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

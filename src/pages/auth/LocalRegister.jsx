import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Shield, Eye, EyeOff, ChevronLeft, ChevronRight, UserCircle, Mail, Lock, CheckCircle2,
    Phone, IdCard, Briefcase, MapPin, Building2, Wrench, School, Hash, Globe 
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { sileo } from "sileo";
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function LocalRegister() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        suffix: '',
        email: '',
        phoneNumber: '',
        employeeId: '',
        password: '',
        confirmPassword: '',
        role: '',
        // Role-specific fields
        department: '',
        roomNumber: '',
        schoolName: '',
        schoolId: '',
        regionDistrict: '',
        officeLocation: '',
        specialization: ''
    });

    const roles = [
        { id: 'teacher', label: 'Teacher', desc: 'Manage classroom assets and reports' },
        { id: 'principal', label: 'Principal', desc: 'Oversee school-wide asset approvals' },
        { id: 'supervisor', label: 'Supervisor', desc: 'Regional oversight and analytics' },
        { id: 'maintenance', label: 'Maintenance Staff', desc: 'Receive tasks and update repairs' },
    ];

    const nextStep = () => {
        if (currentStep === 1 && !formData.role) {
            sileo.error({ title: 'Role Required', description: 'Please select a role to continue.' });
            return;
        }
        if (currentStep === 2) {
            if (!formData.firstName || !formData.lastName || !formData.email || !formData.phoneNumber || !formData.employeeId) {
                sileo.error({ title: 'Info Required', description: 'Please fill in all basic information fields.' });
                return;
            }
            // Dynamic field validation
            if (formData.role === 'teacher' && (!formData.department || !formData.roomNumber)) {
                sileo.error({ title: 'Info Required', description: 'Please fill in department and room number.' });
                return;
            }
            if (formData.role === 'principal' && (!formData.schoolName || !formData.schoolId)) {
                sileo.error({ title: 'Info Required', description: 'Please fill in school name and ID.' });
                return;
            }
            if (formData.role === 'supervisor' && (!formData.regionDistrict || !formData.officeLocation)) {
                sileo.error({ title: 'Info Required', description: 'Please fill in region and office location.' });
                return;
            }
            if (formData.role === 'maintenance' && !formData.specialization) {
                sileo.error({ title: 'Info Required', description: 'Please select your specialization.' });
                return;
            }
        }
        setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            sileo.error({ title: 'Password Mismatch', description: 'Your passwords do not match.' });
            return;
        }

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
                // Role-specific fields
                ...(formData.role === 'teacher' && { 
                    department: formData.department, 
                    room_number: formData.roomNumber 
                }),
                ...(formData.role === 'principal' && { 
                    school_name: formData.schoolName, 
                    school_id: formData.schoolId 
                }),
                ...(formData.role === 'supervisor' && { 
                    region_district: formData.regionDistrict, 
                    office_location: formData.officeLocation 
                }),
                ...(formData.role === 'maintenance' && { 
                    specialization: formData.specialization 
                }),
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            });

            // Sign out the user immediately after registration so they have to log in manually
            await signOut(auth);

            sileo.success({
                title: 'Account Created!',
                description: `Successfully registered as a ${formData.role}. Please log in with your new credentials.`
            });

            // Redirect to login page
            setTimeout(() => navigate('/'), 2000);
        } catch (error) {
            let errorMsg = 'Failed to create account. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                errorMsg = 'This email is already registered.';
            } else if (error.code === 'auth/weak-password') {
                errorMsg = 'Password should be at least 6 characters.';
            }

            sileo.error({ title: 'Registration Error', description: errorMsg });
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex flex-col justify-center items-center px-4 py-8">
            <div className="w-full max-w-[500px]">
                
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-[#008080] text-white rounded flex items-center justify-center shadow">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h1 className="text-[#008080] text-4xl font-bold tracking-tight">AssetLink</h1>
                    </div>
                    <p className="text-slate-500 font-medium">Join our community of educators and staff</p>
                </div>

                {/* Steps Indicator Tracker */}
                <div className="flex items-center justify-between mb-10 relative max-w-[400px] mx-auto">
                    {/* Connecting Line Backdrop */}
                    <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 -z-10" />
                    {/* Active Connecting Line */}
                    <div 
                        className="absolute top-5 left-0 h-0.5 bg-[#008080] transition-all duration-500 -z-10" 
                        style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                    />

                    {[
                        { step: 1, label: 'Account Role' },
                        { step: 2, label: 'Your Details' },
                        { step: 3, label: 'Security Setup' }
                    ].map((s) => (
                        <div key={s.step} className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${
                                currentStep >= s.step 
                                ? 'bg-[#008080] border-[#008080] text-white' 
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}>
                                {currentStep > s.step ? (
                                    <CheckCircle2 className="w-6 h-6" />
                                ) : (
                                    <span className="text-sm font-black">{s.step}</span>
                                )}
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest mt-2 transition-colors duration-300 ${
                                currentStep >= s.step ? 'text-[#008080]' : 'text-slate-400'
                            }`}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Card Container */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 relative">

                    <div className="p-8 sm:p-10 pt-12">
                        
                        {/* Step 1: Role Selection */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-slate-800">What is your role?</h2>
                                    <p className="text-slate-500 text-sm mt-1">Select the role that best fits your job</p>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {roles.map((role) => (
                                        <button
                                            key={role.id}
                                            onClick={() => setFormData({...formData, role: role.id})}
                                            className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                                                formData.role === role.id 
                                                ? 'border-[#008080] bg-[#008080]/5' 
                                                : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                                            }`}
                                        >
                                            <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                formData.role === role.id ? 'border-[#008080]' : 'border-slate-300'
                                            }`}>
                                                {formData.role === role.id && <div className="w-2.5 h-2.5 bg-[#008080] rounded-full" />}
                                            </div>
                                            <div>
                                                <p className={`font-bold ${formData.role === role.id ? 'text-[#008080]' : 'text-slate-700'}`}>{role.label}</p>
                                                <p className="text-xs text-slate-500">{role.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <Button onClick={nextStep} className="w-full h-12 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl gap-2">
                                    Continue <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        {/* Step 2: Basic Info */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-slate-800">Your Details</h2>
                                    <p className="text-slate-500 text-sm mt-1">Tell us a little about yourself</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label>
                                        <div className="grid grid-cols-12 gap-2">
                                            <div className="col-span-5 relative">
                                                <UserCircle className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <Input 
                                                    className="pl-8 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#008080]"
                                                    placeholder="First Name"
                                                    value={formData.firstName}
                                                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                                />
                                            </div>
                                            <div className="col-span-4">
                                                <Input 
                                                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#008080]"
                                                    placeholder="Last Name"
                                                    value={formData.lastName}
                                                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <Select onValueChange={(val) => setFormData({...formData, suffix: val})} value={formData.suffix}>
                                                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200 focus:ring-[#008080]">
                                                        <SelectValue placeholder="Suffix" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">Suffix</SelectItem>
                                                        <SelectItem value="Jr.">Jr.</SelectItem>
                                                        <SelectItem value="Sr.">Sr.</SelectItem>
                                                        <SelectItem value="II">II</SelectItem>
                                                        <SelectItem value="III">III</SelectItem>
                                                        <SelectItem value="IV">IV</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <Input 
                                                type="email"
                                                className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#008080]"
                                                placeholder="you@school.edu.ph"
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Phone Number</label>
                                        <div className="flex group">
                                            <div className="flex items-center justify-center px-4 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 font-bold text-sm transition-colors group-focus-within:border-[#008080] group-focus-within:bg-slate-50">
                                                +63
                                            </div>
                                            <div className="relative flex-1">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                <Input 
                                                    type="tel"
                                                    className="pl-10 rounded-l-none h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#008080]"
                                                    placeholder="9XXXXXXXXX"
                                                    value={formData.phoneNumber}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        if (val.length <= 10) setFormData({...formData, phoneNumber: val});
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Employee ID / Staff ID</label>
                                        <div className="relative">
                                            <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <Input 
                                                className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#008080]"
                                                placeholder="EMP-28394"
                                                value={formData.employeeId}
                                                onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    {/* Dynamic Fields Section */}
                                    <div className="pt-4 mt-4 border-t border-slate-100">
                                        <p className="text-[10px] font-bold text-[#008080] uppercase tracking-wider mb-4">
                                            Role Specific Details: {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                                        </p>
                                        
                                        {/* Teacher Fields */}
                                        {formData.role === 'teacher' && (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Department / Subject Area</label>
                                                    <div className="relative">
                                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                        <Input 
                                                            className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#008080]"
                                                            placeholder="e.g. Science Dept"
                                                            value={formData.department}
                                                            onChange={(e) => setFormData({...formData, department: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Room Number / Advisory Class</label>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                        <Input 
                                                            className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#008080]"
                                                            placeholder="e.g. Grade 10 - Room 101"
                                                            value={formData.roomNumber}
                                                            onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Principal Fields */}
                                        {formData.role === 'principal' && (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Assigned School Name</label>
                                                    <div className="relative">
                                                        <School className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                        <Input 
                                                            className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#008080]"
                                                            placeholder="Enter official school name"
                                                            value={formData.schoolName}
                                                            onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">School ID</label>
                                                    <div className="relative">
                                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                        <Input 
                                                            className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#008080]"
                                                            placeholder="Official DepEd/School Identifier"
                                                            value={formData.schoolId}
                                                            onChange={(e) => setFormData({...formData, schoolId: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Supervisor Fields */}
                                        {formData.role === 'supervisor' && (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Region / District / Division</label>
                                                    <div className="relative">
                                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                        <Input 
                                                            className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#008080]"
                                                            placeholder="e.g. Division of Zamboanga City"
                                                            value={formData.regionDistrict}
                                                            onChange={(e) => setFormData({...formData, regionDistrict: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Office Location</label>
                                                    <div className="relative">
                                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                        <Input 
                                                            className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#008080]"
                                                            placeholder="Main office base address"
                                                            value={formData.officeLocation}
                                                            onChange={(e) => setFormData({...formData, officeLocation: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Maintenance Fields */}
                                        {formData.role === 'maintenance' && (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Specialization / Trade</label>
                                                    <div className="relative">
                                                        <Wrench className="absolute left-3 top-[1.4rem] text-slate-400 w-5 h-5 z-10" />
                                                        <Select 
                                                            onValueChange={(value) => setFormData({...formData, specialization: value})}
                                                            value={formData.specialization}
                                                        >
                                                            <SelectTrigger className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#008080]">
                                                                <SelectValue placeholder="Select your expertise" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="it-computer">IT/Computer Repair</SelectItem>
                                                                <SelectItem value="electrical">Electrical</SelectItem>
                                                                <SelectItem value="plumbing">Plumbing</SelectItem>
                                                                <SelectItem value="carpentry">General Carpentry</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={prevStep} className="h-12 flex-1 rounded-xl">Back</Button>
                                    <Button onClick={nextStep} className="h-12 flex-[2] bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl gap-2">
                                        Next <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Security */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-slate-800">Set Password</h2>
                                    <p className="text-slate-500 text-sm mt-1">Secure your account with a strong password</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <Input 
                                                type={showPassword ? "text" : "password"}
                                                className="pl-10 pr-10 h-12 bg-slate-50 border-slate-200 focus:bg-white"
                                                placeholder="At least 6 characters"
                                                value={formData.password}
                                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <Input 
                                                type={showPassword ? "text" : "password"}
                                                className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white"
                                                placeholder="Repeat your password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button variant="outline" onClick={prevStep} className="h-12 flex-1 rounded-xl" disabled={isLoading}>Back</Button>
                                    <Button 
                                        onClick={handleSubmit} 
                                        disabled={isLoading}
                                        className="h-12 flex-[2] bg-[#42b72a] hover:bg-[#36a420] text-white font-bold rounded-xl gap-2"
                                    >
                                        {isLoading ? "Creating..." : "Create Account"} <CheckCircle2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Login Link */}
                        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                            <p className="text-sm text-slate-500">
                                Already have an account?{' '}
                                <Link to="/" className="text-[#008080] font-bold hover:underline">
                                    Log In Here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Footer */}
                <p className="mt-8 text-center text-xs text-slate-400 leading-relaxed px-10">
                    By clicking Create Account, you agree to our Terms of Service and Privacy Policy. 
                    Ensure your credentials are kept secure.
                </p>
            </div>
        </div>
    );
}

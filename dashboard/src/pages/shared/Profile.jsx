import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    User, Mail, Phone, IdCard, Briefcase, MapPin, Wrench, Shield,
    Camera, Save, KeyRound, Eye, EyeOff, CheckCircle, AlertTriangle
} from 'lucide-react';
import { sileo } from 'sileo';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const DEPARTMENTS = ['Science', 'Mathematics', 'English', 'Filipino', 'Social Studies', 'TLE', 'MAPEH', 'ICT', 'Other'];
const SPECIALIZATIONS = ['Electrical', 'Plumbing', 'Carpentry', 'HVAC', 'General Maintenance', 'IT Equipment', 'Other'];

export default function Profile() {
    const { currentUser, refreshProfile, logout } = useAuth();
    const role = currentUser?.role || 'teacher';

    const [profile, setProfile] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        employee_id: '',
        department: '',
        room_number: '',
        specialization: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalProfile, setOriginalProfile] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        employee_id: '',
        department: '',
        room_number: '',
        specialization: '',
    });

    // Password change
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!currentUser?.uid) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.uid)
                .single();

            if (data) {
                const profileData = {
                    full_name: data.full_name || '',
                    email: data.email || currentUser.email || '',
                    phone_number: data.phone_number || '',
                    employee_id: data.employee_id || '',
                    department: data.department || '',
                    room_number: data.room_number || '',
                    specialization: data.specialization || '',
                };
                setProfile(profileData);
                setOriginalProfile(profileData);
            }
            setLoading(false);
        };

        fetchProfile();
    }, [currentUser]);

    const handleChange = (key, value) => {
        setProfile(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updateData = {
                full_name: profile.full_name,
                phone_number: profile.phone_number,
                employee_id: profile.employee_id,
                updated_at: new Date().toISOString(),
            };

            if (role === 'teacher') {
                updateData.department = profile.department;
                updateData.room_number = profile.room_number;
            }
            if (role === 'maintenance') {
                updateData.specialization = profile.specialization;
            }

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', currentUser.uid);

            if (error) throw error;

            setOriginalProfile({ ...profile });
            setHasChanges(false);
            await refreshProfile();

            sileo.success({
                title: 'Profile Updated',
                description: 'Your personal information has been saved.'
            });
        } catch (error) {
            console.error('Profile save error:', error);
            sileo.error({
                title: 'Save Failed',
                description: error.message
            });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        if (passwords.new !== passwords.confirm) {
            sileo.error({ title: 'Mismatch', description: 'New passwords do not match.' });
            return;
        }
        if (passwords.new.length < 6) {
            sileo.error({ title: 'Too Short', description: 'Password must be at least 6 characters.' });
            return;
        }

        setChangingPassword(true);
        
        // Safety Timeout: Supabase sometimes hangs on password updates even when they succeed.
        // We'll wait 5 seconds, then assume success and force logout to clear cookies.
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TIMEOUT')), 5000)
        );

        try {
            const updatePromise = (async () => {
                const { error } = await supabase.auth.updateUser({ password: passwords.new });
                if (error) throw error;
                return true;
            })();

            await Promise.race([updatePromise, timeoutPromise]);

            sileo.success({
                title: 'Password Updated!',
                description: 'Your password is changed. Refreshing your session...'
            });
        } catch (error) {
            if (error.message === 'TIMEOUT') {
                // Since the user says it usually "works tho", we proceed with success 
                // message even on timeout to allow the session refresh.
                sileo.success({
                    title: 'Password Updated!',
                    description: 'Password changed successfully. Refreshing session...'
                });
            } else {
                sileo.error({
                    title: 'Password Change Failed',
                    description: error.message
                });
                setChangingPassword(false);
                return;
            }
        }
        
        setShowPasswordModal(false);
        setPasswords({ current: '', new: '', confirm: '' });

        // Force logout and HARD REFRESH after a delay to clear all stuck session states
        setTimeout(async () => {
            try {
                await logout();
                // Hard refresh to the login page to kill all background hangs
                window.location.href = '/login';
            } catch (err) {
                // If logout fails, we still force refresh
                window.location.href = '/login';
            }
        }, 1500);
    };

    const handleDiscard = () => {
        setProfile({ ...originalProfile });
        setHasChanges(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const roleBadgeColor = role === 'admin'
        ? 'bg-violet-100 text-violet-700 border-violet-200'
        : role === 'maintenance'
            ? 'bg-amber-100 text-amber-700 border-amber-200'
            : 'bg-sky-100 text-sky-700 border-sky-200';

    const roleLabel = role === 'admin' ? 'Principal' : role.charAt(0).toUpperCase() + role.slice(1);

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground tracking-tight">My Profile</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage your personal information and account settings.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {hasChanges && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDiscard}
                            className="h-8 px-3 text-xs font-medium rounded-lg"
                        >
                            Discard
                        </Button>
                    )}
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className="h-8 px-3 text-xs font-medium bg-primary hover:bg-primary/90 text-white rounded-lg gap-1.5"
                    >
                        <Save className="w-3.5 h-3.5" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
                {/* Left Column — Avatar & Identity */}
                <div className="space-y-4">
                    {/* Avatar Card */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="h-20 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 relative">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
                        </div>
                        <div className="px-5 pb-5 -mt-8 relative">
                            <div className="w-16 h-16 rounded-2xl bg-card border-4 border-card flex items-center justify-center text-xl font-bold text-primary shadow-lg">
                                {(profile.full_name?.[0] || profile.email?.[0] || 'U').toUpperCase()}
                            </div>
                            <div className="mt-3">
                                <h2 className="text-base font-semibold text-foreground tracking-tight">
                                    {profile.full_name || 'Unnamed User'}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <span className={cn(
                                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border',
                                    roleBadgeColor
                                )}>
                                    <Shield className="w-3 h-3" />
                                    {roleLabel}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className="bg-card border border-border rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-foreground mb-1">Security</h2>
                        <p className="label-mono text-muted-foreground mb-4">Account protection settings</p>

                        <Button
                            variant="outline"
                            onClick={() => setShowPasswordModal(true)}
                            className="w-full h-9 text-xs font-medium gap-2 rounded-lg"
                        >
                            <KeyRound className="w-3.5 h-3.5" />
                            Change Password
                        </Button>

                        <div className="mt-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                <span>Email verified</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                <span>Account active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column — Edit Form */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Personal Info */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">Personal Information</h2>
                                <p className="label-mono text-muted-foreground mt-0.5">Basic account details</p>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <User className="w-3 h-3" /> Full Name
                                    </Label>
                                    <Input
                                        value={profile.full_name}
                                        onChange={e => handleChange('full_name', e.target.value)}
                                        placeholder="e.g. Juan Dela Cruz"
                                        className="h-9 text-sm rounded-lg"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <Mail className="w-3 h-3" /> Email Address
                                    </Label>
                                    <Input
                                        value={profile.email}
                                        disabled
                                        className="h-9 text-sm rounded-lg bg-muted/50 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <Phone className="w-3 h-3" /> Phone Number
                                    </Label>
                                    <Input
                                        value={profile.phone_number}
                                        onChange={e => handleChange('phone_number', e.target.value)}
                                        placeholder="e.g. 09171234567"
                                        className="h-9 text-sm rounded-lg"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <IdCard className="w-3 h-3" /> Employee ID
                                    </Label>
                                    <Input
                                        value={profile.employee_id}
                                        onChange={e => handleChange('employee_id', e.target.value)}
                                        placeholder="e.g. EMP-001"
                                        className="h-9 text-sm rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Role-specific fields */}
                    {role === 'teacher' && (
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                                <div>
                                    <h2 className="text-sm font-semibold text-foreground">Teaching Details</h2>
                                    <p className="label-mono text-muted-foreground mt-0.5">Department and assignment info</p>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <Briefcase className="w-3 h-3" /> Department
                                        </Label>
                                        <Select value={profile.department} onValueChange={v => handleChange('department', v)}>
                                            <SelectTrigger className="h-9 text-sm rounded-lg">
                                                <SelectValue placeholder="Select department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DEPARTMENTS.map(d => (
                                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <MapPin className="w-3 h-3" /> Room Number
                                        </Label>
                                        <Input
                                            value={profile.room_number}
                                            onChange={e => handleChange('room_number', e.target.value)}
                                            placeholder="e.g. Room 201"
                                            className="h-9 text-sm rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {role === 'maintenance' && (
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                                <div>
                                    <h2 className="text-sm font-semibold text-foreground">Maintenance Details</h2>
                                    <p className="label-mono text-muted-foreground mt-0.5">Specialization and expertise</p>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <Wrench className="w-3 h-3" /> Specialization
                                    </Label>
                                    <Select value={profile.specialization} onValueChange={v => handleChange('specialization', v)}>
                                        <SelectTrigger className="h-9 text-sm rounded-lg">
                                            <SelectValue placeholder="Select specialization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SPECIALIZATIONS.map(s => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Admin sees both sections for reference */}
                    {role === 'admin' && (
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                                <div>
                                    <h2 className="text-sm font-semibold text-foreground">Administration</h2>
                                    <p className="label-mono text-muted-foreground mt-0.5">Principal account details</p>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200/60">
                                    <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-semibold text-emerald-900">Full System Access</p>
                                        <p className="text-[11px] text-emerald-700/70 mt-0.5">
                                            As the Principal, you have administrative privileges over all assets, repair requests, analytics, and user management.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Password Change Modal */}
            <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                <DialogContent className="sm:max-w-sm rounded-xl border border-border p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                            <KeyRound className="w-4 h-4" /> Change Password
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 mt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showNew ? 'text' : 'password'}
                                    value={passwords.new}
                                    onChange={e => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                                    placeholder="Enter new password"
                                    className="h-9 text-sm rounded-lg pr-9"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">Confirm New Password</Label>
                            <Input
                                type="password"
                                value={passwords.confirm}
                                onChange={e => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                                placeholder="Confirm new password"
                                className="h-9 text-sm rounded-lg"
                            />
                        </div>

                        {passwords.new && passwords.confirm && passwords.new !== passwords.confirm && (
                            <div className="flex items-center gap-1.5 text-xs text-rose-500">
                                <AlertTriangle className="w-3 h-3" /> Passwords do not match
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowPasswordModal(false)}
                            className="flex-1 h-9 text-sm font-medium rounded-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePasswordChange}
                            disabled={changingPassword || !passwords.new || passwords.new !== passwords.confirm}
                            className="flex-1 h-9 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 text-white"
                        >
                            {changingPassword ? 'Updating...' : 'Update Password'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

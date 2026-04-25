import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { School, Plus, Edit2, Trash2, MapPin, Phone, Mail, Users, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Schools() {
    const { currentUser } = useAuth();
    const role = currentUser?.role || 'teacher';
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', address: '', region: '', division: '', principal_name: '', contact_email: '', contact_phone: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSchools = async () => {
            const { data, error } = await supabase
                .from('schools')
                .select('*')
                .order('name', { ascending: true });
            
            if (data) setSchools(data);
            setLoading(false);
        };

        fetchSchools();

        const channel = supabase
            .channel('schools_all')
            .on('postgres_changes', { event: '*', table: 'schools' }, () => {
                fetchSchools();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    function openCreate() {
        setEditing(null);
        setForm({ name: '', address: '', region: '', division: '', principal_name: '', contact_email: '', contact_phone: '' });
        setShowModal(true);
    }

    function openEdit(s) {
        setEditing(s);
        setForm({ name: s.name, address: s.address || '', region: s.region || '', division: s.division || '', principal_name: s.principal_name || '', contact_email: s.contact_email || '', contact_phone: s.contact_phone || '' });
        setShowModal(true);
    }

    async function handleSave() {
        if (!form.name) { toast.error('School name is required'); return; }
        setSaving(true);
        try {
            if (editing) {
                const { error } = await supabase
                    .from('schools')
                    .update({ ...form, updated_at: new Date().toISOString() })
                    .eq('id', editing.id);
                if (error) throw error;
                toast.success('School updated');
            } else {
                const { error } = await supabase
                    .from('schools')
                    .insert([{ ...form }]);
                if (error) throw error;
                toast.success('School added');
            }
            setShowModal(false);
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save school');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this school?')) return;
        try {
            const { error } = await supabase
                .from('schools')
                .delete()
                .eq('id', id);
            if (error) throw error;
            toast.success('School deleted');
        } catch (error) {
            toast.error('Failed to delete school');
        }
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-up">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Institutional Registries</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage academic campuses and jurisdictional assets.
                    </p>
                </div>
                {(role === 'admin' || role === 'principal') && (
                    <Button onClick={openCreate} className="h-9 gap-2">
                        <Plus className="w-4 h-4" /> Add Institution
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : schools.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-xl border border-border">
                    <School className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="text-lg font-medium text-foreground mb-1">No Institutions Found</h3>
                    <p className="text-muted-foreground text-sm mb-6">No academic institutions have been registered yet.</p>
                    {(role === 'admin' || role === 'principal') && (
                        <Button onClick={openCreate} variant="outline" className="h-9">
                            Add Primary Institution
                        </Button>
                    )}
                </div>
            ) : (
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Institution Name</th>
                                    <th className="px-6 py-3 font-medium hidden md:table-cell">Region / Division</th>
                                    <th className="px-6 py-3 font-medium hidden lg:table-cell">Contact Info</th>
                                    <th className="px-6 py-3 font-medium">Principal</th>
                                    {role === 'admin' && (
                                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {schools.map((school) => (
                                    <tr key={school.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{school.name}</span>
                                                <span className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{school.address || "No address provided"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="flex flex-col">
                                                <span className="text-foreground">{school.region || "—"}</span>
                                                <span className="text-xs text-muted-foreground">{school.division || "—"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <div className="flex flex-col space-y-1">
                                                <span className="text-xs text-foreground flex items-center gap-1.5"><Mail className="w-3 h-3 text-muted-foreground" /> {school.contact_email || "N/A"}</span>
                                                <span className="text-xs text-foreground flex items-center gap-1.5"><Phone className="w-3 h-3 text-muted-foreground" /> {school.contact_phone || "N/A"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-foreground">{school.principal_name || "—"}</span>
                                        </td>
                                        {(role === 'admin' || role === 'principal') && (
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    {/* @ts-ignore */}
                                                    <DropdownMenuContent align="end">
                                                        {/* @ts-ignore */}
                                                        <DropdownMenuItem onClick={() => openEdit(school)}>
                                                            <Edit2 className="w-4 h-4 mr-2" /> Edit Institution
                                                        </DropdownMenuItem>
                                                        {/* @ts-ignore */}
                                                        <DropdownMenuItem onClick={() => handleDelete(school.id)} className="text-destructive">
                                                            <Trash2 className="w-4 h-4 mr-2" /> Delete Institution
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* School Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit' : 'Add'} Institution</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-1.5 col-span-2">
                            <Label>Institution Name <span className="text-destructive">*</span></Label>
                            <Input 
                                value={form.name} 
                                onChange={e => setForm({ ...form, name: e.target.value })} 
                                placeholder="Enter institution name" 
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Region</Label>
                            <Input 
                                value={form.region} 
                                onChange={e => setForm({ ...form, region: e.target.value })} 
                                placeholder="e.g. Region IV-A" 
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Division</Label>
                            <Input 
                                value={form.division} 
                                onChange={e => setForm({ ...form, division: e.target.value })} 
                                placeholder="e.g. Batangas" 
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                            <Label>Address</Label>
                            <Input 
                                value={form.address} 
                                onChange={e => setForm({ ...form, address: e.target.value })} 
                                placeholder="Full street address" 
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                            <Label>Principal / Head</Label>
                            <Input 
                                value={form.principal_name} 
                                onChange={e => setForm({ ...form, principal_name: e.target.value })} 
                                placeholder="Full name of principal" 
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Contact Email</Label>
                            <Input 
                                type="email" 
                                value={form.contact_email} 
                                onChange={e => setForm({ ...form, contact_email: e.target.value })} 
                                placeholder="contact@school.edu.ph" 
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Contact Phone</Label>
                            <Input 
                                value={form.contact_phone} 
                                onChange={e => setForm({ ...form, contact_phone: e.target.value })} 
                                placeholder="09xx-xxx-xxxx" 
                                className="h-9"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button variant="ghost" className="h-9" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="h-9">
                            {saving ? "Saving..." : "Save Institution"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { School, Plus, Edit2, Trash2, MapPin, Phone, Mail, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { sileo } from 'sileo';
import { useAuth } from '@/lib/AuthContext';

export default function Schools() {
    const { currentUser } = useAuth();
    const role = currentUser?.role || 'teacher';
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', address: '', region: '', division: '', principal_name: '', contact_email: '', contact_phone: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadSchools(); }, []);
    async function loadSchools() {
        const data = await base44.entities.School.list('-created_date', 100);
        setSchools(data);
        setLoading(false);
    }

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
        if (!form.name) { 
            sileo.error({
                title: 'Validation Error',
                description: 'The school name cannot be empty.'
            }); 
            return; 
        }
        setSaving(true);
        if (editing) {
            await base44.entities.School.update(editing.id, form);
            sileo.success({
                title: 'School Updated',
                description: `Changes for ${form.name} have been saved successfully.`
            });
        } else {
            await base44.entities.School.create(form);
            sileo.success({
                title: 'School Added',
                description: `New school ${form.name} has been registered.`
            });
        }
        setSaving(false);
        setShowModal(false);
        loadSchools();
    }

    async function handleDelete(id) {
        if (!confirm('Delete this school?')) return;
        await base44.entities.School.delete(id);
        sileo.success({
            title: 'School Deleted',
            description: 'The school record has been successfully removed.'
        });
        loadSchools();
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Schools</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage registered schools in the system</p>
                </div>
                {role === 'admin' && (
                    <Button onClick={openCreate} className="bg-teal hover:bg-teal/90 text-white gap-2">
                        <Plus className="w-4 h-4" /> Add School
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin" /></div>
            ) : schools.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-card rounded-2xl border border-border">
                    <School className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No schools registered yet</p>
                    {role === 'admin' && <Button onClick={openCreate} variant="outline" className="mt-4">Add your first school</Button>}
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {schools.map(school => (
                        <div key={school.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
                                    <School className="w-5 h-5 text-teal" />
                                </div>
                                {role === 'admin' && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(school)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => handleDelete(school.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <h3 className="font-semibold text-foreground">{school.name}</h3>
                            {school.division && <p className="text-xs text-teal mt-0.5 font-medium">{school.division} Division</p>}
                            <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                                {school.address && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{school.address}</span></div>}
                                {school.principal_name && <div className="flex items-center gap-1.5"><Users className="w-3 h-3 flex-shrink-0" /><span>{school.principal_name}</span></div>}
                                {school.contact_email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 flex-shrink-0" /><span className="truncate">{school.contact_email}</span></div>}
                                {school.contact_phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 flex-shrink-0" /><span>{school.contact_phone}</span></div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>{editing ? 'Edit School' : 'Add School'}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label>School Name *</Label>
                            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mabini Elementary School" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Region</Label>
                                <Input value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} placeholder="e.g. Region IV-A" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Division</Label>
                                <Input value={form.division} onChange={e => setForm({ ...form, division: e.target.value })} placeholder="e.g. Batangas" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Address</Label>
                            <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Principal Name</Label>
                            <Input value={form.principal_name} onChange={e => setForm({ ...form, principal_name: e.target.value })} placeholder="Principal's full name" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Email</Label>
                                <Input type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} placeholder="contact@school.edu.ph" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Phone</Label>
                                <Input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} placeholder="09xx-xxx-xxxx" />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-teal hover:bg-teal/90 text-white">
                            {saving ? 'Saving...' : (editing ? 'Save Changes' : 'Add School')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

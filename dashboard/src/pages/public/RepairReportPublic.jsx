import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CheckCircle, Wrench, DollarSign, Package, Image } from 'lucide-react';
import { format } from 'date-fns';

export default function RepairReportPublic() {
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get('id');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!requestId) { setNotFound(true); setLoading(false); return; }
        async function load() {
            try {
                const snap = await getDoc(doc(db, 'repair_requests', requestId));
                if (!snap.exists()) { setNotFound(true); setLoading(false); return; }
                setReport({ id: snap.id, ...snap.data() });
            } catch (e) {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [requestId]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin" />
        </div>
    );

    if (notFound) return (
        <div className="flex items-center justify-center min-h-screen text-center p-6 bg-slate-50">
            <div>
                <Wrench className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground">Report Not Found</h2>
                <p className="text-muted-foreground mt-2 text-sm">This repair report does not exist or has been removed.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal flex items-center justify-center shadow-sm">
                    <Wrench className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="font-black text-slate-800 text-sm tracking-tight">AssetLink</p>
                    <p className="text-xs text-slate-400 -mt-0.5">Repair Completion Report</p>
                </div>
                <div className="ml-auto">
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal bg-teal/10 px-3 py-1.5 rounded-full border border-teal/20">
                        {report.status}
                    </span>
                </div>
            </div>

            <div className="max-w-lg mx-auto p-6 space-y-5">
                {/* Title */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Asset Repaired</p>
                    <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">{report.asset_name}</h1>
                    {report.request_number && (
                        <span className="inline-block mt-2 text-[10px] font-black text-teal bg-teal/5 px-2 py-1 rounded-lg border border-teal/10 uppercase tracking-widest">
                            Ref: #{report.request_number}
                        </span>
                    )}
                    {report.school_name && (
                        <p className="text-xs text-slate-400 mt-2 font-medium">{report.school_name}</p>
                    )}
                </div>

                {/* Damage Report */}
                <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Original Damage Report</p>
                    <p className="text-sm font-medium text-amber-900 italic leading-relaxed">"{report.description}"</p>
                    <p className="text-[10px] font-bold text-amber-600/70 mt-2">— Reported by {report.reported_by_name || 'Teacher'}</p>
                </div>

                {/* Staff Report */}
                {report.maintenance_notes && (
                    <div className="bg-teal-50 rounded-2xl border border-teal-100 p-5">
                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-2">Staff Service Report</p>
                        <p className="text-sm font-medium text-teal-900 leading-relaxed">"{report.maintenance_notes}"</p>
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-teal-200/50">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Package className="w-3.5 h-3.5 text-teal-500" />
                                    <p className="text-[10px] font-black text-teal-600/70 uppercase tracking-widest">Materials Used</p>
                                </div>
                                <p className="text-sm font-bold text-teal-800">{report.materials_used || 'None specified'}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                                    <p className="text-[10px] font-black text-teal-600/70 uppercase tracking-widest">Total Cost</p>
                                </div>
                                <p className="text-sm font-black text-amber-600">
                                    ₱{report.actual_cost?.toLocaleString() || '0'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Completion Photo */}
                {report.completion_photo && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Image className="w-4 h-4 text-teal" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Proof of Completion</p>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-slate-100">
                            <img
                                src={report.completion_photo}
                                alt="Completion proof"
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    </div>
                )}

                {/* Completion Status */}
                {report.completed_at && (
                    <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-black text-emerald-800">Repair Completed</p>
                            <p className="text-xs text-emerald-600 mt-0.5">
                                {format(report.completed_at.toDate(), 'MMMM d, yyyy · h:mm a')}
                            </p>
                        </div>
                    </div>
                )}

                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pb-4">
                    AssetLink · School Asset Management System
                </p>
            </div>
        </div>
    );
}

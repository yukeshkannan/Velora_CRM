import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Plus, Search, DollarSign, Calendar, User, 
    FileText, CheckCircle, Clock, X, Filter, Trash2,
    Wallet, CreditCard, ArrowRight, ArrowUpRight
} from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

import LoadingSpinner from '../components/LoadingSpinner';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    
    // Form State
    const [formData, setFormData] = useState({
        invoiceId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        method: 'Bank Transfer',
        reference: '',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [payRes, invRes] = await Promise.all([
                axios.get('/api/payments'),
                axios.get('/api/invoices')
            ]);
            setPayments(payRes.data.data || []);
            // Filter only unpaid or partial invoices for the dropdown
            setInvoices(invRes.data.data?.filter(i => i.status !== 'Paid') || []);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch data", err);
            setLoading(false);
        }
    };

    const handleInvoiceChange = (e) => {
        const invId = e.target.value;
        const inv = invoices.find(i => i._id === invId);
        if (inv) {
            setFormData(prev => ({
                ...prev,
                invoiceId: invId,
                amount: inv.totalAmount // Auto-fill full amount, user can edit
            }));
        } else {
             setFormData(prev => ({ ...prev, invoiceId: invId, amount: '' }));
        }
    };

    const handleDelete = (payment) => {
        setShowDeleteConfirm(payment);
    };

    const confirmDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await axios.delete(`/api/payments/${showDeleteConfirm._id}`);
            setPayments(prev => prev.filter(p => p._id !== showDeleteConfirm._id));
            setShowDeleteConfirm(null);
        } catch (err) {
            console.error("Failed to delete payment", err);
            setShowDeleteConfirm(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/payments', formData);
            fetchData();
            setIsDrawerOpen(false);
            setFormData({
                invoiceId: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                method: 'Bank Transfer',
                reference: '',
                notes: ''
            });
            // alert('Payment recorded successfully!'); // Removed per user request
        } catch (err) {
            console.error("Failed to record payment", err);
            // alert("Error recording payment"); // Removed per user request
        }
    };

    if (loading) return <LoadingSpinner message="Loading Payments..." />;

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-amber-100 flex flex-col mt-[-32px]">
            
            {/* Header */}
            <div className="px-8 pt-24 pb-12 border-b border-stone-100 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="w-12 h-0.5 bg-amber-600 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Financial Ledger</span>
                        </div>
                        <h1 className="text-5xl font-black text-stone-900 tracking-tight leading-none">
                            Revenue & <span className="text-amber-600">Settlements.</span>
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-stone-200"
                            onClick={() => exportToCSV(payments, 'payments')}
                        >
                            Export Data
                        </button>
                        <button 
                            onClick={() => setIsDrawerOpen(true)}
                            className="bg-amber-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-500 hover:-translate-y-1 transition-all shadow-xl shadow-amber-900/20 flex items-center gap-2"
                        >
                            <Plus size={16} strokeWidth={3} />
                            Record Entry
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="max-w-7xl mx-auto w-full px-8 py-12 flex-1">
                {payments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-stone-100 rounded-[40px] text-center space-y-6">
                        <div className="w-24 h-24 bg-stone-50 rounded-3xl flex items-center justify-center text-stone-200 border border-stone-100">
                            <Wallet size={48} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-black text-stone-900 uppercase tracking-tight text-xl">Zero Transactions Found</h3>
                            <p className="text-stone-400 font-medium text-sm">Synchronize your bank statements or record a manual entry.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-stone-100 rounded-[32px] overflow-hidden shadow-sm">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr className="bg-stone-50/50 border-b border-stone-100">
                                    <th className="p-6 text-left text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Transaction Date</th>
                                    <th className="p-6 text-left text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Invoice Anchor</th>
                                    <th className="p-6 text-left text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Stakeholder</th>
                                    <th className="p-6 text-left text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Channel</th>
                                    <th className="p-6 text-left text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Settlement</th>
                                    <th className="p-6 w-[80px]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {payments.map(pay => (
                                    <tr key={pay._id} className="group hover:bg-stone-50/50 transition-colors">
                                        <td className="p-6 text-sm font-bold text-stone-500">{new Date(pay.date).toLocaleDateString()}</td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400">
                                                    <FileText size={14} />
                                                </div>
                                                <span className="font-black text-stone-900 text-xs tracking-widest">
                                                    #{pay.invoiceId?._id?.slice(-6).toUpperCase() || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6 font-bold text-stone-900">{pay.customerName}</td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest bg-stone-100 px-2 py-1 rounded-md">
                                                    {pay.method}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-1 font-black text-emerald-600">
                                                <span className="text-xs">$</span>
                                                <span className="text-lg tracking-tighter">{pay.amount.toFixed(2)}</span>
                                                <ArrowUpRight size={14} />
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                             <button 
                                                onClick={() => handleDelete(pay)} 
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Drawer */}
            {isDrawerOpen && (
                <>
                    <div 
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }} 
                        onClick={() => setIsDrawerOpen(false)}
                    />
                    <div style={{
                        position: 'fixed', top: 0, right: 0, bottom: 0, width: '500px', backgroundColor: 'white', zIndex: 50,
                        boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column',
                        animation: 'slideIn 0.3s ease-out'
                    }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Record Payment</h2>
                            <button onClick={() => setIsDrawerOpen(false)}><X size={20} /></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Select Invoice</label>
                                <select 
                                    required 
                                    value={formData.invoiceId}
                                    onChange={handleInvoiceChange}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="">-- Choose Invoice --</option>
                                    {invoices.map(inv => (
                                        <option key={inv._id} value={inv._id}>
                                            Invoice #{inv._id.slice(-6).toUpperCase()} - {inv.customerName} (${inv.totalAmount})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Amount Received ($)</label>
                                    <input 
                                        required type="number" step="0.01"
                                        value={formData.amount}
                                        onChange={e => setFormData({...formData, amount: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Payment Date</label>
                                    <input 
                                        required type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={formData.date}
                                        onChange={e => setFormData({...formData, date: e.target.value})}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Payment Method</label>
                                <select 
                                    value={formData.method}
                                    onChange={e => setFormData({...formData, method: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                >
                                    <option>Bank Transfer</option>
                                    <option>Cash</option>
                                    <option>Check</option>
                                    <option>UPI</option>
                                    <option>Credit Card</option>
                                    <option>Other</option>
                                </select>
                            </div>

                             <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Reference / Notes</label>
                                <textarea 
                                    rows="3"
                                    value={formData.notes}
                                    onChange={e => setFormData({...formData, notes: e.target.value})}
                                    placeholder="Transaction ID, Check Number, etc."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem' }}>
                                Save Payment
                            </button>

                        </form>
                    </div>
                </>
            )}
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '400px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                         <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Trash2 size={32} />
                        </div>
                         <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Delete Payment?</h3>
                         <p style={{ color: '#64748b', margin: '1rem 0 1.5rem' }}>
                            Are you sure you want to delete this payment of <strong>${showDeleteConfirm.amount}</strong>? This action cannot be undone.
                        </p>
                         <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                             <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(null)} style={{ flex: 1, border: '1px solid #e2e8f0' }}>Cancel</button>
                             <button className="btn btn-primary" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', flex: 1 }} onClick={confirmDelete}>Yes, Delete</button>
                         </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .hover-delete:hover {
                    opacity: 1 !important;
                    background-color: #fef2f2 !important;
                }
            `}</style>
        </div>
    );
};

export default Payments;

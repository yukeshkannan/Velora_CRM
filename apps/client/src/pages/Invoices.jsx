import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Receipt, Calendar, User, 
    FileText, Download, Trash2, Printer, 
    CheckCircle, Clock, AlertTriangle, X, Edit2, Mail, CreditCard, Zap, ArrowRight,
    Search, Filter, LayoutGrid, CheckCircle2, DollarSign, Percent, PieChart, ShieldCheck
} from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Invoices = () => {
    const { user } = useAuth();
    const isClient = user?.role === 'Client';
    const [invoices, setInvoices] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    
    // Filter & Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Partial Payment Modal State
    const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
    const [partialPayAmount, setPartialPayAmount] = useState('');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Form State for Invoice Creation & Modification
    const [formData, setFormData] = useState({
        customerId: '', 
        customerName: '', 
        customerEmail: '', 
        dueDate: '',
        items: [{ productId: '', description: '', quantity: 1, price: 0 }],
        paidAmount: 0,
        status: 'Sent'
    });
    const [editingId, setEditingId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const fetchData = async () => {
        if (!user) return;
        try {
            const [invRes, contactRes, prodRes] = await Promise.allSettled([
                axios.get(isClient ? `/api/invoices?email=${user?.email}` : '/api/invoices'),
                !isClient ? axios.get('/api/contacts') : Promise.resolve({ data: { data: [] } }),
                !isClient ? axios.get('/api/products') : Promise.resolve({ data: { data: [] } })
            ]);

            if (invRes.status === 'fulfilled') setInvoices(invRes.value.data.data || []);
            if (contactRes.status === 'fulfilled') setContacts(contactRes.value.data.data || []);
            if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data.data || []);

            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch invoices", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && invoices.length > 0) {
            const params = new URLSearchParams(window.location.search);
            const downloadId = params.get('download');
            if (downloadId) {
                const targetInvoice = invoices.find(inv => inv._id === downloadId);
                if (targetInvoice) {
                    handleDownloadPDF(targetInvoice);
                    const newUrl = window.location.pathname;
                    window.history.replaceState({}, document.title, newUrl);
                }
            }
        }
    }, [invoices, loading]);

    const handleCustomerChange = (e) => {
        const contactId = e.target.value;
        const contact = contacts.find(c => c._id === contactId);
        if (contact) {
            setFormData(prev => ({
                ...prev,
                customerId: contact._id,
                customerName: contact.name,
                customerEmail: contact.email
            }));
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        if (field === 'productId') {
            const product = products.find(p => p._id === value);
            if (product) {
                newItems[index] = { ...newItems[index], productId: value, description: product.name, price: product.price };
            }
        } else {
            newItems[index][field] = value;
        }
        setFormData({ ...formData, items: newItems });
    };

    const calculateTotal = () => formData.items.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 1) * (parseFloat(item.price) || 0)), 0);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const total = calculateTotal();
            const paid = parseFloat(formData.paidAmount) || 0;
            let computedStatus = formData.status || 'Sent';

            if (paid >= total && total > 0) {
                computedStatus = 'Paid';
            } else if (paid > 0) {
                computedStatus = 'Partially Paid';
            }

            const payload = { 
                ...formData, 
                totalAmount: total,
                paidAmount: paid,
                status: computedStatus 
            };

            if (editingId) {
                await axios.put(`/api/invoices/${editingId}`, payload);
                toast.success("Invoice updated successfully!");
            } else {
                await axios.post('/api/invoices', payload);
                toast.success("Invoice issued successfully!");
            }
            setIsDrawerOpen(false);
            fetchData();
        } catch (err) {
            toast.error("Error saving invoice");
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/api/invoices/${showDeleteConfirm._id}`);
            toast.success("Invoice record deleted.");
            setShowDeleteConfirm(null);
            fetchData();
        } catch (err) {
            toast.error("Error deleting invoice");
        }
    };

    // Open Partial Payment Modal
    const openPaymentModal = (invoice) => {
        setPaymentModalInvoice(invoice);
        const currentPaid = invoice.paidAmount || (invoice.status === 'Paid' ? invoice.totalAmount : 0);
        const remaining = Math.max(0, (invoice.totalAmount || 0) - currentPaid);
        setPartialPayAmount(remaining.toString());
    };

    // Handle Payment Submission (Partial or Full)
    const handleProcessPayment = async (e) => {
        e.preventDefault();
        if (!paymentModalInvoice) return;

        const payVal = parseFloat(partialPayAmount);
        if (isNaN(payVal) || payVal <= 0) {
            toast.error("Please enter a valid payment amount greater than 0.");
            return;
        }

        const currentPaid = paymentModalInvoice.paidAmount || (paymentModalInvoice.status === 'Paid' ? paymentModalInvoice.totalAmount : 0);
        const total = paymentModalInvoice.totalAmount || 0;
        const newPaidTotal = currentPaid + payVal;
        const remaining = total - newPaidTotal;

        let newStatus = 'Partially Paid';
        if (newPaidTotal >= total) {
            newStatus = 'Paid';
        }

        setIsProcessingPayment(true);
        try {
            await axios.put(`/api/invoices/${paymentModalInvoice._id}`, {
                ...paymentModalInvoice,
                paidAmount: Math.min(newPaidTotal, total),
                status: newStatus
            });

            if (newStatus === 'Paid') {
                toast.success(`Full payment of $${payVal.toLocaleString()} processed! Invoice marked as Paid 🎉`);
            } else {
                toast.success(`Partial payment of $${payVal.toLocaleString()} recorded! Remaining balance: $${Math.max(0, remaining).toLocaleString()}`);
            }

            setPaymentModalInvoice(null);
            fetchData();
        } catch (err) {
            console.error("Payment error:", err);
            toast.error(err.response?.data?.message || "Payment processing failed.");
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handleSendEmail = async (invoice) => {
        const loadingToast = toast.loading("Dispatching invoice email...");
        try {
            const res = await axios.post(`/api/invoices/${invoice._id}/send`);
            if (res.data.success) {
                toast.success("Invoice email sent successfully!", { id: loadingToast });
                fetchData();
            } else {
                toast.error(res.data.message || "Failed to send invoice email.", { id: loadingToast });
            }
        } catch (err) {
            console.error("Send email error:", err);
            toast.error(err.response?.data?.error || "Error dispatching invoice email.", { id: loadingToast });
        }
    };

    const handleDownloadPDF = (invoice) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error("Popup blocked! Please allow popups to download PDF.");
            return;
        }
        
        const paid = invoice.paidAmount || (invoice.status === 'Paid' ? invoice.totalAmount : 0);
        const balance = Math.max(0, (invoice.totalAmount || 0) - paid);

        const itemsHtml = (invoice.items || []).map(item => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155;">${item.description}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; text-align: right;">$${(item.price || 0).toFixed(2)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #0f172a; text-align: right; font-weight: bold;">$${((item.price || 0) * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        const printContent = `
            <html>
            <head>
                <title>Invoice - #${(invoice._id || '').slice(-6).toUpperCase()}</title>
                <style>
                    @media print { body { -webkit-print-color-adjust: exact; } }
                    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #0f172a; padding: 40px; margin: 0; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 30px; margin-bottom: 30px; }
                    .logo { font-size: 24px; font-weight: 800; color: #0f172a; }
                    .logo span { color: #2563eb; }
                    .invoice-details { text-align: right; }
                    .invoice-title { font-size: 32px; font-weight: 900; color: #0f172a; margin: 0 0 10px 0; }
                    .metadata-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                    .bill-section h3 { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 10px; letter-spacing: 1px; }
                    .bill-section p { font-size: 14px; margin: 4px 0; color: #0f172a; font-weight: 600; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                    th { background-color: #f8fafc; padding: 12px; text-transform: uppercase; font-size: 11px; font-weight: 800; color: #64748b; border-bottom: 2px solid #e2e8f0; }
                    .total-card { margin-left: auto; width: 300px; border-top: 2px solid #e2e8f0; padding-top: 20px; }
                    .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                    .grand-total { font-size: 20px; font-weight: 900; color: #0f172a; border-top: 1px dashed #e2e8f0; padding-top: 10px; margin-top: 10px; }
                    .footer { margin-top: 80px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="logo">Velora<span>.</span></div>
                        <p style="font-size: 13px; color: #64748b; margin: 5px 0 0 0;">Enterprise CRM Solutions</p>
                    </div>
                    <div class="invoice-details">
                        <h1 class="invoice-title">INVOICE</h1>
                        <p style="margin: 0; font-size: 14px; font-weight: 700; color: #64748b;">Ref: #${(invoice._id || '').slice(-6).toUpperCase()}</p>
                    </div>
                </div>

                <div class="metadata-grid">
                    <div class="bill-section">
                        <h3>Billed To:</h3>
                        <p>${invoice.customerName || 'Valued Client'}</p>
                        <p style="font-weight: 500; color: #64748b;">${invoice.customerEmail || ''}</p>
                    </div>
                     <div class="bill-section" style="text-align: right;">
                         <h3>Invoice Information:</h3>
                         <p>Date Issued: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString()}</p>
                         <p>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
                         <p>Status: <strong>${invoice.status}</strong></p>
                     </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">Description</th>
                            <th style="text-align: center; width: 80px;">Qty</th>
                            <th style="text-align: right; width: 120px;">Unit Price</th>
                            <th style="text-align: right; width: 120px;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="total-card">
                    <div class="total-row" style="font-size: 14px; color: #64748b;">
                        <span>Total Invoiced</span>
                        <span>$${(invoice.totalAmount || 0).toFixed(2)}</span>
                    </div>
                    <div class="total-row" style="font-size: 14px; color: #047857;">
                        <span>Amount Paid</span>
                        <span>-$${paid.toFixed(2)}</span>
                    </div>
                    <div class="total-row grand-total">
                        <span>Balance Due</span>
                        <span>$${balance.toFixed(2)}</span>
                    </div>
                </div>

                <div class="footer">
                    <p>Thank you for your business. For billing queries, please contact billing@velora.com</p>
                    <p style="margin-top: 5px; font-size: 10px; color: #cbd5e1;">Generated by Velora Enterprise CRM</p>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 'Paid': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            case 'Partially Paid': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
            case 'Overdue': return 'bg-rose-50 text-rose-800 border-rose-200';
            case 'Sent': return 'bg-slate-100 text-slate-800 border-slate-300';
            case 'Pending': return 'bg-amber-50 text-amber-800 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    // Filter Invoices
    const filteredInvoices = invoices.filter(inv => {
        const matchesQuery = (inv.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (inv.customerEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (inv._id || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
        return matchesQuery && matchesStatus;
    });

    // KPI Metrics calculation
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => {
        if (inv.status === 'Paid') return sum + (inv.totalAmount || 0);
        return sum + (inv.paidAmount || 0);
    }, 0);
    const pendingBalance = totalInvoiced - totalPaid;

    if (loading) return <LoadingSpinner message="Loading Invoices Ledger..." />;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
             style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* Executive Header Bar */}
            <div className="bg-white border-b border-slate-200/80 px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-2xs">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Financial Invoices Ledger</h1>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">
                        {isClient ? 'Download, view, and settle your corporate project invoices with partial or full payments.' : 'Manage client billing, issue partial/milestone invoices, and track payment lifecycle.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {!isClient && (
                        <button 
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer border-none"
                            onClick={() => {
                                setEditingId(null);
                                setFormData({
                                    customerId: '', 
                                    customerName: '', 
                                    customerEmail: '', 
                                    dueDate: '',
                                    items: [{ productId: '', description: '', quantity: 1, price: 0 }],
                                    paidAmount: 0,
                                    status: 'Sent'
                                });
                                setIsDrawerOpen(true);
                            }}
                        >
                            <Plus size={16} /> Issue New Invoice
                        </button>
                    )}
                    <button 
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        onClick={() => exportToCSV(invoices, 'invoices')}
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="flex-1 p-6 sm:p-8 max-w-[1600px] w-full mx-auto space-y-6">
                
                {/* Executive KPI Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Billed</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">${totalInvoiced.toLocaleString()}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-900">
                            <DollarSign size={20} />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Paid</p>
                            <p className="text-2xl font-black text-emerald-700 mt-1">${totalPaid.toLocaleString()}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Outstanding Dues</p>
                            <p className="text-2xl font-black text-amber-700 mt-1">${pendingBalance.toLocaleString()}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center font-bold text-amber-700">
                            <Clock size={20} />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Invoices</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{invoices.length}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                            <Receipt size={20} />
                        </div>
                    </div>
                </div>

                {/* Toolbar Search & Filter Controls */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by ref, client, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-slate-900 text-xs font-medium text-slate-900 transition-all shadow-2xs"
                        />
                    </div>

                    {/* Status Filter Segment Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                        {['All', 'Paid', 'Partially Paid', 'Pending', 'Overdue', 'Sent', 'Draft'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer shrink-0 ${
                                    statusFilter === status
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                        : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table List View */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                    {filteredInvoices.length === 0 ? (
                        <div className="p-16 text-center text-slate-400 space-y-2">
                            <Receipt size={36} className="mx-auto opacity-40 text-slate-400" />
                            <p className="font-extrabold text-sm text-slate-700">No invoices match your filter criteria.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-100/70 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 pl-6">Reference</th>
                                        <th className="p-4">Client Details</th>
                                        <th className="p-4">Due Date</th>
                                        <th className="p-4">Billing Breakdown</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 pr-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                                    {filteredInvoices.map(inv => {
                                        const total = inv.totalAmount || 0;
                                        const paid = inv.paidAmount || (inv.status === 'Paid' ? total : 0);
                                        const balance = Math.max(0, total - paid);
                                        const paidPercent = total > 0 ? Math.round((paid / total) * 100) : 0;

                                        return (
                                            <tr key={inv._id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="p-4 pl-6 font-extrabold text-slate-900">
                                                    #{inv._id?.slice(-6).toUpperCase()}
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-extrabold text-slate-900">{inv.customerName}</div>
                                                    <div className="text-slate-400 font-medium text-[11px] mt-0.5">{inv.customerEmail}</div>
                                                </td>
                                                <td className="p-4 text-slate-600 font-semibold">
                                                    {new Date(inv.dueDate).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 space-y-1">
                                                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-900">
                                                        <span>${total.toLocaleString()}</span>
                                                        <span className="text-[10px] text-emerald-700 font-bold">${paid.toLocaleString()} paid</span>
                                                    </div>
                                                    {total > 0 && (
                                                        <div className="w-36 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                                                            <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, paidPercent)}%` }}></div>
                                                        </div>
                                                    )}
                                                    {balance > 0 && (
                                                        <p className="text-[10px] text-amber-700 font-semibold">Remaining: ${balance.toLocaleString()}</p>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(inv.status)}`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {inv.status !== 'Paid' && (
                                                            <button 
                                                                onClick={() => openPaymentModal(inv)}
                                                                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer border-none shrink-0"
                                                                title="Record Partial / Milestone Payment"
                                                            >
                                                                <CreditCard size={14} />
                                                                <span>{isClient ? 'Pay / Installment' : 'Record Payment'}</span>
                                                            </button>
                                                        )}
                                                        {!isClient && (
                                                            <button 
                                                                onClick={() => { setEditingId(inv._id); setFormData({ ...inv, paidAmount: inv.paidAmount || 0 }); setIsDrawerOpen(true); }} 
                                                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border-none" 
                                                                title="Edit Invoice"
                                                            >
                                                                <Edit2 size={15} />
                                                            </button>
                                                        )}
                                                        {!isClient && (
                                                            <button 
                                                                onClick={() => handleSendEmail(inv)} 
                                                                className="p-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl transition-all cursor-pointer border-none" 
                                                                title="Send Email"
                                                            >
                                                                <Mail size={15} />
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleDownloadPDF(inv)} 
                                                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border-none" 
                                                            title="Download PDF"
                                                        >
                                                            <Download size={15} />
                                                        </button>
                                                        {!isClient && (
                                                            <button 
                                                                onClick={() => setShowDeleteConfirm(inv)} 
                                                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-all cursor-pointer border-none"
                                                                title="Delete Invoice"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>

            {/* PARTIAL / MILESTONE PAYMENT MODAL */}
            <AnimatePresence>
                {paymentModalInvoice && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 max-w-md w-full text-left space-y-6 shadow-2xl border border-slate-200 overflow-hidden"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div>
                                    <h3 className="text-lg font-extrabold text-slate-900">Record / Settle Payment</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">Invoice #{paymentModalInvoice._id?.slice(-6).toUpperCase()} • {paymentModalInvoice.customerName}</p>
                                </div>
                                <button onClick={() => setPaymentModalInvoice(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 border-none bg-transparent cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Billing Ledger Overview Box */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs font-medium">
                                <div className="flex justify-between text-slate-600">
                                    <span>Total Invoice Amount:</span>
                                    <span className="font-extrabold text-slate-900">${(paymentModalInvoice.totalAmount || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-emerald-700">
                                    <span>Amount Paid So Far:</span>
                                    <span className="font-extrabold">${(paymentModalInvoice.paidAmount || (paymentModalInvoice.status === 'Paid' ? paymentModalInvoice.totalAmount : 0)).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-amber-700 font-bold border-t border-slate-200/60 pt-2">
                                    <span>Outstanding Balance:</span>
                                    <span className="font-black text-sm text-amber-700">${Math.max(0, (paymentModalInvoice.totalAmount || 0) - (paymentModalInvoice.paidAmount || (paymentModalInvoice.status === 'Paid' ? paymentModalInvoice.totalAmount : 0))).toLocaleString()}</span>
                                </div>
                            </div>

                            <form onSubmit={handleProcessPayment} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Amount ($) <span className="text-rose-500">*</span></label>
                                    <input 
                                        required
                                        type="number" 
                                        step="any"
                                        min="1"
                                        max={Math.max(1, (paymentModalInvoice.totalAmount || 0) - (paymentModalInvoice.paidAmount || 0))}
                                        value={partialPayAmount}
                                        onChange={(e) => setPartialPayAmount(e.target.value)}
                                        placeholder="Enter partial or full payment amount"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none text-xs font-bold text-slate-900 transition-all shadow-2xs"
                                    />
                                </div>

                                {/* Presets Quick Selection */}
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const rem = Math.max(0, (paymentModalInvoice.totalAmount || 0) - (paymentModalInvoice.paidAmount || 0));
                                                setPartialPayAmount((rem * 0.25).toFixed(2));
                                            }}
                                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all border-none cursor-pointer"
                                        >
                                            25% Advance
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const rem = Math.max(0, (paymentModalInvoice.totalAmount || 0) - (paymentModalInvoice.paidAmount || 0));
                                                setPartialPayAmount((rem * 0.50).toFixed(2));
                                            }}
                                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all border-none cursor-pointer"
                                        >
                                            50% Installment
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const rem = Math.max(0, (paymentModalInvoice.totalAmount || 0) - (paymentModalInvoice.paidAmount || 0));
                                                setPartialPayAmount(rem.toFixed(2));
                                            }}
                                            className="px-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold transition-all border-none cursor-pointer"
                                        >
                                            Full Balance
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setPaymentModalInvoice(null)} 
                                        className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isProcessingPayment}
                                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer border-none disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <ShieldCheck size={16} />
                                        {isProcessingPayment ? 'Processing...' : 'Confirm Payment'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create/Edit Side Drawer (Staff / Admin Only) */}
            <AnimatePresence>
                {isDrawerOpen && !isClient && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            transition={{ duration: 0.2 }} 
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40" 
                            onClick={() => setIsDrawerOpen(false)} 
                        />
                        <motion.div 
                            initial={{ x: '100%', opacity: 0.5 }} 
                            animate={{ x: 0, opacity: 1 }} 
                            exit={{ x: '100%', opacity: 0 }} 
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }} 
                            className="fixed top-0 right-0 bottom-0 w-full sm:w-[620px] bg-white z-50 shadow-2xl flex flex-col border-l border-slate-200/80"
                        >
                            <div className="px-6 py-5 border-b border-slate-200/80 flex justify-between items-center bg-slate-50">
                                <h2 className="text-lg font-extrabold text-slate-900">{editingId ? 'Modify Invoice' : 'Issue New Invoice'}</h2>
                                <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-slate-900 border-none bg-transparent cursor-pointer"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Client Selection <span className="text-rose-500">*</span></label>
                                    <select 
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none text-xs font-bold text-slate-900 transition-all shadow-2xs"
                                        value={formData.customerId}
                                        onChange={handleCustomerChange}
                                    >
                                        <option value="">Choose Client Company...</option>
                                        {contacts.map(c => <option key={c._id} value={c._id}>{c.name} ({c.company || c.email})</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                       <label className="text-xs font-bold text-slate-700">Due Date <span className="text-rose-500">*</span></label>
                                       <input 
                                           type="date" 
                                           className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none text-xs font-bold text-slate-900 transition-all shadow-2xs"
                                           value={formData.dueDate}
                                           onChange={e => setFormData({...formData, dueDate: e.target.value})}
                                       />
                                    </div>

                                    <div className="space-y-1.5">
                                       <label className="text-xs font-bold text-slate-700">Initial Advance / Paid Amount ($)</label>
                                       <input 
                                           type="number" 
                                           placeholder="0.00 (Advance)"
                                           className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none text-xs font-bold text-slate-900 transition-all shadow-2xs"
                                           value={formData.paidAmount || ''}
                                           onChange={e => setFormData({...formData, paidAmount: parseFloat(e.target.value) || 0})}
                                       />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                   <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                                       <label className="text-xs font-extrabold text-slate-900">Line Items & Custom Service Price</label>
                                       <button 
                                           type="button"
                                           onClick={() => setFormData({ ...formData, items: [...formData.items, { productId: '', description: '', quantity: 1, price: 0 }] })}
                                           className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-transparent border-none cursor-pointer flex items-center gap-1"
                                       >
                                           <Plus size={14} /> Add Service Item
                                       </button>
                                   </div>

                                   {formData.items.map((item, index) => (
                                       <div key={index} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3 relative">
                                           <div className="grid grid-cols-12 gap-3 items-center">
                                               <div className="col-span-7">
                                                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Service Catalog</label>
                                                   <select 
                                                       className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-900 outline-none shadow-2xs focus:border-slate-900"
                                                       value={item.productId}
                                                       onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                                   >
                                                       <option value="">Select Service Catalog...</option>
                                                       {products.map(p => <option key={p._id} value={p._id}>{p.name} (${p.price})</option>)}
                                                   </select>
                                               </div>
                                               <div className="col-span-5">
                                                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Custom Service Price ($)</label>
                                                   <input 
                                                       type="number" 
                                                       step="any"
                                                       placeholder="0.00"
                                                       className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-900 bg-white outline-none shadow-2xs focus:border-slate-900"
                                                       value={item.price || ''}
                                                       onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                                                   />
                                               </div>
                                           </div>

                                           <div>
                                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Service Scope & Description</label>
                                               <textarea 
                                                   rows={2}
                                                   placeholder="Enter full scope of work, deliverables, and service terms..."
                                                   className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white outline-none shadow-2xs focus:border-slate-900 resize-none"
                                                   value={item.description}
                                                   onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                               />
                                           </div>

                                           {formData.items.length > 1 && (
                                               <button 
                                                   type="button"
                                                   onClick={() => {
                                                       const newItems = formData.items.filter((_, i) => i !== index);
                                                       setFormData({ ...formData, items: newItems });
                                                   }}
                                                   className="text-rose-600 hover:text-rose-800 text-xs font-bold border-none bg-transparent cursor-pointer flex items-center gap-1 pt-1"
                                               >
                                                   <Trash2 size={13} /> Remove Item
                                               </button>
                                           )}
                                       </div>
                                   ))}
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs font-medium">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Calculated Service Total:</span>
                                        <span className="font-extrabold text-slate-900">${calculateTotal().toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-700">
                                        <span>Initial Paid / Advance:</span>
                                        <span className="font-extrabold">-${(parseFloat(formData.paidAmount) || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-amber-700 font-bold border-t border-slate-200/60 pt-1.5">
                                        <span>Initial Remaining Dues:</span>
                                        <span className="font-black text-amber-700">${Math.max(0, calculateTotal() - (parseFloat(formData.paidAmount) || 0)).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50 flex gap-3">
                                <button onClick={() => setIsDrawerOpen(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all cursor-pointer">Cancel</button>
                                <button 
                                    onClick={handleSubmit} 
                                    disabled={isSubmitting}
                                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-all border-none cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Saving...' : (editingId ? 'Update Invoice' : 'Issue Invoice')}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-5 shadow-2xl border border-slate-200"
                    >
                        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
                            <Trash2 size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-extrabold text-slate-900">Delete Invoice Record?</h3>
                            <p className="text-slate-500 font-medium text-xs mt-1">This action will permanently purge this invoice record from the system.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-50 transition-all cursor-pointer">Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition-all cursor-pointer border-none shadow-xs">Confirm Delete</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Invoices;

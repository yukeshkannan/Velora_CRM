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
            toast.error("Popup blocked! Please allow popups to download statement PDF.");
            return;
        }
        
        const ref = invoice._id ? invoice._id.toString().slice(-6).toUpperCase() : 'INV';
        const paid = invoice.paidAmount || (invoice.status === 'Paid' ? invoice.totalAmount : 0);
        const total = invoice.totalAmount || 0;
        const balance = Math.max(0, total - paid);
        const status = invoice.status || 'Sent';
        const dueDateStr = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

        let statusBg = '#eff6ff';
        let statusText = '#2563eb';
        let statusBorder = '#bfdbfe';
        let statusLabel = 'INVOICE ISSUED';

        if (status === 'Paid') {
            statusBg = '#ecfdf5';
            statusText = '#059669';
            statusBorder = '#a7f3d0';
            statusLabel = 'PAID IN FULL';
        } else if (status === 'Partially Paid') {
            statusBg = '#fffbeb';
            statusText = '#d97706';
            statusBorder = '#fde68a';
            statusLabel = 'PARTIALLY PAID';
        }

        const itemsHtml = (invoice.items || []).map(item => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 14px 16px; color: #0f172a; font-weight: 600; font-size: 13px;">${item.description || 'Custom Service Item'}</td>
                <td style="padding: 14px 16px; color: #64748b; text-align: center; font-size: 13px;">${item.quantity || 1}</td>
                <td style="padding: 14px 16px; color: #64748b; text-align: right; font-size: 13px;">$${(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td style="padding: 14px 16px; color: #0f172a; font-weight: 700; text-align: right; font-size: 13px;">$${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            </tr>
        `).join('');

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Official Statement - #${ref}</title>
                <style>
                    @media print { 
                        body { -webkit-print-color-adjust: exact; padding: 0; }
                        .no-print { display: none; }
                    }
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; color: #0f172a; padding: 40px; margin: 0; }
                    .container { max-width: 700px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; }
                </style>
            </head>
            <body>
                <div class="container">
                    <!-- Brand Header -->
                    <div style="background: linear-gradient(135deg, #09090b 0%, #1e293b 100%); padding: 32px 36px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td>
                                    <div style="font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">Velora<span style="color: #6366f1;">.</span></div>
                                    <div style="color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; margin-top: 4px;">Official Statement & Invoice</div>
                                </td>
                                <td style="text-align: right; vertical-align: middle;">
                                    <span style="background-color: ${statusBg}; color: ${statusText}; border: 1px solid ${statusBorder}; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.8px; display: inline-block;">
                                        ${statusLabel}
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- Main Content -->
                    <div style="padding: 36px;">
                        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Dear ${invoice.customerName || 'Valued Client'},</h2>
                        <p style="font-size: 14px; color: #475569; line-height: 1.65; margin: 0 0 28px 0;">
                            ${status === 'Partially Paid' 
                                ? `Thank you for your payment! Below is your updated official statement showing total payment progress and remaining balance due.` 
                                : status === 'Paid'
                                ? `Invoice <strong>#${ref}</strong> has been fully settled. Below is your official receipt statement.`
                                : `Below is your official billing statement and line item breakdown for reference <strong>#${ref}</strong>.`}
                        </p>
                        
                        <!-- Financial Summary Box -->
                        <div style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; margin-bottom: 32px;">
                            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                                <tr>
                                    <td style="color: #64748b; padding: 6px 0; font-weight: 500;">Invoice Reference:</td>
                                    <td style="font-weight: 800; color: #0f172a; text-align: right; padding: 6px 0;">#${ref}</td>
                                </tr>
                                <tr>
                                    <td style="color: #64748b; padding: 6px 0; font-weight: 500;">Due Date:</td>
                                    <td style="font-weight: 700; color: #0f172a; text-align: right; padding: 6px 0;">${dueDateStr}</td>
                                </tr>
                                <tr>
                                    <td style="color: #64748b; padding: 6px 0; font-weight: 500;">Total Invoice Amount:</td>
                                    <td style="font-weight: 800; color: #0f172a; text-align: right; padding: 6px 0; font-size: 14px;">$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td style="color: #059669; padding: 6px 0; font-weight: 600;">Amount Paid to Date:</td>
                                    <td style="font-weight: 800; color: #059669; text-align: right; padding: 6px 0; font-size: 14px;">-$${paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr style="border-top: 2px dashed #cbd5e1;">
                                    <td style="color: #0f172a; padding: 12px 0 4px 0; font-weight: 800; font-size: 14px;">Remaining Balance Due:</td>
                                    <td style="font-weight: 900; color: ${balance > 0 ? '#d97706' : '#059669'}; text-align: right; padding: 12px 0 4px 0; font-size: 16px;">$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </table>
                        </div>

                        <!-- Line Items -->
                        <h3 style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">Service Items Breakdown</h3>
                        <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                            <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
                                <thead>
                                    <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: left;">
                                        <th style="padding: 10px 16px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Description</th>
                                        <th style="padding: 10px 16px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; text-align: center; width: 50px;">Qty</th>
                                        <th style="padding: 10px 16px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; text-align: right; width: 90px;">Price</th>
                                        <th style="padding: 10px 16px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; text-align: right; width: 100px;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                            </table>
                        </div>

                        <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                            <p style="margin: 0;">This official statement was automatically generated by Velora Enterprise CRM.</p>
                            <p style="margin: 4px 0 0 0; color: #cbd5e1;">© 2026 Velora Technologies. All rights reserved.</p>
                        </div>
                    </div>
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
        
        const matchesStatus = statusFilter === 'All' || (
            statusFilter === 'Pending' 
                ? (inv.status === 'Pending' || inv.status === 'Sent')
                : inv.status === statusFilter
        );

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
                    {!isClient && (
                        <button 
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            onClick={() => exportToCSV(invoices, 'invoices')}
                        >
                            <Download size={16} /> Export CSV
                        </button>
                    )}
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
                        {(isClient 
                            ? ['All', 'Pending', 'Partially Paid', 'Paid'] 
                            : ['All', 'Pending', 'Partially Paid', 'Paid', 'Overdue', 'Draft']
                        ).map(status => (
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
                                                         {inv.status === 'Sent' ? 'PENDING' : inv.status}
                                                     </span>
                                                 </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {isClient && (inv.status === 'Partially Paid' || inv.status === 'Paid') ? (
                                                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-extrabold rounded-xl border border-emerald-200/80 text-xs flex items-center gap-1.5 shrink-0">
                                                                <CheckCircle2 size={14} />
                                                                <span>{inv.status === 'Paid' ? 'Paid in Full' : 'Installment Paid'}</span>
                                                            </span>
                                                        ) : isClient && (
                                                            <button 
                                                                onClick={() => openPaymentModal(inv)}
                                                                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer border-none shrink-0"
                                                                title="Pay / Installment Payment"
                                                            >
                                                                <CreditCard size={14} />
                                                                <span>Pay / Installment</span>
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
                                {(() => {
                                    const currentPaid = paymentModalInvoice.paidAmount || (paymentModalInvoice.status === 'Paid' ? paymentModalInvoice.totalAmount : 0);
                                    const remaining = Math.max(0, (paymentModalInvoice.totalAmount || 0) - currentPaid);
                                    const currentVal = parseFloat(partialPayAmount) || 0;
                                    const val25 = parseFloat((remaining * 0.25).toFixed(2));
                                    const val50 = parseFloat((remaining * 0.50).toFixed(2));
                                    const valFull = parseFloat(remaining.toFixed(2));

                                    const is25 = Math.abs(currentVal - val25) < 0.02 && val25 > 0;
                                    const is50 = Math.abs(currentVal - val50) < 0.02 && val50 > 0;
                                    const isFull = Math.abs(currentVal - valFull) < 0.02 && valFull > 0;

                                    return (
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => setPartialPayAmount((remaining * 0.25).toFixed(2))}
                                                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
                                                        is25 ? 'bg-slate-900 text-white shadow-xs font-black' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                                    }`}
                                                >
                                                    25% Advance
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setPartialPayAmount((remaining * 0.50).toFixed(2))}
                                                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
                                                        is50 ? 'bg-slate-900 text-white shadow-xs font-black' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                                    }`}
                                                >
                                                    50% Installment
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setPartialPayAmount(remaining.toFixed(2))}
                                                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
                                                        isFull ? 'bg-slate-900 text-white shadow-xs font-black' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                                    }`}
                                                >
                                                    Full Balance
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}

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
                                <div className="grid grid-cols-2 gap-4">
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

                                    <div className="space-y-1.5">
                                       <label className="text-xs font-bold text-slate-700">Due Date <span className="text-rose-500">*</span></label>
                                       <input 
                                           type="date" 
                                           className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none text-xs font-bold text-slate-900 transition-all shadow-2xs"
                                           value={formData.dueDate}
                                           onChange={e => setFormData({...formData, dueDate: e.target.value})}
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
                                    <div className="flex justify-between items-center text-slate-700">
                                        <span className="font-bold">Total Service Invoice Amount:</span>
                                        <span className="font-black text-slate-900 text-sm">${calculateTotal().toLocaleString()}</span>
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

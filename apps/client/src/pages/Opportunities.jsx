import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, DollarSign, User, TrendingUp, LayoutGrid, Pencil, X, Trash2, Download, Building2, ChevronDown, Check, Sparkles, Play, Eye, CheckCircle2, XCircle, Calendar, Clock } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const STAGES = ['New', 'In Execution', 'Review', 'Completed', 'Cancelled'];

const StageDropdown = ({ currentStage, onSelect }) => {
    const getStageStyle = (s) => {
        switch(s) {
            case 'New': return 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200';
            case 'In Execution': return 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100';
            case 'Review': return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100';
            case 'Completed': return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
            case 'Cancelled': return 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100';
            default: return 'bg-slate-100 text-slate-800 border-slate-300';
        }
    };

    return (
        <select
            value={currentStage}
            onChange={(e) => onSelect(e.target.value)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition-all cursor-pointer shadow-2xs outline-none ${getStageStyle(currentStage)}`}
        >
            {STAGES.map((s) => (
                <option key={s} value={s} className="bg-white text-slate-900 font-bold py-1">
                    {s}
                </option>
            ))}
        </select>
    );
};

const AssignEmployeeDropdown = ({ opp, users, onAssign }) => {
    const assignedId = typeof opp.assignedTo === 'object' ? opp.assignedTo?._id : (opp.assignedTo || '');

    return (
        <select
            value={assignedId}
            onChange={(e) => {
                const selectedUser = users.find(u => String(u._id || u.id) === String(e.target.value));
                onAssign(opp._id, e.target.value, selectedUser?.name);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer shadow-2xs outline-none max-w-[150px] truncate ${
                assignedId 
                    ? 'bg-slate-100 border-slate-200/80 text-slate-800 hover:bg-slate-200' 
                    : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
        >
            <option value="" className="bg-white text-slate-900 font-bold">👤 Unassigned Lead</option>
            {users.map((u) => (
                <option key={u._id || u.id} value={u._id || u.id} className="bg-white text-slate-900 font-bold">
                    {u.name} ({u.role})
                </option>
            ))}
        </select>
    );
};

const Opportunities = () => {
    const { user } = useAuth();
    const [opportunities, setOpportunities] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingOpportunity, setEditingOpportunity] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        stage: 'New',
        contactId: '',
        assignedTo: '',
        expectedCloseDate: '',
        modules: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const results = await Promise.allSettled([
                axios.get('/api/opportunities'),
                axios.get('/api/contacts'),
                axios.get('/api/auth/users')
            ]);
            
            const [oppRes, contactRes, userRes] = results;
            let allOpportunities = oppRes.status === 'fulfilled' ? oppRes.value.data.data : [];
            
            if (user?.role === 'Employee') {
                allOpportunities = allOpportunities.filter(o => {
                    const assignedId = typeof o.assignedTo === 'object' ? o.assignedTo?._id : o.assignedTo;
                    const currentUserId = user.id || user._id;
                    return String(assignedId) === String(currentUserId);
                });
            }

            setOpportunities(allOpportunities);
            setContacts(contactRes.status === 'fulfilled' ? contactRes.value.data.data : []);
            
            const rawUsers = userRes.status === 'fulfilled' ? (userRes.value.data?.data || []) : [];
            // Only show Employees in Assigned To Employee dropdown (Exclude Admin & Client)
            const employeeUsers = rawUsers.filter(u => u.role === 'Employee');
            setUsers(employeeUsers);

            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch data", err);
            setLoading(false);
        }
    };

    const showStageToast = (newStage) => {
        const toastStyle = {
            borderRadius: '14px',
            background: '#0f172a',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: '700',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
            padding: '12px 16px'
        };

        switch(newStage) {
            case 'New':
                toast('Deal moved to New stage', {
                    icon: <Sparkles size={18} className="text-slate-300" />,
                    style: toastStyle
                });
                break;
            case 'In Execution':
                toast('Deal is now In Execution', {
                    icon: <Play size={18} className="text-indigo-400 fill-indigo-400" />,
                    style: toastStyle
                });
                break;
            case 'Review':
                toast('Deal sent for Review', {
                    icon: <Eye size={18} className="text-amber-400" />,
                    style: toastStyle
                });
                break;
            case 'Completed':
                toast('Deal Completed & Won', {
                    icon: <CheckCircle2 size={18} className="text-emerald-400" />,
                    style: toastStyle
                });
                break;
            case 'Cancelled':
                toast('Deal Marked as Cancelled', {
                    icon: <XCircle size={18} className="text-rose-400" />,
                    style: toastStyle
                });
                break;
            default:
                toast(`Deal stage updated to ${newStage}`, { style: toastStyle });
        }
    };

    const handleStageChange = async (oppId, newStage) => {
        try {
            // Instant Optimistic UI Update
            setOpportunities(prev => prev.map(o => o._id === oppId ? { ...o, stage: newStage } : o));
            
            await axios.put(`/api/opportunities/${oppId}`, { stage: newStage });
            showStageToast(newStage);
        } catch (err) {
            console.error("Failed to update stage", err);
            toast.error("Failed to update deal stage");
            fetchData(); // Rollback on error
        }
    };

    const handleAssignUser = async (oppId, empId, empName) => {
        try {
            setOpportunities(prev => prev.map(o => o._id === oppId ? { ...o, assignedTo: empId } : o));
            await axios.put(`/api/opportunities/${oppId}`, { assignedTo: empId });
            
            toast.success(`🔔 Assigned deal to ${empName}! Notification alert sent.`, {
                style: {
                    borderRadius: '14px',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
                    padding: '12px 16px'
                }
            });
        } catch (err) {
            console.error("Assignment failed", err);
            toast.error("Failed to assign lead");
            fetchData();
        }
    };

    const handleEdit = (opp) => {
        setEditingOpportunity(opp);
        const contactId = typeof opp.contactId === 'object' ? opp.contactId?._id : (opp.contactId || '');
        const assignedTo = typeof opp.assignedTo === 'object' ? opp.assignedTo?._id : (opp.assignedTo || '');

        setFormData({
            title: opp.title || '',
            amount: opp.amount || '',
            stage: opp.stage || 'New',
            contactId: contactId,
            assignedTo: assignedTo,
            expectedCloseDate: opp.expectedCloseDate ? opp.expectedCloseDate.split('T')[0] : '',
            modules: opp.modules || [],
            description: opp.description || '',
            preferredContactTime: opp.preferredContactTime || ''
        });
        setIsDrawerOpen(true);
    };

    const handleDateChange = async (dealId, newDate) => {
        try {
            await axios.put(`/api/opportunities/${dealId}`, { expectedCloseDate: newDate });
            setOpportunities(prev => prev.map(o => o._id === dealId ? { ...o, expectedCloseDate: newDate } : o));
            toast.success('Target close date updated!');
        } catch (err) {
            toast.error('Failed to update target close date');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/opportunities/${id}`);
            setOpportunities(prev => prev.filter(o => o._id !== id));
            setIsDrawerOpen(false);
            setShowDeleteConfirm(null);
            toast.success('Deal deleted successfully');
        } catch (err) {
            console.error("Failed to delete", err);
            toast.error('Failed to delete deal');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const cleanModules = (formData.modules || []).map(({ _id, ...rest }) => rest);
            const payload = { ...formData, modules: cleanModules };

            if (!payload.assignedTo) delete payload.assignedTo;
            if (!payload.expectedCloseDate) delete payload.expectedCloseDate;

            if (editingOpportunity) {
                await axios.put(`/api/opportunities/${editingOpportunity._id}`, payload);
                toast.success('Opportunity updated successfully');
            } else {
                await axios.post('/api/opportunities', payload);
                toast.success('Opportunity created successfully');
            }
            
            setFormData({ title: '', amount: '', stage: 'New', contactId: '', assignedTo: '', expectedCloseDate: '', modules: [], description: '', preferredContactTime: '' });
            setIsDrawerOpen(false);
            setEditingOpportunity(null);
            fetchData(); 
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to save. Check inputs.");
        }
    };

    const openCreateDrawer = () => {
        setEditingOpportunity(null);
        setFormData({ title: '', amount: '', stage: 'New', contactId: '', assignedTo: '', expectedCloseDate: '', modules: [], description: '', preferredContactTime: 'As soon as possible' });
        setIsDrawerOpen(true);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    };

    if (loading) return <LoadingSpinner message="Loading Sales Pipeline..." />;

    const filteredDeals = opportunities.filter(o => 
        (o.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (o.contactId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.contactId?.company || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPipelineValue = opportunities.reduce((sum, o) => sum + (o.amount || 0), 0);
    const activeDealsCount = opportunities.filter(o => o.stage !== 'Cancelled' && o.stage !== 'Completed').length;
    const completedDealsCount = opportunities.filter(o => o.stage === 'Completed').length;
    const winRate = opportunities.length > 0 ? Math.round((completedDealsCount / opportunities.length) * 100) : 0;

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
             style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* Top Page Header */}
            <div className="bg-white border-b border-slate-200/80 px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Sales Pipeline</h1>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">Manage deal pipelines, update stages inline, and track revenue velocity.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => exportToCSV(opportunities, 'opportunities')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>

                    <button 
                        onClick={openCreateDrawer}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 transition-all cursor-pointer border-none"
                    >
                        <Plus size={16} /> New Deal
                    </button>
                </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
                
                {/* KPI Metrics Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Pipeline</p>
                            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{formatCurrency(totalPipelineValue)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/60 text-slate-900 flex items-center justify-center font-bold">
                            <DollarSign size={22} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Active Deals</p>
                            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{activeDealsCount}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                            <TrendingUp size={22} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Win Rate</p>
                            <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">{winRate}%</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            <User size={22} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Deals</p>
                            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{opportunities.length}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/60 text-slate-900 flex items-center justify-center font-bold">
                            <LayoutGrid size={22} />
                        </div>
                    </div>
                </div>

                {/* Data Table Card Wrapper */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                    
                    {/* Toolbar Inside Card Header */}
                    <div className="p-5 sm:p-6 border-b border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative max-w-md w-full">
                            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search deals by title, contact, or company..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs"
                            />
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-slate-500">
                            Showing <span className="text-slate-900 font-extrabold">{filteredDeals.length}</span> active deals
                        </div>
                    </div>

                    {/* Balanced Column Spacing Table */}
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[1050px]">
                            <thead>
                                <tr className="bg-slate-100/70 border-b border-slate-200/80">
                                    <th className="px-5 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle w-[24%] min-w-[200px]">Deal Title</th>
                                    <th className="px-5 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle w-[15%] min-w-[140px]">Client / Contact</th>
                                    <th className="px-5 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle w-[16%] min-w-[150px]">Assigned Representative</th>
                                    <th className="px-5 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle text-right w-[12%] min-w-[110px]">Deal Amount</th>
                                    <th className="px-5 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle text-center w-[14%] min-w-[140px]">Stage</th>
                                    <th className="px-5 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle text-center w-[13%] min-w-[140px]">Target Close</th>
                                    <th className="px-5 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle text-right w-[6%] min-w-[80px] pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredDeals.map(opp => {
                                    const contact = contacts.find(c => c._id === (opp.contactId?._id || opp.contactId));
                                    const completedModules = (opp.modules || []).filter(m => m.status === 'Completed').length;
                                    const totalModules = (opp.modules || []).length;

                                    return (
                                        <tr key={opp._id} className="hover:bg-slate-50/80 transition-colors group">
                                            
                                            {/* Deal Title */}
                                            <td className="px-5 py-4 align-middle">
                                                <div className="flex flex-col pr-3 space-y-1">
                                                    <span 
                                                        onClick={() => handleEdit(opp)}
                                                        className="font-extrabold text-xs sm:text-sm text-slate-900 hover:text-slate-700 cursor-pointer transition-colors leading-snug"
                                                    >
                                                        {opp.title}
                                                    </span>

                                                    {/* Preferred Follow-up Time Badge (Ultra-Sleek SaaS Pill) */}
                                                    {Boolean(opp.preferredContactTime || (opp.description && (opp.description.includes('Preferred Follow-up Time:') || opp.description.includes('Preferred Contact:')))) && (
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <span 
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-900 text-white shadow-2xs whitespace-nowrap cursor-default border border-slate-800"
                                                                title={`Client Preferred Follow-up Time: ${opp.preferredContactTime || opp.description?.match(/Preferred (?:Follow-up Time|Contact):\s*([^\n]+)/)?.[1] || 'As soon as possible'}`}
                                                            >
                                                                <Clock size={11} className="text-amber-400 shrink-0" />
                                                                <span className="tracking-tight">{opp.preferredContactTime || opp.description?.match(/Preferred (?:Follow-up Time|Contact):\s*([^\n]+)/)?.[1] || 'As soon as possible'}</span>
                                                            </span>
                                                        </div>
                                                    )}

                                                    {totalModules > 0 && (
                                                        <span className="text-[11px] font-semibold text-slate-400">
                                                            Modules: {completedModules}/{totalModules} completed
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Client / Contact */}
                                            <td className="px-5 py-4 align-middle">
                                                {contact ? (
                                                    <div className="flex flex-col pr-2">
                                                        <span className="font-extrabold text-xs text-slate-900 truncate">{contact.name}</span>
                                                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <Building2 size={11} className="text-slate-400 shrink-0" />
                                                            <span className="truncate">{contact.company || contact.email}</span>
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-medium">--</span>
                                                )}
                                            </td>

                                            {/* Assigned Representative / Employee Dropdown */}
                                            <td className="px-5 py-4 align-middle">
                                                <AssignEmployeeDropdown opp={opp} users={users} onAssign={handleAssignUser} />
                                            </td>

                                            {/* Deal Amount */}
                                            <td className="px-5 py-4 align-middle text-right">
                                                <span className="font-black text-xs sm:text-sm text-slate-900">
                                                    {formatCurrency(opp.amount || 0)}
                                                </span>
                                            </td>

                                            {/* Stage (Custom Floating Popover Dropdown - FIXED POSITIONING) */}
                                            <td className="px-5 py-4 align-middle text-center">
                                                <StageDropdown 
                                                    currentStage={opp.stage} 
                                                    onSelect={(newStage) => handleStageChange(opp._id, newStage)} 
                                                />
                                            </td>

                                            {/* Target Close Date - Compact Inline Interactive Date Picker */}
                                            <td className="px-5 py-4 align-middle text-center">
                                                <div className="inline-flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl px-2.5 py-1.5 transition-all shadow-2xs">
                                                    <Calendar size={13} className="text-slate-500 shrink-0" />
                                                    <input 
                                                        type="date" 
                                                        min={new Date().toISOString().split('T')[0]}
                                                        value={opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toISOString().split('T')[0] : ''} 
                                                        onChange={(e) => handleDateChange(opp._id, e.target.value)} 
                                                        className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer p-0"
                                                        title="Set Target Close Date"
                                                    />
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 align-middle text-right pr-6">
                                                <div className="flex justify-end items-center gap-1.5">
                                                    <button 
                                                        onClick={() => handleEdit(opp)} 
                                                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer" 
                                                        title="Edit Deal Details"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setShowDeleteConfirm(opp)} 
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer" 
                                                        title="Delete Deal"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredDeals.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/60 flex items-center justify-center">
                                                    <DollarSign size={22} className="text-slate-400" />
                                                </div>
                                                <p className="font-bold text-xs sm:text-sm text-slate-600">No matching sales deals found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Drawer Modal */}
            <AnimatePresence>
                {isDrawerOpen && (
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
                            className="fixed top-0 right-0 bottom-0 w-full sm:w-[460px] bg-white z-50 shadow-2xl flex flex-col border-l border-slate-200/80"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-lg font-extrabold text-slate-900">{editingOpportunity ? 'Edit Sales Deal' : 'Create New Deal'}</h2>
                                    <p className="text-slate-500 text-xs font-medium mt-0.5">{editingOpportunity ? 'Update deal pipeline information.' : 'Add a new sales opportunity to pipeline.'}</p>
                                </div>
                                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"><X size={18} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <form id="dealForm" onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Deal Title <span className="text-rose-500">*</span></label>
                                        <input 
                                            required 
                                            type="text" 
                                            name="title" 
                                            value={formData.title} 
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                                            placeholder="e.g. Enterprise Software License"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 shadow-2xs"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Deal Amount ($) <span className="text-rose-500">*</span></label>
                                            <input 
                                                required 
                                                type="number" 
                                                name="amount" 
                                                value={formData.amount} 
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                placeholder="25000"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 shadow-2xs"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Pipeline Stage</label>
                                            <select 
                                                name="stage" 
                                                value={formData.stage} 
                                                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 cursor-pointer shadow-2xs"
                                            >
                                                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Contact Client</label>
                                        <select 
                                            name="contactId" 
                                            value={formData.contactId} 
                                            onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 cursor-pointer shadow-2xs"
                                        >
                                            <option value="">Select Contact...</option>
                                            {contacts.map(c => (
                                                <option key={c._id} value={c._id}>{c.name} ({c.company || c.email})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Read-Only Client Contact Preference & Notes (Corporate Slate Theme) */}
                                    {(editingOpportunity?.preferredContactTime || editingOpportunity?.description) && (
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                                            <div className="flex items-center gap-1.5 font-extrabold text-slate-900 uppercase tracking-wider text-[10px]">
                                                <Clock size={12} className="text-slate-600" />
                                                <span>Client Contact Preference & Notes</span>
                                            </div>
                                            {editingOpportunity.preferredContactTime && (
                                                <p className="font-bold text-slate-700">
                                                    Preferred Time: <span className="font-extrabold text-slate-900">{editingOpportunity.preferredContactTime}</span>
                                                </p>
                                            )}
                                            {editingOpportunity.description && (
                                                <p className="font-medium text-slate-600 whitespace-pre-wrap leading-relaxed">{editingOpportunity.description}</p>
                                            )}
                                        </div>
                                    )}
                                </form>
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                                <button onClick={() => setIsDrawerOpen(false)} className="flex-1 text-slate-700 font-bold hover:bg-slate-200/60 py-2.5 text-xs sm:text-sm rounded-xl transition-colors cursor-pointer">Cancel</button>
                                <button form="dealForm" type="submit" className="flex-1 bg-slate-900 text-white font-bold py-2.5 text-xs sm:text-sm rounded-xl hover:bg-slate-800 shadow-xs transition-colors cursor-pointer">
                                    {editingOpportunity ? 'Save Changes' : 'Create Deal'}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                   <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-center shadow-2xl border border-slate-200/80">
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                            <Trash2 size={24} />
                        </div>
                        <h2 className="text-lg font-extrabold text-slate-900 mb-1">Delete Deal?</h2>
                        <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">
                            Are you sure you want to delete <strong>{showDeleteConfirm.title}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                            <button className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors cursor-pointer" onClick={() => handleDelete(showDeleteConfirm._id)}>Delete</button>
                        </div>
                   </div>
                </div>
            )}
        </div>
    );
};

export default Opportunities;

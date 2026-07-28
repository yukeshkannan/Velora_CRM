import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    Users, DollarSign, TrendingUp, AlertCircle, 
    CheckCircle2, BarChart3, Activity, ArrowUpRight, ArrowRight, RefreshCw, Zap,
    Plus, Layers, Receipt, ShieldCheck, Clock, Building2, UserCheck, MessageSquare, ChevronRight,
    Briefcase, Sparkles, Filter, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ClientDashboard from './ClientDashboard';
import EmployeeDashboard from './EmployeeDashboard';

const Dashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [analytics, setAnalytics] = useState({
        contacts: [],
        opportunities: [],
        invoices: [],
        tasks: [],
        users: [],
        attendance: [],
        tickets: []
    });
    const [loading, setLoading] = useState(true);

    if (authLoading) {
        return <LoadingSpinner message="Verifying session..." />;
    }

    if (!user || user.role === 'Client') {
        return <ClientDashboard />;
    }

    if (user.role === 'Employee' || user.role === 'Sales' || user.role === 'HR') {
        return <EmployeeDashboard />;
    }

    useEffect(() => {
        fetchLiveAnalytics();
    }, []);

    const fetchLiveAnalytics = async () => {
        try {
            setLoading(true);
            const results = await Promise.allSettled([
                axios.get('/api/contacts'),
                axios.get('/api/opportunities'),
                axios.get('/api/invoices'),
                axios.get('/api/tasks'),
                axios.get('/api/auth/users'),
                axios.get('/api/attendance'),
                axios.get('/api/tickets')
            ]);

            const [contactsRes, oppsRes, invRes, tasksRes, usersRes, attRes, ticketsRes] = results;

            setAnalytics({
                contacts: contactsRes.status === 'fulfilled' ? (contactsRes.value.data.data || []) : [],
                opportunities: oppsRes.status === 'fulfilled' ? (oppsRes.value.data.data || []) : [],
                invoices: invRes.status === 'fulfilled' ? (invRes.value.data.data || []) : [],
                tasks: tasksRes.status === 'fulfilled' ? (tasksRes.value.data.data || []) : [],
                users: usersRes.status === 'fulfilled' ? (usersRes.value.data.data || []) : [],
                attendance: attRes.status === 'fulfilled' ? (attRes.value.data.data || []) : [],
                tickets: ticketsRes.status === 'fulfilled' ? (ticketsRes.value.data.data || []) : []
            });
        } catch (err) {
            console.error("Failed to fetch live admin dashboard analytics", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner message="Orchestrating Live CRM Intelligence..." />;

    // --- Dynamic Real Data Calculations ---
    const { contacts, opportunities, invoices, tasks, users, attendance, tickets } = analytics;

    // Financials
    const totalPipelineValue = opportunities.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const activeOpps = opportunities.filter(o => o.stage !== 'Completed' && o.stage !== 'Cancelled');
    const activePipelineValue = activeOpps.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    const totalInvoicedValue = invoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
    const totalCashCollected = invoices.reduce((sum, i) => sum + (Number(i.paidAmount) || (i.status === 'Paid' ? Number(i.totalAmount) : 0)), 0);
    const pendingBalanceDue = Math.max(0, totalInvoicedValue - totalCashCollected);

    // Workforce & Operations
    const employeesList = users.filter(u => u.role === 'Employee' || u.role === 'HR' || u.role === 'Sales');
    const todayStr = new Date().toDateString();
    const onlineStaffToday = attendance.filter(a => !a.checkOut && new Date(a.date).toDateString() === todayStr).length;
    
    const openTicketsList = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed');
    
    // Unified Tasks (Regular Tasks + Project Tasks from Opportunities, matching Tasks.jsx)
    const projectTasksConverted = opportunities.map(opp => ({
        _id: opp._id,
        title: opp.title,
        status: opp.employeeTaskStatus || (opp.stage === 'Completed' || opp.stage === 'Won' ? 'Completed' : opp.stage === 'New' ? 'Pending' : 'In Progress'),
        type: 'Project'
    }));
    const allUnifiedTasks = [...tasks, ...projectTasksConverted];
    const pendingTasksList = allUnifiedTasks.filter(t => t.status !== 'Completed');

    // Stage Distribution
    const stageCounts = {
        New: opportunities.filter(o => o.stage === 'New').length,
        'In Execution': opportunities.filter(o => o.stage === 'In Execution').length,
        Review: opportunities.filter(o => o.stage === 'Review').length,
        Completed: opportunities.filter(o => o.stage === 'Completed').length,
        Cancelled: opportunities.filter(o => o.stage === 'Cancelled').length
    };

    // CSV Export Handler
    const handleExportCSV = () => {
        const reportDate = new Date().toISOString().split('T')[0];
        
        const csvRows = [
            ['Velora CRM - Executive Control Center Telemetry Report'],
            [`Generated Date:`, reportDate],
            [],
            ['METRIC CATEGORY', 'INDICATOR', 'VALUE'],
            ['Financials', 'Total Pipeline Revenue ($)', totalPipelineValue],
            ['Financials', 'Active Pipeline Revenue ($)', activePipelineValue],
            ['Financials', 'Total Invoiced ($)', totalInvoicedValue],
            ['Financials', 'Cash Realized / Collected ($)', totalCashCollected],
            ['Financials', 'Pending Balance Due ($)', pendingBalanceDue],
            ['Pipeline Deals', 'Total Commercial Opportunities', opportunities.length],
            ['Pipeline Deals', 'Active Running Deals', activeOpps.length],
            ['Pipeline Deals', 'Completed Deals', stageCounts['Completed']],
            ['Workforce & Ops', 'Total Registered Contacts', contacts.length],
            ['Workforce & Ops', 'Total Workforce Staff', employeesList.length],
            ['Workforce & Ops', 'Online Staff Today', onlineStaffToday],
            ['Workforce & Ops', 'Open Support Tickets', openTicketsList.length],
            ['Workforce & Ops', 'Pending Tasks Count', pendingTasksList.length],
            [],
            ['RECENT OPPORTUNITIES BREAKDOWN'],
            ['Title', 'Amount ($)', 'Stage', 'Assigned Representative']
        ];

        opportunities.forEach(opp => {
            const assignedUser = users.find(u => String(u._id || u.id) === String(typeof opp.assignedTo === 'object' ? opp.assignedTo?._id : opp.assignedTo));
            csvRows.push([
                `"${(opp.title || '').replace(/"/g, '""')}"`,
                Number(opp.amount) || 0,
                opp.stage || 'New',
                `"${(assignedUser?.name || 'Unassigned').replace(/"/g, '""')}"`
            ]);
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `velora_executive_report_${reportDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8 font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
             style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* Top Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-0.5">
                        <span className="text-slate-900 font-extrabold">Velora CRM</span>
                        <span>/</span>
                        <span>Admin Executive Control</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Executive Control Center
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
                        Real-time revenue, workforce telemetry & operational metrics for {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={fetchLiveAnalytics}
                        className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
                        title="Refresh Telemetry Data"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>

                    <button 
                        onClick={handleExportCSV}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 border-none cursor-pointer"
                        title="Export Telemetry as CSV Report"
                    >
                        <Download size={14} /> Export Report (.CSV)
                    </button>
                </div>
            </div>

            {/* --- TOP ROW: FINANCIAL & PIPELINE KPI CARDS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                
                <KpiCard 
                    title="Total Pipeline Revenue"
                    value={`$${totalPipelineValue.toLocaleString()}`}
                    subtitle={`Active Value: $${activePipelineValue.toLocaleString()}`}
                    badge={`${opportunities.length} Total Deals`}
                    badgeStyle="bg-indigo-50 text-indigo-700 border-indigo-200"
                    icon={<DollarSign size={20} className="text-slate-900" />}
                    onClick={() => navigate('/app/sales')}
                />

                <KpiCard 
                    title="Cash Realized (Collected)"
                    value={`$${totalCashCollected.toLocaleString()}`}
                    subtitle={`Total Invoiced: $${totalInvoicedValue.toLocaleString()}`}
                    badge="Realized Revenue"
                    badgeStyle="bg-emerald-50 text-emerald-700 border-emerald-200"
                    icon={<CheckCircle2 size={20} className="text-emerald-700" />}
                    onClick={() => navigate('/app/invoices')}
                />

                <KpiCard 
                    title="Pending Balance Due"
                    value={`$${pendingBalanceDue.toLocaleString()}`}
                    subtitle={`${invoices.filter(i => i.status !== 'Paid').length} Open Invoices`}
                    badge="Uncollected"
                    badgeStyle={pendingBalanceDue > 0 ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-slate-100 text-slate-700 border-slate-200"}
                    icon={<Receipt size={20} className="text-amber-700" />}
                    onClick={() => navigate('/app/invoices')}
                />

                <KpiCard 
                    title="Active Deals & Projects"
                    value={activeOpps.length}
                    subtitle={`Out of ${opportunities.length} total engagements`}
                    badge="Active Pipeline"
                    badgeStyle="bg-sky-50 text-sky-700 border-sky-200"
                    icon={<Briefcase size={20} className="text-sky-700" />}
                    onClick={() => navigate('/app/sales')}
                />
            </div>

            {/* --- SECONDARY ROW: WORKFORCE & OPERATIONAL METRICS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                
                <KpiCard 
                    title="Total CRM Contacts"
                    value={contacts.length}
                    subtitle="Client Directory"
                    badge="Directory Active"
                    badgeStyle="bg-slate-100 text-slate-700 border-slate-200"
                    icon={<Users size={20} className="text-slate-700" />}
                    onClick={() => navigate('/app/contacts')}
                />

                <KpiCard 
                    title="Workforce Employees"
                    value={employeesList.length}
                    subtitle={`${onlineStaffToday} Currently Online Today`}
                    badge={`${onlineStaffToday} Online`}
                    badgeStyle="bg-emerald-50 text-emerald-700 border-emerald-200"
                    icon={<UserCheck size={20} className="text-emerald-600" />}
                    onClick={() => navigate('/app/users')}
                />

                <KpiCard 
                    title="Open Support Requests"
                    value={openTicketsList.length}
                    subtitle={`Total Tickets: ${tickets.length}`}
                    badge={openTicketsList.length > 0 ? "Action Needed" : "All Clear"}
                    badgeStyle={openTicketsList.length > 0 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}
                    icon={<MessageSquare size={20} className="text-rose-600" />}
                    onClick={() => navigate('/app/tickets')}
                />

                <KpiCard 
                    title="Pending Tasks"
                    value={pendingTasksList.length}
                    subtitle={`Total Tasks: ${allUnifiedTasks.length}`}
                    badge={pendingTasksList.length > 0 ? "In Progress" : "Completed"}
                    badgeStyle={pendingTasksList.length > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}
                    icon={<Clock size={20} className="text-amber-600" />}
                    onClick={() => navigate('/app/tasks')}
                />
            </div>

            {/* --- MAIN DUAL COLUMN SECTION --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
                
                {/* Left (8 cols): Pipeline Distribution & Financial Ledger */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Pipeline Stage Breakdown */}
                    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Pipeline Execution Distribution</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time status breakdown across all sales opportunities & projects.</p>
                            </div>
                            <button 
                                onClick={() => navigate('/app/sales')}
                                className="text-xs font-extrabold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer border-none bg-transparent"
                            >
                                Pipeline Board <ChevronRight size={14} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                            {[
                                { stage: 'New', count: stageCounts['New'], color: 'bg-slate-100 text-slate-800 border-slate-200' },
                                { stage: 'In Execution', count: stageCounts['In Execution'], color: 'bg-blue-50 text-blue-800 border-blue-200' },
                                { stage: 'Review', count: stageCounts['Review'], color: 'bg-amber-50 text-amber-800 border-amber-200' },
                                { stage: 'Completed', count: stageCounts['Completed'], color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                                { stage: 'Cancelled', count: stageCounts['Cancelled'], color: 'bg-rose-50 text-rose-800 border-rose-200' },
                            ].map(st => (
                                <div key={st.stage} className={`p-4 rounded-xl border ${st.color} flex flex-col justify-between text-center`}>
                                    <span className="text-[11px] font-black uppercase tracking-wider">{st.stage}</span>
                                    <span className="text-2xl font-black mt-2">{st.count}</span>
                                    <span className="text-[10px] font-bold opacity-75 mt-1">Deals</span>
                                </div>
                            ))}
                        </div>

                        {/* Visual Stage Share Bar */}
                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between text-xs font-extrabold text-slate-700">
                                <span>Overall Completion Rate</span>
                                <span>
                                    {opportunities.length > 0 
                                        ? Math.round((stageCounts['Completed'] / opportunities.length) * 100) 
                                        : 0}%
                                </span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/80 p-0.5">
                                <div 
                                    className="h-full bg-emerald-600 rounded-l-full transition-all duration-500" 
                                    style={{ width: `${opportunities.length > 0 ? (stageCounts['Completed'] / opportunities.length) * 100 : 0}%` }}
                                />
                                <div 
                                    className="h-full bg-blue-600 transition-all duration-500" 
                                    style={{ width: `${opportunities.length > 0 ? (stageCounts['In Execution'] / opportunities.length) * 100 : 0}%` }}
                                />
                                <div 
                                    className="h-full bg-amber-500 transition-all duration-500" 
                                    style={{ width: `${opportunities.length > 0 ? (stageCounts['Review'] / opportunities.length) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Recent Sales Deals & Projects Table */}
                    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Recent Opportunities & Client Contracts</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Latest commercial engagements and deal progression.</p>
                            </div>
                            <button 
                                onClick={() => navigate('/app/sales')}
                                className="text-xs font-extrabold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer border-none bg-transparent"
                            >
                                View All <ChevronRight size={14} />
                            </button>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                            <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                                <thead className="bg-slate-100/70 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                                    <tr>
                                        <th className="p-3.5 pl-4">Project / Deal Title</th>
                                        <th className="p-3.5">Contract Value</th>
                                        <th className="p-3.5">Assigned To</th>
                                        <th className="p-3.5 text-right pr-4">Execution Stage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {opportunities.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-400 font-bold">No active opportunities in pipeline.</td>
                                        </tr>
                                    ) : (
                                        opportunities.slice(0, 5).map(opp => {
                                            const assignedUser = users.find(u => String(u._id || u.id) === String(typeof opp.assignedTo === 'object' ? opp.assignedTo?._id : opp.assignedTo));
                                            return (
                                                <tr key={opp._id} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="p-3.5 pl-4 font-bold text-slate-900">{opp.title}</td>
                                                    <td className="p-3.5 font-black text-slate-900">${(Number(opp.amount) || 0).toLocaleString()}</td>
                                                    <td className="p-3.5 text-slate-600 font-semibold">{assignedUser?.name || 'Unassigned'}</td>
                                                    <td className="p-3.5 text-right pr-4">
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white">
                                                            {opp.stage}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* Right (4 cols): Executive Financial Summary & Workforce Panel */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Executive Financial Ledger Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Executive Financials</span>
                                <h3 className="text-lg font-extrabold text-white mt-0.5">Corporate Ledger</h3>
                            </div>
                            <div className="w-10 h-10 bg-slate-800 text-emerald-400 rounded-xl flex items-center justify-center border border-slate-700 shrink-0">
                                <DollarSign size={20} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Cash Collected</p>
                                <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight mt-1">
                                    ${totalCashCollected.toLocaleString()}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Invoiced</p>
                                    <p className="text-sm font-extrabold text-white">${totalInvoicedValue.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Pending Balance</p>
                                    <p className="text-sm font-extrabold text-amber-400">${pendingBalanceDue.toLocaleString()}</p>
                                </div>
                            </div>

                            <button 
                                onClick={() => navigate('/app/invoices')}
                                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700 flex items-center justify-center gap-2"
                            >
                                Open Invoices Ledger <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Active Workforce Panel */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h4 className="text-sm font-extrabold text-slate-900">Active Team Workforce</h4>
                                <p className="text-[11px] text-slate-500 font-medium">Internal staff directory & presence.</p>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                                {onlineStaffToday} Online Today
                            </span>
                        </div>

                        <div className="space-y-3">
                            {employeesList.length === 0 ? (
                                <div className="text-center py-6 text-slate-400 font-bold text-xs">No employee records registered.</div>
                            ) : (
                                employeesList.slice(0, 5).map(emp => (
                                    <div key={emp._id || emp.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                                                {emp.name?.charAt(0).toUpperCase() || 'E'}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">{emp.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{emp.role || 'Employee'}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                            {emp.department || 'Staff'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        <button 
                            onClick={() => navigate('/app/users')}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border-none"
                        >
                            View User Directory ({employeesList.length})
                        </button>
                    </div>

                </div>

            </div>

        </div>
    );
};

const KpiCard = ({ title, value, subtitle, badge, badgeStyle, icon, onClick }) => (
    <div 
        onClick={onClick}
        className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between relative group"
    >
        <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200/60 group-hover:scale-105 transition-transform shrink-0">
                {icon}
            </div>
            {badge && (
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badgeStyle || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {badge}
                </span>
            )}
        </div>

        <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1">{value}</h3>
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">{subtitle}</p>
        </div>
    </div>
);

export default Dashboard;

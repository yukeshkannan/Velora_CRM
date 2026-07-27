import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, Download, MessageSquare, Briefcase, 
    ChevronRight, Calendar, CheckCircle, CreditCard,
    AlertCircle, LayoutGrid, CheckCircle2, TrendingUp,
    Shield, UserCheck, PhoneCall, ExternalLink, Filter,
    Layers, ArrowUpRight, Plus, HelpCircle, FileText, Check,
    Sparkles, ArrowRight, Zap, ShieldCheck, FileSpreadsheet,
    Activity, Globe, User, Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ClientDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('engagements'); // 'engagements' | 'tickets' | 'invoices'
    const [selectedProject, setSelectedProject] = useState(null);
    const [clientData, setClientData] = useState({
        contact: null,
        projects: [],
        milestones: [],
        invoices: [],
        tickets: []
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                if (!user?.email) {
                    setLoading(false);
                    return;
                }

                // 1. Fetch Contact record by email
                const contactsRes = await axios.get('/api/contacts?email=' + encodeURIComponent(user.email));
                const allContacts = contactsRes.data.data || [];
                const contact = allContacts[0] || null;

                // 2. Parallel fetch invoices, tickets, opportunities, and tasks
                const invReq = axios.get(`/api/invoices?email=${encodeURIComponent(user.email)}`);
                const ticketReq = axios.get(`/api/tickets?email=${encodeURIComponent(user.email)}`);
                const oppReq = contact 
                    ? axios.get(`/api/opportunities?contactId=${contact._id}`) 
                    : Promise.resolve({ data: { data: [] } });
                const taskReq = contact 
                    ? axios.get(`/api/tasks?contactId=${contact._id}`) 
                    : Promise.resolve({ data: { data: [] } });

                const [invRes, ticketRes, oppRes, taskRes] = await Promise.allSettled([
                    invReq, ticketReq, oppReq, taskReq
                ]);

                const myInvoices = invRes.status === 'fulfilled' ? (invRes.value.data.data || []) : [];
                const myTickets = ticketRes.status === 'fulfilled' ? (ticketRes.value.data.data || []) : [];
                
                let rawProjects = oppRes.status === 'fulfilled' ? (oppRes.value.data.data || []) : [];
                let myProjects = rawProjects;

                if (contact) {
                    myProjects = rawProjects.filter(o => 
                        String(o.contactId) === String(contact._id) || 
                        (o.description && o.description.toLowerCase().includes(user.email.toLowerCase()))
                    );
                } else {
                    myProjects = rawProjects.filter(o => o.description && o.description.toLowerCase().includes(user.email.toLowerCase()));
                }
                
                // Exclude cancelled/lost deals
                myProjects = myProjects.filter(o => o.stage !== 'Cancelled' && o.stage !== 'Lost');
                const myMilestones = taskRes.status === 'fulfilled' ? (taskRes.value.data.data || []) : [];

                setClientData({
                    contact,
                    projects: myProjects,
                    milestones: myMilestones,
                    invoices: myInvoices,
                    tickets: myTickets
                });

                if (myProjects.length > 0 && !selectedProject) {
                    setSelectedProject(myProjects[0]);
                }

                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch client dashboard data:", err);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    const handleExport = () => {
        if (!clientData.invoices || clientData.invoices.length === 0) {
            toast.error("No financial records available to export.");
            return;
        }
        const headers = ['Invoice ID', 'Date', 'Amount', 'Status'];
        const rows = clientData.invoices.map(inv => [inv._id, new Date(inv.dueDate).toLocaleDateString(), inv.totalAmount, inv.status]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial_ledger_${user?.name || 'client'}.csv`;
        a.click();
        toast.success("Financial ledger downloaded successfully.");
    };

    if (loading) return <LoadingSpinner message="Opening your executive portal..." />;

    const totalInvoiced = clientData.invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalPaid = clientData.invoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const pendingBalance = totalInvoiced - totalPaid;
    const openTicketsCount = clientData.tickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved').length;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
             style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* Fully Responsive Top Glassmorphic Command Header */}
            <div className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-900 text-white font-black text-lg sm:text-xl flex items-center justify-center shadow-xs border border-slate-800 shrink-0">
                        {user?.name?.charAt(0) || 'C'}
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
                                {user?.name || 'Corporate Account'}
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1.5 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Client
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 flex flex-wrap items-center gap-2 truncate">
                            <span className="truncate">{user?.email}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="text-slate-700 font-bold hidden sm:inline">Enterprise Client Portal</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-row items-center gap-2.5 w-full md:w-auto">
                    <button 
                        onClick={() => navigate('/app/tickets')}
                        className="flex-1 md:flex-none px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border border-slate-200/80 cursor-pointer shadow-2xs"
                    >
                        <Plus size={15} /> 
                        <span>Raise Ticket</span>
                    </button>
                    <button 
                        onClick={handleExport}
                        className="flex-1 md:flex-none px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer border-none"
                    >
                        <Download size={15} /> 
                        <span>Export Ledger</span>
                    </button>
                </div>
            </div>

            {/* Main Content Responsive Grid */}
            <div className="flex-1 p-4 sm:p-8 max-w-[1600px] w-full mx-auto space-y-6 sm:space-y-8">
                
                {/* Executive KPI Overview Grid (Responsive 1 -> 2 -> 4 Cols) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <KpiCard 
                        title="Active Projects" 
                        value={clientData.projects.length} 
                        icon={<Briefcase size={20} className="text-slate-900" />}
                        sub={`${clientData.projects.length} Running Contracts`}
                        badge="Portfolio"
                        onClick={() => setActiveTab('engagements')}
                    />
                    <KpiCard 
                        title="Total Investment" 
                        value={`$${totalInvoiced.toLocaleString()}`} 
                        icon={<CreditCard size={20} className="text-emerald-700" />}
                        sub={`$${totalPaid.toLocaleString()} Paid to Date`}
                        badge="Financial"
                        onClick={() => setActiveTab('invoices')}
                    />
                    <KpiCard 
                        title="Pending Balance" 
                        value={`$${pendingBalance.toLocaleString()}`} 
                        icon={<Clock size={20} className={pendingBalance > 0 ? "text-amber-700" : "text-emerald-700"} />}
                        sub={pendingBalance > 0 ? "Due Invoices Pending" : "Zero Balance Outstanding"}
                        badge={pendingBalance > 0 ? "Due" : "Cleared"}
                        onClick={() => setActiveTab('invoices')}
                    />
                    <KpiCard 
                        title="Support Requests" 
                        value={openTicketsCount} 
                        icon={<MessageSquare size={20} className="text-indigo-700" />}
                        sub="Guaranteed SLA < 4 Hours"
                        badge={openTicketsCount > 0 ? `${openTicketsCount} Open` : "All Clear"}
                        onClick={() => setActiveTab('tickets')}
                    />
                </div>

                {/* Main Workspace Dual Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                    
                    {/* Left Column (8 cols): Main Interactive Hub */}
                    <div className="lg:col-span-8 space-y-6 w-full min-w-0">
                        
                        {/* Fully Responsive Tab Selector Bar */}
                        <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto scrollbar-none">
                            <div className="flex items-center gap-1.5 min-w-max">
                                <button
                                    onClick={() => setActiveTab('engagements')}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer whitespace-nowrap ${
                                        activeTab === 'engagements'
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                            : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    Active Engagements ({clientData.projects.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('tickets')}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer whitespace-nowrap ${
                                        activeTab === 'tickets'
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                            : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    Support Requests ({clientData.tickets.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('invoices')}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer whitespace-nowrap ${
                                        activeTab === 'invoices'
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                            : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    Billing & Invoices ({clientData.invoices.length})
                                </button>
                            </div>
                        </div>

                        {/* ENGAGEMENTS TAB */}
                        {activeTab === 'engagements' && (
                            <EngagementsView 
                                projects={clientData.projects} 
                                selectedProject={selectedProject}
                                setSelectedProject={setSelectedProject}
                            />
                        )}

                        {/* SUPPORT TICKETS TAB */}
                        {activeTab === 'tickets' && (
                            <div className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                    <div>
                                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Support Requests Ledger</h3>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">Track active support inquiries and resolution updates.</p>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/app/tickets')}
                                        className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shrink-0"
                                    >
                                        Open Tickets Portal <ChevronRight size={14} />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {clientData.tickets.length === 0 ? (
                                        <div className="text-center py-16 text-slate-400 font-bold text-sm">
                                            No support tickets filed yet.
                                        </div>
                                    ) : (
                                        clientData.tickets.map(ticket => (
                                            <div key={ticket._id} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                                            ticket.priority === 'Critical' || ticket.priority === 'High'
                                                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                                : 'bg-slate-200 text-slate-700'
                                                        }`}>
                                                            {ticket.priority || 'Medium'} Priority
                                                        </span>
                                                        <span className="text-xs font-medium text-slate-400">• {new Date(ticket.createdAt || Date.now()).toLocaleDateString()}</span>
                                                    </div>
                                                    <h4 className="text-sm font-extrabold text-slate-900 truncate">{ticket.title}</h4>
                                                    <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">{ticket.description}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-extrabold self-start sm:self-center shrink-0 ${
                                                    ticket.status === 'Resolved' || ticket.status === 'Closed'
                                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                                }`}>
                                                    {ticket.status}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* INVOICES TAB */}
                        {activeTab === 'invoices' && (
                            <div className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                    <div>
                                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Financial Invoices Ledger</h3>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">Full record of corporate billing and payment receipts.</p>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/app/invoices')}
                                        className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shrink-0"
                                    >
                                        Full Invoices Module <ChevronRight size={14} />
                                    </button>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                                    <table className="w-full text-left border-collapse min-w-[500px]">
                                        <thead className="bg-slate-100/70 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                                            <tr>
                                                <th className="p-3.5 pl-4">Invoice ID</th>
                                                <th className="p-3.5">Due Date</th>
                                                <th className="p-3.5">Amount</th>
                                                <th className="p-3.5 text-right pr-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs font-medium">
                                            {clientData.invoices.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-slate-400 font-bold">No invoices generated yet.</td>
                                                </tr>
                                            ) : (
                                                clientData.invoices.map(inv => (
                                                    <tr key={inv._id} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="p-3.5 pl-4 font-bold text-slate-900">{inv._id?.slice(-8)}</td>
                                                        <td className="p-3.5 text-slate-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                                                        <td className="p-3.5 font-extrabold text-slate-900">${inv.totalAmount?.toLocaleString()}</td>
                                                        <td className="p-3.5 text-right pr-4">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                                inv.status === 'Paid'
                                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                                            }`}>
                                                                {inv.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column (4 cols): Account Lead & Billing Card */}
                    <div className="lg:col-span-4 space-y-6 w-full min-w-0">
                        
                        {/* Dark Slate Financial Summary Card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ledger Overview</span>
                                    <h3 className="text-lg font-extrabold text-white mt-0.5">Account Summary</h3>
                                </div>
                                <div className="w-10 h-10 bg-slate-800 text-emerald-400 rounded-xl flex items-center justify-center border border-slate-700 shrink-0">
                                     <CreditCard size={18} />
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-baseline flex-wrap gap-2">
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pending Balance</p>
                                        <p className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight mt-1">
                                            ${pendingBalance.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Total Investment</p>
                                        <p className="text-sm font-extrabold text-white">${totalInvoiced.toLocaleString()}</p>
                                    </div>
                                </div>
                                
                                <div className="h-px bg-slate-800 w-full" />
                                
                                <button 
                                    onClick={() => navigate('/app/invoices')}
                                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700 flex items-center justify-center gap-2"
                                >
                                    Manage Invoices & Ledger <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

const KpiCard = ({ title, value, icon, sub, badge, onClick }) => (
    <div 
        onClick={onClick}
        className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group flex items-center justify-between min-w-0"
    >
        <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">{title}</span>
                {badge && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-xl sm:text-3xl font-black text-slate-900 mt-1 truncate">{value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 truncate">{sub}</p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center font-bold group-hover:scale-105 transition-transform shrink-0">
            {icon}
        </div>
    </div>
);

const generatePhases = (stage) => {
    const phases = [
        { id: 1, name: 'Phase 1: Requirements & Discovery', status: 'Completed', date: 'Q1 Deliverable' },
        { id: 2, name: 'Phase 2: UI/UX Spec & Architecture', status: 'Completed', date: 'Q1 Deliverable' },
        { id: 3, name: 'Phase 3: Core API Services & DB', status: 'In Progress', date: 'Active Build' },
        { id: 4, name: 'Phase 4: Client Web Portal Integration', status: 'In Progress', date: 'Active Build' },
        { id: 5, name: 'Phase 5: Security Audit & QA Testing', status: 'Upcoming', date: 'Milestone 4' },
        { id: 6, name: 'Phase 6: Production Launch & Handoff', status: 'Upcoming', date: 'Milestone 5' }
    ];

    if (stage === 'New') return phases.map(p => ({...p, status: 'Upcoming'}));
    if (stage === 'Discovery') return phases.map((p, i) => i < 2 ? {...p, status: 'Completed'} : {...p, status: 'Upcoming'});
    if (stage === 'Proposal') return phases.map((p, i) => i < 3 ? {...p, status: 'Completed'} : {...p, status: 'Upcoming'});
    if (stage === 'Won' || stage === 'Completed') return phases.map((p, i) => i < 4 ? {...p, status: 'Completed'} : i === 4 ? {...p, status: 'In Progress'} : {...p, status: 'Upcoming'});

    return phases;
};

const EngagementsView = ({ projects, selectedProject, setSelectedProject }) => {
    
    // Project List View
    if (!selectedProject) {
        return (
            <div className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Active Corporate Deliverables</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Select a project to inspect milestone phases & deliverable status.</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200 w-fit">
                        {projects.length} Running Projects
                    </span>
                </div>

                <div className="space-y-4">
                    {projects.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 font-bold text-sm">No active corporate projects assigned.</div>
                    ) : (
                        projects.map(proj => {
                            const progKey = proj.stage === 'New' ? 15 : proj.stage === 'Won' ? 75 : 45;
                            return (
                                <div 
                                    key={proj._id} 
                                    onClick={() => setSelectedProject(proj)} 
                                    className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:border-slate-300 hover:bg-slate-100/50 transition-all cursor-pointer group space-y-3"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                                                {proj.title?.charAt(0) || 'P'}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">{proj.title}</h4>
                                                <p className="text-xs text-slate-400 font-medium">Corporate Contract Engagement</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full font-black uppercase tracking-wider w-fit self-start sm:self-auto">
                                            {proj.stage}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-slate-500 font-medium pt-1">
                                        <span>Completion Status</span>
                                        <span className="flex items-center gap-1 font-bold text-slate-900 group-hover:translate-x-1 transition-transform">
                                            Inspect Milestones Roadmap <ChevronRight size={14} />
                                        </span>
                                    </div>

                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-slate-900 rounded-full transition-all duration-500" style={{ width: `${progKey}%` }}></div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    // Detailed Project Phases View
    const phases = generatePhases(selectedProject.stage);
    const completedPhases = phases.filter(p => p.status === 'Completed').length;
    const progressPercent = Math.round((completedPhases / phases.length) * 100);

    return (
        <div className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6 animate-in slide-in-from-right duration-300">
            <button 
                onClick={() => setSelectedProject(null)} 
                className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider cursor-pointer border-none bg-transparent"
            >
                <ChevronRight size={14} className="rotate-180" /> Back to Engagements List
            </button>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">{selectedProject.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Phase-by-phase execution roadmap & milestone delivery verification.</p>
                </div>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-extrabold rounded-full border border-indigo-200 w-fit">
                    Stage: {selectedProject.stage}
                </span>
            </div>

            {/* Overall Progress Meter */}
            <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between text-xs font-bold text-slate-700 gap-1">
                    <span>Deliverable Roadmap Progress</span>
                    <span>{progressPercent}% Completed ({completedPhases} of {phases.length} Phases Verified)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
                    <div 
                        className="h-full bg-slate-900 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Phases Checklist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {phases.map((phase) => (
                    <div key={phase.id} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs font-extrabold text-slate-900 truncate">{phase.name}</p>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{phase.date}</span>
                        </div>
                        {phase.status === 'Completed' ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                                <Check size={12} /> Verified
                            </span>
                        ) : phase.status === 'In Progress' ? (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                                <div className="w-2 h-2 rounded-full bg-amber-600 animate-ping" /> In Progress
                            </span>
                        ) : (
                            <span className="px-2.5 py-1 bg-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0">
                                Upcoming
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientDashboard;

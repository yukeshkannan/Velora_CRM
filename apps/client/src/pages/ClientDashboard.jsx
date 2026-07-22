import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Clock, Download, MessageSquare, Briefcase, 
    ChevronRight, Calendar, CheckCircle, CreditCard,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ClientDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
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
                const isClient = user?.role === 'Client';
                let contact = null;
                let myProjects = [];
                let myMilestones = [];
                let myInvoices = [];
                let myTickets = [];

                if (isClient) {
                    // Clients only query invoices and tickets (allowed by gateway)
                    const [invRes, ticketRes] = await Promise.all([
                        axios.get(`/api/invoices?email=${user?.email}`),
                        axios.get(`/api/tickets?email=${user?.email}`)
                    ]);
                    myInvoices = invRes.data.data || [];
                    myTickets = ticketRes.data.data || [];
                } else {
                    // Staff queries contacts, projects, tasks, invoices, and tickets
                    const contactsRes = await axios.get('/api/contacts?email=' + user?.email);
                    const allContacts = (contactsRes.data.data || []);
                    contact = allContacts.find(c => c.email === user?.email);

                    const invoiceReq = axios.get(`/api/invoices?email=${user?.email}`);
                    const ticketReq = axios.get(`/api/tickets?email=${user?.email}`);
                    
                    const projectReq = contact 
                        ? axios.get(`/api/opportunities?contactId=${contact._id}`) 
                        : Promise.resolve({ data: { data: [] } });

                    const taskReq = contact 
                        ? axios.get(`/api/tasks?contactId=${contact._id}`) 
                        : Promise.resolve({ data: { data: [] } });

                    const [invRes, ticketRes, oppRes, taskRes] = await Promise.all([
                        invoiceReq, ticketReq, projectReq, taskReq
                    ]);

                    myInvoices = invRes.data.data || [];
                    myTickets = ticketRes.data.data || [];
                    myProjects = (oppRes.data.data || []).filter(o => o.stage !== 'Lost');
                    myMilestones = taskRes.data.data || [];
                }

                setClientData({
                    contact,
                    projects: myProjects,
                    milestones: myMilestones,
                    invoices: myInvoices,
                    tickets: myTickets,
                    noContact: false 
                });
                setLoading(false);
            } catch (err) {
                console.error("Dashboard Load Error:", err);
                setLoading(false);
            }
        };

        if (user?.email) fetchDashboardData();
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
        a.download = `payment_details_${user?.name}.csv`;
        a.click();
        toast.success("Finance details exported successfully.");
    };

    if (loading) return <LoadingSpinner message="Loading your workspace..." />;

    if (clientData.noContact) {
        return (
            <div className="p-8 text-center bg-white rounded-3xl m-8 border-2 border-dashed border-stone-200">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-stone-900 mb-2">Workspace Inactive</h2>
                <p className="text-stone-500 max-w-sm mx-auto">
                    We couldn't find a client record for {user?.email}. Please contact support to link your corporate identity.
                </p>
            </div>
        );
    }

    const totalInvoiced = clientData.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const activeProject = clientData.projects[0];

    return (
        <div className="p-8 space-y-10 min-h-screen bg-white font-sans">
            
            {/* Header Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-stone-900 tracking-tight">Client Hub <span className="text-amber-600">.</span></h1>
                    <p className="text-stone-500 font-medium mt-1">Hello, {user?.name}. Manage your projects and billing here.</p>
                </div>
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all shadow-xl shadow-stone-200"
                >
                    <Download size={18} /> Export Finance Details
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Active Projects" 
                    value={clientData.projects.length} 
                    icon={<Briefcase className="text-amber-600" />} 
                    sub="Running deliveries"
                    path="/app/dashboard"
                />
                <StatCard 
                    title="Total Billed" 
                    value={`$${totalInvoiced.toLocaleString()}`} 
                    icon={<CreditCard className="text-emerald-600" />} 
                    sub={`${clientData.invoices.length} invoices`}
                    path="/app/invoices"
                />
                <StatCard 
                    title="Open Tickets" 
                    value={clientData.tickets.filter(t => t.status !== 'Closed').length} 
                    icon={<MessageSquare className="text-blue-600" />} 
                    sub="Support required"
                    path="/app/tickets"
                />
                <StatCard 
                    title="Completed Tasks" 
                    value={clientData.milestones.filter(m => m.status === 'Completed').length} 
                    icon={<CheckCircle className="text-stone-600" />} 
                    sub="Total efficiency"
                    path="/app/dashboard"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Active Project View */}
                <div className="lg:col-span-2 space-y-8">
                     <ActiveProjectsSection projects={clientData.projects} milestones={clientData.milestones} />
                </div>

                {/* Billing Summary Bar */}
                <div className="space-y-6">
                    <div 
                        onClick={() => navigate('/app/invoices')}
                        className="bg-gradient-to-br from-[#0C111D] to-[#04060B] border border-zinc-800/80 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group cursor-pointer hover:border-[#D4AF37]/40 transition-all duration-500"
                    >
                        {/* Glowing backdrops */}
                        <div className="absolute top-[-20%] right-[-20%] w-[65%] h-[65%] bg-[#D4AF37]/4 rounded-full blur-[60px] group-hover:bg-[#D4AF37]/6 transition-all duration-500 pointer-events-none" />
                        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0B409C]/4 rounded-full blur-[60px] pointer-events-none" />

                        {/* Credit Card Bezel Icon */}
                        <div className="absolute top-8 right-8 w-11 h-11 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:bg-[#D4AF37]/15 transition-all duration-500">
                             <CreditCard size={20} />
                        </div>

                        <h3 className="text-xl font-serif font-normal text-left text-zinc-100 mb-8 relative z-10 tracking-tight">
                            Financial <br/> Summary
                        </h3>
                        
                        <div className="space-y-6 relative z-10">
                            <div className="text-left">
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Outstanding Dues</p>
                                <p className="text-3xl font-serif font-light text-[#D4AF37] tracking-wide">
                                    ${clientData.invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.totalAmount, 0).toLocaleString()}
                                </p>
                            </div>
                            
                            <div className="h-px bg-zinc-800/60 w-full" />
                            
                            <div className="space-y-3">
                                {clientData.invoices.slice(0, 2).map((inv, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-zinc-900/60 last:border-b-0">
                                        <div className="flex flex-col text-left">
                                            <span className="text-zinc-400 font-bold">Due {new Date(inv.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <span className="font-bold text-zinc-200">${inv.totalAmount.toLocaleString()}</span>
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                                inv.status === 'Paid' 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/10'
                                            }`}>
                                                {inv.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <button className="w-full py-3 bg-[#111622] hover:bg-gradient-to-r hover:from-[#0B409C] hover:to-[#093582] text-zinc-300 hover:text-white border border-zinc-800/80 hover:border-transparent rounded-2xl text-[9px] font-bold uppercase tracking-widest hover:shadow-[0_8px_20px_rgba(11,64,156,0.15)] active:scale-98 transition-all duration-300 mt-2 cursor-pointer">
                                View Full Ledger
                            </button>
                        </div>
                    </div>

                    <div 
                        onClick={() => navigate('/app/tickets')}
                        className="bg-amber-50 rounded-[40px] p-8 border border-amber-200 cursor-pointer hover:border-amber-400 transition-all"
                    >
                        <div className="flex items-center gap-4 mb-4">
                             <div className="w-12 h-12 bg-amber-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                                <MessageSquare size={20} />
                             </div>
                             <div>
                                <p className="text-sm font-black text-stone-900">Need Assistance?</p>
                                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">SLA Response: 4 Hrs</p>
                             </div>
                        </div>
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                            Your dedicated account manager is active. Open a ticket for high-priority requests.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};

const StatCard = ({ title, value, icon, sub, path }) => {
    const navigate = useNavigate();
    return (
        <div 
            onClick={() => path && navigate(path)}
            className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
        >
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                    {icon}
                </div>
            </div>
            <h3 className="text-3xl font-black text-stone-900 mb-1 tracking-tight">{value}</h3>
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">{title}</span>
                <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest mt-0.5">{sub}</span>
            </div>
        </div>
    );
};

/* Helper to generate mock modules based on stage */
const generateModules = (stage) => {
    const modules = [
         { name: 'Requirements Analysis', status: 'Completed' },
         { name: 'UI/UX Design', status: 'Completed' },
         { name: 'System Architecture', status: 'Completed' },
         { name: 'Database Setup', status: 'In Progress' },
         { name: 'API Development', status: 'Pending' },
         { name: 'Frontend Integration', status: 'Pending' },
         { name: 'Quality Assurance', status: 'Pending' },
         { name: 'UAT Deployment', status: 'Pending' },
         { name: 'Final Release', status: 'Pending' }
    ];

    if (stage === 'New') return modules.map(m => ({...m, status: 'Pending'}));
    if (stage === 'Discovery') return modules.map((m, i) => i < 2 ? {...m, status: 'Completed'} : {...m, status: 'Pending'});
    if (stage === 'Proposal') return modules.map((m, i) => i < 3 ? {...m, status: 'Completed'} : {...m, status: 'Pending'});
    if (stage === 'Negotiation') return modules.map((m, i) => i < 4 ? {...m, status: 'Completed'} : {...m, status: 'Pending'});
    if (stage === 'Won') return modules.map((m, i) => i < 6 ? {...m, status: 'Completed'} : i === 6 ? {...m, status: 'In Progress'} : {...m, status: 'Pending'});
    
    return modules;
};

const ActiveProjectsSection = ({ projects }) => {
    const [selectedProject, setSelectedProject] = useState(null);

    // List View
    if (!selectedProject) {
        return (
            <div className="bg-stone-50 rounded-[48px] p-10 border border-stone-100 min-h-[500px]">
                 <div className="mb-10">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Your Portfolio</span>
                    <h3 className="text-2xl font-black text-stone-900 uppercase italic">
                        Active Engagements ({projects.length})
                    </h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                    {projects.length === 0 ? (
                        <div className="text-center py-20 text-stone-400 font-bold">No active projects found.</div>
                    ) : (
                        projects.map(proj => {
                            const progKey = proj.stage === 'New' ? 5 : proj.stage === 'Won' ? 65 : 30;
                             return (
                                <div key={proj._id} onClick={() => setSelectedProject(proj)} className="bg-white p-6 rounded-3xl border border-stone-100 hover:border-amber-500/30 hover:shadow-xl transition-all cursor-pointer group">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-lg font-black text-stone-900">{proj.title}</h4>
                                        <span className="text-[10px] bg-stone-100 px-3 py-1 rounded-full font-black uppercase tracking-widest text-stone-500">{proj.stage}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-xs text-stone-400 font-bold">Last update: Recent</div>
                                        <div className="flex items-center gap-2 text-xs font-black text-amber-600 group-hover:translate-x-1 transition-transform">
                                            View Progress <ChevronRight size={14} />
                                        </div>
                                    </div>
                                    <div className="mt-4 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500" style={{ width: `${progKey}%` }}></div>
                                    </div>
                                </div>
                             )
                        })
                    )}
                </div>
            </div>
        );
    }

    // Detail View
    const modules = selectedProject.modules && selectedProject.modules.length > 0 
        ? selectedProject.modules.map(m => ({
            ...m,
            status: m.clientStatus || 'Pending' // Use clientStatus for display
        }))
        : generateModules(selectedProject.stage);

    const completedCount = modules.filter(m => m.status === 'Completed').length;
    const progress = Math.round((completedCount / modules.length) * 100);

    return (
        <div className="bg-stone-50 rounded-[48px] p-10 border border-stone-100 min-h-[500px] animate-in slide-in-from-right duration-300">
             <button onClick={() => setSelectedProject(null)} className="mb-6 flex items-center gap-2 text-xs font-black text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-widest">
                 <ChevronRight size={14} className="rotate-180" /> Back to List
             </button>

             <div className="flex justify-between items-start mb-10">
                <div>
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 block">Project Deep Dive</span>
                    <h3 className="text-2xl font-black text-stone-900 uppercase italic">
                        {selectedProject.title}
                    </h3>
                </div>
                <span className="px-4 py-1.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-amber-200">
                    Stage: {selectedProject.stage}
                </span>
            </div>

            <div className="space-y-4 mb-10">
                <div className="flex justify-between text-xs font-black text-stone-500 uppercase tracking-widest">
                    <span>Module Completion</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-2.5 bg-stone-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-amber-600 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 {modules.map((mod, idx) => (
                     <div key={idx} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between">
                         <span className="text-xs font-bold text-stone-700">{mod.name}</span>
                         {mod.status === 'Completed' ? (
                             <CheckCircle size={16} className="text-emerald-500" />
                         ) : mod.status === 'In Progress' ? (
                             <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                         ) : (
                             <div className="w-4 h-4 rounded-full border-2 border-stone-200" />
                         )}
                     </div>
                 ))}
            </div>
        </div>
    );
};



export default ClientDashboard;

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowRight, Check, Sparkles, Briefcase, Shield, 
    Users, Menu, X, ChevronRight, BarChart3, 
    FileText, Layers, TrendingUp 
} from 'lucide-react';
import Logo from '../components/Logo';

const LandingPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeMockupTab, setActiveMockupTab] = useState('sales');
    const location = useLocation();

    // Data for interactive showcase mockups
    const mockupData = {
        sales: {
            stats: [
                { label: 'Front-Office Volume', value: '$42,910,000', valueClass: 'text-[#0A192F]' },
                { label: 'Conversion Metrics', value: '94.8% SLA', valueClass: 'text-[#C5A880]' },
                { label: 'System Node Status', value: 'Active', valueClass: 'text-emerald-600', isNode: true }
            ],
            columns: [
                {
                    title: 'Institutional Inflow',
                    cards: [
                        { name: 'Alexandria Tech', tag: 'SaaS', tagColor: 'bg-blue-50 text-blue-700', value: '$2,450,000', percentage: '90%' }
                    ]
                },
                {
                    title: 'Negotiation stage',
                    cards: [
                        { name: 'Geneva Capital', tag: 'Finance', tagColor: 'bg-amber-50 text-amber-700', value: '$1,800,000', percentage: '75%' }
                    ]
                },
                {
                    title: 'Contract signed',
                    cards: [
                        { name: 'Nippon Invest', tag: 'Ventures', tagColor: 'bg-purple-50 text-purple-700', value: '$3,500,000', percentage: '100%' }
                    ]
                }
            ]
        },
        support: {
            stats: [
                { label: 'Open Tickets', value: '14 Tickets', valueClass: 'text-[#0A192F]' },
                { label: 'Response SLA', value: '12m Avg Time', valueClass: 'text-[#C5A880]' },
                { label: 'Helpdesk Node', value: 'Operational', valueClass: 'text-emerald-600', isNode: true }
            ],
            columns: [
                {
                    title: 'New Tickets',
                    cards: [
                        { name: 'API timeout error', tag: 'High', tagColor: 'bg-red-50 text-red-700', value: 'Geneva Capital', percentage: '100%' }
                    ]
                },
                {
                    title: 'In Progress',
                    cards: [
                        { name: 'Invoice PDF styling', tag: 'Medium', tagColor: 'bg-amber-50 text-amber-700', value: 'Alexandria Tech', percentage: '45%' }
                    ]
                },
                {
                    title: 'Resolved Today',
                    cards: [
                        { name: 'Password Reset', tag: 'Low', tagColor: 'bg-zinc-100 text-zinc-700', value: 'Nippon Invest', percentage: '100%' }
                    ]
                }
            ]
        },
        hr: {
            stats: [
                { label: 'Active Employees', value: '42 Staff', valueClass: 'text-[#0A192F]' },
                { label: 'Clocked In Today', value: '96.4%', valueClass: 'text-[#C5A880]' },
                { label: 'Attendance Node', value: 'Synchronized', valueClass: 'text-emerald-600', isNode: true }
            ],
            columns: [
                {
                    title: 'On Duty',
                    cards: [
                        { name: 'Siddharth R.', tag: 'Design', tagColor: 'bg-blue-50 text-blue-700', value: 'Clocked In - 9:15 AM', percentage: '100%' }
                    ]
                },
                {
                    title: 'On Leave',
                    cards: [
                        { name: 'Aditya S.', tag: 'Support', tagColor: 'bg-red-50 text-red-700', value: 'Sick Leave', percentage: '0%' }
                    ]
                },
                {
                    title: 'Shift Allocation',
                    cards: [
                        { name: 'Meera K.', tag: 'Finance', tagColor: 'bg-purple-50 text-purple-700', value: 'Shift Standard', percentage: '100%' }
                    ]
                }
            ]
        },
        invoices: {
            stats: [
                { label: 'Total Billing', value: '$1,240,000', valueClass: 'text-[#0A192F]' },
                { label: 'Overdue Invoices', value: '0 Alerts', valueClass: 'text-[#C5A880]' },
                { label: 'Billing Engine', value: 'Secured', valueClass: 'text-emerald-600', isNode: true }
            ],
            columns: [
                {
                    title: 'Drafts',
                    cards: [
                        { name: 'INV-2026-006', tag: 'Draft', tagColor: 'bg-zinc-100 text-zinc-700', value: 'Geneva Capital ($8,500)', percentage: '0%' }
                    ]
                },
                {
                    title: 'Sent Invoices',
                    cards: [
                        { name: 'INV-2026-004', tag: 'Sent', tagColor: 'bg-amber-50 text-amber-700', value: 'Alexandria Tech ($45,000)', percentage: '50%' }
                    ]
                },
                {
                    title: 'Fully Paid',
                    cards: [
                        { name: 'INV-2026-005', tag: 'Paid', tagColor: 'bg-green-50 text-green-700', value: 'Nippon Invest ($120,000)', percentage: '100%' }
                    ]
                }
            ]
        }
    };

    // Handle hash scrolling on load or navigation
    useEffect(() => {
        if (location.hash) {
            const id = location.hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                setTimeout(() => {
                    const offset = 100;
                    const bodyRect = document.body.getBoundingClientRect().top;
                    const elementRect = element.getBoundingClientRect().top;
                    const elementPosition = elementRect - bodyRect;
                    const offsetPosition = elementPosition - offset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        }
    }, [location.hash]);

    const handleScroll = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const offset = 100;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="bg-[#FCFAF7] text-[#0A192F] font-sans selection:bg-[#0B409C]/10 selection:text-[#0B409C] min-h-screen relative overflow-x-hidden"
             style={{
                 backgroundImage: 'linear-gradient(180deg, #FCFAF7 0%, #F5F2EC 100%)',
                 fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
             }}>

            {/* Background Radial Glow Backdrops */}
            <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-[#E8F0FE] rounded-full blur-[130px] pointer-events-none -z-10" />
            <div className="absolute top-[20%] right-[-10%] w-[55%] h-[55%] bg-[#F6EEDD] rounded-full blur-[150px] pointer-events-none -z-10" />
            <div className="absolute bottom-[20%] left-[-10%] w-[45%] h-[45%] bg-[#E8F0FE] rounded-full blur-[120px] pointer-events-none -z-10" />

            {/* --- 1. HEADER / FLOATING NAVIGATION --- */}
            <header className="fixed top-0 left-0 right-0 z-50 w-full flex justify-center px-4 sm:px-6 py-4 md:py-6">
                <nav className="w-full max-w-7xl rounded-full border border-zinc-200/50 bg-[#FCFAF7]/85 backdrop-blur-xl py-3.5 px-6 md:px-10 flex justify-between items-center shadow-sm">
                    {/* Logo */}
                    <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 cursor-pointer">
                        <Logo size={28} className="drop-shadow-[0_2px_10px_rgba(20,184,166,0.25)]" />
                        <span className="font-serif font-bold text-2xl tracking-widest text-[#0A192F]">VELORA</span>
                    </div>

                    {/* Nav Links */}
                    <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-[#475569]">
                        <Link to="/" onClick={(e) => handleScroll(e, 'sales')} className="hover:text-[#0A192F] transition-colors">Sales</Link>
                        <Link to="/" onClick={(e) => handleScroll(e, 'support')} className="hover:text-[#0A192F] transition-colors">Support</Link>
                        <Link to="/" onClick={(e) => handleScroll(e, 'operations')} className="hover:text-[#0A192F] transition-colors">Operations</Link>
                    </div>

                    {/* CTA Button */}
                    <div className="hidden md:flex items-center">
                        <Link to="/login" className="px-6 py-2.5 bg-[#0A192F] hover:bg-[#1E293B] text-white text-[11px] font-bold tracking-widest uppercase rounded-full border border-[#C5A880]/20 transition-all duration-300">
                            Launch App
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-[#0A192F] focus:outline-none"
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </nav>

                {/* Mobile Navigation Dropdown */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: -15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25 }}
                            className="absolute top-[110%] left-4 right-4 p-6 bg-[#FCFAF7] border border-zinc-200/50 rounded-2xl shadow-xl flex flex-col gap-4 md:hidden"
                        >
                            <Link to="/" onClick={(e) => { setMobileMenuOpen(false); handleScroll(e, 'sales'); }} className="text-xs font-bold uppercase tracking-widest text-[#475569] hover:text-[#0A192F] py-2 border-b border-zinc-100">Sales</Link>
                            <Link to="/" onClick={(e) => { setMobileMenuOpen(false); handleScroll(e, 'support'); }} className="text-xs font-bold uppercase tracking-widest text-[#475569] hover:text-[#0A192F] py-2 border-b border-zinc-100">Support</Link>
                            <Link to="/" onClick={(e) => { setMobileMenuOpen(false); handleScroll(e, 'operations'); }} className="text-xs font-bold uppercase tracking-widest text-[#475569] hover:text-[#0A192F] py-2 border-b border-zinc-100">Operations</Link>
                            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 bg-[#0A192F] text-white text-center text-xs font-bold uppercase tracking-widest rounded-xl shadow-md mt-2">
                                Launch App
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* --- 2. HERO SECTION --- */}
            <section id="overview" className="pt-20 pb-8 md:pt-28 md:pb-12 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center">
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center text-center max-w-4xl mx-auto mb-6"
                >
                    {/* Tagline / Intro */}
                    <div className="inline-flex flex-col items-center mb-5">
                        <span className="text-[11px] font-serif uppercase tracking-[0.25em] text-[#C5A880] font-bold">
                            Moving beyond stream management.
                        </span>
                        <div className="w-16 h-[1.5px] bg-[#C5A880] mt-2" />
                    </div>

                    {/* Main Heading */}
                    <h1 className="font-serif text-4xl md:text-5xl lg:text-[58px] font-normal leading-[1.15] text-[#0A192F] mb-6 tracking-tight">
                        A digital curator for <span className="whitespace-nowrap">institutional-grade</span> relationships.
                    </h1>

                    {/* Subheading */}
                    <p className="text-sm md:text-base text-[#475569] font-normal mb-8 leading-relaxed max-w-2xl">
                        Velora CRM bridges Sales, Support, and Back-Office Operations into a single, unified, premium workspace. Curated for scale. Engineered for precision.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto">
                        <Link to="/signup" 
                              className="px-8 py-3.5 bg-[#0A192F] hover:bg-[#1E293B] text-white rounded-full font-bold text-xs uppercase tracking-widest border border-[#C5A880]/30 shadow-[0_8px_25px_rgba(10,25,47,0.15)] transition-all duration-300">
                            Explore the Standard
                        </Link>
                        <Link to="/" onClick={(e) => handleScroll(e, 'sales')} 
                           className="text-[#0A192F] hover:text-[#1E293B] transition-colors duration-200 text-xs font-bold uppercase tracking-widest border-b border-[#0A192F] pb-0.5">
                            View Features
                        </Link>
                    </div>
                </motion.div>

                {/* Visual Asset Mockup Dashboard */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="w-full max-w-5xl bg-white border border-zinc-200 rounded-[28px] p-4 md:p-6 shadow-[0_30px_70px_rgba(10,25,47,0.06)] overflow-hidden"
                >
                    {/* Fake App Frame */}
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-400" />
                            <span className="w-3 h-3 rounded-full bg-yellow-400" />
                            <span className="w-3 h-3 rounded-full bg-green-400" />
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest ml-4 font-serif">Velora Curation Workspace</span>
                        </div>
                        <div className="h-5 w-48 bg-zinc-100 rounded-full flex items-center justify-center text-[9px] text-zinc-400 tracking-wider font-semibold">
                            secure.veloracrm.com/workspace
                        </div>
                        <div className="w-6 h-6 rounded-full bg-zinc-100" />
                    </div>

                    {/* Fake Dashboard Grid */}
                    <div className="grid md:grid-cols-12 gap-5">
                        
                        {/* Sidebar element */}
                        <div className="md:col-span-3 flex flex-col gap-2 bg-[#FAF9F5] p-3 rounded-xl border border-zinc-100">
                            <span className="text-[9px] font-extrabold tracking-widest uppercase text-[#C5A880] mb-2 px-1">Global Vault</span>
                            
                            <button 
                                onClick={() => setActiveMockupTab('sales')}
                                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold w-full text-left transition-all duration-200 border ${
                                    activeMockupTab === 'sales'
                                        ? 'bg-white border-zinc-200/50 text-[#0A192F] shadow-sm'
                                        : 'border-transparent text-zinc-500 hover:bg-white hover:text-[#0A192F]'
                                }`}
                            >
                                <Briefcase size={12} className={activeMockupTab === 'sales' ? 'text-[#C5A880]' : ''} />
                                <span>Sales Pipelines</span>
                            </button>

                            <button 
                                onClick={() => setActiveMockupTab('support')}
                                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold w-full text-left transition-all duration-200 border ${
                                    activeMockupTab === 'support'
                                        ? 'bg-white border-zinc-200/50 text-[#0A192F] shadow-sm'
                                        : 'border-transparent text-zinc-500 hover:bg-white hover:text-[#0A192F]'
                                }`}
                            >
                                <Shield size={12} className={activeMockupTab === 'support' ? 'text-[#C5A880]' : ''} />
                                <span>Support Desk</span>
                            </button>

                            <button 
                                onClick={() => setActiveMockupTab('hr')}
                                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold w-full text-left transition-all duration-200 border ${
                                    activeMockupTab === 'hr'
                                        ? 'bg-white border-zinc-200/50 text-[#0A192F] shadow-sm'
                                        : 'border-transparent text-zinc-500 hover:bg-white hover:text-[#0A192F]'
                                }`}
                            >
                                <Users size={12} className={activeMockupTab === 'hr' ? 'text-[#C5A880]' : ''} />
                                <span>HR & Attendance</span>
                            </button>

                            <button 
                                onClick={() => setActiveMockupTab('invoices')}
                                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold w-full text-left transition-all duration-200 border ${
                                    activeMockupTab === 'invoices'
                                        ? 'bg-white border-zinc-200/50 text-[#0A192F] shadow-sm'
                                        : 'border-transparent text-zinc-500 hover:bg-white hover:text-[#0A192F]'
                                }`}
                            >
                                <FileText size={12} className={activeMockupTab === 'invoices' ? 'text-[#C5A880]' : ''} />
                                <span>B2B Invoices</span>
                            </button>
                        </div>

                        {/* Visual Content Area */}
                        <div className="md:col-span-9 flex flex-col gap-4">
                            
                            {/* Dashboard header stats */}
                            <div className="grid grid-cols-3 gap-3">
                                {mockupData[activeMockupTab].stats.map((stat, statIdx) => (
                                    <div key={statIdx} className="p-3 bg-[#FCFAF7] border border-zinc-200/50 rounded-xl flex flex-col">
                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{stat.label}</span>
                                        <span className={`text-sm md:text-base font-serif font-bold ${stat.valueClass} mt-1 flex items-center gap-1.5`}>
                                            {stat.isNode && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                            {stat.value}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* visual columns & customized dashboard states */}
                            <div className="bg-[#FCFAF7] p-4 rounded-xl border border-zinc-100 min-h-[220px]">
                                {activeMockupTab === 'sales' && (
                                    <div className="grid grid-cols-3 gap-3">
                                        {mockupData.sales.columns.map((column, colIdx) => (
                                            <div key={colIdx} className="flex flex-col gap-2.5">
                                                <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest px-1">{column.title}</span>
                                                {column.cards.map((card, cardIdx) => (
                                                    <motion.div 
                                                        key={cardIdx} 
                                                        layout
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="p-3 bg-white border border-zinc-200/60 rounded-xl shadow-sm flex flex-col gap-1.5 hover:border-[#C5A880]/30 transition-all"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold text-[#0A192F] truncate mr-1">{card.name}</span>
                                                            <span className={`text-[8px] ${card.tagColor} px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0`}>{card.tag}</span>
                                                        </div>
                                                        <span className="text-xs font-serif font-bold text-[#0A192F]">{card.value}</span>
                                                        <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden mt-1">
                                                            <div className="bg-[#C5A880] h-full transition-all duration-500" style={{ width: card.percentage }} />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {activeMockupTab === 'support' && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-x-auto"
                                    >
                                        <table className="w-full text-left text-[11px] font-sans">
                                            <thead>
                                                <tr className="border-b border-zinc-200 text-zinc-400 font-extrabold tracking-wider uppercase">
                                                    <th className="pb-2">Ticket ID</th>
                                                    <th className="pb-2">Subject</th>
                                                    <th className="pb-2">Client</th>
                                                    <th className="pb-2 text-center">Priority</th>
                                                    <th className="pb-2 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100 font-medium text-[#0A192F]">
                                                <tr className="hover:bg-white transition-colors">
                                                    <td className="py-2.5 font-bold">TCK-104</td>
                                                    <td className="py-2.5">API Gateway Timeout</td>
                                                    <td className="py-2.5">Geneva Capital</td>
                                                    <td className="py-2.5 text-center"><span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-bold text-[9px]">High</span></td>
                                                    <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[9px]">Open</span></td>
                                                </tr>
                                                <tr className="hover:bg-white transition-colors">
                                                    <td className="py-2.5 font-bold">TCK-102</td>
                                                    <td className="py-2.5">Invoice PDF Styling</td>
                                                    <td className="py-2.5">Alexandria Tech</td>
                                                    <td className="py-2.5 text-center"><span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[9px]">Medium</span></td>
                                                    <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 font-bold text-[9px]">In-Progress</span></td>
                                                </tr>
                                                <tr className="hover:bg-white transition-colors">
                                                    <td className="py-2.5 font-bold">TCK-101</td>
                                                    <td className="py-2.5">Reset admin credentials</td>
                                                    <td className="py-2.5">Nippon Invest</td>
                                                    <td className="py-2.5 text-center"><span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-bold text-[9px]">Low</span></td>
                                                    <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded bg-green-50 text-green-700 font-bold text-[9px]">Resolved</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </motion.div>
                                )}
                                {activeMockupTab === 'hr' && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-x-auto"
                                    >
                                        <table className="w-full text-left text-[11px] font-sans">
                                            <thead>
                                                <tr className="border-b border-zinc-200 text-zinc-400 font-extrabold tracking-wider uppercase">
                                                    <th className="pb-2">Employee</th>
                                                    <th className="pb-2">Department</th>
                                                    <th className="pb-2">Shift Schedule</th>
                                                    <th className="pb-2 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100 font-medium text-[#0A192F]">
                                                <tr className="hover:bg-white transition-colors">
                                                    <td className="py-2.5 font-bold flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center text-[8px] font-sans text-zinc-700">SR</div>
                                                        Siddharth R.
                                                    </td>
                                                    <td className="py-2.5">Design Team</td>
                                                    <td className="py-2.5">Morning (09:00 - 18:00)</td>
                                                    <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded bg-green-50 text-green-700 font-bold text-[9px]">Clocked In</span></td>
                                                </tr>
                                                <tr className="hover:bg-white transition-colors">
                                                    <td className="py-2.5 font-bold flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center text-[8px] font-sans text-zinc-700">MK</div>
                                                        Meera K.
                                                    </td>
                                                    <td className="py-2.5">Finance Lead</td>
                                                    <td className="py-2.5">Morning (09:00 - 18:00)</td>
                                                    <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded bg-green-50 text-green-700 font-bold text-[9px]">Clocked In</span></td>
                                                </tr>
                                                <tr className="hover:bg-white transition-colors">
                                                    <td className="py-2.5 font-bold flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center text-[8px] font-sans text-zinc-700">AS</div>
                                                        Aditya S.
                                                    </td>
                                                    <td className="py-2.5">Support Analyst</td>
                                                    <td className="py-2.5">Night (22:00 - 06:00)</td>
                                                    <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-bold text-[9px]">On Leave</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </motion.div>
                                )}
                                {activeMockupTab === 'invoices' && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-x-auto"
                                    >
                                        <table className="w-full text-left text-[11px] font-sans">
                                            <thead>
                                                <tr className="border-b border-zinc-200 text-zinc-400 font-extrabold tracking-wider uppercase">
                                                    <th className="pb-2">Invoice Code</th>
                                                    <th className="pb-2">Billed Client</th>
                                                    <th className="pb-2">Total Amount</th>
                                                    <th className="pb-2">Due Date</th>
                                                    <th className="pb-2 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100 font-medium text-[#0A192F]">
                                                <tr className="hover:bg-white transition-colors">
                                                    <td className="py-2.5 font-bold">INV-2026-004</td>
                                                    <td className="py-2.5">Alexandria Tech</td>
                                                    <td className="py-2.5">$45,000</td>
                                                    <td className="py-2.5">July 30, 2026</td>
                                                    <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[9px]">Sent</span></td>
                                                </tr>
                                                <tr className="hover:bg-white transition-colors">
                                                    <td className="py-2.5 font-bold">INV-2026-005</td>
                                                    <td className="py-2.5">Nippon Invest</td>
                                                    <td className="py-2.5">$120,000</td>
                                                    <td className="py-2.5">July 19, 2026</td>
                                                    <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded bg-green-50 text-green-700 font-bold text-[9px]">Paid</span></td>
                                                </tr>
                                                <tr className="hover:bg-white transition-colors">
                                                    <td className="py-2.5 font-bold">INV-2026-006</td>
                                                    <td className="py-2.5">Geneva Capital</td>
                                                    <td className="py-2.5">$8,500</td>
                                                    <td className="py-2.5">August 05, 2026</td>
                                                    <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-bold text-[9px]">Draft</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                    </div>
                </motion.div>
            </section>

            {/* --- 3. SALES SECTION --- */}
            <section id="sales" className="py-16 md:py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-zinc-200/30">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                    {/* Left Column: Text & Features */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A880] font-mono">01 / Deal Curation</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-serif font-normal text-[#0A192F] leading-tight">
                            Bespoke Sales Pipelines & Customer Acquisition
                        </h2>
                        <p className="text-sm text-[#475569] leading-relaxed">
                            Velora CRM's sales environment gives deal managers total visibility over institutional value pipelines. Design tailored deal workflows, track opportunities with high-precision metrics, and access robust product inventories.
                        </p>
                        <div className="space-y-3 pt-2">
                            {[
                                'Bespoke custom pipeline lifecycle stages',
                                'Real-time pipeline total volume metrics',
                                'Integrated product catalog link with quotes',
                                'One-click conversion from Won Opportunity to Invoice'
                            ].map((feat, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-xs font-semibold text-[#475569]">
                                    <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    <span>{feat}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Visual Mockup */}
                    <div className="lg:col-span-7">
                        <div className="bg-white/80 backdrop-blur-md shadow-xl border border-zinc-200/50 rounded-3xl p-6 md:p-8 hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                            
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <span className="text-[9px] font-extrabold text-[#C5A880] tracking-widest uppercase">Sales Pipeline</span>
                                    <h4 className="text-base font-serif font-bold text-[#0A192F] mt-1">Enterprise Deals</h4>
                                </div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">$42,910,000 Volume</span>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { title: 'Inflow Stage', name: 'Alexandria Tech', tag: 'SaaS', val: '$2,450,000', progress: '90%', barColor: 'bg-blue-500' },
                                    { title: 'Proposal Sent', name: 'Geneva Capital', tag: 'Finance', val: '$1,800,000', progress: '75%', barColor: 'bg-amber-500' },
                                    { title: 'Contract Signed', name: 'Nippon Invest', tag: 'Ventures', val: '$3,500,000', progress: '100%', barColor: 'bg-emerald-500' }
                                ].map((item, idx) => (
                                    <div key={idx} className="p-4 bg-[#FCFAF7] border border-zinc-200/50 rounded-2xl flex flex-col gap-2">
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider">{item.title}</span>
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="text-[10px] font-bold text-[#0A192F] truncate">{item.name}</span>
                                            <span className="text-[7px] font-black text-amber-800 bg-amber-50 px-1 rounded shrink-0">{item.tag}</span>
                                        </div>
                                        <span className="text-xs font-serif font-bold text-[#0A192F]">{item.val}</span>
                                        <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden mt-1">
                                            <div className={`${item.barColor} h-full transition-all`} style={{ width: item.progress }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- 4. SUPPORT SECTION --- */}
            <section id="support" className="py-16 md:py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-zinc-200/30">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                    {/* Left Column: Visual Mockup */}
                    <div className="lg:col-span-7 order-2 lg:order-1">
                        <div className="bg-white/80 backdrop-blur-md shadow-xl border border-zinc-200/50 rounded-3xl p-6 md:p-8 hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-24 h-24 bg-blue-50 rounded-br-full -ml-6 -mt-6 transition-transform group-hover:scale-110"></div>
                            
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <span className="text-[9px] font-extrabold text-[#C5A880] tracking-widest uppercase">Support Desk</span>
                                    <h4 className="text-base font-serif font-bold text-[#0A192F] mt-1">Incident Tickets</h4>
                                </div>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">12m Response SLA</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[10px] font-sans">
                                    <thead>
                                        <tr className="border-b border-zinc-200 text-zinc-400 font-extrabold tracking-wider uppercase">
                                            <th className="pb-2">Ticket Code</th>
                                            <th className="pb-2">Subject</th>
                                            <th className="pb-2">Customer</th>
                                            <th className="pb-2 text-center">Priority</th>
                                            <th className="pb-2 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 font-medium text-[#0A192F]">
                                        {[
                                            { code: 'TCK-104', sub: 'API Gateway Timeout', client: 'Geneva Capital', priClass: 'bg-red-50 text-red-700', pri: 'High', statClass: 'bg-blue-50 text-blue-700', stat: 'Open' },
                                            { code: 'TCK-102', sub: 'Invoice PDF Styling', client: 'Alexandria Tech', priClass: 'bg-amber-50 text-amber-700', pri: 'Medium', statClass: 'bg-yellow-50 text-yellow-700', stat: 'In-Progress' },
                                            { code: 'TCK-101', sub: 'Reset admin credentials', client: 'Nippon Invest', priClass: 'bg-zinc-100 text-zinc-600', pri: 'Low', statClass: 'bg-green-50 text-green-700', stat: 'Resolved' }
                                        ].map((t, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="py-3 font-bold">{t.code}</td>
                                                <td className="py-3">{t.sub}</td>
                                                <td className="py-3">{t.client}</td>
                                                <td className="py-3 text-center"><span className={`px-2 py-0.5 rounded font-bold text-[8px] ${t.priClass}`}>{t.pri}</span></td>
                                                <td className="py-3 text-right"><span className={`px-2 py-0.5 rounded font-bold text-[8px] ${t.statClass}`}>{t.stat}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Text & Features */}
                    <div className="lg:col-span-5 order-1 lg:order-2 space-y-6">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A880] font-mono">02 / Client trust</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-serif font-normal text-[#0A192F] leading-tight">
                            Institutional Helpdesk & SLA Guarantee
                        </h2>
                        <p className="text-sm text-[#475569] leading-relaxed">
                            Elevate your client service with an integrated ticketing desk. Route technical alerts, service reports, and billing inquiries automatically to account managers. Minimize response latency with structured priority SLA metrics.
                        </p>
                        <div className="space-y-3 pt-2">
                            {[
                                'Auto-assignment based on employee active ticket load',
                                'Color-coded incident severity categorizations',
                                'Full client account relationship mapping',
                                'Detailed resolution analytics and metrics'
                            ].map((feat, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-xs font-semibold text-[#475569]">
                                    <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    <span>{feat}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- 5. OPERATIONS SECTION --- */}
            <section id="operations" className="py-16 md:py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-zinc-200/30">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                    {/* Left Column: Text & Features */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A880] font-mono">03 / Workforce Orchestration</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-serif font-normal text-[#0A192F] leading-tight">
                            Unified Back-Office Operations, Attendance & HR Payroll
                        </h2>
                        <p className="text-sm text-[#475569] leading-relaxed">
                            Orchestrate your back-office with zero friction. Auto-track employee attendance, compute dynamic payroll prorated on real-time business days worked, deduct LOP automatically, and process payments with one-click exports.
                        </p>
                        <div className="space-y-3 pt-2">
                            {[
                                'Live ticking attendance session clocks on client portals',
                                'Proportional weekend pay calculations based on hours',
                                'Premium dual-column corporate payslips',
                                'Statutory tax deductions and LOP calculations'
                            ].map((feat, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-xs font-semibold text-[#475569]">
                                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    <span>{feat}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Visual Mockup */}
                    <div className="lg:col-span-7">
                        <div className="bg-white/80 backdrop-blur-md shadow-xl border border-zinc-200/50 rounded-3xl p-6 md:p-8 hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                            
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <span className="text-[9px] font-extrabold text-[#C5A880] tracking-widest uppercase">Operations & Payroll</span>
                                    <h4 className="text-base font-serif font-bold text-[#0A192F] mt-1">Compensation Statement</h4>
                                </div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Live Calc Active</span>
                            </div>

                            <div className="p-4 bg-[#FCFAF7] border border-zinc-200/50 rounded-2xl">
                                <div className="grid grid-cols-2 gap-4 divide-x divide-zinc-200/60">
                                    <div className="space-y-2.5 pr-2">
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider block">Earnings</span>
                                        <div className="flex justify-between text-[10px] font-bold text-slate-800">
                                            <span>Basic Salary (50%)</span>
                                            <span>₹20,000</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-slate-800">
                                            <span>House Rent (30%)</span>
                                            <span>₹12,000</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-slate-800">
                                            <span>Special Allowance</span>
                                            <span>₹8,000</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2.5 pl-4">
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider block">Deductions</span>
                                        <div className="flex justify-between text-[10px] font-bold text-rose-600">
                                            <span>Loss of Pay (LOP)</span>
                                            <span>- ₹1,800</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-rose-600">
                                            <span>Professional Tax</span>
                                            <span>- ₹200</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-dashed border-zinc-200 flex justify-between items-center">
                                    <div>
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider block">Net Salary Paid</span>
                                        <span className="text-base font-black text-[#0A192F]">₹38,000</span>
                                    </div>
                                    <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider">Disbursed</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- 5. CALL TO ACTION (CTA) SECTION --- */}
            <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="bg-[#0A192F] text-white rounded-[32px] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl">
                    {/* Subtle Internal Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-gradient-to-tr from-[#0B409C]/10 to-[#C5A880]/5 rounded-full blur-[100px] pointer-events-none" />

                    <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
                        <span className="text-[#C5A880] text-xs font-bold tracking-[0.2em] uppercase mb-4">
                            Operational Efficiency
                        </span>
                        <h2 className="font-serif text-3xl md:text-5xl font-normal leading-tight text-white mb-6">
                            Ready to elevate your operational efficiency?
                        </h2>
                        <p className="text-xs md:text-sm text-slate-300/80 mb-8 max-w-md font-sans">
                            Experience the Alexandria Standard today. Explore the system or build out integrations seamlessly.
                        </p>
                        <Link to="/signup" 
                              className="px-8 py-3.5 bg-[#FCFAF7] hover:bg-[#FAF9F5] text-[#0A192F] hover:scale-[1.02] rounded-full font-bold text-xs uppercase tracking-widest shadow-lg transition-all duration-300">
                            Get Started Now
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- 6. FOOTER --- */}
            <footer className="bg-gradient-to-b from-[#090C15] to-[#04060B] text-[#8C98A9] border-t border-zinc-900/60 pt-16 pb-10 px-6 md:px-12 relative overflow-hidden">
                {/* Accent glow in footer background */}
                <div className="absolute bottom-[-20%] right-[-10%] w-[350px] h-[350px] bg-[#C5A880]/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-[#0B409C]/5 rounded-full blur-[90px] pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mb-12 pb-12 border-b border-zinc-900">
                        {/* Brand Column */}
                        <div className="flex flex-col items-start gap-4">
                            <div className="flex items-center gap-2.5">
                                <Logo size={28} className="drop-shadow-[0_2px_10px_rgba(20,184,166,0.15)]" />
                                <span className="font-serif font-semibold text-2xl text-white tracking-widest uppercase leading-none">VELORA</span>
                            </div>
                            <p className="text-xs text-[#8C98A9]/80 leading-relaxed text-left max-w-xs font-normal">
                                A digital curator for institutional-grade relationships. Curated for scale. Engineered for precision.
                            </p>
                        </div>

                        {/* Features Column */}
                        <div className="flex flex-col items-start gap-3.5 text-left">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Ecosystem</span>
                            <div className="flex flex-col gap-2.5 text-xs font-semibold">
                                <Link to="/" onClick={(e) => handleScroll(e, 'sales')} className="hover:text-[#C5A880] transition-colors">Sales Pipelines</Link>
                                <Link to="/" onClick={(e) => handleScroll(e, 'support')} className="hover:text-[#C5A880] transition-colors">Support Helpdesk</Link>
                                <Link to="/" onClick={(e) => handleScroll(e, 'operations')} className="hover:text-[#C5A880] transition-colors">Operations & Payroll</Link>
                            </div>
                        </div>

                        {/* Access Portal Column */}
                        <div className="flex flex-col items-start gap-3.5 text-left">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Access Portal</span>
                            <div className="flex flex-col gap-2.5 text-xs font-semibold">
                                <Link to="/login" className="hover:text-[#C5A880] transition-colors">Launch Platform</Link>
                                <Link to="/signup" className="hover:text-[#C5A880] transition-colors">Request Account</Link>
                                <span className="text-zinc-600 select-none">Enterprise SLA V3.0</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-[#8C98A9]/50">
                        <span>Velora CRM &copy; 2026. All rights reserved.</span>
                        <div className="flex gap-4">
                            <span>Bespoke Design</span>
                            <span className="text-zinc-800">•</span>
                            <span>Institutional Quality</span>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;

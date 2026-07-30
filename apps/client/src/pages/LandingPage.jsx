import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowRight, Check, Sparkles, Shield, 
    Users, Menu, X, ChevronRight, BarChart3, 
    TrendingUp, Star, Zap, Clock, DollarSign, 
    ChevronDown, Play, Lock, CheckCircle2, 
    Headphones, CreditCard, UserCheck, ArrowUpRight, Building2
} from 'lucide-react';
import Logo from '../components/Logo';

const LandingPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('sales');
    const [openFaqIndex, setOpenFaqIndex] = useState(0);
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    // Data for interactive 4-in-1 Module Showcase
    const modules = {
        sales: {
            title: 'Sales & Pipeline Management',
            description: 'Track deal stages, forecast revenue, and close institutional pipeline 3x faster.',
            badge: 'Revenue Engine',
            stats: [
                { label: 'Active Pipeline', value: '$4,290,000' },
                { label: 'Avg Deal Velocity', value: '14 Days' },
                { label: 'Win Rate', value: '68.4%' }
            ],
            kanban: [
                {
                    stage: 'Lead Qualified',
                    count: 3,
                    cards: [
                        { name: 'Alexandria Tech', value: '$450,000', tag: 'Enterprise', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                        { name: 'Apex Solutions', value: '$180,000', tag: 'SaaS', color: 'bg-slate-100 text-slate-700 border-slate-200' }
                    ]
                }
            ]
        },
        hr: {
            title: 'HR, Attendance & Payroll',
            description: 'Automate staff clock-in, leave approvals, and one-click salary slip generation.',
            badge: 'Workforce Sync',
            stats: [
                { label: 'Active Employees', value: '48 Staff' },
                { label: 'Today Clock-In', value: '98.2%' },
                { label: 'Payroll Status', value: 'Processed' }
            ],
            kanban: [
                {
                    stage: 'Clocked In',
                    count: 42,
                    cards: [
                        { name: 'Sarah Jenkins', value: 'Clocked in at 9:02 AM', tag: 'Engineering', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                        { name: 'Marcus Chen', value: 'Clocked in at 8:55 AM', tag: 'Sales Lead', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                    ]
                }
            ]
        },
        invoices: {
            title: 'Invoicing & Automated Billing',
            description: 'Generate professional PDF invoices, track payments, and automatically reconcile revenue.',
            badge: 'Financial Flow',
            stats: [
                { label: 'Monthly Collected', value: '$840,200' },
                { label: 'Pending Invoices', value: '4 Unpaid' },
                { label: 'Avg Payment Time', value: '1.8 Days' }
            ],
            kanban: [
                {
                    stage: 'Payment Received',
                    count: 18,
                    cards: [
                        { name: 'INV-2026-088', value: '$88,000', tag: 'Paid via Stripe', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                        { name: 'INV-2026-087', value: '$32,400', tag: 'Paid via Wire', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                    ]
                }
            ]
        },
        tickets: {
            title: 'Customer Support & SLA Tracking',
            description: 'Resolve client tickets faster with automated routing, severity tags, and response SLA timers.',
            badge: 'Client Success',
            stats: [
                { label: 'Open Tickets', value: '8 Active' },
                { label: 'First Response SLA', value: '8 mins' },
                { label: 'CSAT Score', value: '99.4%' }
            ],
            kanban: [
                {
                    stage: 'New Tickets',
                    count: 2,
                    cards: [
                        { name: 'Custom Domain Setup', value: 'Geneva Capital', tag: 'High Severity', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                        { name: 'API Webhook Config', value: 'Alexandria Tech', tag: 'Medium', color: 'bg-amber-50 text-amber-700 border-amber-200' }
                    ]
                }
            ]
        }
    };

    // Smooth Scroll Helper for Section Navigation with Sticky Header Offset
    const scrollToSection = (id) => {
        setMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            const yOffset = -80; // Offset for 80px sticky header
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    // Testimonials Data
    const testimonials = [
        {
            name: 'Vikram Malhotra',
            role: 'VP of Sales',
            company: 'HyperScale Tech',
            quote: 'Velora replaced 4 separate tools for us. Deal velocity increased by 40% in our first 30 days.',
            rating: 5,
            image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        },
        {
            name: 'Elena Rostova',
            role: 'Head of Operations',
            company: 'Apex Global',
            quote: 'Having HR, attendance, and invoicing linked directly with our sales pipeline saved our team 20+ hours every week.',
            rating: 5,
            image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
        },
        {
            name: 'Arjun Nambiar',
            role: 'Chief Revenue Officer',
            company: 'FinPulse Systems',
            quote: 'The cleanest CRM UI I have ever used. No clunky menus. Command-K search and live pipeline stats are game-changing.',
            rating: 5,
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
        },
        {
            name: 'Sophia Williams',
            role: 'Director of HR',
            company: 'Vanguard Labs',
            quote: 'Payroll calculation used to take 3 days. With Velora attendance sync, it takes 3 clicks.',
            rating: 5,
            image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
        },
        {
            name: 'Rajesh Kothari',
            role: 'Founder & CEO',
            company: 'CloudSphere Solutions',
            quote: 'Enterprise-grade security with multi-tenant isolation out of the box. Absolutely top-tier engineering.',
            rating: 5,
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
        }
    ];

    // FAQ Data (Accurate to real project features)
    const faqs = [
        {
            question: 'What core modules are included in Velora?',
            answer: 'Velora unifies four core business operating modules into a single workspace: Visual Sales Kanban Pipelines, HR Workforce & Attendance Sync, Client PDF Invoicing, and Customer Support Helpdesk.'
        },
        {
            question: 'How does HR Attendance & Payroll management work?',
            answer: 'Employees can clock in with 1-click attendance tracking, view working logs, and request leaves. HR managers can view attendance reports and generate automated PDF payslips with one click.'
        },
        {
            question: 'Can I generate and download PDF invoices for clients?',
            answer: 'Yes! The Finance & Invoicing module allows you to create structured client invoices, track paid, pending, or overdue status, and instantly export professional PDF invoices for clients.'
        },
        {
            question: 'How does Customer Support & Ticket tracking work?',
            answer: 'Your support team can create tickets, categorize issues by priority severity (High, Medium, Low), monitor response countdown timers, and manage resolution statuses.'
        },
        {
            question: 'How is user data secured and access controlled?',
            answer: 'Velora enforces secure JWT token authentication, bcrypt password hashing, and Role-Based Access Control (RBAC) to ensure precise permissions for Admins, Managers, and Employees.'
        }
    ];

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (email) {
            navigate(`/signup?email=${encodeURIComponent(email)}`);
        } else {
            navigate('/signup');
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-200 selection:text-slate-900 antialiased overflow-x-hidden w-full max-w-full pt-20">
            
            {/* Header / Navbar (Fixed Pinned Top) */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all duration-200 w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between w-full">
                    <Link to="/" className="flex items-center group">
                        <Logo size={48} className="hover:scale-105 transition-transform" />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <button onClick={() => scrollToSection('features')} className="hover:text-slate-900 transition-colors cursor-pointer">Features</button>
                        <button onClick={() => scrollToSection('modules')} className="hover:text-slate-900 transition-colors cursor-pointer">Modules</button>
                        <button onClick={() => scrollToSection('testimonials')} className="hover:text-slate-900 transition-colors cursor-pointer">Reviews</button>
                        <button onClick={() => scrollToSection('faq')} className="hover:text-slate-900 transition-colors cursor-pointer">FAQ</button>
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link 
                            to="/login" 
                            className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link 
                            to="/signup" 
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all duration-200 shadow-sm flex items-center gap-2 group"
                        >
                            Get Started Free
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Dropdown */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-6 space-y-4 shadow-lg w-full max-w-full"
                        >
                            <button onClick={() => scrollToSection('features')} className="block w-full text-left text-slate-600 hover:text-slate-900 font-medium">Features</button>
                            <button onClick={() => scrollToSection('modules')} className="block w-full text-left text-slate-600 hover:text-slate-900 font-medium">Modules</button>
                            <button onClick={() => scrollToSection('testimonials')} className="block w-full text-left text-slate-600 hover:text-slate-900 font-medium">Reviews</button>
                            <button onClick={() => scrollToSection('faq')} className="block w-full text-left text-slate-600 hover:text-slate-900 font-medium">FAQ</button>
                            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                                <Link to="/login" className="w-full text-center py-2.5 text-slate-700 font-medium border border-slate-200 rounded-xl">Sign In</Link>
                                <Link to="/signup" className="w-full text-center py-2.5 bg-slate-900 text-white font-semibold rounded-xl">Get Started Free</Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Hero Section */}
            <section id="features" className="min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center bg-white w-full relative z-10">
               

                {/* Main Heading */}
                <motion.h1 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-5xl mx-auto leading-[1.15] mb-8"
                >
                    The Unified CRM Built for High-Growth Sales, HR & Operations
                </motion.h1>

                {/* Subtitle */}
                <motion.p 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed mb-12"
                >
                    Streamline deal pipelines, automated HR payroll, client invoicing, and customer helpdesk support into one unified enterprise workspace.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-16"
                >
                    <Link 
                        to="/signup" 
                        className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all duration-200 shadow-md flex items-center justify-center gap-2 group"
                    >
                        Get Started Free
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <button 
                        onClick={() => scrollToSection('modules')} 
                        className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                        <Play className="w-4 h-4 fill-slate-700 text-slate-700" />
                        Explore Interactive Modules
                    </button>
                </motion.div>

                {/* Key Pillars Row */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-8 border-t border-slate-100 text-xs sm:text-sm text-slate-700 font-semibold max-w-5xl mx-auto"
                >
                    <span className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-900 shrink-0" />
                        Unified Sales & Deals Pipeline
                    </span>
                    <span className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-slate-900 shrink-0" />
                        Automated HR & Payroll Sync
                    </span>
                    <span className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-slate-900 shrink-0" />
                        Instant Client PDF Invoicing
                    </span>
                    <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-slate-900 shrink-0" />
                        Enterprise Role Security (RBAC)
                    </span>
                </motion.div>
            </section>

            {/* Section 2: Senior Developer Interactive Module Showcase */}
            <section id="modules" className="py-24 bg-white relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                            One Platform. Four Core Operating Modules.
                        </h2>
                        <p className="mt-4 text-slate-600 text-base sm:text-lg">
                            Eliminate fragmented tools. Click any module below to preview how Velora unifies your entire business operations.
                        </p>
                    </div>

                    {/* Interactive Split Layout */}
                    <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left Column: Interactive Module Selector List (5 Cols) */}
                        <div className="lg:col-span-5 space-y-3">
                            <div 
                                onClick={() => setActiveTab('sales')}
                                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                                    activeTab === 'sales'
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]'
                                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${activeTab === 'sales' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'}`}>
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-base">Sales & Pipeline</div>
                                            <div className={`text-xs mt-0.5 ${activeTab === 'sales' ? 'text-slate-300' : 'text-slate-500'}`}>
                                                Kanban deal stages & revenue forecasting
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 transition-transform ${activeTab === 'sales' ? 'translate-x-1 text-white' : 'text-slate-400'}`} />
                                </div>
                            </div>

                            <div 
                                onClick={() => setActiveTab('hr')}
                                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                                    activeTab === 'hr'
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]'
                                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${activeTab === 'hr' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'}`}>
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-base">HR & Payroll</div>
                                            <div className={`text-xs mt-0.5 ${activeTab === 'hr' ? 'text-slate-300' : 'text-slate-500'}`}>
                                                Clock-in attendance & automated payslips
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 transition-transform ${activeTab === 'hr' ? 'translate-x-1 text-white' : 'text-slate-400'}`} />
                                </div>
                            </div>

                            <div 
                                onClick={() => setActiveTab('invoices')}
                                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                                    activeTab === 'invoices'
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]'
                                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${activeTab === 'invoices' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'}`}>
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-base">Invoicing & Billing</div>
                                            <div className={`text-xs mt-0.5 ${activeTab === 'invoices' ? 'text-slate-300' : 'text-slate-500'}`}>
                                                Instant PDF generation & payment status
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 transition-transform ${activeTab === 'invoices' ? 'translate-x-1 text-white' : 'text-slate-400'}`} />
                                </div>
                            </div>

                            <div 
                                onClick={() => setActiveTab('tickets')}
                                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                                    activeTab === 'tickets'
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]'
                                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${activeTab === 'tickets' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'}`}>
                                            <Headphones className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-base">Support & Helpdesk</div>
                                            <div className={`text-xs mt-0.5 ${activeTab === 'tickets' ? 'text-slate-300' : 'text-slate-500'}`}>
                                                Response SLA countdown & ticket queues
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 transition-transform ${activeTab === 'tickets' ? 'translate-x-1 text-white' : 'text-slate-400'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Live Active Module Spotlight Card (7 Cols) */}
                        <div className="lg:col-span-7">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -15 }}
                                    transition={{ duration: 0.25 }}
                                    className="p-5 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 text-left shadow-sm space-y-6 max-w-full overflow-hidden"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-2">
                                        <div>
                                            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                                                {modules[activeTab].badge}
                                            </span>
                                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                                                {modules[activeTab].title}
                                            </h3>
                                        </div>
                                        <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200">
                                            Active Operational
                                        </span>
                                    </div>

                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        {modules[activeTab].description}
                                    </p>

                                    {/* Real-time Metric Badges */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {modules[activeTab].stats.map((stat, sIdx) => (
                                            <div key={sIdx} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                                                <div className="text-[11px] text-slate-500">{stat.label}</div>
                                                <div className="text-base font-bold text-slate-900 mt-0.5">{stat.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Active Preview Cards */}
                                    <div className="space-y-3 pt-2">
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Live Pipeline Snapshot
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {modules[activeTab].kanban[0].cards.map((card, cIdx) => (
                                                <div key={cIdx} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold text-slate-900">{card.name}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${card.color}`}>
                                                            {card.tag}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs font-mono text-slate-500 mt-2">{card.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3: Customer Testimonials Infinite Marquee */}
            <section id="testimonials" className="py-24 bg-white relative z-10 overflow-hidden w-full max-w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
                    <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Verified Customer Reviews</h2>
                    <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900">
                        Trusted by High-Growth Revenue Leaders
                    </p>
                </div>

                {/* Marquee Container with Zero Layout Spillage */}
                <div className="flex overflow-hidden relative w-full max-w-full">
                    <div className="flex shrink-0 gap-6 animate-marquee py-4">
                        {testimonials.map((t, idx) => (
                            <div 
                                key={idx} 
                                className="w-[280px] sm:w-[360px] p-6 rounded-2xl bg-slate-50 border border-slate-200 flex-shrink-0 flex flex-col justify-between shadow-sm"
                            >
                                <div>
                                    <div className="flex items-center gap-1 text-amber-500 mb-4">
                                        {[...Array(t.rating)].map((_, rIdx) => (
                                            <Star key={rIdx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-slate-700 text-sm italic leading-relaxed">
                                        "{t.quote}"
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200">
                                    <img 
                                        src={t.image} 
                                        alt={t.name} 
                                        className="w-10 h-10 rounded-full object-cover border border-slate-300" 
                                    />
                                    <div className="text-left">
                                        <div className="text-sm font-bold text-slate-900">{t.name}</div>
                                        <div className="text-xs text-slate-500">{t.role} • <span className="text-indigo-600 font-medium">{t.company}</span></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex shrink-0 gap-6 animate-marquee py-4" aria-hidden="true">
                        {testimonials.map((t, idx) => (
                            <div 
                                key={`dup-${idx}`} 
                                className="w-[280px] sm:w-[360px] p-6 rounded-2xl bg-slate-50 border border-slate-200 flex-shrink-0 flex flex-col justify-between shadow-sm"
                            >
                                <div>
                                    <div className="flex items-center gap-1 text-amber-500 mb-4">
                                        {[...Array(t.rating)].map((_, rIdx) => (
                                            <Star key={rIdx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-slate-700 text-sm italic leading-relaxed">
                                        "{t.quote}"
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200">
                                    <img 
                                        src={t.image} 
                                        alt={t.name} 
                                        className="w-10 h-10 rounded-full object-cover border border-slate-300" 
                                    />
                                    <div className="text-left">
                                        <div className="text-sm font-bold text-slate-900">{t.name}</div>
                                        <div className="text-xs text-slate-500">{t.role} • <span className="text-indigo-600 font-medium">{t.company}</span></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 4: Interactive FAQ Accordion */}
            <section id="faq" className="py-24 bg-white relative z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Questions & Answers</h2>
                        <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900">
                            Frequently Asked Questions
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div 
                                key={idx} 
                                className="rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden transition-colors"
                            >
                                <button
                                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
                                >
                                    <span className="text-base sm:text-lg">{faq.question}</span>
                                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${openFaqIndex === idx ? 'rotate-180 text-indigo-600' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {openFaqIndex === idx && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="px-6 pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-200/80 pt-4"
                                        >
                                            {faq.answer}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 6: Enterprise Footer */}
            <footer className="bg-white border-t border-slate-100 pt-16 pb-12 relative z-10 text-sm text-slate-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-100">
                        
                        {/* Col 1: Brand */}
                        <div className="col-span-2 space-y-4">
                            <Link to="/" className="flex items-center">
                                <Logo size={44} />
                            </Link>
                            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                                The unified multi-tenant CRM for enterprise sales pipelines, workforce HR, automated invoicing, and helpdesk support.
                            </p>
                        </div>

                        {/* Col 2: Product */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Product</h4>
                            <ul className="space-y-3 text-xs">
                                <li><button onClick={() => scrollToSection('modules')} className="hover:text-slate-900 transition-colors cursor-pointer">Sales Pipeline</button></li>
                                <li><button onClick={() => scrollToSection('modules')} className="hover:text-slate-900 transition-colors cursor-pointer">HR & Attendance</button></li>
                                <li><button onClick={() => scrollToSection('modules')} className="hover:text-slate-900 transition-colors cursor-pointer">Invoice Generator</button></li>
                                <li><button onClick={() => scrollToSection('modules')} className="hover:text-slate-900 transition-colors cursor-pointer">Support Helpdesk</button></li>
                            </ul>
                        </div>

                        {/* Col 3: Platform */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Platform</h4>
                            <ul className="space-y-3 text-xs">
                                <li><Link to="/login" className="hover:text-slate-900 transition-colors">Command-K Search</Link></li>
                                <li><Link to="/login" className="hover:text-slate-900 transition-colors">Role-Based Access</Link></li>
                                <li><Link to="/login" className="hover:text-slate-900 transition-colors">AWS Encrypted Storage</Link></li>
                                <li><Link to="/login" className="hover:text-slate-900 transition-colors">RabbitMQ Events</Link></li>
                            </ul>
                        </div>

                        {/* Col 4: Account */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Access</h4>
                            <ul className="space-y-3 text-xs">
                                <li><Link to="/login" className="hover:text-slate-900 transition-colors">Sign In</Link></li>
                                <li><Link to="/signup" className="hover:text-slate-900 transition-colors">Create Account</Link></li>
                                <li><Link to="/forgotpassword" className="hover:text-slate-900 transition-colors">Reset Password</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 text-center text-xs text-slate-500 font-medium">
                        © {new Date().getFullYear()} Velora Inc. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

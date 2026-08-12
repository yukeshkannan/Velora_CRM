import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bell, Zap, ArrowRight, CheckCircle, ChevronDown, Sparkles, 
    ShieldCheck, Building2, TrendingUp, Code2, Globe, Check, Menu
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import LoadingSpinner from './LoadingSpinner';

const Layout = () => {
  const { user, switchPersonaRole } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const personaRef = useRef(null);

  const isClient = !user || user.role === 'Client';

  const personas = [
    { 
      id: 'Admin', 
      label: 'Executive Admin', 
      roleName: 'Admin', 
      desc: '360° Operations & Master Control', 
      icon: <ShieldCheck size={16} className="text-amber-500 shrink-0" />, 
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-200/80',
      activePill: 'bg-amber-500'
    },
    { 
      id: 'HR', 
      label: 'People Ops Lead', 
      roleName: 'HR', 
      desc: 'Staff Directory, Attendance & Payroll', 
      icon: <Building2 size={16} className="text-indigo-500 shrink-0" />, 
      badgeColor: 'bg-indigo-50 text-indigo-900 border-indigo-200/80',
      activePill: 'bg-indigo-500'
    },
    { 
      id: 'Sales', 
      label: 'Account Executive', 
      roleName: 'Sales', 
      desc: 'Deals Pipeline, CRM Contacts & Catalog', 
      icon: <TrendingUp size={16} className="text-emerald-500 shrink-0" />, 
      badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
      activePill: 'bg-emerald-500'
    },
    { 
      id: 'Employee', 
      label: 'Software Engineer', 
      roleName: 'Employee', 
      desc: 'Assigned Tasks, Clock-in & Payslips', 
      icon: <Code2 size={16} className="text-blue-500 shrink-0" />, 
      badgeColor: 'bg-blue-50 text-blue-900 border-blue-200/80',
      activePill: 'bg-blue-500'
    },
    { 
      id: 'Client', 
      label: 'Corporate Client', 
      roleName: 'Client', 
      desc: 'Project Tracking, Invoices & Support', 
      icon: <Globe size={16} className="text-slate-600 shrink-0" />, 
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200/80',
      activePill: 'bg-slate-600'
    }
  ];

  useEffect(() => {
    if (isClient) return;

    const fetchNotifications = async () => {
      try {
        const res = await axios.get('/api/opportunities');
        const allOpps = res.data.data || [];
        const newOpps = allOpps.filter(o => o.stage === 'New' || o.stage === 'Lead' || o.stage === 'New Inquiry');
        setNotifications(newOpps);
      } catch (err) {
        // silent catch
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [user, isClient]);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
      if (personaRef.current && !personaRef.current.contains(e.target)) {
        setIsPersonaOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchPersona = (p) => {
    if (switchPersonaRole) {
      switchPersonaRole(p.roleName);
      toast.success(`Switched to ${p.label} (${p.roleName})`, {
        style: {
          background: '#0f172a',
          color: '#ffffff',
          fontWeight: '700',
          borderRadius: '12px'
        }
      });
      setIsPersonaOpen(false);
      navigate('/app/dashboard');
    }
  };

  const currentPersona = personas.find(p => p.roleName === user?.role) || personas[0];
  const isSuperAdminUser = user?.originalRole === 'Admin' || (user?.email && user.email.toLowerCase() === 'admin@company.com');

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans selection:bg-slate-200 selection:text-slate-900 antialiased overflow-x-hidden">
      {/* Responsive Sidebar with off-canvas drawer */}
      <Sidebar 
        mobileOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full min-w-0 overflow-x-hidden">
        
        {/* Executive Top Navigation Header Bar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-all lg:hidden cursor-pointer border-none flex items-center justify-center"
                    title="Open Navigation Menu"
                >
                    <Menu size={18} />
                </button>
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest hidden md:inline">
                    Velora Portal
                </span>
                <span className="text-slate-300 hidden md:inline">/</span>
                <span className="text-xs font-bold text-slate-800 truncate max-w-[140px] sm:max-w-[200px] md:max-w-none">
                    Welcome back, <strong className="text-slate-900 font-extrabold">{user?.name || 'User'}</strong>
                </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                {/* Persona Switcher ONLY FOR ADMIN / EVALUATOR */}
                {isSuperAdminUser ? (
                    <div className="relative" ref={personaRef}>
                        <button
                            type="button"
                            onClick={() => setIsPersonaOpen(!isPersonaOpen)}
                            className={`flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs ${currentPersona.badgeColor} hover:shadow-sm active:scale-95`}
                            title="Role Workspace Simulator (Admin Tool)"
                        >
                            {currentPersona.icon}
                            <span className="hidden sm:inline">{user?.role || 'User'} Workspace</span>
                            <span className="inline sm:hidden">{user?.role || 'Role'}</span>
                            <ChevronDown size={13} className={`transition-transform duration-200 text-slate-400 ${isPersonaOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isPersonaOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-72 sm:w-84 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 p-2 space-y-1.5 font-sans"
                                >
                                    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Role Workspace Simulator
                                        </span>
                                        <span className="flex items-center gap-1 text-[9px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                                            <Sparkles size={11} /> Admin Tool
                                        </span>
                                    </div>

                                    <div className="space-y-1 pt-1">
                                        {personas.map((p) => {
                                            const isSelected = user?.role === p.roleName;
                                            return (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => handleSwitchPersona(p)}
                                                    className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer border-none ${
                                                        isSelected ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-800'
                                                    }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                                        isSelected ? 'bg-white/10 border-white/20' : 'bg-slate-100/80 border-slate-200/60'
                                                    }`}>
                                                        {p.icon}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className={`text-xs font-black tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                                                {p.label}
                                                            </p>
                                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                                            }`}>
                                                                {p.roleName}
                                                            </span>
                                                        </div>
                                                        <p className={`text-[10px] truncate mt-0.5 font-medium ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                                                            {p.desc}
                                                        </p>
                                                    </div>

                                                    {isSelected && (
                                                        <Check size={14} className="text-emerald-400 shrink-0 ml-1" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    /* Clean Read-Only Role Badge for Client, Employee, Sales, HR */
                    <div 
                        className={`flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${currentPersona.badgeColor} shadow-2xs`}
                        title={`${user?.role || 'User'} Workspace`}
                    >
                        {currentPersona.icon}
                        <span className="hidden sm:inline">{user?.role || 'User'} Workspace</span>
                        <span className="inline sm:hidden">{user?.role || 'Role'}</span>
                    </div>
                )}


                {/* Notification Bell (For Admin & Staff) */}
                {!isClient && (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsOpen(!isOpen)}
                            className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-all cursor-pointer border-none flex items-center justify-center"
                            title="Real-Time Quote Notifications"
                        >
                            <Bell size={18} />
                            {notifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] sm:text-[10px] font-black text-white shadow-xs animate-pulse">
                                    {notifications.length}
                                </span>
                            )}
                        </button>

                        {/* Notifications Popover */}
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
                                >
                                    <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Zap size={16} className="text-amber-400" />
                                            <h4 className="text-xs font-extrabold tracking-wide uppercase">New Quote Inquiries</h4>
                                        </div>
                                        <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full">
                                            {notifications.length} Unread
                                        </span>
                                    </div>

                                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 space-y-2">
                                                <CheckCircle size={24} className="mx-auto text-emerald-500 opacity-60" />
                                                <p className="text-xs font-bold">All quote inquiries reviewed!</p>
                                            </div>
                                        ) : (
                                            notifications.map((n) => (
                                                <div 
                                                    key={n._id}
                                                    onClick={() => {
                                                        setIsOpen(false);
                                                        navigate('/app/sales');
                                                    }}
                                                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-1.5"
                                                >
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-extrabold text-slate-900">{n.contactName || n.company || 'New Client'}</span>
                                                        <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                                            ${(n.amount || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-600 line-clamp-1">{n.title}</p>
                                                    {n.preferredContactTime && (
                                                        <p className="text-[10px] font-bold text-slate-500">🕒 Preferred Time: {n.preferredContactTime}</p>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                                        <button
                                            onClick={() => {
                                                setIsOpen(false);
                                                navigate('/app/sales');
                                            }}
                                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                                        >
                                            View Sales Pipeline <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* User Profile Pill */}
                <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0">
                        {user?.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                        <span className="text-xs font-extrabold text-slate-900 leading-tight">{user?.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user?.designation || user?.role || 'User'}</span>
                    </div>
                </div>
            </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden">
          <Suspense fallback={<LoadingSpinner message="Loading section details..." fullScreen={false} />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default Layout;

import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

const Layout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isClient = !user || user.role === 'Client';

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

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans selection:bg-slate-200 selection:text-slate-900 antialiased">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        
        {/* Executive Top Navigation Header Bar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                    Velora Portal
                </span>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-bold text-slate-800">
                    Welcome back, <strong className="text-slate-900 font-extrabold">{user?.name || 'User'}</strong>
                </span>
            </div>

            <div className="flex items-center gap-4">
                {/* Notification Bell (For Admin & Staff) */}
                {!isClient && (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsOpen(!isOpen)}
                            className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-all cursor-pointer border-none flex items-center justify-center"
                            title="Real-Time Quote Notifications"
                        >
                            <Bell size={18} />
                            {notifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs animate-pulse">
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
                                    className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
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

                {/* User Role Badge */}
                <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                        {user?.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-xs font-extrabold text-slate-900 leading-tight">{user?.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user?.role || 'User'}</span>
                    </div>
                </div>
            </div>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

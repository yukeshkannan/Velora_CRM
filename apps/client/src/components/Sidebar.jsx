import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { 
  LayoutDashboard, 
  Users, 
  Files, 
  Ticket, 
  Settings, 
  LogOut,
  UserPlus,
  Package,
  Receipt,
  ListTodo,
  Calendar,
  DollarSign,
  Clock,
  Briefcase,
  ChevronDown,
  Building2,
  UserCheck,
  Wrench,
  ShieldCheck
} from 'lucide-react';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // -- CLIENT VIEW --
  const internalRoles = ['Admin', 'Employee', 'Sales', 'HR'];
  if (!user || !user.role || !internalRoles.includes(user.role) || user.role === 'Client') {
      const clientItems = [
          { label: 'My Project', path: '/app/dashboard', icon: <Briefcase size={20} /> },
          { label: 'Explore Services', path: '/app/explore', icon: <Package size={20} /> },
          { label: 'My Invoices', path: '/app/invoices', icon: <Receipt size={20} /> },
          { label: 'Support Tickets', path: '/app/tickets', icon: <Ticket size={20} /> },
      ];

      return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 h-screen fixed left-0 top-0 flex flex-col z-50 shadow-2xl text-white font-sans selection:bg-slate-700 selection:text-white antialiased"
               style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <Logo size={32} variant="light" />
                    <div className="flex flex-col">
                        <span className="text-base font-extrabold tracking-tight text-white select-none">Velora CRM</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Portal</span>
                    </div>
                </div>
            </div>
            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="flex flex-col gap-2">
                {clientItems.map((item) => (
                    <li key={item.path}>
                    <NavLink 
                        to={item.path}
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                        isActive 
                        ? 'bg-white text-slate-900 shadow-md' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        {item.icon}
                        {item.label}
                    </NavLink>
                    </li>
                ))}
                </ul>
            </nav>
            <div className="p-4 space-y-2 border-t border-slate-800">
                 <NavLink 
                    to="/app/settings"
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm w-full ${
                        isActive ? 'bg-white text-slate-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                    >
                    <Settings size={20} />
                    Settings
                </NavLink>
                <button 
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm w-full text-rose-400 hover:bg-rose-500/10 cursor-pointer" 
                onClick={logout}
                >
                <LogOut size={20} />
                Logout
                </button>
            </div>
        </aside>
      );
  }

  // -- INTERNAL TEAM VIEW (Admin, Employee, Sales, HR) --
  const role = user?.role;
  const dept = (user?.department || '').toLowerCase();
  const isAdmin = role === 'Admin';
  const isHR = role === 'HR' || dept.includes('hr') || dept.includes('human');
  const isSales = role === 'Sales' || dept.includes('sales') || dept.includes('marketing');
  const isEmployeeOnly = role === 'Employee' && !isAdmin && !isHR && !isSales;

  // Items per role
  let menuItems = [];

  if (isEmployeeOnly) {
    // Pure Employee View: Single clean flat list (No sales, contacts, or admin options)
    menuItems = [
      { label: 'Dashboard', path: '/app/dashboard', icon: <LayoutDashboard size={20} /> },
      { label: 'My Tasks', path: '/app/tasks', icon: <ListTodo size={20} /> },
      { label: 'Calendar', path: '/app/calendar', icon: <Calendar size={20} /> },
      { label: 'Support Tickets', path: '/app/tickets', icon: <Ticket size={20} /> },
      { label: 'Attendance', path: '/app/attendance', icon: <Clock size={20} /> },
      { label: 'Payroll', path: '/app/payroll', icon: <DollarSign size={20} /> }
    ];
  } else {
    // Admin / Sales / HR Views
    menuItems = [
      { label: 'Dashboard', path: '/app/dashboard', icon: <LayoutDashboard size={20} />, allowed: true },
      { label: 'Contacts', path: '/app/contacts', icon: <Users size={20} />, allowed: isAdmin || isSales },
      { label: 'Sales Pipeline', path: '/app/sales', icon: <Files size={20} />, allowed: isAdmin || isSales },
      { label: 'Products', path: '/app/products', icon: <Package size={20} />, allowed: isAdmin || isSales },
      { label: 'Invoices', path: '/app/invoices', icon: <Receipt size={20} />, allowed: isAdmin },
      { label: 'User Directory', path: '/app/users', icon: <UserPlus size={20} />, allowed: isAdmin || isHR },
      { label: 'Tasks', path: '/app/tasks', icon: <ListTodo size={20} />, allowed: true },
      { label: 'Calendar', path: '/app/calendar', icon: <Calendar size={20} />, allowed: true },
      { label: 'Support Tickets', path: '/app/tickets', icon: <Ticket size={20} />, allowed: true },
      { label: 'Attendance', path: '/app/attendance', icon: <Clock size={20} />, allowed: true },
      { label: 'Payroll', path: '/app/payroll', icon: <DollarSign size={20} />, allowed: true }
    ].filter(item => item.allowed);
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 h-screen fixed left-0 top-0 flex flex-col z-50 shadow-xs font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
           style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Brand Header */}
      <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
            <Logo size={32} variant="dark" />
            <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">Velora CRM</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{role || 'Employee'} Portal</span>
            </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-5 overflow-y-auto">
        <ul className="flex flex-col gap-1.5">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                  isActive 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Footer Actions */}
      <div className="p-4 space-y-1 border-t border-slate-100 shrink-0">
        <NavLink 
          to="/app/settings"
          className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm w-full ${
            isActive 
            ? 'bg-slate-900 text-white shadow-md' 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>

        <button 
          type="button"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm w-full text-rose-600 hover:bg-rose-50 cursor-pointer border-none bg-transparent" 
          onClick={logout}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;



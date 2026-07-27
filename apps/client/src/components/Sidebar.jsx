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

  // Define Category Groups
  const groupDefinitions = [
    {
      id: 'crm',
      title: 'CRM & Sales',
      icon: <Building2 size={18} />,
      items: [
        { label: 'Contacts', path: '/app/contacts', icon: <Users size={18} />, allowed: role === 'Admin' || role === 'Sales' || dept.includes('sales') || dept.includes('marketing') },
        { label: 'Sales Pipeline', path: '/app/sales', icon: <Files size={18} />, allowed: role === 'Admin' || role === 'Sales' || dept.includes('sales') || dept.includes('marketing') },
        { label: 'Products', path: '/app/products', icon: <Package size={18} />, allowed: role === 'Admin' || role === 'Sales' || dept.includes('sales') },
        { label: 'Invoices', path: '/app/invoices', icon: <Receipt size={18} />, allowed: role === 'Admin' }
      ]
    },
    {
      id: 'hr',
      title: 'People & HR',
      icon: <UserCheck size={18} />,
      items: [
        { label: 'User Management', path: '/app/users', icon: <UserPlus size={18} />, allowed: role === 'Admin' || role === 'HR' || dept.includes('human') || dept.includes('hr') },
        { label: 'Attendance', path: '/app/attendance', icon: <Clock size={18} />, allowed: role === 'Admin' || role === 'HR' || dept.includes('human') || dept.includes('hr') },
        { label: 'Payroll', path: '/app/payroll', icon: <DollarSign size={18} />, allowed: true }
      ]
    },
    {
      id: 'ops',
      title: 'Operations & Support',
      icon: <Wrench size={18} />,
      items: [
        { label: 'Tasks', path: '/app/tasks', icon: <ListTodo size={18} />, allowed: true },
        { label: 'Calendar', path: '/app/calendar', icon: <Calendar size={18} />, allowed: true },
        { label: 'Support Tickets', path: '/app/tickets', icon: <Ticket size={18} />, allowed: role === 'Admin' || dept.includes('support') || dept.includes('customer') || dept.includes('engineering') || role === 'Employee' }
      ]
    }
  ];

  // Filter items based on user permissions
  const activeGroups = groupDefinitions.map(group => ({
    ...group,
    items: group.items.filter(item => item.allowed)
  })).filter(group => group.items.length > 0);

  // Accordion open/close state
  const [openGroups, setOpenGroups] = useState({
    crm: currentPath.includes('/contacts') || currentPath.includes('/sales') || currentPath.includes('/products') || currentPath.includes('/invoices'),
    hr: currentPath.includes('/users') || currentPath.includes('/attendance') || currentPath.includes('/payroll'),
    ops: currentPath.includes('/tasks') || currentPath.includes('/calendar') || currentPath.includes('/tickets')
  });

  // Auto expand active group when location changes
  useEffect(() => {
    activeGroups.forEach(group => {
      const hasActiveChild = group.items.some(item => currentPath === item.path);
      if (hasActiveChild) {
        setOpenGroups(prev => ({ ...prev, [group.id]: true }));
      }
    });
  }, [currentPath]);

  const toggleGroup = (groupId) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 h-screen fixed left-0 top-0 flex flex-col z-50 shadow-xs font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
           style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Brand Header */}
      <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
            <Logo size={32} variant="dark" />
            <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">Velora CRM</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{role} Portal</span>
            </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
        
        {/* OVERVIEW SECTION */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Overview
          </div>
          <NavLink 
            to="/app/dashboard"
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
              isActive 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
        </div>

        {/* CATEGORY ACCORDION DROPDOWNS */}
        <div className="space-y-3">
          <div className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Workspace Modules
          </div>

          {activeGroups.map((group) => {
            const isOpen = !!openGroups[group.id];
            const hasActiveChild = group.items.some(item => currentPath === item.path);

            return (
              <div key={group.id} className="rounded-xl overflow-hidden">
                {/* Group Header Button */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    hasActiveChild && !isOpen
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-slate-500 shrink-0">{group.icon}</span>
                    <span className="whitespace-nowrap truncate">{group.title}</span>
                  </div>
                  <ChevronDown 
                    size={15} 
                    className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-slate-900' : ''}`} 
                  />
                </button>

                {/* Sub-items Dropdown */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.ul 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden space-y-1 pt-1.5 border-l-2 border-slate-100 ml-4 pl-2"
                    >
                      {group.items.map((item) => (
                        <li key={item.path}>
                          <NavLink 
                            to={item.path}
                            className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all font-bold text-xs sm:text-sm ${
                              isActive 
                              ? 'bg-slate-900 text-white shadow-xs' 
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <span className="opacity-80">{item.icon}</span>
                            <span>{item.label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
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
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm w-full text-rose-600 hover:bg-rose-50 cursor-pointer" 
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



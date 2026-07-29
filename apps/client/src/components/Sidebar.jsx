import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
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
  UserCheck,
  Wrench
} from 'lucide-react';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [newQuotesCount, setNewQuotesCount] = useState(0);

  const [openCategories, setOpenCategories] = useState({
    overview: true,
    sales: true,
    hr: true,
    ops: true
  });

  const toggleCategory = (catId) => {
    setOpenCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  useEffect(() => {
    if (!user || user.role === 'Client') return;
    const fetchNewQuotes = async () => {
        try {
            const res = await axios.get('/api/opportunities');
            const opps = res.data.data || [];
            const newOpps = opps.filter(o => o.stage === 'New' || o.stage === 'Lead' || o.stage === 'New Inquiry');
            setNewQuotesCount(newOpps.length);
        } catch (err) {
            // silent catch
        }
    };
    fetchNewQuotes();
    const interval = setInterval(fetchNewQuotes, 8000);
    return () => clearInterval(interval);
  }, [user]);

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
                type="button"
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm w-full text-rose-400 hover:bg-rose-500/10 cursor-pointer border-none bg-transparent" 
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

  // Department Dropdown Categories ONLY for Admin
  const adminCategories = [
      {
          id: 'overview',
          title: 'Executive Overview',
          icon: <LayoutDashboard size={16} />,
          items: [
              { label: 'Dashboard', path: '/app/dashboard', icon: <LayoutDashboard size={18} /> }
          ]
      },
      {
          id: 'sales',
          title: 'Sales & Revenue',
          icon: <Briefcase size={16} />,
          items: [
              { label: 'Contacts', path: '/app/contacts', icon: <Users size={18} /> },
              { label: 'Sales Pipeline', path: '/app/sales', icon: <Files size={18} />, hasBadge: true },
              { label: 'Products', path: '/app/products', icon: <Package size={18} /> },
              { label: 'Invoices', path: '/app/invoices', icon: <Receipt size={18} /> }
          ]
      },
      {
          id: 'hr',
          title: 'Workforce & HR',
          icon: <UserCheck size={16} />,
          items: [
              { label: 'User Directory', path: '/app/users', icon: <UserPlus size={18} /> },
              { label: 'Attendance', path: '/app/attendance', icon: <Clock size={18} /> },
              { label: 'Payroll', path: '/app/payroll', icon: <DollarSign size={18} /> }
          ]
      },
      {
          id: 'ops',
          title: 'Operations & Tickets',
          icon: <Wrench size={16} />,
          items: [
              { label: 'Tasks', path: '/app/tasks', icon: <ListTodo size={18} /> },
              { label: 'Calendar', path: '/app/calendar', icon: <Calendar size={18} /> },
              { label: 'Support Tickets', path: '/app/tickets', icon: <Ticket size={18} /> }
          ]
      }
  ];

  // Flat menu list for Non-Admin Staff (Sales, HR, Employee)
  let menuItems = [];
  if (isEmployeeOnly) {
    menuItems = [
      { label: 'Dashboard', path: '/app/dashboard', icon: <LayoutDashboard size={20} /> },
      { label: 'My Tasks', path: '/app/tasks', icon: <ListTodo size={20} /> },
      { label: 'Calendar', path: '/app/calendar', icon: <Calendar size={20} /> },
      { label: 'Support Tickets', path: '/app/tickets', icon: <Ticket size={20} /> },
      { label: 'Attendance', path: '/app/attendance', icon: <Clock size={20} /> },
      { label: 'Payroll', path: '/app/payroll', icon: <DollarSign size={20} /> }
    ];
  } else {
    menuItems = [
      { label: 'Dashboard', path: '/app/dashboard', icon: <LayoutDashboard size={20} />, allowed: true },
      { label: 'Contacts', path: '/app/contacts', icon: <Users size={20} />, allowed: isSales },
      { label: 'Sales Pipeline', path: '/app/sales', icon: <Files size={20} />, allowed: isSales },
      { label: 'Products', path: '/app/products', icon: <Package size={20} />, allowed: isSales },
      { label: 'User Directory', path: '/app/users', icon: <UserPlus size={20} />, allowed: isHR },
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
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {isAdmin ? (
            /* ADMIN CATEGORIZED DROPDOWN ACCORDION VIEW */
            <div className="space-y-2.5">
                {adminCategories.map(cat => {
                    const isOpen = openCategories[cat.id];
                    const hasActiveChild = cat.items.some(i => i.path === currentPath);

                    return (
                        <div key={cat.id} className="rounded-xl border border-slate-200/60 bg-slate-50/40 overflow-hidden transition-all">
                            <button
                                type="button"
                                onClick={() => toggleCategory(cat.id)}
                                className={`w-full px-3 py-2 flex items-center justify-between transition-colors text-[11px] font-black uppercase tracking-wider cursor-pointer border-none bg-transparent ${
                                    hasActiveChild ? 'text-slate-900 font-extrabold' : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400">{cat.icon}</span>
                                    <span>{cat.title}</span>
                                </div>
                                <motion.div
                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="text-slate-400"
                                >
                                    <ChevronDown size={14} />
                                </motion.div>
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.ul
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.18 }}
                                        className="px-2 pb-2 space-y-1 overflow-hidden"
                                    >
                                        {cat.items.map(item => (
                                            <li key={item.path}>
                                                <NavLink
                                                    to={item.path}
                                                    className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all font-bold text-xs ${
                                                        isActive
                                                        ? 'bg-slate-900 text-white shadow-xs'
                                                        : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                                                    }`}
                                                >
                                                    <span className="shrink-0">{item.icon}</span>
                                                    <span>{item.label}</span>
                                                    {item.hasBadge && newQuotesCount > 0 && (
                                                        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-2xs animate-pulse">
                                                            {newQuotesCount}
                                                        </span>
                                                    )}
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
        ) : (
            /* NON-ADMIN STAFF VIEW (Sales, HR, Employee) -> Flat List */
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
                    {item.path === '/app/sales' && newQuotesCount > 0 && (
                        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-2xs animate-pulse">
                            {newQuotesCount}
                        </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
        )}
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

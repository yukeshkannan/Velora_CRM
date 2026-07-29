import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, User, Edit2, Trash2, Clock, CheckCircle2, Search, TrendingUp, AlertCircle, LayoutGrid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Tickets = () => {
    const { user } = useAuth();
    const isClient = user?.role === 'Client';
    const [tickets, setTickets] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [viewMode, setViewMode] = useState('kanban');
    const [draggedTicket, setDraggedTicket] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('All');
    
    // Columns Configuration
    const columns = [
        { id: 'Open', title: 'Open', color: '#3b82f6' },           // Blue
        { id: 'In Progress', title: 'In Progress', color: '#eab308' }, // Yellow
        { id: 'Resolved', title: 'Resolved', color: '#22c55e' },    // Green
        { id: 'Rejected', title: 'Rejected', color: '#ef4444' }     // Red
    ];

    const [editingTicket, setEditingTicket] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [formData, setFormData] = useState({
        title: '', description: '', priority: 'Medium', status: 'Open', customerId: '', assignedTo: ''
    });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const ticketUrl = isClient ? `/api/tickets?email=${user?.email}` : '/api/tickets';
            
            const ticketReq = axios.get(ticketUrl);
            const contactReq = !isClient ? axios.get('/api/contacts') : Promise.resolve({ data: { data: [] } });
            const userReq = !isClient ? axios.get('/api/auth/users') : Promise.resolve({ data: { data: [] } });

            const [ticketRes, contactRes, userRes] = await Promise.all([
                ticketReq, contactReq, userReq
            ]);
            
            let allTickets = ticketRes.data.data || [];
            
            // Filter: Only show assigned tickets for Employees
            // Admins see EVERYTHING
            if (user?.role === 'Employee') {
                allTickets = allTickets.filter(t => {
                    const assignedId = typeof t.assignedTo === 'object' ? t.assignedTo?._id : t.assignedTo;
                    const currentUserId = user.id || user._id;
                    return assignedId === currentUserId;
                });
            }

            // Filter: Clients only see their own tickets
            if (user?.role === 'Client') {
                allTickets = allTickets.filter(t => {
                    const matchesEmail = t.guestEmail === user.email;
                    return matchesEmail;
                });
            }

            setTickets(allTickets);
            setContacts(contactRes.data.data || []);
            setUsers(userRes.data?.data || []);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch data", err);
            setLoading(false);
        }
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Restriction Check for non-admins trying to Reject
        if (formData.status === 'Rejected' && user?.role !== 'Admin') {
            toast.error("Only Admins can Reject tickets!");
            return;
        }

        // Restriction Check for non-admins/non-employees trying to Resolve
        if (formData.status === 'Resolved' && !['Admin', 'Employee'].includes(user?.role)) {
            toast.error("Insufficient permissions to Resolve tickets!");
            return;
        }

        try {
            const payload = { ...formData };
            if (isClient) {
                payload.guestEmail = user.email;
                payload.guestName = user.name;
                if (!editingTicket) {
                    payload.status = 'Open';
                    payload.assignedTo = '';
                }
            }

            // Clean up empty object IDs to prevent Mongoose CastErrors (400 Bad Request)
            if (payload.assignedTo === '') delete payload.assignedTo;
            if (payload.customerId === '') delete payload.customerId;

            if (editingTicket) {
                await axios.put(`/api/tickets/${editingTicket._id}`, payload);
                toast.success("Ticket updated successfully!");
            } else {
                await axios.post('/api/tickets', payload);
                toast.success("Ticket created successfully!");
            }
            fetchData();
            handleCloseDrawer();
        } catch (err) {
            toast.error('Failed to save ticket');
        }
    };

    const handleDragStart = (e, ticket) => {
        setDraggedTicket(ticket);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, targetStatus) => {
        e.preventDefault();
        if (!draggedTicket || draggedTicket.status === targetStatus) return;

        // Restriction Check for non-admins trying to drag to Rejected
        if (targetStatus === 'Rejected' && user?.role !== 'Admin') {
            toast.error("Only Admins can Reject tickets!");
            return;
        }

        // Restriction Check for non-admins/non-employees trying to drag to Resolved
        if (targetStatus === 'Resolved' && !['Admin', 'Employee'].includes(user?.role)) {
            toast.error("Insufficient permissions to Resolve tickets!");
            return;
        }

        // Optimistic UI update
        const updatedTicket = { ...draggedTicket, status: targetStatus };
        setTickets(prev => prev.map(t => t._id === draggedTicket._id ? updatedTicket : t));

        try {
            await axios.put(`/api/tickets/${draggedTicket._id}`, { status: targetStatus });
            toast.success(`Ticket moved to ${targetStatus}`);
        } catch (err) {
            console.error("Failed to update status", err);
            toast.error("Failed to update ticket status");
            fetchData(); // rollback
        }
        setDraggedTicket(null);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/tickets/${id}`);
            setTickets(prev => prev.filter(t => t._id !== id));
            setShowDeleteConfirm(null);
            setIsDrawerOpen(false);
            toast.success("Ticket deleted successfully!");
        } catch (err) {
            console.error("Failed to delete ticket", err);
            toast.error(err.response?.data?.message || "Failed to delete ticket");
        }
    };

    const handleEdit = (ticket) => {
        setEditingTicket(ticket);
        setFormData({
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            status: ticket.status,
            customerId: ticket.customerId?._id || ticket.customerId || '',
            assignedTo: ticket.assignedTo?._id || ticket.assignedTo || ''
        });
        setIsDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setEditingTicket(null);
        setFormData({ title: '', description: '', priority: 'Medium', status: 'Open', customerId: '', assignedTo: '' });
    };

    const getPriorityStyle = (priority) => {
        switch(priority) {
            case 'Critical': return 'bg-rose-50 text-rose-700 border border-rose-200';
            case 'High': return 'bg-amber-50 text-amber-700 border border-amber-200';
            case 'Medium': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    };

    if (loading) return <LoadingSpinner message="Loading Support Board..." />;

    const filteredTickets = tickets.filter(t => {
        const contact = contacts.find(c => c._id === (t.customerId?._id || t.customerId));
        const customerName = contact ? contact.name : (t.guestName || '');
        const matchesSearch = (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                              customerName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
        return matchesSearch && matchesPriority;
    });

    const totalTicketsCount = tickets.length;
    const openTicketsCount = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
    const resolvedTicketsCount = tickets.filter(t => t.status === 'Resolved').length;
    const highPriorityCount = tickets.filter(t => t.priority === 'High' || t.priority === 'Critical').length;

    const getColumnAccent = (colId) => {
        switch(colId) {
            case 'Open': return 'bg-indigo-600';
            case 'In Progress': return 'bg-amber-600';
            case 'Resolved': return 'bg-emerald-600';
            case 'Rejected': return 'bg-rose-600';
            default: return 'bg-slate-400';
        }
    };

    const getColumnDotColor = (colId) => {
        switch(colId) {
            case 'Open': return 'bg-indigo-500';
            case 'In Progress': return 'bg-amber-500';
            case 'Resolved': return 'bg-emerald-500';
            case 'Rejected': return 'bg-rose-500';
            default: return 'bg-slate-400';
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
             style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* Executive Header */}
            <div className="bg-white border-b border-slate-200/80 px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                     <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Support Tickets</h1>
                     <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">Manage, track, and resolve customer support tickets efficiently.</p>
                </div>
                  <div className="flex items-center gap-3">
                    {!isClient && (
                        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
                            <button 
                                onClick={() => setViewMode('kanban')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border-none cursor-pointer ${
                                    viewMode === 'kanban' 
                                    ? 'bg-slate-900 text-white shadow-xs' 
                                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                                }`}
                            >
                                Board
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border-none cursor-pointer ${
                                    viewMode === 'list' 
                                    ? 'bg-slate-900 text-white shadow-xs' 
                                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                                }`}
                            >
                                List
                            </button>
                        </div>
                    )}
                    <button 
                        onClick={() => { handleCloseDrawer(); setIsDrawerOpen(true); }}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 transition-all cursor-pointer border-none"
                    >
                        <Plus size={16} /> New Ticket
                    </button>
                </div>
            </div>

            {/* Scrollable Body Content Area */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6 max-w-[1600px] w-full mx-auto">
                
                {/* KPI Metrics Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Tickets</p>
                            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{totalTicketsCount}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/60 text-slate-900 flex items-center justify-center font-bold">
                            <LayoutGrid size={22} />
                        </div>
                    </div>

                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Open & Active</p>
                            <p className="text-2xl sm:text-3xl font-black text-indigo-700 mt-1">{openTicketsCount}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                            <Clock size={22} />
                        </div>
                    </div>

                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Resolved</p>
                            <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">{resolvedTicketsCount}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            <CheckCircle2 size={22} />
                        </div>
                    </div>

                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Critical / High</p>
                            <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">{highPriorityCount}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center justify-center font-bold">
                            <AlertCircle size={22} />
                        </div>
                    </div>
                </div>

                {/* Toolbar Search & Filter Bar */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative max-w-md w-full">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search tickets by title, customer, or description..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1 shrink-0">Priority:</span>
                        {['All', 'Critical', 'High', 'Medium', 'Low'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPriorityFilter(p)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                    priorityFilter === p 
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' 
                                        : 'bg-slate-100 text-slate-600 border-slate-200/80 hover:bg-slate-200/80'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
                {viewMode === 'list' || isClient ? (
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100/70 border-b border-slate-200/80">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle">Ticket Details</th>
                                    {!isClient && <th className="px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle">Customer</th>}
                                    {!isClient && <th className="px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle">Assignee</th>}
                                    <th className="px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle">Priority</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle">Status</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTickets.map(ticket => {
                                    const contact = contacts.find(c => c._id === (ticket.customerId?._id || ticket.customerId));
                                    const assignedUser = users.find(u => u._id === (ticket.assignedTo?._id || ticket.assignedTo));
                                    return (
                                        <tr key={ticket._id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-extrabold text-sm sm:text-base text-slate-900">{ticket.title}</div>
                                                <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[240px] font-medium">{ticket.description}</div>
                                            </td>
                                            {!isClient && (
                                                <td className="px-6 py-4">
                                                    {contact ? (
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{contact.name}</div>
                                                            <div className="text-[11px] text-slate-400 font-medium">{contact.company || 'Direct'}</div>
                                                        </div>
                                                    ) : <span className="text-slate-400 italic text-xs">--</span>}
                                                </td>
                                            )}
                                            {!isClient && (
                                                <td className="px-6 py-4">
                                                    {assignedUser ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-extrabold border border-slate-200">
                                                                {assignedUser.name.charAt(0)}
                                                            </div>
                                                            <span className="font-bold text-xs text-slate-800">{assignedUser.name}</span>
                                                        </div>
                                                    ) : <span className="text-slate-400 italic text-xs">Unassigned</span>}
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${getPriorityStyle(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                                                    ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    ticket.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                    ticket.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                }`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <button onClick={() => handleEdit(ticket)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-800 transition-colors border-none bg-transparent cursor-pointer" title="Edit Ticket">
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button onClick={() => setShowDeleteConfirm(ticket)} className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-colors border-none bg-transparent cursor-pointer" title="Delete Ticket">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredTickets.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-slate-400 font-bold text-sm">No support tickets found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                        {columns.map(col => {
                            const colTickets = filteredTickets.filter(t => t.status === col.id);
                            return (
                                <div 
                                    key={col.id} 
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, col.id)}
                                    className="bg-white border border-slate-200/90 rounded-2xl flex flex-col shadow-2xs overflow-hidden min-h-[460px]"
                                >
                                    {/* Column Top Accent Line */}
                                    <div className={`h-1.5 w-full ${getColumnAccent(col.id)}`} />

                                    {/* Executive Column Header */}
                                    <div className="p-4 border-b border-slate-200/80 bg-white sticky top-0 z-10 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <span className={`w-2.5 h-2.5 rounded-full ${getColumnDotColor(col.id)}`} />
                                            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">{col.title}</h3>
                                        </div>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200/80">
                                            {colTickets.length}
                                        </span>
                                    </div>
                                    
                                    {/* Column Content Area */}
                                    <div className="p-4 space-y-3.5 overflow-y-auto flex-1 min-h-[200px] bg-slate-50/40 rounded-b-2xl transition-colors duration-200">
                                        {colTickets.map(t => {
                                            const contact = contacts.find(c => c._id === (t.customerId?._id || t.customerId));
                                            const assignedUser = users.find(u => u._id === (t.assignedTo?._id || t.assignedTo));
                                            return (
                                                <div 
                                                    key={t._id} 
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, t)}
                                                    onClick={() => handleEdit(t)}
                                                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing group relative text-left"
                                                >
                                                    {/* Action buttons on card hover */}
                                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10" onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => handleEdit(t)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors bg-transparent border-none cursor-pointer" title="Edit">
                                                            <Edit2 size={13} />
                                                        </button>
                                                        <button onClick={() => setShowDeleteConfirm(t)} className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors bg-transparent border-none cursor-pointer" title="Delete">
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>

                                                    <div className="mb-2">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getPriorityStyle(t.priority)}`}>
                                                            {t.priority}
                                                        </span>
                                                    </div>

                                                    <h4 className="font-extrabold text-slate-900 text-sm mb-1 leading-snug hover:text-slate-700 transition-colors">{t.title}</h4>
                                                    <p className="text-slate-500 text-xs line-clamp-2 mb-3 font-medium leading-relaxed">{t.description}</p>
                                                    
                                                    {/* Footer Metadata */}
                                                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-xs text-slate-500 font-bold">
                                                        <span className="truncate max-w-[100px]" title={contact ? contact.name : t.guestName || 'Direct'}>
                                                            {contact ? contact.name : t.guestName || 'Direct'}
                                                        </span>
                                                        {assignedUser ? (
                                                            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/60">
                                                                <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[8px] font-black">
                                                                    {assignedUser.name.charAt(0)}
                                                                </div>
                                                                <span className="font-extrabold text-slate-800 text-[10px] truncate max-w-[70px]">{assignedUser.name.split(' ')[0]}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {colTickets.length === 0 && (
                                            <div className="border-2 border-dashed border-slate-200/80 rounded-2xl py-10 px-4 text-center text-slate-400 text-xs bg-white">
                                                <p className="font-extrabold text-slate-700 uppercase tracking-wider text-[11px]">Empty Stage</p>
                                                <p className="text-[11px] text-slate-400 mt-1 font-medium">Drag tickets here</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>


            {/* Drawer */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40" 
                            onClick={handleCloseDrawer} 
                        />
                        <motion.div 
                            initial={{ x: '100%', opacity: 0.5 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="fixed top-0 right-0 bottom-0 w-full sm:w-[500px] bg-white z-50 shadow-2xl flex flex-col border-l border-slate-200/80"
                        >
                            {/* Drawer Header */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{editingTicket ? 'Edit Ticket' : 'New Ticket'}</h2>
                                    <p className="text-slate-500 text-sm mt-0.5">{editingTicket ? 'Update ticket details.' : 'Create a new support ticket.'}</p>
                                </div>
                                <button onClick={handleCloseDrawer} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors border-none bg-transparent cursor-pointer"><X size={20} /></button>
                            </div>
                            
                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto p-8">
                                <form id="ticketForm" onSubmit={handleSubmit} className="space-y-5">
                                    
                                    {/* Subject - Full Width */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Subject <span className="text-red-500">*</span></label>
                                        <input 
                                            required 
                                            type="text" 
                                            value={formData.title} 
                                            onChange={e => setFormData({...formData, title: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all text-sm font-medium" 
                                            placeholder="e.g. Login page error" 
                                        />
                                    </div>

                                    {/* Priority & Status - Grid */}
                                    <div className="grid grid-cols-2 gap-5">
                                         <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Priority</label>
                                            <div className="relative">
                                                <select 
                                                    value={formData.priority} 
                                                    onChange={e => setFormData({...formData, priority: e.target.value})}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 appearance-none text-sm font-medium cursor-pointer"
                                                >
                                                    {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Status</label>
                                            {(!editingTicket && user?.role !== 'Admin') ? (
                                                <div className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-extrabold text-indigo-700 flex items-center gap-2 select-none">
                                                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                                                    Open (Default for New Tickets)
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <select 
                                                        value={formData.status} 
                                                        onChange={e => setFormData({...formData, status: e.target.value})}
                                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 appearance-none text-sm font-medium cursor-pointer"
                                                    >
                                                        {columns.map(c => {
                                                            const isCurrent = formData.status === c.id;
                                                            const isRestricted = (c.id === 'Resolved' || c.id === 'Rejected') && user?.role !== 'Admin';
                                                            if (isRestricted && !isCurrent) return null;
                                                            return <option key={c.id} value={c.id}>{c.title}</option>;
                                                        })}
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {(!isClient || user?.role === 'Admin') && (
                                         <div className="grid grid-cols-2 gap-5">
                                             <div>
                                                 <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Ticket Submitter</label>
                                                 {editingTicket ? (
                                                     <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-extrabold text-xs text-slate-900 flex flex-col justify-center">
                                                         <span>
                                                             {contacts.find(c => c._id === (editingTicket.customerId?._id || editingTicket.customerId))?.name || editingTicket.guestName || editingTicket.guestEmail || 'Client Request'}
                                                         </span>
                                                         {editingTicket.guestEmail && <span className="text-[10px] text-slate-400 font-bold">{editingTicket.guestEmail}</span>}
                                                     </div>
                                                 ) : (
                                                     <div className="relative">
                                                         <select 
                                                             value={formData.customerId} 
                                                             onChange={e => setFormData({...formData, customerId: e.target.value})}
                                                             className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 appearance-none text-sm font-medium cursor-pointer"
                                                         >
                                                             <option value="">Select Customer...</option>
                                                             {contacts.map(c => (
                                                                 <option key={c._id} value={c._id}>{c.name} ({c.company || c.email})</option>
                                                             ))}
                                                         </select>
                                                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                         </div>
                                                     </div>
                                                 )}
                                             </div>
                                             <div>
                                                 <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Assignee Staff</label>
                                                 <div className="relative">
                                                     <select 
                                                         value={formData.assignedTo} 
                                                         onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                                                         className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 appearance-none text-sm font-medium cursor-pointer"
                                                     >
                                                         <option value="">Unassigned</option>
                                                         {users.filter(u => u.role && u.role !== 'Client').map(u => (
                                                             <option key={u._id} value={u._id}>{u.name} ({u.role || 'Staff'})</option>
                                                         ))}
                                                     </select>
                                                     <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
                                     )}

                                    {/* Description - Full Width */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Description</label>
                                        <textarea 
                                            rows={5} 
                                            value={formData.description} 
                                            onChange={e => setFormData({...formData, description: e.target.value})}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all resize-none text-sm" 
                                            placeholder="Detailed description of the issue..."
                                        />
                                    </div>

                                    {editingTicket && (
                                         <div className="pt-4 border-t border-slate-100">
                                            <button type="button" onClick={() => setShowDeleteConfirm(editingTicket)}
                                                className="w-full text-red-600 bg-red-50 hover:bg-red-100 py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm border-none cursor-pointer">
                                                <Trash2 size={16} /> Delete Ticket
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                            
                            {/* Drawer Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                                <button onClick={handleCloseDrawer} className="flex-1 text-slate-600 font-bold hover:bg-slate-200 py-2.5 rounded-xl transition-colors text-sm border-none bg-transparent cursor-pointer">Cancel</button>
                                <button form="ticketForm" type="submit" className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-slate-800 shadow-xs transition-colors text-sm border-none cursor-pointer">
                                    {editingTicket ? 'Save Changes' : 'Create Ticket'}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

             {/* Delete Overlay */}
             {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl w-[400px] text-center shadow-2xl animate-in zoom-in duration-200">
                        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Delete Ticket?</h3>
                        <p className="text-slate-500 my-4">Are you sure you want to delete <strong>{showDeleteConfirm.title}</strong>?</p>
                        <div className="flex gap-4 justify-center">
                            <button className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                            <button className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 transition-colors" onClick={() => handleDelete(showDeleteConfirm._id)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tickets;

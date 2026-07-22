import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, X, User, Edit2, Trash2, Clock, CheckCircle } from 'lucide-react';
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
        } catch (err) {
            console.error("Failed to delete", err);
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
            case 'Critical': return 'bg-red-100 text-red-600';
            case 'High': return 'bg-orange-100 text-orange-600';
            case 'Medium': return 'bg-blue-50 text-blue-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };



    if (loading) return <LoadingSpinner message="Loading Support Board..." />;

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center">
                <div>
                     <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Tickets</h1>
                     <p className="text-slate-500 text-sm mt-1">Manage, track, and resolve customer support tickets efficiently.</p>
                </div>
                  <div className="flex items-center gap-4">
                    {!isClient && (
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button 
                                onClick={() => setViewMode('kanban')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                                    viewMode === 'kanban' 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-900 bg-transparent'
                                }`}
                            >
                                Board
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                                    viewMode === 'list' 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-900 bg-transparent'
                                }`}
                            >
                                List
                            </button>
                        </div>
                    )}
                    <button 
                        onClick={() => { handleCloseDrawer(); setIsDrawerOpen(true); }}
                        className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2 border-none cursor-pointer"
                    >
                        <Plus size={18} /> New Ticket
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                {viewMode === 'list' || isClient ? (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-600">Ticket Details</th>
                                    {!isClient && <th className="px-6 py-4 font-bold text-slate-600">Customer</th>}
                                    {!isClient && <th className="px-6 py-4 font-bold text-slate-600">Assignee</th>}
                                    <th className="px-6 py-4 font-bold text-slate-600">Priority</th>
                                    <th className="px-6 py-4 font-bold text-slate-600">Status</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tickets.map(ticket => {
                                    const contact = contacts.find(c => c._id === (ticket.customerId?._id || ticket.customerId));
                                    const assignedUser = users.find(u => u._id === (ticket.assignedTo?._id || ticket.assignedTo));
                                    return (
                                        <tr key={ticket._id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{ticket.title}</div>
                                                <div className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{ticket.description}</div>
                                            </td>
                                            {!isClient && (
                                                <td className="px-6 py-4">
                                                    {contact ? (
                                                        <div>
                                                            <div className="font-bold text-slate-700">{contact.name}</div>
                                                            <div className="text-[10px] text-slate-400">{contact.company || 'Direct'}</div>
                                                        </div>
                                                    ) : <span className="text-slate-400 italic">--</span>}
                                                </td>
                                            )}
                                            {!isClient && (
                                                <td className="px-6 py-4">
                                                    {assignedUser ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                                                {assignedUser.name.charAt(0)}
                                                            </div>
                                                            <span className="font-medium text-slate-700">{assignedUser.name}</span>
                                                        </div>
                                                    ) : <span className="text-slate-400 italic">Unassigned</span>}
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded text-xs font-bold ${getPriorityStyle(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                                    ticket.status === 'Resolved' ? 'bg-green-50 text-green-600 border-green-200' :
                                                    ticket.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                                                    ticket.status === 'In Progress' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                    'bg-blue-50 text-blue-600 border-blue-200'
                                                }`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <button onClick={() => handleEdit(ticket)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors" title="Edit Ticket">
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button onClick={() => setShowDeleteConfirm(ticket)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors" title="Delete Ticket">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {tickets.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-slate-400">No tickets found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {columns.map(col => {
                            const colTickets = tickets.filter(t => t.status === col.id);
                            return (
                                <div 
                                    key={col.id} 
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, col.id)}
                                    className="bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm max-h-[75vh]"
                                >
                                    {/* Column Header matching Opportunities style */}
                                    <div className="p-5 border-b border-slate-200 bg-white rounded-t-2xl flex flex-col gap-2 shrink-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-extrabold text-sm text-slate-800 tracking-tight uppercase">{col.title}</h3>
                                            <span 
                                                className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100"
                                                style={{ backgroundColor: col.color + '15', color: col.color, borderColor: col.color + '30' }}
                                            >
                                                {colTickets.length}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden mr-4">
                                                <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: col.color }}></div>
                                            </div>
                                            <div className="text-sm text-slate-900 font-extrabold">
                                                {colTickets.length}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Column Content Area */}
                                    <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-[180px] bg-slate-50/50 rounded-b-2xl transition-colors duration-200">
                                        {colTickets.map(t => {
                                            const contact = contacts.find(c => c._id === (t.customerId?._id || t.customerId));
                                            const assignedUser = users.find(u => u._id === (t.assignedTo?._id || t.assignedTo));
                                            return (
                                                <div 
                                                    key={t._id} 
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, t)}
                                                    onClick={() => handleEdit(t)}
                                                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all cursor-grab active:cursor-grabbing group relative text-left"
                                                >
                                                    {/* Action buttons on card hover */}
                                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1" onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => handleEdit(t)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors bg-transparent border-none cursor-pointer" title="Edit">
                                                            <Edit2 size={13} />
                                                        </button>
                                                        <button onClick={() => setShowDeleteConfirm(t)} className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors bg-transparent border-none cursor-pointer" title="Delete">
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>

                                                    <div className="mb-2.5">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${getPriorityStyle(t.priority)}`}>
                                                            {t.priority}
                                                        </span>
                                                    </div>

                                                    <h4 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1">{t.title}</h4>
                                                    <p className="text-slate-500 text-xs line-clamp-2 mb-3.5 leading-relaxed">{t.description}</p>
                                                    
                                                    {/* Footer Metadata */}
                                                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
                                                        <span className="truncate max-w-[90px]" title={contact ? contact.name : t.guestName || 'Direct'}>
                                                            {contact ? contact.name : t.guestName || 'Direct'}
                                                        </span>
                                                        {assignedUser ? (
                                                            <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                                                <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[8px] font-bold">
                                                                    {assignedUser.name.charAt(0)}
                                                                </div>
                                                                <span className="font-bold text-slate-700 truncate max-w-[60px]">{assignedUser.name.split(' ')[0]}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 italic">Unassigned</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {colTickets.length === 0 && (
                                            <div className="border-2 border-dashed border-slate-200 rounded-xl py-8 px-4 text-center text-slate-400 text-sm bg-white">
                                                <p className="font-bold text-slate-700">Empty Stage</p>
                                                <p className="text-xs text-slate-400 mt-1">Drag tickets here</p>
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
            {isDrawerOpen && (
                <>
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={handleCloseDrawer} />
                    <div className="fixed top-0 right-0 bottom-0 w-[500px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{editingTicket ? 'Edit Ticket' : 'New Ticket'}</h2>
                                <p className="text-slate-500 text-sm mt-0.5">{editingTicket ? 'Update ticket details.' : 'Create a new support ticket.'}</p>
                            </div>
                            <button onClick={handleCloseDrawer} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
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
                                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 appearance-none text-sm font-medium"
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
                                        {isClient ? (
                                            <div className="px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 select-none">
                                                {formData.status}
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <select 
                                                    value={formData.status} 
                                                    onChange={e => setFormData({...formData, status: e.target.value})}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 appearance-none text-sm font-medium"
                                                >
                                                    {columns.map(c => {
                                                        const isCurrent = formData.status === c.id;
                                                        // Only Admin can see/select 'Rejected' (unless it's already rejected)
                                                        if (!isCurrent && c.id === 'Rejected' && user?.role !== 'Admin') return null;
                                                        // Only Admin and Employee can see/select 'Resolved' (unless it's already resolved)
                                                        if (!isCurrent && c.id === 'Resolved' && !['Admin', 'Employee'].includes(user?.role)) return null;
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

                                {/* Customer & Assignee - Grid */}
                                {!isClient && (
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Customer <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <select 
                                                    required={!isClient} 
                                                    value={formData.customerId} 
                                                    onChange={e => setFormData({...formData, customerId: e.target.value})}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 appearance-none text-sm font-medium"
                                                >
                                                    <option value="">Select Customer...</option>
                                                    {contacts.map(c => (
                                                        <option key={c._id} value={c._id}>
                                                            {c.name} {c.company ? `(${c.company})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Assign To</label>
                                            <div className="relative">
                                                <select 
                                                    value={formData.assignedTo} 
                                                    onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 appearance-none text-sm font-medium"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {users.map(u => (
                                                        <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
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
                                            className="w-full text-red-600 bg-red-50 hover:bg-red-100 py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm">
                                            <Trash2 size={16} /> Delete Ticket
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                        
                        {/* Drawer Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <button onClick={handleCloseDrawer} className="flex-1 text-slate-600 font-bold hover:bg-slate-200 py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
                            <button form="ticketForm" type="submit" className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors text-sm">
                                {editingTicket ? 'Save Changes' : 'Create Ticket'}
                            </button>
                        </div>
                    </div>
                </>
            )}

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

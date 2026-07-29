import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import toast from 'react-hot-toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
    Filter, Calendar as CalendarIcon, CheckSquare, DollarSign, 
    ChevronLeft, ChevronRight, Clock, Plus, Receipt, X, LayoutGrid, List,
    Target, Zap, Briefcase, Trash2, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const localizer = momentLocalizer(moment);

const Calendar = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());
    const [filter, setFilter] = useState({ tasks: true, opportunities: true, invoices: true });
    const [contacts, setContacts] = useState([]);
    const [users, setUsers] = useState([]);
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditingEvent, setIsEditingEvent] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [editEventData, setEditEventData] = useState({
        id: '',
        title: '',
        type: 'task',
        priority: 'Medium',
        dueDate: '',
        hour: '09',
        minute: '00',
        period: 'AM',
        description: '',
        contactId: '',
        assignedTo: '',
        status: 'Pending'
    });

    const [newEventData, setNewEventData] = useState({
        title: '',
        type: 'Call',
        priority: 'Medium',
        dueDate: new Date().toISOString().split('T')[0],
        hour: '09',
        minute: '00',
        period: 'AM',
        description: '',
        contactId: '',
        assignedTo: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tasksRes, oppsRes, invRes, contactsRes, usersRes] = await Promise.all([
                axios.get('/api/tasks'),
                axios.get('/api/opportunities'),
                axios.get('/api/invoices'),
                axios.get('/api/contacts'),
                axios.get('/api/auth/users')
            ]);

            const currentUserId = user.id || user._id;

            let rawTasks = tasksRes.data.data || [];
            let rawOpps = oppsRes.data.data || [];
            const contactsData = contactsRes.data.data || [];
            const usersData = usersRes.data.data || [];

            setContacts(contactsData);
            setUsers(usersData.filter(u => u.role !== 'Client'));

            // Filter for Employees (Employees only see their assigned tasks, no sales pipeline or invoices)
            if (user?.role === 'Employee') {
                rawTasks = rawTasks.filter(t => {
                    const assignedId = typeof t.assignedTo === 'object' ? t.assignedTo?._id : t.assignedTo;
                    return assignedId === currentUserId;
                });
                rawOpps = [];
            }

            const taskEvents = rawTasks.map(task => {
                const contactObj = contactsData.find(c => String(c._id) === String(task.contactId));
                const userObj = usersData.find(u => String(u._id || u.id) === String(task.assignedTo));
                return {
                    id: task._id,
                    title: task.title,
                    start: new Date(task.dueDate),
                    end: new Date(task.dueDate),
                    type: 'task',
                    taskType: task.type || 'Call',
                    status: task.status,
                    priority: task.priority,
                    description: task.description || 'No description provided.',
                    contact: contactObj ? contactObj.name : 'N/A',
                    contactId: task.contactId || '',
                    assignedTo: userObj ? userObj.name : 'N/A',
                    assignedToId: task.assignedTo || ''
                };
            });

            const oppEvents = rawOpps.map(opp => {
                const contactObj = contactsData.find(c => String(c._id) === String(opp.contactId));
                const userObj = usersData.find(u => String(u._id || u.id) === String(opp.assignedTo));
                return {
                    id: opp._id,
                    title: opp.title,
                    start: new Date(opp.expectedCloseDate),
                    end: new Date(opp.expectedCloseDate),
                    type: 'opportunity',
                    stage: opp.stage,
                    amount: opp.amount,
                    description: `Sales Deal. Expected close: ${new Date(opp.expectedCloseDate).toLocaleDateString()}`,
                    contact: contactObj ? contactObj.name : 'N/A',
                    assignedTo: userObj ? userObj.name : 'N/A'
                };
            });

            const invoiceEvents = (invRes.data.data || []).map(inv => ({
                id: inv._id,
                title: `Invoice: #${inv._id.slice(-6).toUpperCase()}`,
                start: new Date(inv.dueDate),
                end: new Date(inv.dueDate),
                type: 'invoice',
                status: inv.status,
                totalAmount: inv.totalAmount,
                description: `Billing invoice generated for client.`,
                contact: inv.customerName || 'N/A',
                assignedTo: 'Finance Team'
            }));

            setEvents([...taskEvents, ...oppEvents, ...invoiceEvents]);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch calendar data", err);
            setLoading(false);
        }
    };

    const onNavigate = useCallback((newDate) => setDate(newDate), [setDate]);
    const onView = useCallback((newView) => setView(newView), [setView]);

    const handleFilterChange = (type) => {
        setFilter(prev => ({ ...prev, [type]: !prev[type] }));
    };

    const handleSaveEvent = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = { ...newEventData };
            if (!payload.assignedTo) payload.assignedTo = user?.id || user?._id;

            // Combine Date and Time
            let hh = parseInt(payload.hour);
            if (payload.period === 'PM' && hh < 12) hh += 12;
            if (payload.period === 'AM' && hh === 12) hh = 0;
            const hhStr = String(hh).padStart(2, '0');
            const formattedDueDate = `${payload.dueDate}T${hhStr}:${payload.minute}:00`;

            await axios.post('/api/tasks', {
                title: payload.title,
                type: payload.type,
                priority: payload.priority,
                dueDate: formattedDueDate,
                description: payload.description,
                contactId: payload.contactId,
                assignedTo: payload.assignedTo,
                status: 'Pending'
            });
            setShowCreateModal(false);
            setNewEventData({
                title: '',
                type: 'Call',
                priority: 'Medium',
                dueDate: new Date().toISOString().split('T')[0],
                hour: '09',
                minute: '00',
                period: 'AM',
                description: '',
                contactId: '',
                assignedTo: ''
            });
            toast.success("Task created successfully!");
            fetchData();
        } catch (err) {
            console.error("Failed to create task", err);
            toast.error(err.response?.data?.message || "Failed to create task");
            setLoading(false);
        }
    };

    const startEditEvent = () => {
        if (!selectedEvent || selectedEvent.type !== 'task') return;
        
        let hour = '09';
        let minute = '00';
        let period = 'AM';
        
        if (selectedEvent.start) {
            const d = new Date(selectedEvent.start);
            let hh = d.getHours();
            const mm = d.getMinutes();
            if (hh >= 12) {
                period = 'PM';
                if (hh > 12) hh -= 12;
            } else {
                period = 'AM';
                if (hh === 0) hh = 12;
            }
            hour = String(hh).padStart(2, '0');
            minute = String(mm).padStart(2, '0');
            // Round minutes to closest select item if needed, but keeping it direct is safer
            if (!['00', '15', '30', '45'].includes(minute)) {
                minute = '00';
            }
        }

        setEditEventData({
            id: selectedEvent.id,
            title: selectedEvent.title,
            type: selectedEvent.taskType || 'Call',
            priority: selectedEvent.priority || 'Medium',
            dueDate: selectedEvent.start ? new Date(selectedEvent.start).toISOString().split('T')[0] : '',
            hour,
            minute,
            period,
            description: selectedEvent.description || '',
            contactId: selectedEvent.contactId || '',
            assignedTo: selectedEvent.assignedToId || '',
            status: selectedEvent.status || 'Pending'
        });
        setIsEditingEvent(true);
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            let hh = parseInt(editEventData.hour);
            if (editEventData.period === 'PM' && hh < 12) hh += 12;
            if (editEventData.period === 'AM' && hh === 12) hh = 0;
            const hhStr = String(hh).padStart(2, '0');
            const formattedDueDate = `${editEventData.dueDate}T${hhStr}:${editEventData.minute}:00`;

            await axios.put(`/api/tasks/${editEventData.id}`, {
                title: editEventData.title,
                type: editEventData.type,
                priority: editEventData.priority,
                dueDate: formattedDueDate,
                description: editEventData.description,
                contactId: editEventData.contactId,
                assignedTo: editEventData.assignedTo,
                status: editEventData.status
            });
            toast.success("Task updated successfully");
            setIsEditingEvent(false);
            setSelectedEvent(null);
            fetchData();
        } catch (err) {
            console.error("Failed to update task", err);
            toast.error(err.response?.data?.message || "Failed to update task");
            setLoading(false);
        }
    };

    const handleDeleteEvent = (id) => {
        setShowDeleteConfirm(id);
    };

    const confirmDeleteTask = async () => {
        if (!showDeleteConfirm) return;
        try {
            setLoading(true);
            await axios.delete(`/api/tasks/${showDeleteConfirm}`);
            toast.success("Task deleted successfully");
            setIsEditingEvent(false);
            setSelectedEvent(null);
            setShowDeleteConfirm(null);
            fetchData();
        } catch (err) {
            console.error("Failed to delete task", err);
            toast.error(err.response?.data?.message || "Failed to delete task");
            setShowDeleteConfirm(null);
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(e => {
        if (e.type === 'task' && !filter.tasks) return false;
        if (e.type === 'opportunity' && !filter.opportunities) return false;
        if (e.type === 'invoice' && !filter.invoices) return false;
        
        // Final sanity check: Employees shouldn't see invoices on calendar even if filter is on
        if (user?.role === 'Employee' && e.type === 'invoice') return false;
        return true;
    });

    const eventStyleGetter = (event) => {
        return {
            style: {
                backgroundColor: 'transparent',
                color: '#3c4043',
                borderRadius: '4px',
                border: 'none',
                borderLeft: 'none',
                fontSize: '12px',
                fontWeight: 500,
                padding: '2px 6px',
                marginBottom: '2px',
                display: 'block',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                cursor: 'pointer'
            }
        };
    };

    const EventComponent = ({ event }) => {
        const isPaid = event.type === 'invoice' && event.status === 'Paid';
        const isCompleted = event.type === 'task' && event.status === 'Completed';

        let dotColor = '#1a73e8';
        if (event.type === 'task') {
            if (isCompleted) {
                dotColor = '#dadce0';
            } else if (event.priority === 'High') {
                dotColor = '#d93025'; // Red
            } else if (event.priority === 'Medium') {
                dotColor = '#f9ab00'; // Yellow/Orange
            } else {
                dotColor = '#1a73e8'; // Blue
            }
        } else if (event.type === 'opportunity') {
            dotColor = '#7986cb'; // Indigo
        } else if (event.type === 'invoice') {
            dotColor = '#33b679'; // Green
        }

        // Format time (e.g. "9 AM" or "12:30 PM")
        let timeStr = '';
        if (event.start) {
            const d = new Date(event.start);
            let hh = d.getHours();
            const mm = d.getMinutes();
            const period = hh >= 12 ? 'PM' : 'AM';
            if (hh > 12) hh -= 12;
            if (hh === 0) hh = 12;
            const mmStr = mm > 0 ? `:${String(mm).padStart(2, '0')}` : '';
            timeStr = `${hh}${mmStr} ${period}`;
        }

        return (
            <div className="flex items-center gap-2 overflow-hidden w-full py-0.5">
                <span 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: dotColor }}
                />
                {timeStr ? (
                    <span className={`text-xs font-bold text-[#3c4043] flex-shrink-0 ${isCompleted ? 'line-through text-[#9ca3af]' : ''}`}>
                        {timeStr}
                    </span>
                ) : (
                    <span className="text-[10px] font-bold text-[#70757a] flex-shrink-0">
                        All Day
                    </span>
                )}
                {isPaid && <span className="ml-auto text-[8px] font-bold bg-[#e6f4ea] text-[#137333] px-1 rounded-sm">PAID</span>}
            </div>
        );
    };

    if (loading) return <LoadingSpinner message="Orchestrating Schedule..." />;

    return (
        <div className="flex flex-col md:flex-row h-full bg-white overflow-hidden font-sans">
            
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 flex-shrink-0">
                <div className="space-y-4">
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-md rounded-full font-bold text-xs transition-all shadow-sm cursor-pointer w-[150px] justify-center inline-flex"
                    >
                        <Plus size={20} className="text-blue-500 font-bold" />
                        <span className="text-slate-700 font-bold text-sm tracking-tight">Create</span>
                    </button>
                </div>

                {/* Structured Filters */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">My Calendars</h3>
                        <div className="space-y-1">
                            {[
                                { id: 'tasks', label: 'Tasks', color: 'bg-[#1a73e8]', icon: Target },
                                { id: 'opportunities', label: 'Sales', color: 'bg-[#7986cb]', icon: Zap },
                                { id: 'invoices', label: 'Invoices', color: 'bg-[#33b679]', icon: Receipt },
                            ].filter(item => {
                                if (user?.role === 'Employee' && (item.id === 'opportunities' || item.id === 'invoices')) return false;
                                return true;
                            }).map((item) => (
                                <button 
                                    key={item.id}
                                    onClick={() => handleFilterChange(item.id)}
                                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg transition-all cursor-pointer bg-transparent border-none hover:bg-slate-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-sm flex items-center justify-center ${filter[item.id] ? item.color : 'bg-slate-200'} transition-all`}>
                                            {filter[item.id] && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Statement Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                
                {/* Clean Toolbar */}
                <div className="px-8 py-5 bg-white border-b border-slate-200 flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => onNavigate(new Date())}
                            className="px-6 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full font-bold text-xs transition-all cursor-pointer bg-white">
                            Today
                        </button>
                        
                        <div className="flex items-center">
                            <button onClick={() => onNavigate(moment(date).subtract(1, view === 'month' ? 'month' : view === 'week' ? 'week' : 'day').toDate())} 
                                className="p-2 hover:bg-slate-50 hover:text-slate-900 rounded-full transition-all text-slate-500 border-none bg-transparent cursor-pointer">
                                <ChevronLeft size={18} />
                            </button>
                            <button onClick={() => onNavigate(moment(date).add(1, view === 'month' ? 'month' : view === 'week' ? 'week' : 'day').toDate())} 
                                className="p-2 hover:bg-slate-50 hover:text-slate-900 rounded-full transition-all text-slate-500 border-none bg-transparent cursor-pointer">
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <h2 className="text-xl font-bold text-slate-800 tracking-tight ml-2">
                            {moment(date).format('MMMM YYYY')}
                        </h2>
                    </div>

                    <div className="flex border border-slate-200 rounded-full overflow-hidden p-0.5 bg-white">
                        {[
                            { id: 'month', label: 'Month' },
                            { id: 'week', label: 'Week' },
                            { id: 'day', label: 'Day' }
                        ].map(v => (
                            <button
                                key={v.id}
                                onClick={() => onView(v.id)}
                                className={`
                                    px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border-none
                                    ${view === v.id ? 'bg-[#1a73e8] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 bg-transparent'}
                                `}
                            >
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Static Grid */}
                <div className="flex-1 overflow-hidden bg-white custom-calendar-wrapper p-6">
                    <BigCalendar
                        localizer={localizer}
                        events={filteredEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={(event) => setSelectedEvent(event)}
                        components={{
                            toolbar: () => null,
                            event: EventComponent
                        }}
                        view={view}
                        onView={onView}
                        date={date}
                        onNavigate={onNavigate}
                    />
                </div>
            </div>

            {/* Create Quick Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 bg-stone-900/40 z-[60] flex items-center justify-center backdrop-blur-md p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[32px] w-full max-w-[500px] shadow-2xl overflow-hidden border border-stone-200"
                        >
                            <div className="p-8 border-b border-stone-100 bg-stone-50/50 flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-black text-stone-900 tracking-tight">Create Calendar Task</h3>
                                    <p className="text-stone-400 text-xs font-medium mt-1">Add a new task directly from your calendar dashboard.</p>
                                </div>
                                <button onClick={() => setShowCreateModal(false)} className="p-3 bg-white hover:bg-stone-100 rounded-full text-stone-400 transition-colors border border-stone-100 cursor-pointer">
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveEvent} className="p-8 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Task Title *</label>
                                    <input 
                                        required autoFocus type="text" 
                                        value={newEventData.title}
                                        onChange={e => setNewEventData({...newEventData, title: e.target.value})}
                                        placeholder="e.g. Call Client about Proposal"
                                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-600 transition-all font-semibold text-stone-900 text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Type</label>
                                        <div className="relative">
                                            <select 
                                                value={newEventData.type}
                                                onChange={e => setNewEventData({...newEventData, type: e.target.value})}
                                                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-600 appearance-none font-semibold text-stone-900 bg-white text-sm"
                                            >
                                                {['Call', 'Meeting', 'Email', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                                <ChevronRight size={14} className="rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Priority</label>
                                        <div className="relative">
                                            <select 
                                                value={newEventData.priority}
                                                onChange={e => setNewEventData({...newEventData, priority: e.target.value})}
                                                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-600 appearance-none font-semibold text-stone-900 bg-white text-sm"
                                            >
                                                {['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                                <ChevronRight size={14} className="rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Due Date *</label>
                                        <input 
                                            required type="date" 
                                            min={new Date().toISOString().split('T')[0]}
                                            value={newEventData.dueDate}
                                            onChange={e => setNewEventData({...newEventData, dueDate: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-600 font-semibold text-stone-900 bg-white text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Due Time *</label>
                                        <div className="flex gap-1">
                                            <select 
                                                value={newEventData.hour}
                                                onChange={e => setNewEventData({...newEventData, hour: e.target.value})}
                                                className="w-full px-2 py-2 rounded-xl border border-stone-200 outline-none focus:border-amber-600 bg-white font-semibold text-stone-900 text-xs"
                                            >
                                                {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                            <select 
                                                value={newEventData.minute}
                                                onChange={e => setNewEventData({...newEventData, minute: e.target.value})}
                                                className="w-full px-2 py-2 rounded-xl border border-stone-200 outline-none focus:border-amber-600 bg-white font-semibold text-stone-900 text-xs"
                                            >
                                                {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                            <select 
                                                value={newEventData.period}
                                                onChange={e => setNewEventData({...newEventData, period: e.target.value})}
                                                className="w-full px-2 py-2 rounded-xl border border-stone-200 outline-none focus:border-amber-600 bg-white font-semibold text-stone-900 text-xs"
                                            >
                                                {['AM', 'PM'].map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Contact / Client</label>
                                    <div className="relative">
                                        <select 
                                            value={newEventData.contactId}
                                            onChange={e => setNewEventData({...newEventData, contactId: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-600 appearance-none font-semibold text-stone-900 bg-white text-sm"
                                        >
                                            <option value="">Select Contact</option>
                                            {contacts.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                            <ChevronRight size={14} className="rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Assigned To</label>
                                    <div className="relative">
                                        <select 
                                            value={newEventData.assignedTo}
                                            onChange={e => setNewEventData({...newEventData, assignedTo: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-600 appearance-none font-semibold text-stone-900 bg-white text-sm"
                                        >
                                            <option value="">Assign to Self (Default)</option>
                                            {users.filter(u => u.role !== 'Client').map((u, idx) => (
                                                <option key={u._id || u.id || `create-user-${idx}`} value={u._id || u.id}>
                                                    {u.name} ({u.role || 'Staff'})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                            <ChevronRight size={14} className="rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Notes / Description</label>
                                    <textarea 
                                        rows="3"
                                        value={newEventData.description}
                                        onChange={e => setNewEventData({...newEventData, description: e.target.value})}
                                        placeholder="Add notes..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-600 transition-all font-semibold text-stone-900 text-sm resize-none"
                                    />
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3.5 rounded-xl text-[10px] font-bold text-stone-400 hover:bg-stone-50 transition-colors uppercase tracking-widest border-none bg-transparent cursor-pointer">Discard</button>
                                    <button type="submit" className="flex-1 py-3.5 rounded-xl text-[10px] font-bold bg-stone-900 text-white hover:bg-amber-600 shadow-xl shadow-stone-200 transition-all uppercase tracking-widest border-none cursor-pointer">Create Task</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Event Details Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <div className="fixed inset-0 bg-stone-900/40 z-[60] flex items-center justify-center backdrop-blur-md p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[32px] w-full max-w-[500px] shadow-2xl overflow-hidden border border-stone-200"
                        >
                            <div className="p-8 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                                <div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                                        selectedEvent.type === 'task' ? 'bg-amber-100 text-amber-800' :
                                        selectedEvent.type === 'opportunity' ? 'bg-indigo-100 text-indigo-800' :
                                        'bg-emerald-100 text-emerald-800'
                                    }`}>
                                        {selectedEvent.type === 'opportunity' ? 'SALES DEAL' : selectedEvent.type.toUpperCase()}
                                    </span>
                                    <h3 className="text-xl font-black text-stone-900 mt-2 tracking-tight">
                                        {isEditingEvent ? 'Edit Calendar Task' : 'Event Details'}
                                    </h3>
                                </div>
                                <button onClick={() => { setSelectedEvent(null); setIsEditingEvent(false); }} className="p-2 hover:bg-stone-100 rounded-full text-stone-400 transition-colors border-none bg-transparent cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            {isEditingEvent ? (
                                <form onSubmit={handleUpdateEvent} className="p-8 space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Task Title *</label>
                                        <input 
                                            required type="text" 
                                            value={editEventData.title}
                                            onChange={e => setEditEventData({...editEventData, title: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-600 transition-all font-semibold text-stone-900 text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Due Date *</label>
                                            <input 
                                                required type="date" 
                                                min={new Date().toISOString().split('T')[0]}
                                                value={editEventData.dueDate}
                                                onChange={e => setEditEventData({...editEventData, dueDate: e.target.value})}
                                                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-600 font-semibold text-stone-900 bg-white text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Due Time *</label>
                                            <div className="flex gap-1">
                                                <select 
                                                    value={editEventData.hour}
                                                    onChange={e => setEditEventData({...editEventData, hour: e.target.value})}
                                                    className="w-full px-2 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-600 bg-white font-semibold text-stone-900 text-xs"
                                                >
                                                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(h => <option key={h} value={h}>{h}</option>)}
                                                </select>
                                                <select 
                                                    value={editEventData.minute}
                                                    onChange={e => setEditEventData({...editEventData, minute: e.target.value})}
                                                    className="w-full px-2 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-600 bg-white font-semibold text-stone-900 text-xs"
                                                >
                                                    {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                                <select 
                                                    value={editEventData.period}
                                                    onChange={e => setEditEventData({...editEventData, period: e.target.value})}
                                                    className="w-full px-2 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-600 bg-white font-semibold text-stone-900 text-xs"
                                                >
                                                    {['AM', 'PM'].map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Contact / Client</label>
                                            <select 
                                                value={editEventData.contactId}
                                                onChange={e => setEditEventData({...editEventData, contactId: e.target.value})}
                                                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-600 font-semibold text-stone-900 bg-white text-sm"
                                            >
                                                <option value="">Select Contact</option>
                                                {contacts.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Assignee</label>
                                            <select 
                                                value={editEventData.assignedTo}
                                                onChange={e => setEditEventData({...editEventData, assignedTo: e.target.value})}
                                                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-600 font-semibold text-stone-900 bg-white text-sm"
                                            >
                                                 <option value="">Assign to Self</option>
                                                 {users.filter(u => u.role !== 'Client').map((u, idx) => (
                                                     <option key={u._id || u.id || `edit-user-${idx}`} value={u._id || u.id}>
                                                         {u.name} ({u.role || 'Staff'})
                                                     </option>
                                                 ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Priority</label>
                                            <select 
                                                value={editEventData.priority}
                                                onChange={e => setEditEventData({...editEventData, priority: e.target.value})}
                                                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-600 font-semibold text-stone-900 bg-white text-sm"
                                            >
                                                {['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Status</label>
                                            <select 
                                                value={editEventData.status}
                                                onChange={e => setEditEventData({...editEventData, status: e.target.value})}
                                                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-600 font-semibold text-stone-900 bg-white text-sm"
                                            >
                                                {['Pending', 'In Progress', 'Completed'].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Notes / Description</label>
                                        <textarea 
                                            rows="3"
                                            value={editEventData.description}
                                            onChange={e => setEditEventData({...editEventData, description: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-600 transition-all font-semibold text-stone-900 text-sm resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t border-stone-100">
                                        <button type="button" onClick={() => handleDeleteEvent(editEventData.id)} className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest border-none cursor-pointer">Delete</button>
                                        <div className="flex-1 flex gap-2 justify-end">
                                            <button type="button" onClick={() => setIsEditingEvent(false)} className="px-6 py-3 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-xl text-xs font-bold uppercase tracking-widest border-none cursor-pointer">Cancel</button>
                                            <button type="submit" className="px-6 py-3 bg-stone-900 hover:bg-[#1a73e8] text-white rounded-xl text-xs font-bold uppercase tracking-widest border-none cursor-pointer">Save Changes</button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <div className="p-8 space-y-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Title</label>
                                        <p className="text-base font-bold text-stone-900 leading-snug">{selectedEvent.title}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Due / Target Date</label>
                                            <p className="text-sm font-semibold text-stone-800">
                                                {new Date(selectedEvent.start).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Status / Stage</label>
                                            <p className="text-sm font-semibold text-stone-800">
                                                {selectedEvent.status || selectedEvent.stage || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Contact / Client</label>
                                            <p className="text-sm font-semibold text-stone-800">{selectedEvent.contact || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Assigned Team/Staff</label>
                                            <p className="text-sm font-semibold text-stone-800">{selectedEvent.assignedTo || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {selectedEvent.type === 'task' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Task Type</label>
                                                <div>
                                                    <span className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-stone-800 text-xs font-bold inline-block">
                                                        {selectedEvent.taskType || 'Call'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Priority</label>
                                                <div>
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-block ${
                                                        selectedEvent.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                        selectedEvent.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        'bg-slate-100 text-slate-700 border-slate-200'
                                                    }`}>
                                                        {selectedEvent.priority || 'Medium'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedEvent.type === 'opportunity' && selectedEvent.amount && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Sales Contract Value</label>
                                            <p className="text-sm font-bold text-indigo-600">₹{selectedEvent.amount.toLocaleString()}</p>
                                        </div>
                                    )}

                                    {selectedEvent.type === 'invoice' && selectedEvent.totalAmount && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Invoice Total</label>
                                            <p className="text-sm font-bold text-emerald-600">₹{selectedEvent.totalAmount.toLocaleString()}</p>
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Notes / Description</label>
                                        <p className="text-xs font-semibold text-stone-500 bg-stone-50 p-4 rounded-xl border border-stone-100 leading-relaxed max-h-[120px] overflow-y-auto">
                                            {selectedEvent.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    {selectedEvent.type === 'task' && (
                                        <div className="space-y-2 mt-4 pt-4 border-t border-stone-100">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Update Task Status</label>
                                            <div className="flex gap-2">
                                                {['Pending', 'In Progress', 'Completed'].map(status => (
                                                    <button
                                                        key={status}
                                                        type="button"
                                                        onClick={async () => {
                                                            try {
                                                                await axios.put(`/api/tasks/${selectedEvent.id}`, { status });
                                                                toast.success(`Task marked as ${status}`);
                                                                setSelectedEvent(prev => ({ ...prev, status }));
                                                                fetchData();
                                                            } catch (err) {
                                                                console.error("Failed to update task status", err);
                                                                toast.error(err.response?.data?.message || "Failed to update status");
                                                            }
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                                            selectedEvent.status === status 
                                                                ? 'bg-stone-900 text-white border-stone-900' 
                                                                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                                                        }`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 flex justify-between items-center border-t border-stone-100">
                                        {selectedEvent.type === 'task' ? (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                                                    className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer border-none"
                                                >
                                                    Delete Task
                                                </button>
                                                <button 
                                                    onClick={startEditEvent}
                                                    className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer border-none"
                                                >
                                                    Edit Task
                                                </button>
                                            </div>
                                        ) : <div />}
                                        <button 
                                            onClick={() => setSelectedEvent(null)}
                                            className="px-6 py-3 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-850 shadow-md transition-all cursor-pointer border-none"
                                        >
                                            Close Details
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
                   <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-center shadow-2xl border border-slate-200/80">
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                            <Trash2 size={24} />
                        </div>
                        <h2 className="text-lg font-extrabold text-slate-900 mb-1">Delete Task Event?</h2>
                        <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">
                            Are you sure you want to delete this scheduled task? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                            <button className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors cursor-pointer" onClick={confirmDeleteTask}>Delete</button>
                        </div>
                   </div>
                </div>
            )}

            <style>{`
                .custom-calendar-wrapper {
                    height: calc(100vh - 180px) !important;
                }
                .rbc-month-view, .rbc-time-view { 
                    border: 1px solid #dadce0 !important; 
                    border-radius: 8px !important;
                    overflow: hidden !important;
                    font-family: 'Inter', sans-serif !important; 
                    background-color: #ffffff !important;
                }
                
                .rbc-header {
                    padding: 8px 0 !important;
                    font-size: 11px !important;
                    font-weight: 600 !important;
                    color: #70757a !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.8px !important;
                    border-bottom: 1px solid #dadce0 !important;
                    background: #fff !important;
                }
                
                .rbc-month-row { border-top: 1px solid #dadce0 !important; }
                .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #dadce0 !important; }
                .rbc-off-range-bg { background-color: #ffffff !important; opacity: 0.4; }
                
                .rbc-date-cell {
                    padding: 8px 8px 4px 8px !important;
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    color: #3c4043 !important;
                    text-align: center !important;
                }
                
                .rbc-today { 
                    background-color: #e8f0fe !important; 
                }
                
                .rbc-now .rbc-button-link {
                    background-color: #1a73e8 !important;
                    color: #ffffff !important;
                    border-radius: 50% !important;
                    width: 22px !important;
                    height: 22px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }

                .rbc-event {
                    background: transparent !important;
                    padding: 2px 6px !important;
                    margin: 1px 4px !important;
                    transition: background-color 0.15s ease !important;
                }
                .rbc-event:hover {
                    background-color: #f1f3f4 !important;
                }
                
                .rbc-event-content { font-size: 0 !important; } /* Hide default text rendering */

                .rbc-show-more {
                    font-size: 10px !important;
                    font-weight: 700 !important;
                    color: #1a73e8 !important;
                    background: #e8f0fe !important;
                    padding: 2px 6px !important;
                    border-radius: 4px !important;
                    margin: 2px 4px !important;
                    text-transform: uppercase !important;
                }

                .rbc-time-header { border-bottom: 1px solid #dadce0 !important; }
                .rbc-time-gutter { border-right: 1px solid #dadce0 !important; }
                .rbc-timeslot-group { border-bottom: 1px solid #dadce0 !important; min-height: 60px; }
                .rbc-day-slot { border-left: 1px solid #dadce0 !important; }
                .rbc-label { color: #70757a; font-size: 11px; font-weight: 500; }
                .rbc-time-view .rbc-today { background-color: transparent !important; }
            `}</style>
        </div>
    );
};

export default Calendar;

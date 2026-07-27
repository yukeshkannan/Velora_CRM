import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, X, Trash2, Calendar, User as UserIcon, Layout, List, CheckCircle2, Search, TrendingUp, AlertCircle, LayoutGrid
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import KanbanBoard from '../components/KanbanBoard';

const Tasks = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [rawOpportunities, setRawOpportunities] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('kanban'); 
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('All');

    // Access Control
    const canManageTasks = ['Admin', 'Sales', 'HR'].includes(user?.role);
    
    // Columns Configuration
    const columns = [
        { id: 'Pending', title: 'To Do', color: '#64748b' },
        { id: 'In Progress', title: 'In Progress', color: '#3b82f6' },
        { id: 'Completed', title: 'Done', color: '#10b981' },
        { id: 'Cancelled', title: 'Cancelled', color: '#ef4444' }
    ];

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        type: 'Call',
        status: 'Pending',
        priority: 'Medium',
        dueDate: '',
        description: '',
        contactId: '',
        assignedTo: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [viewingProject, setViewingProject] = useState(null); // For Project Details
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Use Promise.allSettled so one failure doesn't block other data
            const results = await Promise.allSettled([
                axios.get('/api/tasks'),
                axios.get('/api/contacts'),
                axios.get('/api/auth/users'),
                axios.get('/api/opportunities'),
                axios.get('/api/products') // Fetch products for fallback mapping
            ]);

            const [taskResult, contactResult, userResult, oppResult, prodResult] = results;

            // Log failures for debugging
            if (taskResult.status === 'rejected') console.error("Tasks API Failed:", taskResult.reason);
            if (contactResult.status === 'rejected') console.error("Contacts API Failed:", contactResult.reason);
            if (userResult.status === 'rejected') console.error("Users API Failed:", userResult.reason);
            if (oppResult.status === 'rejected') console.error("Opportunities API Failed:", oppResult.reason);

            // Extract data safely
            let allTasks = taskResult.status === 'fulfilled' ? (taskResult.value.data.data || []) : [];
            let allOpportunities = oppResult.status === 'fulfilled' ? (oppResult.value.data.data || []) : [];
            const contactsData = contactResult.status === 'fulfilled' ? (contactResult.value.data.data || []) : [];
            const usersData = userResult.status === 'fulfilled' ? (userResult.value.data.data || []) : [];
            const productsList = prodResult.status === 'fulfilled' ? (prodResult.value.data.data || []) : [];
            
            // Filter for Employees: Only show their assigned tasks
            if (user?.role === 'Employee') {
                const currentUserId = user.id || user._id;
                
                allTasks = allTasks.filter(t => {
                    const assignedId = typeof t.assignedTo === 'object' ? t.assignedTo?._id : t.assignedTo;
                    return String(assignedId) === String(currentUserId);
                });
                
                // Filter Opportunities for Employees
                allOpportunities = allOpportunities.filter(o => {
                    const assignedId = typeof o.assignedTo === 'object' ? o.assignedTo?._id : o.assignedTo;
                    return String(assignedId) === String(currentUserId);
                });
            }

            // Convert Opportunities to Task format for the Kanban board
            const projectTasks = allOpportunities.map(opp => {
                // FALLBACK LOGIC: If modules are missing, try to auto-match from Product List based on Title
                let displayModules = opp.modules || [];
                if (displayModules.length === 0 && productsList.length > 0) {
                    const matchedProduct = productsList.find(p => 
                        opp.title.toLowerCase().includes(p.name.toLowerCase())
                    );
                    if (matchedProduct) {
                        displayModules = matchedProduct.modules.map(m => ({
                             name: m.name,
                             status: 'Pending', 
                             clientStatus: 'Pending',
                             // Generate a valid-looking ObjectId (24 hex chars) so Mongoose accepts it on save
                             _id: m._id || ((new Date().getTime() / 1000 | 0).toString(16) + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16)).toLowerCase())
                        }));
                    }
                }

                return {
                    _id: opp._id,
                    title: `Project: ${opp.title}`,
                    priority: 'High',
                    type: 'Project',
                    status: opp.employeeTaskStatus || (opp.stage === 'New' ? 'Pending' : opp.stage === 'Won' ? 'Completed' : 'In Progress'),
                    dueDate: opp.expectedCloseDate,
                    contactId: opp.contactId,
                    assignedTo: opp.assignedTo,
                    isOpportunity: true,
                    modules: displayModules
                };
            });

            // Merge and De-duplicate
            setTasks([...allTasks, ...projectTasks]);
            
            // Update raw opportunities with the "rescued" modules so the Detail Drawer sees them too
            setRawOpportunities(allOpportunities.map(o => {
                 const matchingTask = projectTasks.find(pt => pt._id === o._id);
                 return matchingTask ? { ...o, modules: matchingTask.modules } : o;
            }));

            setContacts(contactsData);
            // Only show Employees in Assigned To Employee dropdown (Exclude Admin & Client)
            setUsers(usersData.filter(u => u.role === 'Employee'));
        } catch (err) {
            console.error("Critical error in fetchData", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (!payload.assignedTo) payload.assignedTo = user.id; 

            if (editingId) {
                await axios.put(`/api/tasks/${editingId}`, payload);
                toast.success("Task updated successfully!");
            } else {
                await axios.post('/api/tasks', payload);
                toast.success("Task created successfully!");
            }
            
            fetchData();
            handleCloseDrawer();
        } catch (err) {
            console.error("Failed to save task", err);
            toast.error(err.response?.data?.message || "Failed to save task");
        }
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;
        const { draggableId, destination } = result;
        const newStatus = destination.droppableId;
        
        // Optimistic Update
        const originalTasks = [...tasks];
        setTasks(prev => prev.map(t => 
            t._id === draggableId ? { ...t, status: newStatus } : t
        ));

        // API Call
        try {
            const task = tasks.find(t => t._id === draggableId);
            
            // Foolproof check using raw data
            const isProjectTask = rawOpportunities.find(o => o._id === draggableId);

            if (task && task.status !== newStatus) {
                if (isProjectTask) {
                    // Update Opportunity employeeTaskStatus
                    // NOTE: using /api/opportunities endpoint
                    await axios.put(`/api/opportunities/${draggableId}`, { employeeTaskStatus: newStatus });
                    
                    if (newStatus === 'Completed') {
                        // Notify Admin logic...
                         const adminUser = users.find(u => u.role === 'Admin');
                         if (adminUser?.email) {
                            try {
                                await axios.post('/api/notifications/email', {
                                    to: adminUser.email,
                                    subject: `Project Completed: ${task.title.replace('Project: ', '')}`,
                                    message: `Employee <strong>${user.name}</strong> has marked the project "<strong>${task.title}</strong>" as Completed.`
                                });
                            } catch(e) { console.error("Admin Notification Failed", e); }
                         }
                    }
                } else {
                    // Update Regular Task
                    await axios.put(`/api/tasks/${draggableId}`, { ...task, status: newStatus });

                    // Notifications for regular tasks
                    if (newStatus === 'Completed') {
                        // ... existing notification logic
                        const contactId = typeof task.contactId === 'object' ? task.contactId?._id : task.contactId;
                        const contact = contacts.find(c => c._id === contactId);
                        
                        if (contact?.email) {
                           try {
                               await axios.post('/api/notifications/email', {
                                   to: contact.email,
                                   subject: `Task Completed: ${task.title}`,
                                   message: `Hello ${contact.name},<br>The task "<strong>${task.title}</strong>" has been marked as <strong>Completed</strong>.`
                               });
                           } catch(e) { console.error("Email failed", e); }
                       }
                    }
                }
            }
        } catch (err) {
            console.error("Failed to update status", err);
            setTasks(originalTasks); // Revert
        }
    };

    const handleDelete = (task) => {
        const taskObj = typeof task === 'string' ? tasks.find(t => t._id === task) : task;
        if(taskObj) setShowDeleteConfirm(taskObj);
    };

    const confirmDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await axios.delete(`/api/tasks/${showDeleteConfirm._id}`);
            setTasks(prev => prev.filter(t => t._id !== showDeleteConfirm._id));
            setShowDeleteConfirm(null);
            setIsDrawerOpen(false);
        } catch (err) {
            console.error("Failed to delete task", err);
            setShowDeleteConfirm(null);
        }
    };

    const handleEdit = (task) => {
        console.log("Handle Edit Triggered for:", task._id, task.title);
        
        // Check both task object and raw opportunities to be safe
        const isProject = task.isOpportunity || rawOpportunities.some(o => o._id === task._id);
        
        if (isProject) {
            // Find the full project object if task is just a subset
            const fullProject = rawOpportunities.find(o => o._id === task._id) || task;
            console.log("Opening Project Details:", fullProject.title);
            // Open Project Detail Drawer
            setViewingProject(fullProject);
            return;
        }
        
        if (!canManageTasks) {
            console.log("Read Only Mode - Cannot Edit");
            return; 
        } // Prevent employees from editing regular tasks if not allowed
        
        setEditingId(task._id);
        const contactId = typeof task.contactId === 'object' ? task.contactId?._id : task.contactId;
        const assignedTo = typeof task.assignedTo === 'object' ? task.assignedTo?._id : task.assignedTo;
        
        setFormData({
            title: task.title,
            type: task.type,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
            description: task.description || '',
            contactId: contactId || '',
            assignedTo: assignedTo || ''
        });
        setIsDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setViewingProject(null);
        setEditingId(null);
        setFormData({
            title: '', type: 'Call', status: 'Pending', priority: 'Medium',
            dueDate: '', description: '', contactId: '', assignedTo: ''
        });
    };

    // Helper to generate valid-looking ObjectIds for client-side rescue
    // Moved to top-level of component scope to ensure availability
    const generateFakeObjectId = () => {
        const timestamp = (new Date().getTime() / 1000 | 0).toString(16);
        return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16)).toLowerCase();
    };

    // LOCAL STATE UPDATE ONLY
    const updateProjectModule = (moduleId, newValue, field = 'status') => {
        if (!viewingProject) return;
        
        const updatedModules = viewingProject.modules.map(m => 
            m._id === moduleId ? { ...m, [field]: newValue } : m
        );
        
        setViewingProject({ ...viewingProject, modules: updatedModules });
        setHasUnsavedChanges(true);
    };

    // EXPLICIT SAVE FUNCTION
    const saveProjectChanges = async () => {
        if (!viewingProject) return;
        setIsSaving(true);
        
        try {
            // NUCLEAR OPTION: The backend is fighting us.
            // We will strip IDs completely and send a CLEAN array.
            // And we will use a different confirmation message to debug.
            const cleanModules = viewingProject.modules.map(({ _id, ...rest }) => ({
                name: rest.name,
                status: rest.status,
                clientStatus: rest.clientStatus || 'Pending'
            }));
            
            console.log(`Saving Project: ${viewingProject._id}`);
            console.log(`Payload Modules Count: ${cleanModules.length}`);

            // We send the array inside the modules key.
            const res = await axios.put(`/api/opportunities/${viewingProject._id}`, { modules: cleanModules });

            if (res.status === 200) {
                toast.success("Project status updated successfully!");
                setHasUnsavedChanges(false);
                fetchData();
            }
        } catch (err) {
            console.error("Failed to update module", err);
            toast.error(`Failed to save status: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const getPriorityStyle = (p) => {
        switch(p) {
            case 'High': return { bg: '#fee2e2', text: '#ef4444' };
            case 'Medium': return { bg: '#fff7ed', text: '#f97316' }; // Orange
            case 'Low': return { bg: '#f0f9ff', text: '#0ea5e9' };
            default: return { bg: '#f1f5f9', text: '#64748b' };
        }
    };

    // Card Renderer for Kanban
    const renderCard = (task) => (
        <div 
            onClick={(e) => {
                if (!e.defaultPrevented) {
                    handleEdit(task);
                }
            }} 
            className="cursor-pointer relative z-10 space-y-3"
        >
             <div className="flex justify-between items-center gap-2">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                    task.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200/80' : 
                    task.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200/80' : 'bg-slate-100 text-slate-700 border-slate-200/80'
                }`}>
                    {task.priority}
                </span>
                {task.dueDate && (
                     <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold">
                        <Calendar size={13} />
                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                )}
            </div>
            
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug hover:text-slate-700 transition-colors">{task.title}</h4>
            
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                     <span className="font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-xs border border-slate-200/60">{task.type}</span>
                </div>
                {task.contactId && (
                     <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold" title={task.contactId.name}>
                        <UserIcon size={13} className="text-slate-400" />
                        <span className="max-w-[100px] truncate">{task.contactId.name}</span>
                    </div>
                )}
            </div>

            {/* Explicit View Button for Projects */}
            {(task.isOpportunity || rawOpportunities.some(o => o._id === task._id)) && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center bg-slate-50/60 -mx-5 -mb-5 px-5 py-2.5 rounded-b-2xl">
                    <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        <List size={13} /> Project
                    </span>
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            handleEdit(task); 
                        }} 
                        className="text-xs font-extrabold text-slate-900 hover:text-slate-700 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors z-20 cursor-pointer"
                    >
                        View Details
                    </button>
                </div>
            )}
        </div>
    );

    if (loading) return <LoadingSpinner message="Loading Tasks..." />;

    const filteredTasks = tasks.filter(t => {
        const matchesSearch = (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (t.contactId?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
        return matchesSearch && matchesPriority;
    });

    const totalTasksCount = tasks.length;
    const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
    const completedCount = tasks.filter(t => t.status === 'Completed').length;
    const highPriorityCount = tasks.filter(t => t.priority === 'High').length;

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
             style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* Executive Header */}
            <div className="bg-white border-b border-slate-200/80 px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                     <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Tasks</h1>
                     <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">Manage daily activities, project milestones, and follow-ups.</p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-3">
                     <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
                        <button 
                            onClick={() => setViewMode('kanban')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border-none cursor-pointer ${
                                viewMode === 'kanban' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-transparent'
                            }`}
                        >
                            <Layout size={16} /> Board
                        </button>
                        <button 
                             onClick={() => setViewMode('list')}
                             className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border-none cursor-pointer ${
                                viewMode === 'list' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-transparent'
                            }`}
                        >
                            <List size={16} /> List
                        </button>
                    </div>
                    {canManageTasks ? (
                        <button 
                            onClick={() => {
                                setEditingId(null);
                                setFormData({
                                    title: '', type: 'Call', status: 'Pending', priority: 'Medium',
                                    dueDate: '', description: '', contactId: '', assignedTo: ''
                                });
                                setIsDrawerOpen(true);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 transition-all cursor-pointer border-none"
                        >
                            <Plus size={16} /> New Task
                        </button>
                    ) : (
                        <div className="bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wider border border-slate-200/80">
                            View Only Mode
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
                
                {/* KPI Metrics Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Tasks</p>
                            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{totalTasksCount}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/60 text-slate-900 flex items-center justify-center font-bold">
                            <LayoutGrid size={22} />
                        </div>
                    </div>

                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">In Progress</p>
                            <p className="text-2xl sm:text-3xl font-black text-indigo-700 mt-1">{inProgressCount}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                            <TrendingUp size={22} />
                        </div>
                    </div>

                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Completed</p>
                            <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">{completedCount}</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            <CheckCircle2 size={22} />
                        </div>
                    </div>

                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-slate-400">High Priority</p>
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
                            placeholder="Search tasks by title or contact..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1 shrink-0">Priority:</span>
                        {['All', 'High', 'Medium', 'Low'].map((p) => (
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

                {/* Board Content */}
                {viewMode === 'kanban' ? (
                    <KanbanBoard 
                        columns={columns} 
                        data={filteredTasks} 
                        onDragEnd={handleDragEnd}
                        renderCard={renderCard}
                        loading={loading}
                        layout="grid"
                    />
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100/70 border-b border-slate-200/80">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle">Title</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle">Status</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle">Priority</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle">Due Date</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-700 uppercase tracking-wider align-middle text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTasks.map(task => (
                                    <tr key={task._id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 font-extrabold text-sm sm:text-base text-slate-900">{task.title}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                                                task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                task.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                task.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                'bg-slate-100 text-slate-700 border-slate-200'
                                            }`}>{task.status}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                             <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                                                task.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                                                task.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                                             }`}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs sm:text-sm font-bold text-slate-700">
                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold">
                                            <div className="flex justify-end items-center gap-3">
                                                {canManageTasks || task.isOpportunity || rawOpportunities.some(o => o._id === task._id) ? (
                                                    <button 
                                                        onClick={() => handleEdit(task)} 
                                                        className="text-slate-400 hover:text-blue-600 p-1 font-bold text-xs cursor-pointer border-none bg-transparent"
                                                    >
                                                        {task.isOpportunity || rawOpportunities.some(o => o._id === task._id) ? 'View' : 'Edit'}
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-300 text-xs italic font-medium">Read Only</span>
                                                )}
                                                {canManageTasks && !task.isOpportunity && !rawOpportunities.some(o => o._id === task._id) && (
                                                    <button 
                                                        onClick={() => handleDelete(task)} 
                                                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer border-none bg-transparent"
                                                        title="Delete Task"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Drawer */}
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
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Task' : 'New Task'}</h2>
                                <p className="text-slate-500 text-sm mt-0.5">{editingId ? 'Update task details.' : 'Schedule a new activity.'}</p>
                            </div>
                            <button onClick={handleCloseDrawer} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors border-none bg-transparent cursor-pointer"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            <form id="taskForm" onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Task Title <span className="text-red-500">*</span></label>
                                    <input 
                                        required
                                        type="text" 
                                        placeholder="e.g. Call Client about Proposal"
                                        value={formData.title} 
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all text-sm font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Type</label>
                                        <select 
                                            value={formData.type} 
                                            onChange={e => setFormData({...formData, type: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 text-sm font-medium cursor-pointer"
                                        >
                                            <option value="Task">Task</option>
                                            <option value="Call">Call</option>
                                            <option value="Meeting">Meeting</option>
                                            <option value="Email">Email</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Priority</label>
                                        <select 
                                            value={formData.priority} 
                                            onChange={e => setFormData({...formData, priority: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 text-sm font-medium cursor-pointer"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Status</label>
                                        <select 
                                            value={formData.status} 
                                            onChange={e => setFormData({...formData, status: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 text-sm font-medium cursor-pointer"
                                        >
                                            <option value="To Do">To Do</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Done">Done</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Due Date</label>
                                        <input 
                                            type="date" 
                                            value={formData.dueDate}
                                            onChange={e => setFormData({...formData, dueDate: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-500 text-sm font-medium"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Assign To</label>
                                    <div className="relative">
                                        <select 
                                            value={formData.assignedTo} 
                                            onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 appearance-none text-sm font-medium cursor-pointer"
                                        >
                                            <option value="">-- Assign Employee --</option>
                                            {users.map(u => (
                                                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Client / Project Context</label>
                                    <div className="relative">
                                        <select 
                                            value={formData.contactId} 
                                            onChange={e => setFormData({...formData, contactId: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 appearance-none text-sm font-medium cursor-pointer"
                                        >
                                            <option value="">-- No Related Client --</option>
                                            {contacts.sort((a,b) => a.name.localeCompare(b.name)).map(c => (
                                                <option key={c._id} value={c._id}>{c.name} ({c.company})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Description</label>
                                    <textarea 
                                        rows="4"
                                        value={formData.description} 
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 outline-none resize-none text-sm"
                                        placeholder="Add details about this task..."
                                    />
                                </div>

                                {editingId && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <button 
                                            type="button" 
                                            onClick={() => handleDelete(editingId)} 
                                            className="w-full text-red-600 bg-red-50 hover:bg-red-100 py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm border-none cursor-pointer"
                                        >
                                            <Trash2 size={16} /> Delete Task
                                        </button>
                                    </div>
                                )}

                            </form>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <button onClick={handleCloseDrawer} className="flex-1 text-slate-600 font-bold hover:bg-slate-200 py-2.5 rounded-xl transition-colors text-sm border-none bg-transparent cursor-pointer">Cancel</button>
                            <button form="taskForm" type="submit" className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-slate-800 shadow-xs transition-colors text-sm border-none cursor-pointer">
                                {editingId ? 'Save Changes' : 'Create Task'}
                            </button>
                        </div>
                    </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Project Detail Drawer */}
            {viewingProject && (
                 <>
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={handleCloseDrawer} />
                <div className="fixed top-0 right-0 bottom-0 w-[600px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <div className="text-[10px] font-bold text-blue-600 tracking-wider uppercase mb-1">Project Details</div>
                            <h2 className="text-xl font-bold text-slate-900">{viewingProject.title.replace('Project: ', '')}</h2>
                        </div>
                        <button onClick={handleCloseDrawer} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8">
                         {/* Modules Section */}
                         <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                <List size={16} /> Project Modules
                            </h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-12 gap-2 px-4 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <div className="col-span-5">Module Name</div>
                                    <div className="col-span-3 text-center">Internal Status</div>
                                    {user.role === 'Admin' && <div className="col-span-4 text-center">Client Visibility</div>}
                                </div>
                                {viewingProject.modules && viewingProject.modules.length > 0 ? (
                                    viewingProject.modules.map((mod, idx) => (
                                        <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-12 gap-4 items-center">
                                            {/* Module Name */}
                                            <div className="col-span-5">
                                                <div className="font-bold text-slate-800 text-sm">{mod.name}</div>
                                            </div>
                                            
                                            {/* Internal Status (Employee & Admin) */}
                                            <div className="col-span-3 flex justify-center">
                                                {/* Admin View: Read Only */}
                                                {user.role === 'Admin' ? (
                                                     <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border text-center block w-full ${
                                                        mod.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        mod.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        'bg-slate-50 text-slate-400 border-slate-100'
                                                    }`}>
                                                        {mod.status}
                                                    </span>
                                                ) : (
                                                /* Employee View: Editable */
                                                 <select
                                                    value={mod.status}
                                                    onChange={(e) => updateProjectModule(mod._id, e.target.value, 'status')}
                                                    className={`w-full px-2 py-1.5 rounded-lg text-[10px] font-bold border outline-none appearance-none text-center cursor-pointer transition-colors ${
                                                        mod.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                        mod.status === 'In Progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                        'bg-white text-slate-500 border-slate-200'
                                                    }`}
                                                 >
                                                    <option value="Pending">Pending</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Completed">Completed</option>
                                                 </select>
                                                )}
                                            </div>

                                            {/* Client Status (Admin Only) */}
                                            {user.role === 'Admin' && (
                                                <div className="col-span-4 flex justify-center">
                                                     {mod.status === 'Completed' ? (
                                                        mod.clientStatus === 'Completed' ? (
                                                            <button 
                                                                onClick={() => updateProjectModule(mod._id, 'Pending', 'clientStatus')}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-black border border-purple-200 hover:bg-purple-200 transition-colors"
                                                                title="Click to Hide from Client"
                                                            >
                                                                <CheckCircle size={12} /> Published
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => updateProjectModule(mod._id, 'Completed', 'clientStatus')}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-white text-slate-400 rounded-lg text-[10px] font-bold border border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm"
                                                                title="Click to Publish to Client"
                                                            >
                                                                <Layout size={12} /> Publish
                                                            </button>
                                                        )
                                                     ) : (
                                                         <span className="text-[10px] text-slate-300 font-bold italic">
                                                             Finish Internal First
                                                         </span>
                                                     )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-8 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                                        <p>No modules defined for this project.</p>
                                        <p className="text-xs mt-2">Contact Admin to configure project modules.</p>
                                    </div>
                                )}
                            </div>
                         </div>
                         
                         {/* Explicit Save Button */}
                         <div className="pt-6 mt-6 border-t border-slate-100 sticky bottom-0 bg-white pb-4">
                            <button
                                onClick={saveProjectChanges}
                                disabled={!hasUnsavedChanges || isSaving}
                                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                    hasUnsavedChanges 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02]' 
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        Update Project Status
                                    </>
                                )}
                            </button>
                            {!hasUnsavedChanges && (
                                <p className="text-center text-[10px] text-slate-400 mt-2">
                                    Make changes to modules to enable saving.
                                </p>
                            )}
                         </div>

                    </div>
                </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl w-[400px] text-center shadow-2xl animate-in zoom-in duration-200">
                            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={32} />
                        </div>
                            <h3 className="text-xl font-bold text-slate-900">Delete Task?</h3>
                            <p className="text-slate-500 my-4">
                            Are you sure you want to delete <strong>{showDeleteConfirm.title}</strong>? This action cannot be undone.
                        </p>
                            <div className="flex gap-4 justify-center">
                                <button className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                                <button className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 transition-colors" onClick={confirmDelete}>Yes, Delete</button>
                            </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;

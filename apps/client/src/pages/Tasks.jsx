import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { 
    Plus, X, Trash2, Calendar, User as UserIcon, Layout, List, CheckCircle
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
            setUsers(usersData);
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
                // Ensure click works even if drag listeners are present
                if (!e.defaultPrevented) {
                    handleEdit(task);
                }
            }} 
            className="cursor-pointer relative z-10"
        >
             <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    task.priority === 'High' ? 'bg-red-100 text-red-600' : 
                    task.priority === 'Medium' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                }`}>
                    {task.priority}
                </span>
                {task.dueDate && (
                     <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                        <Calendar size={12} />
                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                )}
            </div>
            
            <h4 className="font-bold text-slate-800 mb-2 leading-relaxed">{task.title}</h4>
            
            <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                     <span className="font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{task.type}</span>
                </div>
                {task.contactId && (
                     <div className="flex items-center gap-1 text-xs text-slate-500 font-medium" title={task.contactId.name}>
                        <UserIcon size={12} />
                        <span className="max-w-[80px] truncate">{task.contactId.name}</span>
                    </div>
                )}
            </div>

            {/* Explicit View Button for Projects */}
            {(task.isOpportunity || rawOpportunities.some(o => o._id === task._id)) && (
                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center bg-slate-50/50 -mx-5 -mb-5 px-5 py-3">
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                        <List size={12} /> Project
                    </span>
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            handleEdit(task); 
                        }} 
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors z-20"
                    >
                        View Details
                    </button>
                </div>
            )}
        </div>
    );

    if (loading) return <LoadingSpinner message="Loading Tasks..." />;

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-20">
                <div>
                     <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tasks</h1>
                     <p className="text-slate-500 text-sm mt-1 font-medium">Manage your daily activities and follow-ups.</p>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-4">
                     <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button 
                            onClick={() => setViewMode('kanban')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Layout size={16} /> Board
                        </button>
                        <button 
                             onClick={() => setViewMode('list')}
                             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2 border-none cursor-pointer"
                        >
                            <Plus size={18} /> New Task
                        </button>
                    ) : (
                        <div className="bg-stone-100 text-stone-500 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-stone-200">
                            View Only Mode
                        </div>
                    )}
                </div>
            </div>

            {/* Board Content */}
            {viewMode === 'kanban' ? (
                <KanbanBoard 
                    columns={columns} 
                    data={tasks} 
                    onDragEnd={handleDragEnd}
                    renderCard={renderCard}
                    loading={loading}
                    layout="grid"
                />
            ) : (
                <div className="flex-1 p-8 overflow-y-auto">
                    {/* List View Fallback */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Priority</th>
                                    <th className="px-6 py-4">Due Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tasks.map(task => (
                                    <tr key={task._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800">{task.title}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                                                task.status === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                                                task.status === 'Cancelled' ? 'bg-red-50 text-red-600' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>{task.status}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                             <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityStyle(task.priority).bg} ${getPriorityStyle(task.priority).text}`}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
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
                </div>
            )}

            {/* Create/Edit Drawer */}
            {isDrawerOpen && (
                <>
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={handleCloseDrawer} />
                <div className="fixed top-0 right-0 bottom-0 w-[500px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Task' : 'New Task'}</h2>
                            <p className="text-slate-500 text-sm mt-0.5">{editingId ? 'Update task details.' : 'Schedule a new activity.'}</p>
                        </div>
                        <button onClick={handleCloseDrawer} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
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
                                    <div className="relative">
                                        <select 
                                            value={formData.type} 
                                            onChange={e => setFormData({...formData, type: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 appearance-none text-sm font-medium"
                                        >
                                            {['Call', 'Meeting', 'Email', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Priority</label>
                                    <div className="relative">
                                        <select 
                                            value={formData.priority} 
                                            onChange={e => setFormData({...formData, priority: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 appearance-none text-sm font-medium"
                                        >
                                            {['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Status</label>
                                    <div className="relative">
                                        <select 
                                            value={formData.status} 
                                            onChange={e => setFormData({...formData, status: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 appearance-none text-sm font-medium"
                                        >
                                            {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                        </div>
                                    </div>
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
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 appearance-none text-sm font-medium"
                                    >
                                        <option value="">-- Assign Employee --</option>
                                        {users.map(u => (
                                            <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Client / Project Context</label>
                                <div className="relative">
                                    <select 
                                        value={formData.contactId} 
                                        onChange={e => setFormData({...formData, contactId: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500 appearance-none text-sm font-medium"
                                    >
                                        <option value="">-- No Related Client --</option>
                                        {contacts.sort((a,b) => a.name.localeCompare(b.name)).map(c => (
                                            <option key={c._id} value={c._id}>{c.name} ({c.company})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
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
                                        className="w-full text-red-600 bg-red-50 hover:bg-red-100 py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Trash2 size={16} /> Delete Task
                                    </button>
                                </div>
                            )}

                        </form>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                        <button onClick={handleCloseDrawer} className="flex-1 text-slate-600 font-bold hover:bg-slate-200 py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
                        <button form="taskForm" type="submit" className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors text-sm">
                            {editingId ? 'Save Changes' : 'Create Task'}
                        </button>
                    </div>
                </div>
                </>
            )}

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

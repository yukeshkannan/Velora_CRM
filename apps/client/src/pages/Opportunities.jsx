import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Search, DollarSign, Calendar, Filter, Pencil, X, User, TrendingUp, LayoutGrid, List, Trash2, Download } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import LoadingSpinner from '../components/LoadingSpinner';

import { useAuth } from '../context/AuthContext';

const STAGES = ['New', 'In Execution', 'Review', 'Completed', 'Cancelled'];

const DEFAULT_MODULES = [
    { name: 'Requirements Analysis', status: 'Pending', clientStatus: 'Pending' },
    { name: 'UI/UX Design', status: 'Pending', clientStatus: 'Pending' },
    { name: 'System Architecture', status: 'Pending', clientStatus: 'Pending' },
    { name: 'Database Setup', status: 'Pending', clientStatus: 'Pending' },
    { name: 'API Development', status: 'Pending', clientStatus: 'Pending' },
    { name: 'Frontend Integration', status: 'Pending', clientStatus: 'Pending' },
    { name: 'Quality Assurance', status: 'Pending', clientStatus: 'Pending' },
    { name: 'UAT Deployment', status: 'Pending', clientStatus: 'Pending' },
    { name: 'Final Release', status: 'Pending', clientStatus: 'Pending' }
];

const Opportunities = () => {
    const { user } = useAuth();
    const [opportunities, setOpportunities] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [users, setUsers] = useState([]); // Store employees
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [draggedItem, setDraggedItem] = useState(null);
    const [editingOpportunity, setEditingOpportunity] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        stage: 'New',
        contactId: '',
        assignedTo: '',
        expectedCloseDate: '',
        expectedCloseHour: '09',
        expectedCloseMinute: '00',
        expectedClosePeriod: 'AM',
        modules: []
    });
    const [error, setError] = useState('');

    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const results = await Promise.allSettled([
                axios.get('/api/opportunities'),
                axios.get('/api/contacts'),
                axios.get('/api/auth/users'),
                axios.get('/api/products')
            ]);
            
            const [oppRes, contactRes, userRes, prodRes] = results;
            
            let allOpportunities = oppRes.status === 'fulfilled' ? oppRes.value.data.data : [];
            
            // Filter for Employees: Only show their assigned deals
            if (user?.role === 'Employee') {
                allOpportunities = allOpportunities.filter(o => {
                    const assignedId = typeof o.assignedTo === 'object' ? o.assignedTo?._id : o.assignedTo;
                    const currentUserId = user.id || user._id; // Ensure robust ID check
                    return String(assignedId) === String(currentUserId);
                });
            }

            setOpportunities(allOpportunities);
            setContacts(contactRes.status === 'fulfilled' ? contactRes.value.data.data : []);
            setUsers(userRes.status === 'fulfilled' ? (userRes.value.data?.data || []) : []);
            setProducts(prodRes.status === 'fulfilled' ? (prodRes.value.data.data || []) : []);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch data", err);
            setLoading(false);
        }
    };

    const handleDragStart = (e, item) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item._id); 
        e.target.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
        setDraggedItem(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, targetStage) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.stage === targetStage) return;

        const updatedOpp = { ...draggedItem, stage: targetStage };
        
        setOpportunities(prev => 
            prev.map(opp => opp._id === updatedOpp._id ? updatedOpp : opp)
        );

        try {
            await axios.put(`/api/opportunities/${draggedItem._id}`, { stage: targetStage });
        } catch (err) {
            console.error("Failed to update stage", err);
            fetchData();
        }
        setDraggedItem(null);
    };

    const handleProductChange = (e) => {
        const productId = e.target.value;
        const product = products.find(p => p._id === productId);
        
        console.log("Product Selected:", product ? product.name : "None", product ? product.modules : "No Modules");

        if (product) {
            setFormData(prev => ({
                ...prev,
                productId: product._id,
                title: prev.title || `Deal for ${product.name}`,
                amount: product.price,
                // MAP STRICTLY - IF EMPTY, IT SHOULD BE EMPTY ARRAY, NOT DEFAULT
                modules: (product.modules || []).map(m => ({
                    name: m.name,
                    status: 'Pending',
                    clientStatus: 'Pending',
                }))
            }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // AUTO-DETECT PRODUCT FROM TITLE
            // If the user types a Title that matches a Product Name, auto-select it!
            if (name === 'title' && value.length > 3) {
                const matchedProduct = products.find(p => 
                    value.toLowerCase().includes(p.name.toLowerCase())
                );

                if (matchedProduct && matchedProduct._id !== prev.productId) {
                    // Only auto-update if we found a NEW match to avoid overwriting user edits
                    console.log("Auto-matched product from title:", matchedProduct.name);
                    newData.productId = matchedProduct._id;
                    newData.amount = matchedProduct.price; // Auto-set price too
                    newData.modules = (matchedProduct.modules || []).map(m => ({
                        name: m.name,
                        status: 'Pending',
                        clientStatus: 'Pending',
                    }));
                }
            }
            return newData;
        });
    };

    const handleEdit = (opp) => {
        setEditingOpportunity(opp);
        
        // AUTO-SYNC LOGIC: Check if Title matches a Product, and if so, use that Product's data
        // This ensures that even if the saved Product ID is wrong/old, the Title (which user trusts) drives the UI.
        const matchedProduct = products.find(p => 
            opp.title.toLowerCase().includes(p.name.toLowerCase())
        );

        const targetProduct = matchedProduct || (products.find(p => p._id === opp.productId) || null);
        
        // Determine modules: 
        // 1. If we matched a product providing strict modules, use them (mapped to current status if possible).
        // 2. Else use existing opp modules.
        // 3. Fallback to empty.
        
        let initialModules = [];
        let initialAmount = opp.amount;
        let initialProductId = opp.contactId?._id || opp.contactId || ''; // This line seems to be for Contact ID, wait. productId is separate.

        // Correcting field mapping
        let contactId = opp.contactId?._id || opp.contactId || '';
        let assignedTo = opp.assignedTo?._id || opp.assignedTo || '';
        let productId = opp.productId || ''; // Default to saved ID

        if (matchedProduct) {
            console.log("Auto-Sync on Edit: Found product match from title:", matchedProduct.name);
            productId = matchedProduct._id;
            initialAmount = matchedProduct.price; // Sync price to product
            
            // LOGIC UPDATE: CHECK IF DB MODULES ARE VALID/RELEVANT
            // If the saved modules in the DB differ from the Product, we usually want to sync.
            // BUT, if the names match, we should TRUST definitions in the DB (which might have 'Completed' status).
            const dbModules = opp.modules || [];
            const looksValid = dbModules.length > 0 && dbModules.some(m => 
                matchedProduct.modules && matchedProduct.modules.some(pm => pm.name.trim().toLowerCase() === m.name.trim().toLowerCase())
            );

            if (looksValid) {
                console.log("Using DB Modules (Validated against Product)");
                initialModules = dbModules;
            } else {
                console.log("Generating fresh modules from Product. Reason: Validation Failed.");
                console.log("DB Modules Length:", dbModules.length);
                if (dbModules.length > 0 && matchedProduct.modules) {
                     console.log("First DB Module:", dbModules[0].name);
                     console.log("Matches Product?", matchedProduct.modules.some(pm => pm.name.trim().toLowerCase() === dbModules[0].name.trim().toLowerCase()));
                }

                initialModules = (matchedProduct.modules || []).map(m => ({
                    name: m.name,
                    status: 'Pending',
                    clientStatus: 'Pending'
                }));
            }
        } else {
            // No strict title match, use saved data
            initialModules = opp.modules && opp.modules.length > 0 ? opp.modules : [];
            // If saved data has no modules but we have a productId, maybe fetch from that?
            if (initialModules.length === 0 && opp.productId) {
                 const savedProd = products.find(p => p._id === opp.productId);
                 if (savedProd && savedProd.modules) {
                     initialModules = savedProd.modules.map(m => ({ name: m.name, status: 'Pending', clientStatus: 'Pending' }));
                 }
            }
        }

        let hour = '09';
        let minute = '00';
        let period = 'AM';
        if (opp.expectedCloseDate && opp.expectedCloseDate.includes('T')) {
            const timePart = opp.expectedCloseDate.split('T')[1];
            let hh = parseInt(timePart.substring(0, 2));
            minute = timePart.substring(3, 5);
            if (hh >= 12) {
                period = 'PM';
                if (hh > 12) hh -= 12;
            } else {
                period = 'AM';
                if (hh === 0) hh = 12;
            }
            hour = String(hh).padStart(2, '0');
            if (!['00', '15', '30', '45'].includes(minute)) {
                minute = '00';
            }
        }

        setFormData({
            title: opp.title,
            amount: initialAmount,
            stage: opp.stage,
            contactId: contactId,
            assignedTo: assignedTo,
            productId: productId,
            expectedCloseDate: opp.expectedCloseDate ? opp.expectedCloseDate.split('T')[0] : '',
            expectedCloseHour: hour,
            expectedCloseMinute: minute,
            expectedClosePeriod: period,
            modules: initialModules
        });
        setIsDrawerOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/opportunities/${id}`);
            setOpportunities(prev => prev.filter(o => o._id !== id));
            setIsDrawerOpen(false);
            setShowDeleteConfirm(null);
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const cleanModules = (formData.modules || []).map(({ _id, ...rest }) => rest);
            const payload = { ...formData, modules: cleanModules };

            // Format expectedCloseDate if present
            if (payload.expectedCloseDate) {
                let hh = parseInt(payload.expectedCloseHour || '9');
                if (payload.expectedClosePeriod === 'PM' && hh < 12) hh += 12;
                if (payload.expectedClosePeriod === 'AM' && hh === 12) hh = 0;
                const hhStr = String(hh).padStart(2, '0');
                payload.expectedCloseDate = `${payload.expectedCloseDate}T${hhStr}:${payload.expectedCloseMinute || '00'}:00`;
            }
            delete payload.expectedCloseHour;
            delete payload.expectedCloseMinute;
            delete payload.expectedClosePeriod;

            // Clean up empty strings to prevent Mongoose CastErrors
            if (!payload.assignedTo) delete payload.assignedTo;
            if (!payload.expectedCloseDate) delete payload.expectedCloseDate;
            if (!payload.productId) delete payload.productId;

            if (editingOpportunity) {
                await axios.put(`/api/opportunities/${editingOpportunity._id}`, payload);
                toast.success('Opportunity updated successfully');
            } else {
                await axios.post('/api/opportunities', payload);
                toast.success('Opportunity created successfully');
            }
            
            setFormData({ title: '', amount: '', stage: 'New', contactId: '', assignedTo: '', expectedCloseDate: '', expectedCloseHour: '09', expectedCloseMinute: '00', expectedClosePeriod: 'AM', modules: [] });
            setIsDrawerOpen(false);
            setEditingOpportunity(null);
            fetchData(); 
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to save. Check inputs.");
        }
    };

    const openCreateDrawer = () => {
        setEditingOpportunity(null);
        setFormData({ title: '', amount: '', stage: 'New', contactId: '', assignedTo: '', expectedCloseDate: '', expectedCloseHour: '09', expectedCloseMinute: '00', expectedClosePeriod: 'AM', modules: [] });
        setIsDrawerOpen(true);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    };

    const getColumnTotal = (stage) => {
        return opportunities
            .filter(o => o.stage === stage)
            .reduce((sum, o) => sum + (o.amount || 0), 0);
    };

    const totalPipelineValue = opportunities.reduce((sum, o) => sum + (o.amount || 0), 0);

    const getStageColor = (stage) => {
        switch(stage) {
            case 'New': return { accent: '#3b82f6', bg: '#eff6ff', text: '#1e40af' };
            case 'In Execution': return { accent: '#8b5cf6', bg: '#f5f3ff', text: '#5b21b6' };
            case 'Review': return { accent: '#f59e0b', bg: '#fffbeb', text: '#92400e' };
            case 'Completed': return { accent: '#22c55e', bg: '#f0fdf4', text: '#166534' };
            case 'Cancelled': return { accent: '#ef4444', bg: '#fef2f2', text: '#991b1b' };
            default: return { accent: '#64748b', bg: '#f8fafc', text: '#334155' };
        }
    };

    if (loading) return <LoadingSpinner message="Loading Sales Pipeline..." />;

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ padding: '1.5rem 2rem 1rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Sales Pipeline</h1>
            </div>            {/* Filters & Actions */}
            <div style={{ padding: '0 2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                     <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            placeholder="Search deals..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', width: '250px', fontSize: '0.9rem' }} 
                        />
                    </div>
                </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Pipeline</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(totalPipelineValue)}</div>
                    </div>
                    <div style={{ height: '32px', width: '1px', backgroundColor: '#e2e8f0' }}></div>
                     <button 
                        className="btn btn-primary" 
                        onClick={openCreateDrawer}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.75rem 1.25rem', borderRadius: '8px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
                    >
                        <Plus size={18} />
                        New Deal
                    </button>
                     <button 
                        className="btn btn-ghost" 
                        onClick={() => exportToCSV(opportunities, 'opportunities')}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.75rem 1.25rem', borderRadius: '8px', fontWeight: 600, border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                    >
                        <Download size={18} />
                        Export
                    </button>

                    <div style={{ display: 'flex', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px' }}>
                        <button 
                            onClick={() => setViewMode('kanban')}
                            style={{ 
                                padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                backgroundColor: viewMode === 'kanban' ? '#eff6ff' : 'transparent',
                                color: viewMode === 'kanban' ? '#3b82f6' : '#64748b'
                            }}
                            title="Kanban View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            style={{ 
                                padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                backgroundColor: viewMode === 'list' ? '#eff6ff' : 'transparent',
                                color: viewMode === 'list' ? '#3b82f6' : '#64748b'
                            }}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {viewMode === 'kanban' ? (
                /* Kanban Grid Layout (3x2) */
                <div style={{ 
                flex: 1, padding: '1.5rem 2rem', overflowY: 'auto', 
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem',
                alignContent: 'start'
            }}>
                {STAGES.map(stage => {
                    const stageStyle = getStageColor(stage);
                    const stageDeals = opportunities.filter(o => 
                        o.stage === stage && 
                        (o.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (o.contactId?.company || '').toLowerCase().includes(searchQuery.toLowerCase()))
                    );
                    const columnTotal = stageDeals.reduce((sum, o) => sum + (o.amount || 0), 0);
                    
                    return (
                        <div 
                            key={stage}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage)}
                            style={{ 
                                backgroundColor: '#f8fafc', borderRadius: '16px', 
                                display: 'flex', flexDirection: 'column', 
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                height: 'fit-content', // Allow column to grow but respect grid flow
                                minHeight: '300px'
                            }}
                        >
                            {/* Column Header */}
                            <div style={{ 
                                padding: '1.25rem', borderBottom: '1px solid #e2e8f0', 
                                backgroundColor: 'white', borderTopLeftRadius: '16px', borderTopRightRadius: '16px',
                                display: 'flex', flexDirection: 'column', gap: '0.5rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b', letterSpacing: '-0.3px', textTransform: 'uppercase' }}>{stage}</h3>
                                    <span style={{ 
                                        backgroundColor: stageStyle.bg, color: stageStyle.text, 
                                        padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 
                                    }}>
                                        {stageDeals.length}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ height: '6px', flex: 1, backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', marginRight: '1rem' }}>
                                        <div style={{ height: '100%', width: '100%', backgroundColor: stageStyle.accent }}></div>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 800 }}>
                                        {formatCurrency(columnTotal)}
                                    </div>
                                </div>
                            </div>

                            {/* Cards Container */}
                            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {stageDeals.map(opp => {
                                    const contact = contacts.find(c => c._id === opp.contactId) || contacts.find(c => c._id === opp.contactId?._id);
                                    const assignedUser = users.find(u => u._id === opp.assignedTo) || (opp.assignedTo && typeof opp.assignedTo === 'object' ? opp.assignedTo : null);

                                    return (
                                        <div
                                            key={opp._id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, opp)}
                                            onDragEnd={handleDragEnd}
                                            onClick={() => handleEdit(opp)}
                                            style={{
                                                backgroundColor: 'white', padding: '1.25rem', borderRadius: '12px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03)',
                                                cursor: 'grab', border: '1px solid #f1f5f9', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative'
                                            }}
                                            className="kanban-card group"
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-3px)';
                                                e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(0, 0, 0, 0.08)';
                                                e.currentTarget.style.borderColor = stageStyle.accent + '40';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03)';
                                                e.currentTarget.style.borderColor = '#f1f5f9';
                                            }}
                                        >
                                            {/* Delete Button (Visible on Hover) */}
                                            <div style={{ position: 'absolute', top: '10px', right: '10px', opacity: 0, transition: 'opacity 0.2s' }} className="group-hover:opacity-100">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(opp); }}
                                                    style={{ padding: '5px', borderRadius: '6px', color: '#ef4444', border: 'none', background: '#fee2e2', cursor: 'pointer' }}
                                                    title="Delete Deal"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>

                                            {/* Card Content */}
                                            <div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                                                    {contact ? contact.company || 'Direct Client' : 'Prospect'}
                                                </div>
                                                <h4 style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>{opp.title}</h4>
                                                
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '0.5rem' }}>
                                                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(opp.amount)}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>est.</span>
                                                </div>

                                                {/* Employee Task Status Badge */}
                                                {opp.employeeTaskStatus === 'Completed' && (
                                                    <div style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ecfdf5', color: '#047857', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid #d1fae5' }}>
                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                                                        Task Completed
                                                    </div>
                                                )}
                                                
                                                {/* Meta Info Row */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #f8fafc' }}>
                                                    {assignedUser ? (
                                                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div title={`Assigned to ${assignedUser.name}`} style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 600, border: '2px solid white', boxShadow: '0 0 0 1px #e2e8f0' }}>
                                                                {assignedUser.name ? assignedUser.name.charAt(0).toUpperCase() : '?'}
                                                            </div>
                                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>{assignedUser.name.split(' ')[0]}</span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontStyle: 'italic' }}>Unassigned</span>
                                                    )}
                                                    
                                                    {opp.expectedCloseDate && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f0f9ff', color: '#0284c7' }}>
                                                            <Calendar size={12} />
                                                            <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                                                                {new Date(opp.expectedCloseDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {stageDeals.length === 0 && (
                                    <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', backgroundColor: '#f8fafc' }}>
                                        <p style={{ fontWeight: 500 }}>Empty Stage</p>
                                        <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Drag deals here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            ) : (
                /* List View */
                <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '1.25rem', textAlign: 'left', fontWeight: 700, color: '#475569', width: '30%' }}>Deal Name</th>
                                    <th style={{ padding: '1.25rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Stage</th>
                                    <th style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 700, color: '#475569' }}>Value</th>
                                    <th style={{ padding: '1.25rem', textAlign: 'left', fontWeight: 700, color: '#475569', paddingLeft: '3rem' }}>Contact</th>
                                    <th style={{ padding: '1.25rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Assigned To</th>
                                    <th style={{ padding: '1.25rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Close Date</th>
                                    <th style={{ padding: '1.25rem', textAlign: 'center', fontWeight: 700, color: '#475569', width: '80px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {opportunities
                                    .filter(o => o.title.toLowerCase().includes(searchQuery.toLowerCase()) || (o.contactId?.company || '').toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(opp => {
                                        const contact = contacts.find(c => c._id === opp.contactId) || contacts.find(c => c._id === opp.contactId?._id);
                                        const assignedUser = users.find(u => u._id === opp.assignedTo) || (opp.assignedTo && typeof opp.assignedTo === 'object' ? opp.assignedTo : null);
                                        const stageStyle = getStageColor(opp.stage);

                                        return (
                                            <tr key={opp._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }} className="hover:bg-slate-50">
                                                <td style={{ padding: '1.25rem' }}>
                                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{opp.title}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>ID: {opp._id.slice(-6)}</div>
                                                    {opp.employeeTaskStatus === 'Completed' && (
                                                        <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, border: '1px solid #d1fae5' }}>
                                                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                                                            Task Completed
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1.25rem' }}>
                                                    <span style={{ backgroundColor: stageStyle.bg, color: stageStyle.text, padding: '6px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
                                                        {opp.stage}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                                                    {formatCurrency(opp.amount)}
                                                </td>
                                                <td style={{ padding: '1.25rem', paddingLeft: '3rem' }}>
                                                    {contact ? (
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: '#334155' }}>{contact.company || contact.name}</div>
                                                            {contact.company && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{contact.name}</div>}
                                                        </div>
                                                    ) : <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>--</span>}
                                                </td>
                                                <td style={{ padding: '1.25rem' }}>
                                                    {assignedUser ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                                                                {assignedUser.name ? assignedUser.name.charAt(0).toUpperCase() : '?'}
                                                            </div>
                                                            <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>{assignedUser.name}</span>
                                                        </div>
                                                    ) : <span style={{ fontSize: '0.875rem', color: '#cbd5e1', fontStyle: 'italic' }}>Unassigned</span>}
                                                </td>
                                                <td style={{ padding: '1.25rem', color: '#64748b', fontSize: '0.875rem' }}>
                                                    {opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString() : '--'}
                                                </td>
                                                <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                        <button 
                                                            onClick={() => handleEdit(opp)}
                                                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', color: '#3b82f6' }}
                                                            title="Edit Deal"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setShowDeleteConfirm(opp)}
                                                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #fee2e2', backgroundColor: '#fff1f2', cursor: 'pointer', color: '#ef4444' }}
                                                            title="Delete Deal"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                })}
                                {opportunities.length === 0 && (
                                    <tr>
                                        <td colSpan="7" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                                            No deals found in the pipeline.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit/Create Drawer */}
            {isDrawerOpen && (
                <>
                    <div 
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 40, backdropFilter: 'blur(3px)' }} 
                        onClick={() => setIsDrawerOpen(false)}
                    />
                    <div style={{
                        position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px', backgroundColor: 'white', zIndex: 50,
                        boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column',
                        animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{ padding: '2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{editingOpportunity ? 'Edit Deal' : 'New Opportunity'}</h2>
                                <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '2px' }}>{editingOpportunity ? 'Update deal details.' : 'Add a deal to your pipeline.'}</p>
                            </div>
                            <button onClick={() => setIsDrawerOpen(false)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', backgroundColor: 'white' }}>
                                <X size={20} color="#64748b" />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                            <form id="dealForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#334155' }}>Select Product / Service</label>
                                    <select 
                                        name="productId" // Add name attribute
                                        value={formData.productId || ''} // Control via state
                                        onChange={handleProductChange}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '0.95rem' }}
                                    >
                                        <option value="">-- Choose a Product (Optional) --</option>
                                        {products.map(p => (
                                            <option key={p._id} value={p._id}>{p.name} - ${p.price}</option>
                                        ))}
                                    </select>
                                    <p style={{marginTop: '4px', fontSize: '0.75rem', color: '#64748b'}}>Selecting a product will auto-fill modules and value.</p>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#334155' }}>Deal Title <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input required type="text" name="title" value={formData.title} onChange={handleChange} 
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} placeholder="e.g. Q4 Marketing Contract" />
                                </div>

                                 <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#334155' }}>Value <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>$</div>
                                        <input required type="number" name="amount" value={formData.amount} onChange={handleChange} 
                                            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 500 }} placeholder="0.00" />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#334155' }}>Related Contact</label>
                                    <select required name="contactId" value={formData.contactId} onChange={handleChange}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '0.95rem' }}>
                                        <option value="">Select a Contact...</option>
                                        {contacts.map(c => (
                                            <option key={c._id} value={c._id}>{c.name} {c.company ? `- ${c.company}` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#334155' }}>Assign To (Employee)</label>
                                    <select name="assignedTo" value={formData.assignedTo} onChange={handleChange}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '0.95rem' }}>
                                        <option value="">Unassigned</option>
                                        {users.filter(u => u.role === 'Employee').map(u => (
                                            <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#334155' }}>Stage</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {STAGES.map(s => (
                                            <button 
                                                key={s} 
                                                type="button"
                                                onClick={() => setFormData({...formData, stage: s})}
                                                style={{ 
                                                    padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                                                    border: formData.stage === s ? `1px solid ${getStageColor(s).accent}` : '1px solid #e2e8f0',
                                                    backgroundColor: formData.stage === s ? getStageColor(s).bg : 'white',
                                                    color: formData.stage === s ? getStageColor(s).text : '#64748b',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                 <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#334155' }}>Target Close Date & Time</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input 
                                            type="date" 
                                            name="expectedCloseDate" 
                                            value={formData.expectedCloseDate || ''} 
                                            onChange={handleChange}
                                            style={{ flex: 2, padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} 
                                        />
                                        <select 
                                            name="expectedCloseHour"
                                            value={formData.expectedCloseHour || '09'} 
                                            onChange={(e) => setFormData(prev => ({ ...prev, expectedCloseHour: e.target.value }))}
                                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', backgroundColor: 'white' }} 
                                        >
                                            {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                        <select 
                                            name="expectedCloseMinute"
                                            value={formData.expectedCloseMinute || '00'} 
                                            onChange={(e) => setFormData(prev => ({ ...prev, expectedCloseMinute: e.target.value }))}
                                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', backgroundColor: 'white' }} 
                                        >
                                            {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        <select 
                                            name="expectedClosePeriod"
                                            value={formData.expectedClosePeriod || 'AM'} 
                                            onChange={(e) => setFormData(prev => ({ ...prev, expectedClosePeriod: e.target.value }))}
                                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', backgroundColor: 'white' }} 
                                        >
                                            {['AM', 'PM'].map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Project Modules Section */}
                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>Project Modules Progress</label>
                                    
                                    {/* Fallback only if NO modules and NO product selected (Init state) */}
                                    {(!formData.modules || formData.modules.length === 0) && !formData.productId ? (
                                        <div style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                                            Select a product to load standard modules, or defaults will be used on save.
                                        </div>
                                    ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {(formData.modules || []).map((mod, idx) => (
                                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                const newModules = (formData.modules || []).filter((_, i) => i !== idx);
                                                                setFormData({ ...formData, modules: newModules });
                                                            }}
                                                            style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                            title="Remove Module"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>{mod.name}</span>
                                                    </div>
                                                    {/* Internal Status - Editable by Assigned User & Admin */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>INTERNAL:</span>
                                                        <select 
                                                            disabled={user?.role === 'Admin'}
                                                            value={mod.status}
                                                            onChange={(e) => {
                                                                const newModules = [...(formData.modules && formData.modules.length > 0 ? formData.modules : DEFAULT_MODULES)];
                                                                newModules[idx] = { ...newModules[idx], status: e.target.value };
                                                                setFormData({ ...formData, modules: newModules });
                                                            }}
                                                            style={{ 
                                                                padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, border: 'none',
                                                                backgroundColor: mod.status === 'Completed' ? '#dcfce7' : mod.status === 'In Progress' ? '#dbeafe' : '#f1f5f9',
                                                                color: mod.status === 'Completed' ? '#166534' : mod.status === 'In Progress' ? '#1e40af' : '#64748b',
                                                                opacity: user?.role === 'Admin' ? 0.7 : 1,
                                                                cursor: user?.role === 'Admin' ? 'not-allowed' : 'pointer'
                                                            }}
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="In Progress">In Progress</option>
                                                            <option value="Completed">Completed</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Client Status - Visible ONLY to Admin */}
                                                {(user?.role === 'Admin') && (
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', borderTop: '1px dashed #e2e8f0', paddingTop: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>CLIENT VIEW:</span>
                                                        <select 
                                                            // Allow Admin to update Client Status freely
                                                            value={mod.clientStatus || 'Pending'}
                                                            onChange={(e) => {
                                                                const newModules = [...(formData.modules && formData.modules.length > 0 ? formData.modules : DEFAULT_MODULES)];
                                                                newModules[idx] = { ...newModules[idx], clientStatus: e.target.value };
                                                                setFormData({ ...formData, modules: newModules });
                                                            }}
                                                            title="Update client visibility"
                                                            style={{ 
                                                                padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #fcd34d',
                                                                backgroundColor: mod.status !== 'Completed' ? '#f3f4f6' : '#fffbeb', 
                                                                color: mod.status !== 'Completed' ? '#9ca3af' : '#b45309',
                                                                opacity: mod.status !== 'Completed' ? 0.6 : 1,
                                                                cursor: mod.status !== 'Completed' ? 'not-allowed' : 'pointer'
                                                            }}
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="In Progress">In Progress</option>
                                                            <option value="Completed">Completed</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Add Custom Module Row */}
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px dashed #e2e8f0', paddingTop: '1rem' }}>
                                            <input 
                                                type="text" 
                                                id="newModuleName" 
                                                placeholder="Add custom module..." 
                                                style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const name = e.target.value.trim();
                                                        if (name) {
                                                            const newModules = [...(formData.modules || []), { name, status: 'Pending', clientStatus: 'Pending' }];
                                                            setFormData({ ...formData, modules: newModules });
                                                            e.target.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    const input = document.getElementById('newModuleName');
                                                    const name = input ? input.value.trim() : '';
                                                    if (name) {
                                                        const newModules = [...(formData.modules || []), { name, status: 'Pending', clientStatus: 'Pending' }];
                                                        setFormData({ ...formData, modules: newModules });
                                                        input.value = '';
                                                    }
                                                }}
                                                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                                            >
                                                Add Module
                                            </button>
                                        </div>
                                    </div>
                                    )}
                                </div>
                            </form>
                        </div>
                        
                        <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                            {editingOpportunity ? (
                                <button 
                                    onClick={() => setShowDeleteConfirm(editingOpportunity)}
                                    className="btn btn-ghost" 
                                    style={{ color: '#ef4444', fontWeight: 600 }}
                                >
                                    <Trash2 size={18} style={{ marginRight: '6px' }} />
                                    Delete
                                </button>
                            ) : <div></div>}
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setIsDrawerOpen(false)} className='btn btn-ghost' style={{ fontWeight: 600 }}>Cancel</button>
                                <button form="dealForm" type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}>{editingOpportunity ? 'Save Changes' : 'Create Deal'}</button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Premium Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div style={{ 
                    position: 'fixed', inset: 0, 
                    backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
                    zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{ 
                        backgroundColor: 'white', 
                        width: '400px', 
                        borderRadius: '24px', 
                        padding: '2.5rem', 
                        textAlign: 'center',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                         <div style={{ 
                             width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#ef4444', 
                             display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto'
                         }}>
                            <Trash2 size={32} strokeWidth={2} />
                         </div>
                         
                         <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', letterSpacing: '-0.5px' }}>
                             Delete Deal?
                         </h3>
                         
                         <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.5', marginBottom: '2rem' }}>
                             You are about to permanently delete <br/>
                             <strong style={{color: '#334155'}}>{showDeleteConfirm.title}</strong>. 
                             <br/><span style={{fontSize: '0.85rem'}}>This action cannot be undone.</span>
                         </p>

                         <div style={{ display: 'flex', gap: '1rem' }}>
                             <button 
                                onClick={() => setShowDeleteConfirm(null)}
                                style={{ 
                                    flex: 1, padding: '0.875rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem',
                                    backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                             >
                                 Cancel
                             </button>
                             <button 
                                onClick={() => handleDelete(showDeleteConfirm._id)}
                                style={{ 
                                    flex: 1, padding: '0.875rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem',
                                    backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                             >
                                 Yes, Delete
                             </button>
                         </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .kanban-card:hover {
                    z-index: 10;
                }
            `}</style>
        </div>
    );
};

export default Opportunities;

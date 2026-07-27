import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Package, Trash2, Edit2, ShoppingBag, Box, X, Code, Server, Wrench, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = ['CRM Services', 'HRMS Services', 'Customer Support', 'AWS & Cloud'];

const Products = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    
    // Updated State with Image
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        category: 'CRM Services',
        description: '',
        stock: 0,
        image: ''
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [products, searchQuery, categoryFilter]);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products');
            console.log("Fetched Products Data:", res.data.data); // DEBUG LOG
            setProducts(res.data.data || []);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch products", err);
            setLoading(false);
        }
    };

    const filterProducts = () => {
        let temp = [...products];
        
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            temp = temp.filter(p => 
                p.name?.toLowerCase().includes(lowerQuery) || 
                p.sku?.toLowerCase().includes(lowerQuery)
            );
        }

        if (categoryFilter !== 'All') {
            temp = temp.filter(p => p.category === categoryFilter);
        }

        setFilteredProducts(temp);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEdit = (product) => {
        if (user?.role !== 'Admin') {
            toast.error("Only Admins can edit products.");
            return;
        }
        setEditingProduct(product);
        setFormData({
            name: product.name,
            sku: product.sku,
            price: product.price,
            category: product.category || 'CRM Services',
            description: product.description || '',
            stock: product.stock,
            image: product.image || ''
        });
        setIsDrawerOpen(true);
    };

    const handleDelete = (product) => {
         if (user?.role !== 'Admin') {
            toast.error("Only Admins can delete products.");
            return;
        }
        setShowDeleteConfirm(product);
    };

    const confirmDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await axios.delete(`/api/products/${showDeleteConfirm._id}`);
            toast.success("Product deleted successfully");
            setProducts(prev => prev.filter(p => p._id !== showDeleteConfirm._id));
            setShowDeleteConfirm(null);
        } catch (err) {
            console.error("Failed to delete product", err);
            toast.error("Failed to delete product");
            setShowDeleteConfirm(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const payload = {
            ...formData,
            price: Number(formData.price),
            stock: Number(formData.stock),
        };
        console.log("Submitting Product:", payload);

        try {
            if (editingProduct) {
                await axios.put(`/api/products/${editingProduct._id}`, payload);
                toast.success("Product updated successfully!");
            } else {
                await axios.post('/api/products', payload);
                toast.success("Product created successfully!");
            }
            
            setFormData({ name: '', sku: '', price: '', category: 'CRM Services', description: '', stock: 0, image: '' });
            setIsDrawerOpen(false);
            setEditingProduct(null);
            fetchProducts();
        } catch (err) {
            console.error("Failed to save product", err);
            if (err.response?.data?.error) {
                toast.error(`Error: ${err.response.data.error}`);
            } else {
                toast.error("Failed to save product. Check SKU uniqueness.");
            }
        }
    };

    const openCreateDrawer = () => {
        setEditingProduct(null);
        setFormData({ name: '', sku: '', price: '', category: 'CRM Services', description: '', stock: 0, image: '' });
        setIsDrawerOpen(true);
    };

    const getCategoryColor = (cat) => {
        switch(cat) {
            case 'CRM Services': return { bg: '#e0e7ff', text: '#3730a3' }; // Indigo
            case 'HRMS Services': return { bg: '#dcfce7', text: '#166534' }; // Emerald
            case 'Customer Support': return { bg: '#ffedd5', text: '#c2410c' }; // Orange
            case 'AWS & Cloud': return { bg: '#f0f9ff', text: '#0369a1' }; // Sky
            default: return { bg: '#f1f5f9', text: '#334155' };
        }
    };

    const getCategoryIcon = (category) => {
        const size = 28;
        switch(category) {
            case 'CRM Services': return <Code size={size} className="text-indigo-600" />;
            case 'HRMS Services': return <Wrench size={size} className="text-emerald-600" />;
            case 'Customer Support': return <Sparkles size={size} className="text-orange-600" />;
            case 'AWS & Cloud': return <Server size={size} className="text-sky-600" />;
            default: return <Package size={size} className="text-slate-500" />;
        }
    };

    if (loading) return <LoadingSpinner message="Synchronizing Catalog..." />;

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
             style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* Header */}
            <div className="bg-white border-b border-slate-200/80 px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Product Catalog</h1>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5">Manage corporate services, software licenses, and inventory offerings.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search catalog by name, SKU..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-64 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs"
                        />
                    </div>

                    {user?.role === 'Admin' && (
                        <button 
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
                            onClick={openCreateDrawer}
                        >
                            <Plus size={16} /> Add Product
                        </button>
                    )}
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto">
                    {/* Dynamic Category Filter Pills */}
                    <div className="flex flex-wrap items-center gap-2 mb-8 bg-slate-200/60 p-1.5 rounded-2xl border border-slate-200/80 w-fit shrink-0">
                        <button 
                            onClick={() => setCategoryFilter('All')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 border-none cursor-pointer ${
                                categoryFilter === 'All' 
                                ? 'bg-slate-900 text-white shadow-xs' 
                                : 'text-slate-600 hover:text-slate-900 bg-transparent'
                            }`}
                        >
                            All Products
                        </button>
                        {CATEGORIES.map(c => {
                            const isActive = categoryFilter === c;
                            return (
                                <button 
                                    key={c}
                                    onClick={() => setCategoryFilter(c)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 border-none cursor-pointer ${
                                        isActive 
                                        ? 'bg-slate-900 text-white shadow-xs' 
                                        : 'text-slate-600 hover:text-slate-900 bg-transparent'
                                    }`}
                                >
                                    {c}
                                </button>
                            );
                        })}
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-stone-400">
                            <div className="w-24 h-24 bg-stone-100 rounded-3xl flex items-center justify-center mb-8">
                                <Package size={48} className="text-stone-300" />
                            </div>
                            <h3 className="text-xl font-black text-stone-800 tracking-tight">No products found</h3>
                            <p className="font-medium mt-2">Try adjusting your filters or add a new product.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-12">
                            {filteredProducts.map(product => {
                                const catColor = getCategoryColor(product.category);
                                return (
                                    <div 
                                        key={product._id} 
                                        className="bg-white rounded-[24px] border border-stone-200/60 overflow-hidden group hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 relative flex flex-col z-10"
                                    >
                                        {/* Dynamic category colored backdrop hover radial glow */}
                                        <div 
                                            className="absolute -inset-px opacity-0 group-hover:opacity-100 rounded-[24px] transition-opacity duration-500 pointer-events-none z-0" 
                                            style={{ 
                                                background: `radial-gradient(350px circle at 50% 100%, ${catColor.text}08, transparent 80%)`,
                                                border: `1px solid ${catColor.text}15`
                                            }} 
                                        />

                                        {/* Image wrapper slot */}
                                        <div 
                                            className="h-44 flex items-center justify-center relative overflow-hidden transition-colors duration-500 z-10"
                                            style={{ backgroundColor: catColor.bg }}
                                        >
                                            <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-500" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                                            
                                            {/* Category specific vector representation */}
                                            <div className="transform group-hover:scale-105 transition-all duration-500 z-0 flex items-center justify-center bg-white w-16 h-16 rounded-[20px] shadow-sm border border-stone-200/20">
                                                {getCategoryIcon(product.category)}
                                            </div>

                                            {product.image && (
                                                <img 
                                                    src={product.image} 
                                                    alt={product.name} 
                                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 z-10" 
                                                    onError={(e) => { e.target.style.display = 'none'; }} 
                                                />
                                            )}
                                        </div>

                                        {/* Card content block */}
                                        <div className="p-5 flex-1 flex flex-col relative z-10">
                                            {/* Category Badge & SKU row */}
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <span 
                                                    className="text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm border border-white"
                                                    style={{ backgroundColor: catColor.bg, color: catColor.text }}
                                                >
                                                    {product.category}
                                                </span>
                                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest bg-stone-50 px-2 py-0.5 rounded border border-stone-200/30">
                                                    {product.sku}
                                                </span>
                                            </div>
                                            
                                            <h3 className="font-extrabold text-stone-900 text-base mb-1.5 tracking-tight line-clamp-1 group-hover:text-amber-600 transition-colors duration-300">
                                                {product.name}
                                            </h3>
                                            <p className="text-[11px] text-stone-500 font-medium mb-5 line-clamp-2 flex-1 leading-relaxed">
                                                {product.description || 'Enterprise grade solution tailored for optimal efficiency.'}
                                            </p>
                                            
                                            <div className="flex justify-between items-center pt-4 border-t border-stone-100 mt-auto">
                                                <div>
                                                    <span className="block text-[8px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Price</span>
                                                    <span className="text-lg font-black text-stone-900 tracking-tight leading-none">${product.price?.toLocaleString()}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border bg-emerald-50/70 text-emerald-700 border-emerald-200/60">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        Active Service
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Float Controls */}
                                        {user?.role === 'Admin' && (
                                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 lg:translate-y-1 group-hover:translate-y-0 transition-all duration-300 z-20">
                                                <button 
                                                    onClick={() => handleEdit(product)} 
                                                    className="w-8 h-8 rounded-lg bg-white border border-stone-200 shadow-md flex items-center justify-center text-stone-600 hover:text-amber-600 hover:border-amber-200 transition-all cursor-pointer bg-transparent border-none"
                                                    title="Edit Product"
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(product)} 
                                                    className="w-8 h-8 rounded-lg bg-white border border-stone-200 shadow-md flex items-center justify-center text-stone-600 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer bg-transparent border-none"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isDrawerOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40" 
                            onClick={() => setIsDrawerOpen(false)} 
                        />
                        <motion.div 
                            initial={{ x: '100%', opacity: 0.5 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="fixed top-0 right-0 bottom-0 w-full sm:w-[500px] bg-white z-50 shadow-2xl flex flex-col border-l border-slate-200/80"
                        >
                            <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-stone-900 tracking-tight">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                                    <p className="text-stone-500 font-medium text-sm mt-1">Configure your catalog items with precision.</p>
                                </div>
                                <button onClick={() => setIsDrawerOpen(false)} className="w-10 h-10 rounded-xl border border-stone-200 flex items-center justify-center text-stone-400 hover:bg-white hover:text-stone-900 transition-all shadow-sm cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8">
                                <form id="productForm" onSubmit={handleSubmit} className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Product Identity</label>
                                        <input 
                                            required 
                                            type="text" 
                                            name="name" 
                                            value={formData.name} 
                                            onChange={handleChange} 
                                            className="w-full px-5 py-3.5 rounded-2xl border border-stone-200 bg-stone-50/30 text-stone-900 font-bold focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none"
                                            placeholder="e.g. Enterprise Cloud License" 
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Image URL</label>
                                        <input 
                                            type="url" 
                                            name="image" 
                                            value={formData.image} 
                                            onChange={handleChange} 
                                            className="w-full px-5 py-3.5 rounded-2xl border border-stone-200 bg-stone-50/30 text-stone-900 font-medium focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none"
                                            placeholder="https://example.com/product-image.png" 
                                        />
                                         {formData.image && (
                                            <div className="mt-2 h-24 w-full rounded-2xl border border-stone-200 overflow-hidden bg-stone-50">
                                                <img src={formData.image} alt="Preview" className="h-full w-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">SKU Reference</label>
                                            <input 
                                                required 
                                                type="text" 
                                                name="sku" 
                                                value={formData.sku} 
                                                onChange={handleChange} 
                                                className="w-full px-5 py-3.5 rounded-2xl border border-stone-200 bg-stone-50/30 text-stone-900 font-black tracking-tight focus:border-amber-500 outline-none transition-all uppercase"
                                                placeholder="SKU-001" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Category</label>
                                            <select 
                                                name="category" 
                                                value={formData.category} 
                                                onChange={handleChange}
                                                className="w-full px-5 py-3.5 rounded-2xl border border-stone-200 bg-white text-stone-700 font-bold focus:border-amber-500 outline-none transition-all appearance-none"
                                            >
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Service Fee ($)</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 font-black">$</span>
                                            <input 
                                                required 
                                                type="number" 
                                                name="price" 
                                                value={formData.price} 
                                                onChange={handleChange} 
                                                min="0" 
                                                step="0.01"
                                                className="w-full pl-10 pr-5 py-3.5 rounded-2xl border border-stone-200 bg-stone-50/30 text-stone-900 font-black focus:border-amber-500 outline-none transition-all"
                                                placeholder="0.00" 
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Description</label>
                                        <textarea 
                                            name="description" 
                                            value={formData.description} 
                                            onChange={handleChange} 
                                            rows={5}
                                            className="w-full px-5 py-4 rounded-2xl border border-stone-200 bg-stone-50/30 text-stone-900 font-medium text-sm focus:border-amber-500 outline-none transition-all resize-none"
                                            placeholder="Enter comprehensive product specifications..." 
                                        />
                                    </div>
                                </form>
                            </div>
                            
                            <div className="p-8 border-t border-stone-100 bg-stone-50/50 flex gap-4">
                                <button onClick={() => setIsDrawerOpen(false)} className="flex-1 px-6 py-4 rounded-2xl bg-white border border-stone-200 text-stone-600 font-black text-sm uppercase hover:bg-stone-100 transition-all cursor-pointer">Cancel</button>
                                <button form="productForm" type="submit" className="flex-[2] px-6 py-4 rounded-2xl bg-stone-900 text-white font-black text-sm uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-stone-200 cursor-pointer">
                                    {editingProduct ? 'Update Product' : 'Authorize Product'}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                    <div className="bg-white p-10 rounded-[40px] w-full max-w-[440px] text-center shadow-2xl animate-in zoom-in duration-300">
                         <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                            <Trash2 size={40} strokeWidth={2.5} />
                        </div>
                         <h3 className="text-2xl font-black text-stone-900 tracking-tight">Decommission Product?</h3>
                         <p className="text-stone-500 font-medium mt-3 mb-10 leading-relaxed">
                            Are you certain you want to remove <strong>{showDeleteConfirm.name}</strong> from the catalog? This action is irreversible.
                        </p>
                         <div className="flex gap-4">
                             <button className="flex-1 py-4 px-6 rounded-2xl bg-stone-50 text-stone-600 font-black text-sm uppercase tracking-widest hover:bg-stone-100 transition-all" onClick={() => setShowDeleteConfirm(null)}>Abort</button>
                             <button className="flex-1 py-4 px-6 rounded-2xl bg-red-500 text-white font-black text-sm uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-200" onClick={confirmDelete}>Confirm Delete</button>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;

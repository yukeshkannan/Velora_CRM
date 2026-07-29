import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
    Globe, Smartphone, Zap, Shield, 
    BarChart, Database, ArrowRight, Check,
    Monitor, Server, Code2, Sparkles, MessageSquare, Building2,
    Package, Layers, ChevronRight, ChevronDown, HelpCircle, Filter, LayoutGrid,
    FileText, ShieldCheck, CreditCard, Clock, CheckCircle2, X, DollarSign, Send, Calendar
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Explore = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [contactId, setContactId] = useState(null);
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);

    // Dedicated Quote Modal State
    const [quoteModalProduct, setQuoteModalProduct] = useState(null); // For Request Quote

    // Quote Request Form State
    const [quoteNotes, setQuoteNotes] = useState('');
    const [contactPref, setContactPref] = useState('As soon as possible');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successModalData, setSuccessModalData] = useState(null);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                // 1. Fetch Products from DB
                const prodRes = await axios.get('/api/products');
                setProducts(prodRes.data.data || []);

                // 2. Fetch Contact ID (Filtered by Email)
                if (user?.email) {
                    const res = await axios.get(`/api/contacts?email=${user.email}`);
                    const contact = (res.data.data || [])[0];
                    if (contact) setContactId(contact._id);
                }

                setLoading(false);
            } catch (err) {
                console.error("Error fetching content:", err);
                setLoading(false);
            }
        };
        if (user?.email) fetchContent();

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [user]);

    // Helper to get icon based on category/name
    const getServiceIcon = (category, name) => {
        const lowerName = name?.toLowerCase() || '';
        const lowerCat = category?.toLowerCase() || '';

        if (lowerCat.includes('crm') || lowerName.includes('crm') || lowerName.includes('sales')) {
            return <Layers size={22} />;
        }
        if (lowerCat.includes('hrms') || lowerName.includes('hrms') || lowerName.includes('payroll') || lowerName.includes('attendance')) {
            return <Building2 size={22} />;
        }
        if (lowerCat.includes('support') || lowerName.includes('helpdesk') || lowerName.includes('chat') || lowerName.includes('ticket')) {
            return <MessageSquare size={22} />;
        }
        if (lowerCat.includes('aws') || lowerCat.includes('cloud') || lowerName.includes('aws') || lowerName.includes('kubernetes') || lowerName.includes('devops')) {
            return <Server size={22} />;
        }

        return <Code2 size={22} />;
    };

    // Helper to ensure contact ID exists in DB
    const getOrCreateContactId = async () => {
        if (contactId) return contactId;
        try {
            const newContactRes = await axios.post('/api/contacts', {
                name: user.name,
                email: user.email,
                company: 'Enterprise Account',
                status: 'Customer'
            });
            const newId = newContactRes.data.data._id;
            setContactId(newId);
            return newId;
        } catch (err) {
            console.error("Auto contact creation error:", err);
            return null;
        }
    };

    // Handle Submit Quote Request (Routes directly into Sales Pipeline)
    const handleQuoteSubmit = async (e) => {
        e.preventDefault();
        if (!quoteModalProduct) return;

        setIsSubmitting(true);
        try {
            const activeContactId = await getOrCreateContactId();
            const amount = quoteModalProduct.price || 0;

            await axios.post('/api/opportunities', {
                contactId: activeContactId,
                title: `Quote Request: ${quoteModalProduct.name}`,
                amount: amount,
                stage: 'New',
                preferredContactTime: contactPref,
                description: `Service request from ${user?.name} (${user?.email}).\nPreferred Follow-up Time: ${contactPref}\nClient Notes: ${quoteNotes || 'None'}`
            });

            const refNum = `QR-${Math.floor(1000 + Math.random() * 9000)}`;
            setSuccessModalData({
                type: 'Quote',
                ref: refNum,
                title: quoteModalProduct.name,
                price: amount
            });

            setQuoteModalProduct(null);
            setQuoteNotes('');
            toast.success("Service quote request submitted! Sales team will follow up.");
        } catch (err) {
            console.error("Quote submission error:", err);
            toast.error("Failed to submit quote request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Services Portfolio...</p>
                </div>
            </div>
        );
    }

    // Extract unique categories dynamically from products
    const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

    // Filter products based on selectedCategory
    const filteredProducts = selectedCategory === 'All' 
        ? products 
        : products.filter(p => p.category === selectedCategory);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
             style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* Executive Header Bar */}
            <div className="bg-white border-b border-slate-200/80 px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-2xs">
                <div>
                     <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Services Catalogue</h1>
                     <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">Explore corporate engineering solutions, cloud infrastructure, and enterprise services.</p>
                </div>
                
                {/* Custom Executive Dropdown Filter */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-2.5 cursor-pointer border-none"
                    >
                        <Filter size={15} className="text-slate-300" />
                        <span>{selectedCategory === 'All' ? 'All Service Categories' : `${selectedCategory} Services`}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-800 text-slate-200">
                            {selectedCategory === 'All' ? products.length : products.filter(p => p.category === selectedCategory).length}
                        </span>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-white' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200/90 shadow-xl z-50 overflow-hidden py-1.5"
                            >
                                <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Filter by Category</span>
                                    <span className="text-[10px] font-bold text-slate-400">{products.length} Total</span>
                                </div>

                                <div className="py-1">
                                    {categories.map((cat) => {
                                        const count = cat === 'All' ? products.length : products.filter(p => p.category === cat).length;
                                        const isSelected = selectedCategory === cat;
                                        return (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCategory(cat);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold transition-colors border-none bg-transparent cursor-pointer text-left ${
                                                    isSelected ? 'bg-slate-100 text-slate-900 font-extrabold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                                        isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {cat === 'All' ? <LayoutGrid size={12} /> : cat.charAt(0)}
                                                    </div>
                                                    <span>{cat === 'All' ? 'All Solutions' : `${cat} Services`}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                                        isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {count}
                                                    </span>
                                                    {isSelected && <Check size={14} className="text-emerald-600" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Main Catalogue Grid */}
            <div className="flex-1 p-6 sm:p-8 max-w-[1600px] w-full mx-auto space-y-8">
                
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20 border border-slate-200 bg-white rounded-2xl p-8 shadow-2xs space-y-3">
                        <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mx-auto">
                            <Package size={24} />
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900">No Services Found</h3>
                        <p className="text-slate-500 text-xs font-medium max-w-sm mx-auto">
                            No services match the selected category ({selectedCategory}). Try switching back to 'All Service Categories'.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {filteredProducts.map((product) => (
                            <div
                                key={product._id}
                                className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-6 group"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200/60 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                            {getServiceIcon(product.category, product.name)}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                            {product.category || 'Service'}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">
                                            {product.description || 'Enterprise-grade service solution tailored for corporate deployment.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Price</span>
                                        <span className="text-lg font-black text-slate-900">${(product.price || 0).toLocaleString()}</span>
                                    </div>

                                    {/* Primary Action Button */}
                                    <button
                                        type="button"
                                        onClick={() => { setQuoteNotes(''); setQuoteModalProduct(product); }}
                                        className="w-full py-3 px-4 rounded-xl font-extrabold text-xs bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center justify-center gap-2 cursor-pointer border-none shadow-2xs group-hover:bg-indigo-600"
                                    >
                                        <FileText size={15} />
                                        <span>Request Quote & Order</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL 1: REQUEST QUOTE (Clean, Simple Human Form) */}
            <AnimatePresence>
                {quoteModalProduct && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.96, opacity: 0 }}
                            className="bg-white rounded-2xl max-w-md w-full text-left shadow-2xl border border-slate-200 overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900">Request Custom Quote</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{quoteModalProduct.name} • ${quoteModalProduct.price?.toLocaleString()}</p>
                                </div>
                                <button onClick={() => setQuoteModalProduct(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-900 border-none bg-transparent cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleQuoteSubmit} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 block">Project Requirements / Notes</label>
                                    <textarea 
                                        rows={3}
                                        value={quoteNotes}
                                        onChange={(e) => setQuoteNotes(e.target.value)}
                                        placeholder="Tell us about your project requirements, timeline, or scope..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none text-xs font-medium text-slate-900 transition-all shadow-2xs resize-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 block">Preferred Follow-up Time</label>
                                    <select 
                                        value={contactPref}
                                        onChange={(e) => setContactPref(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none text-xs font-bold text-slate-900 transition-all shadow-2xs"
                                    >
                                        <option value="As soon as possible">As soon as possible</option>
                                        <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                                        <option value="Afternoon (1 PM - 5 PM)">Afternoon (1 PM - 5 PM)</option>
                                    </select>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setQuoteModalProduct(null)} 
                                        className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-all border-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Send size={14} />
                                        {isSubmitting ? 'Sending...' : 'Submit Request'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SUCCESS CONFIRMATION MODAL */}
            <AnimatePresence>
                {successModalData && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.96, opacity: 0 }}
                            className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200"
                        >
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                                <CheckCircle2 size={32} />
                            </div>
                            <div>
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">Ref #{successModalData.ref}</span>
                                <h3 className="text-lg font-extrabold text-slate-900 mt-2">
                                    Quote Request Sent!
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                    Your custom service quote request for <strong>{successModalData.title}</strong> (${successModalData.price?.toLocaleString()}) has been submitted to the sales team.
                                </p>
                            </div>

                            <div className="pt-2 flex flex-col gap-2">
                                <button
                                    onClick={() => setSuccessModalData(null)}
                                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all border-none cursor-pointer"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Explore;

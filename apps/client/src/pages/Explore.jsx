import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
    Globe, Smartphone, Zap, Shield, 
    BarChart, Database, ArrowRight, Check,
    Monitor, Server, Code2, Sparkles, MessageSquare
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import BookingModal from '../components/BookingModal';

const Explore = () => {
    const { user } = useAuth();
    const [sending, setSending] = useState(false);
    const [sentId, setSentId] = useState(null);
    const [contactId, setContactId] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                // 1. Fetch Products from DB
                const prodRes = await axios.get('/api/products');
                setProducts(prodRes.data.data || []);

                // 2. Fetch Contact ID (Filtered by Email)
                if (user?.email) {
                    const res = await axios.get(`/api/contacts?email=${user.email}`);
                    const contact = (res.data.data || [])[0]; // Expecting single match
                    if (contact) setContactId(contact._id);
                }
                
                setLoading(false);
            } catch (err) {
                console.error("Error fetching content:", err);
                setLoading(false);
            }
        };
        if (user?.email) fetchContent();
    }, [user]);

    // Helper to get icon based on category
    const getServiceIcon = (category, name) => {
        const lowerName = name?.toLowerCase() || '';
        if (lowerName.includes('web') || lowerName.includes('app')) return <Monitor size={24} />;
        if (lowerName.includes('mobile') || lowerName.includes('phone')) return <Smartphone size={24} />;
        if (lowerName.includes('security') || lowerName.includes('shield')) return <Shield size={24} />;
        if (lowerName.includes('cloud') || lowerName.includes('database')) return <Server size={24} />;
        if (lowerName.includes('analytics') || lowerName.includes('data')) return <BarChart size={24} />;
        
        // Fallback by category
        switch(category) {
            case 'Software': return <Zap size={24} />;
            case 'Hardware': return <Database size={24} />;
            case 'Subscription': return <Zap size={24} />;
            default: return <Sparkles size={24} />;
        }
    };

    const handleInquiry = async (product) => {
        let activeContactId = contactId;

        setSending(true);
        try {
            // Self-Correction: If no contact ID, try to create one now
            if (!activeContactId) {
                console.log("No Contact ID found. Attempting to auto-create...");
                try {
                    const newContactRes = await axios.post('/api/contacts', {
                        name: user.name,
                        email: user.email,
                        company: 'Independent',
                        status: 'Customer'
                    });
                    activeContactId = newContactRes.data.data._id;
                    setContactId(activeContactId);
                    console.log("Auto-created contact:", activeContactId);
                } catch (createErr) {
                    console.error("Failed to auto-create contact:", createErr);
                    toast.error("Error: CRM Profile not found and could not be created. Please contact support.");
                    setSending(false);
                    return;
                }
            }

            // Create Opportunity (Deal)
            await axios.post('/api/opportunities', {
                contactId: activeContactId,
                title: `Inquiry: ${product.name}`,
                amount: product.price || 0,
                stage: 'New',
                description: `Client ${user?.name} (${user?.email}) inquired about ${product.name} from Explore page.`
            });
            
            toast.success(`Inquiry sent for ${product.name}!`);
            setSentId(product.name);
            setTimeout(() => setSentId(null), 4000);
        } catch (err) {
            console.error("Booking failed:", err);
            toast.error("Failed to register inquiry. Please try again later.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF9F5] font-sans selection:bg-amber-100 pb-20 relative overflow-hidden mt-[-32px]">
            {/* Ambient luxury radial glow filters */}
            <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-[#0B409C]/3 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[2%] right-[-5%] w-[45%] h-[45%] bg-[#D4AF37]/2 rounded-full blur-[140px] pointer-events-none" />

            {/* Minimalist Premium Hero Section */}
            <div className="max-w-7xl mx-auto px-8 pt-28 pb-16 border-b border-zinc-200/50 relative z-10">
                <div className="max-w-3xl text-left">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 mb-6"
                    >
                        <span className="w-12 h-0.5 bg-[#C5A880] rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A880]">Services Portfolio</span>
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-6xl font-serif font-normal text-zinc-900 leading-[1.1] tracking-tight mb-8"
                    >
                        Professional Solutions <br /> For <span className="font-serif italic font-light text-[#C5A880]">Global Scale.</span>
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-zinc-500 font-medium leading-relaxed max-w-2xl"
                    >
                        Explore our engineering excellence and strategic digital frameworks designed to optimize corporate performance and unify client relationships.
                    </motion.p>
                </div>
            </div>

            {/* Structured Grid */}
            <div className="max-w-7xl mx-auto px-8 py-20 relative z-10">
                {products.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-zinc-200 bg-white/50 backdrop-blur-sm rounded-[32px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block mb-3 animate-ping" />
                        <p className="text-zinc-400 font-black uppercase tracking-widest text-xs">No services synchronized from CRM yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
                        {products.map((product, idx) => (
                            <motion.div
                                key={product._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * idx, duration: 0.6 }}
                                className="flex flex-col justify-between p-8 bg-white border border-zinc-200/60 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_32px_64px_-16px_rgba(11,64,156,0.08)] hover:border-[#0B409C]/25 hover:translate-y-[-4px] transition-all duration-500 group h-full relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#0B409C]/1 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                
                                <div>
                                    <div className="flex justify-between items-center mb-8">
                                        <div className="w-12 h-12 bg-[#FAF9F5] border border-zinc-200/50 rounded-2xl flex items-center justify-center text-zinc-700 group-hover:bg-[#0B409C] group-hover:text-white group-hover:border-[#0B409C] group-hover:shadow-[0_8px_20px_rgba(11,64,156,0.2)] transition-all duration-500">
                                            {getServiceIcon(product.category, product.name)}
                                        </div>
                                        <span className="text-[9px] font-black text-white bg-zinc-950 px-2.5 py-1 rounded-full uppercase tracking-widest select-none border border-white/10 shadow-sm">
                                            {product.category}
                                        </span>
                                    </div>

                                    <div className="space-y-3.5 text-left">
                                        <h3 className="text-xl font-serif font-semibold text-zinc-900 tracking-tight leading-snug group-hover:text-[#0B409C] transition-colors">
                                            {product.name}
                                        </h3>
                                        <p className="text-zinc-500 font-medium text-xs leading-relaxed min-h-[60px]">
                                            {product.description || 'Enterprise grade solution tailored for your corporate infrastructure and performance goals.'}
                                        </p>
                                        
                                        <div className="pt-2 flex items-center gap-2">
                                            <div className="px-2.5 py-1 bg-zinc-50 border border-zinc-200/50 rounded-lg text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none select-none">
                                                SKU: {product.sku}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleInquiry(product)}
                                    disabled={sending || sentId === product.name}
                                    className={`mt-8 py-3 px-6 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer border-none ${
                                        sentId === product.name 
                                        ? 'bg-emerald-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.25)]' 
                                        : 'bg-[#FAF9F5] hover:bg-gradient-to-r hover:from-[#0B409C] hover:to-[#093582] text-zinc-800 hover:text-white border border-zinc-200/80 hover:border-transparent hover:shadow-[0_8px_20px_rgba(11,64,156,0.15)] active:scale-95'
                                    }`}
                                >
                                    {sending && sentId === null ? (
                                        <div className="w-4 h-4 border-2 border-stone-400 border-t-white rounded-full animate-spin" />
                                    ) : sentId === product.name ? (
                                        <>Consigned <Check size={12} strokeWidth={4} /></>
                                    ) : (
                                        <>Inquire for ${product.price?.toLocaleString()} <ArrowRight size={12} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" /></>
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Professional Footer CTA */}
            <div className="max-w-7xl mx-auto px-8 relative z-10">
                <div className="bg-gradient-to-br from-[#0C111D] to-[#04060B] border border-zinc-800/80 rounded-[40px] p-10 lg:p-20 relative overflow-hidden flex flex-col items-center text-center shadow-2xl">
                    {/* Glowing backdrops */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-gradient-to-tr from-[#0B409C]/10 to-[#C5A880]/5 rounded-full blur-[100px] pointer-events-none" />

                    <div className="w-16 h-16 bg-[#C5A880]/10 border border-[#C5A880]/20 rounded-2xl flex items-center justify-center text-[#C5A880] mb-8 shadow-2xl relative z-10 select-none">
                        <MessageSquare size={26} />
                    </div>
                    
                    <h2 className="text-3xl lg:text-5xl font-serif font-normal text-white tracking-tight mb-6 max-w-3xl leading-snug relative z-10">
                        Complex Requirements? <br /> <span className="font-serif italic font-light text-[#C5A880]">Let’s Architect Together.</span>
                    </h2>
                    
                    <p className="text-zinc-400 text-sm font-medium max-w-xl mb-10 leading-relaxed relative z-10">
                        For bespoke enterprise solutions or high-security advisory, schedule a strategic consultation with our lead engineering team.
                    </p>
 
                    <div className="flex gap-4 relative z-10">
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="px-8 py-3.5 bg-gradient-to-r from-[#0B409C] to-[#093582] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:shadow-[0_8px_25px_rgba(11,64,156,0.3)] shadow-[0_8px_20px_rgba(11,64,156,0.15)] hover:-translate-y-0.5 transition-all border-none cursor-pointer"
                        >
                            Book Strategy Session
                        </button>
                    </div>
                    
                    {/* Decorative Watermark */}
                    <div className="absolute bottom-0 right-0 p-6 opacity-[0.02] pointer-events-none select-none">
                        <Monitor size={300} />
                    </div>
                </div>
            </div>

            <BookingModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                user={user}
                contactId={contactId}
            />
        </div>
    );
};

export default Explore;

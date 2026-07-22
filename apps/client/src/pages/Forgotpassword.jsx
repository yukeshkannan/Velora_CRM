import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ChevronRight, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Logo from '../components/Logo';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post('/api/auth/forgot-password', { email });
            toast.success('OTP sent to your email');
            navigate('/reset-password', { state: { email } });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#FAF9F5] font-sans relative overflow-hidden"
             style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
            
            {/* Premium Champagne & Soft Blue Glow Backdrops */}
            <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-[#0B409C]/3 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[5%] right-[-5%] w-[45%] h-[45%] bg-[#D4AF37]/2 rounded-full blur-[140px] pointer-events-none" />

            {/* --- LEFT PANEL: LUXURY BRAND STORY --- */}
            <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="hidden lg:flex bg-gradient-to-br from-[#090B12] to-[#020305] p-16 flex-col justify-between relative overflow-hidden text-white border-r border-zinc-900"
            >
                {/* Deep Velvet Radial Glows */}
                <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-[#0B409C]/10 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[140px] -ml-20 -mb-20 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3.5 mb-24 cursor-pointer" onClick={() => navigate('/')}>
                       <div className="relative flex items-center justify-center p-2 rounded-full bg-[#0C0F1A] border border-zinc-800/80 shadow-md">
                           <Logo size={24} variant="light" />
                       </div>
                       <span className="text-2xl font-serif tracking-wide text-white select-none">Velora</span>
                    </div>

                    <h1 className="text-5xl font-serif text-white font-normal leading-[1.2] mb-8 tracking-tight">
                        Recover <br/> your account <br/>
                        <span className="font-serif italic font-light text-[#D4AF37]">access.</span>
                    </h1>
                    
                    <p className="text-zinc-400 text-base font-normal max-w-sm leading-relaxed normal-case">
                        Don't worry, it happens to the best of us. We will assist you in restoring your sovereign portal credentials in no time.
                    </p>

                    {/* Glowing Shield Cryptographic Visual */}
                    <motion.div 
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.8 }}
                      className="mt-12 bg-white/5 border border-white/10 rounded-[24px] p-6 backdrop-blur-md relative overflow-hidden max-w-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest block mb-1">Security Ledger</span>
                          <span className="text-xl font-serif font-light text-white tracking-wide">Custody Vault</span>
                        </div>
                        <div className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1.5 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Isolated
                        </div>
                      </div>
                      
                      {/* Visual Cryptographic Lock Interface */}
                      <div className="relative h-24 bg-white/3 border border-white/5 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.15),transparent_70%)] pointer-events-none" />
                        
                        {/* Outer Circular Ring */}
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                          className="w-16 h-16 rounded-full border border-dashed border-white/20 flex items-center justify-center relative"
                        >
                          {/* Micro orbit dot */}
                          <span className="absolute w-1.5 h-1.5 rounded-full bg-[#D4AF37] top-0 left-1/2 -translate-x-1/2" />
                        </motion.div>

                        {/* Inner Circular Ring */}
                        <motion.div 
                          animate={{ rotate: -360 }}
                          transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                          className="absolute w-10 h-10 rounded-full border border-dashed border-white/30 flex items-center justify-center"
                        >
                          <span className="absolute w-1 h-1 rounded-full bg-white bottom-0 left-1/2 -translate-y-1/2" />
                        </motion.div>

                        {/* Center Lock Dot */}
                        <div className="absolute w-5 h-5 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-[0_0_12px_rgba(212,175,55,0.5)]">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest pt-3 border-t border-white/5">
                        <span>Security Clear</span>
                        <span>Key-Pair Intact</span>
                      </div>
                    </motion.div>
                </div>

                <div className="relative z-10 flex gap-12 border-t border-zinc-900 pt-10 text-left">
                   <div>
                      <p className="text-white font-serif text-3xl tracking-tight">Secure</p>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Recovery Protocols</p>
                   </div>
                   <div>
                      <p className="text-white font-serif text-3xl tracking-tight">Fast</p>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Algorithmic Match</p>
                   </div>
                </div>
            </motion.div>

            {/* --- RIGHT PANEL: FORM CARD --- */}
            <div className="flex flex-col items-center justify-center p-8 lg:p-16 relative z-10 min-h-screen">
                {/* Mobile Logo & Brand Name */}
                <div className="flex lg:hidden items-center gap-3.5 mb-8 cursor-pointer group" onClick={() => navigate('/')}>
                   <div className="relative flex items-center justify-center p-2 rounded-full bg-[#0C0F1A] border border-zinc-800/80 shadow-md">
                       <Logo size={20} variant="light" />
                   </div>
                   <span className="text-xl font-serif tracking-wide text-zinc-950 select-none">Velora</span>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="w-full max-w-md bg-white border border-zinc-200/60 rounded-[32px] p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] backdrop-blur-xl"
                >
                    <Link to="/login" className="inline-flex items-center gap-2 text-zinc-450 hover:text-zinc-950 font-bold text-xs uppercase tracking-widest mb-10 transition-colors group text-decoration-none">
                        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back to Login
                    </Link>

                    <div className="mb-10 text-left">
                        <h2 className="text-3xl font-serif font-normal text-zinc-900 mb-2 tracking-tight">Forgot Password</h2>
                        <p className="text-zinc-400 text-sm font-medium">Enter your email and we'll send you an authentication code.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 text-left">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Registered Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#0B409C] transition-colors" size={18} />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-14 pr-6 py-3.5 bg-[#FAF9F5] border border-zinc-200/80 rounded-2xl outline-none focus:bg-white focus:border-[#0B409C] focus:ring-4 focus:ring-[#0B409C]/5 transition-all duration-300 font-medium text-zinc-950 placeholder:text-zinc-300 text-sm shadow-sm"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>
                        
                        <div className="w-full pt-3">
                            <button 
                                type="submit" 
                                className="btn-premium-full py-4 bg-gradient-to-r from-[#0B409C] to-[#093582] text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:shadow-[0_8px_25px_rgba(11,64,156,0.3)] shadow-[0_8px_20px_rgba(11,64,156,0.15)] transition-all active:scale-98 cursor-pointer border-none flex items-center justify-center gap-2 group"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Sending...' : 'Send Recovery Code'}
                                {!isLoading && <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;

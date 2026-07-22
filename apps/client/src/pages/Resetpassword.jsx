import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ChevronRight, KeyRound, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Logo from '../components/Logo';

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        setIsLoading(true);
        try {
            await axios.post('/api/auth/reset-password', {
                email,
                otp,
                newPassword,
                confirmPassword
            });
            toast.success('Password reset successfully! Please login.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
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
                        Secure <br/> your <br/>
                        <span className="font-serif italic font-light text-[#D4AF37]">future.</span>
                    </h1>
                    
                    <p className="text-zinc-400 text-base font-normal max-w-sm leading-relaxed normal-case">
                        Create a strong password to ensure absolute custody and security over your customer relationship intelligence ledger.
                    </p>

                    {/* Glowing Cryptographic Key Hologram Visual */}
                    <motion.div 
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.8 }}
                      className="mt-12 bg-white/5 border border-white/10 rounded-[24px] p-6 backdrop-blur-md relative overflow-hidden max-w-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest block mb-1">Passkey Protocol</span>
                          <span className="text-xl font-serif font-light text-white tracking-wide">Key Vault</span>
                        </div>
                        <div className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1.5 uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> AES-256
                        </div>
                      </div>
                      
                      {/* Visual Key-Vault Interface */}
                      <div className="relative h-24 bg-white/3 border border-white/5 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(58,124,246,0.15),transparent_70%)] pointer-events-none" />
                        
                        {/* Outer Hexagon/Shield Container */}
                        <motion.div 
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                          className="w-16 h-16 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center relative shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                        >
                          {/* Floating Lock Icon with simple high-end visual */}
                          <div className="w-6 h-6 border-2 border-[#D4AF37] rounded-md relative flex items-center justify-center mt-2 select-none">
                            <div className="absolute -top-3 w-4 h-4 border-2 border-b-0 border-[#D4AF37] rounded-t-full" />
                            <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                          </div>
                        </motion.div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest pt-3 border-t border-white/5">
                        <span>Custody Sealed</span>
                        <span>256-Bit Strong</span>
                      </div>
                    </motion.div>
                </div>

                <div className="relative z-10 flex gap-12 border-t border-zinc-900 pt-10 text-left">
                   <div>
                      <p className="text-white font-serif text-3xl tracking-tight">AES-256</p>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Data Encryption</p>
                   </div>
                   <div>
                      <p className="text-white font-serif text-3xl tracking-tight">24/7/365</p>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Guard Rails</p>
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
                    <div className="mb-10 text-left">
                        <h2 className="text-3xl font-serif font-normal text-zinc-900 mb-2 tracking-tight">Reset Password</h2>
                        <p className="text-zinc-400 text-sm font-medium">Enter the code sent to your email and select a secure password.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 text-left">
                         {/* Email Field (ReadOnly/Editable) */}
                        <div className="hidden">
                             <input type="email" value={email} readOnly />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Authentication Code (OTP)</label>
                            <div className="relative group">
                                <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#0B409C] transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    className="w-full pl-14 pr-6 py-3.5 bg-[#FAF9F5] border border-zinc-200/80 rounded-2xl outline-none focus:bg-white focus:border-[#0B409C] focus:ring-4 focus:ring-[#0B409C]/5 transition-all duration-300 font-medium text-zinc-950 placeholder:text-zinc-300 text-sm shadow-sm tracking-widest"
                                    placeholder="Enter 6-digit code"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">New Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#0B409C] transition-colors" size={18} />
                                <input 
                                    type={showNewPassword ? "text" : "password"} 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="w-full pl-14 pr-12 py-3.5 bg-[#FAF9F5] border border-zinc-200/80 rounded-2xl outline-none focus:bg-white focus:border-[#0B409C] focus:ring-4 focus:ring-[#0B409C]/5 transition-all duration-300 font-medium text-zinc-950 placeholder:text-zinc-300 text-sm shadow-sm"
                                    placeholder="••••••••"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors cursor-pointer"
                                >
                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#0B409C] transition-colors" size={18} />
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full pl-14 pr-12 py-3.5 bg-[#FAF9F5] border border-zinc-200/80 rounded-2xl outline-none focus:bg-white focus:border-[#0B409C] focus:ring-4 focus:ring-[#0B409C]/5 transition-all duration-300 font-medium text-zinc-950 placeholder:text-zinc-300 text-sm shadow-sm"
                                    placeholder="••••••••"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors cursor-pointer"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        
                        <div className="w-full pt-3">
                            <button 
                                type="submit" 
                                className="btn-premium-full py-4 bg-gradient-to-r from-[#0B409C] to-[#093582] text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:shadow-[0_8px_25px_rgba(11,64,156,0.3)] shadow-[0_8px_20px_rgba(11,64,156,0.15)] transition-all active:scale-98 cursor-pointer border-none flex items-center justify-center gap-2 group"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Updating...' : 'Set New Password'}
                                {!isLoading && <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default ResetPassword;

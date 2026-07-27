import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
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
        <div className="h-screen max-h-screen overflow-hidden bg-slate-50 flex flex-col justify-between font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
             style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* --- TOP HEADER --- */}
            <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between shrink-0">
                <Link to="/" className="flex items-center gap-2.5">
                  <Logo size={24} variant="dark" />
                  <span className="text-lg font-bold tracking-tight text-slate-900 select-none">Velora CRM</span>
                </Link>

                <Link 
                  to="/login" 
                  className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign in
                </Link>
            </header>

            {/* --- MAIN FORM CARD --- */}
            <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 w-full my-auto shrink-0">
                <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.3 }}
                   className="w-full max-w-[400px] bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xl shadow-slate-900/5 text-left"
                >
                    {/* Header */}
                    <div className="mb-4 text-center sm:text-left">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
                            Set new password
                        </h1>
                        <p className="text-xs text-slate-600 font-normal leading-relaxed">
                            Enter the code sent to your email and your new password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                         {/* Email Field */}
                        <div>
                            <label className="text-[11px] font-semibold text-slate-700 mb-1 block">Account Email</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm shadow-2xs"
                                placeholder="name@company.com"
                            />
                        </div>

                        {/* OTP */}
                        <div>
                            <label className="text-[11px] font-semibold text-slate-700 mb-1 block">Verification Code (OTP)</label>
                            <input 
                                type="text" 
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm shadow-2xs tracking-widest"
                                placeholder="Enter 6-digit code"
                            />
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="text-[11px] font-semibold text-slate-700 mb-1 block">New Password</label>
                            <div className="relative">
                                <input 
                                    type={showNewPassword ? "text" : "password"} 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm shadow-2xs"
                                    placeholder="At least 8 characters"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                >
                                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="text-[11px] font-semibold text-slate-700 mb-1 block">Confirm New Password</label>
                            <div className="relative">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm shadow-2xs"
                                    placeholder="Re-enter new password"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>
                        
                        <div className="pt-1.5">
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-lg transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isLoading ? 'Updating password...' : 'Update password'}
                                {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>

            {/* --- FOOTER --- */}
            <footer className="w-full py-2.5 text-center text-[11px] text-slate-400 font-medium shrink-0">
                © {new Date().getFullYear()} Velora CRM Inc. All rights reserved.
            </footer>
        </div>
    );
};

export default ResetPassword;


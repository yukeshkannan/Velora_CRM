import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Lock, Mail, ChevronRight, Eye, EyeOff, Sparkles, X, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Support Ticket State
  const [showSupport, setShowSupport] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: '', email: '', desc: '' });
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);

  const { login, loginWithUserData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoogleSuccess = async (response) => {
    setError('');
    setIsLoading(true);
    try {
      const res = await axios.post('/api/auth/google-login', { token: response.credential });
      if (res.data.success) {
        const { token, user } = res.data.data;
        loginWithUserData(user, token);
        navigate('/app');
      } else {
        setError(res.data.message || 'Google Login failed');
        setIsLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google authentication failed');
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const initGoogle = () => {
      if (window.google) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "301285732578-k89hrdj36qar35g0ddgmc5e0sgluuejs.apps.googleusercontent.com";
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleSuccess,
        });

        const targetDiv = document.getElementById("googleSignInDiv");
        if (targetDiv) {
          window.google.accounts.id.renderButton(
            targetDiv,
            { 
              theme: "outline", 
              size: "large", 
              width: 380, 
              text: "continue_with", 
              shape: "pill" 
            }
          );
        }
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          initGoogle();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      if (location.state?.from) {
        navigate(location.state.from);
      } else {
        navigate('/app');
      }
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  const handleSupportSubmit = async (e) => {
      e.preventDefault();
      setSupportLoading(true);
      try {
          await axios.post('/api/tickets', {
              title: `Login Support: ${supportForm.name}`,
              description: supportForm.desc,
              guestEmail: supportForm.email,
              guestName: supportForm.name,
              priority: 'High'
          });
          setSupportSuccess(true);
          setSupportForm({ name: '', email: '', desc: '' });
          setTimeout(() => {
              setSupportSuccess(false);
              setShowSupport(false);
          }, 3000);
      } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to send request');
      } finally {
          setSupportLoading(false);
      }
  };

  return (
    <>
      <div className="h-screen max-h-screen overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-[#FAF9F5] font-sans relative"
           style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      
      {/* Premium Champagne & Soft Blue Glow Backdrops */}
      <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-[#0B409C]/3 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[5%] right-[-5%] w-[45%] h-[45%] bg-[#D4AF37]/2 rounded-full blur-[140px] pointer-events-none" />

      {/* Support Modal (Redesigned with Premium Bezel) */}
      {showSupport && (
          <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden border border-zinc-200/50"
              >
                  <div className="p-8 bg-[#0C0F1A] text-white flex justify-between items-center relative">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/5 to-[#3A7CF6]/5 opacity-80 blur-md pointer-events-none" />
                      <div className="relative z-10">
                          <h3 className="text-xl font-serif font-normal tracking-wide text-white leading-none">Support Desk</h3>
                          <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest mt-2">Submit an Inquiry Ticket</p>
                      </div>
                      <button onClick={() => setShowSupport(false)} className="bg-white/10 p-2.5 rounded-full hover:bg-white/20 transition-colors z-10 border border-white/5 cursor-pointer">
                        <X size={16} />
                      </button>
                  </div>
                  
                  <div className="p-8">
                      {supportSuccess ? (
                          <div className="text-center py-8">
                               <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                                   <CheckCircle2 size={32} />
                               </div>
                               <h4 className="text-2xl font-serif font-normal text-zinc-900 mb-2">Ticket Dispatched!</h4>
                               <p className="text-zinc-500 text-sm font-medium mb-6">Our relations team will contact you via email shortly.</p>
                               <button 
                                 onClick={() => { setShowSupport(false); setSupportSuccess(false); }}
                                 className="w-full h-12 bg-[#0B409C] text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#073075] transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                               >
                                   Back to Login
                               </button>
                          </div>
                      ) : (
                            <form onSubmit={handleSupportSubmit} className="space-y-5">
                              <div className="space-y-1.5 text-left">
                                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Your Name</label>
                                  <input 
                                    required
                                    type="text" 
                                    className="w-full px-5 py-3.5 bg-[#FAF9F5] border border-zinc-200/80 rounded-2xl outline-none focus:bg-white focus:border-[#0B409C] focus:ring-4 focus:ring-[#0B409C]/5 font-medium transition-all duration-300 text-sm text-zinc-900 placeholder:text-zinc-300 shadow-sm"
                                    placeholder="e.g. Johnathan Doe"
                                    value={supportForm.name}
                                    onChange={e => setSupportForm({...supportForm, name: e.target.value})}
                                  />
                              </div>
                              <div className="space-y-1.5 text-left">
                                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Contact Email</label>
                                  <input 
                                    required
                                    type="email" 
                                    className="w-full px-5 py-3.5 bg-[#FAF9F5] border border-zinc-200/80 rounded-2xl outline-none focus:bg-white focus:border-[#0B409C] focus:ring-4 focus:ring-[#0B409C]/5 font-medium transition-all duration-300 text-sm text-zinc-900 placeholder:text-zinc-300 shadow-sm"
                                    placeholder="your@company.com"
                                    value={supportForm.email}
                                    onChange={e => setSupportForm({...supportForm, email: e.target.value})}
                                  />
                              </div>
                              <div className="space-y-1.5 text-left">
                                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Issue Description</label>
                                  <textarea 
                                    required
                                    rows={3}
                                    className="w-full px-5 py-3.5 bg-[#FAF9F5] border border-zinc-200/80 rounded-2xl outline-none focus:bg-white focus:border-[#0B409C] focus:ring-4 focus:ring-[#0B409C]/5 font-medium transition-all duration-300 text-sm text-zinc-900 placeholder:text-zinc-300 resize-none shadow-sm"
                                    placeholder="Tell us what's happening..."
                                    value={supportForm.desc}
                                    onChange={e => setSupportForm({...supportForm, desc: e.target.value})}
                                  />
                              </div>
                              <button 
                                type="submit"
                                disabled={supportLoading}
                                className="w-full h-12 bg-[#0B409C] text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#073075] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer border-none"
                              >
                                  {supportLoading ? 'Submitting...' : 'Send Help Request'}
                                  <ChevronRight size={14} />
                              </button>
                            </form>
                      )}
                  </div>
              </motion.div>
          </div>
      )}
 
      {/* --- LEFT PANEL: LUXURY BRAND STORY --- */}
      <motion.div 
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="hidden lg:flex bg-gradient-to-br from-[#090B12] to-[#020305] p-12 xl:p-16 flex-col justify-between relative overflow-hidden text-white border-r border-zinc-900 h-full max-h-screen"
      >
        {/* Deep Velvet Radial Glows */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-[#0B409C]/10 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[140px] -ml-20 -mb-20 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-12 xl:mb-16 cursor-pointer group" onClick={() => navigate('/')}>
             <div className="relative flex items-center justify-center p-2 rounded-full bg-[#0C0F1A] border border-zinc-800/80 shadow-md">
                 <Logo size={24} variant="light" />
             </div>
             <span className="text-2xl font-serif tracking-wide text-white select-none">Velora</span>
          </div>

          <h1 className="text-5xl font-serif text-white font-normal leading-[1.2] mb-6 tracking-tight">
            Everything you need to <br/>
            <span className="font-serif italic font-light text-[#D4AF37]">grow curated.</span>
          </h1>
          
          <p className="text-zinc-400 text-base font-normal max-w-sm leading-relaxed normal-case">
            Manage leads, curated portfolios, and institutional-grade teams from a single powerful relationship ecosystem.
          </p>

          {/* Animated Premium Gauge Visual */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-6 xl:mt-8 bg-white/5 border border-white/10 rounded-[24px] p-6 backdrop-blur-md relative overflow-hidden max-w-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest block mb-1">Live Portfolio Ledger</span>
                <span className="text-xl font-serif font-light text-white tracking-wide">Growth Index</span>
              </div>
              <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1.5 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> +24.8%
              </div>
            </div>
            
            {/* Visual Micro-graph */}
            <div className="flex items-end gap-2 h-16 mb-4 px-1">
              {[35, 45, 30, 50, 65, 55, 75, 90, 85, 95].map((val, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ height: 0 }}
                  animate={{ height: `${val}%` }}
                  transition={{ delay: 0.8 + idx * 0.05, duration: 0.5, ease: "easeOut" }}
                  className={`flex-1 rounded-t-sm transition-all duration-300 ${idx === 9 ? 'bg-gradient-to-t from-[#D4AF37] to-[#FFF2CC] shadow-[0_0_12px_rgba(212,175,55,0.4)]' : 'bg-white/10'}`}
                />
              ))}
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest pt-3 border-t border-white/5">
              <span>Q1 Performance</span>
              <span>Active Custody</span>
            </div>
          </motion.div>
        </div>

        
      </motion.div>
 
      {/* --- RIGHT PANEL: LOGIN FORM CARD --- */}
      <div className="flex flex-col items-center justify-center py-6 lg:py-8 px-4 md:px-8 relative z-10 h-full overflow-y-auto">
          {/* Mobile Logo & Brand Name */}
          <div className="flex lg:hidden items-center gap-3.5 mb-4 cursor-pointer group" onClick={() => navigate('/')}>
             <div className="relative flex items-center justify-center p-2 rounded-full bg-[#0C0F1A] border border-zinc-800/80 shadow-md">
                 <Logo size={20} variant="light" />
             </div>
             <span className="text-xl font-serif tracking-wide text-zinc-950 select-none">Velora</span>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-[390px] bg-white border border-zinc-200/60 rounded-[24px] p-5 md:p-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] backdrop-blur-xl relative"
          >
              <div className="mb-4 text-left">
                <h2 className="text-2xl font-serif font-normal text-zinc-900 mb-1 tracking-tight">Welcome Back</h2>
                <p className="text-zinc-400 text-xs font-medium">Access your curated workspace to continue.</p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5"></div>
                  <p className="text-red-600 text-xs font-bold text-left">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-2.5 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Work Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#0B409C] transition-colors" size={18} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-14 pr-6 py-2.5 bg-[#FAF9F5] border border-zinc-200/80 rounded-2xl outline-none focus:bg-white focus:border-[#0B409C] focus:ring-4 focus:ring-[#0B409C]/5 transition-all duration-300 font-medium text-zinc-950 placeholder:text-zinc-300 text-sm shadow-sm"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Password</label>
                    <Link to="/forgot-password" className="text-[10px] font-black text-[#0B409C] hover:text-[#073075] uppercase tracking-wider transition-colors">Forgot?</Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#0B409C] transition-colors" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-14 pr-12 py-2.5 bg-[#FAF9F5] border border-zinc-200/80 rounded-2xl outline-none focus:bg-white focus:border-[#0B409C] focus:ring-4 focus:ring-[#0B409C]/5 transition-all duration-300 font-medium text-zinc-950 placeholder:text-zinc-300 text-sm shadow-sm"
                      placeholder="••••••••"
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors cursor-pointer"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="w-full pt-1">
                    <button 
                      type="submit" 
                      className="btn-premium-full py-3 bg-gradient-to-r from-[#0B409C] to-[#093582] text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:shadow-[0_8px_25px_rgba(11,64,156,0.3)] shadow-[0_8px_20px_rgba(11,64,156,0.15)] transition-all active:scale-98 cursor-pointer border-none flex items-center justify-center gap-2 group"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Authenticating...' : 'Sign In'}
                      {!isLoading && <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />}
                    </button>
                </div>
              </form>

              {/* Dynamic Google Sign-In Container */}
              <div className="mt-3 flex flex-col items-center justify-center gap-2.5">
                <div className="flex items-center gap-2.5 w-full my-0.5">
                  <div className="h-[1px] flex-1 bg-zinc-200/60" />
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">or continue with</span>
                  <div className="h-[1px] flex-1 bg-zinc-200/60" />
                </div>
                <div id="googleSignInDiv" className="w-full flex justify-center" />
              </div>

              <div className="mt-4 text-center grid gap-3.5 pt-4 border-t border-zinc-100">
                <p className="text-xs font-bold text-zinc-400">
                    Don't have an account? <Link to="/signup" className="text-[#0B409C] hover:text-[#073075] transition-colors underline decoration-2 decoration-[#0B409C]/20 underline-offset-4 font-black">Create Account</Link>
                </p>
                <div className="flex items-center gap-4 text-[10px] font-black text-zinc-400 justify-center uppercase tracking-widest">
                    <button type="button" onClick={() => setShowSupport(true)} className="hover:text-[#0B409C] transition-colors cursor-pointer border-none bg-transparent font-bold">Contact Relations Support</button>
                </div>
              </div>
          </motion.div>
      </div>
    </div>
    </>
  );
};

export default Login;

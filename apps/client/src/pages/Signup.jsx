import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Lock, Mail, User, ArrowRight, Building2, Sparkles, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '' 
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithUserData } = useAuth();
  const navigate = useNavigate();

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

        const targetDiv = document.getElementById("googleSignUpDiv");
        if (targetDiv) {
          window.google.accounts.id.renderButton(
            targetDiv,
            { 
              theme: "outline", 
              size: "large", 
              width: 340, 
              text: "signup_with", 
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Calculate form completion progress (0 to 4)
  const filledCount = Object.values(formData).filter(val => val.trim().length > 0).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        await axios.post('/api/auth/register', formData);
        const loginRes = await login(formData.email, formData.password);
        if (loginRes.success) {
            navigate('/app');
        } else {
            navigate('/login');
        }
    } catch (err) {
        setError(err.response?.data?.message || 'Registration failed');
        setIsLoading(false);
    }
  };

  return (
    <>
      <div className="h-screen max-h-screen overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-[#FAF9F5] font-sans relative"
           style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      
      {/* Premium Champagne & Soft Blue Glow Backdrops */}
      <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-[#0B409C]/3 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[5%] right-[-5%] w-[45%] h-[45%] bg-[#D4AF37]/2 rounded-full blur-[140px] pointer-events-none" />

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
        
        {/* Logo at Top */}
        <div className="flex items-center gap-3 cursor-pointer relative z-10" onClick={() => navigate('/')}>
           <div className="relative flex items-center justify-center p-2 rounded-full bg-[#0C0F1A] border border-zinc-800/80 shadow-md">
               <Logo size={24} variant="light" />
           </div>
           <span className="text-2xl font-serif tracking-wide text-white select-none">Velora</span>
        </div>

        {/* Centered Heading/Content */}
        <div className="my-auto py-12 relative z-10 flex flex-col justify-center text-left">
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.5 }}
             className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-6 w-fit animate-pulse"
          >
             <Sparkles size={11} /> Enterprise Ecosystem
          </motion.div>

          <h1 className="text-5xl font-serif text-white font-normal leading-[1.2] mb-6 tracking-tight">
             Begin your <br/> <span className="font-serif italic font-light text-[#D4AF37]">digital scale.</span>
          </h1>
          
          <p className="text-zinc-400 text-base font-normal max-w-sm leading-relaxed normal-case">
             Join the curated relationship ecosystem built for high-performance teams and modern institutions.
          </p>
        </div>

        {/* Small branding text at bottom */}
        <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest relative z-10 text-left select-none">
          Velora Curation Suite
        </div>
      </motion.div>

      {/* --- RIGHT PANEL: FORM CARD --- */}
      <div className="flex flex-col items-center justify-center py-6 lg:py-8 px-4 md:px-8 relative z-10 h-full overflow-y-auto">
          {/* Mobile Logo & Brand Name */}
          <div className="flex lg:hidden items-center gap-3.5 mb-4 cursor-pointer group" onClick={() => navigate('/')}>
             <div className="relative flex items-center justify-center p-2 rounded-full bg-[#0C0F1A] border border-zinc-800/80 shadow-md">
                 <Logo size={20} variant="light" />
             </div>
             <span className="text-xl font-serif tracking-wide text-zinc-950 select-none">Velora</span>
          </div>

        <motion.div 
           initial={{ opacity: 0, scale: 0.96 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.8 }}
           className="w-full max-w-[390px] bg-white border border-zinc-200/60 rounded-[24px] p-5 md:p-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] backdrop-blur-xl"
        >
          <div className="mb-4 text-left">
            <h2 className="text-2xl font-serif font-normal text-zinc-900 mb-1 tracking-tight">Client Onboarding</h2>
            <p className="text-zinc-400 text-xs font-medium">Initialize your professional workspace profile.</p>
          </div>

          {error && (
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-3 bg-red-50/50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-2 shadow-sm text-left"
             >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
             </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2.5 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#0B409C] transition-colors" size={18} />
                <input 
                  name="name"
                  type="text" 
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-14 pr-4 py-2.5 bg-[#FAF9F5] border border-zinc-200/80 rounded-2xl outline-none focus:bg-white focus:border-[#0B409C] focus:ring-4 focus:ring-[#0B409C]/5 transition-all duration-300 font-medium text-zinc-950 placeholder:text-zinc-300 text-sm shadow-sm"
                  placeholder="e.g. Johnathan Doe"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Organization</label>
              <div className="relative group">
                <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#0B409C] transition-colors" size={18} />
                <input 
                  name="department" 
                  type="text" 
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full pl-14 pr-4 py-2.5 bg-[#FAF9F5] border border-zinc-200/80 rounded-2xl outline-none focus:bg-white focus:border-[#0B409C] focus:ring-4 focus:ring-[#0B409C]/5 transition-all duration-300 font-medium text-zinc-950 placeholder:text-zinc-300 text-sm shadow-sm"
                  placeholder="e.g. Acme Corporation"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Corporate Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#0B409C] transition-colors" size={18} />
                <input 
                  name="email"
                  type="email" 
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-14 pr-4 py-2.5 bg-[#FAF9F5] border border-zinc-200/80 rounded-2xl outline-none focus:bg-white focus:border-[#0B409C] focus:ring-4 focus:ring-[#0B409C]/5 transition-all duration-300 font-medium text-zinc-950 placeholder:text-zinc-300 text-sm shadow-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#0B409C] transition-colors" size={18} />
                <input 
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-14 pr-12 py-2.5 bg-[#FAF9F5] border border-zinc-200/80 rounded-2xl outline-none focus:bg-white focus:border-[#0B409C] focus:ring-4 focus:ring-[#0B409C]/5 transition-all duration-300 font-medium text-zinc-950 placeholder:text-zinc-300 text-sm shadow-sm"
                  placeholder="••••••••••••"
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors cursor-pointer"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Form Progress Indicator */}
              <div className="flex gap-1.5 h-1 mt-2.5 px-1">
                 <div className={`flex-1 rounded-full bg-zinc-100 transition-all duration-500 ${filledCount >= 1 ? 'bg-[#0B409C]/40' : ''}`} />
                 <div className={`flex-1 rounded-full bg-zinc-100 transition-all duration-500 ${filledCount >= 2 ? 'bg-[#0B409C]/70' : ''}`} />
                 <div className={`flex-1 rounded-full bg-zinc-100 transition-all duration-500 ${filledCount >= 3 ? 'bg-[#0B409C]' : ''}`} />
                 <div className={`flex-1 rounded-full bg-zinc-100 transition-all duration-500 ${filledCount >= 4 ? 'bg-[#10B981]' : ''}`} />
              </div>
            </div>

            <div className="w-full pt-1">
              <button 
                type="submit" 
                disabled={isLoading}
                className="btn-premium-full py-3 bg-gradient-to-r from-[#0B409C] to-[#093582] text-white font-bold text-xs uppercase tracking-widest rounded-2xl hover:shadow-[0_8px_25px_rgba(11,64,156,0.3)] shadow-[0_8px_20px_rgba(11,64,156,0.15)] transition-all active:scale-98 cursor-pointer border-none flex items-center justify-center gap-3"
              >
                {isLoading ? 'Processing...' : 'Initialize Workspace'}
                {!isLoading && <ArrowRight size={14} />}
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
            <div id="googleSignUpDiv" className="w-full flex justify-center" />
          </div>

          <div className="mt-4 text-center pt-4 border-t border-zinc-100 flex-shrink-0">
            <p className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest mb-2">Already synchronized?</p>
            <NavLink to="/login" className="px-5 py-1.5 bg-zinc-100 text-zinc-800 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#0B409C] hover:text-white transition-all inline-flex items-center gap-2 shadow-sm border border-zinc-200/40 text-decoration-none">
              Secure Sign In <ArrowRight size={12} />
            </NavLink>
          </div>
        </motion.div>
      </div>
    </div>
    </>
  );
};

export default Signup;

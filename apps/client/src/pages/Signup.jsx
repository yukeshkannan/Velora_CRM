import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
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

  const googleInitializedRef = useRef(false);

  useEffect(() => {
    const renderGoogleButton = () => {
      if (window.google?.accounts?.id && !googleInitializedRef.current) {
        googleInitializedRef.current = true;
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "301285732578-k89hrdj36qar35g0ddgmc5e0sgluuejs.apps.googleusercontent.com";
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleSuccess,
          auto_select: false
        });

        const targetDiv = document.getElementById("googleSignUpDiv");
        if (targetDiv) {
          targetDiv.innerHTML = "";
          window.google.accounts.id.renderButton(
            targetDiv,
            { 
              theme: "outline", 
              size: "large", 
              width: 320, 
              text: "continue_with", 
              shape: "rectangular"
            }
          );
        }
      }
    };

    renderGoogleButton();
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        renderGoogleButton();
      }
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
    <div className="h-screen max-h-screen overflow-hidden bg-slate-50 flex flex-col justify-between font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
         style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      {/* --- TOP HEADER (Compact 56px Height - No Scroll) --- */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center">
          <Logo size={42} variant="dark" />
        </Link>

        <Link 
          to="/login" 
          className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-all shadow-2xs"
        >
          Already have an account? Sign in
        </Link>
      </header>

      {/* --- MAIN FORM CARD (Compact Heights to fit 100vh with Zero Scroll) --- */}
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
              Start your Velora workspace
            </h1>
            <p className="text-xs text-slate-600 font-normal leading-relaxed">
              Join 500+ teams automating sales, HR & operations.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2"
             >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                {error}
             </motion.div>
          )}

          {/* Top Google 1-Click Auth */}
          <div className="mb-4 flex flex-col items-center justify-center gap-2">
            <div className="w-full min-h-[42px] flex items-center justify-center">
              <div id="googleSignUpDiv" className="w-full flex justify-center min-h-[42px]" />
            </div>
            <div className="flex items-center gap-2.5 w-full mt-1">
              <div className="h-[1px] flex-1 bg-slate-200" />
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">or continue with email</span>
              <div className="h-[1px] flex-1 bg-slate-200" />
            </div>
          </div>

          {/* Form Inputs (Compact Spacing for 100vh fit) */}
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* Email */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 mb-1 block">Work Email</label>
              <input 
                name="email"
                type="email" 
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm shadow-2xs"
                placeholder="sarah@company.com"
              />
            </div>

            {/* Name */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 mb-1 block">Full Name</label>
              <input 
                name="name"
                type="text" 
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm shadow-2xs"
                placeholder="e.g. Sarah Jenkins"
              />
            </div>

            {/* Organization */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 mb-1 block">Organization Name</label>
              <input 
                name="department" 
                type="text" 
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm shadow-2xs"
                placeholder="e.g. Acme Corp"
              />
            </div>
            
            {/* Password */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 mb-1 block">Password</label>
              <div className="relative">
                <input 
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm shadow-2xs"
                  placeholder="At least 8 characters"
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-1.5">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-lg transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? 'Creating workspace...' : 'Create workspace'}
                {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* --- FOOTER (Compact 32px Height - No Scroll) --- */}
      <footer className="w-full py-2.5 text-center text-[11px] text-slate-400 font-medium shrink-0">
        © {new Date().getFullYear()} Velora Inc. All rights reserved.
      </footer>
    </div>
  );
};

export default Signup;



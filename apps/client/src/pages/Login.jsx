import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ArrowRight, Eye, EyeOff, X, CheckCircle2, Headphones } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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
        navigate('/app/dashboard', { replace: true });
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

        const targetDiv = document.getElementById("googleSignInDiv");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      navigate('/app/dashboard', { replace: true });
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
    <div className="h-screen max-h-screen overflow-hidden bg-slate-50 flex flex-col justify-between font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
         style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      {showSupport && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200"
              >
                  <div className="p-6 bg-slate-900 text-white flex justify-between items-center relative">
                      <div>
                          <h3 className="text-lg font-bold text-white leading-tight flex items-center gap-2">
                             <Headphones className="w-4 h-4 text-indigo-400" /> Support Desk
                          </h3>
                          <p className="text-slate-400 text-xs mt-1">Submit an inquiry ticket to our relations team.</p>
                      </div>
                      <button onClick={() => setShowSupport(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors border border-white/10 cursor-pointer">
                        <X className="w-4 h-4 text-white" />
                      </button>
                  </div>
                  
                  <div className="p-6">
                      {supportSuccess ? (
                          <div className="text-center py-6">
                               <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xs border border-emerald-200">
                                   <CheckCircle2 size={24} />
                               </div>
                               <h4 className="text-xl font-bold text-slate-900 mb-1">Ticket Dispatched!</h4>
                               <p className="text-slate-600 text-xs font-medium mb-6">Our relations team will contact you via email shortly.</p>
                               <button 
                                 onClick={() => { setShowSupport(false); setSupportSuccess(false); }}
                                 className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer border-none"
                               >
                                   Back to Login
                               </button>
                          </div>
                      ) : (
                            <form onSubmit={handleSupportSubmit} className="space-y-4 text-left">
                              <div>
                                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Your Name</label>
                                  <input 
                                    required
                                    type="text" 
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 font-medium transition-all text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs"
                                    placeholder="e.g. Johnathan Doe"
                                    value={supportForm.name}
                                    onChange={e => setSupportForm({...supportForm, name: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Contact Email</label>
                                  <input 
                                    required
                                    type="email" 
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 font-medium transition-all text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs"
                                    placeholder="your@company.com"
                                    value={supportForm.email}
                                    onChange={e => setSupportForm({...supportForm, email: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Issue Description</label>
                                  <textarea 
                                    required
                                    rows={3}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 font-medium transition-all text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 resize-none shadow-2xs"
                                    placeholder="Tell us what's happening..."
                                    value={supportForm.desc}
                                    onChange={e => setSupportForm({...supportForm, desc: e.target.value})}
                                  />
                              </div>
                              <button 
                                  type="submit" 
                                  disabled={supportLoading}
                                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                  {supportLoading ? 'Submitting...' : 'Send Help Request'}
                              </button>
                            </form>
                      )}
                  </div>
              </motion.div>
          </div>
      )}

      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size={24} variant="dark" />
          <span className="text-lg font-bold tracking-tight text-slate-900 select-none">Velora CRM</span>
        </Link>

        <Link 
          to="/signup" 
          className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-all shadow-2xs"
        >
          New to Velora? Create account
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 w-full my-auto shrink-0">
        <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.3 }}
           className="w-full max-w-[400px] bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xl shadow-slate-900/5 text-left"
        >
          <div className="mb-4 text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
              Welcome back to Velora
            </h1>
            <p className="text-xs text-slate-600 font-normal leading-relaxed">
              Enter your credentials to access your workspace.
            </p>
          </div>

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

          <div className="mb-4 flex flex-col items-center justify-center gap-2">
            <div className="w-full min-h-[42px] flex items-center justify-center">
              <div id="googleSignInDiv" className="w-full flex justify-center min-h-[42px]" />
            </div>
            <div className="flex items-center gap-2.5 w-full mt-1">
              <div className="h-[1px] flex-1 bg-slate-200" />
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">or continue with email</span>
              <div className="h-[1px] flex-1 bg-slate-200" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 mb-1 block">Work Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm shadow-2xs"
                placeholder="name@company.com"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-[11px] font-semibold text-slate-900 hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all font-medium text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm shadow-2xs"
                  placeholder="Enter your password"
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

            <div className="pt-1.5">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-lg transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? 'Authenticating...' : 'Sign in to workspace'}
                {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>

          <div className="mt-5 text-center pt-3 border-t border-slate-100 flex items-center justify-center">
            <button 
              type="button" 
              onClick={() => setShowSupport(true)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent flex items-center gap-1.5"
            >
              <Headphones className="w-3.5 h-3.5" /> Need help? Contact Support
            </button>
          </div>
        </motion.div>
      </div>

      <footer className="w-full py-2.5 text-center text-[11px] text-slate-400 font-medium shrink-0">
        © {new Date().getFullYear()} Velora CRM Inc. All rights reserved.
      </footer>
    </div>
  );
};

export default Login;

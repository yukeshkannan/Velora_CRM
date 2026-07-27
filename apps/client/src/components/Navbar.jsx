import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState(null);

    const navItems = [
        { name: 'System', href: '#features', id: 'features' },
        { name: 'Enterprise', href: '#pricing', id: 'pricing' },
        { name: 'Practice', href: '#faqs', id: 'faqs' }
    ];

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleScrollOrNavigate = (e, targetId) => {
        e.preventDefault();
        
        if (location.pathname === '/') {
            const element = document.getElementById(targetId);
            if (element) {
                const offset = 110;
                const bodyRect = document.body.getBoundingClientRect().top;
                const elementRect = element.getBoundingClientRect().top;
                const elementPosition = elementRect - bodyRect;
                const offsetPosition = elementPosition - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        } else {
            navigate(`/#${targetId}`);
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 w-full flex justify-center px-4 sm:px-6 py-4 md:py-6 pointer-events-none transition-all duration-500 font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
                style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* Glassmorphic Floating Capsule */}
            <nav className={`pointer-events-auto w-full max-w-7xl rounded-full border border-slate-200/80 bg-white/80 backdrop-blur-xl transition-all duration-500 flex justify-between items-center relative
                ${scrolled 
                    ? 'py-3 px-6 md:px-10 shadow-lg shadow-slate-900/5 bg-white/90 border-slate-200 max-w-6xl' 
                    : 'py-4 px-8 md:px-12 shadow-sm'
                }`}
            >
                
                {/* Brand Logo "Velora CRM" */}
                <div onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-3 cursor-pointer group">
                    <Logo size={26} variant="dark" />
                    <span className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors select-none">
                        Velora CRM
                    </span>
                </div>
                
                {/* Center Navigation Links */}
                <div 
                    className="hidden md:flex items-center gap-2 bg-slate-100/60 border border-slate-200/60 rounded-full p-1.5 text-xs font-semibold text-slate-600 tracking-wide"
                    onMouseLeave={() => setHoveredIdx(null)}
                >
                    {navItems.map((item, idx) => (
                        <Link 
                            key={idx}
                            to="/" 
                            onClick={(e) => handleScrollOrNavigate(e, item.id)}
                            onMouseEnter={() => setHoveredIdx(idx)}
                            className="relative py-2 px-5 transition-colors duration-200 z-10 hover:text-slate-900 rounded-full"
                        >
                            <span className="relative z-10">{item.name}</span>
                            {hoveredIdx === idx && (
                                <motion.span
                                    layoutId="navHover"
                                    className="absolute inset-0 bg-white shadow-xs rounded-full border border-slate-200/80 z-0"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </Link>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="hidden md:flex items-center gap-6">
                    <Link to="/login" className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                        Sign in
                    </Link>
                    <Link to="/signup" 
                          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full transition-all shadow-xs hover:shadow-md cursor-pointer">
                        Get Started Free
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none transition-colors"
                >
                    {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                {/* Mobile Overlay */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: -15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-[110%] left-0 right-0 p-6 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-3xl shadow-xl shadow-slate-900/10 flex flex-col gap-4 pointer-events-auto md:hidden"
                        >
                            {navItems.map((item, idx) => (
                                <Link 
                                    key={idx}
                                    to="/" 
                                    onClick={(e) => { setIsOpen(false); handleScrollOrNavigate(e, item.id); }} 
                                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors py-2 border-b border-slate-100"
                                >
                                    {item.name}
                                </Link>
                            ))}
                            
                            <div className="flex flex-col gap-3 pt-2">
                                <Link 
                                    to="/login" 
                                    onClick={() => setIsOpen(false)}
                                    className="text-center text-xs font-semibold text-slate-700 hover:text-slate-900 py-2 transition-colors"
                                >
                                    Sign in
                                </Link>
                                <Link 
                                    to="/signup" 
                                    onClick={() => setIsOpen(false)}
                                    className="w-full py-3 bg-slate-900 text-white text-center text-xs font-semibold rounded-full shadow-xs"
                                >
                                    Get Started Free
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </nav>
        </header>
    );
};

export default Navbar;


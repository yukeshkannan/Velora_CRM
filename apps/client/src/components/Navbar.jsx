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
            // Smooth Scroll on Landing Page
            const element = document.getElementById(targetId);
            if (element) {
                const offset = 110; // Extra offset due to floating island capsule
                const bodyRect = document.body.getBoundingClientRect().top;
                const elementRect = element.getBoundingClientRect().top;
                const elementPosition = elementRect - bodyRect;
                const offsetPosition = elementPosition - offset;
                const scrollTarget = offsetPosition;

                window.scrollTo({
                    top: scrollTarget,
                    behavior: 'smooth'
                });
            }
        } else {
            // Navigate to Landing Page with hash state
            navigate(`/#${targetId}`);
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 w-full flex justify-center px-4 sm:px-6 py-4 md:py-6 pointer-events-none transition-all duration-500">
            
            {/* Glassmorphic Floating Island Capsule (Option 1) */}
            <nav className={`pointer-events-auto w-full max-w-7xl rounded-full border border-zinc-200/50 bg-[#FAF9F5]/75 backdrop-blur-xl transition-all duration-500 flex justify-between items-center relative
                ${scrolled 
                    ? 'py-3 px-6 md:px-10 shadow-[0_12px_40px_rgba(11,64,156,0.08)] bg-[#FAF9F5]/85 border-zinc-200/70 max-w-6xl' 
                    : 'py-4 px-8 md:px-12 shadow-[0_8px_30px_rgba(0,0,0,0.03)]'
                }`}
            >
                
                {/* Brand Logo "Velora" with Integrated Live Pulse */}
                <div onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-3.5 cursor-pointer group">
                    <div className="relative flex items-center justify-center p-2 rounded-full bg-[#0C0F1A] border border-zinc-800/50 shadow-md group-hover:border-[#D4AF37]/30 transition-all duration-300">
                        {/* High-end Gold Pulsing Glow Aura */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#D4AF37]/25 to-[#FFF8E7]/5 opacity-60 blur-md scale-125 animate-pulse pointer-events-none" />
                        <Logo size={24} variant="gold" className="relative z-10 transition-all duration-500 group-hover:scale-110 drop-shadow-[0_2px_12px_rgba(212,175,55,0.6)]" />
                    </div>
                    <span className="text-2xl md:text-3xl font-serif font-normal tracking-wide text-zinc-900 group-hover:text-[#0B409C] transition-colors duration-300 select-none">
                        Velora
                    </span>
                </div>
                
                {/* Center Navigation Links with Spring-Animated Hover Pill Track (Option 2 - Mixed Design) */}
                <div 
                    className="hidden md:flex items-center gap-4 bg-zinc-200/20 border border-zinc-300/10 rounded-full p-1.5 text-[13px] font-semibold text-zinc-600/90 tracking-wider uppercase"
                    onMouseLeave={() => setHoveredIdx(null)}
                >
                    {navItems.map((item, idx) => (
                        <Link 
                            key={idx}
                            to="/" 
                            onClick={(e) => handleScrollOrNavigate(e, item.id)}
                            onMouseEnter={() => setHoveredIdx(idx)}
                            className="relative py-2 px-6 transition-colors duration-300 z-10 hover:text-zinc-950 rounded-full"
                        >
                            <span className="relative z-10">{item.name}</span>
                            {hoveredIdx === idx && (
                                <motion.span
                                    layoutId="navHover"
                                    className="absolute inset-0 bg-white shadow-[0_2.5px_10px_rgba(0,0,0,0.035)] rounded-full border border-zinc-200/40 z-0"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </Link>
                    ))}
                </div>

                {/* Right Actions - Upscaled for Premium legibility */}
                <div className="hidden md:flex items-center gap-8">
                    <Link to="/login" className="text-[13.5px] font-semibold text-zinc-600 hover:text-zinc-950 transition-colors duration-300">
                        Login
                    </Link>
                    <Link to="/signup" 
                          className="px-7 py-3 bg-gradient-to-r from-[#0B409C] to-[#0A347D] hover:from-[#0A347D] hover:to-[#072457] text-white text-[13px] font-bold tracking-wider rounded-full transition-all duration-300 shadow-[0_4px_16px_rgba(11,64,156,0.15)] hover:shadow-[0_6px_20px_rgba(11,64,156,0.25)] hover:scale-[1.03] active:scale-95 uppercase">
                        Request Access
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden p-2 text-zinc-600 hover:text-zinc-950 focus:outline-none transition-colors"
                >
                    {isOpen ? <X size={22} /> : <Menu size={22} />}
                </button>

                {/* Mobile Glassmorphic Overlay */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="absolute top-[110%] left-0 right-0 p-6 bg-[#FAF9F5]/95 backdrop-blur-2xl border border-zinc-200/50 rounded-3xl shadow-[0_20px_50px_rgba(11,64,156,0.12)] flex flex-col gap-5 pointer-events-auto md:hidden"
                        >
                            {navItems.map((item, idx) => (
                                <Link 
                                    key={idx}
                                    to="/" 
                                    onClick={(e) => { setIsOpen(false); handleScrollOrNavigate(e, item.id); }} 
                                    className="text-sm font-semibold text-zinc-700 hover:text-zinc-950 transition-colors tracking-wider uppercase py-3 border-b border-zinc-200/20"
                                >
                                    {item.name}
                                </Link>
                            ))}
                            
                            <div className="flex flex-col gap-4 pt-3">
                                <Link 
                                    to="/login" 
                                    onClick={() => setIsOpen(false)}
                                    className="text-center text-sm font-semibold text-zinc-700 hover:text-zinc-950 py-3 transition-colors"
                                >
                                    Login
                                </Link>
                                <Link 
                                    to="/signup" 
                                    onClick={() => setIsOpen(false)}
                                    className="w-full py-3 bg-gradient-to-r from-[#0B409C] to-[#0A347D] text-white text-center text-sm font-bold tracking-wider rounded-full shadow-md uppercase"
                                >
                                    Request Access
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

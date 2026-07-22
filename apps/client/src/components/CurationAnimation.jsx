import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Terminal, Activity, Check, Shield, Cpu } from 'lucide-react';

const CurationAnimation = () => {
    const [logs, setLogs] = useState([
        'LOG :: Velora Core initialized on port 5000',
        'LOG :: Seed database online (Offline Developer Fallback active)',
        'LOG :: Listening to relationship streams...'
    ]);
    const [optimizationIndex, setOptimizationIndex] = useState(98.4);
    const [curatedCount, setCuratedCount] = useState(14820);
    const [activeTarget, setActiveTarget] = useState({ name: 'Geneva Mutual', value: '$4.8M', score: '99.4%' });

    // Fictional targets to rotate
    const targets = [
        { name: 'Geneva Mutual', value: '$4.8M', score: '99.4%', type: 'Enterprise' },
        { name: 'Aurelius Trust', value: '$2.4M', score: '98.9%', type: 'Institutional' },
        { name: 'London Capital', value: '$8.2M', score: '99.7%', type: 'Sovereign' },
        { name: 'Vanguard Holdings', value: '$6.1M', score: '99.1%', type: 'Bespoke' }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            // Rotate active targets
            const randomTarget = targets[Math.floor(Math.random() * targets.length)];
            setActiveTarget(randomTarget);

            // Slightly fluctuate stats for realism
            setOptimizationIndex(prev => {
                const change = (Math.random() * 0.4 - 0.2);
                return Math.min(100, Math.max(95, parseFloat((prev + change).toFixed(2))));
            });

            setCuratedCount(prev => prev + 1);

            // Add terminal logs
            const actions = [
                `OPTIMIZE :: Curated opportunity vector for ${randomTarget.name}`,
                `SECURITY :: RBAC token validated for sovereign handshake`,
                `DATA :: Relational database optimized (Staging stage complete)`,
                `ALEXANDRIA :: Curation Prism verified trust score at ${randomTarget.score}`,
                `API GATEWAY :: Opportunity stage dispatched successfully to gateway port 5000`
            ];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            setLogs(prev => [randomAction, prev[0], prev[1]].slice(0, 3));

        }, 3200);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative border border-zinc-200/80 bg-white/70 backdrop-blur rounded-[28px] p-5 shadow-[0_30px_60px_rgba(0,0,0,0.04)] w-full max-w-4xl mx-auto mt-6">
            
            {/* macOS Bezel Frame */}
            <div className="bg-[#0C0F1A] rounded-[20px] overflow-hidden border border-zinc-800/80 flex flex-col min-h-[420px] justify-between relative shadow-2xl">
                
                {/* Background Grid Lines & Soft Gold Glows */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-gradient-to-tr from-[#D4AF37]/5 to-[#3A7CF6]/3 rounded-full blur-[80px] pointer-events-none" />

                {/* Bezel Top Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 bg-[#070911]/80 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2">
                        {/* macOS Window Controls */}
                        <div className="w-3 h-3 rounded-full bg-[#FF5F56] opacity-80" />
                        <div className="w-3 h-3 rounded-full bg-[#FFBD2E] opacity-80" />
                        <div className="w-3 h-3 rounded-full bg-[#27C93F] opacity-80" />
                        <span className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase ml-3 flex items-center gap-1.5">
                            <Terminal size={11} className="text-[#D4AF37]" />
                            alexandria_curator_console.sh
                        </span>
                    </div>
                    {/* Live Badge */}
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-500 font-mono uppercase tracking-widest">PULSE STABLE</span>
                    </div>
                </div>

                {/* Visual Area: Curation Engine flow simulator */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 p-6 items-center z-10 relative">
                    
                    {/* Left Column: Stream inputs (glowing orbits) */}
                    <div className="md:col-span-4 flex flex-col gap-4 items-start relative h-full justify-center">
                        <span className="text-[10px] font-extrabold tracking-widest text-[#3A7CF6] uppercase flex items-center gap-1.5">
                            <Cpu size={12} />
                            Asynchronous Streams
                        </span>
                        
                        {/* Interactive flow track box */}
                        <div className="border border-zinc-800/40 bg-zinc-950/40 rounded-xl p-4 w-full relative min-h-[140px] flex flex-col justify-around overflow-hidden shadow-inner">
                            {/* Horizontal guide rails */}
                            <div className="absolute left-0 right-0 top-1/4 h-[1px] bg-zinc-800/30 border-dashed border-t" />
                            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-zinc-800/30 border-dashed border-t" />
                            <div className="absolute left-0 right-0 top-3/4 h-[1px] bg-zinc-800/30 border-dashed border-t" />
                            
                            {/* Pulsing streams nodes */}
                            <motion.div 
                                animate={{ x: [0, 240, 240], opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "linear", delay: 0 }}
                                className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#FFF8E7] shadow-[0_0_12px_#D4AF37] absolute top-[20%] left-2"
                            />
                            <motion.div 
                                animate={{ x: [0, 240, 240], opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 3.5, ease: "linear", delay: 1.2 }}
                                className="w-3 h-3 rounded-full bg-gradient-to-r from-[#3A7CF6] to-[#FFF] shadow-[0_0_10px_#3A7CF6] absolute top-[48%] left-2"
                            />
                            <motion.div 
                                animate={{ x: [0, 240, 240], opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 4.5, ease: "linear", delay: 0.6 }}
                                className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-[#10B981] to-[#FFF] shadow-[0_0_12px_#10B981] absolute top-[72%] left-2"
                            />
                            
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">RAW RECEPTORS</span>
                            <span className="text-xs font-mono text-[#3A7CF6] block font-bold">opportunity_stage.db</span>
                        </div>
                    </div>

                    {/* Center Column: Alexandria Lens (Faceted Rotating Prism) */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center relative">
                        <div className="relative flex items-center justify-center w-28 h-28">
                            
                            {/* Outer Spinning Golden Ring */}
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                                className="absolute inset-0 rounded-full border border-dashed border-[#D4AF37]/35 p-1"
                            />
                            
                            {/* Golden Halo Radial glow */}
                            <div className="absolute w-24 h-24 rounded-full bg-[#D4AF37]/10 blur-xl animate-pulse" />

                            {/* Faceted Central Prism (Pulsing Diamond) */}
                            <motion.div 
                                animate={{ scale: [1, 1.05, 1], rotate: [0, 180, 360] }}
                                transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                                className="w-16 h-16 border-2 border-[#D4AF37] rounded-xl flex items-center justify-center bg-gradient-to-tr from-[#0C0F1A] to-[#1E2540] shadow-[0_0_25px_rgba(212,175,55,0.3)] relative"
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                <Sparkles className="text-[#D4AF37] w-6 h-6 animate-pulse" />
                                {/* Crosshairs */}
                                <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[#D4AF37]/20 -translate-x-1/2" />
                                <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-[#D4AF37]/20 -translate-y-1/2" />
                            </motion.div>
                        </div>
                        <span className="text-[9px] font-extrabold tracking-[0.3em] text-[#D4AF37] uppercase mt-4 block">ALEXANDRIA LENS</span>
                    </div>

                    {/* Right Column: Curated high value outputs */}
                    <div className="md:col-span-4 flex flex-col gap-4 items-end relative justify-center">
                        <span className="text-[10px] font-extrabold tracking-widest text-emerald-500 uppercase flex items-center gap-1.5">
                            <Shield size={12} />
                            Curated Yield
                        </span>

                        {/* Glassmorphic target display card */}
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={activeTarget.name}
                                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                                transition={{ duration: 0.6 }}
                                className="w-full bg-gradient-to-br from-zinc-900/90 to-zinc-950/95 border border-zinc-800/80 rounded-xl p-4.5 shadow-xl flex flex-col gap-2 relative overflow-hidden"
                            >
                                {/* Gold highlight corner */}
                                <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-[#D4AF37]/20 to-transparent pointer-events-none" />

                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{activeTarget.type} Portfolio</span>
                                    <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold rounded-full">
                                        MATCHED
                                    </span>
                                </div>
                                <span className="text-sm font-serif text-white font-normal tracking-wide mt-1">{activeTarget.name}</span>
                                
                                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-800/40 text-left">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Asset Value</span>
                                        <span className="text-xs font-semibold text-white mt-0.5 font-mono">{activeTarget.value}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Trust Index</span>
                                        <span className="text-xs font-semibold text-[#D4AF37] mt-0.5 font-mono">{activeTarget.score}</span>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>

                {/* Ledger Console: Real-time scrolling shell logs */}
                <div className="px-6 py-4.5 border-t border-zinc-800/50 bg-[#070911]/90 backdrop-blur-sm flex flex-col md:flex-row justify-between items-center gap-4 z-10">
                    
                    {/* Live scrolling logs */}
                    <div className="flex flex-col items-start gap-1 font-mono text-[10.5px] w-full md:w-8/12 text-left">
                        {logs.map((log, idx) => (
                            <div key={idx} className={`truncate w-full tracking-wide ${idx === 0 ? 'text-[#D4AF37]' : idx === 1 ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                <span className="text-zinc-600 mr-2">&gt;</span>
                                {log}
                            </div>
                        ))}
                    </div>

                    {/* Live Counter Display metrics */}
                    <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto border-t md:border-t-0 md:border-l border-zinc-800/80 pt-4 md:pt-0 md:pl-6">
                        <div className="flex flex-col items-start text-left">
                            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Cured Portfolio</span>
                            <span className="text-base font-semibold text-white font-mono tracking-tight mt-0.5">
                                {curatedCount.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex flex-col items-start text-left">
                            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Precision Index</span>
                            <span className="text-base font-semibold text-[#D4AF37] font-mono tracking-tight mt-0.5">
                                {optimizationIndex}%
                            </span>
                        </div>
                    </div>

                </div>

                {/* Animated real-time glowing vector wave at the absolute bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-8 overflow-hidden pointer-events-none opacity-20">
                    <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
                        <motion.path 
                            animate={{ d: [
                                "M0,50 Q125,20 250,50 T500,50 T750,50 T1000,50 L1000,100 L0,100 Z",
                                "M0,50 Q125,80 250,50 T500,50 T750,50 T1000,50 L1000,100 L0,100 Z",
                                "M0,50 Q125,20 250,50 T500,50 T750,50 T1000,50 L1000,100 L0,100 Z"
                            ]}}
                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                            fill="url(#waveGlow)" 
                        />
                        <defs>
                            <linearGradient id="waveGlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#D4AF37" />
                                <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

            </div>

        </div>
    );
};

export default CurationAnimation;

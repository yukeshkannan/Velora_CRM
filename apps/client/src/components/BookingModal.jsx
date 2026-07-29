import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
    X, Check, ArrowRight, Calendar, 
    Monitor, Shield, Zap, Building2, 
    Globe, Clock, ChevronLeft, Sparkles
} from 'lucide-react';
import axios from 'axios';

const BookingModal = ({ isOpen, onClose, user, contactId }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        challenge: '',
        scale: '',
        preferredDate: '',
        preferredTime: ''
    });

    const steps = [
        { id: 1, title: 'Architectural Needs' },
        { id: 2, title: 'Project Scale' },
        { id: 3, title: 'Timeline' }
    ];

    const challenges = [
        { id: 'cloud', icon: <Globe size={20} />, label: 'Cloud Transformation', desc: 'Migration & Infrastructure design' },
        { id: 'security', icon: <Shield size={20} />, label: 'Security Audit', desc: 'Hardening & Compliance' },
        { id: 'custom', icon: <Zap size={20} />, label: 'Custom CRM/ERP', desc: 'Bespoke software solutions' },
        { id: 'perf', icon: <Monitor size={20} />, label: 'System Optimization', desc: 'Scale & Performance tuning' },
    ];

    const scales = [
        { id: 'startup', label: 'Startup / MVP', desc: 'Agile & Rapid Growth' },
        { id: 'mid', label: 'Mid-Market', desc: 'Scaling operations & Reliability' },
        { id: 'enterprise', label: 'Enterprise', desc: 'High-security & Global scale' },
        { id: 'gov', label: 'Government', desc: 'Compliance & Legacy Modernization' },
    ];

    const handleSubmit = async () => {
        if (!contactId) return;
        setLoading(true);
        try {
            const description = `
                ELITE STRATEGY SESSION REQUEST
                -----------------------------
                Client: ${user?.name}
                Need: ${formData.challenge}
                Scale: ${formData.scale}
                Schedule: ${formData.preferredDate} at ${formData.preferredTime}
            `.trim();

            await axios.post('/api/tickets', {
                customerId: contactId,
                title: `Elite Strategy: ${formData.challenge}`,
                description: description,
                priority: 'Critical',
                status: 'Open'
            });
            
            setSuccess(true);
            toast.success("Booking confirmed successfully!");
        } catch (err) {
            console.error("Booking error:", err);
            toast.error("Failed to confirm booking. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-stone-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-stone-900 uppercase tracking-tight">Elite Strategy</h2>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Connect with our Lead Architects</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
                            <X size={20} className="text-stone-400" />
                        </button>
                    </div>

                    <div className="p-8">
                        {!success ? (
                            <>
                                {/* Progress */}
                                <div className="flex gap-2 mb-10">
                                    {steps.map((s) => (
                                        <div key={s.id} className="flex-1 h-1 rounded-full bg-stone-100 overflow-hidden">
                                            <motion.div 
                                                className="h-full bg-amber-600"
                                                initial={{ width: 0 }}
                                                animate={{ width: step >= s.id ? '100%' : '0%' }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Step Content */}
                                <div className="min-h-[320px]">
                                    {step === 1 && (
                                        <motion.div 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="space-y-6"
                                        >
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black text-stone-900">What's your primary challenge?</h3>
                                                <p className="text-stone-500 font-medium">Select the area that needs expert architectural guidance.</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                {challenges.map(c => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => {
                                                            setFormData({ ...formData, challenge: c.label });
                                                            nextStep();
                                                        }}
                                                        className={`p-5 rounded-2xl border-2 text-left transition-all group ${
                                                            formData.challenge === c.label 
                                                            ? 'border-amber-600 bg-amber-50' 
                                                            : 'border-stone-100 hover:border-amber-200 hover:bg-stone-50'
                                                        }`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all ${
                                                            formData.challenge === c.label ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600 group-hover:bg-amber-100 group-hover:text-amber-600'
                                                        }`}>
                                                            {c.icon}
                                                        </div>
                                                        <div className="font-black text-stone-900 uppercase text-xs tracking-wider mb-1">{c.label}</div>
                                                        <div className="text-stone-400 text-xs font-medium">{c.desc}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="space-y-6"
                                        >
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black text-stone-900">Define your project scale.</h3>
                                                <p className="text-stone-500 font-medium">This helps us assign the right engineering team.</p>
                                            </div>
                                            <div className="space-y-3">
                                                {scales.map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => {
                                                            setFormData({ ...formData, scale: s.label });
                                                            nextStep();
                                                        }}
                                                        className={`w-full p-5 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                                                            formData.scale === s.label 
                                                            ? 'border-amber-600 bg-amber-50' 
                                                            : 'border-stone-100 hover:border-amber-200 hover:bg-stone-50'
                                                        }`}
                                                    >
                                                        <div>
                                                            <div className="font-black text-stone-900 uppercase text-sm tracking-widest mb-1">{s.label}</div>
                                                            <div className="text-stone-400 text-xs font-medium">{s.desc}</div>
                                                        </div>
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                                            formData.scale === s.label ? 'border-amber-600 bg-amber-600 text-white' : 'border-stone-200'
                                                        }`}>
                                                            {formData.scale === s.label && <Check size={14} strokeWidth={3} />}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="space-y-8"
                                        >
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black text-stone-900">Finalize your timeline.</h3>
                                                <p className="text-stone-500 font-medium">When would you like to speak with our team?</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Preferred Date</label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                                                        <input 
                                                            type="date" 
                                                            min={new Date().toISOString().split('T')[0]}
                                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-stone-100 focus:border-amber-600 outline-none font-bold text-stone-900"
                                                            onChange={(e) => setFormData({...formData, preferredDate: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Available Time</label>
                                                    <div className="relative">
                                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                                                        <select 
                                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-stone-100 focus:border-amber-600 outline-none font-bold text-stone-900 appearance-none bg-white"
                                                            onChange={(e) => setFormData({...formData, preferredTime: e.target.value})}
                                                        >
                                                            <option value="">Select Time</option>
                                                            <option value="09:00 AM">09:00 AM (IST)</option>
                                                            <option value="11:00 AM">11:00 AM (IST)</option>
                                                            <option value="02:00 PM">02:00 PM (IST)</option>
                                                            <option value="04:00 PM">04:00 PM (IST)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="mt-10 flex items-center justify-between">
                                    {step > 1 ? (
                                        <button 
                                            onClick={prevStep}
                                            className="flex items-center gap-2 text-stone-400 font-black text-xs uppercase tracking-widest hover:text-stone-900 transition-colors"
                                        >
                                            <ChevronLeft size={16} /> Back
                                        </button>
                                    ) : <div />}
                                    
                                    {step === 3 ? (
                                        <button 
                                            disabled={loading || !formData.preferredDate || !formData.preferredTime}
                                            onClick={handleSubmit}
                                            className="px-10 py-4 bg-stone-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50 disabled:hover:bg-stone-900 shadow-xl"
                                        >
                                            {loading ? 'Confirming...' : 'Request Session'}
                                        </button>
                                    ) : (
                                        step < 3 && step !== 1 && step !== 2 && ( // Logic for manual next if needed, but handled by button clicks in step 1 & 2
                                            <button 
                                                onClick={nextStep}
                                                className="px-8 py-4 bg-stone-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2"
                                            >
                                                Next <ArrowRight size={16} />
                                            </button>
                                        )
                                    )}
                                </div>
                            </>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-12 text-center space-y-8"
                            >
                                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                    <Check size={48} strokeWidth={3} />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-black text-stone-900">Session Requested!</h3>
                                    <p className="text-stone-500 font-medium max-w-sm mx-auto">
                                        Our Lead Architectural Engineering team has been notified. We'll confirm the slot via email within the next 2 hours.
                                    </p>
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="px-10 py-4 bg-stone-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-800 transition-all"
                                >
                                    Return to Insights
                                </button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BookingModal;

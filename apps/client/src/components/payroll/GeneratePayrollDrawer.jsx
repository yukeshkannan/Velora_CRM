import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, Info, AlertCircle, Loader2, CreditCard } from 'lucide-react';

const GeneratePayrollDrawer = ({
    adjustEmployee,
    setAdjustEmployee,
    currentMonth,
    currentYear,
    useAutoAttendance,
    setUseAutoAttendance,
    baseSalaryInput,
    setBaseSalaryInput,
    presentDaysInput,
    setPresentDaysInput,
    totalDaysInput,
    setTotalDaysInput,
    allowancesInput,
    setAllowancesInput,
    deductionsInput,
    setDeductionsInput,
    modalError,
    generatingId,
    handleGenerate,
    calculatePreviewNet
}) => {
    return (
        <AnimatePresence>
            {adjustEmployee && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden flex flex-col font-sans"
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                                    <Sliders size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">Payroll Configuration</h3>
                                    <p className="text-xs text-slate-500 font-medium">Review attendance days & custom allowances</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setAdjustEmployee(null)}
                                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all border-none cursor-pointer bg-transparent"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleGenerate} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            {/* Employee Information Card */}
                            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">STAFF PROFILE</span>
                                    <p className="font-extrabold text-slate-900 text-sm">{adjustEmployee.name}</p>
                                    <p className="text-xs text-slate-500">{adjustEmployee.email} • <span className="font-semibold text-slate-700">{adjustEmployee.department || 'General'}</span></p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">PAY CYCLE</span>
                                    <span className="text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/50 inline-block mt-0.5">
                                        {currentMonth} {currentYear}
                                    </span>
                                </div>
                            </div>

                            {/* Base Monthly Salary */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-wider block text-slate-700">Contract Base Salary (Monthly)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                                    <input 
                                        type="number"
                                        value={baseSalaryInput}
                                        onChange={(e) => setBaseSalaryInput(e.target.value)}
                                        placeholder="e.g. 50000"
                                        required
                                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            {/* Attendance Calculation Toggle */}
                            <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Info size={16} className="text-amber-600" />
                                        <span className="text-xs font-bold text-slate-900">Auto Attendance Calculation</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={useAutoAttendance} 
                                            onChange={(e) => setUseAutoAttendance(e.target.checked)}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                                    </label>
                                </div>
                                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                    {useAutoAttendance 
                                        ? "Live synced with daily check-ins, approved leaves, and business days." 
                                        : "Manual override active. Enter custom present days and divisors below."}
                                </p>
                            </div>

                            {/* Days Matrix */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-wider block text-slate-700">Days Present</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        disabled={useAutoAttendance}
                                        value={presentDaysInput}
                                        onChange={(e) => setPresentDaysInput(e.target.value)}
                                        className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold outline-none transition-all shadow-inner ${
                                            useAutoAttendance ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500'
                                        }`}
                                    />
                                    <p className="text-[10px] text-slate-500 font-semibold">
                                        {useAutoAttendance ? 'Calculated from attendance.' : 'Manually entered paid days.'}
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-wider block text-slate-700">Total Month Days</label>
                                    <input 
                                        type="number"
                                        disabled={useAutoAttendance}
                                        value={totalDaysInput}
                                        onChange={(e) => setTotalDaysInput(e.target.value)}
                                        className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold outline-none transition-all shadow-inner ${
                                            useAutoAttendance ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500'
                                        }`}
                                    />
                                    <p className="text-[10px] text-slate-500 font-semibold">
                                        {useAutoAttendance ? 'Total calendar days in month.' : 'Base divisor for calculation.'}
                                    </p>
                                </div>

                                {/* Bonus & Allowances */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-wider block text-slate-700">Bonus & Allowances</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-sm">+</span>
                                        <input 
                                            type="number"
                                            value={allowancesInput}
                                            onChange={(e) => setAllowancesInput(e.target.value)}
                                            className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner text-emerald-600"
                                        />
                                    </div>
                                </div>

                                {/* LOP & Deductions */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-wider block text-slate-700">LOP & Deductions</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-600 font-black text-sm">-</span>
                                        <input 
                                            type="number"
                                            value={deductionsInput}
                                            onChange={(e) => setDeductionsInput(e.target.value)}
                                            className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner text-rose-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {modalError && (
                                <div className="p-3.5 bg-red-50 border border-red-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-red-800 font-semibold shadow-xs">
                                    <AlertCircle size={16} className="text-red-600 shrink-0" />
                                    <span>{modalError}</span>
                                </div>
                            )}

                            {/* Footer & Live Preview */}
                            <div className="border-t border-slate-100 pt-5 flex justify-between items-center bg-slate-50 -mx-6 -mb-6 p-6 shadow-inner rounded-b-3xl">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PREVIEW DISBURSEMENT</p>
                                    <p className="text-3xl font-black text-slate-900 tracking-tight">₹{calculatePreviewNet().toLocaleString()}</p>
                                </div>
                                <button 
                                    type="submit"
                                    disabled={generatingId !== null}
                                    className="px-8 py-3.5 bg-slate-900 hover:bg-amber-600 text-white font-black uppercase tracking-wider text-[11px] rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer border-none"
                                >
                                    {generatingId !== null ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                                    Generate & Mail
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default GeneratePayrollDrawer;

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer } from 'lucide-react';

const PayslipModal = ({ selectedPayslip, setSelectedPayslip, user, handleDownloadPDF }) => {
    if (!selectedPayslip) return null;

    let present = 0;
    let total = 31;
    try {
        const parsed = JSON.parse(selectedPayslip.details);
        present = Number(parsed.presentDays) || 0;
        total = Number(parsed.totalDays) || 31;
    } catch(e) {}

    const baseVal = selectedPayslip.baseSalary || 0;
    const proratedVal = total > 0 ? Math.round((baseVal / total) * present) : baseVal;
    const lopVal = Math.max(0, baseVal - proratedVal);

    const basicVal = Math.round(baseVal * 0.50);
    const hraVal = Math.round(baseVal * 0.30);
    const specialVal = baseVal - basicVal - hraVal;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden flex flex-col font-sans"
                >
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest">{selectedPayslip.month} {selectedPayslip.year}</p>
                            <h3 className="text-lg font-extrabold text-slate-900">Compensation Summary Statement</h3>
                        </div>
                        <button 
                            onClick={() => setSelectedPayslip(null)}
                            className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all border-none cursor-pointer bg-transparent"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">RECIPIENT PERSONNEL</p>
                                <p className="font-bold text-slate-900 text-sm">{(selectedPayslip.userId && typeof selectedPayslip.userId === 'object' ? selectedPayslip.userId.name : user?.name) || 'Employee'}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{(selectedPayslip.userId && typeof selectedPayslip.userId === 'object' ? selectedPayslip.userId.email : user?.email) || ''}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">DISBURSEMENT CYCLE</p>
                                <p className="font-bold text-slate-900 text-sm">{selectedPayslip.month} {selectedPayslip.year}</p>
                                <p className="text-xs text-slate-500 mt-0.5">Cycle ID: PAY-{selectedPayslip._id.slice(-6).toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-slate-50/80 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                Line Item Breakdowns
                            </div>
                            <div className="divide-y divide-slate-100 bg-white">
                                <div className="p-3.5 flex justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Basic Salary (50%)</span>
                                    <span className="font-bold text-slate-800">₹{basicVal.toLocaleString()}</span>
                                </div>
                                <div className="p-3.5 flex justify-between text-xs">
                                    <span className="font-semibold text-slate-500">House Rent Allowance (30%)</span>
                                    <span className="font-bold text-slate-800">₹{hraVal.toLocaleString()}</span>
                                </div>
                                <div className="p-3.5 flex justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Special Allowance (20%)</span>
                                    <span className="font-bold text-slate-800">₹{specialVal.toLocaleString()}</span>
                                </div>
                                <div className="p-3.5 flex justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Performance Allowances & Bonuses</span>
                                    <span className="font-bold text-emerald-600">+ ₹{(selectedPayslip.allowances || 0).toLocaleString()}</span>
                                </div>
                                <div className="p-3.5 flex justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Loss of Pay (LOP) [{Math.round((total - present) * 100) / 100} Days Absent]</span>
                                    <span className="font-bold text-red-500">- ₹{lopVal.toLocaleString()}</span>
                                </div>
                                <div className="p-3.5 flex justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Statutory Deductions & Taxes</span>
                                    <span className="font-bold text-red-500">- ₹{(selectedPayslip.deductions || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-slate-950 text-white rounded-2xl flex justify-between items-center shadow-lg">
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NET PAYMENT SETTLED</span>
                                <span className="text-3xl font-black tracking-tight">₹{selectedPayslip.netSalary.toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">RELEASE STATUS</span>
                                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mt-1 inline-block">
                                    DISBURSED
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                        <button 
                            onClick={() => handleDownloadPDF(selectedPayslip)}
                            className="flex-1 py-3.5 bg-slate-950 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-1.5 shadow-xl shadow-slate-950/10 border-none cursor-pointer"
                        >
                            <Printer size={15} /> 
                            Print / Save PDF
                        </button>
                        <button 
                            onClick={() => setSelectedPayslip(null)}
                            className="px-6 py-3.5 bg-white text-slate-700 rounded-xl font-bold text-xs uppercase border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PayslipModal;

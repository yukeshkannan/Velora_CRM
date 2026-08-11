import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Sliders, CheckCircle, Trash2, ChevronRight, FileText, TrendingUp 
} from 'lucide-react';

const PayrollTable = ({
    activeTab,
    searchTerm,
    setSearchTerm,
    filteredEmployees,
    allPayrolls,
    payrolls,
    openAdjustModal,
    generatingId,
    handleDelete,
    setSelectedPayslip
}) => {
    const today = new Date();
    const currentMonth = today.toLocaleString('default', { month: 'long' });
    const currentYear = today.getFullYear();

    return (
        <div className="p-4 sm:p-8 md:p-10 bg-white min-h-[500px] font-sans">
            <AnimatePresence mode="wait">
                {activeTab === 'generate' ? (
                    <motion.div 
                        key="generate"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="space-y-8"
                    >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Workforce Compensation Roster</h2>
                                <p className="text-xs text-slate-500 font-medium">Manage and generate salaries for staff and employees.</p>
                            </div>
                            
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search by name or email..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-slate-400 transition-all shadow-inner"
                                />
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white">
                            <table className="w-full text-left min-w-[620px]">
                                <thead className="bg-slate-50/80 text-slate-500 text-[11px] font-black uppercase tracking-wider border-b border-slate-100">
                                    <tr>
                                        <th className="p-6 pl-8">Employee</th>
                                        <th className="p-6">Designation / Dept</th>
                                        <th className="p-6">Base Salary</th>
                                        <th className="p-6 text-right pr-8">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredEmployees.map((emp, idx) => {
                                        const empId = emp._id || emp.id;
                                        return (
                                            <tr key={empId || `emp-${idx}`} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="p-6 pl-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-base shadow-sm group-hover:bg-amber-600 transition-colors">
                                                            {emp.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-slate-900 text-sm">{emp.name}</p>
                                                                {emp.role === 'Admin' && (
                                                                    <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                                        Owner
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-400 font-medium">{emp.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="space-y-1">
                                                        <span className="font-bold text-slate-800 text-xs">{emp.role === 'Admin' ? 'Executive Owner' : emp.role}</span>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp.department || 'General'}</p>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    {emp.salary?.base ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-extrabold text-sm text-slate-900">
                                                                ₹{emp.salary.base.toLocaleString()}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase">/Mo</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 font-bold text-xs">Not Set</span>
                                                    )}
                                                </td>
                                                <td className="p-6 text-right pr-8">
                                                    {(() => {
                                                        const existingPayroll = allPayrolls.find(p => {
                                                            const pUserId = typeof p.userId === 'object' && p.userId !== null ? (p.userId._id || p.userId.id) : p.userId;
                                                            return String(pUserId) === String(empId) &&
                                                                   String(p.month).toLowerCase() === String(currentMonth).toLowerCase() &&
                                                                   Number(p.year) === Number(currentYear);
                                                        });

                                                        if (existingPayroll) {
                                                            return (
                                                                <div className="flex items-center justify-end gap-2.5">
                                                                    <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100 flex items-center gap-1.5 shadow-sm shadow-emerald-50/50">
                                                                        <CheckCircle size={14} className="text-emerald-500" /> Released
                                                                    </span>
                                                                    <button 
                                                                        onClick={() => handleDelete(existingPayroll._id)}
                                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 cursor-pointer bg-transparent"
                                                                        title="Delete payroll record"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <button 
                                                                onClick={() => openAdjustModal(emp)}
                                                                disabled={generatingId === empId}
                                                                className="px-5 py-2.5 bg-slate-950 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-amber-600 transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-slate-950/10 flex items-center gap-1.5 ml-auto border-none cursor-pointer"
                                                            >
                                                                <Sliders size={13} />
                                                                Process Pay
                                                            </button>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredEmployees.length === 0 && (
                                        <tr key="no-employees-found">
                                            <td colSpan="4" className="p-10 text-center text-slate-400 font-medium">
                                                No personnel matching your criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ) : activeTab === 'all_records' ? (
                    <motion.div 
                        key="all_records"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="space-y-6"
                    >
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">All Company Generated Payrolls</h2>
                            <p className="text-xs text-slate-500 font-medium">All generated compensation disbursements across staff members.</p>
                        </div>

                        {allPayrolls.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {allPayrolls.map((slip) => {
                                    const empName = typeof slip.userId === 'object' ? slip.userId?.name : 'Employee Record';
                                    const empEmail = typeof slip.userId === 'object' ? slip.userId?.email : '';
                                    return (
                                        <div 
                                            key={slip._id} 
                                            className="bg-white rounded-2xl border border-slate-200/60 p-6 flex flex-col justify-between hover:border-slate-400 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                                        >
                                            <div className="relative z-10 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest">{slip.month} {slip.year}</p>
                                                        <h3 className="text-base font-extrabold text-slate-900">{empName}</h3>
                                                        <p className="text-xs text-slate-400 font-medium">{empEmail}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDelete(slip._id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 cursor-pointer bg-transparent"
                                                        title="Delete payroll record"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="py-2 flex justify-between border-b border-dashed border-slate-100">
                                                    <div>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">NET DISBURSEMENT</p>
                                                        <p className="text-2xl font-black text-slate-900 tracking-tight">₹{slip.netSalary?.toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">STATUS</p>
                                                        <span className="inline-block text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 mt-1">
                                                            {slip.status || 'Generated'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center text-xs font-bold text-slate-500 pt-1">
                                                    <span>Cycle ID: PAY-${slip._id.slice(-6).toUpperCase()}</span>
                                                    <button 
                                                        onClick={() => setSelectedPayslip(slip)}
                                                        className="flex items-center gap-1.5 text-slate-900 hover:text-amber-600 font-bold bg-transparent border-none cursor-pointer"
                                                    >
                                                        View Payslip
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-24 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200/80 flex flex-col items-center">
                                <TrendingUp size={28} className="text-slate-400 mb-2" />
                                <h3 className="text-lg font-bold text-slate-900">No Generated Payroll Records</h3>
                                <p className="text-slate-400 text-xs mt-1">No payroll records have been generated yet in the system.</p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div 
                        key="payslips"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="space-y-6"
                    >
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Your Payslip Archives</h2>
                            <p className="text-xs text-slate-500 font-medium">Archived statements of monthly compensation payouts.</p>
                        </div>

                        {payrolls.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {payrolls.map((slip) => (
                                    <div 
                                        key={slip._id} 
                                        onClick={() => setSelectedPayslip(slip)}
                                        className="bg-white rounded-2xl border border-slate-200/60 p-6 flex flex-col justify-between hover:border-slate-400 hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-105 z-0"></div>
                                        
                                        <div className="relative z-10 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest">{slip.month} {slip.year}</p>
                                                    <h3 className="text-base font-extrabold text-slate-900">Compensation Slip</h3>
                                                </div>
                                                <span className="p-2.5 bg-slate-100 rounded-xl text-slate-500 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                                                    <FileText size={18} />
                                                </span>
                                            </div>

                                            <div className="py-2 flex justify-between border-b border-dashed border-slate-100">
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">NET DISBURSEMENT</p>
                                                    <p className="text-2xl font-black text-slate-950 tracking-tight">₹{slip.netSalary.toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">STATUS</p>
                                                    <span className="inline-block text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 mt-1">
                                                        SETTLED
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center text-xs font-bold text-slate-500 pt-1">
                                                <span>Cycle ID: PAY-${slip._id.slice(-6).toUpperCase()}</span>
                                                <div className="flex items-center gap-1.5 text-slate-900 group-hover:text-amber-600 transition-colors">
                                                    View Statement
                                                    <ChevronRight size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-24 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200/80 flex flex-col items-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-5 border border-slate-200 shadow-sm">
                                    <TrendingUp size={28} className="text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 uppercase">No Statements Released</h3>
                                <p className="text-slate-400 text-xs font-semibold mt-1 max-w-xs mx-auto">
                                    No payslips have been generated for you in this fiscal lifecycle.
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PayrollTable;

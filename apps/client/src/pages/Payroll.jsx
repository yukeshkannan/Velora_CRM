import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { usePayroll } from '../hooks/usePayroll';
import LoadingSpinner from '../components/LoadingSpinner';
import PayrollSummaryCards from '../components/payroll/PayrollSummaryCards';
import PayrollTable from '../components/payroll/PayrollTable';
import GeneratePayrollDrawer from '../components/payroll/GeneratePayrollDrawer';
import PayslipModal from '../components/payroll/PayslipModal';
import DeletePayrollModal from '../components/payroll/DeletePayrollModal';

const Payroll = () => {
    const payroll = usePayroll();

    if (payroll.loading) return <LoadingSpinner message="Loading Payroll Ledger..." />;
    if (!payroll.user) return <div className="p-8 text-center text-slate-500">Please log in to view payroll information.</div>;

    return (
        <div className="bg-slate-50/50 min-h-screen pb-24 font-sans">
            {/* Top Notification Toast */}
            <AnimatePresence>
                {payroll.notification && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`fixed top-6 right-6 z-[9999] px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 bg-white ${
                            payroll.notification.type === 'success' ? 'border-emerald-100 text-emerald-800' : 'border-red-100 text-red-800'
                        }`}
                    >
                        {payroll.notification.type === 'success' ? (
                            <CheckCircle size={20} className="text-emerald-500" />
                        ) : (
                            <AlertCircle size={20} className="text-red-500" />
                        )}
                        <span className="font-semibold text-sm">{payroll.notification.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header section with Slate Monochrome styling */}
            <div className="bg-white border-b border-slate-200/80 pt-6 pb-6 sm:pt-8 sm:pb-8 px-4 sm:px-8 antialiased">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Payroll Processing</h1>
                        <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
                            Configure compensation matrices, view past disbursements, and issue payslips.
                        </p>
                    </div>

                    <PayrollSummaryCards stats={payroll.stats} />
                </div>
            </div>

            {/* Main Content Card Layout */}
            <div className="max-w-7xl mx-auto px-0 sm:px-8 -mt-6">
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100/80 overflow-hidden">
                    
                    {/* Role-based Tab Swapper for Managers */}
                    {payroll.isPayrollManager && (
                        <div className="flex border-b border-slate-100 bg-slate-50/50 px-2 sm:px-6 overflow-x-auto">
                            <button 
                                onClick={() => payroll.setActiveTab('generate')}
                                className={`px-4 sm:px-6 py-4 sm:py-5 text-xs font-bold tracking-widest transition-all relative border-none bg-transparent cursor-pointer shrink-0 ${
                                    payroll.activeTab === 'generate' ? 'text-slate-900 font-extrabold' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Users size={15} />
                                    DISBURSE COMPENSATIONS
                                </div>
                                {payroll.activeTab === 'generate' && (
                                    <motion.div layoutId="tab-underline-payroll" className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-slate-900" />
                                )}
                            </button>

                            <button 
                                onClick={() => payroll.setActiveTab('all_records')}
                                className={`px-6 py-5 text-xs font-bold tracking-widest transition-all relative border-none bg-transparent cursor-pointer ${
                                    payroll.activeTab === 'all_records' ? 'text-slate-900 font-extrabold' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <FileText size={15} />
                                    ALL GENERATED RECORDS ({payroll.allPayrolls.length})
                                </div>
                                {payroll.activeTab === 'all_records' && (
                                    <motion.div layoutId="tab-underline-payroll" className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-slate-900" />
                                )}
                            </button>
                        </div>
                    )}

                    {/* Table & Grid Views */}
                    <PayrollTable 
                        activeTab={payroll.activeTab}
                        searchTerm={payroll.searchTerm}
                        setSearchTerm={payroll.setSearchTerm}
                        filteredEmployees={payroll.filteredEmployees}
                        allPayrolls={payroll.allPayrolls}
                        payrolls={payroll.payrolls}
                        openAdjustModal={payroll.openAdjustModal}
                        generatingId={payroll.generatingId}
                        handleDelete={payroll.setShowDeleteConfirm}
                        setSelectedPayslip={payroll.setSelectedPayslip}
                    />
                </div>
            </div>

            {/* Adjust & Generate Modal */}
            <GeneratePayrollDrawer 
                adjustEmployee={payroll.adjustEmployee}
                setAdjustEmployee={payroll.setAdjustEmployee}
                currentMonth={payroll.currentMonth}
                currentYear={payroll.currentYear}
                useAutoAttendance={payroll.useAutoAttendance}
                setUseAutoAttendance={payroll.setUseAutoAttendance}
                baseSalaryInput={payroll.baseSalaryInput}
                setBaseSalaryInput={payroll.setBaseSalaryInput}
                presentDaysInput={payroll.presentDaysInput}
                setPresentDaysInput={payroll.setPresentDaysInput}
                totalDaysInput={payroll.totalDaysInput}
                setTotalDaysInput={payroll.setTotalDaysInput}
                allowancesInput={payroll.allowancesInput}
                setAllowancesInput={payroll.setAllowancesInput}
                deductionsInput={payroll.deductionsInput}
                setDeductionsInput={payroll.setDeductionsInput}
                modalError={payroll.modalError}
                generatingId={payroll.generatingId}
                handleGenerate={payroll.handleGenerate}
                calculatePreviewNet={payroll.calculatePreviewNet}
            />

            {/* View & Print Payslip Modal */}
            <PayslipModal 
                selectedPayslip={payroll.selectedPayslip}
                setSelectedPayslip={payroll.setSelectedPayslip}
                user={payroll.user}
                handleDownloadPDF={payroll.handleDownloadPDF}
            />

            {/* Delete Confirmation Modal */}
            <DeletePayrollModal 
                showDeleteConfirm={payroll.showDeleteConfirm}
                setShowDeleteConfirm={payroll.setShowDeleteConfirm}
                confirmDeletePayroll={payroll.confirmDeletePayroll}
            />
        </div>
    );
};

export default Payroll;

import React from 'react';
import { Trash2 } from 'lucide-react';

const DeletePayrollModal = ({ showDeleteConfirm, setShowDeleteConfirm, confirmDeletePayroll }) => {
    if (!showDeleteConfirm) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-center shadow-2xl border border-slate-200/80 font-sans">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                    <Trash2 size={24} />
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 mb-1">Delete Payroll Record?</h2>
                <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">
                    Are you sure you want to delete this payroll disbursement? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                    <button 
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border-none" 
                        onClick={() => setShowDeleteConfirm(null)}
                    >
                        Cancel
                    </button>
                    <button 
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors cursor-pointer border-none" 
                        onClick={confirmDeletePayroll}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeletePayrollModal;

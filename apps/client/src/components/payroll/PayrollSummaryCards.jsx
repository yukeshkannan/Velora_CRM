import React from 'react';

const PayrollSummaryCards = ({ stats = [] }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
            {stats.map((stat, idx) => (
                <div 
                    key={idx} 
                    className={`bg-white px-4 py-3.5 rounded-2xl border ${stat.border || 'border-slate-200/80'} min-w-[170px] shadow-2xs flex items-center justify-between gap-4`}
                >
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                            {stat.label}
                        </span>
                        <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                            {stat.value}
                        </span>
                    </div>
                    <div className={`w-9 h-9 rounded-xl ${stat.bg || 'bg-slate-100'} flex items-center justify-center`}>
                        <stat.icon size={16} className={stat.textColor || 'text-slate-700'} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PayrollSummaryCards;

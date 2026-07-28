import React, { useState } from 'react';
import axios from 'axios';
import { X, Calendar, Sun, Moon, Clock, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ApplyLeaveModal = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [leaveType, setLeaveType] = useState('Casual Leave (CL)');
    const [durationType, setDurationType] = useState('Full Day'); // 'Full Day' | 'Half Day' | 'Short Leave'
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [halfDaySession, setHalfDaySession] = useState('First Half (Morning)');
    const [shortLeaveHours, setShortLeaveHours] = useState('2 Hours');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const calculateDaysCount = () => {
        if (durationType === 'Half Day') return '0.5 Day';
        if (durationType === 'Short Leave') return `${shortLeaveHours}`;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return `${isNaN(diffDays) ? 1 : diffDays}.0 ${diffDays === 1 ? 'Day' : 'Days'}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) {
            setError('Please provide a reason for the leave request.');
            return;
        }
        if (durationType === 'Full Day' && new Date(startDate) > new Date(endDate)) {
            setError('End date cannot be earlier than start date.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const payload = {
                userId: user?.id || user?._id,
                leaveType,
                startDate,
                endDate: durationType === 'Full Day' ? endDate : startDate,
                durationType,
                halfDaySession: durationType === 'Half Day' ? halfDaySession : 'N/A',
                shortLeaveHours: durationType === 'Short Leave' ? shortLeaveHours : 'N/A',
                reason
            };
            await axios.post('/api/leave', payload);
            setLoading(false);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error("Apply Leave error:", err);
            setError(err.response?.data?.message || 'Failed to submit leave request.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in font-sans">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl w-full max-w-lg overflow-hidden">
                
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                            <Clock size={14} className="text-slate-500" /> Time Off & PTO
                        </div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Request Leave / PTO</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Leave Category Select */}
                    <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Leave Type</label>
                        <select 
                            value={leaveType}
                            onChange={(e) => setLeaveType(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-colors"
                        >
                            <option value="Casual Leave (CL)">Casual Leave (CL)</option>
                            <option value="Sick Leave (SL)">Sick Leave (SL)</option>
                            <option value="Earned Leave (EL)">Earned Leave (EL)</option>
                            <option value="Work From Home">Work From Home (WFH)</option>
                        </select>
                    </div>

                    {/* Duration Type Segmented Picker */}
                    <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Duration</label>
                        <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/60">
                            <button
                                type="button"
                                onClick={() => setDurationType('Full Day')}
                                className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer ${
                                    durationType === 'Full Day' 
                                        ? 'bg-slate-900 text-white shadow-2xs' 
                                        : 'text-slate-500 hover:text-slate-900 bg-transparent'
                                }`}
                            >
                                <Sun size={14} />
                                Full Day
                            </button>

                            <button
                                type="button"
                                onClick={() => setDurationType('Half Day')}
                                className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer ${
                                    durationType === 'Half Day' 
                                        ? 'bg-slate-900 text-white shadow-2xs' 
                                        : 'text-slate-500 hover:text-slate-900 bg-transparent'
                                }`}
                            >
                                <Moon size={14} />
                                Half Day
                            </button>

                            <button
                                type="button"
                                onClick={() => setDurationType('Short Leave')}
                                className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer ${
                                    durationType === 'Short Leave' 
                                        ? 'bg-slate-900 text-white shadow-2xs' 
                                        : 'text-slate-500 hover:text-slate-900 bg-transparent'
                                }`}
                            >
                                <Clock size={14} />
                                Permission
                            </button>
                        </div>
                    </div>

                    {/* FULL DAY DATES */}
                    {durationType === 'Full Day' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Start Date</label>
                                    <input 
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">End Date</label>
                                    <input 
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HALF DAY SESSION PICKER */}
                    {durationType === 'Half Day' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Leave Date</label>
                                <input 
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Select Session</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setHalfDaySession('First Half (Morning)')}
                                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                            halfDaySession === 'First Half (Morning)' 
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' 
                                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="font-black text-xs">First Half (Morning)</div>
                                        <div className={`text-[10px] mt-0.5 ${halfDaySession === 'First Half (Morning)' ? 'text-slate-300' : 'text-slate-500'}`}>09:00 AM - 01:30 PM</div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setHalfDaySession('Second Half (Afternoon)')}
                                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                            halfDaySession === 'Second Half (Afternoon)' 
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' 
                                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="font-black text-xs">Second Half (Afternoon)</div>
                                        <div className={`text-[10px] mt-0.5 ${halfDaySession === 'Second Half (Afternoon)' ? 'text-slate-300' : 'text-slate-500'}`}>01:30 PM - 06:00 PM</div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SHORT LEAVE / PERMISSION PICKER */}
                    {durationType === 'Short Leave' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Permission Date</label>
                                <input 
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Permission Duration</label>
                                <select 
                                    value={shortLeaveHours}
                                    onChange={(e) => setShortLeaveHours(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-colors"
                                >
                                    <option value="1 Hour">1 Hour Permission</option>
                                    <option value="2 Hours">2 Hours Permission</option>
                                    <option value="3 Hours">3 Hours Permission</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Calculated Days Badge */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                        <span className="font-extrabold text-slate-700">Calculated Time Off:</span>
                        <span className="font-black text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-2xs">
                            {calculateDaysCount()}
                        </span>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Reason / Description</label>
                        <textarea 
                            rows={3}
                            placeholder="Brief description for HR & Manager review..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-colors resize-none"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-xs border-none cursor-pointer"
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default ApplyLeaveModal;

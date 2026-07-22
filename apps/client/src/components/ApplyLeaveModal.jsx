import React, { useState } from 'react';
import axios from 'axios';
import { X, Calendar, Sun, Moon, Clock, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ApplyLeaveModal = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [leaveType, setLeaveType] = useState('Casual Leave');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4 animate-fade-in font-sans">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg overflow-hidden">
                
                {/* Modal Header */}
                <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
                            <Clock size={14} /> Time Off & PTO
                        </div>
                        <h3 className="text-lg font-bold text-stone-900">Request Leave / PTO</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Leave Category Select */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">Leave Type</label>
                        <select 
                            value={leaveType}
                            onChange={(e) => setLeaveType(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 outline-none focus:border-amber-600 focus:bg-white transition-colors"
                        >
                            <option value="Casual Leave">Casual Leave (CL)</option>
                            <option value="Sick Leave">Sick Leave (SL)</option>
                            <option value="Earned Leave">Earned Leave (EL)</option>
                            <option value="Work From Home">Work From Home (WFH)</option>
                        </select>
                    </div>

                    {/* Duration Type Segmented Picker (Zoho / BambooHR Style) */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">Duration</label>
                        <div className="grid grid-cols-3 gap-2 bg-stone-100 p-1.5 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setDurationType('Full Day')}
                                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer ${
                                    durationType === 'Full Day' 
                                        ? 'bg-white text-stone-900 shadow-sm' 
                                        : 'text-stone-500 hover:text-stone-800 bg-transparent'
                                }`}
                            >
                                <Sun size={14} className={durationType === 'Full Day' ? 'text-amber-500' : ''} />
                                Full Day
                            </button>

                            <button
                                type="button"
                                onClick={() => setDurationType('Half Day')}
                                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer ${
                                    durationType === 'Half Day' 
                                        ? 'bg-white text-stone-900 shadow-sm' 
                                        : 'text-stone-500 hover:text-stone-800 bg-transparent'
                                }`}
                            >
                                <Moon size={14} className={durationType === 'Half Day' ? 'text-indigo-500' : ''} />
                                Half Day
                            </button>

                            <button
                                type="button"
                                onClick={() => setDurationType('Short Leave')}
                                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer ${
                                    durationType === 'Short Leave' 
                                        ? 'bg-white text-stone-900 shadow-sm' 
                                        : 'text-stone-500 hover:text-stone-800 bg-transparent'
                                }`}
                            >
                                <Clock size={14} className={durationType === 'Short Leave' ? 'text-emerald-500' : ''} />
                                Permission
                            </button>
                        </div>
                    </div>

                    {/* FULL DAY DATES */}
                    {durationType === 'Full Day' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">Start Date</label>
                                    <input 
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 outline-none focus:border-amber-600 focus:bg-white transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">End Date</label>
                                    <input 
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 outline-none focus:border-amber-600 focus:bg-white transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HALF DAY SESSION PICKER */}
                    {durationType === 'Half Day' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Leave Date</label>
                                <input 
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 outline-none focus:border-amber-600 focus:bg-white transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Select Session</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setHalfDaySession('First Half (Morning)')}
                                        className={`p-3 rounded-xl border text-left transition-all border-none cursor-pointer ${
                                            halfDaySession === 'First Half (Morning)' 
                                                ? 'bg-amber-50/80 border-2 border-amber-500 text-stone-900' 
                                                : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                                        }`}
                                    >
                                        <div className="font-bold text-xs">First Half (Morning)</div>
                                        <div className="text-[10px] text-stone-500 mt-0.5">09:00 AM - 01:30 PM</div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setHalfDaySession('Second Half (Afternoon)')}
                                        className={`p-3 rounded-xl border text-left transition-all border-none cursor-pointer ${
                                            halfDaySession === 'Second Half (Afternoon)' 
                                                ? 'bg-amber-50/80 border-2 border-amber-500 text-stone-900' 
                                                : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                                        }`}
                                    >
                                        <div className="font-bold text-xs">Second Half (Afternoon)</div>
                                        <div className="text-[10px] text-stone-500 mt-0.5">01:30 PM - 06:00 PM</div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SHORT LEAVE / PERMISSION PICKER */}
                    {durationType === 'Short Leave' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Permission Date</label>
                                <input 
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 outline-none focus:border-amber-600 focus:bg-white transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Permission Duration</label>
                                <select 
                                    value={shortLeaveHours}
                                    onChange={(e) => setShortLeaveHours(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 outline-none focus:border-amber-600 focus:bg-white transition-colors"
                                >
                                    <option value="1 Hour">1 Hour Permission</option>
                                    <option value="2 Hours">2 Hours Permission</option>
                                    <option value="3 Hours">3 Hours Permission</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Calculated Days Badge */}
                    <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs">
                        <span className="font-semibold text-stone-700">Calculated Time Off:</span>
                        <span className="font-black text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                            {calculateDaysCount()}
                        </span>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">Reason / Description</label>
                        <textarea 
                            rows={3}
                            placeholder="Brief description for HR & Manager review..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 outline-none focus:border-amber-600 focus:bg-white transition-colors resize-none"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm border-none cursor-pointer"
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

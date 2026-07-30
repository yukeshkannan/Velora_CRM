import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Clock, Calendar, CheckCircle, XCircle, Users, Trash2, Plus, Check, X, ShieldAlert, FileText, Send, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ApplyLeaveModal from '../components/ApplyLeaveModal';

const ActiveTimer = ({ checkIn }) => {
    const [elapsed, setElapsed] = useState('0.00');

    useEffect(() => {
        const update = () => {
            const diff = Date.now() - new Date(checkIn).getTime();
            const hrs = diff / (1000 * 60 * 60);
            setElapsed(Math.max(0, hrs).toFixed(2));
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [checkIn]);

    return (
        <span className="font-extrabold text-emerald-700 bg-emerald-50/90 px-3 py-1 rounded-xl text-xs border border-emerald-200 shadow-2xs whitespace-nowrap inline-flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {elapsed} hrs active
        </span>
    );
};

const LargeActiveClock = ({ checkIn }) => {
    const [timeString, setTimeString] = useState('00:00:00');

    useEffect(() => {
        const update = () => {
            const diff = Date.now() - new Date(checkIn).getTime();
            if (diff < 0) return;
            const totalSecs = Math.floor(diff / 1000);
            const secs = totalSecs % 60;
            const totalMins = Math.floor(totalSecs / 60);
            const mins = totalMins % 60;
            const hrs = Math.floor(totalMins / 60);
            
            const pad = (n) => String(n).padStart(2, '0');
            setTimeString(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [checkIn]);

    return (
        <div className="text-center">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Session Duration</p>
            <p className="text-4xl font-black text-emerald-600 font-mono tracking-tight">{timeString}</p>
        </div>
    );
};

const Attendance = () => {
    const { user } = useAuth();
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ present: 0, online: 0, absent: 0, avgHours: '0.0' });
    const [selectedUser, setSelectedUser] = useState(null); // For detail view
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All'); // 'All' | 'HR' | 'Sales' | 'Employee'
    const [selectedMonthFilter, setSelectedMonthFilter] = useState('');
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'leaves'
    const [empTab, setEmpTab] = useState('sessions'); // 'sessions' | 'leaves'

    const isManager = user?.role === 'Admin' || user?.role === 'HR' || (user?.department || '').toLowerCase().includes('hr') || (user?.department || '').toLowerCase().includes('human');

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        fetchAttendance();
        fetchLeaves();
        
        let interval;
        if (isManager) {
            interval = setInterval(() => {
                fetchAttendance();
                fetchLeaves();
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [user?.id, user?.role]);

    const fetchLeaves = async () => {
        try {
            const endpoint = isManager ? '/api/leave' : `/api/leave?userId=${user.id}`;
            const res = await axios.get(endpoint);
            const data = res.data.data || [];
            // Filter out orphan leave requests where user was deleted
            const validLeaves = data.filter(l => l.userId != null && (typeof l.userId === 'object' ? l.userId._id : true));
            setLeaves(validLeaves);
        } catch (err) {
            console.error("Fetch leaves error:", err);
        }
    };

    const handleUpdateLeaveStatus = async (leaveId, status) => {
        try {
            await axios.put(`/api/leave/${leaveId}/status`, {
                status,
                reviewedBy: user?.id || user?._id
            });
            toast.success(`Leave request status updated to ${status}`);
            fetchLeaves();
        } catch (err) {
            console.error("Update leave error:", err);
            toast.error(err.response?.data?.message || 'Failed to update leave status');
        }
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // { type: 'leave' | 'session', id: string }

    const handleDeleteLeave = (leaveId) => {
        setShowDeleteConfirm({ type: 'leave', id: leaveId });
    };

    const handleDeleteSession = (sessionId) => {
        setShowDeleteConfirm({ type: 'session', id: sessionId });
    };

    const confirmDeleteAction = async () => {
        if (!showDeleteConfirm) return;
        try {
            if (showDeleteConfirm.type === 'leave') {
                await axios.delete(`/api/leave/${showDeleteConfirm.id}`);
                toast.success('Leave request deleted successfully');
                fetchLeaves();
            } else if (showDeleteConfirm.type === 'session') {
                await axios.delete(`/api/attendance/${showDeleteConfirm.id}`);
                toast.success('Session deleted successfully');
                fetchAttendance();
            }
            setShowDeleteConfirm(null);
        } catch (err) {
            console.error("Delete error:", err);
            toast.error(err.response?.data?.message || 'Delete operation failed');
            setShowDeleteConfirm(null);
        }
    };

    const fetchAttendance = async () => {
        try {
            // Admin and HR fetch ALL records, other staff fetch their OWN
            const endpoint = isManager ? '/api/attendance?limit=100' : `/api/attendance?userId=${user.id}`;
            const res = await axios.get(endpoint);
            const data = res.data.data || [];
            setAttendance(data);

            // Calculate Stats for Manager View (Admin & HR) - STRICTLY for Employees/Staff ONLY
            if (isManager) {
                const todayStr = new Date().toDateString();

                // Filter out Admin & Client records
                const staffTodaysRecords = data.filter(r => {
                    if (new Date(r.date).toDateString() !== todayStr) return false;
                    const role = typeof r.userId === 'object' ? r.userId?.role : '';
                    return role !== 'Client' && role !== 'Admin';
                });
                
                const uniquePresent = new Set(
                    staffTodaysRecords
                        .filter(r => r.userId && (r.userId._id || r.userId))
                        .map(r => String(r.userId._id || r.userId))
                ).size;
                
                const currentlyOnline = new Set(
                    staffTodaysRecords
                        .filter(r => !r.checkOut && r.userId && (r.userId._id || r.userId))
                        .map(r => String(r.userId._id || r.userId))
                ).size;
                
                let absentCount = 0;
                try {
                    const usersRes = await axios.get('/api/auth/users');
                    const allUsers = usersRes.data.data || [];
                    const totalStaff = allUsers.filter(u => u.role !== 'Client' && u.role !== 'Admin').length;
                    absentCount = Math.max(0, totalStaff - uniquePresent);
                } catch (userErr) {
                    console.error("Failed to fetch users for stats:", userErr);
                }

                // Average Hours per Day for Staff ONLY
                const staffData = data.filter(r => {
                    const role = typeof r.userId === 'object' ? r.userId?.role : '';
                    return role !== 'Client' && role !== 'Admin';
                });

                const activeOrCompleted = staffData.filter(r => r.totalHours || (!r.checkOut && new Date(r.date).toDateString() === new Date().toDateString()));
                const totalHrs = activeOrCompleted.reduce((sum, r) => {
                    if (r.totalHours) return sum + parseFloat(r.totalHours);
                    const elapsed = (Date.now() - new Date(r.checkIn)) / (1000 * 60 * 60);
                    return sum + Math.max(0, elapsed);
                }, 0);
                const avgHrs = activeOrCompleted.length > 0 ? (totalHrs / activeOrCompleted.length).toFixed(1) : "0.0";
                
                setStats({
                    present: uniquePresent,
                    online: currentlyOnline,
                    absent: absentCount,
                    avgHours: avgHrs
                });
            }

            setLoading(false);
        } catch (err) {
            console.error("Attendance fetch error:", err);
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    // Helper for Admin/HR View (Grouping)
    const getGroupedAttendance = () => {
        const groups = {};
        attendance.forEach(record => {
            const uId = record.userId?._id || record.userId;
            const uRole = record.userId?.role || '';
            if (!uId || uRole === 'Admin' || uRole === 'Client') return;
            if (!groups[uId]) {
                groups[uId] = {
                    user: record.userId,
                    records: [],
                    latestSession: record,
                    totalHoursToday: 0
                };
            }
            groups[uId].records.push(record);
            
            const todayStr = new Date().toDateString();
            if (new Date(record.date).toDateString() === todayStr) {
                if (record.totalHours) {
                    groups[uId].totalHoursToday += parseFloat(record.totalHours);
                } else if (!record.checkOut) {
                    const elapsed = (Date.now() - new Date(record.checkIn)) / (1000 * 60 * 60);
                    groups[uId].totalHoursToday += Math.max(0, elapsed);
                }
            }
        });
        return Object.values(groups);
    };

    if (user.role === 'Client') {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-400">
                <p>Access Denied. Content is for internal staff only.</p>
            </div>
        );
    }

    // Admin & HR Register View
    if (isManager) {
        const groupedData = getGroupedAttendance().filter(group => {
            const u = group.user || {};
            const name = (u.name || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            const role = (u.role || '').toLowerCase();
            const dept = (u.department || '').toLowerCase();
            const desig = (u.designation || '').toLowerCase();

            const matchesSearch = 
                name.includes(searchTerm.toLowerCase()) || 
                email.includes(searchTerm.toLowerCase()) ||
                role.includes(searchTerm.toLowerCase()) ||
                dept.includes(searchTerm.toLowerCase()) ||
                desig.includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            if (roleFilter === 'All') return true;
            if (roleFilter === 'HR') return role === 'hr' || dept.includes('hr');
            if (roleFilter === 'Sales') return role === 'sales' || dept.includes('sales');
            if (roleFilter === 'Employee') return role === 'employee' || (!role.includes('hr') && !role.includes('sales') && !dept.includes('hr') && !dept.includes('sales'));
            
            return true;
        });

        if (selectedUser) {
            const userHistory = attendance.filter(r => {
                const recUserId = r.userId?._id || r.userId;
                const selUserId = selectedUser?._id || selectedUser;
                return String(recUserId) === String(selUserId);
            });

            const filteredHistory = userHistory.filter(record => {
                if (selectedMonthFilter === '') return true;
                const recMonth = new Date(record.date).getMonth();
                return String(recMonth) === String(selectedMonthFilter);
            });

            const totalHoursFiltered = filteredHistory.reduce((sum, r) => {
                if (r.totalHours) {
                    return sum + parseFloat(r.totalHours);
                } else if (!r.checkOut && new Date(r.date).toDateString() === new Date().toDateString()) {
                    const elapsed = (Date.now() - new Date(r.checkIn)) / (1000 * 60 * 60);
                    return sum + Math.max(0, elapsed);
                }
                return sum;
            }, 0);

            const months = [
                { value: '0', label: 'January' },
                { value: '1', label: 'February' },
                { value: '2', label: 'March' },
                { value: '3', label: 'April' },
                { value: '4', label: 'May' },
                { value: '5', label: 'June' },
                { value: '6', label: 'July' },
                { value: '7', label: 'August' },
                { value: '8', label: 'September' },
                { value: '9', label: 'October' },
                { value: '10', label: 'November' },
                { value: '11', label: 'December' }
            ];

            return (
                <div className="bg-slate-50/50 min-h-screen pb-20 font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
                     style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                    <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 space-y-6">
                        <button 
                            onClick={() => { setSelectedUser(null); setSelectedMonthFilter(''); }}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-extrabold text-xs transition-colors border-none bg-transparent cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            Back to Attendance Register
                        </button>

                        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 overflow-hidden space-y-6 p-6 sm:p-8">
                            
                            {/* Executive Header Banner */}
                            <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-2xl font-black text-white border border-slate-700 shrink-0">
                                        {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{selectedUser.name || 'Unknown'}</h2>
                                            {((selectedUser?.role || '').toLowerCase() === 'hr' || (selectedUser?.department || '').toLowerCase().includes('hr')) ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                    HR
                                                </span>
                                            ) : ((selectedUser?.role || '').toLowerCase() === 'sales' || (selectedUser?.department || '').toLowerCase().includes('sales')) ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                    Sales
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                    {selectedUser?.role || 'Employee'}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-medium text-slate-400">
                                            {selectedUser.email} {selectedUser.department ? `• ${selectedUser.department}` : ''} {selectedUser.designation ? `(${selectedUser.designation})` : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Bar & Filter */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 pb-4 border-b border-slate-100">
                                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center gap-4 shrink-0">
                                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">Total Worked Duration</p>
                                        <p className="text-lg font-black text-slate-900">{totalHoursFiltered.toFixed(1)} hrs</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-auto">
                                    <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Filter Month:</label>
                                    <select 
                                        value={selectedMonthFilter} 
                                        onChange={(e) => setSelectedMonthFilter(e.target.value)}
                                        className="px-3.5 py-2 rounded-xl border border-slate-200 outline-none focus:border-slate-900 bg-slate-50 font-bold text-slate-900 text-xs cursor-pointer"
                                    >
                                        <option value="">All Months</option>
                                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Detailed Log History Table */}
                            <div>
                                <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                                    <Clock size={16} className="text-slate-500" />
                                    Detailed Log Session History
                                </h3>
                                
                                <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
                                            <tr>
                                                <th className="p-4 pl-6">Date</th>
                                                <th className="p-4">Login Time</th>
                                                <th className="p-4">Logout Time</th>
                                                <th className="p-4">Duration</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 pr-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredHistory.map((record) => (
                                                <tr key={record._id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-4 pl-6 font-bold text-slate-900">
                                                        {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </td>
                                                    <td className="p-4 font-medium text-slate-700">
                                                        {new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                    </td>
                                                    <td className="p-4 font-medium text-slate-700">
                                                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                                                    </td>
                                                    <td className="p-4">
                                                        {record.totalHours ? (
                                                            <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg text-xs border border-slate-200">
                                                                {record.totalHours} hrs
                                                            </span>
                                                        ) : new Date(record.date).toDateString() === new Date().toDateString() ? (
                                                            <ActiveTimer checkIn={record.checkIn} />
                                                        ) : (
                                                            <span className="text-rose-700 font-extrabold text-xs bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">Missed Checkout</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        {!record.checkOut ? (
                                                            new Date(record.date).toDateString() === new Date().toDateString() ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                    Active
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
                                                                    Auto Closed
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                                                Completed
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 pr-6 text-right">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteSession(record._id);
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                                                            title="Delete session record"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredHistory.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="p-10 text-center text-slate-400 font-bold text-xs">
                                                        No attendance records found for this period.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-slate-50 min-h-screen pb-20 font-sans">
                <ApplyLeaveModal 
                    isOpen={isLeaveModalOpen} 
                    onClose={() => setIsLeaveModalOpen(false)}
                    onSuccess={() => {
                        fetchLeaves();
                        fetchAttendance();
                    }}
                />

                <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
                     style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Attendance & Time Off</h1>
                            <p className="text-slate-500 mt-0.5 text-xs sm:text-sm font-medium">Grouped employee monitoring, session history, and leave approvals.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            {user?.role !== 'Admin' && (
                                <button 
                                    onClick={() => setIsLeaveModalOpen(true)}
                                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-2 border-none cursor-pointer"
                                >
                                    <Plus size={16} /> Request Leave / PTO
                                </button>
                            )}
                            <div className="text-right pl-4 border-l border-slate-200">
                                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Today's Overview</p>
                                <p className="text-xs sm:text-sm font-extrabold text-slate-900">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>

                    {/* Manager Tab Bar */}
                    <div className="flex border border-slate-200/80 mb-8 bg-slate-100 p-1.5 rounded-2xl shadow-2xs w-fit">
                        <button 
                            onClick={() => setActiveTab('attendance')}
                            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
                                activeTab === 'attendance' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-transparent'
                            }`}
                        >
                            Attendance Register
                        </button>
                        <button 
                            onClick={() => setActiveTab('leaves')}
                            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-2 ${
                                activeTab === 'leaves' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-transparent'
                            }`}
                        >
                            <span>Leave Approvals</span>
                            {leaves.filter(l => l.status === 'Pending').length > 0 && (
                                <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-extrabold">
                                    {leaves.filter(l => l.status === 'Pending').length}
                                </span>
                            )}
                        </button>
                    </div>
                    {/* LEAVE APPROVALS TAB */}
                    {activeTab === 'leaves' ? (
                        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Workforce Leave Requests</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">Review and approve or reject employee leave applications.</p>
                                </div>
                                <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200/80">
                                    {leaves.length} Total Requests
                                </span>
                            </div>

                            {leaves.length > 0 ? (
                                <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-100/70 border-b border-slate-200/80">
                                            <tr>
                                                <th className="p-4 pl-6 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Employee</th>
                                                <th className="p-4 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Leave Type</th>
                                                <th className="p-4 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Duration</th>
                                                <th className="p-4 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Reason</th>
                                                <th className="p-4 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Status</th>
                                                <th className="p-4 text-right pr-6 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs">
                                            {leaves.map((leave) => {
                                                const empName = typeof leave.userId === 'object' ? leave.userId?.name : 'Staff Member';
                                                const empEmail = typeof leave.userId === 'object' ? leave.userId?.email : '';
                                                const empRole = typeof leave.userId === 'object' ? leave.userId?.role : '';
                                                const isHrApplicant = empRole === 'HR' || (typeof leave.userId === 'object' && (leave.userId?.department || '').toLowerCase().includes('hr'));
                                                const isCurrentUserHrNotAdmin = user?.role === 'HR' && user?.role !== 'Admin';

                                                const todayDate = new Date();
                                                todayDate.setHours(0, 0, 0, 0);
                                                const leaveEndDate = new Date(leave.endDate || leave.startDate);
                                                leaveEndDate.setHours(23, 59, 59, 999);
                                                const isLeaveExpired = leaveEndDate < todayDate;

                                                return (
                                                    <tr key={leave._id} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="p-4 pl-6 font-medium text-slate-900">
                                                            <div className="flex items-center gap-2">
                                                                <span>{empName}</span>
                                                                {isHrApplicant && (
                                                                    <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase">HR</span>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-normal">{empEmail}</div>
                                                        </td>
                                                        <td className="p-4 font-semibold text-slate-700">
                                                            {leave.leaveType}
                                                        </td>
                                                        <td className="p-4 text-slate-600 text-[11px]">
                                                            {leave.durationType === 'Half Day' ? (
                                                                <span className="inline-block text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                                                                    Half Day • {leave.halfDaySession} ({new Date(leave.startDate).toLocaleDateString()})
                                                                </span>
                                                            ) : leave.durationType === 'Short Leave' ? (
                                                                <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                                                                    Permission • {leave.shortLeaveHours} ({new Date(leave.startDate).toLocaleDateString()})
                                                                </span>
                                                            ) : (
                                                                <span className="font-mono font-semibold text-slate-700">
                                                                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-slate-600 max-w-xs truncate">
                                                            {leave.reason}
                                                        </td>
                                                        <td className="p-4">
                                                            {leave.status === 'Approved' ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    Approved
                                                                </span>
                                                            ) : leave.status === 'Rejected' ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                                    Rejected
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-right pr-6">
                                                            {isLeaveExpired ? (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200/80">
                                                                        Expired
                                                                    </span>
                                                                    <button 
                                                                        onClick={() => handleDeleteLeave(leave._id)}
                                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                                                                        title="Delete leave request"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            ) : isHrApplicant && isCurrentUserHrNotAdmin ? (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                                                                        <Lock size={12} /> Admin Approval Required
                                                                    </span>
                                                                    <button 
                                                                        onClick={() => handleDeleteLeave(leave._id)}
                                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                                                                        title="Delete leave request"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    {leave.status !== 'Approved' && (
                                                                        <button 
                                                                            onClick={() => handleUpdateLeaveStatus(leave._id, 'Approved')}
                                                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors border-none cursor-pointer flex items-center gap-1 shadow-sm"
                                                                            title={leave.status === 'Rejected' ? 'Re-Approve Leave' : 'Approve Leave'}
                                                                        >
                                                                            <Check size={14} /> {leave.status === 'Rejected' ? 'Re-Approve' : 'Approve'}
                                                                        </button>
                                                                    )}
                                                                    {leave.status !== 'Rejected' && (
                                                                        <button 
                                                                            onClick={() => handleUpdateLeaveStatus(leave._id, 'Rejected')}
                                                                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors border-none cursor-pointer flex items-center gap-1 shadow-sm"
                                                                            title={leave.status === 'Approved' ? 'Change to Rejected' : 'Reject Leave'}
                                                                        >
                                                                            <X size={14} /> {leave.status === 'Approved' ? 'Reject' : 'Reject'}
                                                                        </button>
                                                                    )}
                                                                    <button 
                                                                        onClick={() => handleDeleteLeave(leave._id)}
                                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                                                                        title="Delete leave request"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-16 text-center text-slate-400 text-xs font-medium">
                                    No leave requests submitted yet.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                    <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                                        <Users size={28} />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Currently Online</p>
                                        <p className="text-3xl font-black text-slate-800 mt-1">{stats.online}</p>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                    <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                        <CheckCircle size={28} />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Total Present</p>
                                        <p className="text-3xl font-black text-slate-800 mt-1">{stats.present}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    <div className="relative w-full md:w-72">
                                        <input 
                                            type="text"
                                            placeholder="Search name, role, dept..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-xs font-medium transition-all"
                                        />
                                        <svg className="absolute left-3 top-3 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                    </div>

                                    {/* Role Filter Pills */}
                                    <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                                        {['All', 'HR', 'Sales', 'Employee'].map((role) => (
                                            <button
                                                key={role}
                                                onClick={() => setRoleFilter(role)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all border-none cursor-pointer ${
                                                    roleFilter === role 
                                                        ? 'bg-slate-900 text-white shadow-sm' 
                                                        : 'text-slate-500 hover:text-slate-900 bg-transparent'
                                                }`}
                                            >
                                                {role === 'All' ? 'All Roles' : role}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    onClick={async () => {
                                        setLoading(true);
                                        await fetchAttendance();
                                    }}
                                    className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                                >
                                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                                    Refresh Live Data
                                </button>
                            </div>

                            {/* Employee Grid/Table */}
                            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-100">
                                            <tr>
                                                <th className="p-6 pl-10">Employee Details</th>
                                                <th className="p-6">Current Status</th>
                                                <th className="p-6">Last Login</th>
                                                <th className="p-6">Today's Work</th>
                                                <th className="p-6 text-right pr-10">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {groupedData.map((group) => {
                                                const { user: empUser, latestSession, totalHoursToday } = group;
                                                const isLatestToday = latestSession && new Date(latestSession.date).toDateString() === new Date().toDateString();
                                                const isOnline = !latestSession.checkOut && isLatestToday;
                                                
                                                return (
                                                    <tr key={empUser?._id} className="hover:bg-amber-50/30 transition-colors group cursor-pointer" onClick={() => setSelectedUser(empUser)}>
                                                        <td className="p-6 pl-10">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm ${
                                                                    isOnline ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-slate-300'
                                                                }`}>
                                                                    {empUser?.name?.charAt(0) || '?'}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-black text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                                                                            {empUser?.name || 'Unknown User'}
                                                                        </p>

                                                                        {/* Role Badges */}
                                                                        {((empUser?.role || '').toLowerCase() === 'hr' || (empUser?.department || '').toLowerCase().includes('hr')) ? (
                                                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-100 text-purple-700 border border-purple-200">
                                                                                HR
                                                                            </span>
                                                                        ) : ((empUser?.role || '').toLowerCase() === 'sales' || (empUser?.department || '').toLowerCase().includes('sales')) ? (
                                                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-blue-100 text-blue-700 border border-blue-200">
                                                                                Sales
                                                                            </span>
                                                                        ) : (empUser?.role || '').toLowerCase() === 'admin' ? (
                                                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                                                                                Admin
                                                                            </span>
                                                                        ) : (
                                                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                                                {empUser?.role || 'Employee'}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium tracking-tight mt-0.5">
                                                                        <span>{empUser?.email}</span>
                                                                        {empUser?.department && (
                                                                            <>
                                                                                <span className="text-slate-300">•</span>
                                                                                <span className="font-bold text-slate-600">{empUser.department}</span>
                                                                            </>
                                                                        )}
                                                                        {empUser?.designation && (
                                                                            <>
                                                                                <span className="text-slate-300">•</span>
                                                                                <span className="text-slate-400 italic">{empUser.designation}</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            {isOnline ? (
                                                                <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-black border border-emerald-100 shadow-sm shadow-emerald-100/50">
                                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                    ONLINE
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-black border border-slate-200">
                                                                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                                                                    OFFLINE
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-6">
                                                            <p className="font-mono text-sm text-slate-700 font-bold">
                                                                {new Date(latestSession.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Logged In</p>
                                                        </td>
                                                        <td className="p-6">
                                                            <p className="text-lg font-black text-slate-800">
                                                                {totalHoursToday.toFixed(1)} <span className="text-xs font-bold text-slate-400 uppercase">hrs</span>
                                                            </p>
                                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-400'}`} 
                                                                    style={{ width: `${Math.min((totalHoursToday/8)*100, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                        </td>
                                                        <td className="p-6 text-right pr-10">
                                                            <button className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                                                View History
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {groupedData.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="p-20 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                                <Users className="text-slate-300" size={32} />
                                                            </div>
                                                            <p className="text-slate-400 font-bold">No attendance records found matching your search.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal for Manager View */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                       <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-center shadow-2xl border border-slate-200/80">
                            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                                <Trash2 size={24} />
                            </div>
                            <h2 className="text-lg font-extrabold text-slate-900 mb-1">
                                {showDeleteConfirm.type === 'leave' ? 'Delete Leave Request?' : 'Delete Attendance Session?'}
                            </h2>
                            <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">
                                Are you sure you want to delete this record? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                                <button className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors cursor-pointer" onClick={confirmDeleteAction}>Delete</button>
                            </div>
                       </div>
                    </div>
                )}
            </div>
        );
    }

    // --- Employee View (PTO & Leave Focus • No Attendance History) ---
    const todayStr = new Date().toDateString();
    const todayRecord = attendance.find(r => new Date(r.date).toDateString() === todayStr);

    const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;
    const approvedLeavesCount = leaves.filter(l => l.status === 'Approved').length;

    return (
        <div className="bg-slate-50/50 min-h-screen flex flex-col font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
             style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            <ApplyLeaveModal 
                isOpen={isLeaveModalOpen} 
                onClose={() => setIsLeaveModalOpen(false)}
                onSuccess={() => {
                    fetchLeaves();
                    fetchAttendance();
                }}
            />

            {/* Header Navigation Bar */}
            <div className="bg-white border-b border-slate-200/80 px-6 sm:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-0.5">
                        <span className="text-slate-900 font-bold">Velora</span>
                        <span>/</span>
                        <span>Employee Portal</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                        My Leave & Time Off
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {user?.role !== 'Admin' && (
                        <button 
                            onClick={() => setIsLeaveModalOpen(true)}
                            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 border-none cursor-pointer"
                        >
                            <Plus size={16} /> Request Leave / PTO
                        </button>
                    )}
                    <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2">
                        <Clock size={14} className="text-slate-500" />
                        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Workspace */}
            <div className="flex-1 p-6 sm:p-8 max-w-6xl w-full mx-auto space-y-6">

                {/* COMPACT EXECUTIVE SESSION & PTO SUMMARY BAR (NO TEXT OVERFLOW) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 gap-4 md:gap-0">
                    
                    {/* Active Status */}
                    <div className="md:pr-6 flex items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Current Status</span>
                                {todayRecord && !todayRecord.checkOut ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                        Offline
                                    </span>
                                )}
                            </div>
                            <p className="text-sm font-bold text-slate-900">
                                {!todayRecord ? "Not Checked In Today" : 
                                 !todayRecord.checkOut ? `Online since ${new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}` : "Session Concluded"}
                            </p>
                        </div>
                        {todayRecord && !todayRecord.checkOut && (
                            <div className="shrink-0">
                                <ActiveTimer checkIn={todayRecord.checkIn} />
                            </div>
                        )}
                    </div>

                    {/* PTO Applications Summary */}
                    <div className="pt-4 md:pt-0 md:pl-6 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Leave Applications Summary</p>
                            <p className="text-sm font-bold text-slate-900">
                                {leaves.length} Total Requests <span className="text-slate-400 font-normal">({approvedLeavesCount} Approved)</span>
                            </p>
                        </div>
                        {pendingLeavesCount > 0 ? (
                            <span className="text-xs font-extrabold px-3 py-1 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 shrink-0">
                                {pendingLeavesCount} Pending Review
                            </span>
                        ) : (
                            <span className="text-xs font-extrabold px-3 py-1 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 shrink-0">
                                All Reviewed
                            </span>
                        )}
                    </div>
                </div>

                {/* MY LEAVE APPLICATIONS TABLE (PRIMARY CONTENT FOR EMPLOYEES) */}
                <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h3 className="font-extrabold text-slate-900 text-sm">My Leave Requests & Time Off</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Submitted PTO applications, permissions, and approval statuses.</p>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 bg-white text-slate-700 rounded-xl border border-slate-200/80 shadow-2xs">
                            {leaves.length} Applications
                        </span>
                    </div>

                    {leaves.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="bg-slate-50/80 border-b border-slate-100">
                                    <tr>
                                        <th className="p-4 pl-6 font-extrabold text-slate-500 uppercase tracking-wider text-[11px]">Leave Type</th>
                                        <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px]">Duration</th>
                                        <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px]">Reason</th>
                                        <th className="p-4 font-extrabold text-slate-500 uppercase tracking-wider text-[11px]">Status</th>
                                        <th className="p-4 pr-6 text-right font-extrabold text-slate-500 uppercase tracking-wider text-[11px]">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {leaves.map((leave) => (
                                        <tr key={leave._id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4 pl-6 font-bold text-slate-900">{leave.leaveType}</td>
                                            <td className="p-4 font-medium text-slate-700">
                                                {leave.durationType === 'Half Day' ? (
                                                    <span className="text-indigo-700 font-bold">Half Day • {leave.halfDaySession} ({new Date(leave.startDate).toLocaleDateString()})</span>
                                                ) : leave.durationType === 'Short Leave' ? (
                                                    <span className="text-emerald-700 font-bold">Permission • {leave.shortLeaveHours} ({new Date(leave.startDate).toLocaleDateString()})</span>
                                                ) : (
                                                    <span>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-slate-600 font-medium max-w-xs truncate">{leave.reason}</td>
                                            <td className="p-4">
                                                {leave.status === 'Approved' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                        Approved
                                                    </span>
                                                ) : leave.status === 'Rejected' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
                                                        Rejected
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <button 
                                                    onClick={() => handleDeleteLeave(leave._id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                                                    title="Delete application"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-400 font-bold text-xs">
                            No leave requests submitted yet. Click "Request Leave / PTO" to apply.
                        </div>
                    )}
                </div>

            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                   <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-center shadow-2xl border border-slate-200/80">
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                            <Trash2 size={24} />
                        </div>
                        <h2 className="text-lg font-extrabold text-slate-900 mb-1">
                            {showDeleteConfirm.type === 'leave' ? 'Delete Leave Request?' : 'Delete Attendance Session?'}
                        </h2>
                        <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">
                            Are you sure you want to delete this record? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border-none" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                            <button className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors cursor-pointer border-none" onClick={confirmDeleteAction}>Delete</button>
                        </div>
                   </div>
                </div>
            )}
        </div>
    );
};

export default Attendance;

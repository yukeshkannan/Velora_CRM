import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    Clock, CheckCircle2, Ticket, Calendar as CalendarIcon, 
    ArrowRight, ChevronRight, Target, Plus,
    ArrowUpRight, ShieldCheck, FileText, Check, AlertCircle,
    UserCheck, Clock3, HeartHandshake, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [stats, setStats] = useState({
        pendingTasks: 0,
        activeTickets: 0,
        attendanceDays: 0,
        leaveCount: 0,
        pendingLeaves: 0,
        payrollStatus: 'Active'
    });
    
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [myTasks, setMyTasks] = useState([]);
    const [myTickets, setMyTickets] = useState([]);
    const [myLeaves, setMyLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const userId = user?.id || user?._id;
                if (!userId) return;

                const [tasksRes, oppsRes, ticketsRes, attendanceRes, leaveRes, payrollRes] = await Promise.all([
                    axios.get(`/api/tasks?assignedTo=${userId}`).catch(() => ({ data: { data: [] } })),
                    axios.get(`/api/opportunities?assignedTo=${userId}`).catch(() => ({ data: { data: [] } })),
                    axios.get(`/api/tickets`).catch(() => ({ data: { data: [] } })),
                    axios.get(`/api/attendance`).catch(() => ({ data: { data: [] } })),
                    axios.get(`/api/leave?userId=${userId}`).catch(() => ({ data: { data: [] } })),
                    axios.get(`/api/payroll`).catch(() => ({ data: { data: [] } }))
                ]);

                const tasksData = tasksRes.data.data || [];
                const oppsData = oppsRes.data.data || [];
                const ticketsData = ticketsRes.data.data || [];
                const attendanceData = attendanceRes.data.data || [];
                const leaveData = leaveRes.data.data || [];
                const payrollData = payrollRes.data.data || [];

                // Map assigned Opportunities into Project Tasks
                const projectTasks = oppsData.map(opp => ({
                    _id: opp._id,
                    title: `Project: ${opp.title}`,
                    type: 'Project',
                    priority: 'High',
                    status: opp.employeeTaskStatus || (opp.stage === 'Won' ? 'Completed' : 'Pending'),
                    dueDate: opp.expectedCloseDate,
                    assignedTo: opp.assignedTo,
                    isOpportunity: true
                }));

                const allAssignedTasks = [...tasksData, ...projectTasks];
                const userPendingTasks = allAssignedTasks.filter(t => t.status !== 'Completed');

                // Filter tickets raised by or assigned to logged-in user
                const userTickets = ticketsData.filter(t => {
                    const raisedId = typeof t.raisedBy === 'object' ? t.raisedBy?._id : t.raisedBy;
                    const assignedId = typeof t.assignedTo === 'object' ? t.assignedTo?._id : t.assignedTo;
                    return String(raisedId) === String(userId) || String(assignedId) === String(userId);
                });
                const openTickets = userTickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed' && t.status !== 'Rejected');

                // Attendance processing
                const todayStr = new Date().toDateString();
                const myAttendanceRecords = attendanceData.filter(record => {
                    const recordUserId = typeof record.userId === 'object' ? record.userId?._id : record.userId;
                    return String(recordUserId) === String(userId);
                });

                const todayRecord = myAttendanceRecords.find(r => new Date(r.date).toDateString() === todayStr);

                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const uniqueMonthlyDays = new Set(
                    myAttendanceRecords
                        .filter(record => {
                            const d = new Date(record.date);
                            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                        })
                        .map(record => new Date(record.date).toDateString())
                );
                const monthlyAttendanceDays = uniqueMonthlyDays.size;

                // Leave processing
                const userLeaves = leaveData.filter(l => {
                    const lUserId = typeof l.userId === 'object' ? l.userId?._id : l.userId;
                    return String(lUserId) === String(userId);
                });
                const pendingLeavesCount = userLeaves.filter(l => l.status === 'Pending').length;

                // Payroll processing
                const myPayroll = payrollData.filter(p => {
                    const pUserId = typeof p.userId === 'object' ? p.userId?._id : p.userId;
                    return String(pUserId) === String(userId);
                });
                const latestPayrollStatus = myPayroll.length > 0 ? (myPayroll[0].status || 'Processed') : 'Active';

                setStats({
                    pendingTasks: userPendingTasks.length,
                    activeTickets: openTickets.length,
                    attendanceDays: monthlyAttendanceDays,
                    leaveCount: userLeaves.length,
                    pendingLeaves: pendingLeavesCount,
                    payrollStatus: latestPayrollStatus
                });

                setTodayAttendance(todayRecord || null);
                setMyTasks(userPendingTasks.slice(0, 5));
                setMyTickets(userTickets.slice(0, 5));
                setMyLeaves(userLeaves.slice(0, 5));
                setLoading(false);
            } catch (err) {
                console.error("Error fetching employee dashboard metrics:", err);
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    if (loading) return <LoadingSpinner message="Loading Employee Dashboard..." />;

    const todayDeadlineTasks = myTasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate).toDateString() === new Date().toDateString();
    });

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50 font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
             style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* Top Navigation Header */}
            <div className="bg-white border-b border-slate-200/80 px-6 sm:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-0.5">
                        <span className="text-slate-900 font-extrabold">Velora</span>
                        <span>/</span>
                        <span>Employee Portal</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                        Welcome back, {user?.name || 'Employee'}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/app/attendance')}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 border-none cursor-pointer"
                    >
                        <Clock size={15} /> My Attendance
                    </button>
                    <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2">
                        <CalendarIcon size={14} className="text-slate-500" />
                        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
                
                {/* DYNAMIC METRIC OVERVIEW CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Card 1: Pending Tasks */}
                    <div 
                        onClick={() => navigate('/app/tasks')}
                        className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Assigned Tasks</span>
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-200">
                                <Target size={18} />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.pendingTasks}</div>
                            <p className="text-[11px] text-slate-400 font-medium mt-1">Pending action items</p>
                        </div>
                    </div>

                    {/* Card 2: Attendance */}
                    <div 
                        onClick={() => navigate('/app/attendance')}
                        className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">This Month</span>
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-200">
                                <Clock size={18} />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 tracking-tight">
                                {stats.attendanceDays} {stats.attendanceDays === 1 ? 'Day' : 'Days'}
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium mt-1">Logged attendance sessions</p>
                        </div>
                    </div>

                    {/* Card 3: Leave Applications */}
                    <div 
                        onClick={() => navigate('/app/attendance')}
                        className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Leave / PTO</span>
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-200">
                                <FileText size={18} />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.leaveCount} Total</div>
                            <p className="text-[11px] text-slate-400 font-medium mt-1">
                                {stats.pendingLeaves > 0 ? `${stats.pendingLeaves} pending review` : 'All requests reviewed'}
                            </p>
                        </div>
                    </div>

                    {/* Card 4: Support Tickets */}
                    <div 
                        onClick={() => navigate('/app/tickets')}
                        className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Help & Tickets</span>
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center border border-slate-200">
                                <Ticket size={18} />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.activeTickets} Active</div>
                            <p className="text-[11px] text-slate-400 font-medium mt-1">Open support requests</p>
                        </div>
                    </div>

                </div>

                {/* MAIN 2-COLUMN LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* LEFT COLUMN (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* Assigned Tasks Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-900">My Action Items & Assigned Tasks</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">Tasks requiring your attention.</p>
                                </div>
                                <button 
                                    onClick={() => navigate('/app/tasks')}
                                    className="text-xs font-extrabold text-slate-900 hover:text-indigo-600 flex items-center gap-1 cursor-pointer border-none bg-transparent"
                                >
                                    View All Tasks <ArrowUpRight size={14} />
                                </button>
                            </div>

                            {myTasks.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {myTasks.map((task) => (
                                        <div 
                                            key={task._id} 
                                            onClick={() => navigate('/app/tasks')}
                                            className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between text-xs"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${task.priority === 'High' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                                <div>
                                                    <p className="font-extrabold text-slate-900">{task.title}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'} • {task.priority || 'Normal'} Priority
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                                {task.status || 'Pending'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 text-center">
                                    <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                                    <p className="text-xs font-bold text-slate-700">No pending tasks assigned to you!</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Leave Requests Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-900">My Leave Applications</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">Recent PTO requests and manager approval statuses.</p>
                                </div>
                                <button 
                                    onClick={() => navigate('/app/attendance')}
                                    className="text-xs font-extrabold text-slate-900 hover:text-indigo-600 flex items-center gap-1 cursor-pointer border-none bg-transparent"
                                >
                                    Request PTO <Plus size={14} />
                                </button>
                            </div>

                            {myLeaves.length > 0 ? (
                                <div className="divide-y divide-slate-100 text-xs">
                                    {myLeaves.map((leave) => (
                                        <div key={leave._id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                                            <div>
                                                <p className="font-extrabold text-slate-900">{leave.leaveType}</p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()} ({leave.durationType})
                                                </p>
                                            </div>
                                            <div>
                                                {leave.status === 'Approved' ? (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        Approved
                                                    </span>
                                                ) : leave.status === 'Rejected' ? (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
                                                        Rejected
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200">
                                                        Pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 text-center text-xs font-bold text-slate-400">
                                    No leave requests submitted yet.
                                </div>
                            )}
                        </div>

                    </div>

                    {/* RIGHT COLUMN (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Today's Schedule */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
                            <h3 className="text-sm font-extrabold text-slate-900 mb-4 pb-3 border-b border-slate-100">Today's Deadlines</h3>
                            <div className="space-y-3 border-l-2 border-slate-200 ml-2 pl-4">
                                {todayDeadlineTasks.length > 0 ? (
                                    todayDeadlineTasks.map((task, idx) => (
                                        <div key={idx} className="relative">
                                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />
                                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Due Today</p>
                                            <p className="text-xs font-extrabold text-slate-900 mt-0.5">{task.title}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Schedule Clear</p>
                                        <p className="text-xs font-bold text-slate-600 mt-0.5">No tasks due today.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Employee Portal Shortcuts */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Quick Navigation</span>
                            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                                <button 
                                    onClick={() => navigate('/app/tasks')} 
                                    className="p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-left flex items-center gap-2 cursor-pointer bg-white"
                                >
                                    <Target size={15} className="text-slate-500" /> Tasks
                                </button>
                                <button 
                                    onClick={() => navigate('/app/attendance')} 
                                    className="p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-left flex items-center gap-2 cursor-pointer bg-white"
                                >
                                    <Clock size={15} className="text-slate-500" /> Attendance
                                </button>
                                <button 
                                    onClick={() => navigate('/app/calendar')} 
                                    className="p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-left flex items-center gap-2 cursor-pointer bg-white"
                                >
                                    <CalendarIcon size={15} className="text-slate-500" /> Calendar
                                </button>
                                <button 
                                    onClick={() => navigate('/app/tickets')} 
                                    className="p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-left flex items-center gap-2 cursor-pointer bg-white"
                                >
                                    <Ticket size={15} className="text-slate-500" /> Support
                                </button>
                            </div>
                        </div>

                        {/* Support & Assistance */}
                        <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-xl space-y-3">
                            <div className="flex items-center gap-2 text-[11px] font-black text-emerald-400 uppercase tracking-widest">
                                <ShieldCheck size={16} /> HR & Helpdesk
                            </div>
                            <p className="text-xs text-slate-300 font-medium leading-relaxed">Have questions regarding attendance, payroll, or IT support?</p>
                            <button 
                                onClick={() => navigate('/app/tickets')}
                                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                            >
                                Raise Support Ticket
                            </button>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
};

export default EmployeeDashboard;

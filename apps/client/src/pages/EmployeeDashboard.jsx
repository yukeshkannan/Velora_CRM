import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    Clock, CheckCircle2, Ticket, Calendar as CalendarIcon, 
    ArrowRight, Briefcase, ChevronRight, Zap, Target,
    DollarSign, Users, TrendingUp, ListTodo, Plus,
    ArrowUpRight, ShieldCheck, Layers, Package, Search, Filter,
    UserCheck, UserPlus, FileText
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
        payrollStatus: 'Pending',
        activeDeals: 0,
        pipelineValue: '$0',
        totalContacts: 0,
        totalEmployees: 0,
        todayPresent: 0,
        monthlyPayrollCount: 0
    });
    const [myTasks, setMyTasks] = useState([]);
    const [deals, setDeals] = useState([]);
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [stageCounts, setStageCounts] = useState({
        New: 0,
        'In Execution': 0,
        Review: 0,
        Completed: 0
    });
    const [loading, setLoading] = useState(true);

    const isSales = user?.role === 'Sales' || (user?.department || '').toLowerCase().includes('sales');
    const isHR = user?.role === 'HR' || (user?.department || '').toLowerCase().includes('hr') || (user?.department || '').toLowerCase().includes('human');

    useEffect(() => {
        const fetchEmployeeData = async () => {
            try {
                const userId = user?.id || user?._id;
                const [tasksRes, ticketsRes, attendanceRes, oppRes, contactsRes, payrollRes, usersRes] = await Promise.all([
                    axios.get(`/api/tasks?assignedTo=${userId}`).catch(() => ({ data: { data: [] } })),
                    axios.get(`/api/tickets?assignedTo=${userId}`).catch(() => ({ data: { data: [] } })),
                    axios.get(`/api/attendance`).catch(() => ({ data: { data: [] } })),
                    axios.get(`/api/opportunities`).catch(() => ({ data: { data: [] } })),
                    axios.get(`/api/contacts`).catch(() => ({ data: { data: [] } })),
                    axios.get(`/api/payroll`).catch(() => ({ data: { data: [] } })),
                    axios.get(`/api/auth/users`).catch(() => ({ data: { data: [] } }))
                ]);

                const tasksData = tasksRes.data.data || [];
                const ticketsData = ticketsRes.data.data || [];
                const attendanceData = attendanceRes.data.data || [];
                const oppData = oppRes.data.data || [];
                const contactsData = contactsRes.data.data || [];
                const payrollData = payrollRes.data.data || [];
                const usersData = usersRes.data.data || [];

                let regularTasks = tasksData.filter(t => t.status !== 'Completed');

                const userOpps = oppData.filter(opp => !opp.assignedTo || opp.assignedTo._id === userId || opp.assignedTo === userId);
                const projectTasks = userOpps.map(opp => ({
                    _id: opp._id,
                    title: `Deal: ${opp.title}`,
                    priority: 'High',
                    status: opp.employeeTaskStatus || (opp.stage === 'Won' ? 'Completed' : 'In Progress'),
                    dueDate: opp.expectedCloseDate,
                    isProject: true
                })).filter(t => t.status !== 'Completed');

                const allActionItems = [...regularTasks, ...projectTasks].sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });

                const myTicketsData = ticketsData.filter(t => t.status !== 'Resolved' && t.status !== 'Rejected');

                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const todayStr = new Date().toLocaleDateString();

                const myAttendanceRecords = attendanceData.filter(record => {
                    const recordUserId = typeof record.userId === 'object' ? record.userId?._id : record.userId;
                    return String(recordUserId) === String(userId);
                });
                const monthlyAttendanceDays = myAttendanceRecords.filter(record => {
                    const recordDate = new Date(record.date);
                    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
                }).length;

                // Filter out Admin and Client roles for HR employee stats
                const staffUsers = usersData.filter(u => u.role !== 'Client' && u.role !== 'Admin');

                // Today Present Count for HR (Unique staff present today, excluding Admin & Client)
                const todayPresentSet = new Set(
                    attendanceData
                        .filter(record => {
                            const isToday = new Date(record.date).toLocaleDateString() === todayStr;
                            const userRole = typeof record.userId === 'object' ? record.userId?.role : '';
                            return isToday && userRole !== 'Admin' && userRole !== 'Client';
                        })
                        .map(record => {
                            const uId = typeof record.userId === 'object' ? record.userId?._id : record.userId;
                            return String(uId || '');
                        })
                        .filter(Boolean)
                );
                const todayPresentCount = todayPresentSet.size;

                // Payroll count for HR
                const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });
                const monthlyPayrollRecords = payrollData.filter(p => p.month === currentMonthName && Number(p.year) === currentYear);
                
                let dynamicPayrollStatus = 'Pending';
                if (monthlyPayrollRecords.length > 0) {
                    dynamicPayrollStatus = monthlyPayrollRecords[0].status || 'Processed';
                } else if (payrollData.length > 0) {
                    dynamicPayrollStatus = payrollData[0].status || 'Processed';
                }

                const activeOpportunities = oppData.filter(opp => opp.stage !== 'Completed' && opp.stage !== 'Cancelled');
                const totalPipelineAmt = activeOpportunities.reduce((sum, opp) => sum + (Number(opp.amount) || 0), 0);

                const stages = {
                    New: oppData.filter(o => o.stage === 'New').length,
                    'In Execution': oppData.filter(o => o.stage === 'In Execution').length,
                    Review: oppData.filter(o => o.stage === 'Review').length,
                    Completed: oppData.filter(o => o.stage === 'Completed').length
                };
                setStageCounts(stages);

                setStats({
                    pendingTasks: allActionItems.length,
                    activeTickets: myTicketsData.length,
                    attendanceDays: monthlyAttendanceDays,
                    payrollStatus: dynamicPayrollStatus,
                    activeDeals: activeOpportunities.length,
                    pipelineValue: `$${Math.round(totalPipelineAmt).toLocaleString()}`,
                    totalContacts: contactsData.length,
                    totalEmployees: staffUsers.length,
                    todayPresent: todayPresentCount,
                    monthlyPayrollCount: monthlyPayrollRecords.length
                });
                
                setDeals(oppData);
                setMyTasks(allActionItems); 

                // Deduplicate recent staff attendance logs (excluding Admin & Client)
                const uniqueEmployeeLogsMap = new Map();
                attendanceData.forEach(record => {
                    const uId = typeof record.userId === 'object' ? record.userId?._id : record.userId;
                    const uRole = typeof record.userId === 'object' ? record.userId?.role : '';
                    if (!uId || uRole === 'Admin' || uRole === 'Client') return;
                    const key = String(uId);
                    if (!uniqueEmployeeLogsMap.has(key)) {
                        uniqueEmployeeLogsMap.set(key, record);
                    }
                });
                setAttendanceLogs(Array.from(uniqueEmployeeLogsMap.values()).slice(0, 5));
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch employee dashboard data", err);
                setLoading(false); 
            }
        };

        if (user) {
            fetchEmployeeData();
        }
    }, [user]);

    if (loading) return <LoadingSpinner message="Loading workspace..." />;

    const salesMetrics = [
        {
            title: 'Active Pipeline Deals',
            value: stats.activeDeals,
            caption: 'Open opportunities in progress',
            icon: Briefcase,
            path: '/app/sales'
        },
        {
            title: 'Pipeline Revenue',
            value: stats.pipelineValue,
            caption: 'Total projected opportunity value',
            icon: DollarSign,
            path: '/app/sales'
        },
        {
            title: 'Leads & Contacts',
            value: stats.totalContacts,
            caption: 'Managed client directory',
            icon: Users,
            path: '/app/contacts'
        },
        {
            title: 'Pending Action Items',
            value: stats.pendingTasks,
            caption: 'Tasks requiring completion',
            icon: Target,
            path: '/app/tasks'
        }
    ];

    const hrMetrics = [
        {
            title: 'Total Employees',
            value: stats.totalEmployees,
            caption: 'Active staff directory',
            icon: UserPlus,
            path: '/app/users'
        },
        {
            title: "Today's Attendance",
            value: `${stats.todayPresent} Logged`,
            caption: 'Employee check-ins today',
            icon: UserCheck,
            path: '/app/attendance'
        },
        {
            title: 'Monthly Payroll Runs',
            value: `${stats.monthlyPayrollCount} Generated`,
            caption: 'Disbursements this month',
            icon: FileText,
            path: '/app/payroll'
        },
        {
            title: 'HR Tasks',
            value: stats.pendingTasks,
            caption: 'Pending action items',
            icon: Target,
            path: '/app/tasks'
        }
    ];

    const generalMetrics = [
        { title: 'Pending Tasks', value: stats.pendingTasks, caption: 'Action items assigned', icon: Target, path: '/app/tasks' },
        { title: 'Active Tickets', value: stats.activeTickets, caption: 'Open support tickets', icon: Ticket, path: '/app/tickets' },
        { title: 'Monthly Attendance', value: `${stats.attendanceDays} Days`, caption: 'Logged this month', icon: Clock, path: '/app/attendance' },
        { title: 'Payroll Status', value: stats.payrollStatus, caption: 'Latest disbursement log', icon: Zap, path: '/app/payroll' },
    ];

    const getStageBadge = (stage) => {
        switch (stage) {
            case 'New': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">New Lead</span>;
            case 'In Execution': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">In Progress</span>;
            case 'Review': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200/60">In Review</span>;
            case 'Completed': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">Closed Won</span>;
            default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-600">Draft</span>;
        }
    };

    const activeMetricsList = isHR ? hrMetrics : (isSales ? salesMetrics : generalMetrics);
    const totalDealsCount = Object.values(stageCounts).reduce((a, b) => a + b, 0) || 1;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6 min-h-screen bg-[#F8FAFC] text-stone-900 font-sans">
            
            {/* TOP BAR & WORKSPACE HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-200/80 gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-stone-500 mb-1">
                        <span className="font-semibold text-stone-900">Velora CRM</span>
                        <span>/</span>
                        <span>{isHR ? 'Human Resources' : (isSales ? 'Sales Operations' : 'Workspace')}</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
                        {isHR ? 'HR & People Operations' : (isSales ? 'Sales Overview' : 'Employee Dashboard')}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {isHR ? (
                        <>
                            <button 
                                onClick={() => navigate('/app/payroll')}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
                            >
                                <Plus size={15} /> Run Payroll
                            </button>
                            <button 
                                onClick={() => navigate('/app/attendance')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium shadow-sm transition-colors"
                            >
                                <Clock size={15} /> Log Attendance
                            </button>
                        </>
                    ) : isSales ? (
                        <>
                            <button 
                                onClick={() => navigate('/app/sales')}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
                            >
                                <Plus size={15} /> New Deal
                            </button>
                            <button 
                                onClick={() => navigate('/app/contacts')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium shadow-sm transition-colors"
                            >
                                <Users size={15} /> Add Contact
                            </button>
                        </>
                    ) : null}

                    <div className="px-3 py-2 bg-white border border-stone-200 text-stone-600 rounded-lg text-xs font-medium flex items-center gap-2 shadow-sm">
                        <CalendarIcon size={14} className="text-stone-400" />
                        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            {/* METRICS OVERVIEW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeMetricsList.map((m, idx) => (
                    <div 
                        key={idx}
                        onClick={() => m.path && navigate(m.path)}
                        className="bg-white p-5 rounded-xl border border-stone-200/80 hover:border-stone-300 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-stone-500">{m.title}</span>
                            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center">
                                <m.icon size={16} />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-stone-900 tracking-tight">{m.value}</div>
                            <p className="text-[11px] text-stone-400 font-normal mt-1">{m.caption}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* PIPELINE PROGRESS SEGMENT BAR (SALES ONLY) */}
            {isSales && (
                <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layers size={16} className="text-stone-500" />
                            <h3 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">Pipeline Stage Breakdown</h3>
                        </div>
                        <button 
                            onClick={() => navigate('/app/sales')}
                            className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1"
                        >
                            Open Board <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden flex">
                        <div style={{ width: `${(stageCounts.New / totalDealsCount) * 100}%` }} className="bg-amber-400" title="New Leads" />
                        <div style={{ width: `${(stageCounts['In Execution'] / totalDealsCount) * 100}%` }} className="bg-blue-500" title="In Execution" />
                        <div style={{ width: `${(stageCounts.Review / totalDealsCount) * 100}%` }} className="bg-purple-500" title="Review" />
                        <div style={{ width: `${(stageCounts.Completed / totalDealsCount) * 100}%` }} className="bg-emerald-500" title="Closed Won" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <span className="text-xs text-stone-600 font-medium">New Leads ({stageCounts.New})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            <span className="text-xs text-stone-600 font-medium">In Execution ({stageCounts['In Execution']})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                            <span className="text-xs text-stone-600 font-medium">In Review ({stageCounts.Review})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-xs text-stone-600 font-medium">Closed Won ({stageCounts.Completed})</span>
                        </div>
                    </div>
                </div>
            )}

            {/* TWO COLUMN CONTENT SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT 2 COLUMNS */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* HR VIEW: Employee Attendance Logs Table */}
                    {isHR ? (
                        <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-stone-900">Recent Employee Attendance Logs</h3>
                                    <p className="text-xs text-stone-500 mt-0.5">Live check-ins and session records.</p>
                                </div>
                                <button 
                                    onClick={() => navigate('/app/attendance')}
                                    className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1"
                                >
                                    Full Register <ArrowUpRight size={14} />
                                </button>
                            </div>

                            {attendanceLogs.length > 0 ? (
                                <div className="divide-y divide-stone-100">
                                    <div className="grid grid-cols-12 px-5 py-2.5 bg-stone-50 text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                                        <div className="col-span-5">Employee / User</div>
                                        <div className="col-span-3">Status</div>
                                        <div className="col-span-2 text-right">Hours</div>
                                        <div className="col-span-2 text-right">Date</div>
                                    </div>
                                    {attendanceLogs.map((log) => {
                                        const empName = typeof log.userId === 'object' ? log.userId?.name : 'Employee Record';
                                        return (
                                            <div 
                                                key={log._id} 
                                                onClick={() => navigate('/app/attendance')}
                                                className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-stone-50/80 transition-colors cursor-pointer text-xs"
                                            >
                                                <div className="col-span-5 font-medium text-stone-900 truncate pr-2">
                                                    {empName || 'Staff Member'}
                                                </div>
                                                <div className="col-span-3">
                                                    {!log.checkOut ? (
                                                        new Date(log.date).toDateString() === new Date().toDateString() ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                Active Now
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                                                                Missed Checkout
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                                                            Checked Out
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="col-span-2 text-right font-mono font-medium text-stone-900">
                                                    {log.totalHours ? `${log.totalHours} hrs` : 'Active'}
                                                </div>
                                                <div className="col-span-2 text-right text-stone-500 text-[11px]">
                                                    {log.date ? new Date(log.date).toLocaleDateString() : 'Today'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <Clock className="mx-auto text-stone-300 mb-2" size={32} />
                                    <p className="text-xs font-medium text-stone-700">No attendance logs found</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* SALES & GENERAL VIEW: Active Deals Table */
                        <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-stone-900">Active Deals & Opportunities</h3>
                                    <p className="text-xs text-stone-500 mt-0.5">Live records in your sales pipeline.</p>
                                </div>
                                <button 
                                    onClick={() => navigate('/app/sales')}
                                    className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1"
                                >
                                    View All <ArrowUpRight size={14} />
                                </button>
                            </div>

                            {deals.length > 0 ? (
                                <div className="divide-y divide-stone-100">
                                    <div className="grid grid-cols-12 px-5 py-2.5 bg-stone-50 text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                                        <div className="col-span-5">Deal Name</div>
                                        <div className="col-span-3">Stage</div>
                                        <div className="col-span-2 text-right">Amount</div>
                                        <div className="col-span-2 text-right">Close Date</div>
                                    </div>
                                    {deals.slice(0, 5).map((deal) => (
                                        <div 
                                            key={deal._id} 
                                            onClick={() => navigate('/app/sales')}
                                            className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-stone-50/80 transition-colors cursor-pointer text-xs"
                                        >
                                            <div className="col-span-5 font-medium text-stone-900 truncate pr-2">
                                                {deal.title}
                                            </div>
                                            <div className="col-span-3">
                                                {getStageBadge(deal.stage)}
                                            </div>
                                            <div className="col-span-2 text-right font-mono font-medium text-stone-900">
                                                ${Number(deal.amount || 0).toLocaleString()}
                                            </div>
                                            <div className="col-span-2 text-right text-stone-500 text-[11px]">
                                                {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : '—'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <Briefcase className="mx-auto text-stone-300 mb-2" size={32} />
                                    <p className="text-xs font-medium text-stone-700">No active deals found</p>
                                    <p className="text-[11px] text-stone-400 mt-0.5">Start tracking by adding a new deal.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pending Tasks */}
                    <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                            <div>
                                <h3 className="text-sm font-semibold text-stone-900">{isHR ? 'HR Tasks & Action Items' : 'Assigned Tasks'}</h3>
                                <p className="text-xs text-stone-500 mt-0.5">Pending action items assigned to you.</p>
                            </div>
                            <button 
                                onClick={() => navigate('/app/tasks')}
                                className="text-xs font-medium text-stone-500 hover:text-stone-900"
                            >
                                Manage Tasks
                            </button>
                        </div>

                        {myTasks.length > 0 ? (
                            <div className="space-y-2.5">
                                {myTasks.slice(0, 4).map((task) => (
                                    <div 
                                        key={task._id} 
                                        onClick={() => navigate('/app/tasks')}
                                        className="flex items-center justify-between p-3 rounded-lg border border-stone-100 bg-stone-50/50 hover:bg-stone-100/60 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                            <div>
                                                <p className="text-xs font-medium text-stone-900">{task.title}</p>
                                                <p className="text-[10px] text-stone-400 mt-0.5">
                                                    Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'} • {task.priority || 'Normal'} Priority
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-stone-400" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-6 text-center">
                                <CheckCircle2 className="mx-auto text-emerald-500 mb-1.5" size={24} />
                                <p className="text-xs font-medium text-stone-700">All tasks completed</p>
                            </div>
                        )}
                    </div>

                </div>

                {/* RIGHT COLUMN (1/3): SCHEDULE & SHORTCUTS */}
                <div className="space-y-6">
                    
                    {/* Today's Schedule */}
                    <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm p-5">
                        <h3 className="text-sm font-semibold text-stone-900 mb-4 pb-3 border-b border-stone-100">Today's Schedule</h3>
                        <div className="space-y-4 border-l-2 border-stone-200 ml-2 pl-4">
                            {myTasks.filter(t => {
                                if (!t.dueDate) return false;
                                return new Date(t.dueDate).toLocaleDateString() === new Date().toLocaleDateString();
                            }).length > 0 ? (
                                myTasks.filter(t => {
                                    if (!t.dueDate) return false;
                                    return new Date(t.dueDate).toLocaleDateString() === new Date().toLocaleDateString();
                                }).map((task, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white" />
                                        <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">Deadline</p>
                                        <p className="text-xs font-medium text-stone-900 mt-0.5">{task.title}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-stone-300 border-2 border-white" />
                                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Schedule</p>
                                    <p className="text-xs font-medium text-stone-700 mt-0.5">No tasks due today.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm p-5 space-y-2">
                        <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-2">Shortcuts</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {isHR ? (
                                <>
                                    <button 
                                        onClick={() => navigate('/app/attendance')} 
                                        className="p-3 rounded-lg border border-stone-200/60 hover:bg-stone-50 font-medium text-stone-700 text-left flex items-center gap-2"
                                    >
                                        <Clock size={14} className="text-stone-500" /> Attendance
                                    </button>
                                    <button 
                                        onClick={() => navigate('/app/payroll')} 
                                        className="p-3 rounded-lg border border-stone-200/60 hover:bg-stone-50 font-medium text-stone-700 text-left flex items-center gap-2"
                                    >
                                        <DollarSign size={14} className="text-stone-500" /> Payroll
                                    </button>
                                    <button 
                                        onClick={() => navigate('/app/users')} 
                                        className="p-3 rounded-lg border border-stone-200/60 hover:bg-stone-50 font-medium text-stone-700 text-left flex items-center gap-2"
                                    >
                                        <UserPlus size={14} className="text-stone-500" /> Employees
                                    </button>
                                    <button 
                                        onClick={() => navigate('/app/calendar')} 
                                        className="p-3 rounded-lg border border-stone-200/60 hover:bg-stone-50 font-medium text-stone-700 text-left flex items-center gap-2"
                                    >
                                        <CalendarIcon size={14} className="text-stone-500" /> Calendar
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => navigate('/app/sales')} 
                                        className="p-3 rounded-lg border border-stone-200/60 hover:bg-stone-50 font-medium text-stone-700 text-left flex items-center gap-2"
                                    >
                                        <Briefcase size={14} className="text-stone-500" /> Pipeline
                                    </button>
                                    <button 
                                        onClick={() => navigate('/app/contacts')} 
                                        className="p-3 rounded-lg border border-stone-200/60 hover:bg-stone-50 font-medium text-stone-700 text-left flex items-center gap-2"
                                    >
                                        <Users size={14} className="text-stone-500" /> Contacts
                                    </button>
                                    <button 
                                        onClick={() => navigate('/app/products')} 
                                        className="p-3 rounded-lg border border-stone-200/60 hover:bg-stone-50 font-medium text-stone-700 text-left flex items-center gap-2"
                                    >
                                        <Package size={14} className="text-stone-500" /> Products
                                    </button>
                                    <button 
                                        onClick={() => navigate('/app/calendar')} 
                                        className="p-3 rounded-lg border border-stone-200/60 hover:bg-stone-50 font-medium text-stone-700 text-left flex items-center gap-2"
                                    >
                                        <CalendarIcon size={14} className="text-stone-500" /> Calendar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Support Card */}
                    <div className="bg-stone-900 text-white rounded-xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                            <ShieldCheck size={14} /> Help & Support
                        </div>
                        <p className="text-xs text-stone-300 font-normal">Need assistance with access or system issues?</p>
                        <button 
                            onClick={() => navigate('/app/tickets')}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                            Raise Support Ticket
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;


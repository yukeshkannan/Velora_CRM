import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    Users, DollarSign, TrendingUp, AlertCircle, 
    CheckCircle, BarChart3, Activity, ArrowUpRight, ArrowRight, RefreshCw, Zap
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
    BarChart, Bar, CartesianGrid, Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ClientDashboard from './ClientDashboard';
import EmployeeDashboard from './EmployeeDashboard';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const internalRoles = ['Admin', 'Employee', 'Sales', 'HR'];
    if (!user || !user.role || !internalRoles.includes(user.role) || user.role === 'Client') {
        return <ClientDashboard />;
    }
    if (user.role === 'Employee' || user.role === 'Sales' || user.role === 'HR') {
        return <EmployeeDashboard />;
    }

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await axios.get('/api/analytics/dashboard');
                setData(res.data.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <LoadingSpinner message="Loading Analytics..." />;

    const { overview, actionItems, breakdown, charts } = data || { 
        overview: {}, actionItems: {}, breakdown: { sales: {}, finance: {}, support: {} }, charts: { salesTrend: [], revenueTrend: [] }
    };

    const salesTrendData = charts?.salesTrend?.map(d => ({ ...d, name: d.label })) || [];
    const revenueData = charts?.revenueTrend?.map(d => ({ name: d.label, Invoiced: d.value })) || [];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-800 font-sans">
                    <p className="font-semibold mb-1">{label}</p>
                    <p className="font-bold text-emerald-400">${payload[0].value.toLocaleString()} USD</p>
                </div>
            );
        }
        return null;
    };

    const ProgressBar = ({ label, value, colorClass = "bg-slate-900" }) => (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-slate-600">{label}</span>
                <span className="text-xs font-bold text-slate-900">{value}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${Math.min(value, 100)}%` }} />
            </div>
        </div>
    );

    return (
        <div className="p-6 sm:p-8 bg-slate-50 min-h-screen font-sans text-slate-900 selection:bg-slate-200 selection:text-slate-900 antialiased"
             style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* --- TOP PAGE HEADER --- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Executive Overview</h1>
                    <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">Real-time revenue, pipeline & operational metrics for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.</p>
                </div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="self-start sm:self-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs hover:shadow flex items-center gap-2 cursor-pointer"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh Analytics
                </button>
            </div>

            {/* --- METRIC GRID (Top Row) --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <MetricCard 
                    title="Total Revenue" 
                    value={`$${Math.round(overview.totalRevenuePotential || 0).toLocaleString()}`}
                    subtitle="Projected Income"
                    path="/app/sales"
                    icon={<DollarSign className="w-5 h-5 text-slate-900" />}
                    badge="+14.2%"
                    badgeType="success"
                />
                <MetricCard 
                    title="Active Deals" 
                    value={overview.totalDeals || 0}
                    subtitle="Pipeline Volume"
                    path="/app/sales"
                    icon={<BarChart3 className="w-5 h-5 text-slate-900" />}
                    badge="Pipeline Active"
                    badgeType="neutral"
                />
                <MetricCard 
                    title="Cash Collected" 
                    value={`$${Math.round(overview.totalCollected || 0).toLocaleString()}`}
                    subtitle="Realized Revenue"
                    path="/app/invoices"
                    icon={<CheckCircle className="w-5 h-5 text-slate-900" />}
                    badge="Collected"
                    badgeType="success"
                />
                <MetricCard 
                    title="Critical Tickets" 
                    value={actionItems.criticalTickets || 0}
                    subtitle="Requires Action"
                    path="/app/tickets"
                    icon={<AlertCircle className="w-5 h-5 text-rose-600" />}
                    badge="Action Required"
                    badgeType="danger"
                />
            </div>

            {/* --- MAIN HERO SECTION: Left Performance Card (40%) / Right Sparklines (60%) --- */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-8">
                
                {/* 1. Performance Summary Card */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Performance Index</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Key Efficiency Metrics</p>
                            </div>
                            <div className="w-9 h-9 bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center font-bold">
                                <Activity className="w-5 h-5 text-slate-900" />
                            </div>
                        </div>

                        {/* Progress Section */}
                        <div className="space-y-4">
                            <ProgressBar label="Win Rate" value={parseInt(overview.winRate) || 0} colorClass="bg-emerald-600" />
                            <ProgressBar label="Collection Efficiency" value={breakdown.finance?.totalInvoiced > 0 ? Math.round((breakdown.finance.collected / breakdown.finance.totalInvoiced) * 100) : 0} colorClass="bg-slate-900" />
                            <ProgressBar label="Active Pipeline Ratio" value={overview.totalDeals > 0 ? Math.round((breakdown.sales?.active / overview.totalDeals) * 100) : 0} colorClass="bg-indigo-600" />
                        </div>
                    </div>

                    {/* Revenue Bar Chart */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                            <p className="text-xs font-semibold text-slate-700">Daily Revenue Distribution</p>
                        </div>
                        <div className="h-40 -mx-2">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                                        dy={8}
                                    />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15,23,42,0.03)' }} />
                                    <Bar dataKey="Invoiced" radius={[4, 4, 0, 0]} barSize={28} fill="#0f172a" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 2. Sparkline Cards Row (Right Column 60%) */}
                <div className="xl:col-span-3 flex flex-col justify-between gap-5">
                    <SparkCard 
                        title="Total Contacts" 
                        value={overview.totalContacts || 0} 
                        trend="+5 Active Leads" 
                        path="/app/contacts"
                        chart={
                            <AreaChart data={salesTrendData}>
                                <Area type="monotone" dataKey="value" stroke="#0f172a" strokeWidth={2} fill="#f1f5f9" />
                            </AreaChart>
                        } 
                    />

                    <SparkCard 
                        title="Active Pipeline Volume" 
                        value={breakdown.sales?.active || 0} 
                        trend="Pipeline Active" 
                        path="/app/sales"
                        chart={
                            <BarChart data={salesTrendData}>
                                <Bar dataKey="value" fill="#0f172a" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        } 
                    />

                    <SparkCard 
                        title="Open Support Load" 
                        value={breakdown.support?.openTickets || 0} 
                        trend="Tickets Active" 
                        path="/app/tickets"
                        chart={
                            <AreaChart data={[{v:5},{v:8},{v:4},{v:12},{v:3},{v:7},{v:9}]}>
                                <Area type="monotone" dataKey="v" stroke="#e11d48" strokeWidth={2} fill="#fff1f2" />
                            </AreaChart>
                        } 
                    />
                </div>
            </div>
        </div>
    );
};

// --- Sub-Components ---
const MetricCard = ({ title, value, subtitle, path, icon, badge, badgeType }) => {
    const navigate = useNavigate();
    
    const badgeStyles = {
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        danger: 'bg-rose-50 text-rose-700 border-rose-200',
        neutral: 'bg-slate-100 text-slate-700 border-slate-200'
    };

    return (
        <div 
            onClick={() => navigate(path)}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between relative group"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200/60 group-hover:scale-105 transition-transform">
                    {icon}
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyles[badgeType] || badgeStyles.neutral}`}>
                    {badge}
                </span>
            </div>

            <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">{value}</h3>
                <p className="text-xs font-semibold text-slate-700">{title}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{subtitle}</p>
            </div>
        </div>
    );
};

const SparkCard = ({ title, value, trend, chart, path }) => {
    const navigate = useNavigate();
    return (
        <div 
            onClick={() => navigate(path)}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between gap-6 flex-1"
        >
            <div className="shrink-0">
                <div className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-2">
                    {trend}
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900">{value}</h3>
                <p className="text-xs font-semibold text-slate-500">{title}</p>
            </div>

            <div className="h-16 w-36 sm:w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    {chart}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Dashboard;


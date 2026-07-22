import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    Users, DollarSign, TrendingUp, AlertCircle, 
    CheckCircle, BarChart3, Activity, ArrowUpRight, ArrowRight
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

    // --- Data Preparation ---
    const salesTrendData = charts?.salesTrend?.map(d => ({ ...d, name: d.label })) || [];
    const revenueData = charts?.revenueTrend?.map(d => ({ name: d.label, Invoiced: d.value })) || [];

    // --- Professional Components ---
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-stone-900 text-white text-xs p-2 rounded shadow-xl">
                    <p className="font-bold mb-1">{label}</p>
                    <p>{payload[0].value.toLocaleString()} {payload[0].name === 'Invoiced' ? 'USD' : ''}</p>
                </div>
            );
        }
        return null;
    };

    const ProgressBar = ({ label, value, color }) => (
        <div className="mb-5">
            <div className="flex justify-between items-end mb-1">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">{label}</span>
                <span className="text-xs font-bold text-stone-900">{value}%</span>
            </div>
            <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
            </div>
        </div>
    );

    return (
        <div className="p-8 bg-[#F4F5F7] min-h-screen overflow-y-auto font-sans text-stone-800">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Executive Overview</h1>
                    <p className="text-stone-500 text-sm font-medium mt-1">Performance metrics for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
                <button onClick={() => window.location.reload()} className="px-5 py-2 bg-white border border-stone-200 text-stone-600 rounded-lg text-xs font-bold hover:bg-stone-50 transition-all shadow-sm">
                    Refresh Data
                </button>
            </div>

            {/* MAIN LAYOUT: Hero Left (40%) / Grid Right (60%) */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-8">
                
                {/* 1. HERO REPORT CARD (KPI Summary) */}
                <div className="xl:col-span-2 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-stone-100 p-8 flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-stone-900">Performance Report</h3>
                                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Key Indicators</p>
                            </div>
                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                                <Activity size={20} />
                            </div>
                        </div>

                        {/* Progress Section */}
                        <div className="pr-4">
                            <ProgressBar label="Win Rate" value={parseInt(overview.winRate) || 0} color="bg-emerald-500" />
                            <ProgressBar label="Collection Efficiency" value={breakdown.finance.totalInvoiced > 0 ? Math.round((breakdown.finance.collected / breakdown.finance.totalInvoiced) * 100) : 0} color="bg-amber-500" />
                            <ProgressBar label="Active Pipeline Ratio" value={overview.totalDeals > 0 ? Math.round((breakdown.sales.active / overview.totalDeals) * 100) : 0} color="bg-blue-500" />
                        </div>
                    </div>

                    {/* Bottom Chart Area */}
                    <div className="mt-8">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-stone-900"></div>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Daily Sales Performance</p>
                        </div>
                        <div className="h-48 -mx-2">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 10, fill: '#a8a29e', fontWeight: 'bold' }} 
                                        dy={10}
                                    />
                                    <RechartsTooltip 
                                        content={<CustomTooltip />} 
                                        cursor={{fill: 'rgba(0,0,0,0.03)'}}
                                    />
                                    <Bar dataKey="Invoiced" radius={[6, 6, 6, 6]} barSize={32}>
                                        {revenueData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={[
                                                '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#ec4899', 
                                                '#8b5cf6', '#06b6d4', '#14b8a6', '#f97316', '#db2777'
                                            ][index % 10]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 2. METRIC GRID (Right Side) */}
                <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Revenue - Deep Navy */}
                    <MetricCard 
                        title="Total Revenue" 
                        value={`$${Math.round(overview.totalRevenuePotential).toLocaleString()}`}
                        label="Projected Income"
                        path="/app/sales"
                        theme="navy"
                        icon={<DollarSign size={24} />}
                    />
                    {/* Deals - Emerald */}
                    <MetricCard 
                        title="Active Deals" 
                        value={overview.totalDeals}
                        label="Pipeline Volume"
                        path="/app/sales"
                        theme="emerald"
                        icon={<BarChart3 size={24} />}
                    />
                    {/* Collections - Amber */}
                    <MetricCard 
                        title="Cash Collected" 
                        value={`$${Math.round(overview.totalCollected).toLocaleString()}`}
                        label="Realized Revenue"
                        path="/app/invoices"
                        theme="amber"
                        icon={<CheckCircle size={24} />}
                    />
                    {/* Tickets - Crimson */}
                    <MetricCard 
                        title="Critical Tickets" 
                        value={actionItems.criticalTickets}
                        label="Requires Action"
                        path="/app/tickets"
                        theme="rose"
                        icon={<AlertCircle size={24} />}
                    />
                </div>
            </div>

            {/* 3. BOTTOM SPARKLINE ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Leads Sparkline */}
                <SparkCard 
                    title="Total Clients" 
                    value={overview.totalContacts} 
                    trend="+5 New" 
                    path="/app/contacts"
                    chart={
                        <AreaChart data={salesTrendData}>
                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="#eff6ff" />
                        </AreaChart>
                    } 
                />

                {/* Sales Volume Bar */}
                <SparkCard 
                    title="Weekly Sales" 
                    value={breakdown.sales.active} 
                    trend="Pipeline Active" 
                    path="/app/sales"
                    chart={
                        <BarChart data={salesTrendData}>
                            <Bar dataKey="value" fill="#f59e0b" radius={[2,2,2,2]} />
                        </BarChart>
                    } 
                />

                {/* Support Sparkline */}
                <SparkCard 
                    title="Support Load" 
                    value={breakdown.support?.openTickets || 0} 
                    trend="Open Tickets" 
                    path="/app/tickets"
                    chart={
                        <AreaChart data={[{v:5},{v:8},{v:4},{v:12},{v:3},{v:7},{v:9}]}>
                            <Area type="monotone" dataKey="v" stroke="#ec4899" strokeWidth={2} fill="#fce7f3" />
                        </AreaChart>
                    } 
                />
            </div>
        </div>
    );
};

// --- Sub-Components ---
const MetricCard = ({ title, value, label, path, theme, icon }) => {
    const navigate = useNavigate();
    
    // Enterprise Color Palettes
    const themes = {
        navy: 'bg-[#1e293b] text-white',
        emerald: 'bg-[#059669] text-white',
        amber: 'bg-[#d97706] text-white',
        rose: 'bg-[#be123c] text-white', 
    };

    return (
        <div 
            onClick={() => navigate(path)}
            className={`${themes[theme]} rounded-xl p-6 shadow-lg shadow-stone-200 cursor-pointer transition-transform hover:-translate-y-1 relative overflow-hidden group`}
        >
            <div className="absolute right-0 top-0 p-6 opacity-10 scale-150 rotate-12 transition-transform group-hover:rotate-0">
                {icon}
            </div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/10">
                    {icon}
                </div>
                <div>
                    <h3 className="text-3xl font-bold tracking-tight mb-1">{value}</h3>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80">{title}</p>
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                        <ArrowUpRight size={14} className="opacity-70" />
                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SparkCard = ({ title, value, trend, chart, path }) => {
    const navigate = useNavigate();
    return (
        <div 
            onClick={() => navigate(path)}
            className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm hover:border-stone-300 transition-all cursor-pointer h-48 flex flex-col justify-between"
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-2xl font-bold text-stone-900">{value}</h3>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{title}</p>
                </div>
                <div className="bg-stone-50 px-2 py-1 rounded text-[10px] font-bold text-stone-500">
                    {trend}
                </div>
            </div>
            <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    {chart}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Dashboard;

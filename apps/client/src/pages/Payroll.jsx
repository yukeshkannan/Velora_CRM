import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
    DollarSign, FileText, Download, Users, CheckCircle, AlertCircle, 
    Search, Calendar, Briefcase, TrendingUp, ChevronRight, Loader2, Trash2, 
    Zap, CreditCard, ArrowUpRight, Printer, Sliders, X, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Payroll = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('payslips'); // 'payslips' | 'generate'
    const [employees, setEmployees] = useState([]);
    const [payrolls, setPayrolls] = useState([]);
    const [allPayrolls, setAllPayrolls] = useState([]); // For Admin to see status
    const [loading, setLoading] = useState(true);
    const [generatingId, setGeneratingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }
    
    // Modal states
    const [adjustEmployee, setAdjustEmployee] = useState(null);
    const [useAutoAttendance, setUseAutoAttendance] = useState(true);
    const [baseSalaryInput, setBaseSalaryInput] = useState('');
    const [presentDaysInput, setPresentDaysInput] = useState('30');
    const [totalDaysInput, setTotalDaysInput] = useState('30');
    const [allowancesInput, setAllowancesInput] = useState('0');
    const [deductionsInput, setDeductionsInput] = useState('0');
    
    const [selectedPayslip, setSelectedPayslip] = useState(null);

    const isPayrollManager = user?.role === 'Admin' || user?.role === 'HR' || (user?.department || '').toLowerCase().includes('hr') || (user?.department || '').toLowerCase().includes('human');

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        } 

        if (isPayrollManager) {
            setActiveTab('generate');
            fetchEmployees();
            fetchAllPayrolls();
        } else {
            setActiveTab('payslips');
        }
        fetchMyPayroll();
    }, [user?.id, user?.role]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const fetchEmployees = async () => {
        try {
            const res = await axios.get('/api/auth/users');
            setEmployees(res.data.data);
        } catch (err) {
            console.error("Failed to fetch employees", err);
        }
    };

    const fetchMyPayroll = async () => {
        if (!user || !user.id) return;
        try {
            setLoading(true);
            const res = await axios.get(`/api/payroll?userId=${user.id}`);
            setPayrolls(res.data.data);
        } catch (err) {
            console.error("Fetch payroll error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllPayrolls = async () => {
        try {
            const res = await axios.get('/api/payroll');
            setAllPayrolls(res.data.data);
        } catch (err) {
            console.error("Fetch all payrolls error:", err);
        }
    };

    const getDaysInMonth = (monthIndex, yearVal) => {
        return new Date(yearVal, monthIndex + 1, 0).getDate();
    };

    const getWeekendDaysInMonth = (monthIndex, yearVal) => {
        const date = new Date(yearVal, monthIndex, 1);
        let weekends = 0;
        while (date.getMonth() === monthIndex) {
            const day = date.getDay();
            if (day === 0 || day === 6) { // 0 is Sunday, 6 is Saturday
                weekends++;
            }
            date.setDate(date.getDate() + 1);
        }
        return weekends;
    };

    const openAdjustModal = async (emp) => {
        setAdjustEmployee(emp);
        setBaseSalaryInput(String(emp.salary?.base || 0));
        setUseAutoAttendance(true);
        setAllowancesInput('0');
        setDeductionsInput('0');

        const today = new Date();
        const currentMonthIndex = today.getMonth();
        const currentYear = today.getFullYear();
        const totalCalendarDays = getDaysInMonth(currentMonthIndex, currentYear);
        
        setTotalDaysInput(String(totalCalendarDays));
        setPresentDaysInput('0'); // Default to 0 present days if database is empty

        try {
            const res = await axios.get(`/api/attendance?userId=${emp._id}`);
            const logs = res.data.data || [];
            
            const monthlyLogs = logs.filter(log => {
                const logDate = new Date(log.date);
                return logDate.getMonth() === currentMonthIndex && logDate.getFullYear() === currentYear;
            });

            if (monthlyLogs.length > 0) {
                const todayDate = new Date();
                todayDate.setHours(0, 0, 0, 0);

                const totalHoursWorked = monthlyLogs.reduce((sum, log) => {
                    const status = log.status || 'Present';
                    if (status === 'Leave') return sum + 8.0;
                    
                    let hours = 0;
                    if (log.checkOut) {
                        hours = Number(log.totalHours) || 0;
                        if (hours === 0) {
                            if (status === 'Present') hours = 8.0;
                            else if (status === 'Half-Day') hours = 4.0;
                        }
                    } else {
                        // Active session
                        const logDate = new Date(log.date);
                        logDate.setHours(0, 0, 0, 0);
                        
                        if (logDate.getTime() < todayDate.getTime()) {
                            // Forgot checkout on past day
                            hours = 8.0;
                        } else {
                            // Today's active session - calculate elapsed hours
                            const checkInTime = new Date(log.checkIn);
                            hours = (Date.now() - checkInTime) / (1000 * 60 * 60);
                            if (hours < 0) hours = 0;
                            if (hours > 8.0) hours = 8.0; // Cap at normal workday
                        }
                    }
                    return sum + hours;
                }, 0);

                if (totalHoursWorked === 0) {
                    setPresentDaysInput('0');
                } else {
                    const weekendDays = getWeekendDaysInMonth(currentMonthIndex, currentYear);
                    const totalBusinessDays = totalCalendarDays - weekendDays;
                    const totalBusinessHours = totalBusinessDays * 8.0;
                    const ratio = totalHoursWorked / totalBusinessHours;
                    let calcPresent = ratio * totalCalendarDays;
                    if (calcPresent > totalCalendarDays) calcPresent = totalCalendarDays;
                    
                    const roundedPresent = Math.round(calcPresent * 100) / 100;
                    setPresentDaysInput(String(roundedPresent));
                }
            }
        } catch (err) {
            console.error("Error pre-calculating attendance:", err);
        }
    };

    const handleGenerate = async (e) => {
        if (e) e.preventDefault();
        if (!adjustEmployee) return;

        try {
            setGeneratingId(adjustEmployee._id);
            const today = new Date();
            const month = today.toLocaleString('default', { month: 'long' });
            const year = today.getFullYear();

            const baseSalary = Number(baseSalaryInput) || 0;
            if (baseSalary === 0) {
                 setNotification({ type: 'error', message: `Please enter a valid base salary.` });
                 setGeneratingId(null);
                 return;
            }

            const payload = {
                userId: adjustEmployee._id,
                month,
                year,
                baseSalary: baseSalary,
                allowances: Number(allowancesInput) || 0,
                deductions: Number(deductionsInput) || 0
            };

            if (!useAutoAttendance) {
                payload.presentDays = Number(presentDaysInput) || 0;
                payload.totalDays = Number(totalDaysInput) || 0;
            }

            console.log("Generating Payroll Payload:", payload);
            await axios.post('/api/payroll/generate', payload);
            
            setNotification({ type: 'success', message: `Payroll generated for ${adjustEmployee.name}` });
            setAdjustEmployee(null);
            setGeneratingId(null);
            fetchAllPayrolls(); // Refresh status list
            
            if (user.id === adjustEmployee._id) {
                fetchMyPayroll(); 
            }
        } catch (err) {
            console.error("Generate Payroll Error:", err);
            setNotification({ type: 'error', message: err.response?.data?.message || 'Generation failed' });
            setGeneratingId(null);
        }
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const handleDelete = (payrollId) => {
        setShowDeleteConfirm(payrollId);
    };

    const confirmDeletePayroll = async () => {
        if (!showDeleteConfirm) return;
        try {
            setLoading(true);
            await axios.delete(`/api/payroll/${showDeleteConfirm}`);
            toast.success('Payroll record deleted successfully');
            setShowDeleteConfirm(null);
            await fetchAllPayrolls(); // Refresh all payrolls
            if (user?.id) {
                await fetchMyPayroll(); // Refresh current user's payrolls
            }
        } catch (err) {
            console.error("Delete payroll error:", err);
            toast.error(err.response?.data?.message || 'Delete failed');
            setShowDeleteConfirm(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async (slip) => {
        // Load html2pdf from CDN dynamically if not already loaded
        if (!window.html2pdf) {
            setNotification({ type: 'success', message: 'Preparing PDF engine...' });
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.async = true;
            document.body.appendChild(script);
            await new Promise((resolve) => {
                script.onload = resolve;
            });
        }

        const today = new Date();
        const monthMap = {
          'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
          'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
        };
        const monthIndex = monthMap[slip.month] !== undefined ? monthMap[slip.month] : today.getMonth();
        const slipYear = Number(slip.year) || today.getFullYear();
        const disburseDate = new Date(slipYear, monthIndex + 1, 0);
        const formattedDisburseDate = disburseDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

        const isPaid = slip.status === 'Paid' || slip.status === 'Generated';
        const statusText = 'SETTLED & DISBURSED';

        // Parse breakdown from details
        let presentDays = 0;
        let totalDays = 31;
        if (slip.details) {
            try {
                const parsed = JSON.parse(slip.details);
                presentDays = Number(parsed.presentDays) || 0;
                totalDays = Number(parsed.totalDays) || 31;
            } catch(e) {}
        }

        // Recipient details fallback
        const empDetails = (typeof slip.userId === 'object' && slip.userId) ? slip.userId : user;
        const empName = empDetails.name || 'Staff Member';
        const empEmail = empDetails.email || '';
        const empRole = empDetails.role === 'Admin' ? 'Executive Owner' : (empDetails.role || 'Employee');
        const empDept = empDetails.department || 'General Operations';
        const empDesignation = empDetails.designation || (empDetails.role === 'Admin' ? 'Director' : 'Technical Staff');

        // Calculations
        const baseVal = Number(slip.baseSalary) || 0;
        const netVal = Number(slip.netSalary) || 0;
        const allowancesVal = Number(slip.allowances) || 0;
        const deductionsVal = Number(slip.deductions) || 0;

        const proratedVal = totalDays > 0 ? Math.round((baseVal / totalDays) * presentDays) : baseVal;
        const lopVal = Math.max(0, baseVal - proratedVal);

        const basicVal = Math.round(baseVal * 0.50);
        const hraVal = Math.round(baseVal * 0.30);
        const specialVal = baseVal - basicVal - hraVal;

        const convertNumberToWords = (num) => {
            const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
            const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
            if ((num = num.toString()).length > 9) return 'Amount too large';
            let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n) return ''; 
            let str = '';
            str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
            str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
            str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
            str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
            str += (Number(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'Rupees Only' : 'Rupees Only';
            return str;
        };
        const netSalaryWords = convertNumberToWords(netVal);

        const printContent = `
            <html>
                <head>
                    <title>Velora_Payslip_${slip.month}_${slip.year}</title>
                    <style>
                        body { 
                            font-family: 'Inter', -apple-system, sans-serif;
                            padding: 10px; 
                            margin: 0; 
                            background: #fff; 
                            color: #1e293b;
                        }
                        .payslip-container { 
                            padding: 30px; 
                            background: #fff; 
                            border: 1px solid #e2e8f0; 
                            border-radius: 16px; 
                            box-sizing: border-box; 
                            width: 680px;
                            margin: 0 auto;
                        }
                        .header-row { 
                            display: flex; 
                            justify-content: space-between; 
                            align-items: flex-start; 
                            border-bottom: 2px solid #f1f5f9; 
                            padding-bottom: 15px; 
                            margin-bottom: 25px; 
                        }
                        .brand { 
                            font-size: 22px; 
                            font-weight: 900; 
                            letter-spacing: -0.5px; 
                            color: #0f172a; 
                        }
                        .brand span { 
                            color: #f59e0b; 
                        }
                        .company-info {
                            font-size: 9px;
                            color: #64748b;
                            margin-top: 4px;
                            line-height: 1.4;
                        }
                        .doc-info { 
                            text-align: right; 
                        }
                        .doc-info h1 { 
                            margin: 0; 
                            font-size: 9px; 
                            font-weight: 800; 
                            color: #64748b; 
                            letter-spacing: 2px; 
                            text-transform: uppercase; 
                        }
                        .doc-info p { 
                            margin: 4px 0 0; 
                            font-size: 16px; 
                            font-weight: 800; 
                            color: #0f172a; 
                        }
                        .meta-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 25px;
                            font-size: 11px;
                        }
                        .meta-table td {
                            padding: 8px 10px;
                            border: 1px solid #f1f5f9;
                        }
                        .meta-table td.lbl {
                            font-weight: 700;
                            color: #64748b;
                            background: #f8fafc;
                            width: 20%;
                        }
                        .meta-table td.val {
                            font-weight: 600;
                            color: #334155;
                            width: 30%;
                        }
                        .item-table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            font-size: 11px;
                        }
                        .item-table th { 
                            text-align: left; 
                            padding: 10px; 
                            font-weight: 800; 
                            color: #475569; 
                            background: #f1f5f9;
                            border-bottom: 2px solid #e2e8f0; 
                            text-transform: uppercase; 
                        }
                        .item-table td { 
                            padding: 10px; 
                            font-weight: 500; 
                            border-bottom: 1px solid #f1f5f9; 
                            color: #334155; 
                        }
                        .item-table tr.total-row td {
                            background: #f8fafc;
                            border-top: 2px solid #e2e8f0;
                            border-bottom: 2px solid #e2e8f0;
                        }
                    </style>
                </head>
                <body>
                    <div class="payslip-container">
                        <div class="header-row">
                            <div>
                                <div class="brand">VELORA<span>CRM</span></div>
                                <div class="company-info">
                                    Velora CRM Private Limited<br/>
                                    Corporate Headquarters: 100 Tech Park, Suite 400<br/>
                                    CIN: U72200TN2026PTC123456 | GSTIN: 33AAACV1234F1Z5
                                </div>
                            </div>
                            <div class="doc-info">
                                <h1>PAYSLIP STATEMENT</h1>
                                <p>${slip.month.toUpperCase()} ${slip.year}</p>
                                <span style="font-size: 9px; font-weight: bold; color: #64748b;">Cycle ID: PAY-${slip._id.slice(-6).toUpperCase()}</span>
                            </div>
                        </div>

                        <table class="meta-table">
                            <tr>
                                <td class="lbl">Employee Name</td>
                                <td class="val">${empName.toUpperCase()}</td>
                                <td class="lbl">Department</td>
                                <td class="val">${empDept.toUpperCase()}</td>
                            </tr>
                            <tr>
                                <td class="lbl">Designation</td>
                                <td class="val">${empDesignation.toUpperCase()}</td>
                                <td class="lbl">Role Level</td>
                                <td class="val">${empRole.toUpperCase()}</td>
                            </tr>
                            <tr>
                                <td class="lbl">Total Calendar Days</td>
                                <td class="val">${totalDays} Days</td>
                                <td class="lbl">Paid Days Present</td>
                                <td class="val">${presentDays} Days</td>
                            </tr>
                            <tr>
                                <td class="lbl">Payment Mode</td>
                                <td class="val">Electronic Bank Transfer</td>
                                <td class="lbl">Loss of Pay (LOP)</td>
                                <td class="val">${Math.round((totalDays - presentDays) * 100) / 100} Days</td>
                            </tr>
                        </table>

                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="width: 48%; vertical-align: top; padding-right: 12px; border: none;">
                                    <table class="item-table">
                                        <thead>
                                            <tr>
                                                <th>Earnings</th>
                                                <th style="text-align: right;">Amount (INR)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Basic Salary (50%)</td>
                                                <td style="text-align: right; font-variant-numeric: tabular-nums;">₹${basicVal.toLocaleString()}</td>
                                            </tr>
                                            <tr>
                                                <td>House Rent Allowance (30%)</td>
                                                <td style="text-align: right; font-variant-numeric: tabular-nums;">₹${hraVal.toLocaleString()}</td>
                                            </tr>
                                            <tr>
                                                <td>Special Allowance (20%)</td>
                                                <td style="text-align: right; font-variant-numeric: tabular-nums;">₹${specialVal.toLocaleString()}</td>
                                            </tr>
                                            <tr>
                                                <td>Performance Incentives</td>
                                                <td style="text-align: right; color: #10b981; font-variant-numeric: tabular-nums;">+ ₹${allowancesVal.toLocaleString()}</td>
                                            </tr>
                                            <tr class="total-row">
                                                <td style="font-weight: bold; color: #0f172a;">Gross Earnings</td>
                                                <td style="text-align: right; font-weight: bold; color: #0f172a; font-variant-numeric: tabular-nums;">₹${(baseVal + allowancesVal).toLocaleString()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                                <td style="width: 48%; vertical-align: top; padding-left: 12px; border: none;">
                                    <table class="item-table">
                                        <thead>
                                            <tr>
                                                <th>Deductions</th>
                                                <th style="text-align: right;">Amount (INR)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Loss of Pay (LOP)</td>
                                                <td style="text-align: right; color: #ef4444; font-variant-numeric: tabular-nums;">- ₹${lopVal.toLocaleString()}</td>
                                            </tr>
                                            <tr>
                                                <td>Statutory Taxes & Deductions</td>
                                                <td style="text-align: right; color: #ef4444; font-variant-numeric: tabular-nums;">- ₹${deductionsVal.toLocaleString()}</td>
                                            </tr>
                                            <tr>
                                                <td>&nbsp;</td>
                                                <td>&nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td>&nbsp;</td>
                                                <td>&nbsp;</td>
                                            </tr>
                                            <tr class="total-row">
                                                <td style="font-weight: bold; color: #0f172a;">Total Deductions</td>
                                                <td style="text-align: right; font-weight: bold; color: #ef4444; font-variant-numeric: tabular-nums;">- ₹${(lopVal + deductionsVal).toLocaleString()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        <div style="margin-top: 25px; background: #0f172a; color: #fff; padding: 22px; border-radius: 12px; box-sizing: border-box;">
                            <table style="width: 100%; border-collapse: collapse; border: none;">
                                <tr style="border: none;">
                                    <td style="border: none; padding: 0; color: #fff;">
                                        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Net Salary Payable</div>
                                        <div style="font-size: 26px; font-weight: 900; margin-top: 4px; letter-spacing: -0.5px;">₹${netVal.toLocaleString()}</div>
                                        <div style="font-size: 10px; color: #94a3b8; font-style: italic; margin-top: 6px;">In Words: ${netSalaryWords}</div>
                                    </td>
                                    <td style="border: none; padding: 0; text-align: right; color: #fff; vertical-align: middle;">
                                        <div style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px;">Release Status</div>
                                        <div style="font-size: 13px; font-weight: 800; color: #10b981; margin-top: 4px;">PAID & SETTLED</div>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <div style="margin-top: 30px; border-top: 1px dashed #e2e8f0; padding-top: 15px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 9px; color: #64748b; line-height: 1.5; text-align: left;">
                                <strong>System Note:</strong><br/>
                                1. This is a digitally verified corporate record generated by Velora CRM Enterprise Suite.<br/>
                                2. No physical signature is required. For issues, contact finance@veloracrm.com.
                            </div>
                            <div style="border: 2px solid #10b981; color: #10b981; padding: 6px 12px; border-radius: 6px; font-weight: 900; font-size: 10px; transform: rotate(-5deg); text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                                Velora CRM<br/>DISBURSED
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;

        const opt = {
            margin:       [10, 10, 10, 10],
            filename:     `Velora_Payslip_${slip.month}_${slip.year}.pdf`,
            image:        { type: 'jpeg', quality: 1.0 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            setNotification({ type: 'success', message: 'Downloading PDF payslip...' });
            await window.html2pdf().from(printContent).set(opt).save();
        } catch (err) {
            console.error("PDF generation failed:", err);
            setNotification({ type: 'error', message: 'Download failed. Please try again.' });
        }
    };

    const filteredEmployees = employees.filter(emp => 
        emp.role !== 'Client' && emp.role !== 'Admin' &&
        (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Calculate Real Stats
    const today = new Date();
    const currentMonth = today.toLocaleString('default', { month: 'long' });
    const currentYear = today.getFullYear();

    const totalDisbursed = isPayrollManager
        ? allPayrolls.reduce((acc, curr) => acc + (curr.netSalary || 0), 0)
        : payrolls.reduce((acc, curr) => acc + (curr.netSalary || 0), 0);

    const formatCurrency = (amount) => {
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
        return `₹${amount}`;
    };

    let awaitingProcessValue = '';
    if (isPayrollManager) {
        const staffMembers = employees.filter(emp => emp.role !== 'Client' && emp.role !== 'Admin');
        const staffProcessed = allPayrolls.filter(p => p.month === currentMonth && p.year === currentYear);
        const processedUserIds = new Set(staffProcessed.map(p => typeof p.userId === 'object' ? p.userId?._id : p.userId));
        const awaitingCount = staffMembers.filter(emp => !processedUserIds.has(emp._id)).length;
        awaitingProcessValue = `${awaitingCount > 0 ? awaitingCount : 0} Staff`;
    } else {
        const hasCurrentPayroll = payrolls.some(p => p.month === currentMonth && p.year === currentYear);
        awaitingProcessValue = hasCurrentPayroll ? "Processed" : "Pending Release";
    }

    const lastDayDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const scheduledPaymentValue = lastDayDate.toLocaleDateString('default', { month: 'short', day: 'numeric' });

    const stats = [
        { label: 'Total Budget Disbursed', value: formatCurrency(totalDisbursed), icon: Zap, color: 'from-emerald-500 to-emerald-600', textColor: 'text-emerald-500', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
        { label: 'Pending Processing', value: awaitingProcessValue, icon: AlertCircle, color: 'from-amber-500 to-amber-600', textColor: 'text-amber-500', bg: 'bg-amber-50/50', border: 'border-amber-100' },
        { label: 'Scheduled Pay Cycle', value: scheduledPaymentValue, icon: Calendar, color: 'from-blue-500 to-blue-600', textColor: 'text-blue-500', bg: 'bg-blue-50/50', border: 'border-blue-100' },
    ];

    // Live preview net salary calculation in modal
    const calculatePreviewNet = () => {
        const base = Number(baseSalaryInput) || 0;
        const allowances = Number(allowancesInput) || 0;
        const deductions = Number(deductionsInput) || 0;
        const present = Number(presentDaysInput) || 0;
        const total = Number(totalDaysInput) || 0;
        const perDay = total > 0 ? base / total : 0;
        return Math.round(perDay * present) + allowances - deductions;
    };

    if (loading) return <LoadingSpinner />;
    if (!user) return <div className="p-8 text-center text-slate-500">Please log in to view payroll information.</div>;

    return (
        <div className="bg-slate-50/50 min-h-screen pb-24">
            {/* Top Notification Toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 bg-white ${
                            notification.type === 'success' ? 'border-emerald-100 text-emerald-800' : 'border-red-100 text-red-800'
                        }`}
                    >
                        {notification.type === 'success' ? <CheckCircle size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-red-500" />}
                        <span className="font-semibold text-sm">{notification.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header section with Slate Monochrome look */}
            <div className="bg-white border-b border-slate-200/80 pt-8 pb-8 px-8 font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
                 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Payroll Processing</h1>
                        <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">Configure compensation matrices, view past disbursements, and issue payslips.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                        {stats.map((stat, idx) => (
                            <div key={idx} className={`bg-white px-4 py-3.5 rounded-2xl border ${stat.border || 'border-slate-200/80'} min-w-[170px] shadow-2xs flex items-center justify-between gap-4`}>
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{stat.label}</span>
                                    <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{stat.value}</span>
                                </div>
                                <div className={`w-9 h-9 rounded-xl ${stat.bg || 'bg-slate-100'} flex items-center justify-center`}>
                                    <stat.icon size={16} className={stat.textColor || 'text-slate-700'} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="max-w-7xl mx-auto px-8 -mt-6">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100/80 overflow-hidden">
                    
                    {/* Premium Tab Swapper for Managers */}
                    {isPayrollManager && (
                        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6">
                            <button 
                                onClick={() => setActiveTab('generate')}
                                className={`px-6 py-5 text-xs font-bold tracking-widest transition-all relative border-none bg-transparent cursor-pointer ${
                                    activeTab === 'generate' ? 'text-slate-900 font-extrabold' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Users size={15} />
                                    DISBURSE COMPENSATIONS
                                </div>
                                {activeTab === 'generate' && (
                                    <motion.div layoutId="tab-underline-payroll" className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-slate-900" />
                                )}
                            </button>

                            <button 
                                onClick={() => setActiveTab('all_records')}
                                className={`px-6 py-5 text-xs font-bold tracking-widest transition-all relative border-none bg-transparent cursor-pointer ${
                                    activeTab === 'all_records' ? 'text-slate-900 font-extrabold' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <FileText size={15} />
                                    ALL GENERATED RECORDS ({allPayrolls.length})
                                </div>
                                {activeTab === 'all_records' && (
                                    <motion.div layoutId="tab-underline-payroll" className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-slate-900" />
                                )}
                            </button>
                        </div>
                    )}

                    <div className="p-8 md:p-10 bg-white min-h-[500px]">
                        <AnimatePresence mode="wait">
                            {activeTab === 'generate' ? (
                                <motion.div 
                                    key="generate"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    className="space-y-8"
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Workforce Compensation Roster</h2>
                                            <p className="text-xs text-slate-500 font-medium">Manage and generate salaries for staff and employees.</p>
                                        </div>
                                        
                                        <div className="relative w-full md:w-80">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input 
                                                type="text" 
                                                placeholder="Search by name or email..." 
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-slate-400 transition-all shadow-inner animate-transition"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm bg-white">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50/80 text-slate-500 text-[11px] font-black uppercase tracking-wider border-b border-slate-100">
                                                <tr>
                                                    <th className="p-6 pl-8">Employee</th>
                                                    <th className="p-6">Designation / Dept</th>
                                                    <th className="p-6">Base Salary</th>
                                                    <th className="p-6 text-right pr-8">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {filteredEmployees.map((emp) => (
                                                    <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="p-6 pl-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-base shadow-sm group-hover:bg-amber-600 transition-colors">
                                                                    {emp.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-bold text-slate-900 text-sm">{emp.name}</p>
                                                                        {emp.role === 'Admin' && (
                                                                            <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                                                Owner
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-slate-400 font-medium">{emp.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            <div className="space-y-1">
                                                                <span className="font-bold text-slate-800 text-xs">{emp.role === 'Admin' ? 'Executive Owner' : emp.role}</span>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp.department || 'General'}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            {emp.salary?.base ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-extrabold text-sm text-slate-900">
                                                                        ₹{emp.salary.base.toLocaleString()}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">/Mo</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-300 font-bold text-xs">Not Set</span>
                                                            )}
                                                        </td>
                                                        <td className="p-6 text-right pr-8">
                                                            {(() => {
                                                                const today = new Date();
                                                                const currentMonth = today.toLocaleString('default', { month: 'long' });
                                                                const currentYear = today.getFullYear();
                                                                const existingPayroll = allPayrolls.find(p => (p.userId?._id || p.userId) === emp._id && p.month === currentMonth && p.year === currentYear);

                                                                if (existingPayroll) {
                                                                    return (
                                                                        <div className="flex items-center justify-end gap-2.5">
                                                                            <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100 flex items-center gap-1.5 shadow-sm shadow-emerald-50/50">
                                                                                <CheckCircle size={14} className="text-emerald-500" /> Released
                                                                            </span>
                                                                            <button 
                                                                                onClick={() => handleDelete(existingPayroll._id)}
                                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 cursor-pointer bg-transparent"
                                                                                title="Delete payroll record"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                }

                                                                return (
                                                                    <button 
                                                                        onClick={() => openAdjustModal(emp)}
                                                                        disabled={generatingId === emp._id}
                                                                        className="px-5 py-2.5 bg-slate-950 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-amber-600 transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-slate-950/10 flex items-center gap-1.5 ml-auto border-none cursor-pointer"
                                                                    >
                                                                        <Sliders size={13} />
                                                                        Process Pay
                                                                    </button>
                                                                );
                                                            })()}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredEmployees.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4" className="p-10 text-center text-slate-400 font-medium">
                                                            No personnel matching your criteria.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            ) : activeTab === 'all_records' ? (
                                <motion.div 
                                    key="all_records"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">All Company Generated Payrolls</h2>
                                        <p className="text-xs text-slate-500 font-medium">All generated compensation disbursements across staff members.</p>
                                    </div>

                                    {allPayrolls.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {allPayrolls.map((slip) => {
                                                const empName = typeof slip.userId === 'object' ? slip.userId?.name : 'Employee Record';
                                                const empEmail = typeof slip.userId === 'object' ? slip.userId?.email : '';
                                                return (
                                                    <div 
                                                        key={slip._id} 
                                                        className="bg-white rounded-2xl border border-slate-200/60 p-6 flex flex-col justify-between hover:border-slate-400 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                                                    >
                                                        <div className="relative z-10 space-y-4">
                                                            <div className="flex justify-between items-start">
                                                                <div className="space-y-0.5">
                                                                    <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest">{slip.month} {slip.year}</p>
                                                                    <h3 className="text-base font-extrabold text-slate-900">{empName}</h3>
                                                                    <p className="text-xs text-slate-400 font-medium">{empEmail}</p>
                                                                </div>
                                                                <button 
                                                                    onClick={() => handleDelete(slip._id)}
                                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 cursor-pointer bg-transparent"
                                                                    title="Delete payroll record"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>

                                                            <div className="py-2 flex justify-between border-b border-dashed border-slate-100">
                                                                <div>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">NET DISBURSEMENT</p>
                                                                    <p className="text-2xl font-black text-slate-955 tracking-tight">₹{slip.netSalary?.toLocaleString()}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">STATUS</p>
                                                                    <span className="inline-block text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 mt-1">
                                                                        {slip.status || 'Generated'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex justify-between items-center text-xs font-bold text-slate-500 pt-1">
                                                                <span>Cycle ID: PAY-${slip._id.slice(-6).toUpperCase()}</span>
                                                                <button 
                                                                    onClick={() => setSelectedPayslip(slip)}
                                                                    className="flex items-center gap-1.5 text-slate-900 hover:text-amber-600 font-bold bg-transparent border-none cursor-pointer"
                                                                >
                                                                    View Payslip
                                                                    <ChevronRight size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-24 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200/80 flex flex-col items-center">
                                            <TrendingUp size={28} className="text-slate-400 mb-2" />
                                            <h3 className="text-lg font-bold text-slate-900">No Generated Payroll Records</h3>
                                            <p className="text-slate-400 text-xs mt-1">No payroll records have been generated yet in the system.</p>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="payslips"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">Your Payslip Archives</h2>
                                        <p className="text-xs text-slate-500 font-medium">Archived statements of monthly compensation payouts.</p>
                                    </div>

                                    {payrolls.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {payrolls.map((slip) => (
                                                <div 
                                                    key={slip._id} 
                                                    onClick={() => setSelectedPayslip(slip)}
                                                    className="bg-white rounded-2xl border border-slate-200/60 p-6 flex flex-col justify-between hover:border-slate-400 hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden"
                                                >
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-105 z-0"></div>
                                                    
                                                    <div className="relative z-10 space-y-4">
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-0.5">
                                                                <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest">{slip.month} {slip.year}</p>
                                                                <h3 className="text-base font-extrabold text-slate-900">Compensation Slip</h3>
                                                            </div>
                                                            <span className="p-2.5 bg-slate-100 rounded-xl text-slate-500 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                                                                <FileText size={18} />
                                                            </span>
                                                        </div>

                                                        <div className="py-2 flex justify-between border-b border-dashed border-slate-100">
                                                            <div>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">NET DISBURSEMENT</p>
                                                                <p className="text-2xl font-black text-slate-950 tracking-tight">₹{slip.netSalary.toLocaleString()}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">STATUS</p>
                                                                <span className="inline-block text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 mt-1">
                                                                    SETTLED
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between items-center text-xs font-bold text-slate-500 pt-1">
                                                            <span>Cycle ID: PAY-${slip._id.slice(-6).toUpperCase()}</span>
                                                            <div className="flex items-center gap-1.5 text-slate-900 group-hover:text-amber-600 transition-colors">
                                                                View Statement
                                                                <ChevronRight size={14} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-24 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200/80 flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-5 border border-slate-200 shadow-sm">
                                                <TrendingUp size={28} className="text-slate-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 uppercase">No Statements Released</h3>
                                            <p className="text-slate-400 text-xs font-semibold mt-1 max-w-xs mx-auto">
                                                No payslips have been generated for you in this fiscal lifecycle.
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Adjust & Generate Modal */}
            <AnimatePresence>
                {adjustEmployee && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-100 overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800 text-white flex justify-between items-center">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 shadow shadow-amber-500/50 animate-pulse"></span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 font-mono" style={{ color: '#f59e0b' }}>Velora CRM Enterprise</span>
                                    </div>
                                    <h3 className="text-xl font-black uppercase tracking-tight text-white m-0" style={{ color: '#ffffff', margin: 0 }}>Configure Compensation</h3>
                                    <p className="text-xs text-slate-400 font-medium" style={{ color: '#94a3b8', margin: 0 }}>Verify or adjust numbers for {adjustEmployee.name}</p>
                                </div>
                                <button 
                                    onClick={() => setAdjustEmployee(null)}
                                    className="p-2.5 text-slate-400 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-all border-none cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleGenerate} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Base Salary */}
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-xs font-black uppercase tracking-wider block" style={{ color: '#475569' }}>Base Salary (INR)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₹</span>
                                            <input 
                                                type="number"
                                                required
                                                value={baseSalaryInput}
                                                onChange={(e) => setBaseSalaryInput(e.target.value)}
                                                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner"
                                                style={{ color: '#0f172a' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Toggle Auto Attendance */}
                                    <div className="col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4 shadow-sm">
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight" style={{ color: '#1e293b' }}>Auto Attendance Calculation</p>
                                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed" style={{ color: '#64748b' }}>Fetch and calculate present days dynamically from database logs.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={useAutoAttendance} 
                                                onChange={(e) => setUseAutoAttendance(e.target.checked)}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                        </label>
                                    </div>

                                    {/* Present Days */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-black uppercase tracking-wider block" style={{ color: '#475569' }}>Present Days</label>
                                            {useAutoAttendance && <span className="text-[9px] text-amber-600 font-extrabold uppercase" style={{ color: '#d97706' }}>Auto</span>}
                                        </div>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            required
                                            disabled={useAutoAttendance}
                                            value={presentDaysInput}
                                            onChange={(e) => setPresentDaysInput(e.target.value)}
                                            className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold outline-none transition-all shadow-inner ${
                                                useAutoAttendance ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500'
                                            }`}
                                            style={{ color: useAutoAttendance ? '#94a3b8' : '#0f172a' }}
                                        />
                                        <p className="text-[10px] text-slate-400 font-semibold" style={{ color: '#64748b' }}>
                                            {useAutoAttendance ? 'Calculated from hours worked (8h/day) + paid weekends.' : 'Manually input number of paid days.'}
                                        </p>
                                    </div>

                                    {/* Total Days */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-black uppercase tracking-wider block" style={{ color: '#475569' }}>Total Days</label>
                                            {useAutoAttendance && <span className="text-[9px] text-amber-600 font-extrabold uppercase" style={{ color: '#d97706' }}>Auto</span>}
                                        </div>
                                        <input 
                                            type="number"
                                            required
                                            disabled={useAutoAttendance}
                                            value={totalDaysInput}
                                            onChange={(e) => setTotalDaysInput(e.target.value)}
                                            className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold outline-none transition-all shadow-inner ${
                                                useAutoAttendance ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500'
                                            }`}
                                            style={{ color: useAutoAttendance ? '#94a3b8' : '#0f172a' }}
                                        />
                                        <p className="text-[10px] text-slate-400 font-semibold" style={{ color: '#64748b' }}>
                                            {useAutoAttendance ? 'Total calendar days in the current month.' : 'Base divisor for salary calculation.'}
                                        </p>
                                    </div>

                                    {/* Bonus & Allowances */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-wider block" style={{ color: '#475569' }}>Bonus & Allowances</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-sm">+</span>
                                            <input 
                                                type="number"
                                                value={allowancesInput}
                                                onChange={(e) => setAllowancesInput(e.target.value)}
                                                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner text-emerald-600"
                                                style={{ color: '#059669' }}
                                            />
                                        </div>
                                    </div>

                                    {/* LOP & Deductions */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-wider block" style={{ color: '#475569' }}>LOP & Deductions</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-600 font-black text-sm">-</span>
                                            <input 
                                                type="number"
                                                value={deductionsInput}
                                                onChange={(e) => setDeductionsInput(e.target.value)}
                                                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner text-rose-600"
                                                style={{ color: '#e11d48' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Footer & Live Preview */}
                                <div className="border-t border-slate-100 pt-5 flex justify-between items-center bg-slate-50 -mx-6 -mb-6 p-6 shadow-inner rounded-b-3xl">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest" style={{ color: '#94a3b8' }}>PREVIEW DISBURSEMENT</p>
                                        <p className="text-3xl font-black text-slate-900 tracking-tight" style={{ color: '#0f172a' }}>₹{calculatePreviewNet().toLocaleString()}</p>
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={generatingId !== null}
                                        className="px-8 py-3.5 bg-slate-900 hover:bg-amber-600 text-white font-black uppercase tracking-wider text-[11px] rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer border-none"
                                        style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                                    >
                                        {generatingId !== null ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                                        Generate & Mail
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Payslip Details Modal */}
            <AnimatePresence>
                {selectedPayslip && (
                    <div className="fixed inset-0 bg-slate-955/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest">{selectedPayslip.month} {selectedPayslip.year}</p>
                                    <h3 className="text-lg font-extrabold text-slate-950">Compensation Summary Statement</h3>
                                </div>
                                <button 
                                    onClick={() => setSelectedPayslip(null)}
                                    className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition-all border-none cursor-pointer bg-transparent"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">RECIPIENT PERSONNEL</p>
                                        <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">DISBURSEMENT CYCLE</p>
                                        <p className="font-bold text-slate-900 text-sm">{selectedPayslip.month} {selectedPayslip.year}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Cycle ID: PAY-${selectedPayslip._id.slice(-6).toUpperCase()}</p>
                                    </div>
                                </div>

                                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-50/80 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                        Line Item Breakdowns
                                    </div>
                                    <div className="divide-y divide-slate-100 bg-white">
                                        {(() => {
                                            let present = 0;
                                            let total = 31;
                                            try {
                                                const parsed = JSON.parse(selectedPayslip.details);
                                                present = Number(parsed.presentDays) || 0;
                                                total = Number(parsed.totalDays) || 31;
                                            } catch(e) {}

                                            const baseVal = selectedPayslip.baseSalary || 0;
                                            const proratedVal = total > 0 ? Math.round((baseVal / total) * present) : baseVal;
                                            const lopVal = Math.max(0, baseVal - proratedVal);

                                            const basicVal = Math.round(baseVal * 0.50);
                                            const hraVal = Math.round(baseVal * 0.30);
                                            const specialVal = baseVal - basicVal - hraVal;

                                            return (
                                                <>
                                                    <div className="p-3.5 flex justify-between text-xs">
                                                        <span className="font-semibold text-slate-500">Basic Salary (50%)</span>
                                                        <span className="font-bold text-slate-800">₹{basicVal.toLocaleString()}</span>
                                                    </div>
                                                    <div className="p-3.5 flex justify-between text-xs">
                                                        <span className="font-semibold text-slate-500">House Rent Allowance (30%)</span>
                                                        <span className="font-bold text-slate-800">₹{hraVal.toLocaleString()}</span>
                                                    </div>
                                                    <div className="p-3.5 flex justify-between text-xs">
                                                        <span className="font-semibold text-slate-500">Special Allowance (20%)</span>
                                                        <span className="font-bold text-slate-800">₹{specialVal.toLocaleString()}</span>
                                                    </div>
                                                    <div className="p-3.5 flex justify-between text-xs">
                                                        <span className="font-semibold text-slate-500">Performance Allowances & Bonuses</span>
                                                        <span className="font-bold text-emerald-600">+ ₹{(selectedPayslip.allowances || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="p-3.5 flex justify-between text-xs">
                                                        <span className="font-semibold text-slate-500">Loss of Pay (LOP) [{Math.round((total - present) * 100) / 100} Days Absent]</span>
                                                        <span className="font-bold text-red-500">- ₹{lopVal.toLocaleString()}</span>
                                                    </div>
                                                    <div className="p-3.5 flex justify-between text-xs">
                                                        <span className="font-semibold text-slate-500">Statutory Deductions & Taxes</span>
                                                        <span className="font-bold text-red-500">- ₹{(selectedPayslip.deductions || 0).toLocaleString()}</span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-950 text-white rounded-2xl flex justify-between items-center shadow-lg">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NET PAYMENT SETTLED</span>
                                        <span className="text-3xl font-black tracking-tight">₹{selectedPayslip.netSalary.toLocaleString()}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">RELEASE STATUS</span>
                                        <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mt-1 inline-block">
                                            DISBURSED
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                                <button 
                                    onClick={() => handleDownloadPDF(selectedPayslip)}
                                    className="flex-1 py-3.5 bg-slate-950 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-1.5 shadow-xl shadow-slate-950/10 border-none cursor-pointer"
                                >
                                    <Printer size={15} /> 
                                    Print / Save PDF
                                </button>
                                <button 
                                    onClick={() => setSelectedPayslip(null)}
                                    className="px-6 py-3.5 bg-white text-slate-700 rounded-xl font-bold text-xs uppercase border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                   <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-center shadow-2xl border border-slate-200/80">
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                            <Trash2 size={24} />
                        </div>
                        <h2 className="text-lg font-extrabold text-slate-900 mb-1">Delete Payroll Record?</h2>
                        <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">
                            Are you sure you want to delete this payroll disbursement? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                            <button className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors cursor-pointer" onClick={confirmDeletePayroll}>Delete</button>
                        </div>
                   </div>
                </div>
            )}
        </div>
    );
};

export default Payroll;

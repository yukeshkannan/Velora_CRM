import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Zap, AlertCircle, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const usePayroll = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('payslips'); // 'payslips' | 'generate'
    const [employees, setEmployees] = useState([]);
    const [payrolls, setPayrolls] = useState([]);
    const [allPayrolls, setAllPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatingId, setGeneratingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState(null);
    const [modalError, setModalError] = useState('');
    
    // Modal states
    const [adjustEmployee, setAdjustEmployee] = useState(null);
    const [useAutoAttendance, setUseAutoAttendance] = useState(true);
    const [baseSalaryInput, setBaseSalaryInput] = useState('');
    const [presentDaysInput, setPresentDaysInput] = useState('30');
    const [totalDaysInput, setTotalDaysInput] = useState('30');
    const [allowancesInput, setAllowancesInput] = useState('0');
    const [deductionsInput, setDeductionsInput] = useState('0');
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

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
            setEmployees(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch employees", err);
        }
    };

    const fetchMyPayroll = async () => {
        if (!user || !user.id) return;
        try {
            setLoading(true);
            const res = await axios.get(`/api/payroll?userId=${user.id}`);
            setPayrolls(res.data.data || []);
        } catch (err) {
            console.error("Fetch payroll error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllPayrolls = async () => {
        try {
            const res = await axios.get('/api/payroll');
            setAllPayrolls(res.data.data || []);
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
            if (day === 0 || day === 6) {
                weekends++;
            }
            date.setDate(date.getDate() + 1);
        }
        return weekends;
    };

    const openAdjustModal = async (emp) => {
        setAdjustEmployee(emp);
        setModalError('');
        setBaseSalaryInput(String(emp.salary?.base || 0));
        setUseAutoAttendance(true);
        setAllowancesInput('0');
        setDeductionsInput('0');

        const today = new Date();
        const currentMonthIndex = today.getMonth();
        const currentYear = today.getFullYear();
        const totalCalendarDays = getDaysInMonth(currentMonthIndex, currentYear);
        
        setTotalDaysInput(String(totalCalendarDays));
        setPresentDaysInput('0');

        try {
            const empId = emp._id || emp.id;
            if (!empId) {
                setPresentDaysInput('0');
                return;
            }
            const res = await axios.get(`/api/attendance?userId=${empId}`);
            const logs = res.data.data || [];
            
            const monthlyLogs = logs.filter(log => {
                const logUserId = typeof log.userId === 'object' && log.userId !== null ? (log.userId._id || log.userId.id) : log.userId;
                if (String(logUserId) !== String(empId)) return false;

                const logDate = new Date(log.date);
                return logDate.getMonth() === currentMonthIndex && logDate.getFullYear() === currentYear;
            });

            if (monthlyLogs.length === 0) {
                setPresentDaysInput('0');
            } else {
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
                        const logDate = new Date(log.date);
                        logDate.setHours(0, 0, 0, 0);
                        
                        if (logDate.getTime() < todayDate.getTime()) {
                            hours = 8.0;
                        } else {
                            const checkInTime = new Date(log.checkIn);
                            hours = (Date.now() - checkInTime) / (1000 * 60 * 60);
                            if (hours < 0) hours = 0;
                            if (hours > 8.0) hours = 8.0;
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
            const targetUserId = adjustEmployee._id || adjustEmployee.id;
            setGeneratingId(targetUserId);
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
                userId: targetUserId,
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

            await axios.post('/api/payroll/generate', payload);
            
            setNotification({ type: 'success', message: `Payroll generated for ${adjustEmployee.name}` });
            setModalError('');
            setAdjustEmployee(null);
            setGeneratingId(null);
            fetchAllPayrolls();
            
            if ((user.id || user._id) === targetUserId) {
                fetchMyPayroll(); 
            }
        } catch (err) {
            console.error("Generate Payroll Error:", err);
            const errMsg = err.response?.data?.message || 'Generation failed';
            setModalError(errMsg);
            setNotification({ type: 'error', message: errMsg });
            setGeneratingId(null);
        }
    };

    const confirmDeletePayroll = async () => {
        if (!showDeleteConfirm) return;
        try {
            setLoading(true);
            await axios.delete(`/api/payroll/${showDeleteConfirm}`);
            toast.success('Payroll record deleted successfully');
            setShowDeleteConfirm(null);
            await fetchAllPayrolls();
            if (user?.id) {
                await fetchMyPayroll();
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

        let presentDays = 0;
        let totalDays = 31;
        if (slip.details) {
            try {
                const parsed = JSON.parse(slip.details);
                presentDays = Number(parsed.presentDays) || 0;
                totalDays = Number(parsed.totalDays) || 31;
            } catch(e) {}
        }

        const empDetails = (typeof slip.userId === 'object' && slip.userId) ? slip.userId : user;
        const empName = empDetails.name || 'Staff Member';
        const empEmail = empDetails.email || '';
        const empRole = empDetails.role === 'Admin' ? 'Executive Owner' : (empDetails.role || 'Employee');
        const empDept = empDetails.department || 'General Operations';
        const empDesignation = empDetails.designation || (empDetails.role === 'Admin' ? 'Director' : 'Technical Staff');

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
                        body { font-family: 'Inter', -apple-system, sans-serif; padding: 10px; margin: 0; background: #fff; color: #1e293b; }
                        .payslip-container { padding: 30px; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-sizing: border-box; width: 680px; margin: 0 auto; }
                        .header-row { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 25px; }
                        .brand { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
                        .company-info { font-size: 9px; color: #64748b; margin-top: 4px; line-height: 1.4; }
                        .doc-info { text-align: right; }
                        .doc-info h1 { margin: 0; font-size: 9px; font-weight: 800; color: #64748b; letter-spacing: 2px; text-transform: uppercase; }
                        .doc-info p { margin: 4px 0 0; font-size: 16px; font-weight: 800; color: #0f172a; }
                        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px; }
                        .meta-table td { padding: 8px 10px; border: 1px solid #f1f5f9; }
                        .meta-table td.lbl { font-weight: 700; color: #64748b; background: #f8fafc; width: 20%; }
                        .meta-table td.val { font-weight: 600; color: #334155; width: 30%; }
                        .item-table { width: 100%; border-collapse: collapse; font-size: 11px; }
                        .item-table th { text-align: left; padding: 10px; font-weight: 800; color: #475569; background: #f1f5f9; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; }
                        .item-table td { padding: 10px; font-weight: 500; border-bottom: 1px solid #f1f5f9; color: #334155; }
                        .item-table tr.total-row td { background: #f8fafc; border-top: 2px solid #e2e8f0; border-bottom: 2px solid #e2e8f0; }
                    </style>
                </head>
                <body>
                    <div class="payslip-container">
                        <div class="header-row">
                            <div>
                                <div class="brand">VELORA</div>
                                <div class="company-info">Velora Private Limited<br/>Corporate Headquarters: 100 Tech Park, Suite 400<br/>CIN: U72200TN2026PTC123456 | GSTIN: 33AAACV1234F1Z5</div>
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
                                            <tr><th>Earnings</th><th style="text-align: right;">Amount (INR)</th></tr>
                                        </thead>
                                        <tbody>
                                            <tr><td>Basic Salary (50%)</td><td style="text-align: right;">₹${basicVal.toLocaleString()}</td></tr>
                                            <tr><td>House Rent Allowance (30%)</td><td style="text-align: right;">₹${hraVal.toLocaleString()}</td></tr>
                                            <tr><td>Special Allowance (20%)</td><td style="text-align: right;">₹${specialVal.toLocaleString()}</td></tr>
                                            <tr><td>Performance Incentives</td><td style="text-align: right; color: #10b981;">+ ₹${allowancesVal.toLocaleString()}</td></tr>
                                            <tr class="total-row"><td style="font-weight: bold; color: #0f172a;">Gross Earnings</td><td style="text-align: right; font-weight: bold; color: #0f172a;">₹${(baseVal + allowancesVal).toLocaleString()}</td></tr>
                                        </tbody>
                                    </table>
                                </td>
                                <td style="width: 48%; vertical-align: top; padding-left: 12px; border: none;">
                                    <table class="item-table">
                                        <thead>
                                            <tr><th>Deductions</th><th style="text-align: right;">Amount (INR)</th></tr>
                                        </thead>
                                        <tbody>
                                            <tr><td>Loss of Pay (LOP)</td><td style="text-align: right; color: #ef4444;">- ₹${lopVal.toLocaleString()}</td></tr>
                                            <tr><td>Statutory Taxes & Deductions</td><td style="text-align: right; color: #ef4444;">- ₹${deductionsVal.toLocaleString()}</td></tr>
                                            <tr class="total-row"><td style="font-weight: bold; color: #0f172a;">Total Deductions</td><td style="text-align: right; font-weight: bold; color: #ef4444;">- ₹${(lopVal + deductionsVal).toLocaleString()}</td></tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        <div style="margin-top: 25px; background: #0f172a; color: #fff; padding: 22px; border-radius: 12px;">
                            <table style="width: 100%; border-collapse: collapse; border: none;">
                                <tr style="border: none;">
                                    <td style="border: none; padding: 0; color: #fff;">
                                        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Net Salary Payable</div>
                                        <div style="font-size: 26px; font-weight: 900; margin-top: 4px;">₹${netVal.toLocaleString()}</div>
                                        <div style="font-size: 10px; color: #94a3b8; font-style: italic; margin-top: 6px;">In Words: ${netSalaryWords}</div>
                                    </td>
                                    <td style="border: none; padding: 0; text-align: right; color: #fff; vertical-align: middle;">
                                        <div style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px;">Release Status</div>
                                        <div style="font-size: 13px; font-weight: 800; color: #10b981; margin-top: 4px;">PAID & SETTLED</div>
                                    </td>
                                </tr>
                            </table>
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
        const staffProcessed = allPayrolls.filter(p => 
            String(p.month).toLowerCase() === String(currentMonth).toLowerCase() && 
            Number(p.year) === Number(currentYear)
        );
        const processedUserIds = new Set(staffProcessed.map(p => {
            const id = typeof p.userId === 'object' && p.userId !== null ? p.userId._id : p.userId;
            return String(id);
        }));
        const awaitingCount = staffMembers.filter(emp => !processedUserIds.has(String(emp._id || emp.id))).length;
        awaitingProcessValue = `${awaitingCount > 0 ? awaitingCount : 0} Staff`;
    } else {
        const hasCurrentPayroll = payrolls.some(p => 
            String(p.month).toLowerCase() === String(currentMonth).toLowerCase() && 
            Number(p.year) === Number(currentYear)
        );
        awaitingProcessValue = hasCurrentPayroll ? "Processed" : "Pending Release";
    }

    const lastDayDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const scheduledPaymentValue = lastDayDate.toLocaleDateString('default', { month: 'short', day: 'numeric' });

    const stats = [
        { label: 'Total Budget Disbursed', value: formatCurrency(totalDisbursed), icon: Zap, color: 'from-emerald-500 to-emerald-600', textColor: 'text-emerald-500', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
        { label: 'Pending Processing', value: awaitingProcessValue, icon: AlertCircle, color: 'from-amber-500 to-amber-600', textColor: 'text-amber-500', bg: 'bg-amber-50/50', border: 'border-amber-100' },
        { label: 'Scheduled Pay Cycle', value: scheduledPaymentValue, icon: Calendar, color: 'from-blue-500 to-blue-600', textColor: 'text-blue-500', bg: 'bg-blue-50/50', border: 'border-blue-100' },
    ];

    const calculatePreviewNet = () => {
        const base = Number(baseSalaryInput) || 0;
        const allowances = Number(allowancesInput) || 0;
        const deductions = Number(deductionsInput) || 0;
        const present = Number(presentDaysInput) || 0;
        const total = Number(totalDaysInput) || 0;
        const perDay = total > 0 ? base / total : 0;
        return Math.round(perDay * present) + allowances - deductions;
    };

    return {
        user,
        activeTab,
        setActiveTab,
        employees,
        payrolls,
        allPayrolls,
        loading,
        generatingId,
        searchTerm,
        setSearchTerm,
        notification,
        modalError,
        adjustEmployee,
        setAdjustEmployee,
        useAutoAttendance,
        setUseAutoAttendance,
        baseSalaryInput,
        setBaseSalaryInput,
        presentDaysInput,
        setPresentDaysInput,
        totalDaysInput,
        setTotalDaysInput,
        allowancesInput,
        setAllowancesInput,
        deductionsInput,
        setDeductionsInput,
        selectedPayslip,
        setSelectedPayslip,
        showDeleteConfirm,
        setShowDeleteConfirm,
        isPayrollManager,
        filteredEmployees,
        currentMonth,
        currentYear,
        stats,
        openAdjustModal,
        handleGenerate,
        confirmDeletePayroll,
        handleDownloadPDF,
        calculatePreviewNet
    };
};

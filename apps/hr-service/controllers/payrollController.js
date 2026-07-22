const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const axios = require('axios');

// Helper to get user details from Auth Service
// For simplicity, we might assume the frontend passes necessary salary info,
// OR we fetch it from Auth service. Let's try to fetch if possible, or expect it in body.
// Better approach for MPV: Admin sends the base salary info or we assume it's stored in User model.

const { sendPayslipEmail } = require('../utils/emailService');
const User = require('../models/User'); // We need User model to get email/name

exports.generatePayroll = async (req, res) => {
  try {
    const { userId, month, year, baseSalary, presentDays, totalDays } = req.body;

    if (!userId || !baseSalary) {
        console.warn(`[Payroll Generate] Missing fields. userId: ${userId}, baseSalary: ${baseSalary}`);
        return res.status(400).json({ success: false, message: "User ID and Base Salary required" });
    }

    // Check if payroll already exists
    const existing = await Payroll.findOne({ userId, month, year });
    if (existing) {
         console.warn(`[Payroll Generate] Already exists for User ${userId} in ${month} ${year}`);
         return res.status(400).json({ success: false, message: `Payroll for ${month} ${year} already generated.` });
    }

    // Month mapping helper
    const monthMap = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
      'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
    };

    const getDaysInMonth = (monthStr, yearVal) => {
      const monthIndex = monthMap[monthStr];
      if (monthIndex === undefined) return 30;
      return new Date(yearVal, monthIndex + 1, 0).getDate();
    };

    const getWeekendDaysInMonth = (monthStr, yearVal) => {
      const monthIndex = monthMap[monthStr];
      if (monthIndex === undefined) return 8;
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

    // Calculate present and total days dynamically
    let calculatedTotalDays = totalDays !== undefined ? Number(totalDays) : getDaysInMonth(month, year);
    let calculatedPresentDays;

    if (presentDays !== undefined) {
        calculatedPresentDays = Number(presentDays);
    } else {
        // Calculate dynamically from attendance records
        const attendanceRecords = await Attendance.find({ userId });
        const monthIndex = monthMap[month];
        
        const monthlyAttendance = attendanceRecords.filter(r => {
            const d = new Date(r.date);
            return d.getMonth() === monthIndex && d.getFullYear() === Number(year);
        });

        if (monthlyAttendance.length === 0) {
            calculatedPresentDays = 0; // Default to 0 if no records exist for this month
        } else {
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);

            const totalHoursWorked = monthlyAttendance.reduce((sum, record) => {
                const status = record.status || 'Present';
                if (status === 'Leave') {
                    return sum + 8.0; // Paid leave is counted as full day (8 hours)
                }
                
                let hours = 0;
                if (record.checkOut) {
                    hours = Number(record.totalHours) || 0;
                    if (hours === 0) {
                        if (status === 'Present') hours = 8.0;
                        else if (status === 'Half-Day') hours = 4.0;
                    }
                } else {
                    // Active session
                    const recordDate = new Date(record.date);
                    recordDate.setHours(0, 0, 0, 0);
                    
                    if (recordDate.getTime() < todayDate.getTime()) {
                        // Forgot checkout on past day
                        hours = 8.0;
                    } else {
                        // Today's active session - calculate elapsed hours
                        const checkInTime = new Date(record.checkIn);
                        hours = (Date.now() - checkInTime) / (1000 * 60 * 60);
                        if (hours < 0) hours = 0;
                        if (hours > 8.0) hours = 8.0; // Cap at normal workday
                    }
                }
                return sum + hours;
            }, 0);

            if (totalHoursWorked === 0) {
                calculatedPresentDays = 0;
            } else {
                const weekendDays = getWeekendDaysInMonth(month, year);
                const totalBusinessDays = calculatedTotalDays - weekendDays;
                const totalBusinessHours = totalBusinessDays * 8.0;
                const ratio = totalHoursWorked / totalBusinessHours;
                calculatedPresentDays = ratio * calculatedTotalDays;
                if (calculatedPresentDays > calculatedTotalDays) {
                    calculatedPresentDays = calculatedTotalDays;
                }
                calculatedPresentDays = Math.round(calculatedPresentDays * 100) / 100;
            }
        }
    }

    const reqAllowances = Number(req.body.allowances) || 0;
    const reqDeductions = Number(req.body.deductions) || 0;

    // Calculate Net Salary
    let netSalary = Number(baseSalary);
    if (calculatedTotalDays > 0) {
        const perDay = Number(baseSalary) / Number(calculatedTotalDays);
        netSalary = perDay * Number(calculatedPresentDays);
    }
    netSalary = netSalary + reqAllowances - reqDeductions;
    
    // Create Record
    const payroll = await Payroll.create({
        userId,
        month,
        year,
        baseSalary: Number(baseSalary),
        allowances: reqAllowances,
        deductions: reqDeductions,
        netSalary: Math.round(netSalary),
        status: 'Generated',
        details: JSON.stringify({ presentDays: calculatedPresentDays, totalDays: calculatedTotalDays })
    });

    // Fetch user details for email
    const user = await User.findById(userId);
    
    if (user && user.email) {
        // Send Email asynchronously (don't block response)
        try {
            let perDay = 0;
            if (calculatedTotalDays > 0) perDay = Number(baseSalary) / Number(calculatedTotalDays);

            sendPayslipEmail(
                user.email, 
                user.name, 
                month, 
                year, 
                Math.round(netSalary), 
                Number(baseSalary), 
                calculatedPresentDays, 
                calculatedTotalDays, 
                perDay
            )
                .then(success => console.log(`Email sent status: ${success}`))
                .catch(err => console.error("Email send failed promise", err));
        } catch (syncErr) {
            console.error("Email send trigger failed", syncErr);
        }
    } else {
        console.warn("User not found or no email, skipping email notification.");
    }

    res.status(201).json({ success: true, data: payroll, message: 'Payroll generated and email sent.' });

  } catch (error) {
    console.error("Generate Payroll Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPayroll = async (req, res) => {
    try {
        const { userId } = req.query;
        let query = {};
        if (userId) query.userId = userId;

        const records = await Payroll.find(query).populate('userId').sort({ year: -1, createdAt: -1 });
        res.json({ success: true, data: records });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deletePayroll = async (req, res) => {
    try {
        const { id } = req.params;
        const payroll = await Payroll.findByIdAndDelete(id);

        if (!payroll) {
            return res.status(404).json({ success: false, message: 'Payroll record not found' });
        }

        res.status(200).json({ success: true, message: 'Payroll deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

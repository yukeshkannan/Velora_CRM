const Leave = require('../models/Leave');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { sendLeaveApplicationEmail, sendLeaveDecisionEmail } = require('../utils/emailService');

// Apply for leave (Staff / Employee)
exports.applyLeave = async (req, res) => {
    try {
        const { userId, leaveType, startDate, endDate, durationType, halfDaySession, shortLeaveHours, reason } = req.body;
        const effectiveUserId = userId || req.headers['x-user-id'] || req.user?.id || req.user?._id;

        if (!effectiveUserId || !startDate || !reason) {
            return res.status(400).json({ success: false, message: 'Please provide user ID, start date, and reason' });
        }

        const leave = await Leave.create({
            userId: effectiveUserId,
            leaveType: leaveType || 'Casual Leave',
            startDate,
            endDate: endDate || startDate,
            durationType: durationType || 'Full Day',
            halfDaySession: halfDaySession || 'N/A',
            shortLeaveHours: shortLeaveHours || 'N/A',
            reason,
            status: 'Pending'
        });

        let populatedLeave = leave;
        try {
            populatedLeave = await Leave.findById(leave._id).populate('userId', 'name email department role');
        } catch (popErr) {
            console.warn("[HR Service] Populate user in Leave failed:", popErr.message);
        }

        // Send automated notification email to Admin / HR
        try {
            const adminEmail = process.env.HR_ADMIN_EMAIL || process.env.SENDER_EMAIL || 'yukesh785.in@gmail.com';
            let applicantUser = populatedLeave?.userId;
            if (!applicantUser || typeof applicantUser !== 'object') {
                applicantUser = await User.findById(effectiveUserId).select('name email department role').lean().catch(() => null);
            }
            const employeeName = applicantUser?.name || 'Employee';
            const employeeEmail = applicantUser?.email || '';

            await sendLeaveApplicationEmail({
                adminEmail,
                employeeName,
                employeeEmail,
                leaveType: leave.leaveType,
                startDate: leave.startDate,
                endDate: leave.endDate,
                durationType: leave.durationType,
                halfDaySession: leave.halfDaySession,
                shortLeaveHours: leave.shortLeaveHours,
                reason: leave.reason
            });
        } catch (mailErr) {
            console.error("[HR Service] Failed to send leave application notification:", mailErr.message);
        }

        res.status(201).json({ success: true, data: populatedLeave || leave, message: 'Leave request submitted successfully' });
    } catch (error) {
        console.error("Apply Leave Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get all leaves (or filtered by userId)
exports.getLeaves = async (req, res) => {
    try {
        const { userId } = req.query;
        let query = {};
        if (userId && userId !== 'undefined' && userId !== 'null' && String(userId).trim() !== '') {
            query.userId = String(userId).trim();
        }

        const leaves = await Leave.find(query)
            .populate('userId', 'name email department role')
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: leaves });
    } catch (error) {
        console.error("Get Leaves Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Leave Status (Approve / Reject by Admin or HR)
exports.updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reviewedBy, adminComment } = req.body;

        if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        const leave = await Leave.findByIdAndUpdate(
            id,
            { status, reviewedBy, adminComment: adminComment || '' },
            { new: true }
        ).populate('userId', 'name email department role');

        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave request not found' });
        }

        // If Approved, create/update attendance records so salary is NOT deducted
        if (status === 'Approved' && leave.userId) {
            const userId = leave.userId._id || leave.userId;
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate || leave.startDate);

            const isWFH = leave.leaveType?.includes('Work From Home') || leave.leaveType?.includes('WFH');
            const isHalfDay = leave.durationType === 'Half Day';
            
            const attendanceStatus = isWFH ? 'Present' : (isHalfDay ? 'Half-Day' : 'Leave');
            const hoursLogged = isHalfDay ? 4.0 : 8.0;

            const curr = new Date(start);
            while (curr <= end) {
                const dayStart = new Date(curr);
                dayStart.setHours(0, 0, 0, 0);

                const existingAtt = await Attendance.findOne({
                    userId,
                    date: {
                        $gte: dayStart,
                        $lt: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
                    }
                });

                if (!existingAtt) {
                    await Attendance.create({
                        userId,
                        date: dayStart,
                        checkIn: dayStart,
                        checkOut: new Date(dayStart.getTime() + hoursLogged * 60 * 60 * 1000),
                        status: attendanceStatus,
                        totalHours: hoursLogged
                    });
                } else {
                    existingAtt.status = attendanceStatus;
                    existingAtt.totalHours = Math.max(existingAtt.totalHours || 0, hoursLogged);
                    await existingAtt.save();
                }

                curr.setDate(curr.getDate() + 1);
            }
        }

        // Send decision notification email to Employee
        try {
            let applicantUser = leave.userId;
            if (applicantUser && typeof applicantUser !== 'object') {
                applicantUser = await User.findById(applicantUser).select('name email').lean().catch(() => null);
            }
            if (applicantUser && applicantUser.email) {
                await sendLeaveDecisionEmail({
                    employeeEmail: applicantUser.email,
                    employeeName: applicantUser.name || 'Employee',
                    leaveType: leave.leaveType,
                    startDate: leave.startDate,
                    endDate: leave.endDate,
                    durationType: leave.durationType,
                    status: leave.status,
                    adminComment: leave.adminComment
                });
            }
        } catch (mailErr) {
            console.error("[HR Service] Failed to send leave decision notification:", mailErr.message);
        }

        res.json({ success: true, data: leave, message: `Leave request ${status.toLowerCase()} successfully.` });
    } catch (error) {
        console.error("Update Leave Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Leave Request
exports.deleteLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const leave = await Leave.findByIdAndDelete(id);

        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave request not found' });
        }

        res.json({ success: true, message: 'Leave request deleted successfully' });
    } catch (error) {
        console.error("Delete Leave Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

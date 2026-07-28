const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    leaveType: {
        type: String,
        default: 'Casual Leave',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    durationType: {
        type: String,
        enum: ['Full Day', 'Half Day', 'Short Leave'],
        default: 'Full Day'
    },
    halfDaySession: {
        type: String,
        enum: ['First Half (Morning)', 'Second Half (Afternoon)', 'N/A'],
        default: 'N/A'
    },
    shortLeaveHours: {
        type: String,
        default: 'N/A'
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    adminComment: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);

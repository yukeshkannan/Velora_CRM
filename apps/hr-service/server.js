const express = require('express');
const cors = require('cors');
const { correlationLogger } = require('../../packages/utils');
const { connectDB } = require('../../packages/database');
const startUserEventConsumer = require('./jobs/userEventConsumer');
require('dotenv').config();

// Register Models
require('./models/User');
require('./models/Attendance');
require('./models/Payroll');
require('./models/Leave');

const app = express();
const PORT = process.env.PORT || 5012; 

// Middleware
app.use(cors());
app.use(express.json());
app.use(correlationLogger('HR-Service'));

// Health Checks
app.get('/health', (req, res) => res.json({ status: 'UP', service: 'HR-Service', timestamp: new Date() }));
app.get('/api/hr/health', (req, res) => res.json({ status: 'UP', service: 'HR-Service', timestamp: new Date() }));

// Routes
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/leave', require('./routes/leaveRoutes'));

// Connect to Database and Start Server
const startServer = async () => {
    try {
        await connectDB(process.env.HR_MONGO_URI || process.env.MONGO_URI, 'hr-service');
        startUserEventConsumer();
        app.listen(PORT, () => console.log(`HR Service running on port ${PORT}`));
    } catch (err) {
        console.error('Failed to start HR Service:', err);
    }
};

startServer();

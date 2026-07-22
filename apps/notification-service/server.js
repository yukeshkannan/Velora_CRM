const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const notificationRoutes = require('./routes/notificationRoutes');
const initScheduledJobs = require('./jobs/checkOverdueTasks');
const startEmailConsumer = require('./jobs/emailConsumer');

const { correlationLogger } = require('../../packages/utils');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(correlationLogger('Notification-Service'));

// Mount routers
app.use('/api/notifications', notificationRoutes);

// Start Scheduler
initScheduledJobs();

// Start RabbitMQ Consumer
startEmailConsumer();

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});

const cron = require('node-cron');
const axios = require('axios');
const { sendEmail } = require('../utils/emailProvider');

// Cron Job: Check for Overdue/Pending Tasks
// Schedule: Every Friday at 9:00 AM
const initScheduledJobs = () => {
  console.log('[Notification-Service] Scheduler initialized: Checking pending tasks every Friday at 9:00 AM');
  
  cron.schedule('0 9 * * 5', async () => {
    console.log('[Notification-Service] Scheduled job triggered: Checking pending tasks...');
    try {
      const response = await axios.get('http://task-service:5004/api/tasks');
      
      if (!response.data.success) {
        throw new Error('Failed to fetch tasks');
      }

      const tasks = response.data.data;
      const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress');

      console.log(`[Notification-Service] Processing ${pendingTasks.length} pending task reminders.`);

      for (const task of pendingTasks) {
          const adminEmail = process.env.SENDER_EMAIL; 
          
          if (adminEmail) {
            const subject = `Reminder: Task "${task.title}" is ${task.status}`;
            const html = `
                <h3>Task Reminder</h3>
                <p>Hello,</p>
                <p>The following task is currently <b>${task.status}</b>:</p>
                <ul>
                    <li><b>Title:</b> ${task.title}</li>
                    <li><b>Priority:</b> ${task.priority}</li>
                    <li><b>Due Date:</b> ${task.dueDate ? new Date(task.dueDate).toDateString() : 'No Due Date'}</li>
                </ul>
                <p>Please update the status in Velora CRM.</p>
            `;
            await sendEmail(adminEmail, subject, html);
          }
      }
      
    } catch (error) {
      console.error('[Notification-Service] Task scheduler error:', error.message);
    }
  });
};

module.exports = initScheduledJobs;


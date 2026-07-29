const Task = require('../models/Task');
const { formatResponse } = require('../../../packages/utils');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Public
exports.getTasks = async (req, res) => {
  try {
    console.log("GET /api/tasks Request Query:", req.query);
    const { contactId, assignedTo } = req.query;
    let query = {};
    if (contactId) query.contactId = contactId;
    if (assignedTo) query.assignedTo = assignedTo;

    console.log("Constructed MongoDB Query:", JSON.stringify(query));

    const tasks = await Task.find(query).sort({ dueDate: 1 }); 
    console.log(`Found ${tasks.length} tasks matching query.`);
    
    formatResponse(res, 200, 'Tasks retrieved successfully', tasks);
  } catch (err) {
    console.error("GET TASKS ERROR:", err);
    formatResponse(res, 500, 'Server Error', err.message);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Public
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return formatResponse(res, 404, 'Task not found');
    }

    formatResponse(res, 200, 'Task retrieved successfully', task);
  } catch (err) {
    formatResponse(res, 500, 'Server Error', err.message);
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Public
exports.createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);
    formatResponse(res, 201, 'Task created successfully', task);
  } catch (err) {
    formatResponse(res, 400, 'Invalid data', err.message);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Public
exports.updateTask = async (req, res) => {
  try {
    const originalTask = await Task.findById(req.params.id);

    if (!originalTask) {
      return formatResponse(res, 404, 'Task not found');
    }

    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Check for status change or assignment change
    if (task.assignedTo && (
        originalTask.status !== task.status || 
        originalTask.assignedTo?.toString() !== task.assignedTo.toString()
    )) {
        try {
            // Lazy load User model to avoid circular dependency issues or just path issues
             // We access the User model from auth-service (Monorepo shortcut)
             // In a real microservice, we would request user details from Auth Service API
            const User = require('../../auth-service/models/User'); 
            const assignedUser = await User.findById(task.assignedTo);

            if (assignedUser && assignedUser.email) {
                const axios = require('axios');
                const { publishToQueue } = require('../../../packages/utils');
                const subject = `📋 Task Stage Updated: ${task.title}`;
                const message = `
                    <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                        <h2 style="color: #0f172a; margin-top: 0;">Task Stage Updated</h2>
                        <p style="color: #475569; font-size: 14px;">Hello <strong>${assignedUser.name}</strong>,</p>
                        <p style="color: #475569; font-size: 14px;">The task assigned to you has been updated:</p>
                        <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                            <p style="margin: 4px 0;"><strong>Task Title:</strong> ${task.title}</p>
                            <p style="margin: 4px 0;"><strong>Stage:</strong> <span style="color: #0284c7; font-weight: bold;">${task.status}</span> (previously ${originalTask.status})</p>
                            <p style="margin: 4px 0;"><strong>Priority:</strong> ${task.priority || 'Medium'}</p>
                        </div>
                        <p style="color: #64748b; font-size: 12px;">Log in to Velora CRM Tasks to view full details.</p>
                    </div>
                `;

                const emailPayload = {
                    to: assignedUser.email,
                    subject,
                    message
                };

                const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005';
                const fallbackSend = () => axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/email`, emailPayload);

                publishToQueue('email_notifications', emailPayload, fallbackSend)
                    .then(() => console.log(`[Task Service] Notification handled for ${assignedUser.email}`))
                    .catch(err => console.error("Failed to handle notification:", err.message));
            }
        } catch (noteErr) {
            console.error("Notification Error:", noteErr.message);
        }
    }

    formatResponse(res, 200, 'Task updated successfully', task);
  } catch (err) {
    formatResponse(res, 500, 'Server Error', err.message);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Public
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return formatResponse(res, 404, 'Task not found');
    }

    await task.deleteOne();

    formatResponse(res, 200, 'Task deleted successfully', {});
  } catch (err) {
    formatResponse(res, 500, 'Server Error', err.message);
  }
};

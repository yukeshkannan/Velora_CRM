const Ticket = require('../models/Ticket');
const axios = require('axios');
const { publishToQueue } = require('../../../packages/utils');

// Helper to look up ticket recipient email
const getRecipientEmail = async (ticket) => {
    let email = ticket.guestEmail || ticket.email || ticket.userEmail || ticket.contactEmail;
    if (!email && ticket.customerId) {
        try {
            const CONTACT_SERVICE_URL = process.env.CONTACT_SERVICE_URL || 'http://localhost:5002';
            const contactRes = await axios.get(`${CONTACT_SERVICE_URL}/api/contacts/${ticket.customerId}`);
            if (contactRes.data?.data?.email) {
                email = contactRes.data.data.email;
            }
        } catch (e) {
            // silent catch
        }
    }
    return email;
};

// Helper function to generate rich, state-aware HTML email for tickets
const generateTicketEmailHTML = (ticket) => {
    const ref = ticket._id ? ticket._id.toString().slice(-6).toUpperCase() : 'TICK';
    const title = ticket.title || 'Support Request';
    const status = ticket.status || 'Open';
    const priority = ticket.priority || 'Medium';

    let statusBg = '#eff6ff';
    let statusText = '#2563eb';
    let statusBorder = '#bfdbfe';
    let statusHeaderLabel = 'TICKET LOGGED';
    let statusMessage = `Your support ticket <strong>"${title}"</strong> has been logged into our support queue. Our technical team is inspecting your request.`;

    if (status === 'In Progress') {
        statusBg = '#fffbeb';
        statusText = '#d97706';
        statusBorder = '#fde68a';
        statusHeaderLabel = 'IN PROGRESS';
        statusMessage = `Your support ticket <strong>"${title}"</strong> is now actively being worked on by our support team.`;
    } else if (status === 'Resolved') {
        statusBg = '#ecfdf5';
        statusText = '#059669';
        statusBorder = '#a7f3d0';
        statusHeaderLabel = 'TICKET RESOLVED';
        statusMessage = `Your support ticket <strong>"${title}"</strong> has been marked as <strong>Resolved</strong>. If you need any further assistance, please open a follow-up ticket!`;
    } else if (status === 'Closed') {
        statusBg = '#f1f5f9';
        statusText = '#475569';
        statusBorder = '#cbd5e1';
        statusHeaderLabel = 'TICKET CLOSED';
        statusMessage = `Your support ticket <strong>"${title}"</strong> has been closed. Thank you for using Velora Support.`;
    } else if (status === 'Rejected' || status === 'Cancelled') {
        statusBg = '#fef2f2';
        statusText = '#dc2626';
        statusBorder = '#fecaca';
        statusHeaderLabel = 'TICKET REJECTED';
        statusMessage = `Your support ticket <strong>"${title}"</strong> was reviewed and marked as <strong>${status}</strong>. Please check details or contact support for further information.`;
    }

    return `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 16px; color: #0f172a;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.05);">
                
                <div style="background: linear-gradient(135deg, #09090b 0%, #1e293b 100%); padding: 32px 36px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td>
                                <div style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">Velora<span style="color: #6366f1;">.</span></div>
                                <div style="color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; margin-top: 4px;">Support Desk</div>
                            </td>
                            <td style="text-align: right; vertical-align: middle;">
                                <span style="background-color: ${statusBg}; color: ${statusText}; border: 1px solid ${statusBorder}; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.8px; display: inline-block;">
                                    ${statusHeaderLabel}
                                </span>
                            </td>
                        </tr>
                    </table>
                </div>

                <div style="padding: 36px;">
                    <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">Support Ticket Update,</h2>
                    <p style="font-size: 14px; color: #475569; line-height: 1.65; margin: 0 0 24px 0;">${statusMessage}</p>
                    
                    <div style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 24px;">
                        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                            <tr>
                                <td style="color: #64748b; padding: 6px 0; font-weight: 500;">Ticket Reference:</td>
                                <td style="font-weight: 800; color: #0f172a; text-align: right; padding: 6px 0;">#${ref}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; padding: 6px 0; font-weight: 500;">Subject:</td>
                                <td style="font-weight: 800; color: #0f172a; text-align: right; padding: 6px 0;">${title}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; padding: 6px 0; font-weight: 500;">Priority:</td>
                                <td style="font-weight: 800; color: #0f172a; text-align: right; padding: 6px 0;">${priority}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; padding: 6px 0; font-weight: 500;">Current Status:</td>
                                <td style="font-weight: 800; color: ${statusText}; text-align: right; padding: 6px 0;">${status}</td>
                            </tr>
                        </table>
                    </div>

                    ${ticket.description ? `
                        <div style="margin-bottom: 24px;">
                            <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Ticket Description</div>
                            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; font-size: 13px; color: #334155; line-height: 1.6;">
                                ${ticket.description}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div style="background-color: #f8fafc; padding: 24px 36px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                    <p style="margin: 0 0 4px 0; font-weight: 500;">This automated notification was dispatched via RabbitMQ Event Bus.</p>
                    <p style="margin: 0;">© 2026 Velora Technologies. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Public
exports.getTickets = async (req, res) => {
  try {
    console.log('[Ticket Service] Fetching tickets...');
    const { email, customerId, assignedTo } = req.query;
    let query = {};

    if (email && String(email).trim() !== '') {
      const emailRegex = new RegExp('^' + String(email).trim() + '$', 'i');
      query.$or = [
        { guestEmail: emailRegex },
        { email: emailRegex },
        { userEmail: emailRegex }
      ];
    }
    
    if (customerId) query.customerId = customerId;
    if (assignedTo) query.assignedTo = assignedTo;

    const searchTerm = req.query.search || req.query.q;
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i');
      const searchOr = [
        { title: regex },
        { description: regex }
      ];
      if (query.$or) {
        query = { $and: [query, { $or: searchOr }] };
      } else {
        query.$or = searchOr;
      }
    }

    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    console.log(`[Ticket Service] Found ${tickets.length} tickets`);
    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (err) {
    console.error('[Ticket Service] Error fetching tickets:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: err.message
    });
  }
};

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Public
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Helper function to generate Admin alert HTML
const generateAdminTicketAlertHTML = (ticket) => {
    const ref = ticket._id ? ticket._id.toString().slice(-6).toUpperCase() : 'TICK';
    const title = ticket.title || 'Support Request';
    const priority = ticket.priority || 'Medium';

    return `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 32px 16px;">
            <div style="max-width: 600px; margin: 0 auto; bg-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; background: #ffffff;">
                <h2 style="color: #0f172a; margin-top: 0;">🚨 New Support Ticket Created!</h2>
                <p style="color: #475569; font-size: 14px;">A new support ticket has been submitted to the helpdesk:</p>
                <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="margin: 4px 0;"><strong>Reference:</strong> #${ref}</p>
                    <p style="margin: 4px 0;"><strong>Title:</strong> ${title}</p>
                    <p style="margin: 4px 0;"><strong>Priority:</strong> ${priority}</p>
                    <p style="margin: 4px 0;"><strong>Submitted By:</strong> ${ticket.guestEmail || 'Client/User'}</p>
                </div>
                <p style="color: #64748b; font-size: 12px;">Please log in to the Admin Portal to inspect and assign this ticket to HR, Sales, or Engineering staff.</p>
            </div>
        </body>
        </html>
    `;
};

// Helper function to generate Staff assignment HTML
const generateStaffAssignedEmailHTML = (ticket, staffName) => {
    const ref = ticket._id ? ticket._id.toString().slice(-6).toUpperCase() : 'TICK';
    const title = ticket.title || 'Support Request';
    const priority = ticket.priority || 'Medium';

    return `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 32px 16px;">
            <div style="max-width: 600px; margin: 0 auto; bg-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; background: #ffffff;">
                <h2 style="color: #0f172a; margin-top: 0;">📌 Support Ticket Assigned to You</h2>
                <p style="color: #475569; font-size: 14px;">Hello ${staffName || 'Team Member'}, a ticket has been assigned to your workspace queue:</p>
                <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="margin: 4px 0;"><strong>Reference:</strong> #${ref}</p>
                    <p style="margin: 4px 0;"><strong>Subject:</strong> ${title}</p>
                    <p style="margin: 4px 0;"><strong>Priority Level:</strong> ${priority}</p>
                </div>
                <p style="color: #64748b; font-size: 12px;">Log in to your workspace dashboard to process and update the ticket status.</p>
            </div>
        </body>
        </html>
    `;
};

// @desc    Create ticket
// @route   POST /api/tickets
// @access  Public
exports.createTicket = async (req, res) => {
  try {
    const ticket = await Ticket.create(req.body);

    // Asynchronous Event Bus Dispatch via RabbitMQ
    try {
      const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005';
      const ref = ticket._id.toString().slice(-6).toUpperCase();

      // 1. Notify Ticket Submitter (Client/User)
      const clientEmail = await getRecipientEmail(ticket);
      if (clientEmail) {
        const emailPayload = {
          to: clientEmail,
          subject: `[Support Ticket #${ref}] Ticket Logged: ${ticket.title}`,
          message: generateTicketEmailHTML(ticket)
        };
        const fallbackSend = () => axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/email`, emailPayload);
        await publishToQueue('email_notifications', emailPayload, fallbackSend);
        console.log(`[Ticket Service] Client creation notification queued via RabbitMQ for ${clientEmail}`);
      }

      // 2. Notify Admin
      const adminEmail = process.env.SENDER_EMAIL || "admin@companycrm.com";
      const adminPayload = {
        to: adminEmail,
        subject: `🚨 New Support Ticket Logged: ${ticket.title} [Ref: #${ref}]`,
        message: generateAdminTicketAlertHTML(ticket)
      };
      const fallbackAdminSend = () => axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/email`, adminPayload);
      await publishToQueue('email_notifications', adminPayload, fallbackAdminSend);
      console.log(`[Ticket Service] Admin creation notification queued via RabbitMQ for ${adminEmail}`);

    } catch (notifyErr) {
      console.error('[Ticket Service] Async creation notification failed:', notifyErr.message);
    }

    res.status(201).json({
      success: true,
      data: ticket
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Public
exports.updateTicket = async (req, res) => {
  try {
    let ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    const originalStatus = ticket.status;
    const originalAssignedTo = ticket.assignedTo;

    ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005';
    const ref = ticket._id.toString().slice(-6).toUpperCase();

    // 1. RABBITMQ NOTIFICATION: Ticket Assignment to Staff/Sales/HR
    if (req.body.assignedTo && req.body.assignedTo !== originalAssignedTo) {
        try {
            const staffEmail = req.body.assignedToEmail || (req.body.assignedTo.includes('@') ? req.body.assignedTo : null);
            if (staffEmail) {
                const staffPayload = {
                    to: staffEmail,
                    subject: `📌 Support Ticket #${ref} Assigned to You: ${ticket.title}`,
                    message: generateStaffAssignedEmailHTML(ticket, req.body.assignedTo)
                };
                const fallbackStaffSend = () => axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/email`, staffPayload);
                await publishToQueue('email_notifications', staffPayload, fallbackStaffSend);
                console.log(`[Ticket Service] Ticket assignment email queued via RabbitMQ for ${staffEmail}`);
            }
        } catch (assignErr) {
            console.error('[Ticket Service] Failed to send assignment notification:', assignErr.message);
        }
    }

    // 2. RABBITMQ NOTIFICATION: Status Changes to Ticket Owner (Resolved, Rejected, In Progress, Closed)
    if (req.body.status && req.body.status !== originalStatus) {
        try {
            const clientEmail = await getRecipientEmail(ticket);

            if (clientEmail) {
                const emailPayload = {
                    to: clientEmail,
                    subject: `[Support Ticket #${ref}] Status Updated to "${ticket.status}": ${ticket.title}`,
                    message: generateTicketEmailHTML(ticket)
                };

                const fallbackSend = () => axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/email`, emailPayload);
                await publishToQueue('email_notifications', emailPayload, fallbackSend);
                console.log(`[Ticket Service] Status update (${ticket.status}) notification queued via RabbitMQ for ${clientEmail}`);
            }
        } catch (notifyErr) {
            console.error('[Ticket Service] Failed to send status update notification:', notifyErr.message);
        }
    }

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Public
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    // Role-based permission check: Clients can only delete their own tickets
    if (req.user && req.user.role === 'Client') {
      const isOwner = (ticket.guestEmail && ticket.guestEmail.toLowerCase() === req.user.email?.toLowerCase()) || 
                      (ticket.customerId && ticket.customerId.toString() === (req.user.id || req.user._id));
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access Forbidden: You can only delete your own support tickets'
        });
      }
    }

    await ticket.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: err.message
    });
  }
};

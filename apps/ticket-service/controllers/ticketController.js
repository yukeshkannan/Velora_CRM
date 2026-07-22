const Ticket = require('../models/Ticket');

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Public
exports.getTickets = async (req, res) => {
  try {
    console.log('[Ticket Service] Fetching tickets...');
    const { email } = req.query;
    let query = {};
    // If email is provided, we might need to look up the contact first OR assume guestEmail matches. 
    // For simplicity given the schema, let's filter by guestEmail for now, or if the user is linked to a customerId.
    // However, Ticket model usually has customerId. 
    if (email) {
       // Since we don't have easy lookup of contact by email inside Ticket Service without inter-service call, 
       // we will trust the frontend passing `customerId` if they know it, or we filter by guestEmail if present.
       // BUT, the safer way for the dashboard to work is to pass the specific query.
       // Let's expect the frontend to pass `email` matching `guestEmail` OR filter by `customerId` logic handled there.
       // Actually, to secure it:
       query = { $or: [{ guestEmail: email }] }; 
    }
    
    // Better approach: Allow standard query filtering from req.query directly if secure enough for MVP
    // Current frontend: axios.get('/api/tickets') then filters.
    // We should allow backend filtering.
    if (req.query.email) query.guestEmail = req.query.email;
    if (req.query.customerId) query.customerId = req.query.customerId;
    if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;

    const searchTerm = req.query.search || req.query.q;
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i');
      const searchOr = [
        { title: regex },
        { description: regex }
      ];
      if (Object.keys(query).length > 0) {
        query = { $and: [query, { $or: searchOr }] };
      } else {
        query.$or = searchOr;
      }
    }

    const tickets = await Ticket.find(query);
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

// @desc    Create ticket
// @route   POST /api/tickets
// @access  Public
exports.createTicket = async (req, res) => {
  try {
    const ticket = await Ticket.create(req.body);

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

const axios = require('axios'); // Add axios
const { publishToQueue } = require('../../../packages/utils');

// ... existing code ...

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

    ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // --- NOTIFICATION LOGIC ---
    if (req.body.status === 'Resolved' && originalStatus !== 'Resolved') {
        try {
            let clientEmail = ticket.guestEmail;

            // If no guest email, fetch from Contact Service
            if (!clientEmail && ticket.customerId) {
                const CONTACT_SERVICE_URL = process.env.CONTACT_SERVICE_URL || 'http://companycrm-contact-service-1:5002'; // Docker DNS
                const contactRes = await axios.get(`${CONTACT_SERVICE_URL}/api/contacts/${ticket.customerId}`);
                if (contactRes.data.success) {
                    clientEmail = contactRes.data.data.email;
                }
            }

            if (clientEmail) {
                const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5005'; // Docker DNS
                
                const emailPayload = {
                    to: clientEmail,
                    subject: `Ticket Resolved: ${ticket.title} [Ref: ${ticket._id}]`,
                    message: `Dear Customer,<br><br>Your ticket <strong>"${ticket.title}"</strong> has been marked as <strong>Resolved</strong>.<br><br>Description: ${ticket.description}<br><br>If you need further assistance, please open a new ticket.<br><br>Best regards,<br>Support Team`
                };

                const fallbackSend = () => axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/email`, emailPayload);

                await publishToQueue('email_notifications', emailPayload, fallbackSend);
                console.log(`[Ticket Service] Resolution email handled for ${clientEmail}`);
            } else {
                console.warn('[Ticket Service] No client email found for notification.');
            }
        } catch (notifyErr) {
            console.error('[Ticket Service] Failed to send resolution notification:', notifyErr.message);
            // Don't fail the request, just log it
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

    await ticket.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

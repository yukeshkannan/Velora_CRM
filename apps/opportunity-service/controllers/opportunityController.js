const Opportunity = require('../models/Opportunity');
const axios = require('axios');
const { formatResponse, getCache, setCache, delCachePattern, publishToQueue } = require('../../../packages/utils');

// @desc    Get all opportunities
// @route   GET /api/opportunities
// @access  Public
exports.getOpportunities = async (req, res) => {
  try {
    const { contactId, search, q, assignedTo } = req.query;
    const cacheKey = `opp:all:${contactId || ''}:${assignedTo || ''}:${search || q || ''}`;
    
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    console.log('[Opportunity Service] Fetching opportunities from DB...');
    let query = {};
    if (contactId) query.contactId = contactId;
    if (assignedTo) query.assignedTo = assignedTo;

    const searchTerm = search || q;
    if (searchTerm) {
      query.title = new RegExp(searchTerm, 'i');
    }

    const opportunities = await Opportunity.find(query).sort({ createdAt: -1 });
    const responsePayload = {
      success: true,
      message: 'Opportunities retrieved successfully',
      data: opportunities
    };

    await setCache(cacheKey, responsePayload, 120); // Cache for 2 minutes
    res.status(200).json(responsePayload);
  } catch (err) {
    console.error('[Opportunity Service] Error fetching opportunities:', err);
    formatResponse(res, 500, 'Server Error', err.message);
  }
};

// @desc    Get single opportunity
// @route   GET /api/opportunities/:id
// @access  Public
exports.getOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return formatResponse(res, 404, 'Opportunity not found');
    }

    formatResponse(res, 200, 'Opportunity retrieved successfully', opportunity);
  } catch (err) {
    formatResponse(res, 500, 'Server Error', err.message);
  }
};

// @desc    Create new opportunity
// @route   POST /api/opportunities
// @access  Public
exports.createOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.create(req.body);
    await delCachePattern('opp:*');

    // Asynchronous Event Bus Dispatch via RabbitMQ to Admin/Sales team
    try {
        const adminEmail = process.env.SENDER_EMAIL || "admin@companycrm.com";
        const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005';
        
        const emailPayload = {
            to: adminEmail,
            subject: `⚡ New Quote Inquiry: ${opportunity.title} ($${(opportunity.amount || 0).toLocaleString()})`,
            message: `
                <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                    <h2 style="color: #0f172a; margin-top: 0;">New Product Quote Request Received!</h2>
                    <p style="color: #475569; font-size: 14px;">A client has requested a quote inquiry on the portal:</p>
                    <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                        <p style="margin: 4px 0;"><strong>Service/Product:</strong> ${opportunity.title}</p>
                        <p style="margin: 4px 0;"><strong>Estimated Amount:</strong> $${(opportunity.amount || 0).toLocaleString()}</p>
                        <p style="margin: 4px 0;"><strong>Client Name:</strong> ${opportunity.contactName || 'Valued Client'}</p>
                        <p style="margin: 4px 0;"><strong>Client Email:</strong> ${opportunity.contactEmail || 'N/A'}</p>
                        <p style="margin: 4px 0;"><strong>Contact Preference:</strong> ${opportunity.preferredContactTime || 'Flexible'}</p>
                    </div>
                    <p style="color: #64748b; font-size: 12px;">Please log in to the Sales Pipeline to assign a sales representative and follow up with the client.</p>
                </div>
            `
        };

        const fallbackSend = () => axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/email`, emailPayload);
        await publishToQueue('email_notifications', emailPayload, fallbackSend);
        console.log(`[Opportunity Service] RabbitMQ quote inquiry notification dispatched for Admin (${adminEmail})`);
    } catch (notifyErr) {
        console.error('[Opportunity Service] Failed to send quote inquiry notification:', notifyErr.message);
    }

    formatResponse(res, 201, 'Opportunity created successfully', opportunity);
  } catch (err) {
    formatResponse(res, 400, 'Invalid data', err.message);
  }
};

// @desc    Update opportunity
// @route   PUT /api/opportunities/:id
// @access  Public
exports.updateOpportunity = async (req, res) => {
  try {
    let opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return formatResponse(res, 404, 'Opportunity not found');
    }

    // Manual update to ensure array handling is correct
    if (req.body.modules) {
        opportunity.modules = req.body.modules;
    }
    // Update other fields
    const allowedUpdates = ['title', 'amount', 'stage', 'employeeTaskStatus', 'priority', 'contactId', 'assignedTo', 'expectedCloseDate', 'description', 'preferredContactTime'];
    allowedUpdates.forEach(update => {
        if (req.body[update] !== undefined) {
            opportunity[update] = req.body[update];
        }
    });

    if (req.body.employeeTaskStatus === 'Completed') {
        opportunity.stage = 'Completed';
    } else if (req.body.employeeTaskStatus === 'In Progress' && (opportunity.stage === 'New' || !opportunity.stage)) {
        opportunity.stage = 'In Execution';
    }

    await opportunity.save();
    await delCachePattern('opp:*');

    res.status(200).json({
        success: true,
        data: opportunity
    });

  } catch (err) {
    formatResponse(res, 500, 'Server Error', err.message);
  }
};

// @desc    Delete opportunity
// @route   DELETE /api/opportunities/:id
// @access  Public
exports.deleteOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return formatResponse(res, 404, 'Opportunity not found');
    }

    await opportunity.deleteOne();
    await delCachePattern('opp:*');
    formatResponse(res, 200, 'Opportunity deleted successfully', {});
  } catch (err) {
    formatResponse(res, 500, 'Server Error', err.message);
  }
};

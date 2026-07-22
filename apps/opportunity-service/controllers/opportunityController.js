const Opportunity = require('../models/Opportunity');
const { formatResponse, getCache, setCache, delCachePattern } = require('../../../packages/utils');

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
    const allowedUpdates = ['title', 'amount', 'stage', 'employeeTaskStatus', 'contactId', 'assignedTo', 'expectedCloseDate'];
    allowedUpdates.forEach(update => {
        if (req.body[update] !== undefined) {
            opportunity[update] = req.body[update];
        }
    });

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

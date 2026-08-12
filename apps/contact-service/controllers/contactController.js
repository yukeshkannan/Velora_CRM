const Contact = require('../models/Contact');
const { formatResponse } = require('../../../packages/utils');

// Helper to auto-sync Client users from Auth Service into Contact Service
const syncClientUsers = async () => {
  try {
    const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
    const response = await fetch(`${authUrl}/api/auth/users`, { signal: AbortSignal.timeout(3000) });
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        const clientUsers = data.data.filter(u => u.role === 'Client' && u.email);
        for (const u of clientUsers) {
          const cleanEmail = String(u.email).toLowerCase().trim();
          const exists = await Contact.findOne({ email: cleanEmail });
          if (!exists) {
            await Contact.create({
              name: u.name || 'New Client',
              email: cleanEmail,
              company: 'Independent',
              status: 'Customer'
            });
            console.log(`[Contact-Service] Auto-synced Client contact from Auth Service: ${cleanEmail}`);
          }
        }
      }
    }
  } catch (err) {
    console.warn(`[Contact-Service] User sync warning: ${err.message}`);
  }
};

// @desc    Get all contacts
// @route   GET /api/contacts
// @access  Public
exports.getContacts = async (req, res) => {
  try {
    console.log('[Contact Service] Fetching contacts...');
    await syncClientUsers();

    const { email, search, q } = req.query;
    let query = {};
    if (email && String(email).trim() !== '') {
      query.email = new RegExp('^' + String(email).trim() + '$', 'i');
    }

    const searchTerm = search || q;
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i');
      const searchOr = [
        { name: regex },
        { email: regex },
        { company: regex }
      ];
      if (query.email) {
        query = { $and: [{ email: query.email }, { $or: searchOr }] };
      } else {
        query.$or = searchOr;
      }
    }

    const contacts = await Contact.find(query).sort({ createdAt: -1 });
    console.log(`[Contact Service] Found ${contacts.length} contacts`);
    formatResponse(res, 200, 'Contacts retrieved successfully', contacts);
  } catch (err) {
    console.error('[Contact Service] Error fetching contacts:', err);
    formatResponse(res, 500, 'Server Error', err.message);
  }
};

// @desc    Get single contact
// @route   GET /api/contacts/:id
// @access  Public
exports.getContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return formatResponse(res, 404, 'Contact not found');
    }

    formatResponse(res, 200, 'Contact retrieved successfully', contact);
  } catch (err) {
    formatResponse(res, 500, 'Server Error', err.message);
  }
};

// @desc    Create new contact
// @route   POST /api/contacts
// @access  Public
exports.createContact = async (req, res) => {
  try {
    const contact = await Contact.create(req.body);
    formatResponse(res, 201, 'Contact created successfully', contact);
  } catch (err) {
    if (err.code === 11000) {
      return formatResponse(res, 400, 'Email already exists');
    }
    formatResponse(res, 400, 'Invalid data', err.message);
  }
};

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Public
exports.updateContact = async (req, res) => {
  try {
    let contact = await Contact.findById(req.params.id);

    if (!contact) {
      return formatResponse(res, 404, 'Contact not found');
    }

    contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    formatResponse(res, 200, 'Contact updated successfully', contact);
  } catch (err) {
    formatResponse(res, 500, 'Server Error', err.message);
  }
};

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Public
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return formatResponse(res, 404, 'Contact not found');
    }

    await contact.deleteOne();

    formatResponse(res, 200, 'Contact deleted successfully', {});
  } catch (err) {
    formatResponse(res, 500, 'Server Error', err.message);
  }
};

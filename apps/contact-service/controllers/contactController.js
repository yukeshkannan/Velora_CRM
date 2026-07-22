const Contact = require('../models/Contact');
const { formatResponse } = require('../../../packages/utils');

// @desc    Get all contacts
// @route   GET /api/contacts
// @access  Public
exports.getContacts = async (req, res) => {
  try {
    console.log('[Contact Service] Fetching contacts...');
    const { email, search, q } = req.query;
    let query = {};
    if (email) query.email = email;

    const searchTerm = search || q;
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { company: regex }
      ];
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

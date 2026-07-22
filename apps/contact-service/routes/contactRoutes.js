const express = require('express');
const { authMiddleware } = require('../../../packages/utils');
const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact
} = require('../controllers/contactController');

const router = express.Router();

// Secure all contact endpoints: user must be authenticated
router.use(authMiddleware());

const staffOnly = authMiddleware(['Admin', 'Employee', 'Sales', 'HR']);

// Clients can create contacts, but only staff can list contacts (unless a client is searching for their own email)
const listContactsGuard = (req, res, next) => {
  const isClient = req.user && req.user.role === 'Client';
  if (isClient) {
    if (req.query.email && req.query.email === req.user.email) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Access Forbidden: Insufficient Permissions' });
  }
  return staffOnly(req, res, next);
};

router.route('/')
  .get(listContactsGuard, getContacts)
  .post(createContact);

router.route('/:id')
  .get(getContact)
  .put(staffOnly, updateContact)
  .delete(staffOnly, deleteContact);

module.exports = router;

const express = require('express');
const { authMiddleware } = require('../../../packages/utils');
const {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket
} = require('../controllers/ticketController');

const router = express.Router();

// Secure all ticket endpoints: user must be authenticated
router.use(authMiddleware());

router
  .route('/')
  .get(getTickets)
  .post(createTicket);

router
  .route('/:id')
  .get(getTicketById)
  .put(updateTicket)
  .delete(authMiddleware(['Admin', 'Employee']), deleteTicket);

module.exports = router;

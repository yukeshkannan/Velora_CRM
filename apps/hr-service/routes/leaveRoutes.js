const express = require('express');
const router = express.Router();
const { applyLeave, getLeaves, updateLeaveStatus, deleteLeave } = require('../controllers/leaveController');

router.post('/', applyLeave);
router.get('/', getLeaves);
router.put('/:id/status', updateLeaveStatus);
router.delete('/:id', deleteLeave);

module.exports = router;

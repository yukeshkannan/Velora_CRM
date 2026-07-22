const express = require('express');
const { authMiddleware } = require('../../../packages/utils');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

const router = express.Router();

const STAFF_ROLES = ['Admin', 'Employee', 'Sales', 'HR'];

router.route('/')
  .get(authMiddleware(STAFF_ROLES), getTasks)
  .post(authMiddleware(STAFF_ROLES), createTask);

router.route('/:id')
  .get(authMiddleware(STAFF_ROLES), getTask)
  .put(authMiddleware(STAFF_ROLES), updateTask)
  .delete(authMiddleware(STAFF_ROLES), deleteTask);

module.exports = router;

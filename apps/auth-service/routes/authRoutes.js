const express = require('express');
const router = express.Router();
const { register, login, googleLogin, forgotPassword, resetPassword, createUser, getAllUsers, updateUser, deleteUser, getUserById } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// User Management (Admin Only)
router.post('/create-user', createUser);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById); // Added this
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;

// routes/userRoutes.js - User management routes
const express = require('express');
const router = express.Router();
const { getUserProfile, getAllUsers, changePassword, deleteUser } = require('../controller/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// GET /api/users/profile - Get current user profile
router.get('/profile', protect, getUserProfile);

// GET /api/users - Get all users (admin only)
router.get('/', protect, authorize('admin'), getAllUsers);

// PATCH /api/users/password - Change password (all authenticated users)
router.patch('/password', protect, changePassword);

// DELETE /api/users/:id - Delete a user (admin only)
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;

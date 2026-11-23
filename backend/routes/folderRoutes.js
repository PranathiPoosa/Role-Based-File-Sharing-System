// routes/folderRoutes.js - Routes for folder management
const express = require('express');
const router = express.Router();
const {
  createFolder,
  getFolders,
  deleteFolder,
} = require('../controller/folderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All folder routes are protected
router.use(protect);

// Get folders (All roles)
router.get('/', getFolders);

// Create folder (Admin and Manager only)
router.post('/', authorize('admin', 'manager'), createFolder);

// Delete folder (Admin and Manager only)
router.delete('/:id', authorize('admin', 'manager'), deleteFolder);

module.exports = router;

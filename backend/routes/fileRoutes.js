// routes/fileRoutes.js - File management routes with role-based access
const express = require('express');
const router = express.Router();
const {
  upload,
  uploadFile,
  getFiles,
  getPendingFiles,
  approveFile,
  rejectFile,
  downloadFile,
  deleteFile,
  renameFile,
  uploadVersion,
  addComment,
  getManagerStats,
} = require('../controller/fileController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// GET /api/files - Get all files (all authenticated users)
router.get('/', protect, getFiles);

// GET /api/files/stats - Get manager/admin stats
router.get('/stats', protect, authorize('admin', 'manager'), getManagerStats);

// GET /api/files/pending - Get pending files (admin only)
router.get('/pending', protect, authorize('admin'), getPendingFiles);

// POST /api/files/upload - Upload a file (admin & manager only)
router.post(
  '/upload',
  protect,
  authorize('admin', 'manager'),
  upload.single('file'),
  uploadFile
);

// POST /api/files/:id/comments - Add a comment
router.post('/:id/comments', protect, addComment);

// PATCH /api/files/:id/rename - Rename a file (admin & manager only)
router.patch('/:id/rename', protect, authorize('admin', 'manager'), renameFile);

// PATCH /api/files/:id/version - Upload a new version (admin & manager only)
router.patch(
  '/:id/version',
  protect,
  authorize('admin', 'manager'),
  upload.single('file'),
  uploadVersion
);

// PATCH /api/files/:id/approve - Approve a file (admin only)
router.patch('/:id/approve', protect, authorize('admin'), approveFile);

// PATCH /api/files/:id/reject - Reject a file (admin only)
router.patch('/:id/reject', protect, authorize('admin'), rejectFile);

// GET /api/files/download/:id - Download a file (all authenticated users)
router.get('/download/:id', protect, downloadFile);

// DELETE /api/files/:id - Delete a file (admin & manager only)
router.delete('/:id', protect, authorize('admin', 'manager'), deleteFile);

module.exports = router;

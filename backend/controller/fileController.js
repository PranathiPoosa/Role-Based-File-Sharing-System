// controller/fileController.js - File management logic
const File = require('../models/File');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter - only allow PDF and image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and image files are allowed.'), false);
  }
};

// Multer upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

/**
 * @desc    Upload a file
 * @route   POST /api/files/upload
 * @access  Admin, Manager
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const isAdminUpload = req.user?.role === 'admin';
    const folderId = req.body.folderId || null;
    const description = req.body.description || '';

    const file = await File.create({
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id,
      folder: folderId,
      description,
      approvalStatus: isAdminUpload ? 'approved' : 'pending',
      approvedBy: isAdminUpload ? req.user._id : null,
      approvedAt: isAdminUpload ? new Date() : null,
    });

    const populatedFile = await File.findById(file._id).populate(
      'uploadedBy',
      'name email role'
    );

    res.status(201).json({
      message: isAdminUpload
        ? 'File uploaded and approved'
        : 'File uploaded successfully and is pending admin approval',
      file: populatedFile,
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ message: 'Server error during file upload' });
  }
};

/**
 * @desc    Get all files
 * @route   GET /api/files
 * @access  Admin, Manager, User
 */
const getFiles = async (req, res) => {
  try {
    const { folderId } = req.query;
    let query = {};

    if (folderId) {
      query.folder = folderId === 'null' ? null : folderId;
    }

    // Users can only see approved files.
    if (req.user?.role === 'user') {
      query.approvalStatus = 'approved';
    }

    // Managers can see their own uploads (any status).
    if (req.user?.role === 'manager') {
      query.uploadedBy = req.user._id;
    }

    // Admins can see everything (default query = {}).
    const files = await File.find(query)
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (error) {
    console.error('Get files error:', error.message);
    res.status(500).json({ message: 'Server error fetching files' });
  }
};

/**
 * @desc    Rename a file
 * @route   PATCH /api/files/:id/rename
 * @access  Admin, Manager
 */
const renameFile = async (req, res) => {
  try {
    const { originalName } = req.body;
    if (!originalName) {
      return res.status(400).json({ message: 'New name is required' });
    }

    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check permissions
    if (req.user.role === 'manager' && String(file.uploadedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to rename this file' });
    }

    file.originalName = originalName;
    await file.save();

    const populated = await File.findById(file._id).populate('uploadedBy', 'name email role');
    res.json(populated);
  } catch (error) {
    console.error('Rename error:', error.message);
    res.status(500).json({ message: 'Server error during rename' });
  }
};

/**
 * @desc    Upload a new version of a file
 * @route   PATCH /api/files/:id/version
 * @access  Admin, Manager
 */
const uploadVersion = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check permissions
    if (req.user.role === 'manager' && String(file.uploadedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this file' });
    }

    // Archive current version
    file.versions.push({
      fileName: file.fileName,
      filePath: file.filePath,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      uploadedAt: file.updatedAt,
    });

    // Update with new file data
    file.fileName = req.file.filename;
    file.filePath = req.file.path;
    file.fileSize = req.file.size;
    file.mimeType = req.file.mimetype;
    
    // Reset approval if it's a manager update
    if (req.user.role === 'manager') {
      file.approvalStatus = 'pending';
      file.approvedBy = null;
      file.approvedAt = null;
    }

    await file.save();

    const populated = await File.findById(file._id).populate('uploadedBy', 'name email role');
    res.json({
      message: req.user.role === 'admin' ? 'Version updated' : 'New version uploaded and pending approval',
      file: populated
    });
  } catch (error) {
    console.error('Version upload error:', error.message);
    res.status(500).json({ message: 'Server error during version update' });
  }
};

/**
 * @desc    Get pending files (Admin only)
 * @route   GET /api/files/pending
 * @access  Admin only
 */
const getPendingFiles = async (req, res) => {
  try {
    const files = await File.find({ approvalStatus: 'pending' })
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    console.error('Get pending files error:', error.message);
    res.status(500).json({ message: 'Server error fetching pending files' });
  }
};

/**
 * @desc    Approve a file (Admin only)
 * @route   PATCH /api/files/:id/approve
 * @access  Admin only
 */
const approveFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.approvalStatus === 'approved') {
      const populated = await File.findById(file._id).populate(
        'uploadedBy',
        'name email role'
      );
      return res.json({ message: 'File is already approved', file: populated });
    }

    file.approvalStatus = 'approved';
    file.approvedBy = req.user._id;
    file.approvedAt = new Date();
    file.rejectedBy = null;
    file.rejectedAt = null;
    file.rejectionReason = '';
    await file.save();

    const populated = await File.findById(file._id).populate(
      'uploadedBy',
      'name email role'
    );
    res.json({ message: 'File approved successfully', file: populated });
  } catch (error) {
    console.error('Approve file error:', error.message);
    res.status(500).json({ message: 'Server error approving file' });
  }
};

/**
 * @desc    Reject a file (Admin only)
 * @route   PATCH /api/files/:id/reject
 * @access  Admin only
 */
const rejectFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.approvalStatus === 'rejected') {
      const populated = await File.findById(file._id).populate(
        'uploadedBy',
        'name email role'
      );
      return res.json({ message: 'File is already rejected', file: populated });
    }

    const reason =
      typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';

    file.approvalStatus = 'rejected';
    file.rejectedBy = req.user._id;
    file.rejectedAt = new Date();
    file.rejectionReason = reason;
    file.approvedBy = null;
    file.approvedAt = null;
    await file.save();

    const populated = await File.findById(file._id).populate(
      'uploadedBy',
      'name email role'
    );
    res.json({ message: 'File rejected successfully', file: populated });
  } catch (error) {
    console.error('Reject file error:', error.message);
    res.status(500).json({ message: 'Server error rejecting file' });
  }
};

/**
 * @desc    Download a file
 * @route   GET /api/files/download/:id
 * @access  Admin, Manager, User
 */
const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Only admins can download any file.
    // Managers can download their own files.
    // Users can only download approved files.
    if (req.user?.role === 'user' && file.approvalStatus !== 'approved') {
      return res.status(403).json({ message: 'File is not approved yet' });
    }
    
    // Managers can download anything uploaded by them (any status) or approved files from others
    // For now, let's stick to the rule: Managers see their own and approved ones.

    const filePath = path.join(__dirname, '..', 'uploads', file.fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Increment download count
    file.downloadCount = (file.downloadCount || 0) + 1;
    await file.save();

    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        // Add to recent list (remove if already exists to move to top)
        user.recentlyDownloaded = user.recentlyDownloaded.filter(
          (rd) => String(rd.fileId) !== String(file._id)
        );
        
        user.recentlyDownloaded.unshift({
          fileName: file.originalName,
          fileId: file._id,
          downloadedAt: new Date()
        });

        // Keep only top 5
        if (user.recentlyDownloaded.length > 5) {
          user.recentlyDownloaded = user.recentlyDownloaded.slice(0, 5);
        }

        user.lastDownloadedFile = file.originalName;
        user.lastDownloadedAt = new Date();
        await user.save();
      }
    }

    res.download(filePath, file.originalName);
  } catch (error) {
    console.error('Download error:', error.message);
    res.status(500).json({ message: 'Server error during file download' });
  }
};

/**
 * @desc    Add a comment to a file
 * @route   POST /api/files/:id/comments
 * @access  Authenticated
 */
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    file.comments.push({
      user: req.user._id,
      userName: req.user.name,
      text,
    });

    await file.save();
    res.status(201).json(file.comments);
  } catch (error) {
    console.error('Add comment error:', error.message);
    res.status(500).json({ message: 'Server error adding comment' });
  }
};

/**
 * @desc    Get manager stats
 * @route   GET /api/files/stats
 * @access  Manager, Admin
 */
const getManagerStats = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { uploadedBy: req.user._id };
    const files = await File.find(query);
    
    const totalDownloads = files.reduce((acc, f) => acc + (f.downloadCount || 0), 0);
    const mostDownloaded = [...files].sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0)).slice(0, 5);
    
    res.json({
      totalFiles: files.length,
      totalDownloads,
      mostDownloaded: mostDownloaded.map(f => ({ 
        name: f.originalName, 
        downloads: f.downloadCount || 0,
        id: f._id 
      }))
    });
  } catch (error) {
    console.error('Get stats error:', error.message);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

/**
 * @desc    Delete a file
 * @route   DELETE /api/files/:id
 * @access  Admin only
 */
const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete physical file from disk
    const filePath = path.join(__dirname, '..', 'uploads', file.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete file record from database
    await File.findByIdAndDelete(req.params.id);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ message: 'Server error during file deletion' });
  }
};

module.exports = {
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
};

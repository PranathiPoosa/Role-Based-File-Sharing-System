// controller/folderController.js - Folder management logic
const Folder = require('../models/Folder');
const File = require('../models/File');

/**
 * @desc    Create a new folder
 * @route   POST /api/folders
 * @access  Admin, Manager
 */
const createFolder = async (req, res) => {
  try {
    const { name, parentFolder } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    const folder = await Folder.create({
      name,
      parentFolder: parentFolder || null,
      createdBy: req.user._id,
    });

    res.status(201).json(folder);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A folder with this name already exists in this location' });
    }
    console.error('Create folder error:', error.message);
    res.status(500).json({ message: 'Server error creating folder' });
  }
};

/**
 * @desc    Get folders
 * @route   GET /api/folders
 * @access  Admin, Manager, User
 */
const getFolders = async (req, res) => {
  try {
    const { parentFolder } = req.query;
    let query = { parentFolder: parentFolder || null };

    // Users see all folders (or we could limit by who can see what)
    // For now, let's keep it simple: folders are shared within the system
    
    const folders = await Folder.find(query)
      .populate('createdBy', 'name email role')
      .sort({ name: 1 });

    res.json(folders);
  } catch (error) {
    console.error('Get folders error:', error.message);
    res.status(500).json({ message: 'Server error fetching folders' });
  }
};

/**
 * @desc    Delete a folder
 * @route   DELETE /api/folders/:id
 * @access  Admin, Manager
 */
const deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Check permissions (Admins can delete any, Managers can delete their own)
    if (req.user.role === 'manager' && String(folder.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this folder' });
    }

    // Check if folder has contents
    const hasFiles = await File.exists({ folder: folder._id });
    const hasSubfolders = await Folder.exists({ parentFolder: folder._id });

    if (hasFiles || hasSubfolders) {
      return res.status(400).json({ message: 'Cannot delete a folder that contains files or subfolders' });
    }

    await Folder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Delete folder error:', error.message);
    res.status(500).json({ message: 'Server error deleting folder' });
  }
};

module.exports = {
  createFolder,
  getFolders,
  deleteFolder,
};

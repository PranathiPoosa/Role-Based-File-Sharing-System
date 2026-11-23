// models/Folder.js - Folder schema for file organization
const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
    },
  },
  { timestamps: true }
);

// Index to ensure folder names are unique per level for a user
folderSchema.index({ name: 1, createdBy: 1, parentFolder: 1 }, { unique: true });

module.exports = mongoose.model('Folder', folderSchema);

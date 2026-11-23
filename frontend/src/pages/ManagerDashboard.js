// pages/ManagerDashboard.js - Manager dashboard with upload and view
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';
import FileCard from '../components/FileCard';
import { getFilesAPI, uploadFileAPI, getFoldersAPI, createFolderAPI, deleteFolderAPI, getStatsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FiUploadCloud, FiFile, FiBriefcase, FiSearch, FiGrid, FiList, FiFolder, FiPlus, FiChevronRight, FiTrash2, FiActivity, FiTrendingUp } from 'react-icons/fi';

const ManagerDashboard = () => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const filteredFiles = files.filter((f) =>
    (f.originalName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredFolders = folders.filter((f) =>
    (f.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fileInputRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const folderId = currentFolder?._id || null;
      const [filesRes, foldersRes, statsRes] = await Promise.all([
        getFilesAPI(folderId),
        getFoldersAPI(folderId),
        getStatsAPI()
      ]);
      setFiles(filesRes.data);
      setFolders(foldersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [currentFolder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await createFolderAPI({
        name: newFolderName,
        parentFolder: currentFolder?._id || null
      });
      toast.success('Folder created');
      setNewFolderName('');
      setShowFolderModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create folder');
    }
  };

  const handleDeleteFolder = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this folder? It must be empty.')) return;

    try {
      await deleteFolderAPI(id);
      toast.success('Folder deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete folder');
    }
  };

  const navigateToFolder = (folder) => {
    if (folder) {
      setBreadcrumbs([...breadcrumbs, folder]);
      setCurrentFolder(folder);
    } else {
      setBreadcrumbs([]);
      setCurrentFolder(null);
    }
  };

  const navigateBack = (index) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolder(newBreadcrumbs[newBreadcrumbs.length - 1] || null);
  };

  const handleUpload = async (selectedFile) => {
    if (!selectedFile) return;

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Only PDF and image files are allowed.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (currentFolder) {
      formData.append('folderId', currentFolder._id);
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      await uploadFileAPI(formData, (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percent);
      });
      toast.success('File uploaded successfully!');
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.message || 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const renderSkeletons = () => (
    <div className="files-grid">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="file-card skeleton-card">
          <div className="skeleton skeleton-icon"></div>
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text short"></div>
          <div className="skeleton skeleton-btn"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="dashboard-content fade-in">
        <div className="dashboard-header">
          <div className="dashboard-header-text">
            <h1 className="dashboard-title">
              <FiBriefcase className="dashboard-title-icon" />
              Manager Dashboard
            </h1>
            <p className="dashboard-subtitle">
              Upload and organize files shared across your team
            </p>
          </div>
          <div className="dashboard-stats">
            <div className="stat-card" onClick={() => setShowFolderModal(true)} style={{ cursor: 'pointer', border: '1px dashed var(--primary)' }}>
              <FiPlus />
              <div>
                <span className="stat-label">New Folder</span>
              </div>
            </div>
            <div className="stat-card">
              <FiFolder />
              <div>
                <span className="stat-number">{folders.length}</span>
                <span className="stat-label">Folders</span>
              </div>
            </div>
            <div className="stat-card">
              <FiFile />
              <div>
                <span className="stat-number">{files.length}</span>
                <span className="stat-label">Files</span>
              </div>
            </div>
            {stats && (
              <div className="stat-card" style={{ border: '1px solid var(--primary-light)' }}>
                <FiActivity />
                <div>
                  <span className="stat-number">{stats.totalDownloads}</span>
                  <span className="stat-label">Downloads</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Section */}
        {stats && stats.mostDownloaded?.length > 0 && (
          <div className="analytics-overview fade-in" style={{ marginBottom: '32px' }}>
            <div className="admin-panel-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <FiTrendingUp style={{ color: 'var(--primary)', fontSize: '20px' }} />
                <h2 className="section-title" style={{ marginBottom: 0 }}>Most Popular Files</h2>
              </div>
              <div className="admin-user-list">
                {stats.mostDownloaded.map((f, i) => (
                  <div key={f.id} className="admin-user-row">
                    <div className="admin-user-main">
                      <strong>{f.name}</strong>
                      <span className="admin-user-email">#{i + 1} Most Downloaded</span>
                    </div>
                    <div className="role-badge role-badge-admin" style={{ background: 'var(--primary-lighter)', color: 'var(--primary-dark)' }}>
                      {f.downloads} Downloads
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <span className="breadcrumb-item" onClick={() => navigateToFolder(null)}>Root</span>
          {breadcrumbs.map((folder, index) => (
            <React.Fragment key={folder._id}>
              <FiChevronRight className="breadcrumb-separator" />
              <span className="breadcrumb-item" onClick={() => navigateBack(index)}>
                {folder.name}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Upload Zone */}
        <div
          className={`upload-zone ${dragActive ? 'drag-active' : ''} ${
            uploading ? 'uploading' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          id="manager-upload-zone"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
            style={{ display: 'none' }}
            id="manager-file-input"
          />

          {uploading ? (
            <div className="upload-progress-wrapper">
              <div className="upload-progress-circle">
                <svg viewBox="0 0 100 100">
                  <circle className="progress-bg" cx="50" cy="50" r="40" />
                  <circle
                    className="progress-fill"
                    cx="50"
                    cy="50"
                    r="40"
                    style={{
                      strokeDashoffset: 251.2 - (251.2 * uploadProgress) / 100,
                    }}
                  />
                </svg>
                <span className="progress-text">{uploadProgress}%</span>
              </div>
              <p className="upload-status">Uploading to {currentFolder ? currentFolder.name : 'Root'}...</p>
            </div>
          ) : (
            <>
              <FiUploadCloud className="upload-icon" />
              <h3 className="upload-title">
                {dragActive ? 'Drop your file here' : `Drag & drop files to ${currentFolder ? currentFolder.name : 'Root'}`}
              </h3>
              <p className="upload-hint">
                or click to browse • PDF, JPG, PNG, GIF, WebP • Max 10MB
              </p>
            </>
          )}
        </div>

        {/* Files & Folders Section */}
        <div className="files-section">
          <div className="files-header-row">
            <h2 className="section-title">
              {currentFolder ? currentFolder.name : 'All Files'}
            </h2>
            <div className="file-controls">
              <div className="file-search">
                <FiSearch />
                <input
                  type="text"
                  placeholder="Search folders & files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="view-toggle">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <FiGrid />
                </button>
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <FiList />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            renderSkeletons()
          ) : (files.length === 0 && folders.length === 0) ? (
            <div className="empty-state">
              <FiFile className="empty-icon" />
              <h3>Folder is empty</h3>
              <p>Upload a file or create a subfolder</p>
            </div>
          ) : (
            <div className={viewMode === 'list' ? 'files-list' : 'files-grid'}>
              {/* Render Folders First */}
              {filteredFolders.map((folder) => (
                <div 
                  key={folder._id} 
                  className={`file-card folder-card ${viewMode === 'list' ? 'list-view' : ''}`}
                  onClick={() => navigateToFolder(folder)}
                >
                  <div className="file-card-header">
                    <div className="file-card-icon-wrapper">
                      <FiFolder className="file-icon file-icon-folder" />
                    </div>
                  </div>
                  <div className="file-card-body">
                    <h3 className="file-card-name">{folder.name}</h3>
                    <div className="file-card-meta">
                      <div className="file-meta-item">
                        <span>Folder</span>
                      </div>
                    </div>
                  </div>
                  <div className="file-card-actions">
                    <button className="btn btn-delete btn-sm" onClick={(e) => handleDeleteFolder(folder._id, e)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Render Files */}
              {filteredFiles.map((file) => (
                <FileCard key={file._id} file={file} canDelete={true} onDelete={fetchData} viewMode={viewMode} onUpdate={fetchData} />
              ))}
            </div>
          )}
        </div>

        {/* Create Folder Modal */}
        {showFolderModal && (
          <div className="modal-overlay" onClick={() => setShowFolderModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">Create New Folder</h3>
              <form onSubmit={handleCreateFolder}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                />
                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn btn-cancel" onClick={() => setShowFolderModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-confirm">Create Folder</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManagerDashboard;

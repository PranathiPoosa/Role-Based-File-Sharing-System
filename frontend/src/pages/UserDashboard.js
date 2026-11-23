import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import FileCard from '../components/FileCard';
import { getFilesAPI, getFoldersAPI, getUserProfileAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FiFile, FiEye, FiSearch, FiGrid, FiList, FiFolder, FiChevronRight, FiClock, FiDownload } from 'react-icons/fi';
import { formatDate } from '../utils/auth';

const UserDashboard = () => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const filteredFiles = files.filter((f) =>
    (f.originalName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredFolders = folders.filter((f) =>
    (f.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const folderId = currentFolder?._id || null;
      const [filesRes, foldersRes, profileRes] = await Promise.all([
        getFilesAPI(folderId),
        getFoldersAPI(folderId),
        getUserProfileAPI()
      ]);
      setFiles(filesRes.data);
      setFolders(foldersRes.data);
      setUserProfile(profileRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [currentFolder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
              <FiEye className="dashboard-title-icon" />
              My Dashboard
            </h1>
            <p className="dashboard-subtitle">
              View and download files shared across your team
            </p>
          </div>
          <div className="dashboard-stats">
            <div className="stat-card">
              <FiFile />
              <div>
                <span className="stat-number">{files.length}</span>
                <span className="stat-label">Files</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        {userProfile?.recentlyDownloaded?.length > 0 && (
          <div className="analytics-overview fade-in" style={{ marginBottom: '32px' }}>
            <div className="admin-panel-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <FiClock style={{ color: 'var(--primary)', fontSize: '20px' }} />
                <h2 className="section-title" style={{ marginBottom: 0 }}>My Recent Activity</h2>
              </div>
              <div className="admin-user-list">
                {userProfile.recentlyDownloaded.map((rd, i) => (
                  <div key={rd.fileId + i} className="admin-user-row">
                    <div className="admin-user-main">
                      <strong>{rd.fileName}</strong>
                      <span className="admin-user-email">Downloaded {formatDate(rd.downloadedAt)}</span>
                    </div>
                    <div className="role-badge" style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}>
                      <FiDownload style={{ marginRight: '4px' }} /> File
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

        {/* Files & Folders Section */}
        <div className="files-section">
          <div className="files-header-row">
            <h2 className="section-title">
              {currentFolder ? currentFolder.name : 'Shared Files'}
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
              <p>No files have been shared in this location</p>
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
                </div>
              ))}
              
              {/* Render Files */}
              {filteredFiles.map((file) => (
                <FileCard key={file._id} file={file} canDelete={false} viewMode={viewMode} onUpdate={fetchData} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;

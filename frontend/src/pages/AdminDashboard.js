// pages/AdminDashboard.js - Admin dashboard with governance, audit trails, and user management
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';
import FileCard from '../components/FileCard';
import {
  approveFileAPI,
  getAllUsersAPI,
  getFilesAPI,
  getPendingFilesAPI,
  rejectFileAPI,
  uploadFileAPI,
  deleteUserAPI,
  createUserAPI,
  updateUserRoleAPI,
  getAuditLogsAPI,
  getFoldersAPI,
  createFolderAPI,
  deleteFolderAPI,
} from '../services/api';
import { formatDate } from '../utils/auth';
import { toast } from 'react-toastify';
import {
  FiShield,
  FiCheck,
  FiX,
  FiUploadCloud,
  FiFile,
  FiUsers,
  FiClock,
  FiSearch,
  FiGrid,
  FiList,
  FiTrash2,
  FiFolder,
  FiPlus,
  FiChevronRight,
  FiActivity,
  FiRefreshCw,
  FiUserPlus,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';

const AdminDashboard = () => {
  // Navigation tab state: 'files', 'approvals', 'users', 'audit'
  const [activeTab, setActiveTab] = useState('files');

  // Core data states
  const [pendingFiles, setPendingFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  // Modals state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Audit filter states
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');

  const fileInputRef = useRef(null);

  // Fetch file & folder contents
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const folderId = currentFolder?._id || null;
      const [filesRes, foldersRes] = await Promise.all([
        getFilesAPI(folderId),
        getFoldersAPI(folderId),
      ]);
      setFiles(filesRes.data || []);
      setFolders(foldersRes.data || []);
    } catch (error) {
      toast.error('Failed to fetch file directory');
    } finally {
      setLoading(false);
    }
  }, [currentFolder]);

  // Fetch users & pending files
  const fetchAdminPanels = useCallback(async () => {
    try {
      const [u, pending] = await Promise.all([getAllUsersAPI(), getPendingFilesAPI()]);
      setUsers(u.data || []);
      setPendingFiles(pending.data || []);
    } catch (e) {
      toast.error('Failed to load admin governance data');
    }
  }, []);

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await getAuditLogsAPI();
      setAuditLogs(res.data || []);
    } catch (e) {
      toast.error('Failed to fetch audit log trail');
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAdminPanels();
    fetchAuditLogs();
  }, [fetchData, fetchAdminPanels, fetchAuditLogs]);

  // Folder actions
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await createFolderAPI({
        name: newFolderName.trim(),
        parentFolder: currentFolder?._id || null,
      });
      toast.success('Folder created successfully');
      setNewFolderName('');
      setShowFolderModal(false);
      fetchData();
      fetchAuditLogs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create folder');
    }
  };

  const handleDeleteFolder = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this folder? It must be completely empty.')) return;

    try {
      await deleteFolderAPI(id);
      toast.success('Folder deleted');
      fetchData();
      fetchAuditLogs();
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

  // Approval actions
  const handleApprove = async (id) => {
    setBusyId(id);
    try {
      await approveFileAPI(id);
      toast.success('File approved successfully');
      await fetchAdminPanels();
      await fetchData();
      await fetchAuditLogs();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Approve failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Enter rejection reason (optional):', '') || '';
    setBusyId(id);
    try {
      await rejectFileAPI(id, reason);
      toast.info('File rejected');
      await fetchAdminPanels();
      await fetchData();
      await fetchAuditLogs();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Reject failed');
    } finally {
      setBusyId(null);
    }
  };

  // User CRUD actions
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      toast.error('Please fill in all required user fields');
      return;
    }
    if (newUserData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setCreatingUser(true);
    try {
      await createUserAPI(newUserData);
      toast.success(`User ${newUserData.name} created successfully`);
      setShowUserModal(false);
      setNewUserData({ name: '', email: '', password: '', role: 'user' });
      await fetchAdminPanels();
      await fetchAuditLogs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setBusyId(userId);
    try {
      await updateUserRoleAPI(userId, newRole);
      toast.success(`User role updated to ${newRole.toUpperCase()}`);
      await fetchAdminPanels();
      await fetchAuditLogs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user role');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) {
      setBusyId(id);
      try {
        await deleteUserAPI(id);
        toast.success(`User ${name} deleted successfully`);
        await fetchAdminPanels();
        await fetchAuditLogs();
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to delete user');
      } finally {
        setBusyId(null);
      }
    }
  };

  // Upload handler
  const handleUpload = async (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (currentFolder) {
      formData.append('folderId', currentFolder._id || currentFolder.id);
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      await uploadFileAPI(formData, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);
      });
      toast.success('File uploaded and AES-256 encrypted successfully!');
      fetchData();
      fetchAdminPanels();
      fetchAuditLogs();
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
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
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

  // Filtered lists
  const filteredFiles = files.filter((f) =>
    (f.originalName || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const filteredFolders = folders.filter((f) =>
    (f.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter((u) =>
    (u.name || '').toLowerCase().includes((userSearchQuery || '').toLowerCase()) ||
    (u.email || '').toLowerCase().includes((userSearchQuery || '').toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesSearch =
      (log.userEmail || '').toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      (log.ipAddress || '').toLowerCase().includes(auditSearchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (auditActionFilter === 'ALL') return true;
    if (auditActionFilter === 'UPLOAD') return log.action?.includes('UPLOAD');
    if (auditActionFilter === 'DOWNLOAD') return log.action?.includes('DOWNLOAD');
    if (auditActionFilter === 'APPROVE') return log.action?.includes('APPROVE');
    if (auditActionFilter === 'REJECT') return log.action?.includes('REJECT');
    if (auditActionFilter === 'DELETE') return log.action?.includes('DELETE');
    if (auditActionFilter === 'USER_AUTH') return log.action?.includes('USER') || log.action?.includes('AUTH');
    return true;
  });

  const getAuditActionBadgeClass = (action = '') => {
    if (action.includes('UPLOAD')) return 'audit-badge-upload';
    if (action.includes('DOWNLOAD')) return 'audit-badge-download';
    if (action.includes('APPROVE')) return 'audit-badge-approve';
    if (action.includes('REJECT')) return 'audit-badge-reject';
    if (action.includes('DELETE')) return 'audit-badge-delete';
    if (action.includes('USER') || action.includes('LOGIN') || action.includes('REGISTER')) return 'audit-badge-auth';
    if (action.includes('FOLDER')) return 'audit-badge-folder';
    return 'audit-badge-default';
  };

  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="dashboard-content fade-in">
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="dashboard-header-text">
            <h1 className="dashboard-title">
              <FiShield className="dashboard-title-icon" />
              Admin Governance & Control
            </h1>
            <p className="dashboard-subtitle">
              Role-Based File Vault • AES-256 Storage • Audit Trails • User Management
            </p>
          </div>
          <div className="dashboard-stats">
            <div
              className="stat-card"
              onClick={() => setShowUserModal(true)}
              style={{ cursor: 'pointer', border: '1px dashed var(--primary)' }}
              title="Add New User"
            >
              <FiUserPlus />
              <div>
                <span className="stat-label">Create User</span>
              </div>
            </div>
            <div
              className="stat-card"
              onClick={() => setShowFolderModal(true)}
              style={{ cursor: 'pointer', border: '1px dashed var(--primary)' }}
              title="Create New Folder"
            >
              <FiPlus />
              <div>
                <span className="stat-label">New Folder</span>
              </div>
            </div>
            <div className="stat-card">
              <FiUsers />
              <div>
                <span className="stat-number">{users.length}</span>
                <span className="stat-label">Users</span>
              </div>
            </div>
            <div className="stat-card">
              <FiClock />
              <div>
                <span className="stat-number">{pendingFiles.length}</span>
                <span className="stat-label">Pending</span>
              </div>
            </div>
            <div className="stat-card">
              <FiActivity />
              <div>
                <span className="stat-number">{auditLogs.length}</span>
                <span className="stat-label">Audit Logs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Tabs Navigation */}
        <div className="admin-tab-nav">
          <button
            className={`admin-tab-btn ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            <FiFile />
            <span>Files & Storage</span>
            <span className="admin-tab-badge">{files.length}</span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'approvals' ? 'active' : ''}`}
            onClick={() => setActiveTab('approvals')}
          >
            <FiClock />
            <span>Pending Approvals</span>
            {pendingFiles.length > 0 && <span className="admin-tab-badge">{pendingFiles.length}</span>}
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FiUsers />
            <span>User Management</span>
            <span className="admin-tab-badge">{users.length}</span>
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('audit');
              fetchAuditLogs();
            }}
          >
            <FiActivity />
            <span>Audit Trail</span>
            <span className="admin-tab-badge">{auditLogs.length}</span>
          </button>
        </div>

        {/* TAB 1: FILES & STORAGE */}
        {activeTab === 'files' && (
          <div className="fade-in">
            {/* Breadcrumbs */}
            <div className="breadcrumbs">
              <span className="breadcrumb-item" onClick={() => navigateToFolder(null)}>
                Root
              </span>
              {breadcrumbs.map((folder, index) => (
                <React.Fragment key={folder._id || folder.id}>
                  <FiChevronRight className="breadcrumb-separator" />
                  <span className="breadcrumb-item" onClick={() => navigateBack(index)}>
                    {folder.name}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* Upload Zone */}
            <div
              className={`upload-zone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              id="upload-zone"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                style={{ display: 'none' }}
                id="file-input"
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
                  <p className="upload-status">
                    Encrypting & uploading to {currentFolder ? currentFolder.name : 'Root'}...
                  </p>
                </div>
              ) : (
                <>
                  <FiUploadCloud className="upload-icon" />
                  <h3 className="upload-title">
                    {dragActive
                      ? 'Drop file here'
                      : `Drag & drop file to ${currentFolder ? currentFolder.name : 'Root'}`}
                  </h3>
                  <p className="upload-hint">
                    AES-256-CBC Stream Encrypted on upload • PDF, Images • Max 10MB
                  </p>
                </>
              )}
            </div>

            {/* Files & Folders Directory */}
            <div className="files-section">
              <div className="files-header-row">
                <h2 className="section-title">
                  {currentFolder ? currentFolder.name : 'All Vault Files'}
                </h2>
                <div className="file-controls">
                  <div className="file-search">
                    <FiSearch />
                    <input
                      type="text"
                      placeholder="Search files & folders..."
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
                <p className="dashboard-subtitle">Loading vault contents...</p>
              ) : files.length === 0 && folders.length === 0 ? (
                <div className="empty-state">
                  <FiFile className="empty-icon" />
                  <h3>Folder is empty</h3>
                  <p>Upload a file or create a subfolder in this location</p>
                </div>
              ) : (
                <div className={viewMode === 'list' ? 'files-list' : 'files-grid'}>
                  {/* Folders */}
                  {filteredFolders.map((folder) => (
                    <div
                      key={folder._id || folder.id}
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
                        <button
                          className="btn btn-delete btn-sm"
                          onClick={(e) => handleDeleteFolder(folder._id || folder.id, e)}
                          title="Delete folder"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Files */}
                  {filteredFiles.map((file) => (
                    <FileCard
                      key={file._id || file.id}
                      file={file}
                      canDelete={true}
                      onDelete={fetchData}
                      viewMode={viewMode}
                      onUpdate={fetchData}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PENDING APPROVALS */}
        {activeTab === 'approvals' && (
          <div className="fade-in">
            <div className="admin-panel-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
              <h2 className="section-title">Pending File Approval Queue</h2>
              <p className="dashboard-subtitle" style={{ marginBottom: '20px' }}>
                Files uploaded by Managers require Admin authorization before standard Users can access them.
              </p>

              {loading ? (
                <p className="dashboard-subtitle">Loading pending files...</p>
              ) : pendingFiles.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px' }}>
                  <FiCheckCircle style={{ fontSize: '40px', color: 'var(--success)', marginBottom: '12px' }} />
                  <h3>Approval queue is clear!</h3>
                  <p>All shared files have been reviewed.</p>
                </div>
              ) : (
                <div className="admin-pending-simple">
                  {pendingFiles.map((f) => (
                    <div key={f._id || f.id} className="admin-pending-simple-row">
                      <div className="admin-pending-simple-main">
                        <strong>{f.originalName}</strong>
                        <span className="admin-user-email">
                          Uploaded by {f.uploadedBy?.name || 'Unknown'} ({f.uploadedBy?.email || '—'}) •{' '}
                          {formatDate(f.createdAt)}
                        </span>
                      </div>
                      <div className="admin-pending-simple-actions">
                        <button
                          className="btn btn-download"
                          onClick={() => handleApprove(f._id || f.id)}
                          disabled={busyId === (f._id || f.id)}
                        >
                          <FiCheck />
                          Approve
                        </button>
                        <button
                          className="btn btn-delete"
                          onClick={() => handleReject(f._id || f.id)}
                          disabled={busyId === (f._id || f.id)}
                        >
                          <FiX />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="fade-in">
            <div className="admin-panel-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <div className="audit-table-header">
                <div>
                  <h2 className="section-title" style={{ marginBottom: '4px' }}>
                    User Directory & Role Governance
                  </h2>
                  <p className="dashboard-subtitle">
                    Manage accounts, assign RBAC permissions, or create new organization users.
                  </p>
                </div>
                <div className="audit-controls">
                  <div className="file-search" style={{ width: '240px' }}>
                    <FiSearch />
                    <input
                      type="text"
                      placeholder="Search name or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowUserModal(true)}>
                    <FiUserPlus />
                    <span>Create User</span>
                  </button>
                </div>
              </div>

              {loading ? (
                <p className="dashboard-subtitle">Loading users...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="dashboard-subtitle">No users match your criteria.</p>
              ) : (
                <div className="admin-user-list">
                  {filteredUsers.map((u) => {
                    const userId = u._id || u.id;
                    return (
                      <div key={userId} className="admin-user-row">
                        <div className="admin-user-main">
                          <strong>{u.name}</strong>
                          <span className="admin-user-email">{u.email}</span>
                          <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>
                            Last login: {u.lastLogin ? formatDate(u.lastLogin) : 'Never'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          {/* Role Selector */}
                          <select
                            value={(u.role || 'user').toLowerCase()}
                            onChange={(e) => handleRoleChange(userId, e.target.value)}
                            disabled={busyId === userId}
                            className={`role-select role-select-${(u.role || 'user').toLowerCase()}`}
                            title="Change user role"
                          >
                            <option value="user">USER</option>
                            <option value="manager">MANAGER</option>
                            <option value="admin">ADMIN</option>
                          </select>

                          {/* Delete Button */}
                          <button
                            className="btn btn-delete btn-sm"
                            style={{ padding: '6px 10px', fontSize: '14px', borderRadius: 'var(--radius-sm)' }}
                            onClick={() => handleDeleteUser(userId, u.name)}
                            disabled={busyId === userId}
                            title="Delete User"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT TRAIL DASHBOARD */}
        {activeTab === 'audit' && (
          <div className="fade-in">
            <div className="audit-table-wrapper">
              <div className="audit-table-header">
                <div>
                  <h2 className="section-title" style={{ marginBottom: '4px' }}>
                    Real-Time Security & Audit Trail
                  </h2>
                  <p className="dashboard-subtitle">
                    Automated ledger capturing USER_ID, ACTION, RESOURCE, IP, and STATUS.
                  </p>
                </div>
                <div className="audit-controls">
                  <div className="file-search" style={{ width: '220px' }}>
                    <FiSearch />
                    <input
                      type="text"
                      placeholder="Search audit trail..."
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className="form-input"
                    style={{ padding: '8px 12px', fontSize: '13px', width: '150px' }}
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                  >
                    <option value="ALL">All Actions</option>
                    <option value="UPLOAD">Uploads</option>
                    <option value="DOWNLOAD">Downloads</option>
                    <option value="APPROVE">Approvals</option>
                    <option value="REJECT">Rejections</option>
                    <option value="DELETE">Deletions</option>
                    <option value="USER_AUTH">Users & Auth</option>
                  </select>
                  <button
                    className="btn btn-action btn-sm"
                    onClick={fetchAuditLogs}
                    disabled={auditLoading}
                    title="Refresh logs"
                  >
                    <FiRefreshCw className={auditLoading ? 'spin' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {auditLoading ? (
                <p className="dashboard-subtitle">Loading audit logs...</p>
              ) : filteredAuditLogs.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px' }}>
                  <FiActivity className="empty-icon" />
                  <h3>No audit records found</h3>
                  <p>Security and access events will be logged here automatically.</p>
                </div>
              ) : (
                <div className="audit-table-scroll">
                  <table className="audit-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Resource</th>
                        <th>Details</th>
                        <th>IP Address</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuditLogs.map((log) => (
                        <tr key={log.id || log._id}>
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--gray-500)', fontSize: '12px' }}>
                            {formatDate(log.timestamp)}
                          </td>
                          <td style={{ fontWeight: 600 }}>{log.userEmail || log.userId || 'anonymous'}</td>
                          <td>
                            <span className={`audit-badge ${getAuditActionBadgeClass(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--gray-600)' }}>{log.resourceType || '—'}</td>
                          <td style={{ maxWidth: '300px', fontSize: '12px' }} title={log.details}>
                            {log.details || '—'}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--gray-500)' }}>
                            {log.ipAddress || '—'}
                          </td>
                          <td>
                            <span
                              className={`status-badge ${
                                (log.status || '').toUpperCase() === 'SUCCESS' ? 'status-success' : 'status-failure'
                              }`}
                            >
                              {log.status || 'SUCCESS'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: Create User */}
        {showUserModal && (
          <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">Create New User</h3>
              <p className="dashboard-subtitle" style={{ marginBottom: '16px' }}>
                Provision a new identity with role-based access.
              </p>
              <form onSubmit={handleCreateUser}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Full Name"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    required
                  />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Email Address"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    required
                  />
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Initial Password (min 6 chars)"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    required
                  />
                  <select
                    className="form-input"
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  >
                    <option value="user">User (Read & Download approved files)</option>
                    <option value="manager">Manager (Upload & manage team files)</option>
                    <option value="admin">Admin (Full system governance)</option>
                  </select>
                </div>
                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn btn-cancel" onClick={() => setShowUserModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-confirm" disabled={creatingUser}>
                    {creatingUser ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Create Folder */}
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
                  <button type="button" className="btn btn-cancel" onClick={() => setShowFolderModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-confirm">
                    Create Folder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;

// components/FileCard.js - File display card with download and delete actions
import React, { useMemo, useState } from 'react';
import {
  FiFile,
  FiImage,
  FiDownload,
  FiTrash2,
  FiClock,
  FiHardDrive,
  FiUser,
  FiEdit2,
  FiRefreshCw,
  FiRotateCcw,
  FiMessageSquare,
  FiSend,
} from 'react-icons/fi';
import { downloadFileAPI, deleteFileAPI, renameFileAPI, uploadVersionAPI, addCommentAPI } from '../services/api';
import { formatFileSize, formatDate } from '../utils/auth';
import { toast } from 'react-toastify';

const FileCard = ({ file, onDelete, onUpdate, canDelete = false, viewMode = 'grid' }) => {
  const [downloading, setDownloading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newName, setNewName] = useState(file.originalName);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Determine if the file is an image
  const isImage = useMemo(() => file.mimeType?.startsWith('image/'), [file.mimeType]);

  // Get file icon based on type
  const getFileIcon = () => {
    if (isImage) return <FiImage className="file-icon file-icon-image" />;
    return <FiFile className="file-icon file-icon-pdf" />;
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await downloadFileAPI(file._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      let filename = file.originalName;
      const disposition = response.headers ? response.headers['content-disposition'] : null;
      if (disposition && disposition.includes('filename=')) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded "${file.originalName}" successfully!`);
      if (onUpdate) onUpdate(); // Refresh stats
    } catch (error) {
      toast.error('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteFileAPI(file._id);
      toast.success(`Deleted "${file.originalName}" successfully!`);
      setShowDeleteModal(false);
      if (onDelete) onDelete(file._id);
    } catch (error) {
      toast.error('Failed to delete file');
    } finally {
      setDeleting(false);
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!newName.trim() || newName === file.originalName) return;

    try {
      await renameFileAPI(file._id, newName);
      toast.success('File renamed');
      setShowRenameModal(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to rename file');
    }
  };

  const handleVersionUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploadingVersion(true);
    try {
      await uploadVersionAPI(file._id, formData, (progress) => {
        setUploadProgress(Math.round((progress.loaded * 100) / progress.total));
      });
      toast.success('New version uploaded!');
      setShowVersionModal(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to upload version');
    } finally {
      setUploadingVersion(false);
      setUploadProgress(0);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await addCommentAPI(file._id, commentText);
      toast.success('Comment added');
      setCommentText('');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <>
      <div className={`file-card ${viewMode === 'list' ? 'list-view' : ''} ${file.approvalStatus === 'pending' ? 'status-pending' : file.approvalStatus === 'rejected' ? 'status-rejected' : ''}`} id={`file-card-${file._id}`}>
        <div className="file-card-header">
          <div className="file-card-icon-wrapper">{getFileIcon()}</div>
          <div className="file-card-type-badge">
            {file.approvalStatus.toUpperCase()}
          </div>
        </div>

        <div className="file-card-body">
          <h3 className="file-card-name" title={file.originalName}>
            {file.originalName}
          </h3>

          <div className="file-card-meta">
            <div className="file-meta-item">
              <FiHardDrive />
              <span>{formatFileSize(file.fileSize)}</span>
            </div>
            <div className="file-meta-item">
              <FiClock />
              <span>{formatDate(file.updatedAt)}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              {file.versions?.length > 0 && (
                <div className="file-meta-item cursor-pointer" onClick={() => setShowHistoryModal(true)} title="View History">
                  <FiRotateCcw />
                  <span>v{file.versions.length + 1}</span>
                </div>
              )}
              <div className="file-meta-item cursor-pointer" onClick={() => setShowCommentModal(true)} title="Comments">
                <FiMessageSquare />
                <span>{file.comments?.length || 0}</span>
              </div>
              <div className="file-meta-item" title="Downloads">
                <FiDownload style={{ fontSize: '12px' }} />
                <span>{file.downloadCount || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="file-card-actions">
          <button className="btn btn-download" onClick={handleDownload} disabled={downloading} title="Download">
            {downloading ? (
              <>
                <span className="spinner-small"></span>
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <FiDownload />
                <span>Download</span>
              </>
            )}
          </button>

          <button className="btn btn-action" onClick={() => setShowCommentModal(true)} title="Comments">
            <FiMessageSquare />
            <span>Comments</span>
          </button>

          {canDelete && (
            <>
              <button className="btn btn-action" onClick={() => setShowRenameModal(true)} title="Rename">
                <FiEdit2 />
                <span>Rename</span>
              </button>
              <button className="btn btn-action" onClick={() => setShowVersionModal(true)} title="Upload New Version">
                <FiRefreshCw />
                <span>New Version</span>
              </button>
              <button className="btn btn-delete" onClick={() => setShowDeleteModal(true)} title="Delete">
                <FiTrash2 />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="modal-overlay" onClick={() => setShowCommentModal(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">File Comments</h3>
            <p className="dashboard-subtitle" style={{ marginBottom: '16px' }}>Discussion for <strong>{file.originalName}</strong></p>
            
            <div className="version-list" style={{ maxHeight: '250px', background: 'var(--gray-50)', padding: '12px', borderRadius: 'var(--radius)' }}>
              {file.comments?.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '20px' }}>No comments yet. Start the conversation!</p>
              ) : (
                file.comments.map((c, i) => (
                  <div key={i} className="version-item" style={{ background: 'white', marginBottom: '8px' }}>
                    <div className="version-info">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{c.userName}</strong>
                        <span style={{ fontSize: '10px' }}>{formatDate(c.createdAt)}</span>
                      </div>
                      <p style={{ marginTop: '4px', fontSize: '13px', color: 'var(--gray-700)' }}>{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-confirm" disabled={submittingComment} style={{ minWidth: '100px' }}>
                {submittingComment ? '...' : <><FiSend /> Send</>}
              </button>
            </form>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button className="btn btn-confirm" onClick={() => setShowCommentModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Rename File</h3>
            <form onSubmit={handleRename}>
              <input
                type="text"
                className="form-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-cancel" onClick={() => setShowRenameModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-confirm">Rename</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version Upload Modal */}
      {showVersionModal && (
        <div className="modal-overlay" onClick={() => setShowVersionModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Upload New Version</h3>
            <p className="modal-message">Updating <strong>{file.originalName}</strong>. Previous versions will be kept in history.</p>
            <input
              type="file"
              onChange={handleVersionUpload}
              style={{ margin: '20px 0' }}
              disabled={uploadingVersion}
            />
            {uploadingVersion && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={() => setShowVersionModal(false)} disabled={uploadingVersion}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Version History</h3>
            <div className="version-list" style={{ marginTop: '20px' }}>
              <div className="version-item current">
                <div className="version-info">
                  <strong>Current Version (Latest)</strong>
                  <span>{formatDate(file.updatedAt)} • {formatFileSize(file.fileSize)}</span>
                </div>
              </div>
              {file.versions?.slice().reverse().map((v, idx) => (
                <div key={idx} className="version-item">
                  <div className="version-info">
                    <strong>Version {file.versions.length - idx}</strong>
                    <span>{formatDate(v.uploadedAt)} • {formatFileSize(v.fileSize)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button className="btn btn-confirm" onClick={() => setShowHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <FiTrash2 />
            </div>
            <h3 className="modal-title">Delete File</h3>
            <p className="modal-message">
              Are you sure you want to delete{' '}
              <strong>"{file.originalName}"</strong>? This action cannot be
              undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-cancel"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-confirm-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="spinner-small"></span> Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(FileCard);

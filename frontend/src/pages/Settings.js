import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';
import { changePasswordAPI, getUserProfileAPI } from '../services/api';
import { FiLock, FiSave, FiShield, FiActivity, FiClock, FiDownload } from 'react-icons/fi';
import { formatDate } from '../utils/auth';

const Settings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await getUserProfileAPI();
        setProfile(data);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    fetchProfile();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setLoading(true);
    try {
      await changePasswordAPI({ currentPassword, newPassword });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Navbar />
      <main className="dashboard-content fade-in">
        <div className="dashboard-header">
          <div className="dashboard-header-text">
            <h1 className="dashboard-title">
              <FiShield className="dashboard-title-icon" />
              Settings
            </h1>
            <p className="dashboard-subtitle">
              Manage your account settings
            </p>
          </div>
        </div>

        <div className="settings-card" style={{ marginBottom: '24px' }}>
          <div className="files-header-row">
            <h2 className="section-title">
              <FiActivity style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
              Recent Activity
            </h2>
          </div>
          <div className="admin-user-list">
            <div className="admin-user-row">
              <div className="admin-user-main">
                <strong>Last Login</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gray-500)', fontSize: '14px', fontWeight: '500' }}>
                <FiClock />
                <span>{profile?.lastLogin ? formatDate(profile.lastLogin) : 'No recent login recorded'}</span>
              </div>
            </div>
            <div className="admin-user-row">
              <div className="admin-user-main">
                <strong>Recently Downloaded File</strong>
                {profile?.lastDownloadedFile && <span className="admin-user-email">{profile.lastDownloadedFile}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gray-500)', fontSize: '14px', fontWeight: '500' }}>
                <FiDownload />
                <span>{profile?.lastDownloadedAt ? formatDate(profile.lastDownloadedAt) : 'No recent downloads'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h2 className="section-title">Change Password</h2>

          <form className="settings-form" onSubmit={onSubmit}>
            <div className="input-group">
              <div className="input-icon">
                <FiLock />
              </div>
              <input
                type="password"
                className="input-field"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="input-group">
              <div className="input-icon">
                <FiLock />
              </div>
              <input
                type="password"
                className="input-field"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="input-group">
              <div className="input-icon">
                <FiLock />
              </div>
              <input
                type="password"
                className="input-field"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <button className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="spinner-small"></span> : <FiSave />}
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Settings;


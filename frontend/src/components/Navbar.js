// components/Navbar.js - Navigation bar with user info and logout
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUser, removeUser } from '../utils/auth';
import { FiShield, FiLogOut, FiUser, FiSettings } from 'react-icons/fi';

const Navbar = () => {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    removeUser();
    navigate('/login');
  };

  // Get dashboard link based on role
  const getDashboardLink = () => {
    const map = { admin: '/admin', manager: '/manager', user: '/dashboard' };
    return map[user?.role] || '/login';
  };

  // Role badge color
  const getRoleBadgeClass = () => {
    const map = {
      admin: 'role-badge-admin',
      manager: 'role-badge-manager',
      user: 'role-badge-user',
    };
    return map[user?.role] || '';
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-container">
        <Link to={getDashboardLink()} className="navbar-brand">
          <FiShield className="navbar-logo-icon" />
          <span className="navbar-title">VaultShare</span>
        </Link>

        <div className="navbar-right">
          <div className="navbar-user-info">
            <div className="navbar-avatar">
              <FiUser />
            </div>
            <div className="navbar-user-details">
              <span className="navbar-user-name">{user?.name}</span>
              <span className={`role-badge ${getRoleBadgeClass()}`}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
          </div>

          <Link
            to="/settings"
            className="btn btn-settings"
            id="settings-btn"
            title="Settings"
          >
            <FiSettings />
            <span>Settings</span>
          </Link>

          <button
            className="btn btn-logout"
            onClick={handleLogout}
            id="logout-btn"
            title="Logout"
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

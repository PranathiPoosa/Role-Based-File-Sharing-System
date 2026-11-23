// pages/Register.js - Registration page with role selection
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerAPI } from '../services/api';
import { saveUser } from '../utils/auth';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiLock, FiUserPlus, FiShield, FiUsers } from 'react-icons/fi';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { data } = await registerAPI({ name, email, password, role });
      saveUser(data);
      toast.success('Account created successfully!');

      const dashboardMap = {
        admin: '/admin',
        manager: '/manager',
        user: '/dashboard',
      };
      navigate(dashboardMap[data.role] || '/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="auth-card fade-in" id="register-card">
        <div className="auth-header">
          <div className="auth-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <FiShield />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join VaultShare today</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <div className="input-icon">
              <FiUser />
            </div>
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              id="register-name"
            />
          </div>

          <div className="input-group">
            <div className="input-icon">
              <FiMail />
            </div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              id="register-email"
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <div className="input-icon">
              <FiLock />
            </div>
            <input
              type="password"
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              id="register-password"
              autoComplete="new-password"
            />
          </div>

          <div className="role-segment-control">
            <button
              type="button"
              className={`role-segment-btn ${role === 'admin' ? 'active admin' : ''}`}
              onClick={() => setRole('admin')}
            >
              Admin
            </button>
            <button
              type="button"
              className={`role-segment-btn ${role === 'manager' ? 'active manager' : ''}`}
              onClick={() => setRole('manager')}
            >
              Manager
            </button>
            <button
              type="button"
              className={`role-segment-btn ${role === 'user' ? 'active user' : ''}`}
              onClick={() => setRole('user')}
            >
              User
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            id="register-submit"
          >
            {loading ? (
              <span className="spinner-small"></span>
            ) : (
              <FiUserPlus />
            )}
            <span>{loading ? 'Creating account...' : 'Create Account'}</span>
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

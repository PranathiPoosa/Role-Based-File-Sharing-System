// pages/Home.js - Landing page with hero, features, and security sections
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiShield,
  FiUploadCloud,
  FiUsers,
  FiDownload,
  FiLock,
  FiEye,
  FiCheck,
  FiArrowRight,
  FiServer,
  FiKey,
  FiFileText,
} from 'react-icons/fi';

const Home = () => {
  return (
    <div className="landing-page">
      {/* ─── Top Navigation ─── */}
      <nav className="landing-nav" id="landing-navbar">
        <div className="landing-nav-container">
          <Link to="/" className="landing-brand">
            <FiShield className="landing-brand-icon" />
            <span className="landing-brand-text">VaultShare</span>
          </Link>

          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#security" className="landing-nav-link">Security</a>
            <Link to="/register" className="landing-nav-link landing-nav-register">
              Register
            </Link>
            <Link to="/login" className="landing-nav-link landing-nav-signin">
              Sign In
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="hero-section" id="hero">
        <div className="hero-bg-shapes">
          <div className="hero-shape hero-shape-1"></div>
          <div className="hero-shape hero-shape-2"></div>
          <div className="hero-shape hero-shape-3"></div>
          <div className="hero-dot-grid"></div>
        </div>

        <div className="hero-content fade-in">
          <div className="hero-badge">
            <FiLock />
            <span>Secure • Role-Based • Simple</span>
          </div>

          <h1 className="hero-title">
            VaultShare<br />
            <span className="hero-title-accent">with Role-Based Access</span>
          </h1>

          <p className="hero-caption">
            A role-based file sharing system where admins manage, managers upload, and users
            access only what they’re allowed to — protected with JWT authentication.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-hero">
              Get Started Free
              <FiArrowRight />
            </Link>
            <a href="#features" className="btn btn-hero-outline">
              Explore Features
            </a>
          </div>

          <div className="hero-stats-row">
            <div className="hero-stat">
              <span className="hero-stat-icon"><FiUsers /></span>
              <div>
                <strong>3 Roles</strong>
                <span>Admin, Manager, User</span>
              </div>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-icon"><FiLock /></span>
              <div>
                <strong>JWT Secured</strong>
                <span>End-to-end protected</span>
              </div>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-icon"><FiUploadCloud /></span>
              <div>
                <strong>Drag & Drop</strong>
                <span>Easy file uploads</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section className="features-section" id="features">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Features</span>
            <h2 className="section-heading">Everything you need to manage files</h2>
            <p className="section-desc">
              A complete file sharing system with powerful role-based controls and a beautiful interface.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-box feature-icon-blue">
                <FiUploadCloud />
              </div>
              <h3>Drag & Drop Upload</h3>
              <p>Effortlessly upload PDF and image files with an intuitive drag-and-drop interface and real-time progress tracking.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box feature-icon-purple">
                <FiUsers />
              </div>
              <h3>Role-Based Access</h3>
              <p>Three distinct roles — Admin, Manager, and User — each with precisely defined permissions and capabilities.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box feature-icon-green">
                <FiDownload />
              </div>
              <h3>Instant Downloads</h3>
              <p>All authenticated users can browse and download shared files with a single click and download feedback.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box feature-icon-orange">
                <FiEye />
              </div>
              <h3>File Management</h3>
              <p>View file details including size, upload date, uploader info, and file type — all in beautiful card displays.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box feature-icon-pink">
                <FiFileText />
              </div>
              <h3>File Validation</h3>
              <p>Smart file type validation ensures only PDF and image files are accepted, with a 10MB size limit per upload.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box feature-icon-teal">
                <FiServer />
              </div>
              <h3>Full-Stack Solution</h3>
              <p>Built with React, Node.js, Express, and MongoDB — a complete production-ready full-stack application.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Security Section ─── */}
      <section className="security-section" id="security">
        <div className="section-container">
          <div className="security-layout">
            <div className="security-info">
              <span className="section-tag">Security</span>
              <h2 className="section-heading">Enterprise-grade security built in</h2>
              <p className="section-desc">
                VaultShare uses industry-standard security practices to keep your files and data safe at every layer.
              </p>

              <div className="security-list">
                <div className="security-item">
                  <div className="security-check"><FiCheck /></div>
                  <div>
                    <strong>JWT Authentication</strong>
                    <p>Stateless, token-based authentication with secure 7-day expiry for persistent sessions.</p>
                  </div>
                </div>

                <div className="security-item">
                  <div className="security-check"><FiCheck /></div>
                  <div>
                    <strong>Bcrypt Password Hashing</strong>
                    <p>All passwords are salted and hashed with bcrypt before storage — never stored in plain text.</p>
                  </div>
                </div>

                <div className="security-item">
                  <div className="security-check"><FiCheck /></div>
                  <div>
                    <strong>Route Protection</strong>
                    <p>Every API endpoint is protected with middleware that verifies both authentication and role authorization.</p>
                  </div>
                </div>

                <div className="security-item">
                  <div className="security-check"><FiCheck /></div>
                  <div>
                    <strong>File Type Validation</strong>
                    <p>Server-side MIME type checking ensures only safe file types are accepted and stored.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="security-visual">
              <div className="security-card-stack">
                <div className="sec-visual-card sec-card-1">
                  <FiKey className="sec-card-icon" />
                  <span>JWT Token Verified</span>
                </div>
                <div className="sec-visual-card sec-card-2">
                  <FiShield className="sec-card-icon" />
                  <span>Role: Admin ✓</span>
                </div>
                <div className="sec-visual-card sec-card-3">
                  <FiLock className="sec-card-icon" />
                  <span>Access Granted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-box">
            <h2>Ready to start sharing files securely?</h2>
            <p>Create your free account and experience role-based file sharing.</p>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary btn-hero">
                Create Free Account
                <FiArrowRight />
              </Link>
              <Link to="/login" className="btn btn-hero-outline">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
};

export default Home;

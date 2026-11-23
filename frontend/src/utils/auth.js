// utils/auth.js - Token and user management utilities

/**
 * Save user data and token to localStorage
 */
export const saveUser = (userData) => {
  localStorage.setItem('user', JSON.stringify(userData));
};

/**
 * Get user data from localStorage
 */
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Get JWT token from localStorage
 */
export const getToken = () => {
  const user = getUser();
  return user ? user.token : null;
};

/**
 * Remove user data from localStorage (logout)
 */
export const removeUser = () => {
  localStorage.removeItem('user');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Get user role
 */
export const getUserRole = () => {
  const user = getUser();
  return user ? user.role : null;
};

/**
 * Format file size to human readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format date to readable string
 */
export const formatDate = (dateString) => {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

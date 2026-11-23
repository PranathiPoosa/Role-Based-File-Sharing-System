// services/api.js - Axios instance and API service functions
import axios from 'axios';
import { getToken, removeUser } from '../utils/auth';

// Create axios instance with base URL pointing to API Gateway
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Request interceptor - attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 errors (expired/invalid token)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      removeUser();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ Auth API ============
export const registerAPI = (data) => API.post('/auth/register', data);
export const loginAPI = (data) => API.post('/auth/login', data);

// ============ File API ============
export const getFilesAPI = (folderId = null) => 
  API.get('/files', { params: { folderId } });

export const getPendingFilesAPI = () => API.get('/files/pending');

export const approveFileAPI = (id) => API.patch(`/files/${id}/approve`);

export const rejectFileAPI = (id, reason) =>
  API.patch(`/files/${id}/reject`, { reason });

export const uploadFileAPI = (formData, onUploadProgress) =>
  API.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });

export const downloadFileAPI = (id) =>
  API.get(`/files/download/${id}`, { responseType: 'blob' });

export const deleteFileAPI = (id) => API.delete(`/files/${id}`);

export const renameFileAPI = (id, originalName) =>
  API.patch(`/files/${id}/rename`, { originalName });

export const uploadVersionAPI = (id, formData, onUploadProgress) =>
  API.patch(`/files/${id}/version`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });

export const addCommentAPI = (id, text) =>
  API.post(`/files/${id}/comments`, { text });

export const getStatsAPI = () => API.get('/files/stats');

// ============ Folder API ============
export const getFoldersAPI = (parentFolder = null) =>
  API.get('/folders', { params: { parentFolder } });

export const createFolderAPI = (data) => API.post('/folders', data);

export const deleteFolderAPI = (id) => API.delete(`/folders/${id}`);

// ============ User API ============
export const getUserProfileAPI = () => API.get('/users/profile');
export const getAllUsersAPI = () => API.get('/users');
export const createUserAPI = (userData) => API.post('/users', userData);
export const updateUserRoleAPI = (id, role) => API.patch(`/users/${id}/role`, { role });
export const changePasswordAPI = (data) => API.patch('/users/password', data);
export const deleteUserAPI = (id) => API.delete(`/users/${id}`);

// ============ Audit Log API ============
export const getAuditLogsAPI = () => API.get('/audit');

export default API;

// Enhanced API utilities with all new features
const ENHANCED_API_BASE_URL = window.SHAREPLATE_API_BASE_URL || 'http://localhost:5000/api';

// Socket.IO connection
let socket;

const initializeSocket = () => {
  socket = io(window.SHAREPLATE_API_ORIGIN || 'http://localhost:5000');
  
  socket.on('connect', () => {
    console.log('✅ Connected to Socket.IO');
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Disconnected from Socket.IO');
  });
  
  return socket;
};

// Get auth token
const getToken = () => {
  return localStorage.getItem('token');
};

// Set auth token
const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Remove auth token
const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// API request headers
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${ENHANCED_API_BASE_URL}${endpoint}`, {
      ...options,
      headers: getHeaders()
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// GET request
const apiGet = (endpoint) => apiRequest(endpoint, { method: 'GET' });

// POST request
const apiPost = (endpoint, body) => apiRequest(endpoint, {
  method: 'POST',
  body: JSON.stringify(body)
});

// PUT request
const apiPut = (endpoint, body) => apiRequest(endpoint, {
  method: 'PUT',
  body: JSON.stringify(body)
});

// DELETE request
const apiDelete = (endpoint) => apiRequest(endpoint, { method: 'DELETE' });

// File upload request
const apiUpload = async (endpoint, formData) => {
  try {
    const token = getToken();
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${ENHANCED_API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    
    return data;
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
};

// ===================
// ANALYTICS API
// ===================
const getAnalytics = () => apiGet('/analytics/dashboard');
const getLeaderboard = (type, period) => apiGet(`/analytics/leaderboard?type=${type}&period=${period}`);
const getSystemStats = () => apiGet('/analytics/stats');

// ===================
// REVIEWS API
// ===================
const createReview = (reviewData) => apiPost('/reviews', reviewData);
const getUserReviews = (userId, page = 1) => apiGet(`/reviews/user/${userId}?page=${page}`);
const addReviewResponse = (reviewId, text) => apiPut(`/reviews/${reviewId}/response`, { text });
const markReviewHelpful = (reviewId) => apiPut(`/reviews/${reviewId}/helpful`, {});

// ===================
// CHAT API
// ===================
const createOrGetChat = (donationId) => apiPost('/chats', { donationId });
const sendMessage = (chatId, content, type = 'text') => apiPost(`/chats/${chatId}/messages`, { content, type });
const getUserChats = () => apiGet('/chats');
const markChatAsRead = (chatId) => apiPut(`/chats/${chatId}/read`, {});

// ===================
// GAMIFICATION API
// ===================
const getUserBadges = () => apiGet('/gamification/badges');
const checkBadges = () => apiPost('/gamification/check-badges', {});
const getUserRank = () => apiGet('/gamification/rank');
const initializeBadges = () => apiPost('/gamification/initialize-badges', {});

// ===================
// BLOG API
// ===================
const getBlogPosts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiGet(`/blog?${query}`);
};
const getBlogPost = (slug) => apiGet(`/blog/${slug}`);
const addBlogComment = (postId, content) => apiPost(`/blog/${postId}/comments`, { content });
const likeBlogPost = (postId) => apiPut(`/blog/${postId}/like`, {});

// ===================
// NOTIFICATIONS API
// ===================
const getNotifications = (page = 1, isRead) => {
  const params = new URLSearchParams({ page });
  if (isRead !== undefined) params.append('isRead', isRead);
  return apiGet(`/notifications?${params.toString()}`);
};
const markNotificationRead = (notificationId) => apiPut(`/notifications/${notificationId}/read`, {});
const markAllNotificationsRead = () => apiPut('/notifications/read-all', {});
const deleteNotification = (notificationId) => apiDelete(`/notifications/${notificationId}`);
const getNotificationPreferences = () => apiGet('/notifications/preferences');
const updateNotificationPreferences = (prefs) => apiPut('/notifications/preferences', prefs);

// ===================
// UPLOAD API
// ===================
const uploadDonationImages = (files) => {
  const formData = new FormData();
  for (let file of files) {
    formData.append('images', file);
  }
  return apiUpload('/upload/donation-images', formData);
};

const uploadProfileImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return apiUpload('/upload/profile-image', formData);
};

const uploadVerificationDocument = (file, documentType) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('documentType', documentType);
  return apiUpload('/upload/verification-document', formData);
};

// ===================
// REPORTS API
// ===================
const downloadDonationReport = (startDate, endDate) => {
  window.open(`${ENHANCED_API_BASE_URL}/reports/donations?startDate=${startDate}&endDate=${endDate}`, '_blank');
};

const downloadCSVReport = (startDate, endDate) => {
  window.open(`${ENHANCED_API_BASE_URL}/reports/export-csv?startDate=${startDate}&endDate=${endDate}`, '_blank');
};

const downloadTaxCertificate = (year) => {
  window.open(`${ENHANCED_API_BASE_URL}/reports/tax-certificate?year=${year}`, '_blank');
};

// ===================
// ADMIN API
// ===================
const getAdminDashboard = () => apiGet('/admin/dashboard');
const getAllUsers = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiGet(`/admin/users?${query}`);
};
const verifyUser = (userId) => apiPut(`/admin/users/${userId}/verify`, {});
const deactivateUser = (userId) => apiPut(`/admin/users/${userId}/deactivate`, {});
const getAllDonations = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiGet(`/admin/donations?${query}`);
};
const sendAnnouncement = (data) => apiPost('/admin/announcement', data);

// ===================
// UTILITY FUNCTIONS
// ===================

// Format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calculate time ago
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
};

// Show toast notification
const showToast = (message, type = 'info') => {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// Show loading indicator
const showLoading = () => {
  const loader = document.getElementById('global-loader') || createLoader();
  loader.style.display = 'flex';
};

const hideLoading = () => {
  const loader = document.getElementById('global-loader');
  if (loader) loader.style.display = 'none';
};

const createLoader = () => {
  const loader = document.createElement('div');
  loader.id = 'global-loader';
  loader.style.cssText = `
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;
  loader.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(loader);
  return loader;
};

// Handle API errors
const handleApiError = (error, defaultMessage = 'An error occurred') => {
  const message = error.message || defaultMessage;
  showToast(message, 'error');
  return message;
};

// Export all functions
window.SharePlateAPI = {
  // Core
  initializeSocket,
  getToken,
  setToken,
  removeToken,
  
  // Analytics
  getAnalytics,
  getLeaderboard,
  getSystemStats,
  
  // Reviews
  createReview,
  getUserReviews,
  addReviewResponse,
  markReviewHelpful,
  
  // Chat
  createOrGetChat,
  sendMessage,
  getUserChats,
  markChatAsRead,
  
  // Gamification
  getUserBadges,
  checkBadges,
  getUserRank,
  initializeBadges,
  
  // Blog
  getBlogPosts,
  getBlogPost,
  addBlogComment,
  likeBlogPost,
  
  // Notifications
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  
  // Uploads
  uploadDonationImages,
  uploadProfileImage,
  uploadVerificationDocument,
  
  // Reports
  downloadDonationReport,
  downloadCSVReport,
  downloadTaxCertificate,
  
  // Admin
  getAdminDashboard,
  getAllUsers,
  verifyUser,
  deactivateUser,
  getAllDonations,
  sendAnnouncement,
  
  // Utilities
  formatDate,
  timeAgo,
  showToast,
  showLoading,
  hideLoading,
  handleApiError
};

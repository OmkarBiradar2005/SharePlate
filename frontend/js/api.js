// API Base Configuration
const API_BASE_URL = window.SHAREPLATE_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to get authentication token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Helper function to get authentication headers
function getAuthHeaders() {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Generic API request function
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        headers: getAuthHeaders()
    };

    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, config);
        const data = await response.json();

        // Handle authentication errors
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            throw new Error('Authentication failed. Please login again.');
        }

        return data;
    } catch (error) {
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Unable to connect to server. Please check if the server is running.');
        }
        throw error;
    }
}

// GET request helper
async function apiGet(url) {
    return apiRequest(url, {
        method: 'GET'
    });
}

// POST request helper
async function apiPost(url, data) {
    return apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// PUT request helper
async function apiPut(url, data) {
    return apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

// DELETE request helper
async function apiDelete(url) {
    return apiRequest(url, {
        method: 'DELETE'
    });
}

// Utility function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Utility function to format time
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
}

// Utility function to format full date and time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Utility function to check if date is expired
function isExpired(expiryTime) {
    return new Date(expiryTime) < new Date();
}

// Utility function to check if expiring soon (within 24 hours)
function isExpiringSoon(expiryTime) {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const hoursUntilExpiry = (expiry - now) / (1000 * 60 * 60);
    return hoursUntilExpiry < 24 && hoursUntilExpiry > 0;
}

// Utility function to validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Utility function to validate phone number
function isValidPhone(phone) {
    const phoneRegex = /^\d{10,15}$/;
    return phoneRegex.test(phone);
}

// Utility function to show loading state
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading"></div>';
    }
}

// Utility function to hide loading state
function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}

// Utility function to handle API errors
function handleApiError(error, defaultMessage = 'An error occurred') {
    console.error('API Error:', error);
    
    if (error.message) {
        return error.message;
    }
    
    return defaultMessage;
}

// Export functions for use in other files
window.API = {
    apiRequest,
    apiGet,
    apiPost,
    apiPut,
    apiDelete,
    getAuthToken,
    getAuthHeaders,
    formatDate,
    formatTime,
    formatDateTime,
    isExpired,
    isExpiringSoon,
    isValidEmail,
    isValidPhone,
    showLoading,
    hideLoading,
    handleApiError,
    API_BASE_URL
};
// Authentication related functions

// Register a new user
async function register(userData) {
    try {
        const result = await apiPost('/auth/register', userData);
        return result;
    } catch (error) {
        throw new Error(handleApiError(error, 'Registration failed'));
    }
}

// Login user
async function login(credentials) {
    try {
        const result = await apiPost('/auth/login', credentials);
        return result;
    } catch (error) {
        throw new Error(handleApiError(error, 'Login failed'));
    }
}

// Get current user profile
async function getProfile() {
    try {
        const result = await apiGet('/auth/me');
        return result;
    } catch (error) {
        throw new Error(handleApiError(error, 'Failed to get profile'));
    }
}

// Check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return token && user;
}

// Get current user from localStorage
function getCurrentUser() {
    try {
        const userString = localStorage.getItem('user');
        if (userString) {
            return JSON.parse(userString);
        }
        return null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        return null;
    }
}

// Logout user
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// Check if user has required role
function hasRole(requiredRole) {
    const user = getCurrentUser();
    return user && user.role === requiredRole;
}

// Protect pages that require authentication
function requireAuth(redirectUrl = 'login.html') {
    if (!isAuthenticated()) {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

// Protect pages that require specific role
function requireRole(requiredRole, redirectUrl = 'login.html') {
    if (!requireAuth(redirectUrl)) {
        return false;
    }
    
    if (!hasRole(requiredRole)) {
        const user = getCurrentUser();
        if (user.role === 'restaurant') {
            window.location.href = 'donor-dashboard.html';
        } else if (user.role === 'ngo') {
            window.location.href = 'ngo-dashboard.html';
        } else {
            window.location.href = redirectUrl;
        }
        return false;
    }
    
    return true;
}

// Refresh auth token by getting user profile
async function refreshAuth() {
    try {
        const result = await getProfile();
        if (result.success) {
            // Update user data in localStorage
            const currentToken = localStorage.getItem('token');
            const userData = { ...result.data, token: currentToken };
            localStorage.setItem('user', JSON.stringify(userData));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Auth refresh failed:', error);
        logout();
        return false;
    }
}

// Initialize auth state on page load
function initAuth() {
    const token = getAuthToken();
    const user = getCurrentUser();
    
    if (token && user) {
        // Validate token by making a test request
        refreshAuth().catch(() => {
            // Token is invalid, redirect to login
            logout();
            if (!window.location.pathname.includes('login.html') && 
                !window.location.pathname.includes('register.html') &&
                !window.location.pathname.includes('index.html')) {
                window.location.href = 'login.html';
            }
        });
    }
}

// Auto-login check for pages that should redirect authenticated users
function redirectIfAuthenticated() {
    const user = getCurrentUser();
    if (user) {
        if (user.role === 'restaurant') {
            window.location.href = 'donor-dashboard.html';
        } else if (user.role === 'ngo') {
            window.location.href = 'ngo-dashboard.html';
        }
    }
}

// Form validation helpers
function validateRegisterForm(formData) {
    const errors = [];
    
    if (!formData.name || formData.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    
    if (!isValidEmail(formData.email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (!isValidPhone(formData.phone)) {
        errors.push('Please enter a valid phone number (10-15 digits)');
    }
    
    if (!formData.address || formData.address.trim().length < 10) {
        errors.push('Please enter a complete address');
    }
    
    if (!formData.role || !['restaurant', 'ngo'].includes(formData.role)) {
        errors.push('Please select a valid role');
    }
    
    if (!formData.password || formData.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    
    return errors;
}

function validateLoginForm(credentials) {
    const errors = [];
    
    if (!isValidEmail(credentials.email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (!credentials.password) {
        errors.push('Please enter your password');
    }
    
    return errors;
}

// Export functions
window.AUTH = {
    register,
    login,
    getProfile,
    isAuthenticated,
    getCurrentUser,
    logout,
    hasRole,
    requireAuth,
    requireRole,
    refreshAuth,
    initAuth,
    redirectIfAuthenticated,
    validateRegisterForm,
    validateLoginForm
};
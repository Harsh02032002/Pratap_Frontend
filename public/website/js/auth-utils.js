/**
 * Authentication Utility for Roomhy
 * Handles user session management and authentication checks
 */

// Storage keys - each section has isolated session
const AUTH_KEY = 'roomhy_auth';
const USER_KEY = 'user'; // Legacy key for backward compatibility
const WEBSITE_USER_KEY = 'website_user'; // Website/Tenant users
const STAFF_USER_KEY = 'staff_user'; // Staff (SuperAdmin/Manager/Employee)
const OWNER_USER_KEY = 'owner_user'; // Property owners
const WEBSITE_TOKEN_KEY = 'website_token';
const ACCESS_TOKEN_KEY = 'accessToken';
const TOKEN_KEY = 'token';

function getApiUrl() {
    if (typeof window !== 'undefined' && window.API_URL) return window.API_URL;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? 'http://localhost:5001' : window.location.origin;
}

function getStoredToken() {
    try {
        return localStorage.getItem(WEBSITE_TOKEN_KEY) ||
            sessionStorage.getItem(WEBSITE_TOKEN_KEY) ||
            localStorage.getItem(ACCESS_TOKEN_KEY) ||
            sessionStorage.getItem(ACCESS_TOKEN_KEY) ||
            localStorage.getItem(TOKEN_KEY) ||
            sessionStorage.getItem(TOKEN_KEY) ||
            '';
    } catch (_) {
        return '';
    }
}

function normalizeWebsiteUser(user) {
    if (!user || typeof user !== 'object') return null;
    const loginId = user.loginId || user.email || user.id || '';
    return {
        ...user,
        loginId,
        email: user.email || '',
        role: user.role || 'tenant'
    };
}

function setWebsiteSession(user, token) {
    const normalized = normalizeWebsiteUser(user);
    if (!normalized) return null;
    const safeToken = (token || '').toString().trim();
    try {
        localStorage.removeItem(STAFF_USER_KEY);
        sessionStorage.removeItem(STAFF_USER_KEY);
        localStorage.removeItem(OWNER_USER_KEY);
        sessionStorage.removeItem(OWNER_USER_KEY);
        localStorage.removeItem('staff_token');

        localStorage.setItem(WEBSITE_USER_KEY, JSON.stringify(normalized));
        sessionStorage.setItem(WEBSITE_USER_KEY, JSON.stringify(normalized));
        localStorage.setItem(USER_KEY, JSON.stringify(normalized)); // legacy compatibility
        sessionStorage.setItem(USER_KEY, JSON.stringify(normalized)); // legacy compatibility

        if (safeToken) {
            localStorage.setItem(WEBSITE_TOKEN_KEY, safeToken);
            sessionStorage.setItem(WEBSITE_TOKEN_KEY, safeToken);
            localStorage.setItem(ACCESS_TOKEN_KEY, safeToken);
            sessionStorage.setItem(ACCESS_TOKEN_KEY, safeToken);
            localStorage.setItem(TOKEN_KEY, safeToken);
            sessionStorage.setItem(TOKEN_KEY, safeToken);
        }
    } catch (e) {
        console.error('Error setting website session:', e);
    }
    return normalized;
}

function clearWebsiteSession() {
    try {
        localStorage.removeItem(WEBSITE_USER_KEY);
        sessionStorage.removeItem(WEBSITE_USER_KEY);
        localStorage.removeItem(WEBSITE_TOKEN_KEY);
        sessionStorage.removeItem(WEBSITE_TOKEN_KEY);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(USER_KEY);
    } catch (e) {
        console.error('Error clearing website session:', e);
    }
}

/**
 * Get current logged-in user
 * Checks all session types in priority order
 * @returns {Object|null} User object or null if not logged in
 */
function getCurrentUser() {
    try {
        // Try multiple storage locations in priority order
        const userStr = localStorage.getItem(WEBSITE_USER_KEY) ||  // Website tenant user (highest priority)
                       sessionStorage.getItem(WEBSITE_USER_KEY) ||
                       localStorage.getItem(STAFF_USER_KEY) ||     // Staff user
                       sessionStorage.getItem(STAFF_USER_KEY) ||
                       localStorage.getItem(OWNER_USER_KEY) ||     // Owner user
                       sessionStorage.getItem(OWNER_USER_KEY) ||
                       localStorage.getItem(USER_KEY) ||           // Legacy key
                       sessionStorage.getItem(USER_KEY) ||
                       localStorage.getItem(AUTH_KEY);
        
        if (!userStr) return null;
        
        const user = JSON.parse(userStr);
        return normalizeWebsiteUser(user);
    } catch (e) {
        console.error('Error getting current user:', e);
        return null;
    }
}

/**
 * Check if user is logged in
 * @returns {boolean} True if logged in
 */
function isLoggedIn() {
    const user = getCurrentUser();
    return user !== null && !!getStoredToken();
}

/**
 * Get user ID (prioritizes: id > loginId > ownerId)
 * @returns {string} User ID
 */
function getUserId() {
    const user = getCurrentUser();
    if (!user) return '';
    return user.id || user.loginId || user.ownerId || '';
}

/**
 * Get user display name
 * @returns {string} User's first name or name
 */
function getUserName() {
    const user = getCurrentUser();
    if (!user) return 'Guest';
    return user.firstName || user.name || 'User';
}

/**
 * Get user email
 * @returns {string} User's email
 */
function getUserEmail() {
    const user = getCurrentUser();
    if (!user) return '';
    return user.email || user.gmail || user.userEmail || '';
}

/**
 * Get user role
 * @returns {string} User role (tenant, owner, superadmin, areamanager)
 */
function getUserRole() {
    const user = getCurrentUser();
    return user?.role || '';
}

/**
 * Require authentication - redirects to login if not logged in
 * @param {string} loginPage - URL to redirect to (default: login)
 * @param {boolean} showModal - Show session modal instead of redirect
 * @param {string} modalId - ID of modal element to show
 */
function requireAuth(loginPage = 'login', showModal = false, modalId = null) {
    if (!isLoggedIn()) {
        if (showModal && modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                return false;
            }
        }
        window.location.href = loginPage;
        return false;
    }
    return true;
}

async function validateToken() {
    const token = getStoredToken();
    const user = getCurrentUser();
    if (!token || !user) return { valid: false, user: null };

    try {
        const res = await fetch(`${getApiUrl()}/api/auth/me`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
            clearWebsiteSession();
            return { valid: false, user: null };
        }

        const data = await res.json().catch(() => ({}));
        const serverUser = normalizeWebsiteUser((data && data.user) || user);
        if (!serverUser || !serverUser.loginId) {
            clearWebsiteSession();
            return { valid: false, user: null };
        }

        setWebsiteSession(serverUser, token);
        return { valid: true, user: serverUser };
    } catch (e) {
        console.warn('Token validation failed:', e.message);
        clearWebsiteSession();
        return { valid: false, user: null };
    }
}

async function ensureValidSession(redirectPage = 'signup') {
    const result = await validateToken();
    if (result.valid) return true;
    window.location.href = redirectPage;
    return false;
}

function showAuthPromptModal(message = 'Please login or signup to continue.') {
    try {
        const brandedModal = document.getElementById('roomhy-auth-modal');
        if (brandedModal) {
            const description = brandedModal.querySelector('#roomhy-modal-title + p');
            if (description && message) {
                description.textContent = message;
            }

            if (typeof window.roomhyOpenAuthModal === 'function') {
                window.roomhyOpenAuthModal();
                return;
            }

            brandedModal.classList.add('roomhy-modal-active');
            document.body.style.overflow = 'hidden';
            return;
        }

        const existing = document.getElementById('roomhy-auth-prompt-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'roomhy-auth-prompt-overlay';
        overlay.style.cssText = [
            'position:fixed',
            'inset:0',
            'background:rgba(0,0,0,0.5)',
            'display:flex',
            'align-items:center',
            'justify-content:center',
            'z-index:99999',
            'padding:16px'
        ].join(';');

        const modal = document.createElement('div');
        modal.style.cssText = [
            'width:100%',
            'max-width:420px',
            'background:#fff',
            'border-radius:14px',
            'padding:22px',
            'box-shadow:0 20px 40px rgba(0,0,0,0.2)',
            'font-family:Inter, sans-serif'
        ].join(';');

        modal.innerHTML = `
            <h3 style="margin:0 0 8px;font-size:20px;color:#111827;">Sign In Required</h3>
            <p style="margin:0 0 16px;color:#4b5563;font-size:14px;line-height:1.5;">${message}</p>
            <div style="display:flex;gap:10px;">
                <button id="roomhy-auth-login-btn" style="flex:1;padding:10px 12px;border-radius:10px;border:1px solid #2563eb;background:#2563eb;color:#fff;font-weight:600;cursor:pointer;">Login</button>
                <button id="roomhy-auth-signup-btn" style="flex:1;padding:10px 12px;border-radius:10px;border:1px solid #16a34a;background:#16a34a;color:#fff;font-weight:600;cursor:pointer;">Signup</button>
            </div>
            <button id="roomhy-auth-close-btn" style="margin-top:12px;width:100%;padding:9px 12px;border-radius:10px;border:1px solid #d1d5db;background:#fff;color:#374151;font-weight:600;cursor:pointer;">Close</button>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        document.getElementById('roomhy-auth-login-btn')?.addEventListener('click', () => {
            window.location.href = 'login';
        });
        document.getElementById('roomhy-auth-signup-btn')?.addEventListener('click', () => {
            window.location.href = 'signup';
        });
        document.getElementById('roomhy-auth-close-btn')?.addEventListener('click', () => {
            overlay.remove();
        });
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    } catch (err) {
        console.error('showAuthPromptModal error:', err);
    }
}

async function ensureValidSessionOrPrompt(message = 'Please login or signup to continue.') {
    const result = await validateToken();
    if (result.valid) return true;
    showAuthPromptModal(message);
    return false;
}

/**
 * Logout user - clears session and redirects
 * @param {string} redirectPage - URL to redirect after logout (relative to website folder)
 * @param {Function} callback - Optional callback before redirect
 */
function logout(redirectPage = 'login', callback = null) {
    // Clear all session data from localStorage
    clearWebsiteSession();
    localStorage.removeItem('USER_KEY');
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('owner_session');
    localStorage.removeItem('tenant_user');
    localStorage.removeItem('bookingRequestData');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Execute callback if provided
    if (typeof callback === 'function') {
        callback();
    }
    
    // Redirect to login page
    window.location.href = redirectPage;
}

/**
 * Update sidebar with user info
 * @param {Object} options - Configuration options
 * @param {string} options.userIdElementId - Element ID to display user ID
 * @param {string} options.userNameElementId - Element ID to display user name
 * @param {string} options.avatarElementId - Element ID for avatar display
 * @param {boolean} options.showUserId - Whether to show user ID
 */
function updateSidebarUserInfo(options = {}) {
    const {
        userIdElementId = 'sidebar-user-id',
        userNameElementId = 'sidebar-user-name',
        avatarElementId = 'sidebar-avatar',
        showUserId = true
    } = options;
    
    const user = getCurrentUser();
    if (!user) return;
    
    // Update user name
    const nameEl = document.getElementById(userNameElementId);
    if (nameEl) {
        nameEl.textContent = getUserName();
    }
    
    // Update avatar
    const avatarEl = document.getElementById(avatarElementId);
    if (avatarEl) {
        avatarEl.textContent = getUserName().charAt(0).toUpperCase();
    }
    
    // Update user ID if element exists
    if (showUserId) {
        const userIdEl = document.getElementById(userIdElementId);
        if (userIdEl) {
            userIdEl.textContent = getUserId();
            userIdEl.style.display = 'block';
        }
    }
}

/**
 * Initialize authentication on page load
 * @param {Object} config - Configuration
 * @param {string} config.loginPage - Login page URL
 * @param {boolean} config.requireAuth - Whether to require authentication
 * @param {string} config.userIdDisplaySelector - CSS selector for user ID display
 */
function initAuth(config = {}) {
    const {
        loginPage = 'login',
        requireAuth: shouldRequire = true,
        userIdDisplaySelector = '.user-id-display'
    } = config;
    
    // Check authentication
    if (shouldRequire && !requireAuth(loginPage)) {
        return false;
    }
    
    // Update all user ID displays
    const userIdDisplays = document.querySelectorAll(userIdDisplaySelector);
    userIdDisplays.forEach(el => {
        el.textContent = getUserId();
    });
    
    return true;
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.AuthUtils = {
        getCurrentUser,
        isLoggedIn,
        getUserId,
        getUserName,
        getUserEmail,
        getUserRole,
        getStoredToken,
        setWebsiteSession,
        clearWebsiteSession,
        validateToken,
        ensureValidSession,
        ensureValidSessionOrPrompt,
        showAuthPromptModal,
        requireAuth,
        logout,
        updateSidebarUserInfo,
        initAuth
    };

    // Show centered login/signup prompt on protected website pages (no redirect)
    (function autoPromptOnPageLoad() {
        const currentPage = (window.location.pathname.split('/').pop() || '').toLowerCase();
        const publicPages = new Set(['signup', 'login']);
        if (publicPages.has(currentPage)) return;

        document.addEventListener('DOMContentLoaded', async () => {
            const hasSession = await ensureValidSessionOrPrompt('Please login or signup to continue on this page.');
            if (!hasSession) return;
        });
    })();
}


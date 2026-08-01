// API Configuration for RoomHy
// Keep production URL aligned with superadmin pages to avoid split data across backends.
const getAPIURL = () => {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isDevelopment ? 'http://localhost:5001' : window.location.origin;
};

const API_URL = getAPIURL();

// Log configuration for debugging
console.log('🔗 [API Config] Environment:', window.location.hostname === 'localhost' ? 'DEVELOPMENT' : 'PRODUCTION');
console.log('🔗 [API Config] API_URL:', API_URL);

// Test API connectivity (use public endpoints that don't require auth)
(async () => {
    try {
        let testResponse = await fetch(`${API_URL}/api/locations/cities`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (testResponse.status === 404) {
            testResponse = await fetch(`${API_URL}/api/cities`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
        }
        if (testResponse.ok) {
            console.log('✅ [API Config] Backend is accessible');
        } else {
            console.warn('⚠️ [API Config] Backend returned status:', testResponse.status);
        }
    } catch (error) {
        console.warn('⚠️ [API Config] Backend not accessible:', error.message);
        console.warn('⚠️ Data will be stored locally in browser storage');
    }
})();

// Export for use in other scripts
window.API_URL = API_URL;

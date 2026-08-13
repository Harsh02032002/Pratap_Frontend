// Centralized API service for Roomhy React App
// This replaces the vanilla JS API calls with proper React-compatible fetch calls

const getApiUrl = () => {
  if (import.meta.env?.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    return (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5001'
      : window.location.origin;
  }
  return '';
};

// ─── FRONTEND URL UTILITY ────────────────────────────────────────────────────
// Returns the absolute origin of the frontend app (e.g. https://www.roomhy.com).
// Used by any code that needs to build absolute links (e.g. payment email links).
// The backend MUST configure its FRONTEND_URL env var to match this origin so
// that onboarding emails contain a valid absolute URL:
//   CORRECT:  https://www.roomhy.com/payment/gateway?token=<jwt>
//   BROKEN:   payment/gateway?token=<jwt>   ← relative path = "Redirect Notice" error
export const getFrontendUrl = () => {
  if (import.meta.env?.VITE_FRONTEND_URL && import.meta.env.VITE_FRONTEND_URL !== 'undefined') {
    return import.meta.env.VITE_FRONTEND_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://www.roomhy.com';
};

// Absolute URL for the tokenized payment gateway page.
// This is the link sent in the KYC-completion onboarding email.
// Shape: https://www.roomhy.com/payment/gateway?token=<jwt>
export const getPaymentGatewayUrl = (token) =>
  `${getFrontendUrl()}/payment/gateway?token=${encodeURIComponent(token)}`;

export const API_URL = getApiUrl();

// Generic fetch wrapper with error handling
export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user?.token) {
    defaultHeaders['Authorization'] = `Bearer ${user.token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// ==================== Auth API ====================
export const authApi = {
  login: (credentials) => apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  logout: () => {
    localStorage.removeItem('user');
    window.location.href = '/propertyowner/ownerlogin';
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    const user = authApi.getCurrentUser();
    return !!user;
  },

  requireAuth: (requiredRole) => {
    const user = authApi.getCurrentUser();
    if (!user) {
      window.location.href = '/propertyowner/ownerlogin';
      return false;
    }
    if (requiredRole && user.role !== requiredRole) {
      window.location.href = '/propertyowner/ownerlogin';
      return false;
    }
    return true;
  },
};

// ==================== Owner API ====================
export const ownerApi = {
  // Get owner details
  getOwner: (loginId) => apiFetch(`/api/owners/${encodeURIComponent(loginId)}`),

  // Get owner payments/rents
  getOwnerPayments: (ownerId) => apiFetch(`/api/rents/owner/${encodeURIComponent(ownerId)}`),

  // Mark cash as received
  markCashReceived: (rentId, ownerLoginId) => apiFetch('/api/rents/cash/owner-received', {
    method: 'POST',
    body: JSON.stringify({ rentId, ownerLoginId }),
  }),

  // Get owner properties
  getOwnerProperties: (ownerId) => apiFetch(`/api/properties/owner/${encodeURIComponent(ownerId)}`),

  // Get owner rooms
  getOwnerRooms: (ownerId) => apiFetch(`/api/rooms/owner/${encodeURIComponent(ownerId)}`),

  // Get owner tenants
  getOwnerTenants: (ownerId) => apiFetch(`/api/tenants/owner/${encodeURIComponent(ownerId)}`),

  // Get owner bookings
  getOwnerBookings: (ownerId) => apiFetch(`/api/bookings/owner/${encodeURIComponent(ownerId)}`),

  // Get owner enquiries
  getOwnerEnquiries: (ownerId) => apiFetch(`/api/enquiries/owner/${encodeURIComponent(ownerId)}`),

  // Get owner complaints
  getOwnerComplaints: (ownerId) => apiFetch(`/api/complaints/owner/${encodeURIComponent(ownerId)}`),

  // Get owner reviews
  getOwnerReviews: (ownerId) => apiFetch(`/api/reviews/owner/${encodeURIComponent(ownerId)}`),
};

// ==================== Tenant API ====================
export const tenantApi = {
  getTenants: () => apiFetch('/api/tenants'),

  getTenant: (tenantId) => apiFetch(`/api/tenants/${encodeURIComponent(tenantId)}`),

  createTenant: (tenantData) => apiFetch('/api/tenants', {
    method: 'POST',
    body: JSON.stringify(tenantData),
  }),

  updateTenant: (tenantId, tenantData) => apiFetch(`/api/tenants/${encodeURIComponent(tenantId)}`, {
    method: 'PUT',
    body: JSON.stringify(tenantData),
  }),

  deleteTenant: (tenantId) => apiFetch(`/api/tenants/${encodeURIComponent(tenantId)}`, {
    method: 'DELETE',
  }),
};

// ==================== Property API ====================
export const propertyApi = {
  getProperties: () => apiFetch('/api/properties'),

  getProperty: (propertyId) => apiFetch(`/api/properties/${encodeURIComponent(propertyId)}`),

  createProperty: (propertyData) => apiFetch('/api/properties', {
    method: 'POST',
    body: JSON.stringify(propertyData),
  }),

  updateProperty: (propertyId, propertyData) => apiFetch(`/api/properties/${encodeURIComponent(propertyId)}`, {
    method: 'PUT',
    body: JSON.stringify(propertyData),
  }),

  deleteProperty: (propertyId) => apiFetch(`/api/properties/${encodeURIComponent(propertyId)}`, {
    method: 'DELETE',
  }),
};

// ==================== Room API ====================
export const roomApi = {
  getRooms: () => apiFetch('/api/rooms'),

  getRoom: (roomId) => apiFetch(`/api/rooms/${encodeURIComponent(roomId)}`),

  createRoom: (roomData) => apiFetch('/api/rooms', {
    method: 'POST',
    body: JSON.stringify(roomData),
  }),

  updateRoom: (roomId, roomData) => apiFetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
    method: 'PUT',
    body: JSON.stringify(roomData),
  }),

  deleteRoom: (roomId) => apiFetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
    method: 'DELETE',
  }),
};

// ==================== Booking API ====================
export const bookingApi = {
  getBookings: () => apiFetch('/api/bookings'),

  getBooking: (bookingId) => apiFetch(`/api/bookings/${encodeURIComponent(bookingId)}`),

  createBooking: (bookingData) => apiFetch('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  }),

  updateBooking: (bookingId, bookingData) => apiFetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
    method: 'PUT',
    body: JSON.stringify(bookingData),
  }),

  approveBooking: (bookingId) => apiFetch(`/api/bookings/${encodeURIComponent(bookingId)}/approve`, {
    method: 'POST',
  }),

  rejectBooking: (bookingId, reason) => apiFetch(`/api/bookings/${encodeURIComponent(bookingId)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
};

// ==================== Rent API ====================
export const rentApi = {
  getRents: () => apiFetch('/api/rents'),

  getRent: (rentId) => apiFetch(`/api/rents/${encodeURIComponent(rentId)}`),

  createRent: (rentData) => apiFetch('/api/rents', {
    method: 'POST',
    body: JSON.stringify(rentData),
  }),

  updateRent: (rentId, rentData) => apiFetch(`/api/rents/${encodeURIComponent(rentId)}`, {
    method: 'PUT',
    body: JSON.stringify(rentData),
  }),

  markPaid: (rentId, paymentData) => apiFetch(`/api/rents/${encodeURIComponent(rentId)}/mark-paid`, {
    method: 'POST',
    body: JSON.stringify(paymentData),
  }),

  markCashReceived: (rentId, ownerLoginId) => apiFetch('/api/rents/cash/owner-received', {
    method: 'POST',
    body: JSON.stringify({ rentId, ownerLoginId }),
  }),

  getOwnerRents: (ownerId) => apiFetch(`/api/rents/owner/${encodeURIComponent(ownerId)}`),
};

// ==================== Enquiry API ====================
export const enquiryApi = {
  getEnquiries: () => apiFetch('/api/enquiries'),

  getEnquiry: (enquiryId) => apiFetch(`/api/enquiries/${encodeURIComponent(enquiryId)}`),

  createEnquiry: (enquiryData) => apiFetch('/api/enquiries', {
    method: 'POST',
    body: JSON.stringify(enquiryData),
  }),

  updateEnquiry: (enquiryId, enquiryData) => apiFetch(`/api/enquiries/${encodeURIComponent(enquiryId)}`, {
    method: 'PUT',
    body: JSON.stringify(enquiryData),
  }),

  approveEnquiry: (enquiryId) => apiFetch(`/api/enquiries/${encodeURIComponent(enquiryId)}/approve`, {
    method: 'POST',
  }),

  rejectEnquiry: (enquiryId, reason) => apiFetch(`/api/enquiries/${encodeURIComponent(enquiryId)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
};

// ==================== Visit API ====================
export const visitApi = {
  getPendingVisits: () => apiFetch('/api/visits/pending'),

  getApprovedVisits: () => apiFetch('/api/visits/approved'),

  getAllVisits: () => apiFetch('/api/visits/all'),

  getVisit: (visitId) => apiFetch(`/api/visits/${encodeURIComponent(visitId)}`),

  // Single approval path: enforces the owner-KYC gate, provisions the Owner +
  // Property and publishes to the website. The old per-visit route did none of
  // that and has been removed from the backend.
  approveVisit: (visitId, approvalData) => apiFetch('/api/visits/approve', {
    method: 'POST',
    body: JSON.stringify({ visitId, ...(approvalData || {}) }),
  }),

  rejectVisit: (visitId, rejectionData) => apiFetch(`/api/visits/${encodeURIComponent(visitId)}/reject`, {
    method: 'POST',
    body: JSON.stringify(rejectionData || {}),
  }),
};

// ==================== Complaint API ====================
export const complaintApi = {
  getComplaints: () => apiFetch('/api/complaints'),

  getComplaint: (complaintId) => apiFetch(`/api/complaints/${encodeURIComponent(complaintId)}`),

  createComplaint: (complaintData) => apiFetch('/api/complaints', {
    method: 'POST',
    body: JSON.stringify(complaintData),
  }),

  updateComplaint: (complaintId, complaintData) => apiFetch(`/api/complaints/${encodeURIComponent(complaintId)}`, {
    method: 'PUT',
    body: JSON.stringify(complaintData),
  }),

  resolveComplaint: (complaintId) => apiFetch(`/api/complaints/${encodeURIComponent(complaintId)}/resolve`, {
    method: 'POST',
  }),

  getComplaintsByOwner: (ownerId) => apiFetch(`/api/complaints/owner/${encodeURIComponent(ownerId)}`),
};

// ==================== Review API ====================
export const reviewApi = {
  getReviews: () => apiFetch('/api/reviews'),

  getReview: (reviewId) => apiFetch(`/api/reviews/${encodeURIComponent(reviewId)}`),

  createReview: (reviewData) => apiFetch('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData),
  }),

  respondToReview: (reviewId, response) => apiFetch(`/api/reviews/${encodeURIComponent(reviewId)}/respond`, {
    method: 'POST',
    body: JSON.stringify({ response }),
  }),
};

// ==================== Superadmin API ====================
export const superadminApi = {
  getAllUsers: () => apiFetch('/api/superadmin/users'),

  getAllOwners: () => apiFetch('/api/superadmin/owners'),

  getAllTenants: () => apiFetch('/api/superadmin/tenants'),

  getAllProperties: () => apiFetch('/api/superadmin/properties'),

  getAllBookings: () => apiFetch('/api/superadmin/bookings'),

  getAllPayments: () => apiFetch('/api/superadmin/payments'),

  getPlatformStats: () => apiFetch('/api/superadmin/stats'),

  manageUser: (userId, action) => apiFetch(`/api/superadmin/users/${encodeURIComponent(userId)}/${action}`, {
    method: 'POST',
  }),
};

// ==================== Utility Functions ====================
export const formatCurrency = (amount) => {
  const value = Number(amount || 0);
  return `INR ${value.toLocaleString('en-IN')}`;
};

export const formatDate = (input) => {
  if (!input) return '-';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-IN');
};

export const escapeHtml = (value) => {
  return String(value || '')
    .replace(/&/g, '&amp;amp;')
    .replace(/</g, '&amp;lt;')
    .replace(/>/g, '&amp;gt;')
    .replace(/"/g, '&amp;quot;')
    .replace(/'/g, '&amp;#39;');
};

export const normalizeStatus = (rent) => {
  if (rent.cashRequestStatus === 'requested' || rent.cashRequestStatus === 'otp_sent') return 'pending';
  if (rent.cashRequestStatus === 'paid' || rent.paymentStatus === 'paid' || rent.paymentStatus === 'completed') return 'received';
  if (rent.paymentStatus === 'overdue' || rent.paymentStatus === 'defaulted') return 'overdue';
  return 'pending';
};

export default {
  API_URL,
  apiFetch,
  authApi,
  ownerApi,
  tenantApi,
  propertyApi,
  roomApi,
  bookingApi,
  rentApi,
  enquiryApi,
  visitApi,
  complaintApi,
  reviewApi,
  superadminApi,
  formatCurrency,
  formatDate,
  escapeHtml,
  normalizeStatus,
};

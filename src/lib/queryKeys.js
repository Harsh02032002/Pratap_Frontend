 // Centralized, reusable query keys — the ONLY place keys are defined.
// No inline array keys anywhere else in the app.
//
// Convention: `all` is the domain root (invalidating it invalidates every
// sub-query in that domain). More specific keys extend the root so partial
// invalidation stays predictable.

export const queryKeys = {
  currentUser: {
    all: ["currentUser"],
  },

  notifications: {
    all: ["notifications"],
    // A recipient's paginated/filtered feed.
    list: (loginId, params = {}) => ["notifications", "list", loginId, params],
    unreadCount: (loginId) => ["notifications", "unreadCount", loginId],
  },

  attendance: {
    all: ["attendance"],
    // The logged-in staff member's own attendance for a month.
    mine: (staffLoginId, month, year) => ["attendance", "mine", staffLoginId, month, year],
    // Tenant attendance for an owner on a given date.
    tenants: (ownerLoginId, date, propertyId = "") => ["attendance", "tenants", ownerLoginId, date, propertyId],
    // One tenant's attendance history for a month.
    tenantHistory: (ownerLoginId, tenantId, month, year, propertyId = "") => [
      "attendance", "tenantHistory", ownerLoginId, tenantId, month, year, propertyId,
    ],
  },

  tasks: {
    all: ["tasks"],
    byStaff: (staffLoginId) => ["tasks", "staff", staffLoginId],
    byOwner: (ownerLoginId) => ["tasks", "owner", ownerLoginId],
    byStatus: (scopeId, status) => ["tasks", "status", scopeId, status],
  },

  visitors: {
    all: ["visitors"],
    byOwner: (ownerLoginId, params = {}) => ["visitors", "owner", ownerLoginId, params],
    passes: (ownerLoginId, params = {}) => ["visitors", "passes", ownerLoginId, params],
  },

  tenants: {
    all: ["tenants"],
    byOwner: (ownerLoginId) => ["tenants", "owner", ownerLoginId],
  },

  rooms: {
    all: ["rooms"],
    byOwner: (ownerLoginId) => ["rooms", "owner", ownerLoginId],
  },

  electricity: {
    all: ["electricity"],
    byOwner: (ownerLoginId) => ["electricity", "owner", ownerLoginId],
  },

  complaints: {
    all: ["complaints"],
    byOwner: (ownerLoginId) => ["complaints", "owner", ownerLoginId],
  },

  rents: {
    all: ["rents"],
    byOwner: (ownerLoginId) => ["rents", "owner", ownerLoginId],
    byTenant: (tenantLoginId) => ["rents", "tenant", tenantLoginId],
    cashRequests: (ownerLoginId, params = {}) => ["rents", "cashRequests", ownerLoginId, params],
    cashRequest: (requestId) => ["rents", "cashRequest", requestId],
    cashStatus: (tenantLoginId) => ["rents", "cashStatus", tenantLoginId],
  },

  announcements: {
    all: ["announcements"],
    byOwner: (ownerLoginId) => ["announcements", "owner", ownerLoginId],
  },

  properties: {
    all: ["properties"],
    byOwner: (ownerLoginId) => ["properties", "owner", ownerLoginId],
  },
};

export default queryKeys;

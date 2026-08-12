import { fetchJson, getApiBase } from "./api";
import { cacheGet, cacheSet, cacheInvalidate } from "./cache";
import { getOwnerSession } from "./ownerSession";
import { getStaffSession } from "./staffAccess";

const OWNER_LOGIN_ID_REGEX = /^ROOMHY\d{4,}$/i;
const WEBSITE_USER_ID_REGEX = /^roomhyweb\d{6}$/i;

const readJson = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
};

const writeJson = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {
    // ignore
  }
};

const _fetchCache = {};
const _CACHE_TTL = 3 * 60_000; // 3 minutes — reduces repeated layout property fetches
const _getCached = (key) => { const e = _fetchCache[key]; return e && Date.now() - e.ts < _CACHE_TTL ? e.data : null; };
const _setCached = (key, data) => { _fetchCache[key] = { data, ts: Date.now() }; };

export const clearOwnerFetchCache = (loginId) => {
  const id = String(loginId || "").trim().toUpperCase();
  delete _fetchCache[`props_${id}_false`];
  delete _fetchCache[`props_${id}_true`];
  delete _fetchCache[`props_${loginId}_false`];
  delete _fetchCache[`props_${loginId}_true`];
  delete _fetchCache[`tenants_${id}`];
  delete _fetchCache[`tenants_${loginId}`];
  delete _fetchCache[`active_tenants_${id}`];
  delete _fetchCache[`active_tenants_${loginId}`];
  Object.keys(_fetchCache).forEach(k => {
    if (k.startsWith(`rooms_${id}`) || k.startsWith(`rooms_${loginId}`) || k.startsWith("rooms_prop_")) {
      delete _fetchCache[k];
    }
  });
};

const EMPLOYEE_CACHE_TTL = 3 * 60 * 1000;

export const ownerEmployeesCacheKey = (ownerLoginId, { isActive = false } = {}) =>
  isActive ? `employees:active:${ownerLoginId}` : `employees:${ownerLoginId}`;

/** Clear both employee list caches used by maintenance vs all-staff pages. */
export const invalidateOwnerEmployeeCaches = (ownerLoginId) => {
  if (!ownerLoginId) return;
  cacheInvalidate(`employees:${ownerLoginId}`);
  cacheInvalidate(`employees:active:${ownerLoginId}`);
  cacheInvalidate(`staff:${ownerLoginId}`);
};

/**
 * Fetch owner staff/employees. Never caches empty lists (avoids stale empty dropdowns).
 * @param {string} ownerLoginId
 * @param {{ force?: boolean, isActive?: boolean }} opts
 */
export const fetchOwnerEmployees = async (ownerLoginId, { force = false, isActive = false } = {}) => {
  const key = ownerEmployeesCacheKey(ownerLoginId, { isActive });
  if (!force) {
    const cached = cacheGet(key);
    if (Array.isArray(cached) && cached.length > 0) return cached;
  }
  try {
    const qs = new URLSearchParams({ parentLoginId: String(ownerLoginId) });
    if (isActive) qs.set("isActive", "true");
    const res = await fetchJson(`/api/employees?${qs.toString()}`);
    const staff = res?.data || [];
    if (staff.length > 0) cacheSet(key, staff, EMPLOYEE_CACHE_TTL);
    else cacheInvalidate(key);
    return staff;
  } catch (err) {
    console.error("fetchOwnerEmployees error:", err);
    return [];
  }
};

export const clearTenantDocCache = (tenantId) => {
  delete _fetchCache[`tenant_${tenantId}`];
};

export const normalizeOwnerLoginId = (raw) => {
  const value = String(raw || "").trim().toUpperCase();
  return OWNER_LOGIN_ID_REGEX.test(value) ? value : "";
};

export const normalizeWebsiteChatUserId = (raw) => {
  const value = String(raw || "").trim().toLowerCase();
  if (WEBSITE_USER_ID_REGEX.test(value)) return value;
  const digits = value.replace(/\D/g, "").slice(-6);
  if (digits.length === 6) return `roomhyweb${digits}`;
  return "";
};

export const generateWebsiteChatUserIdFromEmail = (email) => {
  const safeEmail = String(email || "").trim().toLowerCase();
  if (!safeEmail) return "";
  let hash = 0;
  for (let i = 0; i < safeEmail.length; i += 1) {
    hash = (hash * 31 + safeEmail.charCodeAt(i)) % 1000000;
  }
  return `roomhyweb${String(hash).padStart(6, "0")}`;
};

export const generateWebsiteChatUserIdFromBooking = (booking = {}) => {
  const base = String(booking?._id || booking?.id || booking?.bookingId || "").trim();
  if (!base) return "";
  const digits = base.replace(/\D/g, "").slice(-6);
  if (digits.length === 6) return `roomhyweb${digits}`;
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 33 + base.charCodeAt(i)) % 1000000;
  }
  return `roomhyweb${String(hash).padStart(6, "0")}`;
};

export const resolveWebsiteChatUserId = (booking = {}) => {
  const fromEmail = generateWebsiteChatUserIdFromEmail(
    booking?.email || booking?.userEmail || booking?.gmail || booking?.contactEmail || booking?.user_email || ""
  );
  if (fromEmail) return fromEmail;

  const fromExplicitId = normalizeWebsiteChatUserId(
    booking?.website_user_id || booking?.websiteUserId || booking?.user_login_id || booking?.userLoginId || booking?.signup_user_id || booking?.user_id || ""
  );
  if (fromExplicitId) return fromExplicitId;

  return generateWebsiteChatUserIdFromBooking(booking);
};

export const filterByActiveProperty = (list, isProperty = false) => {
  if (typeof window === "undefined") return list;
  const session = getOwnerSession();
  
  let targetPropertyId = null;

  if (session?.role === 'manager' && session?.assignedProperty) {
    // Managers are hard-locked to their assigned property
    targetPropertyId = typeof session.assignedProperty === 'string' 
      ? session.assignedProperty 
      : (session.assignedProperty?._id || session.assignedProperty?.id);
  } else {
    // Owners can switch context
    try {
      const activeContext = localStorage.getItem('owner_active_property');
      if (activeContext && activeContext !== 'all') {
        targetPropertyId = activeContext;
      }
    } catch (_) {}
  }

  if (targetPropertyId) {
    return list.filter(item => {
      const propId = isProperty ? (item._id || item.id) : (item.property?._id || item.property || item.propertyId || item.property_id || item.property_name);
      return String(propId) === String(targetPropertyId) || (isProperty && item.title === session?.assignedProperty?.title);
    });
  }
  
  return list;
};

export const getActiveOwnerPropertyId = () => {
  if (typeof window === "undefined") return "";
  try {
    const activeContext = localStorage.getItem("owner_active_property");
    return activeContext && activeContext !== "all" ? String(activeContext) : "";
  } catch {
    return "";
  }
};

export const getOwnerRuntimeSession = () => {
  const session = getOwnerSession();
  if (session?.loginId) return session;
  if (typeof window === "undefined") return null;
  const loginId = new URLSearchParams(window.location.search).get("loginId");
  if (loginId) return { loginId: String(loginId).toUpperCase(), name: "Owner" };

  // Staff proxy: an owner-scoped staff member who was granted an Owner Panel
  // feature acts on behalf of their parent owner, so owner pages resolve and
  // fetch data for that parent owner. Route access is still gated per-permission
  // by canAccessOwnerPathAsStaff (see App.jsx StaffRouteGuard).
  const staff = getStaffSession();
  if (staff?.parentLoginId) {
    return {
      loginId: String(staff.parentLoginId).toUpperCase(),
      name: staff.name || "Staff",
      role: staff.role || "Staff",
      isStaffProxy: true,
      staffLoginId: staff.loginId,
      permissions: Array.isArray(staff.permissions) ? staff.permissions : [],
      // Staff are locked to their assigned property — the switcher uses these to
      // hide "All Properties" and pin their context (owners are unrestricted).
      assignedProperty: staff.assignedProperty || "",
      assignedPropertyName: staff.assignedPropertyName || "",
    };
  }
  return null;
};

export const clearOwnerRuntimeSession = () => {
  try {
    sessionStorage.removeItem("owner_session");
    localStorage.removeItem("owner_session");
    sessionStorage.removeItem("owner_user");
    localStorage.removeItem("owner_user");
    localStorage.removeItem("owner_active_property");
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");
  } catch (_) {
    // ignore
  }
};

export const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

export const formatMoney = (value) => {
  const amount = Number(value || 0);
  return `Rs ${Number.isFinite(amount) ? amount : 0}`;
};

export const normalizeTenant = (tenant = {}, propertyMap = new Map()) => {
  const propertyId = tenant.property?._id || tenant.property || tenant.propertyId;
  const propertyObj = typeof propertyId === "string" ? propertyMap.get(String(propertyId)) : tenant.property;
  return {
    ...tenant,
    key: tenant._id || tenant.id || tenant.loginId || tenant.email || Math.random().toString(36).slice(2),
    displayName: tenant.name || tenant.fullName || "Tenant",
    loginId: tenant.loginId || tenant.tenantLoginId || "-",
    email: tenant.email || tenant.gmail || "-",
    phone: tenant.phone || tenant.mobile || "-",
    propertyObj: propertyObj || tenant.property || null,
    propertyTitle: tenant.property?.title || propertyObj?.title || tenant.propertyName || tenant.propertyTitle || "-",
    roomNumber: tenant.room?.number || tenant.roomNo || tenant.roomNumber || "-",
    rent: tenant.rentAmount || tenant.rent || tenant.roomRent || "-",
    status: tenant.status || (tenant.moveOutDate ? "moved out" : "active"),
    moveInDate: tenant.moveInDate || tenant.createdAt || null,
    moveOutDate: tenant.moveOutDate || null,
    locationCode: tenant.locationCode || propertyObj?.locationCode || tenant.area || "-",
    kycStatus: tenant.kycStatus || tenant.kycVerificationStatus || "pending"
  };
};

export const normalizeBooking = (item = {}) => ({
  ...item,
  ownerLoginId: normalizeOwnerLoginId(item.owner_id || item.ownerId || item.owner_login_id || item.ownerLoginId || item.owner || ""),
  key: item._id || item.id || item.bookingId || item.user_id || Math.random().toString(36).slice(2),
  bidId: item._id || item.id || "-",
  propertyId: item.property_id || item.propertyId || item.property?._id || "-",
  propertyName: item.property_name || item.propertyName || item.property?.title || "-",
  ownerName: item.owner_name || item.ownerName || item.owner || "-",
  area: item.area || item.property?.area || item.locationCode || "-",
  type: item.request_type || item.type || item.propertyType || "-",
  rent: item.rent || item.rentAmount || item.rent_amount || item.price || item.totalAmount || item.total_amount || "-",
  userId: resolveWebsiteChatUserId(item) || item.user_id || item.userId || item.signup_user_id || "-",
  userName: item.name || item.tenantName || item.fullName || "-",
  phone: item.phone || item.mobile || "-",
  email: item.email || "-",
  city: item.city || item.filter_criteria?.city || "-",
  gender: item.gender || item.filter_criteria?.gender || "-",
  minPrice: item.bid_min || item.minPrice || "-",
  maxPrice: item.bid_max || item.maxPrice || "-",
  budgetRange:
    item.budgetRange ||
    item.filter_criteria?.priceRange ||
    ((item.bid_min || item.bid_max)
      ? `${item.bid_min || "-"} - ${item.bid_max || "-"}`
      : "-"),
  request_type: item.request_type || item.requestType || item.type || "",
  status: item.status || "pending",
  guardianName: item.guardian_name || item.guardianName || "-",
  guardianPhone: item.guardian_phone || item.guardianPhone || "-",
  fullAddress: item.address_street ? `${item.address_street}, ${item.address_city || ""}, ${item.address_state || ""}` : (item.address || "-"),
  visitDate: item.visit_date || item.visitDate || null,
  visitTime: item.visit_time_slot || item.visitTime || "-",
  message: item.message || "-",
  createdAt: item.created_at || item.createdAt || null,
  checkInDate: item.check_in_date || item.checkInDate || item.start_date || null
});

const matchesOwnerLoginId = (candidate, ownerId) =>
  normalizeOwnerLoginId(candidate) === normalizeOwnerLoginId(ownerId);

export const normalizeBid = (item = {}) => ({
  ...item,
  key: item._id || item.id || item.bidId || Math.random().toString(36).slice(2),
  bidId: item.bidId || item._id || item.id || "-",
  propertyId: item.property_id || item.propertyId || "-",
  propertyName: item.property_name || item.propertyName || "-",
  ownerName: item.owner_name || item.ownerName || "-",
  fullName: item.fullName || item.name || "-",
  email: item.gmail || item.email || "-",
  gender: item.gender || "-",
  city: item.city || "-",
  area: item.area || "-",
  minPrice: item.minPrice || "-",
  maxPrice: item.maxPrice || "-",
  propertyType: item.propertyType || "-",
  budgetRange: item.budgetRange || ((item.minPrice || item.maxPrice) ? `${item.minPrice || "-"} - ${item.maxPrice || "-"}` : "-"),
  status: item.status || "pending",
  submittedAt: item.createdAt || item.submittedAt || null
});

export const downloadCsv = (filename, rows) => {
  if (typeof window === "undefined" || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const fetchOwnerProperties = async (loginId, bypassFilter = false) => {
  const _cacheKey = `props_${loginId}_${bypassFilter}`;
  const _hit = _getCached(_cacheKey);
  if (_hit) return _hit;
  let response = await fetchJson(`/api/owners/${encodeURIComponent(loginId)}/properties`);
  let properties = (response?.properties || []).filter((item) => {
    const candidateOwner = item?.ownerLoginId || item?.ownerId || item?.owner || "";
    return candidateOwner && matchesOwnerLoginId(candidateOwner, loginId);
  });

  if (!bypassFilter) {
    properties = filterByActiveProperty(properties, true);
  }

  const session = getOwnerSession();

  writeJson("roomhy_properties", properties);
  _setCached(_cacheKey, properties);
  return properties;
};

export const fetchOwnerRooms = async (loginId, page = 1, limit = 50, skipCache = false) => {
  const normalizedId = String(loginId || "").trim().toUpperCase();
  const _cacheKey = `rooms_${normalizedId}_${page}_${limit}`;
  if (!skipCache) {
    const _hit = _getCached(_cacheKey);
    if (_hit) return _hit;
  }
  try {
    const response = await fetchJson(`/api/owners/${encodeURIComponent(normalizedId)}/rooms?page=${page}&limit=${limit}`);
    let backendRooms = response?.rooms || response?.data || [];
    
    backendRooms = filterByActiveProperty(backendRooms);
    
    // Normalize backend rooms to match frontend format
    const rooms = backendRooms.map(room => ({
      ...room,
      number: room.title || room.number || room.roomNo || "Room",
      roomNo: room.title || room.number || room.roomNo || "Room",
      rent: room.price || room.rent || 0,
      roomRent: room.price || room.rent || 0,
      roomType: room.type || "AC",
      beds: room.beds, // keep as-is (number) for toLegacyBeds to use bedCount
      capacity: room.beds || 1,
      totalBeds: room.beds || 1,
      bedAssignments: Array.isArray(room.bedAssignments) ? room.bedAssignments : [],
      propertyId: room.property?._id || room.property || room.propertyId,
      propertyTitle: room.property?.title || room.propertyTitle || "",
      ownerLoginId: room.property?.ownerLoginId || room.ownerLoginId || loginId
    }));
    
    writeJson("roomhy_rooms", rooms);
    const _result = { ...response, rooms, propertyTotals: response?.propertyTotals || {} };
    _setCached(_cacheKey, _result);
    return _result;
  } catch (_) {
    let rooms = readJson("roomhy_rooms", []);
    rooms = filterByActiveProperty(rooms, false);
    return { rooms, propertyTotals: {} };
  }
};

export const fetchRoomsByPropertyId = async (propertyId, page = 1, limit = 5) => {
  const _cacheKey = `rooms_prop_${propertyId}_${page}_${limit}`;
  const _hit = _getCached(_cacheKey);
  if (_hit) return _hit;
  try {
    const response = await fetchJson(`/api/rooms/property/${encodeURIComponent(propertyId)}?page=${page}&limit=${limit}`);
    let backendRooms = response?.rooms || response?.data || [];
    
    const rooms = backendRooms.map(room => ({
      ...room,
      number: room.title || room.number || room.roomNo || "Room",
      roomNo: room.title || room.number || room.roomNo || "Room",
      rent: room.price || room.rent || 0,
      roomRent: room.price || room.rent || 0,
      roomType: room.type || "AC",
      beds: room.beds,
      capacity: room.beds || 1,
      totalBeds: room.beds || 1,
      bedAssignments: Array.isArray(room.bedAssignments) ? room.bedAssignments : [],
      propertyId: room.property?._id || room.property || propertyId,
      propertyTitle: room.property?.title || room.propertyTitle || "",
    }));
    
    const _result = { ...response, rooms, total: response?.total || 0 };
    _setCached(_cacheKey, _result);
    return _result;
  } catch (_) {
    return { rooms: [], total: 0 };
  }
};

export const addElectricityReading = async (roomId, payload) => {
  return fetchJson(`/api/rooms/${encodeURIComponent(roomId)}/readings`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const fetchOwnerTenants = async (loginId, skipCache = true) => {
  const _cacheKey = `tenants_${loginId}`;
  if (!skipCache) {
    const _hit = _getCached(_cacheKey);
    if (_hit) return _hit;
  }
  try {
    const response = await fetchJson(`/api/owners/${encodeURIComponent(loginId)}/tenants?nodues=true&t=${Date.now()}`);
    let tenants = response?.tenants || response?.data || [];
    tenants = filterByActiveProperty(tenants);
    writeJson("roomhy_tenants", tenants);
    _setCached(_cacheKey, tenants);
    return tenants;
  } catch (_) {
    try {
      const response = await fetchJson(`/api/tenants/owner/${encodeURIComponent(loginId)}?t=${Date.now()}`);
      let tenants = Array.isArray(response) ? response : response?.tenants || response?.data || [];
      tenants = filterByActiveProperty(tenants);
      writeJson("roomhy_tenants", tenants);
      _setCached(_cacheKey, tenants);
      return tenants;
    } catch (_) {
      const response = await fetchJson(`/api/owners/${encodeURIComponent(loginId)}/tenants?t=${Date.now()}`);
      let tenants = response?.tenants || [];
      tenants = filterByActiveProperty(tenants);
      writeJson("roomhy_tenants", tenants);
      _setCached(_cacheKey, tenants);
      return tenants;
    }
  }
};


export const fetchTenantById = async (tenantId) => {
  if (!tenantId) return null;
  const _cacheKey = `tenant_${tenantId}`;
  const _hit = _getCached(_cacheKey);
  if (_hit) return _hit;
  const response = await fetchJson(`/api/tenants/${encodeURIComponent(tenantId)}`);
  const tenant = response?.tenant || response?.data || response || null;
  if (tenant) _setCached(_cacheKey, tenant);
  return tenant;
};

export const fetchActiveOwnerTenants = async (loginId) => {
  const _cacheKey = `active_tenants_${loginId}`;
  const _hit = _getCached(_cacheKey);
  if (_hit) return _hit;
  const all = await fetchOwnerTenants(loginId);
  const active = (all || []).filter((t) => (!t.status || t.status === "active") && (t.kycStatus === "verified" || t.kyc === "verified"));
  _setCached(_cacheKey, active);
  return active;
};

export const fetchAllTenants = async () => {
  const response = await fetchJson("/api/tenants");
  const tenants = Array.isArray(response) ? response : response?.tenants || response?.data || [];
  writeJson("roomhy_tenants", tenants);
  return tenants;
};

export const fetchPropertyMap = async () => {
  try {
    const response = await fetchJson("/api/properties");
    const properties = Array.isArray(response) ? response : response?.properties || response?.data || [];
    writeJson("roomhy_properties", properties);
    return new Map(properties.map((item) => [String(item._id || item.id), item]));
  } catch (_) {
    const properties = readJson("roomhy_properties", []);
    return new Map(properties.map((item) => [String(item._id || item.id), item]));
  }
};

export const createRoom = async (payload) => {
  const response = await fetchJson("/api/rooms", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  clearOwnerFetchCache(payload?.ownerLoginId);
  return response?.room || response?.data || response;
};

export const bulkCreateRooms = async (payload) => {
  const response = await fetchJson("/api/rooms/bulk", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  clearOwnerFetchCache(payload?.ownerLoginId);
  return response?.rooms || response?.data || response;
};

export const updateRoom = async (roomId, payload) => fetchJson(`/api/rooms/${encodeURIComponent(roomId)}`, {
  method: "PUT",
  body: JSON.stringify(payload)
});

export const deleteRoom = async (roomId, ownerLoginId) => {
  const response = await fetchJson(`/api/rooms/${encodeURIComponent(roomId)}`, {
    method: "DELETE"
  });
  if (ownerLoginId) clearOwnerFetchCache(ownerLoginId);
  return response;
};

export const assignTenant = async (payload) => fetchJson("/api/tenants/assign", {
  method: "POST",
  body: JSON.stringify(payload)
});

export const deleteTenantRecord = async (id) => fetchJson(`/api/tenants/${encodeURIComponent(id)}`, {
  method: "DELETE"
});

export const updateTenant = async (id, payload) => fetchJson(`/api/tenants/${encodeURIComponent(id)}`, {
  method: "PATCH",
  body: JSON.stringify(payload)
});

export const updateBookingDecision = async (bookingId, action) => {
  const endpoint = action === "approve" ? "approve" : "reject";
  return fetchJson(`/api/booking/requests/${encodeURIComponent(bookingId)}/${endpoint}`, { method: "PUT" });
};

export const fetchBookingRequestsForOwner = async (ownerId) => {
  const response = await fetchJson(`/api/booking/requests?owner_id=${encodeURIComponent(ownerId)}`);
  const list = Array.isArray(response) ? response : response?.requests || response?.data || [];
  let filtered = list.filter((item) => {
    const candidateOwner = item?.owner_id || item?.ownerId || item?.owner_login_id || item?.ownerLoginId || item?.owner || "";
    return candidateOwner && matchesOwnerLoginId(candidateOwner, ownerId);
  });
  return filterByActiveProperty(filtered);
};

export const fetchBids = async (ownerId) => {
  try {
    const response = await fetchJson(`/api/booking/requests?owner_id=${encodeURIComponent(ownerId)}&type=bid`);
    return Array.isArray(response) ? response : response?.data || response?.requests || [];
  } catch (_) {
    return [];
  }
};

export const createOwnerChatRoom = async ({ bookingId, userName, userEmail, userLoginId, ownerId, ownerName, propertyName }) =>
  fetchJson("/api/chat/create", {
    method: "POST",
    body: JSON.stringify({
      bookingId,
      userName,
      userEmail,
      userLoginId: resolveWebsiteChatUserId({ bookingId, id: bookingId, email: userEmail, user_id: userLoginId, signup_user_id: userLoginId }),
      ownerId: normalizeOwnerLoginId(ownerId) || ownerId,
      ownerName,
      propertyName
    })
  });

export const fetchConversation = async (ownerId, userId) =>
  fetchJson(`/api/chat/conversation?user1=${encodeURIComponent(ownerId)}&user2=${encodeURIComponent(userId)}`);

export const buildBookingFormLink = (booking) => {
  const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const ownerName = booking.owner_name || booking.ownerName || booking.owner || "";
  const tenantName = booking.name || booking.userName || booking.tenantName || "";
  const tenantEmail = booking.email || booking.userEmail || booking.tenantEmail || "";
  const params = new URLSearchParams({
    bookingId: booking._id || booking.id || "",
    userId: resolveWebsiteChatUserId(booking),
    ownerId: normalizeOwnerLoginId(booking.ownerId || booking.ownerLoginId || booking.owner_id || booking.ownerLoginId || ""),
    propertyId: booking.property_id || booking.propertyId || "",
    propertyName: booking.property_name || booking.propertyName || "",
    ownerName,
    tenantName,
    tenantEmail
  });
  return `${base}/propertyowner/booking-form?${params.toString()}`;
};

export const getSocketUrl = () => getApiBase();

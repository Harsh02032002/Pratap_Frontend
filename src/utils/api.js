import { fetchPropertiesLocal } from './mockApi';

// ---------------------------------------------------------------------------
// Module-level request cache
// Deduplicates concurrent calls and avoids redundant network fetches.
// Two components calling fetchCities() at the same time share one in-flight
// Promise and one cached response for the TTL window.
// ---------------------------------------------------------------------------
const _cache = new Map();
const _CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Second-level cache for the already-formatted properties array.
// Prevents re-running _formatProperty on every fetchProperties() call
// when the underlying HTTP response is already cached.
let _formattedPropertiesCache = null;
let _formattedPropertiesCacheTs = 0;

// In-flight GET request deduplication.
// If the exact same GET URL is requested while one is already in-flight,
// the existing Promise is returned — no second network request is made.
const _inflightRequests = new Map();

const _fetchCached = (url, ttlMs = _CACHE_TTL_MS) => {
  const entry = _cache.get(url);
  if (entry && Date.now() - entry.ts < ttlMs) return entry.promise;
  const promise = fetchJson(url).catch(err => {
    _cache.delete(url); // never cache a failed request
    throw err;
  });
  _cache.set(url, { promise, ts: Date.now() });
  return promise;
};

export const getApiBase = () => {
  // Use Vite env variable if available
  if (import.meta.env?.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') {
    return import.meta.env.VITE_API_URL;
  }
  
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  
  // Local development
  const isLocal = host === "localhost" || 
                  host === "127.0.0.1" || 
                  host.startsWith("192.168.") || 
                  host.startsWith("10.") || 
                  host.startsWith("172.") || 
                  host.endsWith(".local");
  if (isLocal) return `http://${host}:5001`;

  // Production — use current origin (so /api calls map to live backend)
  return window.location.origin;
};

// Read JWT for the Authorization: Bearer header on every request.
// sessionStorage is checked FIRST because it is isolated per browser tab: this
// lets an owner (tab A) and one of their staff (tab B) stay signed in at the
// same time in the same browser without the shared localStorage `token` from one
// clobbering the other. Falls back to localStorage for flows that only persist
// there. Cookie is also set by the backend for httpOnly support.
export const getAuthHeader = () => {
  const token =
    sessionStorage.getItem("token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("website_token") ||
    localStorage.getItem("website_token") ||
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function parseApiError(err) {
  const raw = err?.body;
  let parsed = null;

  if (typeof raw === "string" && raw.trim()) {
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      parsed = null;
    }
  }

  const message =
    parsed?.message ||
    parsed?.error ||
    err?.message ||
    "Something went wrong. Please try again later.";

  return {
    raw,
    parsed,
    message,
    status: err?.status,
  };
}

export const fetchJson = (path, options = {}) => {
  // `timeout` is a per-call override (ms) — pulled out so it isn't passed to fetch().
  const { timeout: timeoutMs = 12000, ...fetchOptions } = options;
  const base = getApiBase();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const method = (fetchOptions.method || 'GET').toUpperCase();

  // Return the existing in-flight Promise for identical GET requests
  if (method === 'GET') {
    const existing = _inflightRequests.get(url);
    if (existing) return existing;
  }

  const promise = (async () => {
    const hasBody = method !== 'GET' && method !== 'HEAD';
    const headers = {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(fetchOptions.headers || {}),
      ...getAuthHeader(),
    };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        credentials: "include",
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        let errorMsg = `Request failed: ${res.status} ${res.statusText}`;
        try {
          const parsed = JSON.parse(text);
          const msg = parsed.message || parsed.error;
          if (msg) errorMsg = msg + (parsed.details ? `: ${parsed.details}` : '');
        } catch (_) {}
        const err = new Error(errorMsg);
        err.status = res.status;
        err.body = text;
        throw err;
      }
      return res.json();
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('Request timed out. Please try again.');
        timeoutErr.status = 408;
        timeoutErr.name = 'TimeoutError';
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  })().finally(() => {
    if (method === 'GET') _inflightRequests.delete(url);
  });

  if (method === 'GET') _inflightRequests.set(url, promise);
  return promise;
};

const DEFAULT_CITIES = [
  { name: "Chandigarh" }, { name: "Kota" }, { name: "Indore" }, { name: "Jaipur" }, { name: "Delhi" },
  { name: "Bhopal" }, { name: "Nagpur" }, { name: "Jodhpur" }, { name: "Mumbai" },
  { name: "Bangalore" }, { name: "Chennai" }, { name: "Pune" }, { name: "Ahmedabad" }, { name: "Sikar" }
];

// Fetch cities from backend — cached 10 minutes (cities rarely change)
export const fetchCities = async () => {
  try {
    const data = await _fetchCached('/api/locations/cities', 10 * 60 * 1000);
    const list = data.data || data || [];
    if (Array.isArray(list) && list.length > 0) return list;
    return DEFAULT_CITIES;
  } catch (error) {
    console.error('Error fetching cities:', error);
    return DEFAULT_CITIES;
  }
};

// Fetch areas from backend — cached 10 minutes
export const fetchAreas = async () => {
  try {
    const data = await _fetchCached('/api/locations/areas', 10 * 60 * 1000);
    return data.data || data || [];
  } catch (error) {
    console.error('Error fetching areas:', error);
    return [];
  }
};

// Static properties for Vercel deployment
const staticPropertiesList = [
  {
    _id: "static1",
    property_name: "Roomhy Boys PG - Kota",
    propertyName: "Roomhy Boys PG - Kota",
    city: "Kota",
    address: "Talwandi, Kota, Rajasthan 324005",
    propertyType: "pg",
    monthlyRent: 8000,
    rent: 8000,
    owner_name: "Verified Owner",
    owner_phone: "9000000001",
    owner_id: "ROOMHY9999",
    gender: "male",
    status: "active",
    isPublished: true,
    images: [
      "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"
    ],
    propertyViews: [
      { 
        label: "Facade", 
        images: [
          "https://picsum.photos/800/600?random=1001",
          "https://picsum.photos/800/600?random=1002",
          "https://picsum.photos/800/600?random=1003",
          "https://picsum.photos/800/600?random=1004"
        ] 
      },
      { 
        label: "Reception", 
        images: [
          "https://picsum.photos/800/600?random=2001",
          "https://picsum.photos/800/600?random=2002"
        ] 
      },
      { 
        label: "Room", 
        images: [
          "https://picsum.photos/800/600?random=3001",
          "https://picsum.photos/800/600?random=3002",
          "https://picsum.photos/800/600?random=3003"
        ] 
      },
      { 
        label: "Common Area", 
        images: [
          "https://picsum.photos/800/600?random=4001",
          "https://picsum.photos/800/600?random=4002"
        ] 
      },
      { 
        label: "Mess/Food", 
        images: [
          "https://picsum.photos/800/600?random=5001",
          "https://picsum.photos/800/600?random=5002"
        ] 
      }
    ],
    amenities: [
      { title: "High-Speed WiFi", description: "24/7 unlimited internet access", icon: "wifi" },
      { title: "Air Conditioning", description: "Centralized AC in all rooms", icon: "ac" },
      { title: "Food Included", description: "3 meals + tea/coffee", icon: "food" },
      { title: "Laundry Service", description: "Weekly pickup and delivery", icon: "laundry" },
      { title: "Parking", description: "Secure bike and car parking", icon: "parking" },
      { title: "Gym", description: "Fully equipped fitness center", icon: "gym" },
      { title: "TV Room", description: "LCD TV with cable connection", icon: "tv" },
      { title: "Power Backup", description: "24/7 generator backup", icon: "power" }
    ],
    featuredImage: "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static2",
    property_name: "Roomhy Girls Hostel - Indore",
    propertyName: "Roomhy Girls Hostel - Indore",
    city: "Indore",
    address: "Vijay Nagar, Indore, Madhya Pradesh 452010",
    propertyType: "hostel",
    monthlyRent: 10000,
    rent: 10000,
    owner_name: "Verified Owner",
    owner_phone: "9000000002",
    owner_id: "ROOMHY9999",
    gender: "female",
    status: "active",
    isPublished: true,
    images: [
      "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/279719/pexels-photo-279719.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=600"
    ],
    propertyViews: [
      { 
        label: "Facade", 
        images: [
          "https://picsum.photos/800/600?random=1101",
          "https://picsum.photos/800/600?random=1102",
          "https://picsum.photos/800/600?random=1103"
        ] 
      },
      { 
        label: "Reception", 
        images: [
          "https://picsum.photos/800/600?random=2101",
          "https://picsum.photos/800/600?random=2102"
        ] 
      },
      { 
        label: "Room", 
        images: [
          "https://picsum.photos/800/600?random=3101",
          "https://picsum.photos/800/600?random=3102",
          "https://picsum.photos/800/600?random=3103",
          "https://picsum.photos/800/600?random=3104"
        ] 
      },
      { 
        label: "Common Area", 
        images: [
          "https://picsum.photos/800/600?random=4101",
          "https://picsum.photos/800/600?random=4102"
        ] 
      },
      { 
        label: "Mess/Food", 
        images: [
          "https://picsum.photos/800/600?random=5101",
          "https://picsum.photos/800/600?random=5102",
          "https://picsum.photos/800/600?random=5103"
        ] 
      }
    ],
    amenities: [
      { title: "High-Speed WiFi", description: "24/7 unlimited internet access", icon: "wifi" },
      { title: "Air Conditioning", description: "Centralized AC in all rooms", icon: "ac" },
      { title: "Food Included", description: "3 meals + evening snacks", icon: "food" },
      { title: "Laundry Service", description: "Daily pickup and delivery", icon: "laundry" },
      { title: "Parking", description: "Secure two-wheeler parking", icon: "parking" },
      { title: "Gym", description: "Basic fitness equipment", icon: "gym" },
      { title: "TV Room", description: "Common area with entertainment", icon: "tv" },
      { title: "Power Backup", description: "Inverter backup for all rooms", icon: "power" }
    ],
    featuredImage: "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static3",
    property_name: "Roomhy Co-living - Jaipur",
    propertyName: "Roomhy Co-living - Jaipur",
    city: "Jaipur",
    address: "Malviya Nagar, Jaipur, Rajasthan 302017",
    propertyType: "co-living",
    monthlyRent: 12000,
    rent: 12000,
    owner_name: "Verified Owner",
    owner_phone: "9000000003",
    owner_id: "ROOMHY9999",
    gender: "any",
    status: "active",
    isPublished: true,
    images: [
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=600"
    ],
    propertyViews: [
      { label: "Facade", images: ["https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"] },
      { label: "Lobby", images: ["https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=600"] },
      { label: "Kitchen", images: ["https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=600"] }
    ],
    featuredImage: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static4",
    property_name: "Roomhy Apartments - Delhi",
    propertyName: "Roomhy Apartments - Delhi",
    city: "Delhi",
    address: "Dwarka, New Delhi, Delhi 110075",
    propertyType: "apartment",
    monthlyRent: 25000,
    rent: 25000,
    owner_name: "Verified Owner",
    owner_phone: "9000000004",
    owner_id: "ROOMHY9999",
    gender: "any",
    status: "active",
    isPublished: true,
    images: [
      "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=600"
    ],
    featuredImage: "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static5",
    property_name: "Roomhy Student PG - Bhopal",
    propertyName: "Roomhy Student PG - Bhopal",
    city: "Bhopal",
    address: "MP Nagar, Bhopal, Madhya Pradesh 462016",
    propertyType: "pg",
    monthlyRent: 6000,
    rent: 6000,
    owner_name: "Verified Owner",
    owner_phone: "9000000005",
    owner_id: "ROOMHY9999",
    gender: "male",
    status: "active",
    isPublished: true,
    images: [
      "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"
    ],
    featuredImage: "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static6",
    property_name: "Roomhy Luxury PG - Nagpur",
    propertyName: "Roomhy Luxury PG - Nagpur",
    city: "Nagpur",
    address: "Civil Lines, Nagpur, Maharashtra 440001",
    propertyType: "pg",
    monthlyRent: 15000,
    rent: 15000,
    owner_name: "Verified Owner",
    owner_phone: "9000000006",
    owner_id: "ROOMHY9999",
    gender: "male",
    status: "active",
    isPublished: true,
    images: [
      "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"
    ],
    featuredImage: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static7",
    property_name: "Roomhy Working Women PG - Jodhpur",
    propertyName: "Roomhy Working Women PG - Jodhpur",
    city: "Jodhpur",
    address: "Paota, Jodhpur, Rajasthan 342001",
    propertyType: "pg",
    monthlyRent: 9000,
    rent: 9000,
    owner_name: "Verified Owner",
    owner_phone: "9000000007",
    owner_id: "ROOMHY9999",
    gender: "female",
    status: "active",
    isPublished: true,
    images: [
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/2360673/pexels-photo-2360673.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600"
    ],
    featuredImage: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static8",
    property_name: "Roomhy Budget PG - Mumbai",
    propertyName: "Roomhy Budget PG - Mumbai",
    city: "Mumbai",
    address: "Andheri, Mumbai, Maharashtra 400053",
    propertyType: "pg",
    monthlyRent: 7000,
    rent: 7000,
    owner_name: "Verified Owner",
    owner_phone: "9000000008",
    owner_id: "ROOMHY9999",
    gender: "male",
    status: "active",
    isPublished: true,
    images: [
      "https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600"
    ],
    featuredImage: "https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static9",
    property_name: "Roomhy Executive Hostel - Bangalore",
    propertyName: "Roomhy Executive Hostel - Bangalore",
    city: "Bangalore",
    address: "Electronic City, Bangalore, Karnataka 560100",
    propertyType: "hostel",
    monthlyRent: 18000,
    rent: 18000,
    owner_name: "Verified Owner",
    owner_phone: "9000000009",
    owner_id: "ROOMHY9999",
    gender: "male",
    status: "active",
    isPublished: true,
    images: [
      "https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=600"
    ],
    featuredImage: "https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static10",
    property_name: "Roomhy Family PG - Chennai",
    propertyName: "Roomhy Family PG - Chennai",
    city: "Chennai",
    address: "T Nagar, Chennai, Tamil Nadu 600017",
    propertyType: "pg",
    monthlyRent: 13000,
    rent: 13000,
    owner_name: "Verified Owner",
    owner_phone: "9000000010",
    owner_id: "ROOMHY9999",
    gender: "any",
    status: "active",
    isPublished: true,
    images: [
      "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600",
      "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600"
    ],
    featuredImage: "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600"
  }
];

// Shared property formatter — used by fetchProperties and fetchPropertyByVisitId
const _formatProperty = (p) => {
  const imagesArray = p.images || p.photos || p.propertyInfo?.photos || [];
  const firstImage = imagesArray[0] || `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`;
  return {
    ...p,
    _id: String(p._id || p.visitId || ''),
    visitId: p.visitId || p._id,
    property_name: p.property_name || p.propertyName || p.propertyInfo?.name || 'Property',
    name: p.property_name || p.propertyName || p.propertyInfo?.name || 'Property',
    city: p.city || p.propertyInfo?.city || 'Unknown',
    location: p.propertyInfo?.area ? `${p.propertyInfo.area}, ${p.city || p.propertyInfo?.city}` : (p.city || p.propertyInfo?.city || 'Unknown'),
    owner_name: p.owner_name || p.ownerName || p.generatedCredentials?.ownerName || p.approvedBy || 'Verified Owner',
    owner_phone: p.owner_phone || p.contactPhone || p.ownerPhone || p.propertyInfo?.phone || '9000000000',
    propertyName: p.propertyName || p.property_name || p.propertyInfo?.name || 'Property',
    propertyType: p.propertyType || p.property_type || p.propertyInfo?.propertyType || 'PG',
    monthlyRent: p.monthlyRent || p.rent || p.propertyInfo?.rent || 5000,
    image: firstImage,
    images: imagesArray,
    latitude: p.latitude || p.propertyInfo?.latitude || p.propertyInfo?.location?.coordinates?.[1] || null,
    longitude: p.longitude || p.propertyInfo?.longitude || p.propertyInfo?.location?.coordinates?.[0] || null,
    beds: (() => {
      const fromRoomTypes = (p.roomTypes || p.propertyInfo?.roomTypes || [])
        .reduce((acc, rt) => acc + parseInt(rt.totalRooms || rt.total_rooms || 0), 0);
      return fromRoomTypes || p.propertyInfo?.totalSeats || p.totalRooms || p.beds || 1;
    })(),
    owner_id: p.owner_id || p.ownerLoginId || p.generatedCredentials?.loginId || p.ownerLoginId,
    isPremium: p.isPremium || p.is_premium || p.propertyInfo?.isPremium || false,
    gender: p.gender || p.genderSuitability || p.propertyInfo?.genderSuitability || 'Co-ed'
  };
};

// Fetch properties from backend — cached 5 minutes
export const fetchProperties = async () => {
  // Return already-formatted result if still fresh — skips _formatProperty re-run
  const now = Date.now();
  if (_formattedPropertiesCache && (now - _formattedPropertiesCacheTs) < _CACHE_TTL_MS) {
    return _formattedPropertiesCache;
  }
  try {
    const data = await _fetchCached('/api/approved-properties/public/approved');
    const properties = Array.isArray(data) ? data : data?.properties || data?.data || [];
    const totalCount = data?.total || properties.length;
    const formattedProperties = properties.map(_formatProperty);
    formattedProperties.total = totalCount;
    _formattedPropertiesCache = formattedProperties;
    _formattedPropertiesCacheTs = now;
    return formattedProperties;
  } catch (error) {
    console.error('fetchProperties failed, using static fallback:', error.message);
    const staticFormatted = staticPropertiesList.map(p => ({
      ...p,
      image: p.images?.[0] || p.featuredImage || `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`,
      images: p.images || [],
      owner_id: p.owner_id
    }));
    staticFormatted.total = staticPropertiesList.length;
    return staticFormatted;
  }
};

// Fetch a single property by visitId or MongoDB _id.
// Always uses the targeted single-property endpoint which returns all fields
// (including propertyViews, roomTypes, facilities, pricing, policies that are
// excluded from the listing endpoint to reduce payload size).
export const fetchPropertyByVisitId = async (visitId) => {
  const data = await fetchJson(`/api/approved-properties/${visitId}`);
  const prop = data.property || data;
  return _formatProperty(prop);
};

// Fetch stats for homepage
export const fetchStats = async () => {
  try {
    const [properties, cities] = await Promise.all([fetchProperties(), fetchCities()]);
    const liveProperties = properties.filter(p => p.isLiveOnWebsite === true || p.status === 'live' || p.status === 'approved');
    const uniqueCities = new Set(liveProperties.map(p => p.city || p.propertyInfo?.city)).size;
    const totalBeds = liveProperties.reduce((acc, p) => acc + (parseInt(p.totalSeats || p.beds || p.propertyInfo?.totalSeats || 1) || 1), 0);
    return {
      cities: uniqueCities || cities.length || 15,
      residences: liveProperties.length || 450,
      beds: totalBeds || 70000
    };
  } catch (error) {
    return { cities: 15, residences: 450, beds: 70000 };
  }
};

// Fetch reviews from backend
export const fetchReviews = async (limit = 10) => {
  try {
    const data = await fetchJson(`/api/reviews?limit=${limit}`);
    return data.data || data || [];
  } catch (error) {
    return [];
  }
};

// Fetch featured reviews for homepage
export const fetchFeaturedReviews = async (limit = 6) => {
  try {
    const data = await fetchJson(`/api/reviews/featured?limit=${limit}`);
    return data.data || data || [];
  } catch (error) {
    return [];
  }
};

// Fetch top rated reviews
export const fetchTopRatedReviews = async (limit = 6) => {
  try {
    const data = await fetchJson(`/api/reviews/top-rated?limit=${limit}`);
    return data.data || data || [];
  } catch (error) {
    return [];
  }
};

// Track view on featured listing
export const trackFeaturedView = async (id) => {
  try {
    await fetchJson(`/api/featured/${id}/view`, { method: 'POST' });
  } catch (error) {
    console.error('Error tracking view:', error);
  }
};

// Track click on featured listing
export const trackFeaturedClick = async (id) => {
  try {
    await fetchJson(`/api/featured/${id}/click`, { method: 'POST' });
  } catch (error) {
    console.error('Error tracking click:', error);
  }
};

// Track view on property
export const trackPropertyView = async (id) => {
  try {
    await fetchJson(`/api/properties/${id}/view`, { method: 'POST' });
  } catch (error) {
    console.error('❌ API: Error tracking property view:', error);
  }
};

// Track click on property
export const trackPropertyClick = async (id) => {
  try {
    await fetchJson(`/api/properties/${id}/click`, { method: 'POST' });
  } catch (error) {
    console.error('❌ API: Error tracking property click:', error);
  }
};

// Submit website enquiry
export const submitEnquiry = async (formData) => {
  return fetchJson('/api/website-enquiry/submit', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
};

// Submit bid
export const submitBid = async (bidData) => {
  return fetchJson('/api/booking/create', {
    method: 'POST',
    body: JSON.stringify(bidData)
  });
};

// Reviews API
export const getPropertyReviews = async (propertyId) => {
  try {
    const data = await fetchJson(`/api/reviews/property/${propertyId}`);
    return data.data || [];
  } catch (error) {
    console.error('Error fetching property reviews:', error);
    return [];
  }
};

export const getPropertyReviewStats = async (propertyId) => {
  try {
    const data = await fetchJson(`/api/reviews/property/${propertyId}/stats`);
    return data.data || { avgRating: 0, totalReviews: 0, ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  } catch (error) {
    console.error('Error fetching property review stats:', error);
    return { avgRating: 0, totalReviews: 0, ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }
};

export const checkUserReview = async (propertyId) => {
  try {
    const data = await fetchJson(`/api/reviews/property/${propertyId}/user-review`);
    return data;
  } catch (error) {
    console.error('Error checking user review:', error);
    return { hasReviewed: false, review: null };
  }
};

export const submitReview = async (reviewData) => {
  return fetchJson('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData)
  });
};

// Fetch property types/categories for offerings
export const fetchPropertyTypes = async () => {
  // ============================================
  // REAL API - Uncomment when ready to use database
  // ============================================
  try {
    const response = await fetchJson('/api/property-types');
    if (response && response.success && response.data && response.data.length > 0) {
      return response.data;
    }
  } catch (error) {
    // API not available, fall through to static types
  }
  // ============================================

  // Static fallback — no external API dependency
  const typeMap = {
      'pg': { 
        title: 'PG', 
        category: 'PG', 
        description: 'Comfortable paying guest accommodations with all amenities', 
        images: [
          'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=600'
        ]
      },
      'hostel': { 
        title: 'Hostel', 
        category: 'Hostel', 
        description: 'Affordable hostel living for students and working professionals', 
        images: [
          'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600'
        ]
      },
      'coliving': { 
        title: 'Co-living', 
        category: 'Co-living', 
        description: 'Modern co-living spaces with community and facilities', 
        images: [
          'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600'
        ]
      },
      'apartment': { 
        title: 'Apartment/Flats', 
        category: 'Apartment', 
        description: 'Private apartments for individuals and small groups', 
        images: [
          'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600'
        ]
      },
      'list': {
        title: 'List Your Property',
        category: 'list',
        description: 'Are you a property owner? List your property with Roomhy and reach thousands of students.',
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1000&auto=format&fit=crop'
        ],
        link: '/website/list'
      }
    };

  return Object.values(typeMap);
};

// Search properties by location and property type
export const searchPropertiesByLocation = async (latitude, longitude, propertyType = null, radiusKm = 10) => {
  try {
    const properties = await fetchProperties();
    
    // Store total count from API before filtering
    const totalCount = properties.total || properties.length;
    
    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Get nearby coordinates (mock data - in real app, fetch from db)
    const coordinatesByCity = {
      'Kota': { lat: 25.2048, lon: 75.8615 },
      'Indore': { lat: 22.7196, lon: 75.8577 },
      'Jaipur': { lat: 26.9124, lon: 75.7873 },
      'Delhi': { lat: 28.6139, lon: 77.2090 },
      'Bhopal': { lat: 23.1815, lon: 79.9864 },
      'Nagpur': { lat: 21.1458, lon: 79.0882 },
      'Mumbai': { lat: 19.0760, lon: 72.8777 },
      'Bangalore': { lat: 12.9716, lon: 77.5946 }
    };

    let filtered = [...properties];

    // Filter by distance if coordinates provided
    if (latitude && longitude) {
      filtered = properties.filter(p => {
        const coords = coordinatesByCity[p.city || p.propertyInfo?.city];
        if (!coords) return false;
        const distance = calculateDistance(latitude, longitude, coords.lat, coords.lon);
        return distance <= radiusKm;
      });
    }

    // Filter by property type
    if (propertyType) {
      filtered = filtered.filter(p => {
        const type = p.propertyType || p.propertyInfo?.propertyType || p.type;
        return type && type.toLowerCase().includes(propertyType.toLowerCase());
      });
    }

    // Sort by distance (nearest first)
    filtered.sort((a, b) => {
      const coordsA = coordinatesByCity[a.city || a.propertyInfo?.city];
      const coordsB = coordinatesByCity[b.city || b.propertyInfo?.city];
      if (!coordsA || !coordsB) return 0;
      const distA = calculateDistance(latitude, longitude, coordsA.lat, coordsA.lon);
      const distB = calculateDistance(latitude, longitude, coordsB.lat, coordsB.lon);
      return distA - distB;
    });

    // Preserve total count on the filtered array
    filtered.total = totalCount;
    
    return filtered;
  } catch (error) {
    console.error('Error searching properties by location:', error);
    return [];
  }
};

// Get nearby areas for a location
export const getNearbyAreas = async (latitude, longitude, city) => {
  try {
    const [areas, cities] = await Promise.all([fetchAreas(), fetchCities()]);
    
    // Find selected city object to get its ID
    const selectedCityObj = cities.find(c => (typeof c === 'object' ? c.name : c) === city);
    const selectedCityId = selectedCityObj?._id || selectedCityObj?.id || '';

    // Filter areas by city
    const cityAreas = areas.filter(a => {
      if (typeof a === 'string') return a.split('-')[0] === city;
      
      const cityName = (a.cityName || a.city?.name || '').toLowerCase().trim();
      const cityIdStr = (a.cityId || a.city?._id || a.city || '').toString();
      const selectedCityLower = city.toLowerCase().trim();

      return cityName === selectedCityLower || 
             cityName.includes(selectedCityLower) || 
             (selectedCityId && cityIdStr === selectedCityId);
    });

    return cityAreas.map(a => typeof a === 'string' ? a : a.name);
  } catch (error) {
    console.error('Error fetching nearby areas:', error);
    return [];
  }
};

// Get institutions/colleges for a city
export const getInstitutions = async (city) => {
  try {
    const cities = await fetchCities();
    const cityData = cities.find(c => (typeof c === 'object' ? c.name : c) === city);
    
    if (typeof cityData === 'object' && cityData.colleges) {
      return cityData.colleges;
    }

    // Fallback: fetch from properties with institution data
    const properties = await fetchProperties();
    const institutions = new Set();
    
    properties
      .filter(p => (p.city || p.propertyInfo?.city) === city)
      .forEach(p => {
        if (p.propertyInfo?.landmarks) {
          p.propertyInfo.landmarks.forEach(l => institutions.add(l));
        }
      });

    return Array.from(institutions);
  } catch (error) {
    console.error('Error fetching institutions:', error);
    return [];
  }
};

// Get price range for property type
export const getPriceRangeByType = async (propertyType) => {
  try {
    const properties = await fetchProperties();
    
    const filtered = properties.filter(p => {
      const type = p.propertyType || p.propertyInfo?.propertyType || p.type;
      return type && type.toLowerCase().includes(propertyType.toLowerCase());
    });

    if (filtered.length === 0) {
      return { min: 0, max: 0, average: 0 };
    }

    const rents = filtered.map(p => p.monthlyRent || p.rent || p.propertyInfo?.rent || 0).filter(r => r > 0);
    const min = Math.min(...rents);
    const max = Math.max(...rents);
    const average = Math.round(rents.reduce((a, b) => a + b, 0) / rents.length);

    return { min, max, average, count: filtered.length };
  } catch (error) {
    console.error('Error fetching price range:', error);
    return { min: 0, max: 0, average: 0, count: 0 };
  }
};

// Fetch all colleges for properties from backend
export const fetchAllCollegesForProperties = async () => {
  try {
    const data = await fetchJson('/api/approved-properties/colleges/all');
    return {
      colleges: data.colleges || [],
      allColleges: data.allColleges || [],
      success: data.success || false
    };
  } catch (error) {
    console.error('Error fetching colleges:', error);
    return { colleges: [], allColleges: [], success: false };
  }
};

// Fetch nearby colleges/institutes from OpenStreetMap API
export const fetchNearbyColleges = async (latitude, longitude, city = '', radiusKm = 2) => {
  try {
    // Simple place search for colleges/universities in the city
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `format=json&` +
      `q=college university school institute ${city}&` +
      `lat=${latitude}&` +
      `lon=${longitude}&` +
      `limit=10`,
      { 
        headers: { 'Accept-Language': 'en' },
        timeout: 5000
      }
    );
    
    if (!response.ok) throw new Error('OSM API failed');
    const results = await response.json();
    
    const colleges = new Set();
    results.slice(0, 8).forEach(result => {
      const name = result.name || result.display_name?.split(',')[0];
      if (name && name.length > 3 && !name.toLowerCase().includes('unknown')) {
        colleges.add(name.trim());
      }
    });
    
    return Array.from(colleges);
  } catch (error) {
    console.warn('Error fetching nearby colleges from OSM:', error);
    return [];
  }
};

// Enrich properties with nearby colleges from map API
const _defaultCollegesByCity = {
  'Kota': ['Allen', 'FIITJEE', 'Bansal Classes', 'Resonance'],
  'Indore': ['IIT Indore', 'MITS', 'Devi Ahilya University', 'MAWL Institute'],
  'Jaipur': ['MNIT Jaipur', 'RTU Jaipur', 'Manipal University', 'BITS Pilani'],
  'Delhi': ['Delhi University', 'IIT Delhi', 'NSIT Delhi', 'DTU Delhi'],
  'Bhopal': ['IISER Bhopal', 'Barkatullah University', 'MATS University', 'ITM Universe'],
  'Nagpur': ['VNIT Nagpur', 'RCOEM', 'Rashtrasant Tukdoji Maharaj', 'Nagpur University'],
  'Mumbai': ['IIT Bombay', 'NMIMS', 'AISSMS', 'Mumbai University'],
  'Bangalore': ['IIT Bangalore', 'VTU', 'RV University', 'Christ University'],
  'Chandigarh': ['Punjab University', 'PEC University', 'Chitkara University', 'DAV College'],
  'Pune': ['Pune University', 'COEP', 'Symbiosis', 'MIT Pune']
};

export const enrichPropertiesWithColleges = (properties) => {
  return properties.map((property) => {
    if (property.nearbyColleges && property.nearbyColleges.length > 0) return property;
    const city = property.city || property.propertyInfo?.city || 'Kota';
    return { ...property, nearbyColleges: _defaultCollegesByCity[city] || _defaultCollegesByCity['Kota'] };
  });
};

// ============================================================
// SEPARATE COLLEGES API - Completely independent from properties
// ============================================================

// Fetch colleges for a single city from backend (calls Overpass API)
export const fetchCollegesForCity = async (city) => {
  try {
    const data = await fetchJson(`/api/colleges/fetch-nearby?city=${encodeURIComponent(city)}`);
    if (data.success) return data.colleges || [];
    return [];
  } catch (error) {
    console.error('Error fetching colleges for city:', error);
    return [];
  }
};

// DO NOT call this function — the backend endpoint hits Overpass API sequentially
// for 8 cities, each returning HTTP 406, causing 40-80s of backend processing.
// College data comes from property.nearbyColleges populated by the backend on
// GET /api/approved-properties/public/approved. Use that instead.
export const fetchAllCollegesFromBackend = async () => {
  return { allColleges: [], cities: {}, totalColleges: 0 };
};

// ==================== USER API FUNCTIONS ====================

// Get user profile
export const getUserProfile = async () => {
  try {
    const data = await fetchJson('/api/user/profile');
    return data;
  } catch (error) {
    console.warn('Fallback to local profile:', error.message);
    const localUserStr = localStorage.getItem('user') || localStorage.getItem('userInfo') || localStorage.getItem('tenant');
    if (localUserStr) {
      try {
        const parsed = JSON.parse(localUserStr);
        const userObj = parsed.user || parsed;
        if (userObj && (userObj.name || userObj.email || userObj.phone)) {
          return {
            success: true,
            user: {
              name: userObj.name || userObj.fullName || `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || 'User',
              firstName: userObj.firstName || '',
              lastName: userObj.lastName || '',
              email: userObj.email || '',
              phone: userObj.phone || userObj.phoneNumber || '',
              address: userObj.address || '',
              city: userObj.city || '',
              bio: userObj.bio || '',
              stats: { bookings: 0, favourites: 0, reviews: 0 }
            }
          };
        }
      } catch (_) {}
    }
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  try {
    const data = await fetchJson('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Get user settings
export const getUserSettings = async () => {
  try {
    const data = await fetchJson('/api/user/settings');
    return data;
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
};

// Update user settings
export const updateUserSettings = async (settings) => {
  try {
    const data = await fetchJson('/api/user/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    return data;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const data = await fetchJson('/api/user/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

// Get user favourites
export const getUserFavourites = async () => {
  try {
    const data = await fetchJson('/api/user/favourites');
    return data;
  } catch (error) {
    console.error('Error fetching favourites:', error);
    throw error;
  }
};

// Add to favourites
export const addToFavourites = async (propertyId) => {
  try {
    const data = await fetchJson(`/api/user/favourites/${propertyId}`, {
      method: 'POST'
    });
    return data;
  } catch (error) {
    console.error('Error adding to favourites:', error);
    throw error;
  }
};

// Remove from favourites
export const removeFromFavourites = async (propertyId) => {
  try {
    const data = await fetchJson(`/api/user/favourites/${propertyId}`, {
      method: 'DELETE'
    });
    return data;
  } catch (error) {
    console.error('Error removing from favourites:', error);
    throw error;
  }
};

// Delete account
export const deleteAccount = async (password) => {
  try {
    const data = await fetchJson('/api/user/account', {
      method: 'DELETE',
      body: JSON.stringify({ password })
    });
    return data;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

// ==================== REVIEW API FUNCTIONS ====================

// Get user reviews
export const getUserReviews = async () => {
  try {
    const data = await fetchJson('/api/reviews/user/my-reviews');
    return data;
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    throw error;
  }
};

// Update review
export const updateReview = async (reviewId, reviewData) => {
  try {
    const data = await fetchJson(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData)
    });
    return data;
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

// Delete review
export const deleteReview = async (reviewId) => {
  try {
    const data = await fetchJson(`/api/reviews/${reviewId}`, {
      method: 'DELETE'
    });
    return data;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};
// ==================== SUPERADMIN API FUNCTIONS ====================

// Fetch overall platform stats
export const fetchSuperadminStats = async (range, startDate, endDate) => {
  try {
    let url = '/api/superadmin/stats';
    const params = new URLSearchParams();
    if (range) params.append('range', range);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    const data = await fetchJson(url);
    return data;
  } catch (error) {
    console.error('Error fetching superadmin stats:', error);
    // Return mock fallback to prevent UI crash
    return {
      success: false,
      stats: { tenants: 0, properties: 0, owners: 0, netRevenue: 0 },
      recentSignups: []
    };
  }
};

// Fetch user distribution for charts
export const fetchUserDistribution = async () => {
  try {
    const data = await fetchJson('/api/superadmin/user-distribution');
    return data;
  } catch (error) {
    console.error('Error fetching user distribution:', error);
    return { success: false, distribution: { labels: [], data: [] } };
  }
};

// Fetch revenue trends for charts
export const fetchRevenueTrends = async () => {
  try {
    const data = await fetchJson('/api/superadmin/revenue-trends');
    return data;
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    return { success: false, labels: [], data: [] };
  }
};

// Fetch audit logs
export const fetchAuditLogs = async (limit = 200) => {
  try {
    const data = await fetchJson(`/api/admin/audit-logs?limit=${limit}`);
    return data;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return { success: false, logs: [] };
  }
};

// Fetch accounting overview stats
export const fetchAccountingOverviewStats = async () => {
  try {
    const data = await fetchJson('/api/superadmin/accounting/overview');
    return data;
  } catch (error) {
    console.error('Error fetching accounting stats:', error);
    return {
      success: false,
      summary: { totalCollection: 0, totalPayout: 0, revenue: 0, dueRent: 0, pendingPayout: 0 },
      trends: [],
      transactions: [],
      dueAging: []
    };
  }
};

// Fetch booking and leads overview stats
export const fetchBookingOverviewStats = async (range, startDate, endDate) => {
  try {
    let url = '/api/superadmin/bookings/overview';
    const params = new URLSearchParams();
    if (range) params.append('range', range);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    const data = await fetchJson(url);
    return data;
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    return {
      success: false,
      summary: { todayLeads: 0, weekLeads: 0, monthLeads: 0, todayBookings: 0, weekBookings: 0, monthBookings: 0 },
      funnel: [],
      recentLeads: [],
      trends: [],
      distributions: { sources: [], status: [] }
    };
  }
};
// Fetch property overview stats
export const fetchPropertyOverviewStats = async () => {
  try {
    const data = await fetchJson('/api/superadmin/properties/overview');
    return data;
  } catch (error) {
    console.error('Error fetching property stats:', error);
    return {
      success: false,
      summary: { total: 0, approved: 0, pending: 0, rejected: 0, newThisMonth: 0 },
      statusData: [],
      recentProperties: []
    };
  }
};
// Fetch user management overview stats
export const fetchUserOverviewStats = async () => {
  try {
    const data = await fetchJson('/api/superadmin/users/overview');
    return data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      success: false,
      summary: { total: 0, team: 0, owners: 0, tenants: 0, activeToday: 0 },
      distribution: [],
      recentUsers: [],
      kyc: []
    };
  }
};

// Fetch report and analytics overview stats
export const fetchReportOverviewStats = async () => {
  try {
    const data = await fetchJson('/api/superadmin/reports/overview');
    return data;
  } catch (error) {
    console.error('Error fetching report stats:', error);
    return {
      success: false,
      summary: { totalProperties: 0, totalTenants: 0, occupancyRate: 0, monthlyRevenue: 0, netProfit: 0, growthRate: 0 },
      revenueTrends: [],
      occupancy: { occupied: 0, vacant: 0, maintenance: 0 },
      topProperties: [],
      locationData: []
    };
  }
};

// Fetch review and ratings overview stats
export const fetchReviewOverviewStats = async () => {
  try {
    const data = await fetchJson('/api/superadmin/reviews/overview');
    return data;
  } catch (error) {
    console.error('Error fetching review stats:', error);
    return {
      success: false,
      summary: { today: 0, week: 0, month: 0, avgRating: 0, total: 0, pending: 0 },
      trends: [],
      distribution: [],
      recentReviews: [],
      topProperties: []
    };
  }
};

// Fetch support and complaint overview stats
export const fetchSupportOverviewStats = async () => {
  try {
    const data = await fetchJson('/api/superadmin/support/overview');
    return data;
  } catch (error) {
    console.error('Error fetching support stats:', error);
    return {
      success: false,
      summary: { total: 0, open: 0, inProgress: 0, resolved: 0, overdue: 0, avgTime: '0 Days' },
      trends: [],
      categories: [],
      sources: [],
      recentTickets: [],
      resolutionRate: 0
    };
  }
};

// Fetch home overview stats
export const fetchHomeOverviewStats = async () => {
  try {
    const data = await fetchJson('/api/superadmin/home/overview');
    return data;
  } catch (error) {
    console.error('Error fetching home overview stats:', error);
    return {
      success: false,
      metrics: { properties: 0, tenants: 0, revenue: 0, alerts: 0 },
      revenueTrend: [],
      propertyStatus: [],
      tenantTypes: [],
      pendingAlerts: [],
      activities: []
    };
  }
};

// ── Compatibility shims for services/api.js migration ────────────────────────
// Pages previously importing from src/services/api.js can update their import
// path to src/utils/api.js and continue using apiFetch/API_URL unchanged.
// They gain: 12-second timeout, GET deduplication, shared cache layer.

export const API_URL = getApiBase();

export const apiFetch = (path, options = {}) => fetchJson(path, options);

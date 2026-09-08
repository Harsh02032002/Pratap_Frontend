import { fetchPropertiesLocal } from './mockApi';
import { getScopedAuthToken, clearScopedSession } from './authScope';
import { normalizeTierKey, composeTieredPropertyName } from './propertyTiers';

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

export const clearApiCache = () => {
  _cache.clear();
  _formattedPropertiesCache = null;
  _formattedPropertiesCacheTs = 0;
};

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

  if (host === "app.roomhy.com" || host === "roomhy.com" || host === "www.roomhy.com" || host === "admin.roomhy.com") {
    return "https://api.roomhy.com";
  }

  // Production — fallback to current origin or api.roomhy.com
  return window.location.origin || "https://api.roomhy.com";
};

// Read JWT for the Authorization: Bearer header on every request.
//
// The token is scoped to the current route (see utils/authScope.js). On panel
// routes sessionStorage is checked FIRST because it is isolated per browser
// tab: this lets an owner (tab A) and one of their staff (tab B) stay signed in
// at the same time in the same browser without the shared localStorage `token`
// from one clobbering the other.
//
// On website routes only the website token is used. It must NOT fall back to
// the panel `token`, or a superadmin session left in shared localStorage would
// authenticate every website visitor as that superadmin.
// Cookie is also set by the backend for httpOnly support.
export const getAuthHeader = () => {
  const token = getScopedAuthToken();
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

// ── Mutation hooks ───────────────────────────────────────────────────────────
// Modules that keep their own caches register here so a write anywhere in the
// app can bust them, instead of every page remembering to invalidate by hand.
// The registry lives on this side because utils/propertyowner.js already imports
// fetchJson — importing its invalidator back here would be a cycle.
const _mutationHooks = new Set();

/**
 * Run `fn(method, path)` after every successful non-GET request.
 * @returns {() => void} unsubscribe
 */
export const onApiMutation = (fn) => {
  _mutationHooks.add(fn);
  return () => _mutationHooks.delete(fn);
};

const _notifyMutation = (method, path) => {
  for (const fn of _mutationHooks) {
    // A misbehaving hook must never fail the request that triggered it.
    try { fn(method, path); } catch (_) { /* ignore */ }
  }
};

// Statuses worth a second try: a transient server-side fault where the very
// same request is likely to succeed shortly.
//
// Deliberately NOT retried:
//   429 — our limiter uses a 15-minute window, so no realistic backoff can
//         outlast it. Retrying would triple the load on a server that just
//         asked us to stop, and still fail. Callers fall back to cached data.
//   408 — a *client-side* abort from our own timeout. Retrying turns one 12s
//         wait into ~38s of dead air on the page.
// Anything else (400/401/403/404/500) fails identically no matter how often
// we ask.
const _RETRY_STATUSES = new Set([502, 503, 504]);
const _RETRY_BASE_DELAYS = [500, 1500];
const _MAX_RETRY_WAIT_MS = 5000;
const _MAX_GET_ATTEMPTS = 3;
// Ceiling across ALL attempts plus their backoffs. Per-attempt `timeout` bounds
// one try; without this, three slow-then-erroring attempts (a proxy emitting
// 504 just under the timeout) could stack into ~38s of dead air — and in-flight
// dedup would hold every other caller of that URL there too.
const _TOTAL_RETRY_BUDGET_MS = 20000;

const _sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const _isRetryable = (err) => {
  if (err?.status != null) return _RETRY_STATUSES.has(err.status);
  // fetch() rejects with a TypeError when the network itself failed. It also
  // does so for a CORS rejection or a malformed request, which will never
  // succeed — accepted as the price of covering genuine network blips.
  return err?.name === 'TypeError';
};

// `Retry-After` is either a seconds count or an HTTP date. Anything absent,
// malformed, zero or negative yields null so the caller uses its own backoff —
// returning 0 here would retry instantly against a server asking us to wait.
const _parseRetryAfter = (value) => {
  const raw = typeof value === 'string' ? value.trim() : value;
  if (raw === null || raw === undefined || raw === '') return null;
  const seconds = Number(raw);
  let ms;
  if (Number.isFinite(seconds)) {
    ms = seconds * 1000;
  } else {
    const when = Date.parse(raw);
    if (Number.isNaN(when)) return null;
    ms = when - Date.now();
  }
  if (!(ms > 0)) return null;
  return Math.min(ms, _MAX_RETRY_WAIT_MS);
};

// Jitter keeps a throttled crowd from retrying in lockstep and re-tripping the
// limit at the same instant. Clamped AFTER jitter so _MAX_RETRY_WAIT_MS is a
// true ceiling on the sleep, not merely on its input.
const _retryDelay = (attempt, retryAfterHeader) => {
  const base = _parseRetryAfter(retryAfterHeader) ?? _RETRY_BASE_DELAYS[attempt] ?? 1500;
  const jittered = base * (0.8 + Math.random() * 0.4);
  return Math.max(0, Math.round(Math.min(jittered, _MAX_RETRY_WAIT_MS)));
};

export const fetchJson = (path, options = {}) => {
  // `timeout` is a per-call override (ms) — pulled out so it isn't passed to fetch().
  // `maxAttempts` counts total tries, not extra ones — 1 disables retrying.
  // Named for what it is: a `retries: 0` under the old name read as "don't
  // retry" but fell through to the default, doing the opposite.
  const { timeout: timeoutMs = 12000, maxAttempts: maxAttemptsOpt, ...fetchOptions } = options;
  const base = getApiBase();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const method = (fetchOptions.method || 'GET').toUpperCase();

  // Return the existing in-flight Promise for identical GET requests
  if (method === 'GET') {
    const existing = _inflightRequests.get(url);
    if (existing) return existing;
  }

  // Only idempotent reads are replayed automatically. Retrying a POST could
  // record a payment or create a tenant twice — far worse than showing an error.
  // The override is GET-only, so a caller cannot use it to make a write replay,
  // and a non-integer can never produce an unbounded loop.
  const defaultAttempts = method === 'GET' ? _MAX_GET_ATTEMPTS : 1;
  const maxAttempts = (method === 'GET' && Number.isInteger(maxAttemptsOpt) && maxAttemptsOpt > 0)
    ? maxAttemptsOpt
    : defaultAttempts;

  const promise = (async () => {
    const hasBody = method !== 'GET' && method !== 'HEAD';
    const headers = {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(fetchOptions.headers || {}),
      ...getAuthHeader(),
    };

    const startedAt = Date.now();
    // A lone attempt always keeps its full `timeout`; only retries get squeezed
    // to fit what remains of the overall budget.
    const totalBudgetMs = Math.max(timeoutMs, _TOTAL_RETRY_BUDGET_MS);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Each attempt gets its own controller, or the first timeout would abort
      // every retry that follows it.
      const remaining = totalBudgetMs - (Date.now() - startedAt);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Math.max(1, Math.min(timeoutMs, remaining)));
      let retryIn = null;
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
          err.retryAfter = res.headers.get('Retry-After');
          if (res.status === 401 && (errorMsg.includes("token invalid") || errorMsg.includes("Token expired") || errorMsg.includes("token missing"))) {
            try { clearScopedSession(); } catch (_) {}
          }
          throw err;
        }
        // 2xx on a write — let cache owners drop anything this may have changed.
        if (hasBody) _notifyMutation(method, path);
        return await res.json();
      } catch (rawErr) {
        let err = rawErr;
        if (rawErr?.name === 'AbortError') {
          err = new Error('Request timed out. Please try again.');
          err.status = 408;
          err.name = 'TimeoutError';
        }
        const nextDelay = _retryDelay(attempt, err.retryAfter);
        const outOfBudget = (Date.now() - startedAt) + nextDelay >= totalBudgetMs;
        if (attempt >= maxAttempts - 1 || outOfBudget || !_isRetryable(err)) {
          // Never let bookkeeping replace the real error: a frozen Error or a
          // thrown primitive would throw on assignment in strict mode.
          if (err && typeof err === 'object' && Object.isExtensible(err)) {
            err.retriedCount = attempt;
          }
          throw err;
        }
        retryIn = nextDelay;
      } finally {
        clearTimeout(timeoutId);
      }
      // Outside the try/finally so this attempt's abort timer is already
      // cleared before we wait out the backoff.
      await _sleep(retryIn);
    }
    // Unreachable: the loop either returns or throws on its final attempt.
    // Present so the function can never fall through to an implicit undefined.
    throw new Error('Request failed after all retry attempts.');
  })().finally(() => {
    if (method === 'GET') _inflightRequests.delete(url);
  });

  if (method === 'GET') _inflightRequests.set(url, promise);
  return promise;
};

const DEFAULT_CITIES = [
  { name: "Kota" }, { name: "Sikar" }, { name: "Indore" }
];

// Fetch cities from backend — cached 10 minutes (cities rarely change)
export const fetchCities = async () => {
  try {
    const data = await _fetchCached('/api/locations/cities', 10 * 60 * 1000);
    const list = data.data || data || [];
    const allowed = ['Kota', 'Sikar', 'Indore'];
    const filtered = Array.isArray(list) ? list.filter(c => allowed.includes((c.name || '').trim())) : [];
    if (filtered.length > 0) return filtered;
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
  // KOTA PROPERTIES
  {
    _id: "static1",
    property_name: "Roomhy Boys PG - Talwandi",
    propertyName: "Roomhy Boys PG - Talwandi",
    city: "Kota",
    area: "Talwandi",
    address: "Talwandi, Kota, Rajasthan 324005",
    propertyType: "pg",
    monthlyRent: 8000,
    rent: 8000,
    owner_name: "Verified Owner",
    owner_phone: "9000000001",
    owner_id: "ROOMHY9999",
    gender: "male",
    beds: 2,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static1b",
    property_name: "Roomhy Luxury Girls Hostel - Talwandi",
    propertyName: "Roomhy Luxury Girls Hostel - Talwandi",
    city: "Kota",
    area: "Talwandi",
    address: "Sector 2, Talwandi, Kota, Rajasthan 324005",
    propertyType: "hostel",
    monthlyRent: 9500,
    rent: 9500,
    owner_name: "Verified Owner",
    owner_phone: "9000000011",
    owner_id: "ROOMHY9999",
    gender: "female",
    beds: 3,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static1c",
    property_name: "Roomhy Student Living - Vigyan Nagar",
    propertyName: "Roomhy Student Living - Vigyan Nagar",
    city: "Kota",
    area: "Vigyan Nagar",
    address: "Vigyan Nagar Main Road, Kota, Rajasthan 324005",
    propertyType: "pg",
    monthlyRent: 7500,
    rent: 7500,
    owner_name: "Verified Owner",
    owner_phone: "9000000012",
    owner_id: "ROOMHY9999",
    gender: "male",
    beds: 2,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static1d",
    property_name: "Roomhy Allen Residency - Landmark City",
    propertyName: "Roomhy Allen Residency - Landmark City",
    city: "Kota",
    area: "Landmark City",
    address: "Kunhari Landmark City, Kota, Rajasthan 324008",
    propertyType: "co-living",
    monthlyRent: 11000,
    rent: 11000,
    owner_name: "Verified Owner",
    owner_phone: "9000000013",
    owner_id: "ROOMHY9999",
    gender: "co-ed",
    beds: 4,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static1e",
    property_name: "Roomhy Co-Living Hub - Mahaveer Nagar",
    propertyName: "Roomhy Co-Living Hub - Mahaveer Nagar",
    city: "Kota",
    area: "Mahaveer Nagar",
    address: "Mahaveer Nagar 1st, Kota, Rajasthan 324005",
    propertyType: "co-living",
    monthlyRent: 8500,
    rent: 8500,
    owner_name: "Verified Owner",
    owner_phone: "9000000014",
    owner_id: "ROOMHY9999",
    gender: "co-ed",
    beds: 2,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static1f",
    property_name: "Roomhy Girls PG - Indra Vihar",
    propertyName: "Roomhy Girls PG - Indra Vihar",
    city: "Kota",
    area: "Indra Vihar",
    address: "Indra Vihar, Kota, Rajasthan 324005",
    propertyType: "pg",
    monthlyRent: 9000,
    rent: 9000,
    owner_name: "Verified Owner",
    owner_phone: "9000000015",
    owner_id: "ROOMHY9999",
    gender: "female",
    beds: 2,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/279719/pexels-photo-279719.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/279719/pexels-photo-279719.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static1g",
    property_name: "Roomhy Riverfront Hostel - Kunhari",
    propertyName: "Roomhy Riverfront Hostel - Kunhari",
    city: "Kota",
    area: "Kunhari",
    address: "Kunhari, Kota, Rajasthan 324008",
    propertyType: "hostel",
    monthlyRent: 7000,
    rent: 7000,
    owner_name: "Verified Owner",
    owner_phone: "9000000016",
    owner_id: "ROOMHY9999",
    gender: "male",
    beds: 2,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600"
  },

  // INDORE PROPERTIES
  {
    _id: "static2",
    property_name: "Roomhy Girls Hostel - Vijay Nagar",
    propertyName: "Roomhy Girls Hostel - Vijay Nagar",
    city: "Indore",
    area: "Vijay Nagar",
    address: "Vijay Nagar, Indore, Madhya Pradesh 452010",
    propertyType: "hostel",
    monthlyRent: 10000,
    rent: 10000,
    owner_name: "Verified Owner",
    owner_phone: "9000000002",
    owner_id: "ROOMHY9999",
    gender: "female",
    beds: 3,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static2b",
    property_name: "Roomhy Luxury PG - Sapna Sangeeta",
    propertyName: "Roomhy Luxury PG - Sapna Sangeeta",
    city: "Indore",
    area: "Sapna Sangeeta",
    address: "Sapna Sangeeta Road, Indore, Madhya Pradesh 452001",
    propertyType: "pg",
    monthlyRent: 8500,
    rent: 8500,
    owner_name: "Verified Owner",
    owner_phone: "9000000021",
    owner_id: "ROOMHY9999",
    gender: "co-ed",
    beds: 2,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static2c",
    property_name: "Roomhy Prime Co-living - Palasia",
    propertyName: "Roomhy Prime Co-living - Palasia",
    city: "Indore",
    area: "Palasia",
    address: "Old Palasia, Indore, Madhya Pradesh 452001",
    propertyType: "co-living",
    monthlyRent: 12000,
    rent: 12000,
    owner_name: "Verified Owner",
    owner_phone: "9000000022",
    owner_id: "ROOMHY9999",
    gender: "co-ed",
    beds: 3,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static2d",
    property_name: "Roomhy Student PG - Bhawarkua",
    propertyName: "Roomhy Student PG - Bhawarkua",
    city: "Indore",
    area: "Bhawarkua",
    address: "Bhawarkua Main Square, Indore, Madhya Pradesh 452001",
    propertyType: "pg",
    monthlyRent: 7000,
    rent: 7000,
    owner_name: "Verified Owner",
    owner_phone: "9000000023",
    owner_id: "ROOMHY9999",
    gender: "male",
    beds: 2,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=600"
  },

  // JAIPUR PROPERTIES
  {
    _id: "static3",
    property_name: "Roomhy Co-living - Malviya Nagar",
    propertyName: "Roomhy Co-living - Malviya Nagar",
    city: "Jaipur",
    area: "Malviya Nagar",
    address: "Malviya Nagar, Jaipur, Rajasthan 302017",
    propertyType: "co-living",
    monthlyRent: 12000,
    rent: 12000,
    owner_name: "Verified Owner",
    owner_phone: "9000000003",
    owner_id: "ROOMHY9999",
    gender: "co-ed",
    beds: 3,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static3b",
    property_name: "Roomhy Executive PG - Vaishali Nagar",
    propertyName: "Roomhy Executive PG - Vaishali Nagar",
    city: "Jaipur",
    area: "Vaishali Nagar",
    address: "Vaishali Nagar, Jaipur, Rajasthan 302021",
    propertyType: "pg",
    monthlyRent: 10500,
    rent: 10500,
    owner_name: "Verified Owner",
    owner_phone: "9000000031",
    owner_id: "ROOMHY9999",
    gender: "male",
    beds: 2,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static3c",
    property_name: "Roomhy Student Hostel - Mansarovar",
    propertyName: "Roomhy Student Hostel - Mansarovar",
    city: "Jaipur",
    area: "Mansarovar",
    address: "Mansarovar, Jaipur, Rajasthan 302020",
    propertyType: "hostel",
    monthlyRent: 8000,
    rent: 8000,
    owner_name: "Verified Owner",
    owner_phone: "9000000032",
    owner_id: "ROOMHY9999",
    gender: "co-ed",
    beds: 2,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600"
  },

  // SIKAR PROPERTIES
  {
    _id: "static_sikar1",
    property_name: "Roomhy Coaching PG - Piprali Road",
    propertyName: "Roomhy Coaching PG - Piprali Road",
    city: "Sikar",
    area: "Piprali Road",
    address: "Piprali Road, Sikar, Rajasthan 332001",
    propertyType: "pg",
    monthlyRent: 6500,
    rent: 6500,
    owner_name: "Verified Owner",
    owner_phone: "9000000041",
    owner_id: "ROOMHY9999",
    gender: "male",
    beds: 2,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static_sikar2",
    property_name: "Roomhy Student Hostel - Nawalgarh Road",
    propertyName: "Roomhy Student Hostel - Nawalgarh Road",
    city: "Sikar",
    area: "Nawalgarh Road",
    address: "Nawalgarh Road, Sikar, Rajasthan 332001",
    propertyType: "hostel",
    monthlyRent: 7000,
    rent: 7000,
    owner_name: "Verified Owner",
    owner_phone: "9000000042",
    owner_id: "ROOMHY9999",
    gender: "co-ed",
    beds: 3,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600"
  },

  // DELHI PROPERTIES
  {
    _id: "static4",
    property_name: "Roomhy Apartments - Dwarka",
    propertyName: "Roomhy Apartments - Dwarka",
    city: "Delhi",
    area: "Dwarka",
    address: "Dwarka, New Delhi, Delhi 110075",
    propertyType: "apartment",
    monthlyRent: 25000,
    rent: 25000,
    owner_name: "Verified Owner",
    owner_phone: "9000000004",
    owner_id: "ROOMHY9999",
    gender: "co-ed",
    beds: 3,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static4b",
    property_name: "Roomhy Student Hub - Laxmi Nagar",
    propertyName: "Roomhy Student Hub - Laxmi Nagar",
    city: "Delhi",
    area: "Laxmi Nagar",
    address: "Laxmi Nagar, New Delhi, Delhi 110092",
    propertyType: "pg",
    monthlyRent: 9000,
    rent: 9000,
    owner_name: "Verified Owner",
    owner_phone: "9000000051",
    owner_id: "ROOMHY9999",
    gender: "male",
    beds: 2,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"
  },

  // BHOPAL PROPERTIES
  {
    _id: "static5",
    property_name: "Roomhy Student PG - MP Nagar",
    propertyName: "Roomhy Student PG - MP Nagar",
    city: "Bhopal",
    area: "MP Nagar",
    address: "MP Nagar Zone 2, Bhopal, Madhya Pradesh 462016",
    propertyType: "pg",
    monthlyRent: 6000,
    rent: 6000,
    owner_name: "Verified Owner",
    owner_phone: "9000000005",
    owner_id: "ROOMHY9999",
    gender: "male",
    beds: 2,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static6",
    property_name: "Roomhy Luxury PG - Nagpur",
    propertyName: "Roomhy Luxury PG - Nagpur",
    city: "Nagpur",
    area: "Civil Lines",
    address: "Civil Lines, Nagpur, Maharashtra 440001",
    propertyType: "pg",
    monthlyRent: 15000,
    rent: 15000,
    owner_name: "Verified Owner",
    owner_phone: "9000000006",
    owner_id: "ROOMHY9999",
    gender: "male",
    beds: 2,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static7",
    property_name: "Roomhy Working Women PG - Jodhpur",
    propertyName: "Roomhy Working Women PG - Jodhpur",
    city: "Jodhpur",
    area: "Paota",
    address: "Paota, Jodhpur, Rajasthan 342001",
    propertyType: "pg",
    monthlyRent: 9000,
    rent: 9000,
    owner_name: "Verified Owner",
    owner_phone: "9000000007",
    owner_id: "ROOMHY9999",
    gender: "female",
    beds: 2,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static8",
    property_name: "Roomhy Budget PG - Mumbai",
    propertyName: "Roomhy Budget PG - Mumbai",
    city: "Mumbai",
    area: "Andheri",
    address: "Andheri West, Mumbai, Maharashtra 400053",
    propertyType: "pg",
    monthlyRent: 7000,
    rent: 7000,
    owner_name: "Verified Owner",
    owner_phone: "9000000008",
    owner_id: "ROOMHY9999",
    gender: "male",
    beds: 2,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static9",
    property_name: "Roomhy Executive Hostel - Bangalore",
    propertyName: "Roomhy Executive Hostel - Bangalore",
    city: "Bangalore",
    area: "Electronic City",
    address: "Electronic City Phase 1, Bangalore, Karnataka 560100",
    propertyType: "hostel",
    monthlyRent: 18000,
    rent: 18000,
    owner_name: "Verified Owner",
    owner_phone: "9000000009",
    owner_id: "ROOMHY9999",
    gender: "male",
    beds: 3,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg?auto=compress&cs=tinysrgb&w=600"
  },
  {
    _id: "static10",
    property_name: "Roomhy Family PG - Chennai",
    propertyName: "Roomhy Family PG - Chennai",
    city: "Chennai",
    area: "T Nagar",
    address: "T Nagar, Chennai, Tamil Nadu 600017",
    propertyType: "pg",
    monthlyRent: 13000,
    rent: 13000,
    owner_name: "Verified Owner",
    owner_phone: "9000000010",
    owner_id: "ROOMHY9999",
    gender: "co-ed",
    beds: 2,
    status: "active",
    isPublished: true,
    images: ["https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=600"],
    featuredImage: "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=600"
  }
];

// The backend's gender field defaults to the placeholder "any" when nothing
// was ever explicitly set — that's not a real answer, so treat it the same
// as missing and let the category-derived value (below) fill in instead.
const _explicitGender = (g) => {
  const s = String(g || '').trim();
  return s && s.toLowerCase() !== 'any' ? s : '';
};

// Maps the "Boys PG / Girls PG / Co-living" category picked in the Add/Edit
// Property wizard onto the Male/Female/Co-ed vocabulary the public site's
// gender badge and filter already use.
const _categoryToGender = (category) => {
  const s = String(category || '').toLowerCase();
  if (s.includes('girl')) return 'Female';
  if (s.includes('boy')) return 'Male';
  if (s.includes('co-living') || s.includes('coliving')) return 'Co-ed';
  return '';
};

// Shared property formatter — used by fetchProperties and fetchPropertyByVisitId
/**
 * First list that actually has something in it.
 *
 * `a || b` cannot be used to pick between image sources: an empty array is
 * truthy, so a record carrying `images: []` stopped the chain dead and the
 * photos sitting in `photos` or `propertyInfo.photos` were never reached. That
 * is why approved properties rendered a stock placeholder while their real
 * photos were in the record all along.
 */
export const firstNonEmptyList = (...lists) =>
  lists.find(list => Array.isArray(list) && list.length > 0) || [];

const _formatProperty = (p) => {
  const imagesArray = firstNonEmptyList(p.images, p.photos, p.propertyInfo?.photos);
  const firstImage = imagesArray[0] || `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 100)}`;
  const tier = normalizeTierKey(p.tier);
  const plainName = p.property_name || p.propertyName || p.propertyInfo?.name || 'Property';
  const displayName = composeTieredPropertyName(tier, plainName);
  return {
    ...p,
    _id: String(p._id || p.visitId || ''),
    visitId: p.visitId || p._id,
    tier,
    property_name: displayName,
    name: displayName,
    city: p.city || p.propertyInfo?.city || 'Unknown',
    location: p.propertyInfo?.area ? `${p.propertyInfo.area}, ${p.city || p.propertyInfo?.city}` : (p.city || p.propertyInfo?.city || 'Unknown'),
    owner_name: p.owner_name || p.ownerName || p.generatedCredentials?.ownerName || p.approvedBy || 'Verified Owner',
    owner_phone: p.owner_phone || p.contactPhone || p.ownerPhone || p.propertyInfo?.phone || '9000000000',
    propertyName: displayName,
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
    gender: _explicitGender(p.gender) || _explicitGender(p.genderSuitability) || _explicitGender(p.propertyInfo?.genderSuitability) || _categoryToGender(p.propertyCategory) || 'Co-ed',
    landmark: p.landmark || p.propertyInfo?.landmark || p.nearInstitute || '',
    nearbyColleges: p.nearbyColleges || p.colleges || p.propertyInfo?.nearbyColleges || [],
    address: p.address || p.propertyInfo?.address || ''
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
    let properties = Array.isArray(data) ? data : data?.properties || data?.data || [];
    if (properties.length === 0 && Array.isArray(staticPropertiesList) && staticPropertiesList.length > 0) {
      console.warn('Backend returned 0 properties, falling back to staticPropertiesList');
      properties = staticPropertiesList;
    }
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
export const getPropertyDetailsUrl = (property) => {
  if (!property) return '/properties';
  if (typeof property === 'string') {
    const cleanStr = property.trim();
    if (cleanStr.startsWith('/')) return cleanStr;
    const slug = cleanStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `/property-details/${slug}`;
  }
  const rawName = property.propertyInfo?.name || property.title || property.property_name || property.propertyName || property.name || '';
  if (rawName) {
    const cleanName = rawName.replace(/^ROOMHYPROP\s+(CREST|PRIME)\s+/i, '').trim();
    const slug = (cleanName || rawName).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `/property-details/${slug}`;
  }
  const id = property._id || property.id || property.visitId || '';
  return `/property-details/${id}`;
};

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

// The owner's login id sits in different places depending on how the property was
// created: superadmin mints it into generatedCredentials.loginId when it approves
// a visit, while older or imported records carry it at the top level. Every
// website booking submitter has to resolve it identically — three separate copies
// of this list is exactly how the property details page ended up posting
// owner_id: undefined, producing leads that no owner panel could ever query.
const OWNER_LOGIN_ID_SOURCES = [
  (p) => p?.generatedCredentials?.loginId,
  (p) => p?.ownerLoginId,
  (p) => p?.owner_login_id,
  (p) => p?.owner_id,
  (p) => p?.ownerId,
  (p) => p?.createdBy,
  (p) => p?.owner,
  (p) => p?.propertyOwnerId,
];

/**
 * Resolve the owner login id a property belongs to.
 * @returns {string} the id, or "" when the property carries no owner at all.
 */
export const resolvePropertyOwnerLoginId = (property) => {
  for (const pick of OWNER_LOGIN_ID_SOURCES) {
    let value;
    try { value = pick(property); } catch (_) { continue; }
    // A populated owner ref arrives as an object rather than a string.
    if (value && typeof value === "object") value = value.loginId || value._id || value.id;
    const id = String(value ?? "").trim();
    if (id && id !== "undefined" && id !== "null") return id;
  }
  return "";
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
      'Sikar': { lat: 27.6106, lon: 75.1393 },
      'Indore': { lat: 22.7196, lon: 75.8577 }
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
  'Sikar': ['Sikar Coaching Hub', 'Sikar Study Center', 'Sikar Academy'],
  'Indore': ['IIT Indore', 'MITS', 'Devi Ahilya University', 'MAWL Institute']
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

// ── Site-wide Stats (for dynamic number display) ──────────────────────────────

/**
 * Fetch dynamic site stats: total properties, per-city counts, total users.
 * Used to replace static hardcoded numbers across the site.
 * Cached for 10 minutes.
 */
export const fetchSiteStats = async () => {
  try {
    const data = await _fetchCached('/api/site-stats', 10 * 60 * 1000);
    if (data && data.success) return data;
    throw new Error('Invalid stats response');
  } catch (_) {
    // Fallback: compute from approved properties
    try {
      const props = await _fetchCached('/api/approved-properties', 10 * 60 * 1000);
      const list = Array.isArray(props) ? props : (props?.data || props?.properties || []);
      const total = list.length;
      const byCity = {};
      list.forEach(p => {
        const c = (p.city || p.propertyInfo?.city || '').trim();
        if (c) byCity[c] = (byCity[c] || 0) + 1;
      });
      const formatCount = (n) => n >= 1000 ? `${Math.floor(n / 100) * 100}+` : `${n}+`;
      return {
        success: true,
        total,
        totalFormatted: formatCount(total || 500),
        byCity,
        byCityFormatted: Object.fromEntries(Object.entries(byCity).map(([k, v]) => [k, formatCount(v)])),
        totalUsers: null, // Not available from this endpoint
        totalUsersFormatted: '50,000+', // Keep as static until dedicated endpoint available
      };
    } catch (__) {
      return {
        success: false,
        total: 0,
        totalFormatted: '500+',
        byCity: { Kota: 0, Sikar: 0, Indore: 0 },
        byCityFormatted: { Kota: '500+', Sikar: '300+', Indore: '800+' },
        totalUsersFormatted: '50,000+',
      };
    }
  }
};


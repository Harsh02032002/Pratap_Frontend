// In-memory TTL cache for rent-collection API responses.
// Lives for the lifetime of the browser tab — cleared on refresh.

import { onAuthSessionChange } from "./authScope";

const store = new Map();
onAuthSessionChange(() => store.clear());

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { store.delete(key); return null; }
  return entry.data;
}

export function cacheSet(key, data, ttlMs) {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

// Bust every key that starts with `prefix` (e.g. 'invoices:' clears all invoice queries).
export function cacheInvalidate(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function cacheClear() {
  store.clear();
}

// Aliases matching the getCache/setCache/invalidateCache naming convention used in pages
export const getCache = cacheGet;
export const setCache = cacheSet;
export const invalidateCache = cacheInvalidate;

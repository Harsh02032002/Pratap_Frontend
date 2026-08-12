import { fetchJson, getApiBase } from './api';
import { cacheGet, cacheSet, cacheInvalidate } from './cache';

const rentCollectionBase = () => `${getApiBase()}/api/rent-collection`;
const cashBase = () => `${getApiBase()}/api/rents`;

// TTL constants — how long each response is considered fresh
const TTL = {
  CONFIGS: 15 * 60 * 1000, // 15 min — changes only on Save Config
  MISSING_CONTACTS: 5 * 60 * 1000, // 5 min  — changes only when tenants are edited
  DASHBOARD: 2 * 60 * 1000, // 2 min  — changes when payments recorded
  INVOICES: 60 * 1000,      // 60 sec — most volatile
  CASH_REQUESTS: 30 * 1000,      // 30 sec — request queue changes frequently
};

// ── Dashboard ────────────────────────────────────────────────────────────────
export function fetchRentDashboard(ownerId, force = false) {
  const key = `dashboard:${ownerId}`;
  if (!force) {
    const hit = cacheGet(key);
    if (hit) return Promise.resolve(hit);
  }
  return fetchJson(`${rentCollectionBase()}/dashboard?ownerId=${encodeURIComponent(ownerId)}`)
    .then(data => cacheSet(key, data, TTL.DASHBOARD));
}

// ── Invoices ─────────────────────────────────────────────────────────────────
export function fetchInvoices(params = {}, force = false) {
  const qs = new URLSearchParams(params).toString();
  const key = `invoices:${qs}`;
  if (!force) {
    const hit = cacheGet(key);
    if (hit) return Promise.resolve(hit);
  }
  return fetchJson(`${rentCollectionBase()}/invoices?${qs}`)
    .then(data => cacheSet(key, data, TTL.INVOICES));
}

export const fetchInvoiceById = (id) =>
  fetchJson(`${rentCollectionBase()}/invoices/${id}`);

export const generateInvoices = (ownerId, billingMonth, tenants) =>
  fetchJson(`${rentCollectionBase()}/invoices/generate`, {
    method: 'POST',
    body: JSON.stringify({ ownerId, billingMonth, tenants }),
  }).then(data => { cacheInvalidate('invoices:'); cacheInvalidate('dashboard:'); return data; });

export const sendReminder = (invoiceId, tenantEmail, tenantName) =>
  fetchJson(`${rentCollectionBase()}/invoices/${invoiceId}/remind`, {
    method: 'POST',
    body: JSON.stringify({ tenantEmail, tenantName }),
  });

export const waivePenalty = (invoiceId, reason, waivedAmount) =>
  fetchJson(`${rentCollectionBase()}/invoices/${invoiceId}/waive`, {
    method: 'PATCH',
    body: JSON.stringify({ reason, waivedAmount }),
  }).then(data => { cacheInvalidate('invoices:'); cacheInvalidate('dashboard:'); return data; });

// ── Payments ─────────────────────────────────────────────────────────────────
export const recordPayment = (invoiceId, amount, paymentMethod = 'cash', notes = '') =>
  fetchJson(`${rentCollectionBase()}/payments`, {
    method: 'POST',
    body: JSON.stringify({ invoiceId, amount, paymentMethod, notes }),
  }).then(data => { cacheInvalidate('invoices:'); cacheInvalidate('dashboard:'); cacheInvalidate('payments:'); return data; });

export function fetchCashRequests(ownerId, params = {}) {
  const qs = new URLSearchParams({ ownerId, ...params }).toString();
  const key = `cashRequests:${qs}`;
  const hit = cacheGet(key);
  if (hit) return Promise.resolve(hit);
  return fetchJson(`${cashBase()}/cash/requests?${qs}`)
    .then(data => cacheSet(key, data, TTL.CASH_REQUESTS));
}

export const approveCashRequest = (requestId, ownerLoginId) =>
  fetchJson(`${cashBase()}/cash/${encodeURIComponent(requestId)}/approve`, {
    method: 'POST',
    body: JSON.stringify({ ownerLoginId }),
  }).then(data => {
    cacheInvalidate('cashRequests:');
    cacheInvalidate('payments:');
    cacheInvalidate('dashboard:');
    return data;
  });

export const rejectCashRequest = (requestId, ownerLoginId, reason = '') =>
  fetchJson(`${cashBase()}/cash/${encodeURIComponent(requestId)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ ownerLoginId, reason }),
  }).then(data => {
    cacheInvalidate('cashRequests:');
    cacheInvalidate('payments:');
    cacheInvalidate('dashboard:');
    return data;
  });

export const verifyCashOtp = (tenantLoginId, otp, rentId) =>
  fetchJson(`${cashBase()}/cash/verify-otp`, {
    method: 'POST',
    body: JSON.stringify({ tenantLoginId, otp, rentId }),
  }).then(data => {
    cacheInvalidate('cashRequests:');
    cacheInvalidate('payments:');
    cacheInvalidate('dashboard:');
    cacheInvalidate('invoices:');
    return data;
  });

export function fetchPayments(ownerId, limit = 200, propertyId = '') {
  const key = `payments:all:${ownerId}:${limit}:${propertyId || 'all'}`;
  const hit = cacheGet(key);
  if (hit) return Promise.resolve(hit);
  const qs = new URLSearchParams({ limit: String(limit), ...(propertyId ? { propertyId } : {}) }).toString();
  return fetchJson(`${rentCollectionBase()}/payments?${qs}`)
    .then(data => cacheSet(key, data, 60 * 1000));
}

// ── Penalty preview ──────────────────────────────────────────────────────────
export const previewPenalty = (rentAmount, ownerId, propertyId, dueDate, paidAmount = 0) =>
  fetchJson(`${rentCollectionBase()}/penalty/calculate`, {
    method: 'POST',
    body: JSON.stringify({ rentAmount, ownerId, propertyId, dueDate, paidAmount }),
  });

// ── Penalty configs ──────────────────────────────────────────────────────────
export function fetchPenaltyConfigs(ownerId, force = false) {
  const key = `configs:${ownerId}`;
  if (!force) {
    const hit = cacheGet(key);
    if (hit) return Promise.resolve(hit);
  }
  return fetchJson(`${rentCollectionBase()}/configs?ownerId=${encodeURIComponent(ownerId)}`)
    .then(data => cacheSet(key, data, TTL.CONFIGS));
}

export const savePenaltyConfig = (config) =>
  fetchJson(`${rentCollectionBase()}/configs`, {
    method: 'POST',
    body: JSON.stringify(config),
  }).then(data => { cacheInvalidate('configs:'); return data; });

// ── Cron health ──────────────────────────────────────────────────────────────
export const fetchCronHealth = () =>
  fetchJson(`${rentCollectionBase()}/cron-health`);

// ── Missing contacts ──────────────────────────────────────────────────────────
export function fetchMissingContacts(ownerId) {
  const key = `missingContacts:${ownerId}`;
  const hit = cacheGet(key);
  if (hit) return Promise.resolve(hit);
  return fetchJson(`${rentCollectionBase()}/missing-contacts`)
    .then(data => cacheSet(key, data, TTL.MISSING_CONTACTS));
}

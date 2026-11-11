import { getApiBase } from './api';

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const HEADER = 'X-Owner-Onboarding';
const PASSWORD_KEYS = new Set(['password', 'temppassword', 'pass']);
const memoryAccess = new Map();
let capturedLink = null;
const normalize = (id) => String(id || '').trim().toUpperCase();
const accessKey = (id) => `roomhy_owner_onboarding_${normalize(id)}`;
const linkError = () => new Error('This check-in link is missing, expired, or already used. Ask RoomHy for a new onboarding link.');

// Called before React renders so legacy passwords and one-time fragments are
// removed before the page starts API requests or loads its additional assets.
export function captureOwnerOnboardingLink() {
  if (typeof window === 'undefined' || !/^\/digital-checkin\/ownerprofile(?:\.html)?\/?$/i.test(window.location.pathname)) return null;
  const url = new URL(window.location.href);
  const fragment = url.hash.slice(1);
  const split = fragment.indexOf('?');
  const hashParams = new URLSearchParams(split < 0 ? fragment : fragment.slice(split + 1));
  const entries = [...url.searchParams, ...hashParams];
  const loginId = entries.find(([key]) => ['loginid', 'staffid'].includes(key.toLowerCase()))?.[1] || '';
  const token = hashParams.get('onboarding') || '';
  const legacyLink = entries.some(([key]) => PASSWORD_KEYS.has(key.toLowerCase()));
  for (const params of [url.searchParams, hashParams]) {
    for (const key of [...params.keys()]) {
      if (PASSWORD_KEYS.has(key.toLowerCase()) || key.toLowerCase() === 'onboarding') params.delete(key);
    }
  }
  url.hash = split < 0 ? hashParams.toString() : `${fragment.slice(0, split)}${hashParams.size ? `?${hashParams}` : ''}`;
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  if (!capturedLink || token || normalize(loginId) !== capturedLink.loginId) {
    capturedLink = { loginId: normalize(loginId), token: TOKEN_RE.test(token) ? token : '', legacyLink };
  }
  return capturedLink;
}

// Never display or copy an older server's password-bearing link. A secure link
// must come from the backend; the browser cannot fabricate a valid replacement.
export function safeOwnerOnboardingLink(value, base = window.location.origin) {
  if (typeof value !== 'string' || !value) return '';
  try {
    const url = new URL(value, base);
    const fragment = new URLSearchParams(url.hash.slice(1));
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/digital-checkin/ownerprofile') return '';
    if ([...url.searchParams, ...fragment].some(([key]) => PASSWORD_KEYS.has(key.toLowerCase()))) return '';
    const token = fragment.get('onboarding');
    const loginId = normalize(url.searchParams.get('loginId'));
    if (!TOKEN_RE.test(token || '') || !loginId) return '';
    url.search = new URLSearchParams({ loginId }).toString();
    url.hash = new URLSearchParams({ onboarding: token }).toString();
    return url.href;
  } catch (_) {
    return '';
  }
}

function clearAccess(id) {
  memoryAccess.delete(normalize(id));
  try { sessionStorage.removeItem(accessKey(id)); } catch (_) { /* storage unavailable */ }
}

function readAccess(id) {
  let access = memoryAccess.get(normalize(id));
  if (!access) {
    try { access = JSON.parse(sessionStorage.getItem(accessKey(id)) || 'null'); } catch (_) { /* unavailable or malformed */ }
  }
  if (!access || !TOKEN_RE.test(access.token || '') || !Number.isFinite(access.expiresAt) || access.expiresAt <= Date.now()) {
    clearAccess(id);
    return null;
  }
  return access;
}

async function request(path, { payload, access } = {}) {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: payload ? 'POST' : 'GET',
    credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
    headers: { ...(payload ? { 'Content-Type': 'application/json' } : {}), ...(access ? { [HEADER]: access.token } : {}) },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    const error = new Error(data.message || 'Could not complete owner check-in. Please try again.');
    error.status = res.status;
    throw error;
  }
  return data;
}

async function ensureAccess(id, link) {
  const loginId = normalize(id);
  if (link?.loginId === loginId && link.token && !link.exchangePromise) {
    // No retry across fallback hosts: this link is single-use, and a network
    // failure after consumption cannot safely be retried against another host.
    link.exchangePromise = request('/api/checkin/owner/onboarding/exchange', { payload: { loginId, token: link.token } })
      .then((data) => {
        const access = data.access;
        if (!access || !TOKEN_RE.test(access.token || '') || !Number.isFinite(access.expiresAt) || access.expiresAt <= Date.now()) throw linkError();
        memoryAccess.set(loginId, access);
        try { sessionStorage.setItem(accessKey(loginId), JSON.stringify(access)); } catch (_) { /* tab-memory fallback */ }
      }).finally(() => { link.token = ''; });
  }
  if (link?.loginId === loginId && link.exchangePromise) await link.exchangePromise;
  const access = readAccess(loginId);
  if (!access) throw linkError();
  return access;
}

export async function loadOwnerOnboardingProfile(loginId, link) {
  const access = await ensureAccess(loginId, link);
  try {
    return await request(`/api/checkin/owner/profile/${encodeURIComponent(normalize(loginId))}`, { access });
  } catch (error) {
    if (error.status === 403) clearAccess(loginId);
    throw error;
  }
}

export async function saveOwnerOnboardingProfile(loginId, payload) {
  const access = readAccess(loginId);
  if (!access) throw linkError();
  const { password: _password, tempPassword: _temporary, pass: _pass, checkinPassword: _checkin, credentials: _credentials, ...profile } = payload;
  return request('/api/checkin/owner/profile', { payload: { ...profile, loginId: normalize(loginId) }, access });
}

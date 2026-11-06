// Owner "lead access" flag: set when an owner is blocked from receiving
// leads / bids / chats after a chat-policy violation. The rest of the panel
// keeps working. Pure logic + a tiny store, no React and no imports, so it can
// be tested with `node --test` and imported anywhere (including utils/api.js).

export const LEAD_BLOCK_CODE = 'OWNER_LEADS_BLOCKED';
export const LEAD_BLOCK_MESSAGE =
  'You are blocked from receiving access due to a violation. Please contact the Roomhy team.';

const toState = (blocked, reason) => ({ blocked: blocked === true, reason: blocked === true ? (reason || null) : null });

/** Read `leadAccess` from a /api/auth/me or login payload (several wrapper shapes). */
export function parseLeadAccess(payload) {
  const candidates = [
    payload?.user,
    payload?.data?.user,
    payload?.data,
    payload?.owner,
    payload,
  ];
  for (const c of candidates) {
    const la = c && typeof c === 'object' ? c.leadAccess : undefined;
    if (la && typeof la === 'object') return toState(la.blocked, la.reason);
  }
  return toState(false);
}

/** True for the 403 the backend sends when a blocked owner calls a lead/bid/chat API. */
export function isLeadBlockedResponse(status, body) {
  if (status !== 403 || body == null) return false;
  let parsed = body;
  if (typeof body === 'string') {
    try { parsed = JSON.parse(body); } catch (_) { return false; }
  }
  return parsed?.code === LEAD_BLOCK_CODE;
}

/** Same check for the Error objects thrown by utils/api.js fetchJson (err.status / err.body). */
export const isLeadBlockedError = (err) => isLeadBlockedResponse(err?.status, err?.body);

// ── tiny store (shared by api.js backstop, socket events and the hook) ──────
let current = toState(false);
const listeners = new Set();

export const getLeadAccess = () => current;

export function setLeadAccess(next) {
  const n = toState(next?.blocked, next?.reason);
  if (n.blocked === current.blocked && n.reason === current.reason) return;
  current = n;
  listeners.forEach((fn) => fn());
}

export function subscribeLeadAccess(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const __resetLeadAccessForTests = () => { current = toState(false); listeners.clear(); };

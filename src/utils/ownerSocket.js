// ─────────────────────────────────────────────────────────────────────────────
// One socket.io connection per owner tab.
//
// PropertyOwnerLayout and PropertyOwnerMobileLayout (rendered *inside* the
// desktop layout on phones) each used to open their own socket, and every page
// mounts its own layout, so an owner tab held 2 sockets and rebuilt them on
// every navigation. This module keeps a single shared socket:
//
//   - `join_room` is sent on every `connect`, so the room is re-joined after a
//     reconnect (previously it was emitted once, right after io(), and lost).
//   - Ref-counted: the socket closes only after the last subscriber leaves, and
//     only after a short grace period, so page-to-page navigation (unmount old
//     layout → mount new one) reuses the same connection.
//   - subscribe() returns an unsubscribe that is safe to call before the lazy
//     socket.io-client import has resolved (no leaked sockets on fast unmount).
// ─────────────────────────────────────────────────────────────────────────────

const CLOSE_GRACE_MS = 5000;

let state = null; // { loginId, socket, socketPromise, refs, closeTimer, joinPayload }

function ensureSocket(owner) {
  const loginId = owner.loginId;
  const joinPayload = {
    login_id: loginId,
    role: 'property_owner',
    name: owner.name || loginId,
  };

  if (state && state.loginId !== loginId) {
    // Different owner in the same tab (logout → login): drop the old one.
    teardown();
  }

  if (!state) {
    state = { loginId, socket: null, socketPromise: null, refs: 0, closeTimer: null, joinPayload };
    const current = state;
    current.socketPromise = Promise.all([
      import('socket.io-client'),
      import('./api'),
    ]).then(([{ io }, { getApiBase }]) => {
      if (state !== current) return null; // torn down while importing
      const socket = io(getApiBase(), { transports: ['websocket', 'polling'] });
      const join = () => socket.emit('join_room', current.joinPayload);
      socket.on('connect', join);
      if (socket.connected) join();
      current.socket = socket;
      return socket;
    }).catch(() => null);
  } else {
    state.joinPayload = joinPayload;
  }

  if (state.closeTimer) {
    clearTimeout(state.closeTimer);
    state.closeTimer = null;
  }
  return state;
}

function teardown() {
  if (!state) return;
  if (state.closeTimer) clearTimeout(state.closeTimer);
  try { state.socket?.disconnect(); } catch (_) { /* ignore */ }
  state = null;
}

/**
 * Listen to owner socket events on the shared connection.
 *
 * @param {{ loginId: string, name?: string }} owner
 * @param {Record<string, Function>} handlers  event name → handler
 * @returns {() => void} unsubscribe
 */
export function subscribeOwnerSocket(owner, handlers = {}) {
  if (!owner?.loginId || typeof window === 'undefined') return () => {};

  const current = ensureSocket(owner);
  current.refs += 1;

  let active = true;
  let boundSocket = null;
  const entries = Object.entries(handlers).filter(([, fn]) => typeof fn === 'function');

  current.socketPromise.then((socket) => {
    if (!active || !socket) return;
    boundSocket = socket;
    entries.forEach(([evt, fn]) => socket.on(evt, fn));
  });

  return () => {
    if (!active) return;
    active = false;
    if (boundSocket) entries.forEach(([evt, fn]) => boundSocket.off(evt, fn));
    if (state !== current) return;
    current.refs = Math.max(0, current.refs - 1);
    if (current.refs === 0 && !current.closeTimer) {
      current.closeTimer = setTimeout(() => {
        if (state === current && current.refs === 0) teardown();
      }, CLOSE_GRACE_MS);
    }
  };
}

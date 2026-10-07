import { useEffect, useRef, useState } from "react";
import { fetchJson, getApiBase } from "../utils/api";
import { getScopedStoredUser } from "../utils/authScope";

// ─────────────────────────────────────────────────────────────────────────────
// Website unread-chat badge (WhatsApp-style count on the floating chat button
// and the mobile bottom nav).
//
// Before: FloatingBidNowButton and MobileBottomNav each polled
// /api/chat/inbox/:id every 3 seconds — even while hidden (a component that
// returns null still runs its effects) and even in a background tab. That was
// ~40 inbox calls a minute per signed-in visitor, enough on its own to exhaust
// the API rate limit within minutes.
//
// Now both share ONE subscription:
//   1. Socket   — a `receive_message` push refreshes the count immediately, so
//                 the badge is usually faster than the old 3s poll.
//   2. Polling  — every 20s as a fallback (a socket can be dropped by a proxy,
//                 a sleeping tab or a different server worker), skipped while
//                 the tab is hidden.
//   3. Focus    — coming back to the tab refreshes at once.
//
// The id used and the count calculation are exactly what the two components
// did before: `user.loginId || user.email`, sum of `unread_count`.
// ─────────────────────────────────────────────────────────────────────────────

const POLL_MS = 20000;

let currentUserId = "";
let count = 0;
let pollTimer = null;
let socket = null;
let started = false;
const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => {
    try { listener(count); } catch (_) { /* a bad listener must not break the rest */ }
  });
};

const refresh = async () => {
  const userId = currentUserId;
  if (!userId) return;
  // fetchJson already shares one in-flight request per URL.
  const data = await fetchJson(`/api/chat/inbox/${encodeURIComponent(userId)}`).catch(() => null);
  if (userId !== currentUserId) return; // user changed while the request was in flight
  if (data?.conversations && Array.isArray(data.conversations)) {
    const total = data.conversations.reduce((acc, c) => acc + (Number(c.unread_count) || 0), 0);
    if (total !== count) {
      count = total;
      notify();
    }
  }
};

const onVisibilityChange = () => {
  if (document.visibilityState === "visible") refresh();
};

const connectSocket = (userId, userObj) => {
  // Loaded on demand so socket.io-client stays out of the initial bundle.
  import("socket.io-client")
    .then(({ io }) => {
      if (!started || userId !== currentUserId || socket) return;
      const s = io(getApiBase(), { transports: ["websocket", "polling"], reconnection: true });
      socket = s;
      // Same join payload shape WebsiteChat sends. The server also joins the
      // canonical (email-hash) form of login_id on its own.
      const join = () => {
        s.emit("join_room", {
          login_id: userId,
          role: "website_user",
          name: userObj?.name || userObj?.email || "Website User",
          aliases: [userObj?.email].filter(Boolean),
        });
      };
      s.on("connect", join); // also fires after every reconnect
      s.on("receive_message", () => { refresh(); });
    })
    .catch(() => { /* no socket — the poll still keeps the badge correct */ });
};

const stop = () => {
  started = false;
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisibilityChange);
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

const start = (userId, userObj) => {
  stop();
  if (userId !== currentUserId) {
    // Never show the previous account's count to a different account.
    count = 0;
    notify();
  }
  currentUserId = userId;
  started = true;
  refresh();
  pollTimer = setInterval(() => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    refresh();
  }, POLL_MS);
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibilityChange);
  connectSocket(userId, userObj);
};

const subscribe = (userId, userObj, listener) => {
  listeners.add(listener);
  listener(count);
  if (!started || userId !== currentUserId) start(userId, userObj);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stop();
      currentUserId = "";
    }
  };
};

/**
 * Live unread chat count for the signed-in website user.
 *
 * @param {object}  options
 * @param {object}  options.user     user from AuthContext (falls back to the stored session, as before)
 * @param {boolean} [options.enabled=true] pass false while the badge is not on screen
 * @returns {number}
 */
export function useWebsiteUnread({ user, enabled = true } = {}) {
  const [value, setValue] = useState(count);

  // Same id derivation as before, computed each render; the effect below keys
  // on the resulting STRING. `user` from AuthContext can be a fresh object on
  // every render, and depending on it directly would tear the shared socket
  // down and rebuild it each time.
  const userObj = user || getScopedStoredUser() || {};
  const userId = String(userObj?.loginId || userObj?.email || "");
  const userObjRef = useRef(userObj);
  userObjRef.current = userObj;

  useEffect(() => {
    if (!enabled || !userId) return undefined;
    return subscribe(userId, userObjRef.current, setValue);
  }, [userId, enabled]);

  return value;
}

export default useWebsiteUnread;

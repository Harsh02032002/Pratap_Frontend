import { useCallback, useEffect, useRef, useState } from "react";
import { fetchJson, getApiBase, getScopedAuthToken } from "../utils/api";

// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for the owner-panel bell.
//
//   - Loads the feed once, then listens to the owner's SSE stream
//     (/api/owners/:loginId/stream) for NOTIFICATION_NEW. No interval polling.
//   - Refetches only when the stream reconnects after a drop, or when the tab
//     becomes visible again — the two moments an event could have been missed.
//   - Unread count is derived from the same list the dropdown renders, so the
//     red dot and the list can never disagree.
//
// A staff proxy passes `extraFeedIds` (their own login id): those notifications
// are addressed to the staff member, not the owner, so they are fetched too.
// ─────────────────────────────────────────────────────────────────────────────

const RECONNECT_BASE_MS = 2000;
const RECONNECT_MAX_MS = 60000;
const MAX_ITEMS = 100;

const normalize = (n, own = false) => {
  let meta = n.meta;
  if (typeof meta === "string") {
    try { meta = JSON.parse(meta); } catch (_) { meta = {}; }
  }
  meta = meta || {};
  return {
    ...n,
    title: meta.title || n.title || "Notification",
    message: meta.message || n.message || "",
    type: n.type || "system",
    meta,
    read: !!n.read,
    _ownFeed: own,
  };
};

const keyOf = (n) => String(n._id || `${n.title}-${n.message}-${n.createdAt}`);
const byNewest = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);

export function useOwnerNotifications(ownerLoginId, { extraFeedIds = [], enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [connected, setConnected] = useState(false);
  const extraKey = extraFeedIds.join(",");
  const feedsRef = useRef([]);
  feedsRef.current = [
    ...(extraKey ? extraKey.split(",").map((id) => ({ id, own: true })) : []),
    { id: ownerLoginId, own: false },
  ];

  const load = useCallback(async () => {
    if (!ownerLoginId) return;
    const lists = await Promise.all(
      feedsRef.current.map((f) =>
        fetchJson(`/api/notifications?toLoginId=${encodeURIComponent(f.id)}`)
          .then((r) => (Array.isArray(r) ? r.map((n) => normalize(n, f.own)) : []))
          .catch(() => null)
      )
    );
    if (lists.every((l) => l === null)) return; // total failure: keep what we have
    const seen = new Set();
    const merged = lists.flat().filter(Boolean).filter((n) => {
      const k = keyOf(n);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).sort(byNewest).slice(0, MAX_ITEMS);
    setItems(merged);
  }, [ownerLoginId]);

  useEffect(() => {
    if (!enabled || !ownerLoginId || typeof window === "undefined") return undefined;

    let source = null;
    let reconnectTimer = null;
    let attempt = 0;
    let closed = false;
    let everOpened = false;

    load();

    const open = () => {
      if (closed || typeof EventSource === "undefined") return;
      const token = getScopedAuthToken();
      const qs = token ? `?token=${encodeURIComponent(token)}` : "";
      try {
        source = new EventSource(`${getApiBase()}/api/owners/${encodeURIComponent(ownerLoginId)}/stream${qs}`, { withCredentials: true });
      } catch (_) {
        return;
      }

      source.onopen = () => {
        attempt = 0;
        setConnected(true);
        // Anything that arrived while the stream was down is only in the DB.
        if (everOpened) load();
        everOpened = true;
      };

      source.addEventListener("NOTIFICATION_NEW", (ev) => {
        let data;
        try { data = JSON.parse(ev.data); } catch (_) { return; }
        const incoming = normalize(data, false);
        setItems((prev) => {
          const k = keyOf(incoming);
          if (prev.some((p) => keyOf(p) === k)) return prev;
          return [incoming, ...prev].slice(0, MAX_ITEMS);
        });
      });

      // The server ended the session (deactivated / signed out elsewhere).
      source.addEventListener("session_ended", () => {
        closed = true;
        source?.close();
        setConnected(false);
      });

      source.onerror = () => {
        setConnected(false);
        if (source && source.readyState === 2 /* CLOSED */ && !closed) {
          source.close();
          source = null;
          const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS);
          attempt += 1;
          reconnectTimer = setTimeout(open, delay);
        }
      };
    };

    open();

    let lastFocus = 0;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastFocus < 5000) return;
      lastFocus = now;
      load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      document.removeEventListener("visibilitychange", onVisible);
      if (source) source.close();
      setConnected(false);
    };
  }, [ownerLoginId, extraKey, enabled, load]);

  const markRead = useCallback(async (id) => {
    if (!id) return;
    setItems((prev) => prev.map((n) => (String(n._id) === String(id) ? { ...n, read: true } : n)));
    try { await fetchJson(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "PUT" }); } catch (_) { load(); }
  }, [load]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await Promise.all(
        // A staff proxy clears only their own feed, never the owner's.
        feedsRef.current.filter((f) => f.own || !extraKey).map((f) =>
          fetchJson("/api/notifications/mark-all-read", {
            method: "PUT",
            body: JSON.stringify({ toLoginId: f.id }),
          })
        )
      );
    } catch (_) { load(); }
  }, [load, extraKey]);

  return { items, unreadCount: items.filter((n) => !n.read).length, connected, markRead, markAllRead, reload: load };
}

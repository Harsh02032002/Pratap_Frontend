import { useEffect, useRef } from "react";
import { clearApiCache, getApiBase, getScopedAuthToken } from "./api";
import { getStoredWebsiteToken } from "./websiteSession";

const CHANNEL_NAME = "roomhy_status_sync";
const STORAGE_PING_KEY = "roomhy_status_ping";
const WINDOW_EVENT_NAME = "roomhy:status-updated";

const socketSubscribers = new Set();
let sharedSocket = null;
let sharedSocketToken = "";
let connectingPromise = null;

const resolveSocketToken = () => {
  try {
    return getScopedAuthToken() || getStoredWebsiteToken() || "";
  } catch {
    return "";
  }
};

const notifySocketSubscribers = (detail) => {
  clearApiCache();
  for (const listener of socketSubscribers) {
    try {
      listener(detail || {});
    } catch {
      // ignore subscriber errors
    }
  }
};

const disconnectSharedSocketIfIdle = () => {
  if (socketSubscribers.size > 0) return;
  if (sharedSocket) {
    try {
      sharedSocket.disconnect();
    } catch {
      // ignore
    }
    sharedSocket = null;
    sharedSocketToken = "";
  }
};

const ensureSharedSocket = async () => {
  if (typeof window === "undefined" || socketSubscribers.size === 0) return;
  const token = resolveSocketToken();
  if (!token) return;

  if (sharedSocket && sharedSocketToken === token) {
    if (!sharedSocket.connected) {
      try {
        sharedSocket.connect();
      } catch {
        // ignore
      }
    }
    return;
  }

  if (sharedSocket && sharedSocketToken !== token) {
    try {
      sharedSocket.disconnect();
    } catch {
      // ignore
    }
    sharedSocket = null;
    sharedSocketToken = "";
  }

  if (connectingPromise) return connectingPromise;

  connectingPromise = import("socket.io-client")
    .then(({ io }) => {
      if (socketSubscribers.size === 0) return;
      const latestToken = resolveSocketToken();
      if (!latestToken) return;
      const socket = io(getApiBase(), {
        transports: ["websocket", "polling"],
        auth: { token: latestToken },
        reconnection: true,
        reconnectionDelay: 1500,
        reconnectionDelayMax: 8000,
      });
      sharedSocket = socket;
      sharedSocketToken = latestToken;
      socket.on("roomhy:status-updated", (payload) => {
        notifySocketSubscribers(payload || {});
      });
    })
    .catch(() => {
      // ignore socket load failure; polling + cross-tab sync still work
    })
    .finally(() => {
      connectingPromise = null;
    });

  return connectingPromise;
};

/**
 * Broadcast a status mutation across all open tabs/windows on the same origin
 * (and same tab) and bust the in-memory API cache immediately.
 */
export const broadcastStatusChange = (detail = {}) => {
  clearApiCache();
  if (typeof window === "undefined") return;
  const payload = { ...detail, ts: Date.now() };

  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.postMessage(payload);
      bc.close();
    }
  } catch {
    // ignore
  }

  try {
    localStorage.setItem(STORAGE_PING_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }

  try {
    window.dispatchEvent(new CustomEvent(WINDOW_EVENT_NAME, { detail: payload }));
  } catch {
    // ignore
  }
};

const matchesTypesFilter = (types, detail) => {
  if (!Array.isArray(types) || types.length === 0) return true;
  if (!detail || !detail.type) return true;
  return types.includes(detail.type);
};

/**
 * Keeps page data fresh automatically without manual browser refresh:
 * 1. Backend Socket.IO push ("roomhy:status-updated")
 * 2. Cross-tab BroadcastChannel + localStorage ping + same-tab CustomEvent
 * 3. Tab focus & visibilitychange wakeup
 * 4. Quiet background polling while tab is visible
 */
export function useLiveStatusSync(
  onSync,
  { enabled = true, pollMs = 10000, types = null } = {}
) {
  const onSyncRef = useRef(onSync);
  const typesRef = useRef(types);

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  useEffect(() => {
    typesRef.current = types;
  }, [types]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;

    let debounceTimer = null;
    const triggerSync = (detail = {}) => {
      if (!matchesTypesFilter(typesRef.current, detail)) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        clearApiCache();
        onSyncRef.current?.({ silent: true, detail });
      }, 250);
    };

    const socketListener = (detail) => {
      triggerSync(detail);
    };
    socketSubscribers.add(socketListener);
    ensureSharedSocket();

    let bc = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel(CHANNEL_NAME);
        bc.onmessage = (event) => triggerSync(event?.data || {});
      }
    } catch {
      bc = null;
    }

    const onStorage = (event) => {
      if (event.key !== STORAGE_PING_KEY || !event.newValue) return;
      try {
        triggerSync(JSON.parse(event.newValue));
      } catch {
        triggerSync({});
      }
    };

    const onCustomEvent = (event) => {
      triggerSync(event?.detail || {});
    };

    const onFocus = () => {
      ensureSharedSocket();
      triggerSync({});
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        ensureSharedSocket();
        triggerSync({});
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(WINDOW_EVENT_NAME, onCustomEvent);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const intervalId =
      pollMs > 0
        ? setInterval(() => {
            if (document.visibilityState === "hidden") return;
            ensureSharedSocket();
            clearApiCache();
            onSyncRef.current?.({ silent: true, detail: { source: "poll" } });
          }, pollMs)
        : null;

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (intervalId) clearInterval(intervalId);
      socketSubscribers.delete(socketListener);
      disconnectSharedSocketIfIdle();
      if (bc) {
        try {
          bc.close();
        } catch {
          // ignore
        }
      }
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(WINDOW_EVENT_NAME, onCustomEvent);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, pollMs]);
}

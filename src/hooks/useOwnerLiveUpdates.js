import { useEffect, useRef, useState } from "react";
import { getApiBase } from "../utils/api";

// ─────────────────────────────────────────────────────────────────────────────
// Live updates for owner-panel lists.
//
// The backend already exposes a per-owner SSE stream at
// /api/owners/:loginId/stream — payment.jsx has been listening to it for cash
// requests. This hook subscribes to the same stream for any list that should
// refresh itself when something arrives from the website.
//
// It never depends on the stream being there. Three layers, cheapest first:
//
//   1. SSE      — instant, when the stream is up and the backend emits
//   2. Polling  — only while the stream is NOT open, so a silent or missing
//                 stream still refreshes the list
//   3. Focus    — refetch when the tab is looked at again, which covers the
//                 case where both of the above missed something
//
// So the page is correct today whether or not the backend emits a booking
// event, and becomes instant the moment it does, with no further change here.
// ─────────────────────────────────────────────────────────────────────────────

// Event names to subscribe to. The stream sends named events (payment.jsx uses
// CASH_REQUEST_NEW), but the exact name for a new booking is owned by the
// backend, so the likely spellings are all registered. Anything sent without an
// event name arrives as the default "message" event and is handled too — that is
// the real safety net, not this list.
export const LEAD_EVENT_NAMES = [
  "BOOKING_REQUEST_NEW",
  "BOOKING_NEW",
  "NEW_BOOKING_REQUEST",
  "DIRECT_BOOKING_NEW",
  "LEAD_NEW",
  "NEW_LEAD",
  "ENQUIRY_NEW",
  "NEW_ENQUIRY",
];

const RECONNECT_BASE_MS = 2000;
const RECONNECT_MAX_MS = 60000;

/**
 * Keep a list fresh without the user refreshing.
 *
 * @param {string} ownerLoginId
 * @param {object}   options
 * @param {Function} options.onUpdate  called when something may have changed;
 *                                     do the refetch here (bust your cache)
 * @param {string[]} [options.events]  event names to subscribe to
 * @param {number}   [options.pollMs]  poll interval used only while SSE is down
 * @param {boolean}  [options.enabled]
 * @returns {{ connected: boolean }}
 */
export const useOwnerLiveUpdates = (ownerLoginId, options = {}) => {
  const {
    onUpdate,
    events = LEAD_EVENT_NAMES,
    pollMs = 30000,
    enabled = true,
  } = options;

  const [connected, setConnected] = useState(false);

  // onUpdate is usually an inline closure, so hold it in a ref — otherwise every
  // render would tear down and reopen the stream.
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const eventsKey = events.join(",");

  useEffect(() => {
    if (!enabled || !ownerLoginId || typeof window === "undefined") return;

    let source = null;
    let reconnectTimer = null;
    let attempt = 0;
    let closed = false;

    const fire = () => {
      try { onUpdateRef.current?.(); } catch (err) { console.error("Live update handler failed:", err); }
    };

    const open = () => {
      if (closed || typeof EventSource === "undefined") return;

      // getApiBase() rather than a bare env var — it is what the rest of the app
      // uses and resolves correctly in dev, preview and production alike.
      const url = `${getApiBase()}/api/owners/${encodeURIComponent(ownerLoginId)}/stream`;
      try {
        source = new EventSource(url, { withCredentials: true });
      } catch (_) {
        return; // no stream available; polling below covers it
      }

      source.onopen = () => {
        attempt = 0;
        setConnected(true);
      };

      // Named events, plus the unnamed default so an event this list doesn't
      // know the name of still triggers a refetch.
      eventsKey.split(",").filter(Boolean).forEach((name) => source.addEventListener(name, fire));
      source.onmessage = fire;

      source.onerror = () => {
        setConnected(false);
        // EventSource retries on its own, but not after the connection is closed
        // (a 404 on the route, for instance). Reopen with backoff in that case.
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

    // Polls only while the stream is not open, so a working stream costs nothing.
    const pollTimer = setInterval(() => {
      if (!source || source.readyState !== 1 /* OPEN */) fire();
    }, pollMs);

    // Last line of defence: whatever both of the above missed shows up the moment
    // the owner looks at the tab again.
    const onFocus = () => { if (document.visibilityState === "visible") fire(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      closed = true;
      clearInterval(pollTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      if (source) source.close();
      setConnected(false);
    };
  }, [ownerLoginId, enabled, pollMs, eventsKey]);

  return { connected };
};

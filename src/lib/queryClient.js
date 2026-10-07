import { QueryClient } from "@tanstack/react-query";

// Named, reusable stale times so cache policy lives in one place.
// Values are milliseconds.
// IMPORTANT: These are per-query overrides for data that is genuinely stable.
// The global default staleTime is 0 (always refetch on mount) so F5 always
// fetches fresh data from the server. Queries that accept stale data for
// performance reasons (e.g. identity, approved property listings) explicitly
// set a higher staleTime using these constants.
export const STALE = {
  currentUser: 5 * 60 * 1000,  // 5 min — identity changes rarely
  properties: 2 * 60 * 1000,   // 2 min — property data changes infrequently
  attendance: 30 * 1000,        // 30 sec — attendance changes within a session
  tasks: 30 * 1000,             // 30 sec
  visitors: 30 * 1000,          // 30 sec
  notifications: 0,             // always fresh — notifications change constantly
};

// Single QueryClient for the whole app.
// - staleTime: 0 globally — data is ALWAYS considered stale so React Query
//   triggers a background network refetch on every component mount. This is
//   the primary fix for F5 showing old data. Per-query overrides (STALE.*)
//   are used for genuinely stable data to avoid unnecessary network calls.
// - gcTime: 5 min — keep unmounted query data in memory for fast back-nav.
// - refetchOnWindowFocus: true — when the user returns to the tab after
//   performing an action elsewhere, the data is re-validated automatically.
// - refetchOnReconnect: true — re-validate after a network reconnect.
// - retry: one retry for transient/5xx/network errors; never retry 4xx.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        const status = error?.status;
        if (status && status >= 400 && status < 500) return false; // don't retry client errors
        return failureCount < 1; // one retry for transient/5xx/network
      },
    },
    mutations: {
      retry: 0,
    },
  },
});

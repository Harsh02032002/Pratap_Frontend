import { getWebsiteUserId, getWebsiteUserEmail } from "./websiteSession.js";

// "My Stays" and "My Property Submissions" only make sense once the signed-in
// website user has actually bid/booked or listed a property. The server is the
// source of truth (see hooks/useAccountActivity.js); this marker only lets the
// menu react the instant the user acts, before the next server check.
export const ACCOUNT_ACTIVITY_EVENT = "roomhy:activity-changed";

export const ACTIVITY_STAYS = "stays";
export const ACTIVITY_SUBMISSIONS = "submissions";

const identityOf = () => String(getWebsiteUserId() || getWebsiteUserEmail() || "").trim().toLowerCase();
const flagKey = (kind, identity) => `roomhy_activity_${kind}:${identity}`;

export function hasActivityMarker(kind) {
  const identity = identityOf();
  if (!identity) return false;
  try {
    return localStorage.getItem(flagKey(kind, identity)) === "1";
  } catch {
    return false;
  }
}

/** Call right after a bid / booking / property submission succeeds. */
export function markAccountActivity(kind) {
  const identity = identityOf();
  if (!identity) return;
  try {
    localStorage.setItem(flagKey(kind, identity), "1");
  } catch {
    // storage unavailable: the server check will still pick it up
  }
  try {
    window.dispatchEvent(new CustomEvent(ACCOUNT_ACTIVITY_EVENT, { detail: { kind } }));
  } catch {
    // ignore
  }
}

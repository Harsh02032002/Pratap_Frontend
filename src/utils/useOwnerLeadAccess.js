import { useEffect, useSyncExternalStore } from 'react';
import { fetchJson } from './api';
import { subscribeOwnerSocket } from './ownerSocket';
import {
  getLeadAccess, setLeadAccess, subscribeLeadAccess, parseLeadAccess,
} from './ownerLeadAccess';

let meChecked = false;

/**
 * { blocked, reason } for the signed-in owner. Seeded from the stored session,
 * refreshed from GET /api/auth/me (the backend is the source of truth) and
 * kept live by the owner_leads_blocked / owner_leads_unblocked socket events.
 */
export default function useOwnerLeadAccess(owner) {
  const state = useSyncExternalStore(subscribeLeadAccess, getLeadAccess, getLeadAccess);
  const loginId = owner?.loginId;

  useEffect(() => {
    if (!loginId) return undefined;
    if (!meChecked) {
      meChecked = true;
      fetchJson('/api/auth/me')
        .then((res) => setLeadAccess(parseLeadAccess(res)))
        .catch(() => { meChecked = false; });
    }
    return subscribeOwnerSocket(owner, {
      owner_leads_blocked: (d) => setLeadAccess({ blocked: true, reason: d?.reason }),
      owner_leads_unblocked: () => setLeadAccess({ blocked: false }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginId]);

  return state;
}

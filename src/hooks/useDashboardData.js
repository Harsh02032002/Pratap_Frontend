import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { STALE } from "../lib/queryClient";
import { getOwnerRooms } from "../api/rooms";
import { getOwnerComplaints } from "../api/complaints";
import { getOwnerAnnouncements } from "../api/announcements";
import { getActiveOwnerPropertyId } from "../utils/propertyowner";

// Owner-scoped read hooks shared by the dashboard (and any other page that needs
// the same data). Because they use the same query keys everywhere, React Query
// serves them from ONE cache — no duplicate requests across pages.

export function useOwnerRooms(ownerLoginId, options = {}) {
  const propertyId = getActiveOwnerPropertyId();
  return useQuery({
    queryKey: queryKeys.rooms.byOwner(ownerLoginId, { propertyId }),
    queryFn: () => getOwnerRooms(ownerLoginId, { propertyId }),
    enabled: !!ownerLoginId,
    staleTime: STALE.properties,
    ...options,
  });
}

export function useOwnerComplaints(ownerLoginId, options = {}) {
  const propertyId = getActiveOwnerPropertyId();
  return useQuery({
    queryKey: queryKeys.complaints.byOwner(ownerLoginId, { propertyId }),
    queryFn: () => getOwnerComplaints(ownerLoginId, { propertyId }),
    enabled: !!ownerLoginId,
    staleTime: STALE.tasks,
    ...options,
  });
}

export function useOwnerAnnouncements(ownerLoginId, options = {}) {
  return useQuery({
    queryKey: queryKeys.announcements.byOwner(ownerLoginId),
    queryFn: () => getOwnerAnnouncements(ownerLoginId),
    enabled: !!ownerLoginId,
    staleTime: STALE.properties,
    ...options,
  });
}

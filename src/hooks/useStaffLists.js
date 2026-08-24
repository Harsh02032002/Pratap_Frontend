import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { STALE } from "../lib/queryClient";
import { getOwnerComplaints } from "../api/complaints";
import { getOwnerRooms } from "../api/rooms";
import { getOwnerVisitors } from "../api/visitors";
import { apiFetch } from "../utils/api";
import { getActiveOwnerPropertyId } from "../utils/propertyowner";

/** Complaints visible to a staff member via their owner-scoped property. */
export function useStaffComplaints(ownerLoginId, options = {}) {
  const propertyId = getActiveOwnerPropertyId();
  return useQuery({
    queryKey: queryKeys.complaints.byOwner(ownerLoginId, { propertyId }),
    queryFn: () => getOwnerComplaints(ownerLoginId, { propertyId }),
    enabled: !!ownerLoginId,
    staleTime: STALE.tasks,
    ...options,
  });
}

/** Rooms visible to a staff member via their owner-scoped property. */
export function useStaffRooms(ownerLoginId, options = {}) {
  const propertyId = getActiveOwnerPropertyId();
  return useQuery({
    queryKey: queryKeys.rooms.byOwner(ownerLoginId, { propertyId }),
    queryFn: () => getOwnerRooms(ownerLoginId, { propertyId }),
    enabled: !!ownerLoginId,
    staleTime: STALE.properties,
    ...options,
  });
}

/** Visitor passes / visitor records for a staff member's owner. */
export function useStaffVisitorPasses(ownerLoginId, options = {}) {
  const propertyId = getActiveOwnerPropertyId();
  return useQuery({
    queryKey: queryKeys.visitors.passes(ownerLoginId, { propertyId }),
    queryFn: () => getOwnerVisitors(ownerLoginId, { propertyId }),
    enabled: !!ownerLoginId,
    staleTime: STALE.visitors,
    ...options,
  });
}

/** Update a visitor pass, then refresh the owner-scoped visitor cache. */
export function useUpdateStaffVisitorPass(ownerLoginId) {
  const qc = useQueryClient();
  const propertyId = getActiveOwnerPropertyId();
  return useMutation({
    mutationFn: ({ id, action, approver }) =>
      apiFetch(`/api/visitors/${id}/${action}`, {
        method: "PATCH",
        body: JSON.stringify({
          approverRole: "warden",
          approverLoginId: approver?.loginId,
          approverName: approver?.name || "Designated Warden",
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.visitors.byOwner(ownerLoginId, { propertyId }) });
      qc.invalidateQueries({ queryKey: queryKeys.visitors.passes(ownerLoginId, { propertyId }) });
    },
  });
}

/** Electricity readings for an owner-scoped staff member. */
export function useStaffElectricity(ownerLoginId, options = {}) {
  const propertyId = getActiveOwnerPropertyId();
  return useQuery({
    queryKey: queryKeys.electricity.byOwner(ownerLoginId, { propertyId }),
    queryFn: async () => {
      const qs = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : "";
      const data = await apiFetch(`/api/electricity/owner/${ownerLoginId}${qs}`);
      return data?.data || [];
    },
    enabled: !!ownerLoginId,
    staleTime: STALE.properties,
    ...options,
  });
}

/** Mutate electricity readings and refresh the owner's cached electricity list. */
export function useStaffElectricityMutations(ownerLoginId) {
  const qc = useQueryClient();
  const key = queryKeys.electricity.byOwner(ownerLoginId);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: queryKeys.electricity.all });
  };

  const addReading = useMutation({
    mutationFn: (payload) => apiFetch("/api/electricity/update-reading", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
    onSuccess: invalidate,
  });

  const deleteReading = useMutation({
    mutationFn: ({ id }) => apiFetch(`/api/electricity/${id}`, {
      method: "DELETE",
    }),
    onSuccess: invalidate,
  });

  return { addReading, deleteReading, invalidate };
}

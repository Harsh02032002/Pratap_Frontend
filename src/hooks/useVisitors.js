import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { STALE } from "../lib/queryClient";
import { getOwnerVisitors, createVisitor, updateVisitorStatus } from "../api/visitors";
import { getActiveOwnerPropertyId } from "../utils/propertyowner";

/** Visitor log for an owner (parentLoginId for staff). */
export function useOwnerVisitors(ownerLoginId) {
  const propertyId = getActiveOwnerPropertyId();
  return useQuery({
    queryKey: queryKeys.visitors.byOwner(ownerLoginId, { propertyId }),
    queryFn: () => getOwnerVisitors(ownerLoginId, { propertyId }),
    enabled: !!ownerLoginId,
    staleTime: STALE.visitors,
  });
}

/** Create a visitor, then refresh the owner's visitor list. */
export function useCreateVisitor(ownerLoginId) {
  const qc = useQueryClient();
  const propertyId = getActiveOwnerPropertyId();
  return useMutation({
    mutationFn: (payload) => createVisitor({ ...payload, propertyId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.visitors.byOwner(ownerLoginId, { propertyId }) }),
  });
}

/** Change a visitor's status (optimistic), then re-sync. */
export function useUpdateVisitorStatus(ownerLoginId) {
  const qc = useQueryClient();
  const propertyId = getActiveOwnerPropertyId();
  const key = queryKeys.visitors.byOwner(ownerLoginId, { propertyId });
  return useMutation({
    mutationFn: ({ id, status }) => updateVisitorStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData(key);
      qc.setQueryData(key, (old = []) => old.map((v) => (v._id === id ? { ...v, status } : v)));
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.visitors.all }),
  });
}

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { STALE } from "../lib/queryClient";
import { getOwnerTenants } from "../api/tenants";
import { getActiveOwnerPropertyId } from "../utils/propertyowner";

/** All tenants for an owner (parentLoginId for staff). */
export function useOwnerTenants(ownerLoginId, options = {}) {
  const propertyId = getActiveOwnerPropertyId();
  return useQuery({
    queryKey: queryKeys.tenants.byOwner(ownerLoginId, { propertyId }),
    queryFn: () => getOwnerTenants(ownerLoginId, { propertyId }),
    enabled: !!ownerLoginId,
    staleTime: STALE.properties,
    ...options,
  });
}

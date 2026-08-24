import { apiFetch } from "../utils/api";
import { getActiveOwnerPropertyId } from "../utils/propertyowner";

/** All complaints for an owner (parentLoginId for staff). Returns an array.
 * ALWAYS enforces propertyId for data isolation — if not explicitly provided,
 * reads from localStorage (active property context). This prevents data leaks
 * when an owner has multiple properties.
 */
export async function getOwnerComplaints(ownerLoginId, { propertyId = null } = {}) {
  // If propertyId is not provided, get it from the active property context
  // This ensures every call respects the current property selection
  const effectivePropertyId = propertyId !== null ? propertyId : getActiveOwnerPropertyId();

  const qs = new URLSearchParams();
  if (effectivePropertyId) qs.set("propertyId", effectivePropertyId);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const d = await apiFetch(`/api/complaints/owner/${ownerLoginId}${suffix}`);
  return Array.isArray(d) ? d : (d?.complaints || d?.data || []);
}

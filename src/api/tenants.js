// Tenants API.
import { apiFetch } from "../utils/api";

/** All tenants for an owner (parentLoginId for staff). Returns an array. */
export async function getOwnerTenants(ownerLoginId, { propertyId } = {}) {
  const qs = new URLSearchParams();
  if (propertyId) qs.set("propertyId", propertyId);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const data = await apiFetch(`/api/tenants/owner/${ownerLoginId}${suffix}`);
  return Array.isArray(data) ? data : (data?.tenants || data?.data || []);
}

import { apiFetch } from "../utils/api";

/** All complaints for an owner (parentLoginId for staff). Returns an array. */
export async function getOwnerComplaints(ownerLoginId, { propertyId } = {}) {
  const qs = new URLSearchParams();
  if (propertyId) qs.set("propertyId", propertyId);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const d = await apiFetch(`/api/complaints/owner/${ownerLoginId}${suffix}`);
  return Array.isArray(d) ? d : (d?.complaints || d?.data || []);
}

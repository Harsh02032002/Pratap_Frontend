import { apiFetch } from "../utils/api";

/** All rooms for an owner (parentLoginId for staff). Returns an array. */
export async function getOwnerRooms(ownerLoginId, { propertyId } = {}) {
  const qs = new URLSearchParams();
  if (propertyId) qs.set("propertyId", propertyId);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const d = await apiFetch(`/api/rooms/owner/${ownerLoginId}${suffix}`);
  return Array.isArray(d) ? d : (d?.rooms || d?.data || []);
}

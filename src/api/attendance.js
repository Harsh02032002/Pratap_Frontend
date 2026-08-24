// Attendance API — staff self-attendance + tenant attendance. Endpoints match
// the current staff attendance page.
import { apiFetch } from "../utils/api";

/** The logged-in staff member's own attendance for a month. Returns an array. */
export async function getMyAttendance(staffLoginId, month, year) {
  const data = await apiFetch(`/api/hr/my-attendance/${staffLoginId}?month=${month}&year=${year}`);
  return data?.data || [];
}

export async function checkIn(staffLoginId) {
  return apiFetch(`/api/hr/checkin`, { method: "POST", body: JSON.stringify({ staffLoginId }) });
}

export async function checkOut(staffLoginId) {
  return apiFetch(`/api/hr/checkout`, { method: "POST", body: JSON.stringify({ staffLoginId }) });
}

/** Tenant attendance for an owner on a date. Returns an array. */
export async function getTenantAttendance(ownerLoginId, date, propertyId = "") {
  const qs = new URLSearchParams({ ownerLoginId, date });
  if (propertyId) qs.set("propertyId", propertyId);
  const data = await apiFetch(`/api/tenant-attendance?${qs.toString()}`);
  return data?.data || data?.attendance || [];
}

export async function markTenantAttendance(payload) {
  return apiFetch(`/api/tenant-attendance`, { method: "POST", body: JSON.stringify(payload) });
}

/** Submit a staff leave request. */
export async function applyLeave(payload) {
  return apiFetch(`/api/hr/attendance`, { method: "POST", body: JSON.stringify(payload) });
}

/** One tenant's attendance history for a month (newest first). */
export async function getTenantHistory(ownerLoginId, tenantId, month, year, propertyId = "") {
  const qs = new URLSearchParams({ ownerLoginId, tenantId, month, year });
  if (propertyId) qs.set("propertyId", propertyId);
  const data = await apiFetch(`/api/tenant-attendance?${qs.toString()}`);
  const records = data?.data || data?.attendance || [];
  return [...records].sort((a, b) => (a.date < b.date ? 1 : -1));
}

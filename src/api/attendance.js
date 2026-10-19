// Attendance API — staff self-attendance + tenant attendance. Endpoints match
// the current staff attendance page.
import { apiFetch } from "../utils/api";

/** The logged-in staff member's own attendance for a month. Returns an array. */
export async function getMyAttendance(staffLoginId, month, year) {
  const data = await apiFetch(`/api/hr/my-attendance/${staffLoginId}?month=${month}&year=${year}`);
  return data?.data || [];
}

/** The logged-in employee's assigned shift + whether check-in is open now. data is null if none assigned. */
export async function getMyShift() {
  const data = await apiFetch(`/api/hr/my-shift`);
  return { shift: data?.data || null, graceMinutes: data?.graceMinutes ?? 60 };
}

export async function checkIn(staffLoginId) {
  return apiFetch(`/api/hr/checkin`, { method: "POST", body: JSON.stringify({ staffLoginId }) });
}

export async function checkOut(staffLoginId) {
  return apiFetch(`/api/hr/checkout`, { method: "POST", body: JSON.stringify({ staffLoginId }) });
}

/** Every employee's attendance for one day (superadmin Daily Logs). Returns { data, summary }. */
export async function getAllStaffAttendance(date) {
  const data = await apiFetch(`/api/hr/attendance-all?date=${encodeURIComponent(date)}`);
  return { data: data?.data || [], summary: data?.summary || { present: 0, late: 0, absent: 0, onLeave: 0 } };
}

/** Every leave request (superadmin Leave page). */
export async function getAllLeaves() {
  const data = await apiFetch(`/api/hr/leaves-all`);
  return data?.data || [];
}

/** File a leave. `employeeId` is for admins filing on someone's behalf. */
export async function createLeave(payload) {
  return apiFetch(`/api/hr/leaves`, { method: "POST", body: JSON.stringify(payload) });
}

/** Approve or reject a pending leave. */
export async function setLeaveStatus(id, status) {
  return apiFetch(`/api/hr/leaves/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}

/** The logged-in employee's own leave requests, newest first. */
export async function getMyLeaves() {
  const data = await apiFetch(`/api/hr/leaves/mine`);
  return data?.data || [];
}

/** Every staff member with their weekly shift, or empty fields if unassigned. */
export async function getAllShifts() {
  const data = await apiFetch(`/api/hr/shifts-all`);
  return data?.data || [];
}

export async function saveShift(payload) {
  return apiFetch(`/api/hr/shifts`, { method: "POST", body: JSON.stringify(payload) });
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

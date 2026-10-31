// Scopes owner staff lists to the property selected in the owner panel.

const idOf = (v) => String(v?._id || v?.id || v || "");

/** Property ids a staff record is assigned to (raw API shape or the mapped page shape). */
export const staffPropertyIds = (s) => {
  const list = Array.isArray(s?.assignedProperties) && s.assignedProperties.length
    ? s.assignedProperties
    : [s?.assignedProperty];
  return list.map(idOf).filter(Boolean);
};

/** Only staff assigned to propertyId; an empty propertyId means "all properties". */
export const filterStaffByProperty = (staff, propertyId) => {
  const list = Array.isArray(staff) ? staff : [];
  if (!propertyId) return list;
  return list.filter((s) => staffPropertyIds(s).includes(String(propertyId)));
};

/** Header counts for a staff list; presentToday counts today's Present records of those staff. */
export const summarizeStaff = (staff, attendance = [], now = new Date()) => {
  const ids = new Set((staff || []).map((s) => idOf(s._id || s.id)));
  const day = new Date(now).setHours(0, 0, 0, 0);
  const present = new Set();
  (attendance || []).forEach((a) => {
    const empId = idOf(a.employeeId);
    if (a.status === "Present" && ids.has(empId) && new Date(a.date).setHours(0, 0, 0, 0) === day) present.add(empId);
  });
  const active = (staff || []).filter((s) => s.isActive === true || s.status === "Active").length;
  return { total: ids.size, active, inactive: ids.size - active, presentToday: present.size };
};

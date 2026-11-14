export const ALTERNATE_REQUEST_PATH = "/superadmin/property/request-alternate";

export function alternateRequestSearchPath(bookingId, pathname = "") {
  const base = pathname.startsWith("/employee")
    ? ALTERNATE_REQUEST_PATH.replace("/superadmin/", "/employee/")
    : ALTERNATE_REQUEST_PATH;
  const id = String(bookingId || "").trim();
  return id ? `${base}?bookingId=${encodeURIComponent(id)}` : base;
}

export function alternateRequestNotificationPath(type, meta, pathname = "") {
  if (type !== "refund_request" || meta?.requestType !== "alternative_property" || !meta.bookingId) return "";
  return alternateRequestSearchPath(meta.bookingId, pathname);
}

export function uniqueAlternativeRequests(rows) {
  const seen = new Set();
  return (Array.isArray(rows) ? rows : []).filter(row => {
    if (row?.request_type !== "alternative_property") return false;
    const key = String(row.booking_record_id || row.booking_id || row._id || "").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

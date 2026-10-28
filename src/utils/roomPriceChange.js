// Room price changes never change current tenants' rent: they keep it until
// their agreement is extended, and the extension is priced at the room's
// current price (backend: services/roomRentChangeService.js). This only
// turns the room update's `rentChange` block into an owner message.

const fmtDate = (ymd) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || ""));
  if (!m) return "";
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
};
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/** One-line owner message for the `rentChange` block of a room update response. */
export const describeRentChange = (rc) => {
  if (!rc || !(Number(rc.newPrice) > 0)) return "";
  const tenants = Array.isArray(rc.tenants) ? rc.tenants : [];
  const head = `Room price is now ${inr(rc.newPrice)} for new tenants.`;
  if (!tenants.length) return head;
  const list = tenants
    .map((t) => {
      const end = fmtDate(t.agreementEndDate);
      return `${t.name || "Tenant"} (${inr(t.currentRent)}${end ? `, until ${end}` : ""})`;
    })
    .join(", ");
  const n = tenants.length;
  return `${head} ${n} current tenant${n > 1 ? "s" : ""} keep${n > 1 ? "" : "s"} their rent until the agreement is extended: ${list}.`;
};

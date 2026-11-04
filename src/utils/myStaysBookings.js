const amountFields = [
  "total_amount", "totalAmount", "price",
  "payment_amount", "paymentAmount", "rent_amount", "rentAmount"
];

export function getStayBookingAmount(booking) {
  for (const field of amountFields) {
    const value = booking?.[field];
    if (typeof value !== "number" && typeof value !== "string") continue;
    if (typeof value === "string" && !value.trim()) continue;
    const amount = Number(value);
    if (Number.isFinite(amount) && amount >= 0) return amount;
  }
  return null;
}

export function mergeStayBookings(cachedBookings, serverBookings) {
  const bookings = new Map();
  for (const [source, replace] of [[cachedBookings, false], [serverBookings, true]]) {
    for (const booking of source) {
      if (!booking || typeof booking !== "object" || Array.isArray(booking)) continue;
      const id = booking.booking_id || booking.bookingId || booking._id || booking.id;
      const key = String(id || `${booking.user_id || booking.userId || ""}::${booking.property_id || booking.propertyId || ""}::${booking.payment_id || booking.paymentId || ""}`);
      // Keep existing cache priority; server records replace stale copies.
      if (replace || !bookings.has(key)) bookings.set(key, booking);
    }
  }
  return [...bookings.values()];
}

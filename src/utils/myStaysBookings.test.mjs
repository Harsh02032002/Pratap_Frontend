// Run directly: node src/utils/myStaysBookings.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { getStayBookingAmount, mergeStayBookings } from "./myStaysBookings.js";

test("accepted bookings show recorded rent when legacy total fields are missing", () => {
  const booking = { _id: "booking-1", status: "accepted", rent_amount: 6500 };
  assert.equal(getStayBookingAmount(booking), 6500);
  assert.equal(getStayBookingAmount(booking).toLocaleString("en-IN"), "6,500");
});

test("supports each stored total, payment and rent field", () => {
  for (const field of ["total_amount", "totalAmount", "price", "payment_amount", "paymentAmount", "rent_amount", "rentAmount"]) {
    assert.equal(getStayBookingAmount({ [field]: "1250.50" }), 1250.5, field);
  }
});

test("explicit totals win over payment and rent; payment wins over rent", () => {
  assert.equal(getStayBookingAmount({ total_amount: 1500, totalAmount: 2000, price: 2500, payment_amount: 500, rent_amount: 6500 }), 1500);
  assert.equal(getStayBookingAmount({ payment_amount: 500, rent_amount: 6500 }), 500);
});

test("preserves a recorded zero total without substituting monthly rent", () => {
  assert.equal(getStayBookingAmount({ total_amount: 0, rent_amount: 6500 }), 0);
  assert.equal(getStayBookingAmount({ total_amount: "0", payment_amount: 500 }), 0);
});

test("invalid or empty amounts fall back to the next valid recorded field", () => {
  for (const invalid of [undefined, null, "", "  ", "bad", -10, NaN, Infinity, true, [], {}]) {
    assert.equal(getStayBookingAmount({ total_amount: invalid, payment_amount: 500 }), 500);
  }
});

test("missing or invalid amounts are unavailable, never an invented zero or bid budget", () => {
  for (const booking of [undefined, null, {}, { total_amount: "bad" }, { bid_amount: 5000 }]) {
    assert.equal(getStayBookingAmount(booking), null);
  }
});

test("fresh server rent replaces a cached zero for the same booking", () => {
  const cached = { booking_id: "booking-1", total_amount: 0 };
  const current = { _id: "booking-1", rent_amount: 6500, status: "accepted" };
  const merged = mergeStayBookings([cached], [current]);
  assert.equal(merged.length, 1);
  assert.equal(getStayBookingAmount(merged[0]), 6500);
  assert.equal(merged[0].status, "accepted");
  assert.deepEqual(cached, { booking_id: "booking-1", total_amount: 0 });
});

test("current zero replaces an old positive total", () => {
  const merged = mergeStayBookings([{ bookingId: "one", totalAmount: 500 }], [{ id: "one", total_amount: 0 }]);
  assert.equal(getStayBookingAmount(merged[0]), 0);
});

test("keeps distinct bookings and retains cached records when server is unavailable", () => {
  const cached = [{ _id: "one", total_amount: 500 }, { _id: "two", rent_amount: 6500 }];
  assert.deepEqual(mergeStayBookings(cached, []), cached);
  assert.equal(mergeStayBookings(cached, [{ _id: "three", payment_amount: 1000 }]).length, 3);
});

test("preserves session-first cache priority when no fresh server copy exists", () => {
  const merged = mergeStayBookings([{ booking_id: "one", total_amount: 1000 }, { _id: "one", total_amount: 500 }], []);
  assert.equal(merged.length, 1);
  assert.equal(getStayBookingAmount(merged[0]), 1000);
});

test("deduplicates fallback identities and ignores malformed stored records", () => {
  const identity = { user_id: "user-1", property_id: "property-1", payment_id: "payment-1" };
  const merged = mergeStayBookings([null, false, [], "bad", { ...identity, total_amount: 0 }], [{ ...identity, payment_amount: 1000 }]);
  assert.equal(merged.length, 1);
  assert.equal(getStayBookingAmount(merged[0]), 1000);
});

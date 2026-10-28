// Run directly: node src/utils/roomPriceChange.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { describeRentChange } from "./roomPriceChange.js";

test("no message without a price change", () => {
  assert.equal(describeRentChange(null), "");
  assert.equal(describeRentChange({}), "");
  assert.equal(describeRentChange({ newPrice: 0, tenants: [] }), "");
});

test("empty room: only says the new price is for new tenants", () => {
  assert.equal(describeRentChange({ oldPrice: 5000, newPrice: 6000, tenants: [] }), "Room price is now ₹6,000 for new tenants.");
});

test("current tenants are told they keep their rent until extension", () => {
  const one = describeRentChange({
    oldPrice: 5000, newPrice: 6000,
    tenants: [{ name: "Amit", currentRent: 5000, agreementEndDate: "2026-11-15" }]
  });
  assert.match(one, /1 current tenant keeps their rent until the agreement is extended: Amit \(₹5,000, until 15 Nov 2026\)\./);
  assert.doesNotMatch(one, /next month|from (January|November)/i, "never promises a next-month change");

  const two = describeRentChange({
    oldPrice: 5000, newPrice: 4500,
    tenants: [{ name: "A", currentRent: 5000, agreementEndDate: "2027-01-10" }, { name: "", currentRent: 4800, agreementEndDate: null }]
  });
  assert.match(two, /^Room price is now ₹4,500 for new tenants\. 2 current tenants keep their rent/);
  assert.match(two, /A \(₹5,000, until 10 Jan 2027\), Tenant \(₹4,800\)\.$/);
});

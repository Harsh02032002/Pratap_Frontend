// Run directly: node src/utils/staffScope.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { filterStaffByProperty, summarizeStaff } from "./staffScope.js";

const staff = [
  { id: "1", assignedProperty: "A", status: "Active" },
  { id: "2", assignedProperties: [{ _id: "B" }], status: "Active" },
  { id: "3", assignedProperties: ["A", "B"], status: "Inactive" },
  { id: "4", status: "Active" },
];

test("no property selected shows everyone", () => {
  assert.equal(filterStaffByProperty(staff, "").length, 4);
});

test("selected property shows only its staff, unassigned hidden", () => {
  assert.deepEqual(filterStaffByProperty(staff, "A").map((s) => s.id), ["1", "3"]);
  assert.deepEqual(filterStaffByProperty(staff, "B").map((s) => s.id), ["2", "3"]);
  assert.deepEqual(filterStaffByProperty(staff, "C"), []);
});

test("handles non-array input", () => {
  assert.deepEqual(filterStaffByProperty(null, "A"), []);
});

test("summary counts only scoped staff and today's present", () => {
  const now = new Date("2026-10-28T10:00:00");
  const scoped = filterStaffByProperty(staff, "A");
  const att = [
    { employeeId: "1", status: "Present", date: "2026-10-28T08:00:00" },
    { employeeId: "2", status: "Present", date: "2026-10-28T08:00:00" },
    { employeeId: "3", status: "Present", date: "2026-10-27T08:00:00" },
  ];
  assert.deepEqual(summarizeStaff(scoped, att, now), { total: 2, active: 1, inactive: 1, presentToday: 1 });
});

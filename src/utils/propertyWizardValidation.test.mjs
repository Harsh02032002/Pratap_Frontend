import assert from "node:assert/strict";
import { validateStep, firstInvalidStep, getQualityChecks } from "./propertyWizardValidation.js";

const good = {
  propertyName: "Cozy", propertyCategory: "PG", address: "1 St", locality: "Kor", city: "BLR", state: "KA",
  pincode: "560001", contactName: "A", contactNumber: "9876543210", email: "a@b.co",
  roomTypes: [{ type: "Single", totalRooms: "2", totalBeds: "2", pricePerBed: "5000" }],
  propertyPhotos: ["u"], latitude: 12.9, longitude: 77.5,
};
assert.equal(validateStep(1, good).length, 0);
assert.equal(validateStep(2, good).length, 0);
assert.equal(validateStep(4, good).length, 0);
assert.equal(firstInvalidStep(6, good), null);

// blank form is blocked at step 1
const blankForm = { roomTypes: [], propertyPhotos: [] };
assert.equal(firstInvalidStep(6, blankForm).step, 1);
assert.ok(validateStep(1, blankForm).length >= 8);

assert.ok(validateStep(1, { ...good, pincode: "12" }).length === 1);
assert.ok(validateStep(1, { ...good, email: "nope" }).length === 1);
assert.ok(validateStep(1, { ...good, contactNumber: "123" }).length === 1);
assert.equal(validateStep(2, { roomTypes: [] }).length, 1);
assert.ok(validateStep(2, { roomTypes: [{ type: "", totalRooms: "0", totalBeds: "1", pricePerBed: "0" }] }).length === 3);
assert.equal(firstInvalidStep(6, { ...good, propertyPhotos: [] }).step, 4);

// quality checks follow real state
assert.ok(getQualityChecks(good).every((c) => c.ok));
const bad = getQualityChecks({ ...blankForm, latitude: null, longitude: null });
assert.ok(bad.every((c) => !c.ok));
assert.equal(getQualityChecks({ ...good, latitude: null }).filter((c) => !c.ok).length, 1);
console.log("propertyWizardValidation tests passed");

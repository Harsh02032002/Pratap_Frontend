import test from "node:test";
import assert from "node:assert/strict";
import { getPropertyGender, matchesPropertyGender, normalizePropertyGender } from "./propertyGender.js";

test("Boys Only matches Boys PG, Boys and Male records", () => {
  for (const gender of ["Boys PG", "Boys Only", "Boys", "Male", "Boys Hostel"]) {
    assert.equal(matchesPropertyGender({ gender }, "Boys"), true, gender);
  }
});

test("Girls Only matches Girls PG, Girls and Female records", () => {
  for (const gender of ["Girls PG", "Girls Only", "Girls", "Female", "Girls Hostel"]) {
    assert.equal(matchesPropertyGender({ gender }, "Girls"), true, gender);
  }
});

test("male and female never match each other by substring", () => {
  assert.equal(matchesPropertyGender({ gender: "Male" }, "female"), false);
  assert.equal(matchesPropertyGender({ gender: "Female" }, "male"), false);
  assert.equal(matchesPropertyGender({ gender: "Girls PG" }, "Boys Only"), false);
  assert.equal(matchesPropertyGender({ gender: "Boys PG" }, "Girls Only"), false);
});

test("co-ed, co-living and other aliases match the co-ed option", () => {
  for (const gender of ["Co-ed", "Co living", "Co-Living", "Unisex", "Both", "Mixed"]) {
    assert.equal(matchesPropertyGender({ gender }, "other"), true, gender);
  }
});

test("Any and All Genders apply no gender restriction", () => {
  for (const selected of ["", "Any", "All", "All Genders"]) {
    for (const gender of ["Male", "Female", "Co-ed", ""]) {
      assert.equal(matchesPropertyGender({ gender }, selected), true);
    }
  }
});

test("raw and formatted property gender fields are both supported", () => {
  for (const property of [{ genderSuitability: "Boys PG" }, { propertyInfo: { genderSuitability: "Boys PG" } },
    { propertyInfo: { gender: "Male" } }, { propertyDetails: { genderPref: "Boys Only" } },
    { propertyCategory: "Boys PG" }, { category: "Boys PG" }]) {
    assert.equal(matchesPropertyGender(property, "Boys"), true);
  }
});

test("the placeholder any does not hide a specific property category", () => {
  assert.equal(getPropertyGender({ gender: "any", propertyCategory: "Boys PG" }), "male");
  assert.equal(getPropertyGender({ gender: "any", category: "Girls PG" }), "female");
});

test("unknown property genders do not match a specific selection", () => {
  for (const property of [null, {}, { gender: "Unknown" }, { gender: 12 }]) {
    assert.equal(matchesPropertyGender(property, "Boys"), false);
  }
  assert.equal(matchesPropertyGender({ gender: "Male" }, "Unknown"), false);
});

test("Boys Only and Girls Only exclude co-ed; full-page bidding can include co-ed", () => {
  for (const selected of ["Boys", "Girls"]) {
    assert.equal(matchesPropertyGender({ gender: "Co-ed" }, selected), false);
    assert.equal(matchesPropertyGender({ gender: "Co-ed" }, selected, { includeCoed: true }), true);
  }
});

test("an explicit gender keeps precedence over a conflicting category", () => {
  assert.equal(getPropertyGender({ gender: "Female", propertyCategory: "Boys PG" }), "female");
});

test("capitalization, spaces and punctuation do not change classification", () => {
  assert.equal(normalizePropertyGender("  BOYS-PG  "), "male");
  assert.equal(normalizePropertyGender("Girls / Female"), "female");
  assert.equal(normalizePropertyGender("Co-ed / Any"), "coed");
});

import test from "node:test";
import assert from "node:assert/strict";
import { getSubmissionPresentation, getListingReturnPath, submissionStages } from "./propertySubmissions.js";

test("all six real states have clear copy and a valid progress step", () => {
  for (const stage of Object.keys(submissionStages)) {
    const state = getSubmissionPresentation({ stage });
    assert.ok(state.label && state.description);
    assert.ok([0, 1, 2].includes(state.step));
  }
  assert.match(submissionStages.assigned.description, /contact you soon/);
});

test("reviewed and completed work is never presented as published", () => {
  assert.equal(getSubmissionPresentation({ stage: "reviewing" }).step, 1);
  assert.equal(getSubmissionPresentation({ stage: "completed" }).step, 1);
  assert.equal(getSubmissionPresentation({ stage: "submitted" }).step, 0);
  assert.equal(getSubmissionPresentation({ stage: "live" }).step, 2);
});

test("only a live property with a real local listing URL is clickable", () => {
  const listingUrl = "/property-details/0123456789abcdef01234567";
  assert.equal(getSubmissionPresentation({ stage: "live", listingUrl }).listingUrl, listingUrl);
  for (const stage of ["submitted", "assigned", "reviewing", "rejected", "offline"]) {
    assert.equal(getSubmissionPresentation({ stage, listingUrl }).listingUrl, null);
  }
  for (const url of ["https://example.com", "javascript:alert(1)", "//example.com", "/property-details/", "/property-details/unknown", null]) {
    assert.equal(getSubmissionPresentation({ stage: "live", listingUrl: url }).listingUrl, null);
  }
});

test("unknown or malformed state stays under review", () => {
  for (const submission of [null, undefined, {}, { stage: "__proto__" }, { stage: "toString" }]) {
    assert.equal(getSubmissionPresentation(submission).label, "Listing under review");
  }
});

test("listing sign-in returns to the right page without allowing open redirects", () => {
  assert.equal(getListingReturnPath("?redirect=%2Flist-property"), "/list-property");
  assert.equal(getListingReturnPath("?redirect=%2Fmy-property-submissions"), "/my-property-submissions");
  for (const query of ["", "?redirect=https://example.com", "?redirect=//example.com", "?redirect=javascript:alert(1)", "?redirect=/superadmin", "?redirect=/list-property/../superadmin"]) {
    assert.equal(getListingReturnPath(query), "/");
  }
});

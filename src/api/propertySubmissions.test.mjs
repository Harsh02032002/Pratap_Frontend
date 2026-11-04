import test from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import { getSubmissionToken, getMyPropertySubmissions, submitPropertyEnquiry } from "./propertySubmissions.js";

const originalAdapter = axios.defaults.adapter;
const originalGlobals = Object.fromEntries(["window", "sessionStorage", "localStorage"].map(key => [key, globalThis[key]]));
let session, local, requests;
test.beforeEach(() => {
  session = new Map(); local = new Map(); requests = [];
  globalThis.window = { location: { hostname: "localhost", origin: "http://localhost:5173" } };
  globalThis.sessionStorage = { getItem: key => session.get(key) ?? null };
  globalThis.localStorage = { getItem: key => local.get(key) ?? null };
  axios.defaults.adapter = async config => {
    requests.push(config);
    return { data: { success: true, submissions: [], total: 0, totalPages: 0, page: 1 }, status: 200, statusText: "OK", headers: {}, config };
  };
});
test.after(() => {
  axios.defaults.adapter = originalAdapter;
  for (const [key, value] of Object.entries(originalGlobals)) {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
});

test("a panel token or accessToken cannot submit or fetch website records", async () => {
  local.set("token", "panel-token"); local.set("accessToken", "other-token");
  assert.equal(getSubmissionToken(), "");
  await assert.rejects(getMyPropertySubmissions(1), error => error.status === 401);
  await assert.rejects(submitPropertyEnquiry({}), error => error.status === 401);
  assert.equal(requests.length, 0);
});

test("website token is read for each request and session storage takes precedence", async () => {
  local.set("website_token", "local-website"); session.set("website_token", "tab-website");
  await getMyPropertySubmissions(2);
  assert.equal(requests[0].headers.get("Authorization"), "Bearer tab-website");
  assert.equal(requests[0].url, "/api/website-enquiry/mine?page=2");
  session.set("website_token", "new-website");
  await getMyPropertySubmissions(1);
  assert.equal(requests[1].headers.get("Authorization"), "Bearer new-website");
});

test("submission sends the property details through the authenticated website API", async () => {
  local.set("website_token", "website-token");
  const details = { property_name: "Example PG", city: "Kota" };
  await submitPropertyEnquiry(details);
  assert.equal(requests[0].method, "post");
  assert.equal(requests[0].url, "/api/website-enquiry/submit");
  assert.deepEqual(JSON.parse(requests[0].data), details);
});

test("expired sessions and server failures expose retryable, useful errors", async () => {
  local.set("website_token", "website-token");
  axios.defaults.adapter = async () => { throw new axios.AxiosError("request failed", "ERR_BAD_RESPONSE", {}, {}, { status: 401, data: { message: "Please sign in again" } }); };
  await assert.rejects(getMyPropertySubmissions(1), error => error.status === 401 && error.message === "Please sign in again");
  axios.defaults.adapter = async () => { throw new axios.AxiosError("Request timed out", "ECONNABORTED"); };
  await assert.rejects(getMyPropertySubmissions(1), /Request timed out/);
});

test("cancelling an outdated request keeps axios cancellation semantics", async () => {
  local.set("website_token", "website-token");
  const controller = new AbortController(); controller.abort();
  await assert.rejects(getMyPropertySubmissions(1, controller.signal), error => axios.isCancel(error));
  assert.equal(requests.length, 0);
});

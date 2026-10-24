import assert from "node:assert/strict";
import { stripVisitSecrets, purgeStoredVisitSecrets } from "./visitStorage.js";

const v = {
  visitId: "V1", propertyName: "P", kycAadhaarNumber: "1234", bankAccountNumber: "999", bankIfscCode: "X", bankUpiId: "u@b",
  generatedCredentials: { loginId: "ROOMHY1", tempPassword: "s3cret" },
};
const out = stripVisitSecrets(v);
assert.equal(out.generatedCredentials.tempPassword, undefined);
assert.equal(out.generatedCredentials.loginId, "ROOMHY1");
assert.equal(out.kycAadhaarNumber, undefined);
assert.equal(out.bankAccountNumber, undefined);
assert.equal(out.visitId, "V1");
assert.equal(v.generatedCredentials.tempPassword, "s3cret", "input not mutated");
assert.equal(stripVisitSecrets(null), null);

const mk = () => { const d = {}; return { getItem: (k) => d[k] ?? null, setItem: (k, x) => { d[k] = x; } }; };
globalThis.localStorage = mk(); globalThis.sessionStorage = mk();
localStorage.setItem("k", JSON.stringify([v]));
sessionStorage.setItem("k", "not json");
purgeStoredVisitSecrets("k");
assert.ok(!localStorage.getItem("k").includes("s3cret"));
assert.ok(!localStorage.getItem("k").includes("1234"));
assert.equal(sessionStorage.getItem("k"), "not json");
console.log("visitStorage tests passed");

import assert from "node:assert/strict";
import { hasEmployeePermission } from "./employeePermissions.js";

const withSettings = { role: "employee", permissions: ["settings"] };
const noPerms = { role: "employee" };
assert.equal(hasEmployeePermission(withSettings, "/employee/backup"), false);
assert.equal(hasEmployeePermission(noPerms, "/employee/backup"), false);
assert.equal(hasEmployeePermission(withSettings, "/employee/backup?x=1"), false);
assert.equal(hasEmployeePermission(withSettings, "/employee/settings"), true);
assert.equal(hasEmployeePermission({ role: "superadmin" }, "/superadmin/backup"), true);
assert.equal(hasEmployeePermission({ role: "admin" }, "/employee/backup"), true);
console.log("employeePermissions tests passed");

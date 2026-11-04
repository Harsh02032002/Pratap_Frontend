import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Public-website chat buttons must open /website/chat, never the tenant panel chat.
const dirs = ["../pages/website", "../components/website"].map((d) => new URL(d + "/", import.meta.url));

test("no public website page or component links to the tenant panel chat", () => {
  const offenders = [];
  for (const dir of dirs) {
    for (const name of readdirSync(dir).filter((n) => /\.(jsx|js)$/.test(n))) {
      if (readFileSync(new URL(name, dir), "utf8").includes("/tenant/tenantchat")) offenders.push(fileURLToPath(new URL(name, dir)));
    }
  }
  assert.deepEqual(offenders, []);
});

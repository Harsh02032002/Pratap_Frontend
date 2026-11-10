// Run: node src/utils/authIsolation.test.mjs
// Bundle the actual browser modules in memory using the existing Vite dependency.
// Each test gets isolated storage, session state, and a controlled fetch transport.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';

const bundle = buildSync({
  stdin: {
    contents: `
      export * as api from './api.js';
      export * as services from '../services/api.js';
      export * as scope from './authScope.js';
      export * as website from './websiteSession.js';
      export * as cache from './cache.js';
      export { queryClient } from '../lib/queryClient.js';
      export { setStaffSession, clearStaffSession } from './staffAccess.js';
      export { clearOwnerRuntimeSession } from './propertyowner.js';
      export { getLeadAccess } from './ownerLeadAccess.js';
    `,
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
  },
  bundle: true, write: false, platform: 'browser', format: 'cjs',
  define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
  logLevel: 'silent',
}).outputFiles[0].text;

const storage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
};

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

const response = (data, status = 200) => ({
  ok: status >= 200 && status < 300, status, statusText: String(status),
  json: async () => data, text: async () => JSON.stringify(data),
});

function transport({ respectAbort = true } = {}) {
  const calls = [];
  return {
    calls,
    fetch(url, options) {
      const pending = deferred();
      calls.push({ url, options, ...pending });
      if (respectAbort) {
        const abort = () => pending.reject(options.signal.reason);
        if (options.signal.aborted) abort();
        else options.signal.addEventListener('abort', abort, { once: true });
      }
      return pending.promise;
    },
  };
}

function environment(t, wire = transport()) {
  const window = new EventTarget();
  window.location = { pathname: '/website/profile', hostname: 'audit.invalid', origin: 'https://audit.invalid' };
  const context = vm.createContext({
    module: { exports: {} }, window, localStorage: storage(), sessionStorage: storage(),
    Headers, AbortController, DOMException, URLSearchParams, setTimeout, clearTimeout,
    console: { error() {}, warn() {}, log() {} },
    fetch: (...args) => wire.fetch(...args),
  });
  vm.runInContext(bundle, context);
  const exports = context.module.exports;
  t.after(() => exports.scope.invalidateAuthSession());
  return { ...exports, context, wire, window, local: context.localStorage, tab: context.sessionStorage };
}

const sessionCancelled = (error) => error.name === 'AbortError' && error.code === 'AUTH_SESSION_CHANGED';
const auth = (call) => call.options.headers.get('Authorization');

test('SEC-01: every panel-token alias and user.token is excluded on website routes', async (t) => {
  const e = environment(t);
  for (const key of ['token', 'staff_token', 'managerToken', 'accessToken', 'adminToken']) {
    e.local.setItem(key, `synthetic-${key}`);
    e.tab.setItem(key, `synthetic-tab-${key}`);
  }
  e.local.setItem('user', JSON.stringify({ token: 'synthetic-user-token' }));
  assert.equal(e.api.getAuthHeader().Authorization, undefined);
  for (const client of [e.api.fetchJson, e.services.apiFetch]) {
    const pending = client('/api/auth/me');
    const call = e.wire.calls.at(-1);
    assert.equal(auth(call), null);
    call.resolve(response({ signedIn: false }));
    assert.equal((await pending).signedIn, false);
  }
});

test('both clients ignore malformed user storage and caller Authorization', async (t) => {
  const e = environment(t);
  e.local.setItem('user', '{invalid-json');
  for (const client of [e.api.fetchJson, e.services.apiFetch]) {
    const pending = client('/api/auth/me', { headers: { authorization: 'Bearer synthetic-panel' } });
    const call = e.wire.calls.at(-1);
    assert.equal(auth(call), null);
    call.resolve(response({ ok: true }));
    await pending;
  }
});

test('website tokens take precedence; caller headers survive except Authorization', async (t) => {
  const e = environment(t);
  e.local.setItem('token', 'synthetic-panel');
  e.local.setItem('website_token', 'synthetic-local-website');
  e.tab.setItem('website_token', 'synthetic-tab-website');
  for (const client of [e.api.fetchJson, e.services.apiFetch]) {
    const pending = client('/api/auth/me', { headers: new Headers({ Authorization: 'Bearer wrong', 'X-Property': 'fixture' }) });
    const call = e.wire.calls.at(-1);
    assert.equal(auth(call), 'Bearer synthetic-tab-website');
    assert.equal(call.options.headers.get('X-Property'), 'fixture');
    call.resolve(response({ ok: true }));
    await pending;
  }
});

test('panel routes preserve tab-token precedence and legacy scoped aliases', async (t) => {
  const e = environment(t);
  e.local.setItem('website_token', 'synthetic-website');
  e.local.setItem('token', 'synthetic-local-panel');
  e.tab.setItem('token', 'synthetic-tab-panel');
  for (const pathname of ['/propertyowner/admin', '/staff/tasks', '/manager/dashboard', '/tenant/tenantdashboard', '/superadmin/superadmin']) {
    e.window.location.pathname = pathname;
    const pending = e.api.fetchJson('/api/auth/me');
    const call = e.wire.calls.at(-1);
    assert.equal(auth(call), 'Bearer synthetic-tab-panel');
    call.resolve(response({ role: 'fixture' }));
    await pending;
  }
  e.tab.removeItem('token'); e.local.removeItem('token');
  e.tab.setItem('staff_token', 'synthetic-staff');
  assert.equal(e.api.getAuthHeader().Authorization, 'Bearer synthetic-staff');
});

test('fabricated website and panel tokens remain absent', (t) => {
  const e = environment(t);
  e.local.setItem('website_token', 'demo_token_123');
  e.local.setItem('token', 'owner_token_123');
  assert.equal(e.api.getAuthHeader().Authorization, undefined);
  e.window.location.pathname = '/propertyowner/admin';
  assert.equal(e.api.getAuthHeader().Authorization, undefined);
});

test('identical GETs still deduplicate within the same session', async (t) => {
  const e = environment(t);
  e.local.setItem('website_token', 'synthetic-A');
  const first = e.api.fetchJson('/api/auth/me');
  const second = e.api.fetchJson('/api/auth/me');
  assert.equal(first, second);
  assert.equal(e.wire.calls.length, 1);
  e.wire.calls[0].resolve(response({ user: 'A' }));
  assert.equal((await first).user, 'A');
  assert.equal((await second).user, 'A');
});

test('same URL with different response-affecting headers does not deduplicate', async (t) => {
  const e = environment(t);
  const a = e.api.fetchJson('/api/rooms', { headers: { 'X-Property': 'A' } });
  const b = e.api.fetchJson('/api/rooms', { headers: { 'X-Property': 'B' } });
  assert.notEqual(a, b);
  assert.equal(e.wire.calls.length, 2);
  e.wire.calls[0].resolve(response({ property: 'A' }));
  e.wire.calls[1].resolve(response({ property: 'B' }));
  assert.equal((await a).property, 'A');
  assert.equal((await b).property, 'B');
});

test('SEC-05: switching A to B aborts A and creates a separate GET for B', async (t) => {
  const e = environment(t);
  e.local.setItem('website_token', 'synthetic-A');
  const a = e.api.fetchJson('/api/auth/me');
  const cancelled = assert.rejects(a, sessionCancelled);
  e.local.setItem('website_token', 'synthetic-B');
  const b = e.api.fetchJson('/api/auth/me');
  assert.notEqual(a, b);
  assert.equal(e.wire.calls.length, 2);
  assert.equal(e.wire.calls[0].options.signal.aborted, true);
  assert.equal(auth(e.wire.calls[1]), 'Bearer synthetic-B');
  e.wire.calls[1].resolve(response({ user: 'B' }));
  assert.equal((await b).user, 'B');
  await cancelled;
});

test('late responses are rejected even when the transport ignores abort', async (t) => {
  const e = environment(t, transport({ respectAbort: false }));
  e.local.setItem('website_token', 'synthetic-A');
  const a = e.api.fetchJson('/api/auth/me');
  const cancelled = assert.rejects(a, sessionCancelled);
  // No new request or storage event: response acceptance itself must detect B.
  e.local.setItem('website_token', 'synthetic-B');
  e.wire.calls[0].resolve(response({ user: 'A' }));
  await cancelled;
  assert.equal(e.wire.calls[0].options.signal.aborted, true);
});

test('both clients reject a response whose JSON finishes after an account switch', async (t) => {
  for (const clientName of ['primary', 'secondary']) {
    const e = environment(t, transport({ respectAbort: false }));
    e.local.setItem('website_token', 'synthetic-A');
    const client = clientName === 'primary' ? e.api.fetchJson : e.services.apiFetch;
    const body = deferred();
    const pending = client('/api/auth/me');
    const cancelled = assert.rejects(pending, sessionCancelled);
    e.wire.calls[0].resolve({ ok: true, json: () => body.promise });
    await Promise.resolve();
    e.website.setWebsiteSession({ id: 'B', role: 'tenant' }, 'synthetic-B');
    body.resolve({ user: 'A' });
    await cancelled;
  }
});

test('website login and logout immediately cancel requests across both clients', async (t) => {
  const e = environment(t);
  e.website.setWebsiteSession({ id: 'A', role: 'tenant' }, 'synthetic-A');
  const a = e.api.fetchJson('/api/auth/me');
  const other = e.services.apiFetch('/api/private');
  const aCancelled = assert.rejects(a, sessionCancelled);
  const otherCancelled = assert.rejects(other, sessionCancelled);
  const generation = e.scope.getAuthSession().generation;
  e.website.setWebsiteSession({ id: 'B', role: 'tenant' }, 'synthetic-B');
  assert.ok(e.scope.getAuthSession().generation > generation);
  assert.ok(e.wire.calls.slice(0, 2).every((call) => call.options.signal.aborted));
  await Promise.all([aCancelled, otherCancelled]);
  const b = e.api.fetchJson('/api/auth/me');
  const bCancelled = assert.rejects(b, sessionCancelled);
  e.website.clearWebsiteSession();
  await bCancelled;
  assert.equal(e.scope.getAuthSession().token, null);
});

test('relogin with the same token still advances the generation', async (t) => {
  const e = environment(t);
  const user = { id: 'A', role: 'tenant' };
  e.website.setWebsiteSession(user, 'synthetic-A');
  const before = e.scope.getAuthSession().generation;
  const pending = e.api.fetchJson('/api/private');
  const cancelled = assert.rejects(pending, sessionCancelled);
  e.website.setWebsiteSession(user, 'synthetic-A');
  assert.ok(e.scope.getAuthSession().generation > before);
  await cancelled;
});

test('old-session error bodies cannot clear B or block its lead access', async (t) => {
  for (const status of [401, 403]) {
    const e = environment(t, transport({ respectAbort: false }));
    e.window.location.pathname = '/propertyowner/admin';
    e.tab.setItem('token', 'synthetic-A');
    const body = deferred();
    const a = e.api.fetchJson('/api/private');
    const cancelled = assert.rejects(a, sessionCancelled);
    e.wire.calls[0].resolve({ ok: false, status, text: () => body.promise });
    await Promise.resolve();
    e.tab.setItem('token', 'synthetic-B');
    e.scope.invalidateAuthSession();
    body.resolve(JSON.stringify({ message: 'token invalid', sessionEnded: true, code: 'OWNER_LEADS_BLOCKED' }));
    await cancelled;
    assert.equal(e.tab.getItem('token'), 'synthetic-B');
    assert.equal(e.getLeadAccess().blocked, false);
  }
});

test('late mutation responses do not run current-session mutation hooks', async (t) => {
  const e = environment(t, transport({ respectAbort: false }));
  e.local.setItem('website_token', 'synthetic-A');
  let mutations = 0;
  e.api.onApiMutation(() => { mutations += 1; });
  const body = deferred();
  const pending = e.api.fetchJson('/api/private', { method: 'POST', body: '{}' });
  const cancelled = assert.rejects(pending, sessionCancelled);
  e.wire.calls[0].resolve({ ok: true, json: () => body.promise });
  await Promise.resolve();
  e.website.clearWebsiteSession();
  body.resolve({ ok: true });
  await cancelled;
  assert.equal(mutations, 0);
});

test('caller cancellation is independent and is not reported as a timeout', async (t) => {
  const e = environment(t);
  const controller = new AbortController();
  const a = e.api.fetchJson('/api/private', { signal: controller.signal });
  const b = e.api.fetchJson('/api/private');
  assert.equal(e.wire.calls.length, 2);
  const cancelled = assert.rejects(a, (error) => error.name === 'AbortError' && error.status !== 408);
  controller.abort();
  await cancelled;
  assert.equal(e.wire.calls[1].options.signal.aborted, false);
  e.wire.calls[1].resolve(response({ ok: true }));
  await b;
});

test('pre-aborted caller signals never send a request in either client', async (t) => {
  const e = environment(t);
  const controller = new AbortController(); controller.abort();
  for (const client of [e.api.fetchJson, e.services.apiFetch]) {
    await assert.rejects(client('/api/private', { signal: controller.signal }), (error) => error.name === 'AbortError');
  }
  assert.equal(e.wire.calls.length, 0);
});

test('actual timeouts keep the TimeoutError / 408 contract and allow retry', async (t) => {
  const e = environment(t);
  await assert.rejects(e.api.fetchJson('/api/private', { timeout: 5 }), (error) => error.name === 'TimeoutError' && error.status === 408);
  const retry = e.api.fetchJson('/api/private');
  assert.equal(e.wire.calls.length, 2);
  e.wire.calls[1].resolve(response({ ok: true }));
  await retry;
});

test('a delayed body cannot turn caller cancellation into a timeout', async (t) => {
  const e = environment(t, transport({ respectAbort: false }));
  const controller = new AbortController();
  const body = deferred();
  const pending = e.api.fetchJson('/api/private', { timeout: 5, signal: controller.signal });
  const cancelled = assert.rejects(pending, (error) => error.name === 'AbortError' && error.status !== 408);
  e.wire.calls[0].resolve({ ok: true, json: () => body.promise });
  await Promise.resolve();
  controller.abort();
  await new Promise((resolve) => setTimeout(resolve, 15));
  body.resolve({ old: true });
  await cancelled;
});

test('current-session HTTP errors retain their status and do not poison deduplication', async (t) => {
  const e = environment(t);
  const first = e.api.fetchJson('/api/private');
  const failed = assert.rejects(first, (error) => error.status === 500 && error.message === 'Fixture failure');
  e.wire.calls[0].resolve(response({ message: 'Fixture failure' }, 500));
  await failed;
  const retry = e.api.fetchJson('/api/private');
  e.wire.calls[1].resolve(response({ ok: true }));
  await retry;
});

test('panel logout clears every scoped alias while retaining the website session', async (t) => {
  const e = environment(t);
  e.window.location.pathname = '/propertyowner/admin';
  e.local.setItem('website_token', 'synthetic-website');
  for (const key of ['token', 'staff_token', 'managerToken', 'accessToken', 'adminToken']) {
    e.local.setItem(key, 'synthetic-panel'); e.tab.setItem(key, 'synthetic-panel');
  }
  const pending = e.api.fetchJson('/api/private');
  const cancelled = assert.rejects(pending, sessionCancelled);
  e.scope.clearScopedSession();
  await cancelled;
  assert.equal(e.scope.getScopedAuthToken(), null);
  assert.equal(e.local.getItem('website_token'), 'synthetic-website');
});

test('storage events cancel changed identities without waiting for another request', async (t) => {
  const e = environment(t);
  e.local.setItem('website_token', 'synthetic-A');
  const pending = e.services.apiFetch('/api/private');
  const cancelled = assert.rejects(pending, sessionCancelled);
  e.local.setItem('website_token', 'synthetic-B');
  e.window.dispatchEvent(new Event('storage'));
  await cancelled;
});

test('another panel tab cannot override this tab or cancel its requests', async (t) => {
  const e = environment(t);
  e.window.location.pathname = '/staff/tasks';
  e.tab.setItem('token', 'synthetic-this-tab');
  const pending = e.api.fetchJson('/api/private');
  const generation = e.scope.getAuthSession().generation;
  e.local.setItem('token', 'synthetic-other-tab');
  e.window.dispatchEvent(new Event('storage'));
  assert.equal(e.scope.getAuthSession().generation, generation);
  assert.equal(e.wire.calls[0].options.signal.aborted, false);
  e.wire.calls[0].resolve(response({ ok: true }));
  await pending;
});

test('a website-to-panel scope switch separates even identical token strings', async (t) => {
  const e = environment(t);
  e.local.setItem('website_token', 'synthetic-same');
  e.local.setItem('token', 'synthetic-same');
  const a = e.api.fetchJson('/api/auth/me');
  const cancelled = assert.rejects(a, sessionCancelled);
  e.window.location.pathname = '/propertyowner/admin';
  const b = e.api.fetchJson('/api/auth/me');
  assert.notEqual(a, b);
  await cancelled;
  e.wire.calls[1].resolve(response({ scope: 'panel' }));
  assert.equal((await b).scope, 'panel');
});

test('session changes clear TTL and React Query caches', (t) => {
  const e = environment(t);
  e.scope.getAuthSession();
  e.cache.cacheSet('private', { user: 'A' }, 60000);
  e.queryClient.setQueryData(['currentUser'], { user: 'A' });
  e.website.setWebsiteSession({ id: 'B', role: 'tenant' }, 'synthetic-B');
  assert.equal(e.cache.cacheGet('private'), null);
  assert.equal(e.queryClient.getQueryData(['currentUser']), undefined);
});

test('API response caches cannot return a previous generation after login', async (t) => {
  const e = environment(t);
  e.website.setWebsiteSession({ id: 'A', role: 'tenant' }, 'synthetic-A');
  const a = e.api.fetchAreas();
  e.wire.calls[0].resolve(response({ data: ['A'] }));
  assert.equal((await a)[0], 'A');
  assert.equal((await e.api.fetchAreas())[0], 'A');
  assert.equal(e.wire.calls.length, 1);
  e.website.setWebsiteSession({ id: 'B', role: 'tenant' }, 'synthetic-B');
  const b = e.api.fetchAreas();
  assert.equal(e.wire.calls.length, 2);
  e.wire.calls[1].resolve(response({ data: ['B'] }));
  assert.equal((await b)[0], 'B');
});

test('staff metadata refresh preserves requests; a different staff token cancels them', async (t) => {
  const e = environment(t);
  e.window.location.pathname = '/staff/tasks';
  const staff = { loginId: 'AUDIT_STAFF_A', parentLoginId: 'AUDIT_OWNER' };
  e.setStaffSession(staff, 'synthetic-A');
  const pending = e.api.fetchJson('/api/private');
  const cancelled = assert.rejects(pending, sessionCancelled);
  const generation = e.scope.getAuthSession().generation;
  e.setStaffSession({ ...staff, name: 'Updated fixture' }, 'synthetic-A');
  assert.equal(e.scope.getAuthSession().generation, generation);
  assert.equal(e.wire.calls[0].options.signal.aborted, false);
  e.setStaffSession({ loginId: 'AUDIT_STAFF_B' }, 'synthetic-B');
  await cancelled;
});

test('owner and staff logout helpers cancel requests and remove panel credentials', async (t) => {
  for (const helper of ['clearOwnerRuntimeSession', 'clearStaffSession']) {
    const e = environment(t);
    e.window.location.pathname = '/propertyowner/admin';
    e.local.setItem('token', 'synthetic-A');
    e.tab.setItem('staff_token', 'synthetic-alias');
    const pending = e.api.fetchJson('/api/private');
    const cancelled = assert.rejects(pending, sessionCancelled);
    e[helper]();
    await cancelled;
    assert.equal(e.scope.getScopedAuthToken(), null);
  }
});

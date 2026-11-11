// Run: node src/utils/ownerOnboarding.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';

const bundle = buildSync({
  stdin: { contents: "export * from './ownerOnboarding.js';", resolveDir: fileURLToPath(new URL('.', import.meta.url)) },
  bundle: true, write: false, platform: 'browser', format: 'cjs',
  define: { 'import.meta.env': '{}' }, logLevel: 'silent',
}).outputFiles[0].text;
const linkToken = 'L'.repeat(43), proofToken = 'S'.repeat(43);
const secureUrl = `https://admin.example.invalid/digital-checkin/ownerprofile?loginId=ROOMHY0001#onboarding=${linkToken}`;
const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
};
function setup(href = secureUrl, replies = []) {
  const calls = [], historyCalls = [];
  const window = new EventTarget();
  window.location = new URL(href);
  window.history = { state: null, replaceState(state, title, href) { historyCalls.push(href); window.location = new URL(href, window.location); } };
  const tab = storage();
  const context = vm.createContext({
    module: { exports: {} }, window, sessionStorage: tab, localStorage: storage(),
    URL, URLSearchParams, Headers, AbortController, DOMException, setTimeout, clearTimeout,
    fetch: async (url, options) => {
      calls.push({ url, options });
      const reply = replies.shift();
      if (reply instanceof Error) throw reply;
      assert.ok(reply, 'Unexpected network call');
      return { ok: !reply.status || reply.status < 400, status: reply.status || 200, json: async () => reply.body };
    },
  });
  vm.runInContext(bundle, context);
  return { ...context.module.exports, window, tab, calls, historyCalls, context };
}
const exchangeReply = () => ({ body: { success: true, access: { token: proofToken, expiresAt: Date.now() + 60000 } } });
const profileReply = () => ({ body: { success: true, owner: { loginId: 'ROOMHY0001', name: 'Synthetic owner' } } });

test('one-time token is captured from the fragment and removed before any network call', () => {
  const e = setup();
  const link = e.captureOwnerOnboardingLink();
  assert.equal(link.token, linkToken);
  assert.equal(link.loginId, 'ROOMHY0001');
  assert.equal(e.window.location.hash, '');
  assert.equal(e.window.location.search, '?loginId=ROOMHY0001');
  assert.equal(e.calls.length, 0);
  assert.equal(e.captureOwnerOnboardingLink(), link, 'React re-render must not lose the captured link');
});

test('legacy password aliases are scrubbed from query and hash without being redeemed', async () => {
  const e = setup('https://admin.example.invalid/digital-checkin/ownerprofile?loginId=ROOMHY0001&PaSsWoRd=SYNTHETIC_SECRET&email=fixture%40example.invalid#/owner?tempPassword=OTHER_SECRET&pass=THIRD_SECRET');
  const link = e.captureOwnerOnboardingLink();
  assert.equal(link.legacyLink, true);
  assert.ok(!/SECRET|password|pass=/i.test(e.window.location.href));
  await assert.rejects(e.loadOwnerOnboardingProfile('ROOMHY0001', link), /new onboarding link/);
  assert.equal(e.calls.length, 0);
});

test('link capture leaves unrelated routes untouched', () => {
  const href = 'https://example.invalid/website/reset?token=fixture#other';
  const e = setup(href);
  assert.equal(e.captureOwnerOnboardingLink(), null);
  assert.equal(e.window.location.href, href);
  assert.equal(e.historyCalls.length, 0);
});

test('missing, malformed, password-bearing, and script URLs cannot become a copyable link', () => {
  const e = setup();
  for (const value of [undefined, '', '/digital-checkin/ownerprofile?loginId=ROOMHY0001&password=secret', secureUrl.replace('loginId=', 'password=secret&loginId='), secureUrl.replace(linkToken, 'invalid'), 'javascript:alert(1)', secureUrl.replace('/ownerprofile', '/unrelated')]) {
    assert.equal(e.safeOwnerOnboardingLink(value), '', String(value));
  }
});

test('server-issued links retain only owner ID and the dedicated fragment token', () => {
  const e = setup();
  const safe = e.safeOwnerOnboardingLink(secureUrl.replace('#', '&email=fixture%40example.invalid&area=Test#'));
  assert.equal(safe, secureUrl);
  assert.ok(!safe.includes('email='));
});

test('exchange uses POST body; profile GET uses only the scoped header, with no password or token in API URLs', async () => {
  const e = setup(secureUrl, [exchangeReply(), profileReply()]);
  e.context.localStorage.setItem('token', 'SYNTHETIC_PANEL_CREDENTIAL');
  const result = await e.loadOwnerOnboardingProfile('ROOMHY0001', e.captureOwnerOnboardingLink());
  assert.equal(result.owner.name, 'Synthetic owner');
  assert.equal(e.calls.length, 2);
  assert.equal(e.calls[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(e.calls[0].options.body), { loginId: 'ROOMHY0001', token: linkToken });
  const get = e.calls[1];
  assert.equal(get.options.method, 'GET');
  assert.equal(new Headers(get.options.headers).get('X-Owner-Onboarding'), proofToken);
  assert.equal(new Headers(get.options.headers).get('Authorization'), null);
  for (const call of e.calls) {
    assert.ok(!call.url.includes(linkToken) && !call.url.includes(proofToken));
    assert.ok(!call.url.includes('password='));
    assert.equal(call.options.referrerPolicy, 'no-referrer');
    assert.equal(call.options.credentials, 'omit');
    assert.equal(call.options.cache, 'no-store');
  }
});

test('profile saving preserves data and strips login-credential fields from the body', async () => {
  const e = setup(secureUrl, [exchangeReply(), profileReply(), { body: { success: true } }]);
  await e.loadOwnerOnboardingProfile('ROOMHY0001', e.captureOwnerOnboardingLink());
  const details = { name: 'Fixture', occupiedRooms: 2, password: 'SECRET', tempPassword: 'SECRET', pass: 'SECRET', checkinPassword: 'SECRET', credentials: { password: 'SECRET' } };
  await e.saveOwnerOnboardingProfile('roomhy0001', details);
  const saved = e.calls[2];
  assert.deepEqual(JSON.parse(saved.options.body), { name: 'Fixture', occupiedRooms: 2, loginId: 'ROOMHY0001' });
  assert.equal(new Headers(saved.options.headers).get('X-Owner-Onboarding'), proofToken);
  assert.equal(details.password, 'SECRET', 'Input must not be mutated');
});

test('a refresh can resume the short-lived tab session without replaying the one-time token', async () => {
  const e = setup('https://admin.example.invalid/digital-checkin/ownerprofile?loginId=ROOMHY0001', [profileReply()]);
  e.tab.setItem('roomhy_owner_onboarding_ROOMHY0001', JSON.stringify({ token: proofToken, expiresAt: Date.now() + 60000 }));
  await e.loadOwnerOnboardingProfile('ROOMHY0001', e.captureOwnerOnboardingLink());
  assert.equal(e.calls.length, 1);
  assert.equal(e.calls[0].options.method, 'GET');
});

test('expired and malformed saved sessions never make a profile request', async () => {
  for (const access of [{ token: proofToken, expiresAt: Date.now() - 1 }, { token: 'bad', expiresAt: Date.now() + 60000 }]) {
    const e = setup('https://admin.example.invalid/digital-checkin/ownerprofile?loginId=ROOMHY0001');
    e.tab.setItem('roomhy_owner_onboarding_ROOMHY0001', JSON.stringify(access));
    await assert.rejects(e.loadOwnerOnboardingProfile('ROOMHY0001', e.captureOwnerOnboardingLink()), /new onboarding link/);
    assert.equal(e.calls.length, 0);
    assert.equal(e.tab.getItem('roomhy_owner_onboarding_ROOMHY0001'), null);
  }
});

test('a captured link for A is not submitted to exchange or save a profile for B', async () => {
  const e = setup();
  await assert.rejects(e.loadOwnerOnboardingProfile('ROOMHY0002', e.captureOwnerOnboardingLink()), /new onboarding link/);
  await assert.rejects(e.saveOwnerOnboardingProfile('ROOMHY0002', { name: 'Other' }), /new onboarding link/);
  assert.equal(e.calls.length, 0);
});

test('concurrent consumers exchange a one-time link only once', async () => {
  const e = setup(secureUrl, [exchangeReply(), profileReply(), profileReply()]);
  const link = e.captureOwnerOnboardingLink();
  const [a, b] = await Promise.all([e.loadOwnerOnboardingProfile('ROOMHY0001', link), e.loadOwnerOnboardingProfile('ROOMHY0001', link)]);
  assert.equal(a.owner.loginId, b.owner.loginId);
  assert.equal(e.calls.filter(call => call.url.endsWith('/exchange')).length, 1);
  assert.equal(link.token, '');
});

test('ambiguous exchange failure is not retried across fallback hosts', async () => {
  const e = setup(secureUrl, [new Error('Synthetic network failure')]);
  const link = e.captureOwnerOnboardingLink();
  await assert.rejects(e.loadOwnerOnboardingProfile('ROOMHY0001', link), /Synthetic network failure/);
  await assert.rejects(e.loadOwnerOnboardingProfile('ROOMHY0001', link), /Synthetic network failure/);
  assert.equal(e.calls.length, 1);
  assert.equal(link.token, '');
});

test('server denial clears the session and never retries the public-owner fallback', async () => {
  const e = setup(secureUrl, [exchangeReply(), { status: 403, body: { success: false, message: 'Expired check-in session' } }]);
  await assert.rejects(e.loadOwnerOnboardingProfile('ROOMHY0001', e.captureOwnerOnboardingLink()), /Expired check-in session/);
  assert.equal(e.calls.length, 2);
  assert.ok(e.calls.every(call => !call.url.includes('/owners/public/')));
  await assert.rejects(e.saveOwnerOnboardingProfile('ROOMHY0001', {}), /new onboarding link/);
});

test('inaccessible sessionStorage still supports the current tab through an in-memory session', async () => {
  const e = setup(secureUrl, [exchangeReply(), profileReply(), { body: { success: true } }]);
  e.context.sessionStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  await e.loadOwnerOnboardingProfile('ROOMHY0001', e.captureOwnerOnboardingLink());
  await e.saveOwnerOnboardingProfile('ROOMHY0001', { name: 'Fixture' });
  assert.equal(e.calls.length, 3);
});

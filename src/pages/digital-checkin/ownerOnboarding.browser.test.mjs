// Run: node src/pages/digital-checkin/ownerOnboarding.browser.test.mjs
// Uses installed Chrome, a loopback fixture, and synthetic API responses only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const fixture = `
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useOwnerProfile } from './src/pages/digital-checkin/useOwnerProfile.js';
import { captureOwnerOnboardingLink } from './src/utils/ownerOnboarding.js';
const phase = sessionStorage.getItem('sec03_phase') || 'initial';
const legacy = location.search.includes('password=');
const calls = [];
const failures = [];
const check = (condition, name) => { if (!condition) failures.push(name); };
const owner = { loginId: 'SEC03_BROWSER', name: 'Synthetic Owner', email: 'owner@example.invalid', locationCode: 'TEST',
  checkinDob: '2000-01-01', phone: '0000000000', address: 'Synthetic address',
  checkinBankAccountNumber: '0000000000', checkinIfscCode: 'TEST0000000', checkinAccountHolderName: 'Fixture' };
localStorage.setItem('token', 'SYNTHETIC_PANEL_SESSION');
window.alert = () => { failures.push('unexpected error alert'); };
window.fetch = async (input, options = {}) => {
  const url = new URL(input, location.origin);
  calls.push({ url: url.href, options });
  const reply = body => ({ ok: true, status: 200, json: async () => body });
  if (url.pathname === '/api/checkin/owner/onboarding/exchange') {
    check(phase === 'initial', 'refresh must not replay one-time link');
    check(options.method === 'POST', 'exchange method');
    const payload = JSON.parse(options.body);
    check(payload.loginId === owner.loginId && payload.token === 'L'.repeat(43), 'exchange body');
    return reply({ success: true, access: { token: 'S'.repeat(43), expiresAt: Date.now() + 60000 } });
  }
  check(options.headers?.['X-Owner-Onboarding'] === 'S'.repeat(43), 'profile header');
  if (url.pathname.endsWith('/' + owner.loginId)) return reply({ success: true, owner });
  if (url.pathname === '/api/checkin/owner/profile' && options.method === 'POST') {
    const payload = JSON.parse(options.body);
    check(payload.name === 'Edited fixture', 'edited profile reaches API');
    check(!('password' in payload) && !('credentials' in payload) && !('checkinPassword' in payload), 'save credential isolation');
    return reply({ success: true });
  }
  throw new Error('Unexpected API route');
};
captureOwnerOnboardingLink();
function Probe() { window.probe = useOwnerProfile(); return null; }
createRoot(document.getElementById('root')).render(React.createElement(StrictMode, null, React.createElement(Probe)));
const wait = async predicate => { for (let i = 0; i < 150; i++) { if (predicate()) return; await new Promise(r => setTimeout(r, 10)); } throw new Error('Timed out waiting for form'); };
const finish = () => {
  document.getElementById('result').textContent = JSON.stringify({ pass: failures.length === 0, failures, phase, legacy,
    requests: calls.length, exchangeCount: calls.filter(c => c.url.endsWith('/exchange')).length });
};
(async () => {
  try {
    await wait(() => window.probe && !window.probe.profileAccess.loading && window.probe.form.loginId);
    check(!/password=|onboarding=|LLLL|SSSS/.test(location.href), 'address-bar scrub');
    if (legacy) {
      check(Boolean(window.probe.profileAccess.error), 'legacy link must show error');
      check(calls.length === 0, 'legacy password must not be sent');
      finish(); return;
    }
    check(!window.probe.profileAccess.error, 'successful prefill');
    check(window.probe.form.name === owner.name && window.probe.form.bankAccountNumber === owner.checkinBankAccountNumber, 'prefill contents');
    if (phase === 'initial') {
      window.probe.updateForm({ name: 'Edited fixture' });
      await wait(() => window.probe.form.name === 'Edited fixture');
      await window.probe.handleSubmit({ preventDefault() {} });
      await wait(() => window.probe.kycStatus.type === 'success' || failures.length > 0);
      check(calls.filter(c => c.url.endsWith('/exchange')).length === 1, 'one exchange');
      check(window.probe.kycStatus.type === 'success', 'save success state');
    } else check(calls.every(c => !c.url.endsWith('/exchange')), 'refresh resumes stored proof');
    for (const { url, options } of calls) {
      check(!/password|LLLL|SSSS/.test(url), 'API URL contains no secret');
      check(!options.headers?.Authorization, 'panel session not inherited');
      check(options.credentials === 'omit' && options.referrerPolicy === 'no-referrer' && options.cache === 'no-store', 'request privacy');
    }
    if (phase === 'initial' && failures.length === 0) {
      sessionStorage.setItem('sec03_phase', 'refresh');
      location.reload(); return;
    }
  } catch (error) { failures.push(error.message); }
  finish();
})();
`;

async function chrome(url, profile) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.CHROME_BIN || '/usr/bin/google-chrome', [
      '--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-background-networking',
      '--disable-component-update', '--disable-default-apps', '--no-first-run', '--no-default-browser-check',
      '--host-resolver-rules=MAP * 0.0.0.0', `--user-data-dir=${profile}`, '--dump-dom', '--virtual-time-budget=5000', url,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '', error = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { error += chunk; });
    const timeout = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('Chrome exceeded 30 seconds')); }, 30000);
    child.on('error', reject);
    child.on('exit', code => {
      clearTimeout(timeout);
      if (code !== 0) return reject(new Error(`Chrome exited ${code}: ${error.slice(-300)}`));
      const match = output.match(/<pre id="result">([^<]+)<\/pre>/);
      if (!match) return reject(new Error('Browser did not produce verification results'));
      resolve(JSON.parse(match[1].replaceAll('&quot;', '"').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>')));
    });
  });
}

test('actual React owner form prefills, saves, and refreshes without password URLs or panel auth', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'roomhy-sec03-browser-'));
  let server;
  try {
    const bundled = await build({ stdin: { contents: fixture, resolveDir: root, loader: 'jsx' }, bundle: true, write: false,
      platform: 'browser', format: 'iife', define: { 'import.meta.env': '{}' }, logLevel: 'silent' });
    const html = '<!doctype html><div id="root"></div><pre id="result"></pre><script>' + bundled.outputFiles[0].text.replaceAll('</script', '<\\/script') + '</script>';
    server = createServer((req, res) => { res.setHeader('Content-Type', 'text/html'); res.end(html); });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}/digital-checkin/ownerprofile?loginId=SEC03_BROWSER`;
    const normal = await chrome(`${base}#onboarding=${'L'.repeat(43)}`, join(temporary, 'normal'));
    assert.deepEqual(normal.failures, []);
    assert.equal(normal.pass, true);
    assert.equal(normal.phase, 'refresh', 'must complete initial save and subsequent refresh');
    assert.equal(normal.exchangeCount, 0);
    assert.ok(normal.requests >= 1);
    const legacy = await chrome(`${base}&password=SYNTHETIC_OLD_PASSWORD`, join(temporary, 'legacy'));
    assert.equal(legacy.legacy, true);
    assert.deepEqual(legacy.failures, []);
    assert.equal(legacy.requests, 0);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await rm(temporary, { recursive: true, force: true });
  }
});

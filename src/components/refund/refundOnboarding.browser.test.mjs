// node --test src/components/refund/refundOnboarding.browser.test.mjs
// Actual refund pages/modal, synthetic API replies, disposable Chrome profiles.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import tailwindConfig from '../../../tailwind.config.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Booking from './src/pages/superadmin/refund_booking.jsx';
import Approvals from './src/pages/superadmin/refund_approvals.jsx';
import History from './src/pages/superadmin/refund_history.jsx';
const query = new URLSearchParams(location.search);
const page = query.get('page'), state = query.get('state');
const layout = query.has('layout');
const failures = [], calls = [];
const check = (condition, label) => { if (!condition) failures.push(label); };
const text = () => document.getElementById('root').textContent;
const verified = ['not_onboarded', 'onboarded'].includes(state);
const onboarded = state === 'onboarded';
const row = { _id: 'SYNTHETIC_REFUND', booking_id: 'SYNTHETIC_BOOKING', user_name: 'Synthetic tenant',
  property_name: 'Synthetic hostel', owner_id: 'SYNTHETIC_OWNER', refund_status: 'pending', request_type: 'refund',
  is_tenant_onboarded: onboarded, onboarding_check_status: verified ? 'verified' : 'unavailable' };
if (layout) Object.assign(row, { booking_id: '6ae2d7acc92162010feba254', user_name: 'Roomhy Management',
  property_name: 'RoomhyProp Crest - Rajnesh Hostel', owner_name: 'Synthetic Owner', user_phone: '9000000001',
  owner_id: 'ROOMHY3259', request_type: 'alternative_property', refund_amount: 500,
  payment_completed_at: '2026-10-29T05:23:00Z' });
const onboardingCheck = { verificationStatus: row.onboarding_check_status, isOnboarded: onboarded,
  records: onboarded ? [{ loginId: 'SYNTHETIC_TENANT', propertyTitle: 'Synthetic hostel', roomNo: '101', status: 'active' }] : [] };
if (state === 'missing_verification') delete row.onboarding_check_status;
localStorage.setItem('token', 'SYNTHETIC_PANEL_TOKEN');
window.fetch = async (url, options = {}) => {
  const path = new URL(url, location.origin).pathname;
  calls.push({ path, method: options.method || 'GET' });
  check(!options.method || options.method === 'GET', 'verification must not mutate records');
  let data;
  if (path.endsWith('/refund-requests')) data = [row];
  else if (path.endsWith('/dossier')) {
    if (state === 'network') throw new Error('Synthetic verification unavailable');
    data = { refundRequest: row, tenantInfo: {}, paymentHistory: {},
      ...(state === 'missing_verification' ? {} : { onboardingCheck }) };
  } else { failures.push('Unexpected endpoint: ' + path); data = {}; }
  return new Response(JSON.stringify({ success: true, data }), { headers: { 'Content-Type': 'application/json' } });
};
const Page = { booking: Booking, approvals: Approvals, history: History }[page];
createRoot(document.getElementById('root')).render(React.createElement(BrowserRouter, null, React.createElement(Page)));
const wait = async condition => { for (let i = 0; i < 200; i++) { if (condition()) return; await new Promise(r => setTimeout(r, 10)); } throw new Error('Browser state timeout'); };
(async () => {
  try {
    await wait(() => document.querySelector('tbody tr'));
    const tr = document.querySelector('tbody tr');
    if (layout) {
      const table = tr.closest('table'), scroller = table.parentElement;
      const headings = [...table.querySelectorAll('th')];
      for (const th of headings.slice(0, -1)) {
        const range = document.createRange(); range.selectNodeContents(th);
        check(th.getBoundingClientRect().right - range.getBoundingClientRect().right >= 12, 'header has a visible column gap: ' + th.textContent);
      }
      const cells = [...tr.cells];
      const onboardingCell = cells[page === 'approvals' ? 3 : 4];
      const badge = onboardingCell.querySelector('span');
      check(getComputedStyle(badge).whiteSpace === 'nowrap', 'onboarding badge stays on one line');
      for (const button of cells.at(-1).querySelectorAll('button')) {
        check(getComputedStyle(button).whiteSpace === 'nowrap', 'action labels stay readable on one line');
        check(button.getBoundingClientRect().height <= 40, 'action button has a compact height');
      }
      check(getComputedStyle(scroller).overflowX === 'auto', 'table has its own horizontal scroller');
      check(scroller.getBoundingClientRect().right <= innerWidth + 1, 'table stays within the viewport');
      check(document.documentElement.scrollWidth <= innerWidth + 1, 'table does not widen the page');
      if (innerWidth < 1200) {
        check(scroller.scrollWidth > scroller.clientWidth, 'narrow layout scrolls within the table');
        scroller.scrollLeft = scroller.scrollWidth;
        check(cells.at(-1).getBoundingClientRect().right <= scroller.getBoundingClientRect().right + 1, 'last column remains reachable');
      }
    }
    if (layout) {
      document.getElementById('result').textContent = JSON.stringify({ page, state, viewport: innerWidth, failures });
      return;
    }
    const expectedBadge = onboarded ? 'Already Onboarded' : verified ? 'Not Onboarded' : 'Unable to Verify';
    check(tr.textContent.includes(expectedBadge), 'table: ' + expectedBadge);
    if (!verified) check(!tr.textContent.includes('Not Onboarded') && !tr.textContent.includes('Already Onboarded'), 'unknown table must not claim an onboarding result');
    tr.querySelector('button').click();
    if (state === 'network') {
      await wait(() => text().includes('Synthetic verification unavailable'));
      check(!text().includes('No completed onboarding found'), 'network failure must not claim verification passed');
    } else if (!verified) {
      await wait(() => text().includes('Unable to Verify Onboarding'));
      check(!text().includes('No completed onboarding found') && !text().includes('TENANT IS ALREADY ONBOARDED'), 'unknown modal must not claim an onboarding result');
    } else if (onboarded) {
      await wait(() => text().includes('TENANT IS ALREADY ONBOARDED AT THIS PROPERTY'));
      check(text().includes('SYNTHETIC_TENANT') && text().includes('Room 101'), 'modal shows the actual assigned tenant');
      check(!text().includes('FRAUD ALERT'), 'onboarding alone must not accuse the tenant of fraud');
    } else {
      await wait(() => text().includes('No completed onboarding found for this property and owner'));
      check(!text().includes('TENANT IS ALREADY ONBOARDED'), 'unassigned tenant has no onboarding warning');
      check(!text().includes('NOT onboarded in any property'), 'verification is scoped to the booked property');
    }
    check(calls.length === 2, 'one list request and one dossier request');
  } catch (error) { failures.push(error.message); }
  document.getElementById('result').textContent = JSON.stringify({ page, state, viewport: innerWidth, failures });
})();
`;

let temporary, server, base;
test.before(async () => {
  temporary = await mkdtemp(join(tmpdir(), 'roomhy-refund-browser-'));
  const output = await build({ stdin: { contents: fixture, resolveDir: root, loader: 'jsx' }, bundle: true, write: false,
    outfile: 'refund-browser.js', platform: 'browser', format: 'iife', define: { 'import.meta.env': '{}' }, logLevel: 'silent' });
  const css = await postcss([tailwindcss({ ...tailwindConfig, content: [
    join(root, 'src/pages/superadmin/refund_*.jsx'), join(root, 'src/components/refund/*.jsx')
  ] })]).process(await readFile(join(root, 'src/index.css'), 'utf8'), { from: join(root, 'src/index.css') });
  const pageCss = output.outputFiles.find(file => file.path.endsWith('.css'))?.text || '';
  const js = output.outputFiles.find(file => file.path.endsWith('.js')).text;
  const html = '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + css.css + pageCss +
    'body{margin:0;padding:16px}#root{max-width:1280px;margin:auto}#result{display:none}</style><div id="root"></div><pre id="result"></pre><script>' + js.replaceAll('</script', '<\\/script') + '</script>';
  server = createServer((req, res) => { res.setHeader('Content-Type', 'text/html'); res.end(html); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (temporary) await rm(temporary, { recursive: true, force: true });
});
async function browser(page, state, panel = 'superadmin', width = 1440, layout = false) {
  return new Promise((resolve, reject) => {
    // Device emulation avoids Chrome's 500px minimum desktop-window width.
    const child = spawn(process.env.CHROME_BIN || '/usr/bin/google-chrome', ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
      '--disable-background-networking', '--disable-component-update', '--disable-default-apps', '--no-first-run', '--no-default-browser-check',
      '--host-resolver-rules=MAP * 0.0.0.0', '--remote-debugging-port=0', `--user-data-dir=${join(temporary, page + state + panel + width)}`,
      'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
    let errors = '', socket, started = false, settled = false, sequence = 0;
    const pending = new Map();
    const finish = (error, result) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      socket?.close(); child.kill('SIGTERM');
      if (error) reject(error); else resolve(result);
    };
    const timer = setTimeout(() => { child.kill('SIGKILL'); finish(new Error('Browser timeout')); }, 30000);
    const command = (method, params = {}, sessionId) => new Promise((done, fail) => {
      const id = ++sequence; pending.set(id, { done, fail });
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
    child.on('error', error => finish(error));
    child.on('exit', code => { if (!settled) finish(new Error('Chrome exited: ' + code + ' ' + errors.slice(-200))); });
    child.stderr.on('data', chunk => {
      errors += chunk;
      const endpoint = errors.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (started || !endpoint) return;
      started = true; socket = new WebSocket(endpoint[1]);
      socket.addEventListener('error', () => finish(new Error('Chrome debugger connection failed')));
      socket.addEventListener('message', event => {
        const message = JSON.parse(event.data), callback = pending.get(message.id);
        if (!callback) return;
        pending.delete(message.id);
        if (message.error) callback.fail(new Error(message.error.message)); else callback.done(message.result);
      });
      socket.addEventListener('open', async () => {
        try {
          const { targetId } = await command('Target.createTarget', { url: 'about:blank' });
          const { sessionId } = await command('Target.attachToTarget', { targetId, flatten: true });
          await command('Emulation.setDeviceMetricsOverride', { width, height: 1080, deviceScaleFactor: 1, mobile: width < 640 }, sessionId);
          await command('Page.navigate', { url: base + '/' + panel + '/refund/' + page + '?page=' + page + '&state=' + state + (layout ? '&layout=1' : '') }, sessionId);
          for (let attempt = 0; attempt < 200; attempt++) {
            const value = await command('Runtime.evaluate', { expression: "document.getElementById('result')?.textContent", returnByValue: true }, sessionId);
            if (value.result?.value) {
              const result = JSON.parse(value.result.value);
              if (process.env.REFUND_LAYOUT_SCREENSHOT && layout && page === 'booking' && width === 1440) {
                const shot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId);
                await writeFile(process.env.REFUND_LAYOUT_SCREENSHOT, Buffer.from(shot.data, 'base64'));
              }
              finish(null, result); return;
            }
            await new Promise(done => setTimeout(done, 25));
          }
          throw new Error('No browser result');
        } catch (error) { finish(error); }
      });
    });
  });
}
for (const page of ['booking', 'approvals', 'history']) {
  for (const state of ['not_onboarded', 'onboarded', 'unavailable', 'missing_verification']) {
    test(`${page} table and modal: ${state}`, async () => {
      const result = await browser(page, state); assert.deepEqual(result.failures, []);
    });
  }
}
test('employee booking page uses the same scoped verification', async () => {
  assert.deepEqual((await browser('booking', 'not_onboarded', 'employee')).failures, []);
});
test('modal request failure cannot appear as a successful onboarding verification', async () => {
  assert.deepEqual((await browser('booking', 'network')).failures, []);
});
for (const page of ['booking', 'approvals', 'history']) {
  for (const width of [1440, 900, 390]) {
    test(`${page} styled layout at ${width}px`, async () => {
      const result = await browser(page, 'not_onboarded', 'superadmin', width, true);
      assert.equal(result.viewport, width, 'browser used the requested viewport');
      assert.deepEqual(result.failures, []);
    });
  }
}

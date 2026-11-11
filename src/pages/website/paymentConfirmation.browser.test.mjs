// Run: node src/pages/website/paymentConfirmation.browser.test.mjs
// Actual payment pages/helpers, synthetic transport, isolated Chrome profiles.
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
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Success from './src/pages/website/PaymentSuccessPage.jsx';
import Checkout from './src/pages/website/PaymentCheckout.jsx';
import { invalidateAuthSession } from './src/utils/authScope.js';
const scenario = new URLSearchParams(location.search).get('case');
const failures = [], calls = [];
let prints = 0;
const check = (value, label) => { if (!value) failures.push(label); };
const text = () => document.getElementById('root').textContent;
const printButton = () => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Print Receipt'));
const checkButton = () => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Check again'));
const noReceipt = label => {
  check(!text().includes('Payment Successful!') && !text().includes('STATUS: PAID (ONLINE)'), label + ': no paid claim');
  check(!printButton(), label + ': no print action');
  if (scenario !== 'checkout_no_order') check(!text().includes('AUDIT_UNPAID') && !text().includes('123456'), label + ': ignore URL metadata');
};
const receipt = order => ({ success: true, state: 'paid', verified: true, receipt: {
  receiptId: 'RMH_SERVER_RECEIPT', orderId: order, paymentId: 'PAYU_SERVER_PAYMENT', bookingId: 'BOOKING_FROM_SERVER', amount: 750,
  currency: 'INR', paidAt: '2026-01-01T10:00:00.000Z', propertyName: '<img src=x onerror=alert(1)> Synthetic stay', ownerName: 'Synthetic owner', paymentMethod: 'PayU', status: 'PAID'
} });
localStorage.setItem('website_token', 'SYNTHETIC_WEBSITE_A');
localStorage.setItem('token', 'SYNTHETIC_PANEL');
window.print = () => { prints++; check(text().includes('BOOKING_FROM_SERVER') && text().includes('750'), 'printed server data'); };
window.fetch = async (url, options = {}) => {
  calls.push({ url, options });
  const path = new URL(url, location.origin).pathname;
  if (path === '/api/booking/config/booking-amount') return new Response(JSON.stringify({ bookingAmount: 500 }));
  if (scenario === 'checkout_no_order' && path === '/api/booking/requests/AUDIT_UNPAID') return new Response(JSON.stringify({ booking_id: 'AUDIT_UNPAID', property_name: 'Checkout stay', amount: 500 }));
  check(path.includes('/confirmation/'), 'only confirmation endpoint');
  check(options.headers.get('authorization') === 'Bearer SYNTHETIC_WEBSITE_A', 'scoped website auth');
  check(options.cache === 'no-store' && options.referrerPolicy === 'no-referrer', 'uncached private request');
  const order = decodeURIComponent(path.split('/').pop());
  if (scenario === 'network') throw new Error('Synthetic network error');
  if (scenario === 'stale' && order === 'ORDER_A') return new Promise(resolve => { window.releaseOld = () => resolve(new Response(JSON.stringify(receipt(order)))); });
  if (scenario === 'slow') await new Promise(r => setTimeout(r, 150));
  let response;
  if (scenario === 'pending') response = { success: true, state: 'pending' };
  else if (['failed', 'checkout', 'stale'].includes(scenario) || (scenario === 'refund' && calls.length > 1)) response = { success: true, state: 'failed' };
  else if (scenario === 'raw') response = { success: true, status: 'PAID', transaction: { status: 'PAID' } };
  else if (scenario === 'wrongorder') response = receipt('OTHER_ORDER');
  else if (scenario === 'retry' && calls.length === 1) response = { success: true, state: 'pending' };
  else response = receipt(order);
  return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } });
};
function Nav() { window.go = useNavigate(); return null; }
createRoot(document.getElementById('root')).render(React.createElement(BrowserRouter, null,
  React.createElement(Nav), React.createElement(Routes, null,
    React.createElement(Route, { path: '/website/pay', element: React.createElement(Checkout) }),
    React.createElement(Route, { path: '*', element: React.createElement(Success) }))));
const wait = async condition => { for (let i = 0; i < 200; i++) { if (condition()) return; await new Promise(r => setTimeout(r, 10)); } throw new Error('Browser state timeout'); };
(async () => {
 try {
  if (scenario === 'slow') { await wait(() => calls.length > 0); noReceipt('loading'); }
  if (scenario === 'stale') {
    await wait(() => window.releaseOld);
    noReceipt('pending request');
    window.go('/website/payment-success?order_id=ORDER_B&case=stale');
    await wait(() => text().includes('Payment not completed'));
    window.releaseOld(); await new Promise(r => setTimeout(r, 30)); noReceipt('late old order');
  } else if (scenario === 'checkout_no_order') {
    await wait(() => text().includes('Secure Checkout')); noReceipt('URL status without order');
    check(calls.every(c => !c.url.includes('/confirmation/')), 'URL status without order must not open confirmation');
  } else if (['missing','network','raw','wrongorder'].includes(scenario)) {
    await wait(() => text().includes('Payment confirmation unavailable')); noReceipt(scenario);
    if (scenario === 'missing') check(calls.length === 0, 'missing order: zero API calls');
  } else if (['failed','checkout'].includes(scenario)) {
    await wait(() => text().includes('Payment not completed')); noReceipt(scenario);
  } else if (scenario === 'pending') {
    await wait(() => text().includes('Payment pending')); noReceipt('pending');
  } else {
    if (scenario === 'retry') {
      await wait(() => text().includes('Payment pending')); noReceipt('before retry'); checkButton().click();
    }
    await wait(() => Boolean(printButton()));
    check(text().includes('Payment Successful!') && text().includes('STATUS: PAID (ONLINE)'), 'verified success visible');
    check(text().includes('BOOKING_FROM_SERVER') && text().includes('750') && text().includes('PAYU_SERVER_PAYMENT'), 'server receipt fields');
    check(!text().includes('AUDIT_UNPAID') && !text().includes('123456'), 'paid receipt ignores URL fields');
    check(document.querySelectorAll('img').length === 0, 'receipt text escaped');
    if (scenario === 'switch') {
      localStorage.setItem('website_token', 'SYNTHETIC_WEBSITE_B'); invalidateAuthSession();
      await wait(() => text().includes('Payment confirmation unavailable')); noReceipt('account change'); check(prints === 0, 'account change: no print');
    } else {
      printButton().click();
      if (scenario === 'refund') {
        await wait(() => text().includes('Payment not completed')); noReceipt('refund'); check(prints === 0, 'refund cannot print');
      } else {
        await wait(() => prints === 1); check(calls.length >= 2, 'printing re-verifies server');
      }
    }
  }
 } catch (error) { failures.push(error.message); }
 document.getElementById('result').textContent = JSON.stringify({ scenario, failures, prints, calls: calls.length });
})();
`;
let temporary, server, base;
test.before(async () => {
  temporary = await mkdtemp(join(tmpdir(), 'roomhy-sec04-browser-'));
  const output = await build({ stdin: { contents: fixture, resolveDir: root, loader: 'jsx' }, bundle: true, write: false,
    platform: 'browser', format: 'iife', define: { 'import.meta.env': '{}' }, logLevel: 'silent', plugins: [{ name: 'unrelated-shell', setup(b) {
      b.onResolve({ filter: /components\/website\/(WebsiteNavbar|WebsiteFooter|MobileBottomNav)$/ }, args => ({ path: args.path, namespace: 'stub-shell' }));
      b.onLoad({ filter: /.*/, namespace: 'stub-shell' }, () => ({ contents: 'export default function Shell(){return null;}', loader: 'js' }));
    } }] });
  const html = '<!doctype html><div id="root"></div><pre id="result"></pre><script>' + output.outputFiles[0].text.replaceAll('</script', '<\\/script') + '</script>';
  server = createServer((req, res) => { res.setHeader('Content-Type', 'text/html'); res.end(html); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (temporary) await rm(temporary, { recursive: true, force: true });
});
async function browser(scenario, path) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.CHROME_BIN || '/usr/bin/google-chrome', ['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
      '--disable-background-networking','--disable-component-update','--disable-default-apps','--no-first-run','--no-default-browser-check',
      '--host-resolver-rules=MAP * 0.0.0.0',`--user-data-dir=${join(temporary, scenario)}`,'--dump-dom','--virtual-time-budget=5000', base + path], { stdio: ['ignore','pipe','pipe'] });
    let output = '', errors = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('Browser timeout')); }, 30000);
    child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { errors += chunk; });
    child.on('error', reject); child.on('exit', code => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error('Chrome failed: '+errors.slice(-200)));
      const result = output.match(/<pre id="result">([^<]+)<\/pre>/);
      if (!result) return reject(new Error('No browser result'));
      resolve(JSON.parse(result[1].replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>')));
    });
  });
}
for (const scenario of ['missing','failed','network','pending','paid','refund','raw','wrongorder','retry','slow','switch','stale','checkout','checkout_no_order']) {
  test(`payment page browser: ${scenario}`, async () => {
    const checkout = scenario.startsWith('checkout');
    const order = ['missing','checkout_no_order'].includes(scenario) ? '' : '&order_id=ORDER_A';
    const path = `${checkout ? '/website/pay' : '/website/payment-success'}?case=${scenario}${order}&amount=123456&bookingId=AUDIT_UNPAID&status=SUCCESS&txStatus=PAID&order_status=PAID&link_status=PAID_SUCCESSFULLY`;
    const result = await browser(scenario, path);
    assert.equal(result.scenario, scenario); assert.deepEqual(result.failures, []);
    if (scenario === 'refund') assert.equal(result.prints, 0);
  });
}

// Run: node src/utils/paymentConfirmation.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { buildSync } from 'esbuild';
import { fileURLToPath } from 'node:url';

const bundle = buildSync({ stdin: { contents: "export * from './paymentConfirmation.js';", resolveDir: fileURLToPath(new URL('.', import.meta.url)) },
  bundle: true, write: false, platform: 'browser', format: 'cjs', define: { 'import.meta.env': '{}' }, logLevel: 'silent' }).outputFiles[0].text;
const receipt = () => ({ receiptId: 'RMH_SERVER', orderId: 'ORDER_A', paymentId: 'PAYU_SERVER', bookingId: 'BOOKING_SERVER', amount: 500,
  currency: 'INR', paidAt: '2026-01-01T10:00:00.000Z', propertyName: 'Server property', ownerName: 'Server owner', paymentMethod: 'PayU', status: 'PAID' });
const paid = () => ({ success: true, state: 'paid', verified: true, receipt: receipt() });
const storage = () => { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) }; };
function setup(reply = paid()) {
  const tab = storage(), local = storage(), calls = [];
  const window = new EventTarget(); window.location = new URL('https://roomhy.example.invalid/website/payment-success');
  const context = vm.createContext({ module: { exports: {} }, window, sessionStorage: tab, localStorage: local,
    URL, Headers, AbortController, DOMException, setTimeout, clearTimeout,
    fetch: async (url, options) => { calls.push({ url, options }); if (reply instanceof Error) throw reply;
      return { ok: true, status: 200, json: async () => reply }; },
  });
  vm.runInContext(bundle, context);
  return { ...context.module.exports, calls, tab, local };
}

test('only a complete verified receipt for the requested order produces paid', () => {
  const e = setup(), result = e.parsePaymentConfirmation(paid(), 'ORDER_A');
  assert.equal(result.state, 'paid');
  assert.equal(result.receipt.bookingId, 'BOOKING_SERVER');
  assert.equal(result.receipt.amount, 500);
});
test('legacy transaction status and success flags never authorize a receipt', () => {
  const e = setup();
  for (const value of [null, {}, { success: true }, { success: true, status: 'PAID', transaction: { status: 'PAID' } },
    { ...paid(), verified: false }, { ...paid(), success: false }, { ...paid(), state: 'unknown' }]) {
    const result = e.parsePaymentConfirmation(value, 'ORDER_A');
    assert.equal(result.state, 'unavailable'); assert.equal(result.receipt, null);
  }
});
test('pending and failed states cannot carry a printable receipt', () => {
  const e = setup();
  for (const state of ['pending', 'failed']) {
    const result = e.parsePaymentConfirmation({ ...paid(), state }, 'ORDER_A');
    assert.equal(result.state, state); assert.equal(result.receipt, null);
  }
});
test('missing IDs, mismatched order, invalid amount, timestamp, status and currency fail closed', () => {
  const e = setup();
  const badFields = { receiptId: ['', null], bookingId: ['', undefined], paymentId: ['', null], orderId: ['ORDER_B'],
    amount: [0, -1, NaN, Infinity, '500', null], paidAt: ['', 'invalid'], propertyName: [''], currency: ['USD'], status: ['FAILED', 'PENDING'] };
  for (const [field, values] of Object.entries(badFields)) for (const value of values) {
    assert.equal(e.parsePaymentConfirmation({ ...paid(), receipt: { ...receipt(), [field]: value } }, 'ORDER_A').state, 'unavailable', field);
  }
});
test('missing or malformed order references make no network requests', async () => {
  const e = setup();
  for (const id of ['', null, '../other', 'A'.repeat(129), 'A?amount=1']) assert.equal((await e.loadPaymentConfirmation(id)).state, 'unavailable');
  assert.equal(e.calls.length, 0);
});
test('confirmation uses the dedicated no-store endpoint and website credential only', async () => {
  const e = setup();
  e.local.setItem('token', 'PANEL_ONLY'); e.local.setItem('website_token', 'WEBSITE_ONLY');
  const result = await e.loadPaymentConfirmation('ORDER_A');
  assert.equal(result.state, 'paid'); assert.equal(e.calls.length, 1);
  const { url, options } = e.calls[0];
  assert.equal(new URL(url).pathname, '/api/payments/payu/confirmation/ORDER_A');
  assert.equal(new URL(url).search, '');
  assert.equal(options.headers.get('authorization'), 'Bearer WEBSITE_ONLY');
  assert.equal(options.cache, 'no-store'); assert.equal(options.credentials, 'omit'); assert.equal(options.referrerPolicy, 'no-referrer');
});
test('a website route never uses an existing panel session for confirmation', async () => {
  const e = setup(); e.local.setItem('token', 'PANEL_ONLY');
  await e.loadPaymentConfirmation('ORDER_A');
  assert.equal(e.calls[0].options.headers.has('authorization'), false);
});
test('network errors cannot become successful confirmation', async () => {
  const e = setup(new Error('Synthetic network unavailable'));
  await assert.rejects(e.loadPaymentConfirmation('ORDER_A'), /network unavailable/);
});

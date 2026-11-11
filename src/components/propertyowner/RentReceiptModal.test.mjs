// Run: node src/components/propertyowner/RentReceiptModal.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';

// Execute the real JSX module using the project's existing build dependency.
const bundle = buildSync({
  stdin: {
    contents: "export { buildReceiptHtml } from './RentReceiptModal.jsx';",
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
  },
  bundle: true, write: false, platform: 'browser', format: 'cjs',
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'silent',
}).outputFiles[0].text;
const context = vm.createContext({ module: { exports: {} } });
vm.runInContext(bundle, context);
const { buildReceiptHtml } = context.module.exports;

const fixture = (overrides = {}) => ({
  id: 'AUDIT-001', tenant: 'Test Tenant', room: '101', phone: '0000000000',
  email: 'fixture@example.invalid', date: '10 Nov 2026', period: 'November 2026',
  paymentMethod: 'bank_transfer', amount: 5000, penalty: 100, electricity: 200,
  advanceChargeAmount: 300, paid: 5500, ...overrides,
});
const textFields = ['id', 'tenant', 'room', 'phone', 'email', 'date', 'period', 'paymentMethod'];
const imagePayload = '<img src=x onerror="globalThis.receiptXss=1">';
const escapedImagePayload = '&lt;img src=x onerror=&quot;globalThis.receiptXss=1&quot;&gt;';

for (const field of textFields) {
  test(`SEC-02: ${field} is rendered as text, not executable image markup`, () => {
    const html = buildReceiptHtml(fixture({ [field]: imagePayload }));
    assert.ok(html.includes(escapedImagePayload), `${field} must preserve the payload as escaped text`);
    assert.ok(!html.includes('<img'), `${field} must not create an image element`);
  });
}

test('receipt IDs cannot close the title or introduce a script', () => {
  const html = buildReceiptHtml(fixture({ id: '</title><script>globalThis.receiptXss=1</script><title>' }));
  assert.ok(html.includes('<title>Receipt &lt;/title&gt;&lt;script&gt;globalThis.receiptXss=1&lt;/script&gt;&lt;title&gt;</title>'));
  assert.ok(!html.includes('<script>'));
  assert.equal((html.match(/<title>/g) || []).length, 1);
});

test('SVG, iframe, and entity payloads remain text in every receipt field', () => {
  for (const payload of [
    '<svg onload="globalThis.receiptXss=1"></svg>',
    '<iframe srcdoc="<script>globalThis.receiptXss=1</script>"></iframe>',
    '&lt;img src=x onerror=globalThis.receiptXss=1&gt;',
  ]) {
    for (const field of textFields) {
      const html = buildReceiptHtml(fixture({ [field]: payload }));
      assert.ok(!/<(?:svg|iframe|script|img)\b/i.test(html), `${field} must not create active elements`);
      if (payload.startsWith('&')) assert.ok(html.includes('&amp;lt;img'));
    }
  }
});

test('legitimate Unicode, apostrophes, ampersands, quotes, and brackets are preserved as text', () => {
  const name = 'सीमा O\'Neil & Sons <PG> "A"';
  const html = buildReceiptHtml(fixture({ tenant: name }));
  assert.ok(html.includes('सीमा O&#39;Neil &amp; Sons &lt;PG&gt; &quot;A&quot;'));
});

test('missing and numeric text fields have safe printable representations', () => {
  const html = buildReceiptHtml(fixture({ id: 123, tenant: null, room: 0, date: undefined, period: null, phone: null, email: undefined, paymentMethod: '' }));
  assert.ok(html.includes('<title>Receipt 123</title>'));
  assert.ok(html.includes('<div class="bill-name"></div>'));
  assert.ok(html.includes('Room 0'));
  assert.ok(!html.includes('undefined'));
  assert.ok(!html.includes('>null<'));
  assert.ok(!html.includes('<span class="lbl">Phone</span>'));
  assert.ok(!html.includes('<span class="lbl">Email</span>'));
  assert.ok(!html.includes('<span class="lbl">Payment Method</span>'));
});

test('rent, move-in charge, penalty, electricity, paid amount, and balance remain unchanged', () => {
  const html = buildReceiptHtml(fixture());
  assert.ok(html.includes('<strong>Original Rent</strong>'));
  assert.ok(html.includes('<strong>Move In Charges</strong>'));
  assert.ok(html.includes('<strong>Late Penalty</strong>'));
  assert.ok(html.includes('<strong>Electricity Bill</strong>'));
  assert.ok(html.includes('&#8377;5,600.00'));
  assert.ok(html.includes('(-) &#8377;5,500.00'));
  assert.ok(html.includes('<span class="tk">Balance Remaining</span><span class="tv">&#8377;100.00'));
  assert.ok(html.includes('Rupees Five Thousand Six Hundred Only'));
  assert.ok(html.includes('badge-partial'));
  assert.ok(html.includes('>PARTIAL</span>'));
  assert.ok(html.includes('>bank transfer</span>'));
  assert.ok(html.includes('@media print'));
});

test('PAID and WAIVED statuses and zero-charge receipts preserve their existing behavior', () => {
  for (const invoiceStatus of ['PAID', 'WAIVED']) {
    const html = buildReceiptHtml(fixture({ invoiceStatus }));
    assert.ok(html.includes('&#10003; PAID'));
  }
  const html = buildReceiptHtml(fixture({ amount: 0, penalty: 0, electricity: 0, advanceChargeAmount: 0, paid: 0 }));
  assert.ok(html.includes('Amount Due In Words:</strong> Zero'));
  assert.ok(!html.includes('<strong>Move In Charges</strong>'));
  assert.ok(!html.includes('<strong>Late Penalty</strong>'));
  assert.ok(!html.includes('<strong>Electricity Bill</strong>'));
});

test('building a receipt does not mutate payment data or pre-escape the React preview input', () => {
  const receipt = fixture({ tenant: imagePayload, _raw: { invoiceId: { advanceChargeAmount: 300 } } });
  const before = structuredClone(receipt);
  buildReceiptHtml(receipt);
  assert.deepEqual(receipt, before);
  assert.equal(receipt.tenant, imagePayload);
});

// node src/pages/superadmin/requestAlternate.browser.test.mjs
// Actual request pages and handlers; synthetic API replies, real CSS and Chrome.
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
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Queue from './src/pages/superadmin/RequestAlternate.jsx';
import HeaderSearch from './src/components/AlternateRequestSearch.jsx';
import { SubNavPanel } from './src/components/SubNavPanel.jsx';
import MyStays from './src/pages/website/WebsiteMystays.jsx';
import RequestDesk from './src/pages/website/WebsiteRefundRequest.jsx';
import OwnerVisits from './src/pages/propertyowner/AlternateVisits.jsx';
import { toast } from 'react-hot-toast';
const scenario = new URLSearchParams(location.search).get('scenario');
const id = '6ae2d7acc92162010feba254', failures = [], calls = [], successes = [], errors = [];
const check = (value, label) => { if (!value) failures.push(label); };
toast.success = message => successes.push(message); toast.error = message => errors.push(message);
localStorage.setItem('token', 'SYNTHETIC_PANEL_TOKEN');
localStorage.setItem('user', JSON.stringify({ role: 'superadmin' }));
if (scenario.startsWith('employee')) sessionStorage.setItem('staff_user', JSON.stringify({ role: 'employee', team: 'Marketing Team', loginId: 'RY1861', city: 'Kota', area: '', permissions: ['property_management'] }));
localStorage.setItem('website_user', JSON.stringify({ role: 'tenant', id: 'SYNTHETIC_USER', email: 'tenant@example.invalid' }));
const booking = { _id: id, booking_id: id, property_id: 'SYNTHETIC_PROPERTY', property_name: 'Original hostel', name: 'Synthetic tenant',
  user_id: 'SYNTHETIC_USER', phone: '9000000001', email: 'tenant@example.invalid', owner_id: 'SYNTHETIC_OWNER',
  request_type: 'online', status: 'confirmed', payment_status: 'completed', total_amount: 500, area: 'Kota' };
const row = { _id: 'SYNTHETIC_REQUEST', booking_id: id, booking_record_id: id, request_type: 'alternative_property',
  property_name: booking.property_name, user_name: booking.name, user_phone: booking.phone, assigned_employee: 'RY1861',
  preferred_area: 'Kota', property_requirements: 'Need a quieter room', selected_alternative_properties: [{ property_id: 'SELECTED_1', property_name: 'Selected hostel' }], refund_status: 'pending' };
const phaseTenant = scenario.includes('round') || scenario.includes('exhausted') || scenario.includes('resolved');
const approvedProperties = [1, 2, 3].map(n => ({ property_id: 'APPROVED_' + n, property_name: 'Approved hostel ' + n, area: 'Sector 12', city: 'Kota', rent: 5000 }));
let workflow = { request: { _id: row._id, booking_id: id, workflow_status: 'awaiting_tenant', workflow_version: 1,
  rounds: [{ _id: 'ROUND_1', properties: approvedProperties, sent_at: '2026-11-13T06:00:00Z', tenant_response: 'pending' }] },
  remaining_count: scenario.includes('exhausted') || scenario.includes('resolved') ? 0 : 3, can_request_another: !scenario.includes('resolved'),
  price_range: { booked_rent: 5000, min_rent: 4900, max_rent: 5300 } };
const finalMessage = 'No more matching properties.\\nPlease use the refund option. <b>Thank you</b>';
if (scenario.includes('resolved')) Object.assign(workflow.request, { workflow_status: 'refund_only', resolution_message: { text: finalMessage } });
let approvalCount = 0, responseCount = 0;
let postCount = 0, listCount = 0, stored = !scenario.startsWith('mystays'), posted;
window.fetch = async (url, options = {}) => {
  const endpoint = new URL(url, location.origin); calls.push(endpoint.pathname + endpoint.search);
  if (endpoint.pathname.endsWith('/alternate-workflow')) return new Response(JSON.stringify({ success: true, data: phaseTenant || workflow.request.workflow_status === 'refund_only' ? workflow : { request: null } }));
  if (endpoint.pathname.endsWith('/alternate-workflow/respond')) {
    responseCount++; await new Promise(resolve => setTimeout(resolve, 60));
    if (scenario.endsWith('failure')) return new Response(JSON.stringify({ message: 'Synthetic response save failure' }), { status: 503 });
    const body = JSON.parse(options.body); check(body.workflow_version === 1 && body.response === 'another_alternative', 'tenant choice carries the round version');
    workflow = { ...workflow, request: { ...workflow.request, workflow_status: 'pending', workflow_version: 2,
      rounds: [{ ...workflow.request.rounds[0], tenant_response: 'another_alternative' }] }, can_request_another: false };
    return new Response(JSON.stringify({ success: true, message: 'Another round requested.', data: workflow }));
  }
  if (endpoint.pathname.endsWith('/properties') && endpoint.pathname.includes('/alternate-requests/')) {
    const count = scenario === 'approval_empty' || scenario.includes('approval_message') ? 0 : scenario === 'approval_small' ? 2 : 4;
    return new Response(JSON.stringify({ success: true, data: { properties: Array.from({ length: count }, (_, n) => ({ property_id: 'P' + n, property_name: 'Eligible hostel ' + n, area: 'Sector 12', city: 'Kota', rent: 5000 })),
      price_range: { booked_rent: 5000, min_rent: 4900, max_rent: 5300 }, area: { area: 'Sector 12', city: 'Kota', state: 'Rajasthan' }, required_count: Math.min(3, count), workflow_version: 0, workflow_status: 'pending' } }));
  }
  if (endpoint.pathname.endsWith('/approve')) {
    approvalCount++; posted = JSON.parse(options.body); await new Promise(resolve => setTimeout(resolve, 60));
    if (scenario.endsWith('failure')) return new Response(JSON.stringify({ message: 'Synthetic approval save failure' }), { status: 503 });
    if (posted.message) {
      row.workflow_status = 'refund_only'; row.resolution_message = { text: posted.message }; row.workflow_version = 1;
      workflow = { ...workflow, request: { ...workflow.request, workflow_status: 'refund_only', resolution_message: row.resolution_message }, can_request_another: false };
      return new Response(JSON.stringify({ success: true, message: 'Message sent to tenant.', data: row }));
    }
    row.workflow_status = 'awaiting_tenant'; row.workflow_version = 1; row.rounds = workflow.request.rounds.map(round => ({ ...round,
      tenant_email_status: scenario === 'approval_email_failed' ? 'failed' : 'pending',
      owner_email_status: scenario === 'approval_email_failed' ? 'partial' : 'sent',
      tenant_email_error: scenario === 'approval_email_failed' ? 'The tenant email could not be sent. The properties are available in My Stays.' : '' }));
    return new Response(JSON.stringify({ success: true, message: 'Visit round sent.', data: row }));
  }
  if (endpoint.pathname.endsWith('/alternate-visits')) {
    if (scenario.endsWith('failure')) return new Response(JSON.stringify({ message: 'Synthetic owner load failure' }), { status: 503 });
    return new Response(JSON.stringify({ success: true, data: scenario.endsWith('empty') ? [] : [{ round_id: 'ROUND_1', property: approvedProperties[0], tenant_name: booking.name, tenant_phone: booking.phone, booking_id: id, round_number: 1, sent_at: '2026-11-13T06:00:00Z' }] }));
  }
  if (endpoint.pathname.endsWith('/refund-request') && options.method === 'POST') {
    postCount++; posted = JSON.parse(options.body); await new Promise(resolve => setTimeout(resolve, 60));
    if (scenario.endsWith('failure')) return new Response(JSON.stringify({ success: false, message: 'Synthetic save failure' }), { status: 503 });
    stored = true; Object.assign(row, posted); return new Response(JSON.stringify({ success: true, data: row, message: 'Alternative property request submitted successfully' }));
  }
  if (endpoint.pathname.endsWith('/refund-requests')) {
    listCount++;
    check(endpoint.searchParams.get('request_type') === 'alternative_property', 'queue asks only for alternative requests');
    if (scenario === 'retry' && listCount === 1) return new Response(JSON.stringify({ message: 'Synthetic list failure' }), { status: 503 });
    const query = endpoint.searchParams.get('booking_id');
    const rows = scenario === 'empty' || !stored || (query && query !== id) ? [] : [row, { ...row, _id: 'DUPLICATE_REQUEST' }, { ...row, _id: 'REFUND', request_type: 'refund' }];
    return new Response(JSON.stringify({ success: true, data: rows }));
  }
  if (endpoint.pathname.includes('/user/')) return new Response(JSON.stringify({ success: true, data: endpoint.searchParams.get('type') === 'bids' ? [] : [booking] }));
  if (endpoint.pathname.endsWith('/alternative-recommendations')) {
    const stays = [{ propertyId: 'SELECTED_1', id: 'SELECTED_1', title: 'Selected hostel', name: 'Selected hostel', monthlyRent: 5000, rent: 5000, area: 'Kota' }];
    return new Response(JSON.stringify({ success: true, data: stays, recommendations: stays }));
  }
  failures.push('Unexpected endpoint: ' + endpoint.pathname); return new Response('{}');
};
function Navigate() { window.go = useNavigate(); return null; }
function Admin() { return <><HeaderSearch /><div style={{ display: 'flex', minWidth: 0 }}><SubNavPanel activeModuleId="property_management" /><main style={{ flex: 1, minWidth: 0, padding: 16 }}><Queue /></main></div></>; }
createRoot(document.getElementById('root')).render(<BrowserRouter><Navigate /><Routes>
  <Route path="/propertyowner/alternate-visits" element={<OwnerVisits />} /><Route path="/my-stays" element={<MyStays />} /><Route path="/refund-request" element={<RequestDesk />} /><Route path="*" element={<Admin />} />
</Routes></BrowserRouter>);
const wait = async condition => { for (let i = 0; i < 300; i++) { if (condition()) return; await new Promise(resolve => setTimeout(resolve, 10)); } throw new Error('Browser state timeout'); };
const text = () => document.getElementById('root').textContent;
const button = name => [...document.querySelectorAll('button')].find(element => element.textContent.trim() === name);
const input = (element, value) => {
  Object.getOwnPropertyDescriptor(element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(element, value);
  element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
};
const submit = form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
(async () => {
 try {
  if (scenario.startsWith('approval')) {
    await wait(() => button('Approve')); button('Approve').click();
    await wait(() => document.querySelector('[role="dialog"]') && text().includes('Allowed monthly rent'));
    check(text().includes('Sector 12, Kota, Rajasthan'), 'popup identifies the booking area');
    check(text().includes('₹4,900–₹5,300'), 'popup shows the server-enforced rent range');
    if (scenario === 'approval_empty' || scenario.includes('approval_message')) {
      check(!button('Approve and Send'), 'empty pool cannot send an empty property round');
      check(button('Send message').disabled, 'a tenant message is required');
      input(document.getElementById('alternate-final-message'), finalMessage);
      await wait(() => !button('Send message').disabled);
      const send = button('Send message'); send.click(); send.click();
      await wait(() => successes.length || text().includes('Synthetic approval save failure'));
      check(approvalCount === 1, 'double click sends only one final message');
      check(posted.message === finalMessage && posted.workflow_version === 0, 'final message carries text and server version');
      if (scenario.endsWith('failure')) {
        check(Boolean(document.querySelector('[role="dialog"]')) && successes.length === 0, 'failed message stays open and never claims success');
      } else {
        await wait(() => !document.querySelector('[role="dialog"]'));
        window.go('/my-stays'); await wait(() => text().includes('Message from Roomhy'));
        check(text().includes(finalMessage), 'the tenant sees the exact saved message');
        check(button('Request token refund') && !button('Another alternative'), 'after the final message only refund remains');
        check(!document.querySelector('[aria-label="Alternate visits"] b'), 'typed HTML is displayed as plain text');
      }
    } else {
      const count = scenario === 'approval_small' ? 2 : 3;
      const checks = [...document.querySelectorAll('[role="dialog"] input[type=checkbox]')];
      check(button('Approve and Send').disabled, 'send disabled before required selection');
      for (let n = 0; n < count; n++) { checks[n].click(); await new Promise(resolve => setTimeout(resolve, 15)); }
      const send = button('Approve and Send'); check(!send.disabled, 'required count enables sending'); send.click(); send.click();
      await wait(() => errors.length || successes.length || text().includes('Synthetic approval save failure'));
      check(approvalCount === 1, 'double click sends only one approval');
      check(posted.property_ids.length === count && posted.workflow_version === 0, 'approval posts selected IDs and server version');
      if (scenario.endsWith('failure')) {
        check(Boolean(document.querySelector('[role="dialog"]')), 'failed approval keeps popup open'); check(successes.length === 0, 'failed approval never claims success');
      } else {
        await wait(() => !document.querySelector('[role="dialog"]')); check(successes.length === 1, 'saved approval is confirmed');
        if (scenario === 'approval_email_pending' || scenario === 'approval_email_failed') {
          await wait(() => text().includes('Tenant email:'));
          check(text().includes(scenario === 'approval_email_failed' ? 'Tenant email: Failed' : 'Tenant email: Sending'), 'queue shows the actual delivery state');
          check(text().includes(scenario === 'approval_email_failed' ? 'Owner email: Some failed' : 'Owner email: Sent'), 'queue shows independent owner delivery state');
          if (scenario === 'approval_email_failed') check(text().includes('The tenant email could not be sent.'), 'email failure remains visible after approval');
        }
      }
    }
  } else if (phaseTenant) {
    await wait(() => text().includes('You can visit these 3 properties'));
    check(approvedProperties.every(property => text().includes(property.property_name)), 'approved property details appear for tenant');
    if (scenario.includes('resolved')) {
      check(text().includes('Message from Roomhy') && text().includes(finalMessage), 'saved approver message is visible');
      check(!button('Another alternative'), 'only refund remains after the final message');
      button('Request token refund').click(); await new Promise(resolve => setTimeout(resolve, 50));
      if (scenario.startsWith('mystays')) {
        check(document.getElementById('refundModal').classList.contains('flex'), 'refund choice opens existing refund form');
        await wait(() => !document.getElementById('alternativeOption'));
        check(!document.getElementById('alternativeOption'), 'the final refund form cannot switch back to another alternative');
      } else {
        check(document.querySelector('input[value="refund"]').checked, 'refund choice selects the existing refund form');
        check(!document.querySelector('input[value="alternative"]'), 'standalone final form offers only refund');
      }
    } else {
      check(button('Request token refund') && button('Another alternative'), 'repeat choice offers refund and another alternative together');
      const another = button('Another alternative');
      another.click(); another.click(); await wait(() => text().includes('Synthetic response save failure') || successes.length);
      check(responseCount === 1, 'double click saves one tenant response');
      if (scenario.endsWith('failure')) check(successes.length === 0 && text().includes('Synthetic response save failure'), 'failed tenant response remains visible with no fake success');
      else await wait(() => text().includes('waiting for approval'));
    }
  } else if (scenario.startsWith('owner')) {
    await wait(() => text().includes('Alternate Visits') && !text().includes('Loading alternate visits'));
    if (scenario.endsWith('failure')) check(text().includes('Synthetic owner load failure') && button('Retry'), 'owner load failure offers retry');
    else if (scenario.endsWith('empty')) check(text().includes('No alternate visits yet'), 'owner empty state is explicit');
    else { check(text().includes('Approved hostel 1') && text().includes(booking.name), 'owner sees their visit and tenant'); check(!button('Accept') && !button('Decline'), 'owner visit notice has no decision actions'); }
  } else if (scenario.startsWith('mystays')) {
    await wait(() => button('Alternative')); button('Alternative').click();
    await wait(() => button('Select Stay')); button('Select Stay').click();
    input(document.getElementById('propertyRequirements'), 'Need a quieter room');
    await new Promise(resolve => setTimeout(resolve, 20));
    await wait(() => !button('Submit Alternative Stay Request').disabled);
    const send = button('Submit Alternative Stay Request'); send.click(); send.click();
    await wait(() => errors.length || successes.length);
    check(postCount === 1, 'double click creates only one outgoing submission');
    check(!localStorage.getItem('refundSubmissions'), 'no unsynced fake-success records');
    if (scenario.endsWith('failure')) {
      check(successes.length === 0, 'failed save has no success claim');
      check(document.getElementById('refundModal').classList.contains('flex'), 'failed submission keeps modal open');
      check(text().includes('Synthetic save failure'), 'failed submission shows server error');
    } else {
      check(posted.booking_id === id && posted.selected_alternative_properties.length === 1, 'submission carries booking and chosen property');
      check(posted.property_requirements === 'Need a quieter room', 'submission preserves requirements');
      window.go('/superadmin/property/request-alternate?bookingId=' + id);
      await wait(() => document.querySelector('tbody tr'));
      check(document.querySelectorAll('tbody tr').length === 1 && text().includes('Selected hostel'), 'website request reaches the alternate queue once');
    }
  } else if (scenario.startsWith('desk')) {
    await wait(() => [...document.querySelectorAll('button')].some(element => element.textContent.includes('Select Stay')));
    const choose = () => [...document.querySelectorAll('button')].find(element => /Select Stay|Selected/.test(element.textContent));
    choose().click(); await new Promise(resolve => setTimeout(resolve, 20));
    check(choose().textContent.includes('Selected'), 'standalone desk selects property');
    choose().click(); await new Promise(resolve => setTimeout(resolve, 20));
    check(choose().textContent.includes('Select Stay'), 'standalone desk deselects without duplicating property');
    input(document.querySelector('[name=requestReason]'), 'Photos mismatch physical room');
    await new Promise(resolve => setTimeout(resolve, 20));
    const form = document.querySelector('form'); submit(form); submit(form);
    await wait(() => errors.length || successes.length);
    check(postCount === 1, 'standalone desk double submit has one request');
    if (scenario.endsWith('failure')) check(successes.length === 0 && !text().includes('Request Submitted Successfully'), 'standalone failed submission is not success');
    else check(posted.selected_alternative_properties.length === 0, 'deselected property is not submitted');
  } else {
    if (scenario === 'retry') { await wait(() => button('Retry')); button('Retry').click(); }
    if (scenario === 'empty') await wait(() => text().includes('No alternate property requests yet.'));
    else await wait(() => document.querySelector('tbody tr'));
    check([...document.querySelectorAll('button')].some(element => element.textContent.trim() === 'Request Alternate'), 'property menu contains Request Alternate');
    if (scenario !== 'empty') check(document.querySelectorAll('tbody tr').length === 1, 'queue excludes refunds and duplicates');
    if (scenario === 'header' || scenario === 'employee_header') {
      input(document.querySelector('[aria-label="Booking ID for alternate requests"]'), id);
      await new Promise(resolve => setTimeout(resolve, 20)); submit(document.querySelector('[aria-label="Search alternate requests"]'));
      await wait(() => location.search.includes('bookingId='));
      await wait(() => document.querySelector('#alternate-booking-id')?.value === id);
      await wait(() => calls.some(call => call.includes('booking_id=' + id)));
      await wait(() => !text().includes('Loading alternate requests...'));
      check(location.pathname === (scenario.startsWith('employee') ? '/employee/property/request-alternate' : '/superadmin/property/request-alternate'), 'header stays in the recipient panel');
      check(document.querySelector('#alternate-booking-id').value === id, 'pasted booking ID reaches page search');
      check(calls.some(call => call.includes('booking_id=' + id)), 'header search sends full booking ID');
    }
    if (scenario.startsWith('employee')) {
      check(text().includes('your assigned city, area, or properties'), 'employee queue describes geographic responsibility');
      check(text().includes('Employee: RY1861'), 'city employee is shown as responsible for the request');
      button('Request Alternate').click();
      await wait(() => location.pathname.startsWith('/employee/'));
      check(location.pathname === '/employee/property/request-alternate', 'employee menu stays in employee panel');
    }
    if (scenario === 'search') {
      input(document.getElementById('alternate-booking-id'), 'MISSING_BOOKING'); await new Promise(resolve => setTimeout(resolve, 20));
      submit(document.querySelector('[aria-label="Find alternate request"]'));
      await wait(() => text().includes('No alternate request found for Booking ID MISSING_BOOKING.'));
      button('Clear search').click(); await wait(() => document.querySelector('tbody tr'));
    }
    if (scenario === 'mobile') {
      check(innerWidth === 390, 'mobile viewport is exact');
      const scroller = document.querySelector('.refund-table-scroll');
      check(scroller.scrollWidth > scroller.clientWidth, 'table has internal mobile scrolling');
      check(document.documentElement.scrollWidth <= innerWidth + 1, 'mobile page does not overflow');
    }
  }
 } catch (error) { failures.push(error.message); }
 document.getElementById('result').textContent = JSON.stringify({ scenario, failures, postCount });
})();
`;
let temporary, server, base;
test.before(async () => {
  temporary = await mkdtemp(join(tmpdir(), 'roomhy-alternate-browser-'));
  const bundle = await build({ stdin: { contents: fixture, resolveDir: root, loader: 'jsx' }, bundle: true, write: false,
    outfile: 'alternate-browser.js', platform: 'browser', format: 'iife', define: { 'import.meta.env': '{}' }, logLevel: 'silent',
    plugins: [{ name: 'unrelated-website-assets', setup(builder) {
      builder.onResolve({ filter: /components\/website\/(WebsiteNavbar|WebsiteFooter|MobileBottomNav)$/ }, args => ({ path: args.path, namespace: 'stub-shell' }));
      builder.onLoad({ filter: /.*/, namespace: 'stub-shell' }, () => ({ contents: 'export default function Shell(){return null;}', loader: 'js' }));
      builder.onResolve({ filter: /utils\/(htmlPage|websiteUi)$/ }, args => ({ path: args.path, namespace: 'stub-assets' }));
      builder.onLoad({ filter: /.*/, namespace: 'stub-assets' }, () => ({ contents: 'export const useHtmlPage=()=>{},useWebsiteCommon=()=>{},useWebsiteMenu=()=>{},useLucideIcons=()=>{};', loader: 'js' }));
      builder.onResolve({ filter: /components\/propertyowner\/PropertyOwnerLayout$/ }, args => ({ path: args.path, namespace: 'owner-shell' }));
      builder.onLoad({ filter: /.*/, namespace: 'owner-shell' }, () => ({ contents: 'export default function Layout({children}){return children;}', loader: 'js' }));
      builder.onResolve({ filter: /hooks\/useSEO$/ }, args => ({ path: args.path, namespace: 'stub-seo' }));
      builder.onLoad({ filter: /.*/, namespace: 'stub-seo' }, () => ({ contents: 'export default function useSEO(){}', loader: 'js' }));
    } }] });
  const css = await postcss([tailwindcss({ ...tailwindConfig, content: [join(root, 'src/components/{AlternateRequestSearch,SubNavPanel,AlternateApprovalModal,AlternateVisitStatus}.jsx'), join(root, 'src/pages/superadmin/RequestAlternate.jsx'), join(root, 'src/pages/website/Website{Mystays,RefundRequest}.jsx')] })])
    .process(await readFile(join(root, 'src/index.css'), 'utf8'), { from: join(root, 'src/index.css') });
  const html = '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + css.css + (bundle.outputFiles.find(file => file.path.endsWith('.css'))?.text || '') +
    '#result{display:none}@media(max-width:640px){aside{display:none}}</style><div id="root"></div><pre id="result"></pre><script>' + bundle.outputFiles.find(file => file.path.endsWith('.js')).text.replaceAll('</script', '<\\/script') + '</script>';
  server = createServer((req, res) => { res.setHeader('Content-Type', 'text/html'); res.end(html); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => { if (server) await new Promise(resolve => server.close(resolve)); if (temporary) await rm(temporary, { recursive: true, force: true }); });

async function browser(scenario, width = 1440) {
  return new Promise((resolve, reject) => {
    // Device emulation avoids Chrome's 500px minimum desktop-window width.
    const child = spawn(process.env.CHROME_BIN || '/usr/bin/google-chrome', ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
      '--disable-background-networking', '--disable-component-update', '--disable-default-apps', '--no-first-run', '--no-default-browser-check',
      '--host-resolver-rules=MAP * 0.0.0.0', '--remote-debugging-port=0', `--user-data-dir=${join(temporary, scenario + width)}`,
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
          await command('Page.navigate', { url: base + (scenario.startsWith('owner') ? '/propertyowner/alternate-visits?' : scenario.startsWith('mystays') ? '/my-stays?' : scenario.startsWith('desk') ? '/refund-request?type=alternative&bookingId=6ae2d7acc92162010feba254&email=tenant%40example.invalid&' : scenario.startsWith('employee') ? '/employee/property/request-alternate?' : '/superadmin/property/request-alternate?') + 'scenario=' + scenario }, sessionId);
          for (let attempt = 0; attempt < 200; attempt++) {
            const value = await command('Runtime.evaluate', { expression: "document.getElementById('result')?.textContent", returnByValue: true }, sessionId);
            if (value.result?.value) {
              const result = JSON.parse(value.result.value);
              if (process.env.ALTERNATE_SCREENSHOT && scenario === 'header') {
                const shot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId);
                await writeFile(process.env.ALTERNATE_SCREENSHOT, Buffer.from(shot.data, 'base64'));
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
for (const scenario of ['employee', 'employee_header', 'menu', 'header', 'search', 'empty', 'retry', 'mobile', 'mystays_success', 'mystays_failure', 'desk_success', 'desk_failure', 'approval_success', 'approval_failure', 'approval_small', 'approval_empty', 'approval_email_pending', 'approval_email_failed', 'approval_message_success', 'approval_message_failure', 'mystays_round', 'mystays_round_failure', 'mystays_exhausted', 'desk_round', 'desk_round_failure', 'desk_exhausted', 'mystays_resolved', 'desk_resolved', 'owner_success', 'owner_empty', 'owner_failure']) {
  test(`Request Alternate browser: ${scenario}`, async () => {
    const result = await browser(scenario, scenario === 'mobile' ? 390 : 1440);
    assert.deepEqual(result.failures, []);
  });
}

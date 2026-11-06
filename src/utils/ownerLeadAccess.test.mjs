import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLeadAccess, isLeadBlockedResponse, isLeadBlockedError, getLeadAccess,
  setLeadAccess, subscribeLeadAccess, __resetLeadAccessForTests, LEAD_BLOCK_MESSAGE,
} from './ownerLeadAccess.js';

test('parseLeadAccess reads blocked flag from common payload shapes', () => {
  const la = { blocked: true, reason: 'violation' };
  assert.deepEqual(parseLeadAccess({ user: { leadAccess: la } }), la);
  assert.deepEqual(parseLeadAccess({ data: { user: { leadAccess: la } } }), la);
  assert.deepEqual(parseLeadAccess({ leadAccess: la }), la);
});

test('parseLeadAccess defaults to not blocked and is strict about true', () => {
  const open = { blocked: false, reason: null };
  assert.deepEqual(parseLeadAccess(null), open);
  assert.deepEqual(parseLeadAccess({}), open);
  assert.deepEqual(parseLeadAccess({ user: { leadAccess: { blocked: 'true' } } }), open);
  assert.deepEqual(parseLeadAccess({ user: { leadAccess: { blocked: false, reason: 'old' } } }), open);
  assert.deepEqual(parseLeadAccess({ user: { leadAccess: { blocked: true } } }), { blocked: true, reason: null });
});

test('isLeadBlockedResponse needs 403 and the exact code', () => {
  const body = JSON.stringify({ code: 'OWNER_LEADS_BLOCKED', blocked: true });
  assert.equal(isLeadBlockedResponse(403, body), true);
  assert.equal(isLeadBlockedResponse(403, { code: 'OWNER_LEADS_BLOCKED' }), true);
  assert.equal(isLeadBlockedResponse(401, body), false);
  assert.equal(isLeadBlockedResponse(403, JSON.stringify({ code: 'OTHER' })), false);
  assert.equal(isLeadBlockedResponse(403, 'not json'), false);
  assert.equal(isLeadBlockedResponse(403, null), false);
  assert.equal(isLeadBlockedError({ status: 403, body: body }), true);
  assert.equal(isLeadBlockedError(new Error('x')), false);
});

test('store notifies only on change', () => {
  __resetLeadAccessForTests();
  let n = 0;
  const off = subscribeLeadAccess(() => { n += 1; });
  setLeadAccess({ blocked: true, reason: 'r' });
  setLeadAccess({ blocked: true, reason: 'r' });
  assert.equal(n, 1);
  assert.equal(getLeadAccess().blocked, true);
  setLeadAccess({ blocked: false });
  assert.deepEqual(getLeadAccess(), { blocked: false, reason: null });
  assert.equal(n, 2);
  off();
});

test('required copy is exact', () => {
  assert.equal(LEAD_BLOCK_MESSAGE, 'You are blocked from receiving access due to a violation. Please contact the Roomhy team.');
});

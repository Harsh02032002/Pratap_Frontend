import test from 'node:test';
import assert from 'node:assert/strict';
import { alternateRequestSearchPath, alternateRequestNotificationPath, uniqueAlternativeRequests } from './alternativeRequests.js';

test('a pasted booking ID navigates to the alternate queue with whitespace removed', () => {
  assert.equal(alternateRequestSearchPath(' 6ae2d7acc92162010feba254 '), '/superadmin/property/request-alternate?bookingId=6ae2d7acc92162010feba254');
});
test('search values are URL encoded and the employee path stays in the employee panel', () => {
  assert.equal(alternateRequestSearchPath('BOOKING/one?x=2', '/employee/property-overview'), '/employee/property/request-alternate?bookingId=BOOKING%2Fone%3Fx%3D2');
  assert.equal(alternateRequestSearchPath(''), '/superadmin/property/request-alternate');
});
test('the alternate queue excludes refunds and collapses duplicate booking records', () => {
  const records = [
    { _id: 'first', request_type: 'alternative_property', booking_record_id: 'booking', booking_id: 'official' },
    { _id: 'duplicate', request_type: 'alternative_property', booking_record_id: 'booking', booking_id: 'document' },
    { _id: 'refund', request_type: 'refund', booking_id: 'other' },
    { _id: 'another', request_type: 'alternative_property', booking_id: 'another_booking' }
  ];
  assert.deepEqual(uniqueAlternativeRequests(records).map(record => record._id), ['first', 'another']);
});
test('malformed responses or rows without identifiers cannot become queue records', () => {
  assert.deepEqual(uniqueAlternativeRequests(null), []);
  assert.deepEqual(uniqueAlternativeRequests([null, {}, { request_type: 'alternative_property' }]), []);
});

test('alternate notifications open the booking in the recipient panel', () => {
  const meta = { requestType: 'alternative_property', bookingId: '6ae2d7acc92162010feba254' };
  assert.equal(alternateRequestNotificationPath('refund_request', meta, '/employee/overview'), '/employee/property/request-alternate?bookingId=6ae2d7acc92162010feba254');
  assert.equal(alternateRequestNotificationPath('refund_request', meta, '/superadmin/property-overview'), '/superadmin/property/request-alternate?bookingId=6ae2d7acc92162010feba254');
});
test('unrelated notifications and missing booking IDs do not trigger alternate navigation', () => {
  for (const [type, meta] of [['other', { requestType: 'alternative_property', bookingId: 'id' }], ['refund_request', { requestType: 'refund', bookingId: 'id' }], ['refund_request', { requestType: 'alternative_property' }]]) {
    assert.equal(alternateRequestNotificationPath(type, meta), '');
  }
});

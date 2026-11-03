import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOwnerReportCsv } from './ownerReportCsv.js';

test('CSV preserves commas, quotes, newlines and Indian names', () => {
  assert.equal(buildOwnerReportCsv([{ Name: 'सीमा, "Owner"', Notes: 'first\nsecond' }]),
    '"Name","Notes"\r\n"सीमा, ""Owner""","first\nsecond"');
});

test('CSV neutralizes formulas and leading control characters', () => {
  for (const text of ['=1+1', '+SUM(A1)', '-1+2', '@SUM(A1)', '  =1', '\t=1', '\rtext', '\ntext']) {
    assert.equal(buildOwnerReportCsv([{ Name: text }]), `"Name"\r\n"'${text}"`);
  }
});

test('CSV neutralizes malicious column names too', () => {
  assert.equal(buildOwnerReportCsv([{ '=HYPERLINK()': 'safe' }]), '"\'=HYPERLINK()"\r\n"safe"');
});

test('CSV retains numeric values and empty cells', () => {
  assert.equal(buildOwnerReportCsv([{ Amount: -25, Zero: 0, Missing: null }]), '"Amount","Zero","Missing"\r\n"-25","0",""');
});

test('empty results produce an honest downloadable message', () => {
  assert.equal(buildOwnerReportCsv([]), '"No data found for the selected date range and filters"');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseIni } from './iniParser';

test('collects duplicate keys into arrays', () => {
  const r = parseIni('[S]\nk = a\nk = b\n');
  assert.deepEqual(r.sections['S'].keys['k'], ['a', 'b']);
});

test('single key is still an array of one', () => {
  const r = parseIni('[S]\nk = a\n');
  assert.deepEqual(r.sections['S'].keys['k'], ['a']);
});

test('preserves bare lines (no equals) per section', () => {
  const r = parseIni('[Member]\nstaff\nzoo\naqua\n');
  assert.deepEqual(r.sections['Member'].bare, ['staff', 'zoo', 'aqua']);
});

test('trims whitespace around key and value', () => {
  const r = parseIni('[S]\n  cPurchaseCost   =   120  \n');
  assert.deepEqual(r.sections['S'].keys['cPurchaseCost'], ['120']);
});

test('skips comment and blank lines', () => {
  const r = parseIni('; a comment\n\n[S]\nk = v\n');
  assert.deepEqual(Object.keys(r.sections), ['S']);
  assert.deepEqual(r.sections['S'].keys['k'], ['v']);
});

test('keeps top-level keys before any section under ""', () => {
  const r = parseIni('top = 1\n[S]\nk = v\n');
  assert.deepEqual(r.sections[''].keys['top'], ['1']);
});

test('value may itself contain equals signs', () => {
  const r = parseIni('[S]\nIcon = objects/x/SE=SE\n');
  assert.deepEqual(r.sections['S'].keys['Icon'], ['objects/x/SE=SE']);
});

test('handles CRLF line endings', () => {
  const r = parseIni('[S]\r\nk = v\r\n');
  assert.deepEqual(r.sections['S'].keys['k'], ['v']);
});

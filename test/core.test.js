import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseConnectionHeader, parseKeepAliveHeader, parseKeepAlive } from '../src/core.js';

test('parseConnectionHeader returns lowercase tokens', () => {
  const tokens = parseConnectionHeader('Keep-Alive, Upgrade');
  assert.ok(tokens instanceof Set);
  assert.ok(tokens.has('keep-alive'));
  assert.ok(tokens.has('upgrade'));
  assert.equal(tokens.size, 2);
});

test('parseConnectionHeader ignores empty and invalid entries', () => {
  const tokens = parseConnectionHeader(' , , keep-alive ,, bad token, ');
  assert.ok(tokens.has('keep-alive'));
  assert.equal(tokens.size, 1);
});

test('parseConnectionHeader handles null and undefined', () => {
  assert.equal(parseConnectionHeader(null).size, 0);
  assert.equal(parseConnectionHeader(undefined).size, 0);
  assert.equal(parseConnectionHeader('').size, 0);
});

test('parseKeepAliveHeader parses timeout and max', () => {
  const result = parseKeepAliveHeader('timeout=5, max=1000');
  assert.deepEqual(result, { timeout: 5, max: 1000 });
});

test('parseKeepAliveHeader is case-insensitive for names', () => {
  const result = parseKeepAliveHeader('Timeout=5, MAX=1000');
  assert.deepEqual(result, { timeout: 5, max: 1000 });
});

test('parseKeepAliveHeader ignores unknown parameters', () => {
  const result = parseKeepAliveHeader('timeout=5, foo=bar, max=10');
  assert.deepEqual(result, { timeout: 5, max: 10 });
});

test('parseKeepAliveHeader treats malformed values as absent', () => {
  const result = parseKeepAliveHeader('timeout=abc, max=-1');
  assert.deepEqual(result, { timeout: null, max: null });
});

test('parseKeepAliveHeader allows explicit zero', () => {
  const result = parseKeepAliveHeader('timeout=0, max=0');
  assert.deepEqual(result, { timeout: 0, max: 0 });
});

test('parseKeepAliveHeader handles null and undefined', () => {
  assert.deepEqual(parseKeepAliveHeader(null), { timeout: null, max: null });
  assert.deepEqual(parseKeepAliveHeader(undefined), { timeout: null, max: null });
});

test('parseKeepAlive combines both headers', () => {
  const result = parseKeepAlive('keep-alive, Upgrade', 'timeout=5, max=10');
  assert.deepEqual(result, { keepAlive: true, timeout: 5, max: 10 });
});

test('parseKeepAlive reports keepAlive false when token absent', () => {
  const result = parseKeepAlive('close', 'timeout=5');
  assert.deepEqual(result, { keepAlive: false, timeout: 5, max: null });
});

test('parseKeepAlive returns nulls when headers missing', () => {
  const result = parseKeepAlive(null, null);
  assert.deepEqual(result, { keepAlive: false, timeout: null, max: null });
});

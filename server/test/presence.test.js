import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPresenceTracker } from '../src/utils/presence.js';

test('first socket brings a user online, later sockets do not', () => {
  const p = createPresenceTracker();
  assert.equal(p.add('u1', 's1'), true);
  assert.equal(p.add('u1', 's2'), false);
  assert.equal(p.isOnline('u1'), true);
});

test('user goes offline only when the last socket disconnects', () => {
  const p = createPresenceTracker();
  p.add('u1', 's1');
  p.add('u1', 's2');
  assert.equal(p.remove('u1', 's1'), false);
  assert.equal(p.isOnline('u1'), true);
  assert.equal(p.remove('u1', 's2'), true);
  assert.equal(p.isOnline('u1'), false);
});

test('removing an unknown socket or user changes nothing', () => {
  const p = createPresenceTracker();
  assert.equal(p.remove('nobody', 's1'), false);
  p.add('u1', 's1');
  assert.equal(p.remove('u1', 'other'), false);
  assert.equal(p.isOnline('u1'), true);
});

test('onlineIds and count list each online user once', () => {
  const p = createPresenceTracker();
  p.add('u1', 's1');
  p.add('u1', 's2');
  p.add('u2', 's3');
  assert.deepEqual(p.onlineIds().sort(), ['u1', 'u2']);
  assert.equal(p.count(), 2);
  p.remove('u2', 's3');
  assert.deepEqual(p.onlineIds(), ['u1']);
});

test('a user can come online again after going offline', () => {
  const p = createPresenceTracker();
  p.add('u1', 's1');
  p.remove('u1', 's1');
  assert.equal(p.add('u1', 's9'), true);
});

test('ids are compared as strings', () => {
  const p = createPresenceTracker();
  p.add(123, 's1');
  assert.equal(p.isOnline('123'), true);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canAdvance, groupIdsBySender, statusRank } from '../src/utils/status.js';

test('status order is sent, delivered, read', () => {
  assert.ok(statusRank('sent') < statusRank('delivered'));
  assert.ok(statusRank('delivered') < statusRank('read'));
  assert.equal(statusRank('bogus'), -1);
});

test('a status can only move forward', () => {
  assert.equal(canAdvance('sent', 'delivered'), true);
  assert.equal(canAdvance('sent', 'read'), true);
  assert.equal(canAdvance('delivered', 'read'), true);
  assert.equal(canAdvance('read', 'delivered'), false);
  assert.equal(canAdvance('delivered', 'delivered'), false);
  assert.equal(canAdvance('read', 'sent'), false);
});

test('unknown statuses never advance', () => {
  assert.equal(canAdvance('bogus', 'read'), false);
  assert.equal(canAdvance('sent', 'bogus'), false);
});

test('groupIdsBySender collects message ids per sender as strings', () => {
  const messages = [
    { _id: 'm1', sender: 'alice' },
    { _id: 'm2', sender: 'bob' },
    { _id: 'm3', sender: 'alice' },
  ];
  assert.deepEqual(groupIdsBySender(messages), { alice: ['m1', 'm3'], bob: ['m2'] });
  assert.deepEqual(groupIdsBySender([]), {});
});

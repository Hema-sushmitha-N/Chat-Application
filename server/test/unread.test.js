import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUnreadMatch, toCounts } from '../src/utils/unread.js';

const me = 'me';

test('nothing to count gives null', () => {
  assert.equal(buildUnreadMatch({ me, senders: [], roomIds: [], lastRead: new Map() }), null);
});

test('one-to-one branch only counts messages after the last read time', () => {
  const at = new Date('2026-01-01');
  const match = buildUnreadMatch({
    me,
    senders: ['bob', 'cy'],
    roomIds: [],
    lastRead: new Map([['user:bob', at]]),
  });
  assert.deepEqual(match.$or, [
    { sender: 'bob', receiver: me, createdAt: { $gt: at } },
    { sender: 'cy', receiver: me }, // never opened: everything counts
  ]);
});

test('room branch excludes my own messages', () => {
  const at = new Date('2026-01-01');
  const match = buildUnreadMatch({ me, senders: [], roomIds: ['r1'], lastRead: new Map([['room:r1', at]]) });
  assert.deepEqual(match.$or, [{ room: 'r1', sender: { $ne: me }, createdAt: { $gt: at } }]);
});

test('toCounts names rooms and people the way the client does', () => {
  const rows = [
    { _id: 'a_b', sender: 'bob', n: 3 },
    { _id: 'room_r1', room: 'r1', sender: 'cy', n: 2 },
    { _id: 'x', sender: 'dee', n: 0 },
  ];
  assert.deepEqual(toCounts(rows), { 'user:bob': 3, 'room:r1': 2 });
});

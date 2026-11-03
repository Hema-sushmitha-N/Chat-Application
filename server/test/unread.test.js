import { test, afterEach, mock } from 'node:test';
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

import mongoose from 'mongoose';
import Message from '../src/models/Message.js';
import Room from '../src/models/Room.js';
import ReadState from '../src/models/ReadState.js';
import { getUnread } from '../src/controllers/unreadController.js';

afterEach(() => mock.restoreAll());

test('unread aggregation uses ObjectIds and one count query for private chats and rooms', async () => {
  const me = new mongoose.Types.ObjectId();
  const sender = new mongoose.Types.ObjectId();
  const room = new mongoose.Types.ObjectId();
  const lastReadAt = new Date('2026-01-01');
  mock.method(ReadState, 'find', () => ({ lean: async () => [{ key: `user:${sender}`, lastReadAt }] }));
  mock.method(Message, 'distinct', async () => [sender]);
  mock.method(Room, 'find', () => ({ select: () => ({ lean: async () => [{ _id: room }] }) }));
  const aggregate = mock.method(Message, 'aggregate', async () => [
    { sender, n: 2 }, { room, sender, n: 3 },
  ]);
  let response;
  await getUnread({ userId: me.toString() }, { json: (body) => { response = body; } }, (err) => { throw err; });
  assert.equal(aggregate.mock.callCount(), 1);
  const branches = aggregate.mock.calls[0].arguments[0][0].$match.$or;
  assert.ok(branches[0].receiver instanceof mongoose.Types.ObjectId);
  assert.ok(branches[1].sender.$ne instanceof mongoose.Types.ObjectId);
  assert.ok(branches[0].receiver.equals(me));
  assert.deepEqual(branches[0].createdAt, { $gt: lastReadAt });
  assert.deepEqual(response, { counts: { [`user:${sender}`]: 2, [`room:${room}`]: 3 } });
});

test('unread endpoint skips aggregation when there are no conversations', async () => {
  mock.method(ReadState, 'find', () => ({ lean: async () => [] }));
  mock.method(Message, 'distinct', async () => []);
  mock.method(Room, 'find', () => ({ select: () => ({ lean: async () => [] }) }));
  const aggregate = mock.method(Message, 'aggregate', async () => []);
  let response;
  await getUnread({ userId: new mongoose.Types.ObjectId().toString() }, { json: (body) => { response = body; } }, (err) => { throw err; });
  assert.deepEqual(response, { counts: {} });
  assert.equal(aggregate.mock.callCount(), 0);
});

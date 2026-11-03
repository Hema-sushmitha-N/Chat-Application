import Message from '../models/Message.js';
import mongoose from 'mongoose';
import Room from '../models/Room.js';
import ReadState, { markRead } from '../models/ReadState.js';
import { isConversationKey } from '../utils/validators.js';
import { buildUnreadMatch, toCounts } from '../utils/unread.js';

// GET /api/unread
// -> { counts: { 'user:<id>': 3, 'room:<id>': 1 } }  (only conversations that have unread messages)
export async function getUnread(req, res, next) {
  try {
    // Mongoose casts find/distinct filters, but does not cast aggregation stages.
    const me = new mongoose.Types.ObjectId(req.userId);
    const [states, senders, myRooms] = await Promise.all([
      ReadState.find({ user: me }).lean(),
      Message.distinct('sender', { receiver: me }),
      Room.find({ members: me }).select('_id').lean(),
    ]);

    const match = buildUnreadMatch({
      me,
      senders,
      roomIds: myRooms.map((r) => r._id),
      lastRead: new Map(states.map((s) => [s.key, s.lastReadAt])),
    });
    if (!match) return res.json({ counts: {} });

    // One query for every conversation. A one-to-one conversationId only ever holds messages
    // from a single sender to me here, so grouping by conversationId gives one row per chat.
    const rows = await Message.aggregate([
      { $match: match },
      { $group: { _id: '$conversationId', room: { $first: '$room' }, sender: { $first: '$sender' }, n: { $sum: 1 } } },
    ]);

    return res.json({ counts: toCounts(rows) });
  } catch (err) {
    return next(err);
  }
}

// POST /api/unread/read { key }: the user has looked at this conversation
export async function markConversationRead(req, res, next) {
  try {
    const key = req.body?.key;
    if (!isConversationKey(key)) return res.status(400).json({ message: 'Invalid conversation key' });

    await markRead(req.userId, key);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

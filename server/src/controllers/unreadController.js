import Message from '../models/Message.js';
import Room from '../models/Room.js';
import ReadState, { markRead } from '../models/ReadState.js';
import { isConversationKey } from '../utils/validators.js';

const countSince = (filter, since) =>
  Message.countDocuments(since ? { ...filter, createdAt: { $gt: since } } : filter);

// GET /api/unread
// -> { counts: { 'user:<id>': 3, 'room:<id>': 1 } }  (only conversations that have unread messages)
export async function getUnread(req, res, next) {
  try {
    const me = req.userId;
    const [states, senders, myRooms] = await Promise.all([
      ReadState.find({ user: me }).lean(),
      Message.distinct('sender', { receiver: me }),
      Room.find({ members: me }).select('_id').lean(),
    ]);
    const lastRead = new Map(states.map((s) => [s.key, s.lastReadAt]));

    const counts = {};
    const jobs = [];

    // One-to-one: messages other people sent to me since I last opened that chat
    for (const sender of senders) {
      const key = `user:${sender}`;
      jobs.push(
        countSince({ sender, receiver: me }, lastRead.get(key)).then((n) => {
          if (n > 0) counts[key] = n;
        })
      );
    }

    // Rooms: messages from other members since I last opened the room
    for (const room of myRooms) {
      const key = `room:${room._id}`;
      jobs.push(
        countSince({ room: room._id, sender: { $ne: me } }, lastRead.get(key)).then((n) => {
          if (n > 0) counts[key] = n;
        })
      );
    }

    await Promise.all(jobs);
    return res.json({ counts });
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

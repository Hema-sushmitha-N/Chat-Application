import Message from '../models/Message.js';
import { isObjectId } from '../utils/validators.js';
import { groupIdsBySender } from '../utils/status.js';

// Messages sent to a user who had no open connection are saved with status 'sent'.
// When that user connects, they are delivered in one batch and marked 'delivered'.
//
// Event sent to the receiver:  offline:messages { messages: [ ... ] }  (oldest first)
// Event sent to each sender:   message:status { ids: [...], status: 'delivered' }
export async function flushPending(io, socket) {
  const pending = await Message.find({ receiver: socket.userId, status: 'sent' })
    .sort({ createdAt: 1 })
    .limit(500);
  if (pending.length === 0) return;

  // Send first, then mark. If marking fails the batch is simply sent again next time,
  // and the client ignores messages it already has.
  socket.emit('offline:messages', { messages: pending.map((m) => m.toPublic()) });
  await Message.updateMany(
    { _id: { $in: pending.map((m) => m._id) } },
    { $set: { status: 'delivered' } }
  );

  // Let the senders see the second tick
  const bySender = groupIdsBySender(pending);
  for (const [sender, ids] of Object.entries(bySender)) {
    io.to(`user:${sender}`).emit('message:status', { ids, status: 'delivered' });
  }
}

// Client emits:  conversation:read { with: userId }   (the user opened, or is looking at, that chat)
// Sender gets:   message:status { ids: [...], status: 'read' }
export function registerDelivery(io, socket) {
  socket.on('conversation:read', async (payload) => {
    try {
      if (!payload || !isObjectId(payload.with)) return;

      const unread = await Message.find({
        sender: payload.with,
        receiver: socket.userId,
        status: { $ne: 'read' },
      }).select('_id');
      if (unread.length === 0) return;

      const ids = unread.map((m) => m._id);
      await Message.updateMany({ _id: { $in: ids } }, { $set: { status: 'read' } });
      io.to(`user:${payload.with}`).emit('message:status', {
        ids: ids.map(String),
        status: 'read',
      });
    } catch (err) {
      console.error('conversation:read failed', err);
    }
  });
}

import Message from '../models/Message.js';

// Messages sent to a user who had no open connection are saved with status 'sent'.
// When that user connects, they are delivered in one batch and marked 'delivered'.
//
// Event sent to the client:  offline:messages { messages: [ ... ] }  (oldest first)
export async function flushPending(socket) {
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
}

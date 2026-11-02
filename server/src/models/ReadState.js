import mongoose from 'mongoose';

// Remembers, for each user and conversation, when the user last looked at it.
// key is 'user:<otherUserId>' for a one-to-one chat or 'room:<roomId>' for a chat room.
// Messages newer than lastReadAt (and not written by the user) count as unread.
const readStateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    key: { type: String, required: true },
    lastReadAt: { type: Date, required: true },
  },
  { timestamps: true }
);

readStateSchema.index({ user: 1, key: 1 }, { unique: true });

const ReadState = mongoose.model('ReadState', readStateSchema);

export async function markRead(userId, key, at = new Date()) {
  try {
    await ReadState.updateOne({ user: userId, key }, { $set: { lastReadAt: at } }, { upsert: true });
  } catch (err) {
    // Two requests created the same record at once: the other one already did the job
    if (err.code !== 11000) throw err;
  }
}

export default ReadState;

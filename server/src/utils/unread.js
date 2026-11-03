// Helpers for counting unread messages with ONE database query instead of one per conversation.
// Plain functions with no database code, so they can be unit tested.

// lastRead: Map of 'user:<id>' / 'room:<id>' -> Date the user last opened that conversation
// Returns a MongoDB filter matching every unread message of the user (or null if there is nothing to count).
export function buildUnreadMatch({ me, senders, roomIds, lastRead }) {
  const since = (key) => {
    const at = lastRead.get(key);
    return at ? { createdAt: { $gt: at } } : {};
  };

  const branches = [
    // One-to-one: messages other people sent to me since I last opened that chat
    ...senders.map((sender) => ({ sender, receiver: me, ...since(`user:${sender}`) })),
    // Rooms: messages from other members since I last opened the room
    ...roomIds.map((room) => ({ room, sender: { $ne: me }, ...since(`room:${room}`) })),
  ];
  return branches.length ? { $or: branches } : null;
}

// Turns the grouped rows of the aggregation into { 'user:<id>': n, 'room:<id>': n }
// A row is { _id: conversationId, room?, sender, n }.
export function toCounts(rows) {
  const counts = {};
  for (const row of rows) {
    if (!row.n) continue;
    const key = row.room ? `room:${row.room}` : `user:${row.sender}`;
    counts[key] = row.n;
  }
  return counts;
}

// Combine the messages already on screen with a freshly loaded batch.
// Duplicates (same id) collapse into one, the newer copy wins, and the result is oldest first.
export function mergeMessages(current, incoming) {
  const byId = new Map(current.map((m) => [m.id, m]));
  incoming.forEach((m) => byId.set(m.id, m));
  return [...byId.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

const STATUS_ORDER = ['sent', 'delivered', 'read'];

// Set the delivery status of the messages whose ids are listed. A status only moves forward,
// so a late "delivered" never replaces "read".
export function applyStatus(messages, ids, status) {
  const idSet = new Set(ids);
  const newRank = STATUS_ORDER.indexOf(status);
  return messages.map((m) =>
    idSet.has(m.id) && STATUS_ORDER.indexOf(m.status) < newRank ? { ...m, status } : m
  );
}

// Which conversation a message belongs to, named the way the server names it:
// 'room:<roomId>' for group messages, 'user:<otherUserId>' for one-to-one messages.
export function messageKey(message, myId) {
  if (message.room) return `room:${message.room}`;
  const otherId = message.sender === myId ? message.receiver : message.sender;
  return `user:${otherId}`;
}

// Combine the messages already on screen with a freshly loaded batch.
// Duplicates (same id) collapse into one, the newer copy wins, and the result is oldest first.
export function mergeMessages(current, incoming) {
  const byId = new Map(current.map((m) => [m.id, m]));
  incoming.forEach((m) => byId.set(m.id, m));
  return [...byId.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

// Which conversation a message belongs to, named the way the server names it:
// 'room:<roomId>' for group messages, 'user:<otherUserId>' for one-to-one messages.
export function messageKey(message, myId) {
  if (message.room) return `room:${message.room}`;
  const otherId = message.sender === myId ? message.receiver : message.sender;
  return `user:${otherId}`;
}

// Combine the messages already on screen with a freshly loaded batch.
// Duplicates (same id) collapse into one, the newer copy wins, and the result is oldest first.
export function mergeMessages(current, incoming) {
  const byId = new Map(current.map((m) => [m.id, m]));
  incoming.forEach((m) => byId.set(m.id, m));
  return [...byId.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

// Tracks which users are online. One user can have several sockets (tabs, devices),
// and counts as online while at least one of them is connected.
export function createPresenceTracker() {
  const sockets = new Map(); // userId -> Set of socket ids

  return {
    // Returns true when this socket just made the user come online
    add(userId, socketId) {
      const key = String(userId);
      const cameOnline = !sockets.has(key);
      if (cameOnline) sockets.set(key, new Set());
      sockets.get(key).add(socketId);
      return cameOnline;
    },

    // Returns true when that was the user's last socket (they just went offline)
    remove(userId, socketId) {
      const key = String(userId);
      const set = sockets.get(key);
      if (!set || !set.delete(socketId)) return false;
      if (set.size > 0) return false;
      sockets.delete(key);
      return true;
    },

    isOnline(userId) {
      return sockets.has(String(userId));
    },

    onlineIds() {
      return [...sockets.keys()];
    },

    count() {
      return sockets.size;
    },
  };
}

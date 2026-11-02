import { createPresenceTracker } from '../utils/presence.js';

// One tracker for the whole server process
export const presence = createPresenceTracker();

// Events sent to clients:
//   presence:list   { online: [userId, ...] }          full list, on connect or on request
//   presence:update { userId, online: true | false }   a user came online or went offline
export function registerPresence(io, socket) {
  const cameOnline = presence.add(socket.userId, socket.id);

  // The new connection learns who is online; everyone else only hears about changes
  socket.emit('presence:list', { online: presence.onlineIds() });
  if (cameOnline) {
    socket.broadcast.emit('presence:update', { userId: socket.userId, online: true });
  }

  socket.on('presence:request', () => {
    socket.emit('presence:list', { online: presence.onlineIds() });
  });

  socket.on('disconnect', () => {
    if (presence.remove(socket.userId, socket.id)) {
      io.emit('presence:update', { userId: socket.userId, online: false });
    }
  });
}

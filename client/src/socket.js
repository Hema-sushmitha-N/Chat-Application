import { io } from 'socket.io-client';
import { API_URL, tokenStore } from './api.js';

let socket = null;

// Opens (or reuses) the authenticated socket connection
export function connectSocket() {
  if (socket) return socket;
  socket = io(API_URL, {
    // A function, so every reconnection sends the current token
    auth: (cb) => cb({ token: tokenStore.get() }),
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

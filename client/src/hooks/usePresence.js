import { useEffect, useState } from 'react';
import { connectSocket } from '../socket.js';

// The set of user ids that are online right now, kept live by the server
export default function usePresence() {
  const [online, setOnline] = useState(() => new Set());

  useEffect(() => {
    const socket = connectSocket();

    const onList = ({ online: ids }) => setOnline(new Set(ids));
    const onUpdate = ({ userId, online: isOnline }) => {
      setOnline((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    socket.on('presence:list', onList);
    socket.on('presence:update', onUpdate);
    // If the socket connected before this hook mounted, the list was already sent: ask again
    if (socket.connected) socket.emit('presence:request');

    return () => {
      socket.off('presence:list', onList);
      socket.off('presence:update', onUpdate);
    };
  }, []);

  return online;
}

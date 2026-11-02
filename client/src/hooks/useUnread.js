import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';

// Unread message counts per conversation: { 'user:<id>': 3, 'room:<id>': 1 }
export default function useUnread() {
  const [counts, setCounts] = useState({});

  // The server is the source of truth (it survives refreshes and other devices)
  const reload = useCallback(() => {
    api.unread().then((d) => setCounts(d.counts)).catch(() => {});
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // A message arrived in a conversation that is not open
  const bump = useCallback((key) => {
    setCounts((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  }, []);

  // The user is looking at this conversation: clear the badge and tell the server
  const clear = useCallback((key) => {
    setCounts((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    api.markRead(key).catch(() => {});
  }, []);

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return { counts, total, bump, clear, reload };
}

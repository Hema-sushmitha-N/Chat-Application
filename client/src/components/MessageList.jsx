import { useEffect, useRef } from 'react';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const STATUS_TITLE = { sent: 'Sent', delivered: 'Delivered', read: 'Read' };

// names: { [userId]: username }. In a room (showSender) each incoming message shows who wrote it.
// Your own one-to-one messages show ticks: one = sent, two = delivered, blue two = read.
export default function MessageList({ messages, currentUserId, names = {}, showSender = false }) {
  const endRef = useRef(null);

  // Keep the newest message in view
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return <div className="messages empty muted">No messages yet. Say hello!</div>;
  }

  return (
    <div className="messages">
      {messages.map((m) => {
        const mine = m.sender === currentUserId;
        const status = mine && m.receiver ? m.status || 'sent' : null;
        return (
          <div key={m.id} className={`bubble ${mine ? 'mine' : 'theirs'}`}>
            {showSender && !mine && <div className="sender">{names[m.sender] || 'Unknown user'}</div>}
            <div className="text">{m.text}</div>
            <div className="time">
              {formatTime(m.createdAt)}
              {status && (
                <span className={`ticks ${status}`} title={STATUS_TITLE[status]}>
                  {status === 'sent' ? '✓' : '✓✓'}
                </span>
              )}
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

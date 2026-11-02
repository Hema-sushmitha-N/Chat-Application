// onlineIds: Set of user ids that are online (shows a green dot on the avatar)
export default function ConversationList({ users, activeId, onSelect, onlineIds = new Set() }) {
  if (users.length === 0) {
    return <p className="muted pad">No other users yet. Register a second account to start chatting.</p>;
  }

  return (
    <ul className="conversation-list">
      {users.map((u) => (
        <li key={u.id}>
          <button
            className={`conversation ${u.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(u)}
          >
            <span className="avatar">
              {u.username[0].toUpperCase()}
              {onlineIds.has(u.id) && <span className="dot" title="Online" />}
            </span>
            <span>{u.username}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

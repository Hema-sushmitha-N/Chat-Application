// onlineIds: Set of user ids that are online (shows a green dot on the avatar)
// unread: { 'user:<id>': count } (shows a badge)
export default function ConversationList({
  users,
  activeId,
  onSelect,
  onlineIds = new Set(),
  unread = {},
}) {
  if (users.length === 0) {
    return <p className="muted pad">No other users yet. Register a second account to start chatting.</p>;
  }

  return (
    <ul className="conversation-list">
      {users.map((u) => {
        const count = unread[`user:${u.id}`] || 0;
        return (
          <li key={u.id}>
            <button
              className={`conversation ${u.id === activeId ? 'active' : ''}`}
              onClick={() => onSelect(u)}
            >
              <span className="avatar">
                {u.username[0].toUpperCase()}
                {onlineIds.has(u.id) && <span className="dot" title="Online" />}
              </span>
              <span className="grow">{u.username}</span>
              {count > 0 && <span className="badge">{count > 99 ? '99+' : count}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

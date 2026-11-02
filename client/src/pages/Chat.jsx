import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { connectSocket } from '../socket.js';
import usePresence from '../hooks/usePresence.js';
import useTyping from '../hooks/useTyping.js';
import useUnread from '../hooks/useUnread.js';
import ConversationList from '../components/ConversationList.jsx';
import RoomList from '../components/RoomList.jsx';
import RoomInfo from '../components/RoomInfo.jsx';
import MessageList from '../components/MessageList.jsx';
import MessageInput from '../components/MessageInput.jsx';
import ConnectionBanner from '../components/ConnectionBanner.jsx';
import TypingIndicator from '../components/TypingIndicator.jsx';
import Toasts from '../components/Toasts.jsx';
import { mergeMessages, messageKey } from '../utils/messages.js';
import {
  notificationPermission,
  requestNotificationPermission,
  showDesktopNotification,
} from '../utils/notify.js';

const fetchHistory = (conversation) =>
  conversation.type === 'room' ? api.roomHistory(conversation.id) : api.history(conversation.id);

const STATUS_LABEL = {
  connected: 'Connected',
  connecting: 'Connecting...',
  reconnecting: 'Reconnecting...',
};

export default function Chat() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  // The open conversation: { type: 'user' | 'room', id, name }
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  // 'connecting' (first connect) | 'connected' | 'reconnecting' (lost it, retrying)
  const [connection, setConnection] = useState('connecting');
  const connected = connection === 'connected';
  const [error, setError] = useState('');
  const online = usePresence();
  const typingIds = useTyping(active);
  const { counts: unread, total: unreadTotal, bump, clear, reload: reloadUnread } = useUnread();
  const [toasts, setToasts] = useState([]);
  const [notifPermission, setNotifPermission] = useState(notificationPermission());
  const usersRef = useRef(users);
  usersRef.current = users;
  const roomsRef = useRef(rooms);
  roomsRef.current = rooms;
  const namesRef = useRef({});
  const activeRef = useRef(active);
  activeRef.current = active;
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const loadUsers = useCallback(() => {
    api.users().then((d) => setUsers(d.users)).catch((e) => setError(e.message));
  }, []);

  const loadRooms = useCallback(() => {
    api.rooms().then((d) => setRooms(d.rooms)).catch((e) => setError(e.message));
  }, []);

  // Conversation list and rooms
  useEffect(() => {
    loadUsers();
    loadRooms();
  }, [loadUsers, loadRooms]);

  // Someone we have not seen before came online (a new account): refresh the user list
  useEffect(() => {
    const socket = connectSocket();
    const onUpdate = ({ userId }) => {
      if (userId !== user.id && !usersRef.current.some((u) => u.id === userId)) loadUsers();
    };
    socket.on('presence:update', onUpdate);
    return () => socket.off('presence:update', onUpdate);
  }, [user.id, loadUsers]);

  const addToast = useCallback((title, text) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-2), { id, title, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // The tab title shows how many unread messages are waiting
  useEffect(() => {
    document.title = unreadTotal > 0 ? `(${unreadTotal}) ChatSphere` : 'ChatSphere';
  }, [unreadTotal]);

  // After a dropped connection: reload lists and fetch the messages missed while away
  const resync = useCallback(async () => {
    loadUsers();
    loadRooms();
    reloadUnread();
    const current = activeRef.current;
    if (!current) return;
    try {
      const data = await fetchHistory(current);
      // Ignore the result if the user opened another conversation meanwhile
      if (activeRef.current !== current) return;
      setMessages((prev) => mergeMessages(prev, data.messages));
    } catch {
      // Still offline or the token expired: the next reconnect tries again
    }
  }, [loadUsers, loadRooms, reloadUnread]);

  // Socket connection state
  useEffect(() => {
    const socket = connectSocket();
    let hasConnected = socket.connected;

    const onConnect = () => {
      setConnection('connected');
      setError('');
      if (hasConnected) resync(); // this is a reconnection, not the first connect
      hasConnected = true;
    };
    const onDisconnect = (reason) => {
      setConnection('reconnecting');
      // The server closed the connection itself: Socket.IO does not retry in that case
      if (reason === 'io server disconnect') socket.connect();
    };
    const onError = (err) => {
      if (err.message === 'Authentication failed') {
        logoutRef.current(); // the saved token is invalid or expired
      } else {
        setConnection((c) => (c === 'connected' ? 'reconnecting' : c));
      }
    };

    if (socket.connected) setConnection('connected');
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
    };
  }, [resync]);

  // A room was created, joined or left by someone: refresh the list
  useEffect(() => {
    const socket = connectSocket();
    socket.on('room:updated', loadRooms);
    return () => socket.off('room:updated', loadRooms);
  }, [loadRooms]);

  // A new message: show it if its conversation is open, otherwise count it and notify
  useEffect(() => {
    const socket = connectSocket();
    const onNew = (msg) => {
      const key = messageKey(msg, user.id);
      const isOpen = active && key === `${active.type}:${active.id}`;

      if (isOpen) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        if (msg.sender !== user.id) clear(key); // the user is looking at it, so it counts as read
        return;
      }
      if (msg.sender === user.id) return; // our own message, sent from another tab

      bump(key);
      const sender = namesRef.current[msg.sender] || 'Someone';
      const room = msg.room ? roomsRef.current.find((r) => r.id === msg.room) : null;
      const title = room ? `# ${room.name}` : sender;
      const preview = msg.text.length > 80 ? `${msg.text.slice(0, 80)}...` : msg.text;
      const text = room ? `${sender}: ${preview}` : preview;
      addToast(title, text);
      showDesktopNotification(title, text);
    };
    socket.on('message:new', onNew);
    return () => socket.off('message:new', onNew);
  }, [active, user.id, bump, clear, addToast]);

  // Messages that arrived while we were offline are delivered in one batch on connect
  useEffect(() => {
    const socket = connectSocket();
    const onOffline = ({ messages: missed }) => {
      if (!missed || missed.length === 0) return;

      const fromNames = [...new Set(missed.map((m) => namesRef.current[m.sender] || 'someone'))];
      const who = fromNames.slice(0, 3).join(', ') + (fromNames.length > 3 ? ' and others' : '');
      const text = `${missed.length} new message${missed.length === 1 ? '' : 's'} from ${who}`;
      addToast('While you were away', text);
      showDesktopNotification('While you were away', text);

      reloadUnread(); // the badges come from the database, which already has these messages

      // If the open conversation is one of them, show the messages straight away
      const current = activeRef.current;
      if (!current) return;
      const key = `${current.type}:${current.id}`;
      const relevant = missed.filter((m) => messageKey(m, user.id) === key);
      if (relevant.length > 0) {
        setMessages((prev) => mergeMessages(prev, relevant));
        clear(key);
      }
    };
    socket.on('offline:messages', onOffline);
    return () => socket.off('offline:messages', onOffline);
  }, [user.id, addToast, reloadUnread, clear]);

  // Open a conversation (a user or a room), mark it read and load its stored history
  const openConversation = useCallback(
    async (conversation) => {
      setActive(conversation);
      setMessages([]);
      setError('');
      clear(`${conversation.type}:${conversation.id}`);
      try {
        const data = await fetchHistory(conversation);
        setMessages(data.messages);
      } catch (e) {
        setError(e.message);
      }
    },
    [clear]
  );

  const selectUser = (u) => openConversation({ type: 'user', id: u.id, name: u.username });
  const selectRoom = (r) => openConversation({ type: 'room', id: r.id, name: r.name });

  async function createRoom(name) {
    const data = await api.createRoom(name); // errors are shown under the create form
    loadRooms();
    selectRoom(data.room);
  }

  async function joinRoom(room) {
    try {
      await api.joinRoom(room.id);
      loadRooms();
      selectRoom(room);
    } catch (e) {
      setError(e.message);
    }
  }

  async function leaveRoom() {
    try {
      await api.leaveRoom(active.id);
      setActive(null);
      loadRooms();
    } catch (e) {
      setError(e.message);
    }
  }

  // id -> username, so group messages can show who wrote them
  const names = { [user.id]: user.username };
  users.forEach((u) => {
    names[u.id] = u.username;
  });
  namesRef.current = names;

  async function enableNotifications() {
    setNotifPermission(await requestNotificationPermission());
  }

  // Tell the other side we started / stopped typing. volatile: dropped if offline, never queued.
  function sendTyping(isTyping) {
    if (!active) return;
    const payload = active.type === 'room' ? { room: active.id, isTyping } : { to: active.id, isTyping };
    connectSocket().volatile.emit('typing', payload);
  }

  function sendMessage(text) {
    setError('');
    const payload = active.type === 'room' ? { room: active.id, text } : { to: active.id, text };
    // timeout(): if no confirmation comes back in 8 seconds the user is told, instead of waiting forever
    connectSocket()
      .timeout(8000)
      .emit('message:send', payload, (err, res) => {
        if (err) {
          setError('The message was not confirmed. Check your connection and try again.');
          return;
        }
        if (!res?.ok) setError(res?.error || 'Could not send message');
      });
  }

  return (
    <div className="chat-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <strong>{user.username}</strong>
            <div className={`status ${connected ? 'online' : 'offline'}`}>
              {STATUS_LABEL[connection]}
            </div>
          </div>
          <button className="link" onClick={logout}>
            Log out
          </button>
        </div>
        {notifPermission === 'default' && (
          <button className="link small notif-button" onClick={enableNotifications}>
            Enable desktop notifications
          </button>
        )}
        <ConversationList
          users={users}
          activeId={active?.type === 'user' ? active.id : null}
          onSelect={selectUser}
          onlineIds={online}
          unread={unread}
        />
        <RoomList
          rooms={rooms}
          activeId={active?.type === 'room' ? active.id : null}
          onSelect={selectRoom}
          onCreate={createRoom}
          onJoin={joinRoom}
          unread={unread}
        />
      </aside>

      <main className="chat-main">
        <ConnectionBanner status={connection} />
        {active ? (
          <>
            <header className="chat-header">
              <span>
                {active.type === 'room' ? `# ${active.name}` : active.name}
                {active.type === 'user' && (
                  <span className={`presence ${online.has(active.id) ? 'online' : ''}`}>
                    {online.has(active.id) ? 'Online' : 'Offline'}
                  </span>
                )}
              </span>
              {active.type === 'room' && (
                <RoomInfo roomId={active.id} onLeave={leaveRoom} onlineIds={online} />
              )}
            </header>
            {error && <div className="error">{error}</div>}
            <MessageList
              messages={messages}
              currentUserId={user.id}
              names={names}
              showSender={active.type === 'room'}
            />
            <TypingIndicator ids={typingIds.filter((id) => id !== user.id)} names={names} />
            <MessageInput
              key={`${active.type}:${active.id}`}
              onSend={sendMessage}
              disabled={!connected}
              onTypingChange={sendTyping}
            />
          </>
        ) : (
          <div className="center-screen muted">Select a user or a room to start chatting</div>
        )}
      </main>
      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

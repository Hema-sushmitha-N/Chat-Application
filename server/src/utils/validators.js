import { sanitizeText, sanitizeLine } from './sanitize.js';

// Pure validation helpers. Each returns an array of error strings (empty = valid).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[A-Za-z0-9_]+$/;
const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;
const ROOM_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9 _-]*$/;

export const MAX_MESSAGE_LENGTH = 2000;
const MAX_EMAIL_LENGTH = 254;

const CONVERSATION_KEY_RE = /^(user|room):[a-f0-9]{24}$/i;

// 'user:<id>' (one-to-one chat) or 'room:<id>' (chat room): how the app names a conversation
export function isConversationKey(value) {
  return typeof value === 'string' && CONVERSATION_KEY_RE.test(value);
}

// True for a 24-character hex string (a MongoDB ObjectId)
export function isObjectId(value) {
  return typeof value === 'string' && OBJECT_ID_RE.test(value);
}

export function validateRegister(payload = {}) {
  const { username, email, password } = payload && typeof payload === 'object' ? payload : {};
  const errors = [];
  if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 30) {
    errors.push('Username must be 3-30 characters');
  } else if (!USERNAME_RE.test(username.trim())) {
    errors.push('Username may only contain letters, numbers and underscores');
  }
  if (typeof email !== 'string' || email.trim().length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email.trim())) {
    errors.push('A valid email is required');
  }
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    errors.push('Password must be at least 8 characters and at most 72 UTF-8 bytes');
  }
  return errors;
}

export function validateLogin(payload = {}) {
  const { email, password } = payload && typeof payload === 'object' ? payload : {};
  const errors = [];
  if (typeof email !== 'string' || email.trim().length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email.trim())) {
    errors.push('A valid email is required');
  }
  if (typeof password !== 'string' || password.length === 0 || Buffer.byteLength(password, 'utf8') > 72) {
    errors.push('Password is required and must not exceed 72 UTF-8 bytes');
  }
  return errors;
}

export function validateRoom(payload) {
  const { name } = payload && typeof payload === 'object' ? payload : {};
  const trimmed = sanitizeLine(name);
  const errors = [];
  if (trimmed.length < 2 || trimmed.length > 40) {
    errors.push('Room name must be 2-40 characters');
  } else if (!ROOM_NAME_RE.test(trimmed)) {
    errors.push('Room name may only contain letters, numbers, spaces, hyphens and underscores');
  }
  return errors;
}

// A message goes either to one user (`to`) or to a room (`room`), never both
export function validateMessage(payload) {
  const { to, room, text } = payload && typeof payload === 'object' ? payload : {};
  const errors = [];
  const hasTo = to !== undefined && to !== null;
  const hasRoom = room !== undefined && room !== null;
  if (hasTo === hasRoom) {
    errors.push('Send the message to either a user or a room');
  } else if (hasTo && !isObjectId(to)) {
    errors.push('Receiver id is invalid');
  } else if (hasRoom && !isObjectId(room)) {
    errors.push('Room id is invalid');
  }
  // Judge the text the way it will be stored (after cleaning), so "invisible" text counts as empty
  const clean = sanitizeText(text);
  if (clean.length === 0) {
    errors.push('Message cannot be empty');
  } else if (clean.length > MAX_MESSAGE_LENGTH) {
    errors.push(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);
  }
  return errors;
}

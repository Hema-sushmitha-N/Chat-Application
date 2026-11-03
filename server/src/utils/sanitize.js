// Cleaning of text that comes from users. No database or framework code, so it is easy to test.
//
// What we do NOT do: HTML-escape messages before saving them. The React client always shows text as
// text (never as HTML), so "<script>alert(1)</script>" appears literally and does nothing. Escaping
// on the server too would show "&lt;script&gt;" to users. Instead we remove characters that have no
// place in a chat message and could be used to trick readers or break storage.

// Control characters (NUL, escape codes, ...) except tab and newline
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
// Zero-width space / word joiner / byte order mark, and the invisible bidirectional overrides and
// isolates that can make text read in a different order than it was written
const INVISIBLE_CHARS = /[​⁠﻿‪-‮⁦-⁩]/g;

// Message text: keeps line breaks, removes unwanted characters, trims, allows at most one blank line in a row
export function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  const clean = value
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS, '')
    .replace(INVISIBLE_CHARS, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  // Joiners/variation selectors are needed inside emoji, but alone have no visible text.
  return clean.replace(/[\s\u200C\u200D\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/gu, '') ? clean : '';
}

// Names (rooms): like sanitizeText, but one line, with runs of spaces collapsed to a single space
export function sanitizeLine(value) {
  return sanitizeText(value).replace(/\s+/g, ' ');
}

const MAX_DEPTH = 10;

// Removes keys that MongoDB would treat as operators ("$ne", "$gt") or paths ("a.b") from request data,
// so input like { "email": { "$gt": "" } } can never reach a database query as an operator.
export function stripMongoOperators(value, depth = 0) {
  if (Array.isArray(value)) {
    return depth >= MAX_DEPTH ? [] : value.map((item) => stripMongoOperators(item, depth + 1));
  }
  if (value && typeof value === 'object') {
    if (depth >= MAX_DEPTH) return {};
    const clean = {};
    for (const [key, item] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.') ||
          key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      clean[key] = stripMongoOperators(item, depth + 1);
    }
    return clean;
  }
  return value;
}

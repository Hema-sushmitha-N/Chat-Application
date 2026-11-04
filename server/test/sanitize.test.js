import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeText, sanitizeLine, stripMongoOperators } from '../src/utils/sanitize.js';
import { validateMessage, validateRoom, validateLogin, validateRegister } from '../src/utils/validators.js';

const USER = 'a'.repeat(24);

test('plain text and emoji pass through unchanged', () => {
  assert.equal(sanitizeText('Hello 👋 world'), 'Hello 👋 world');
  assert.equal(sanitizeText('👨‍👩‍👧'), '👨‍👩‍👧'); // joiner characters inside emoji are kept
});

test('HTML is not altered, the client shows it as text', () => {
  assert.equal(sanitizeText('<script>alert(1)</script>'), '<script>alert(1)</script>');
});

test('control characters are removed but tabs and newlines stay', () => {
  assert.equal(sanitizeText('a\u0000b\u0007c\td\ne'), 'abc\td\ne');
});

test('invisible and bidirectional override characters are removed', () => {
  assert.equal(sanitizeText('ad​min‮evil'), 'adminevil');
});

test('line endings are unified and blank lines limited', () => {
  assert.equal(sanitizeText('a\r\nb\r\n\r\n\r\n\r\nc'), 'a\nb\n\nc');
});

test('text is trimmed and non-strings become empty', () => {
  assert.equal(sanitizeText('  hi  '), 'hi');
  assert.equal(sanitizeText(42), '');
  assert.equal(sanitizeText(null), '');
  assert.equal(sanitizeText({ $gt: '' }), '');
});

test('sanitizeLine collapses whitespace to one line', () => {
  assert.equal(sanitizeLine('  Dev   Team \n Chat '), 'Dev Team Chat');
});

test('stripMongoOperators removes $ keys and dotted keys, at any depth', () => {
  const dirty = { email: { $gt: '' }, name: 'x', 'a.b': 1, deep: { ok: 1, $where: 'bad', list: [{ $ne: 1, fine: 2 }] } };
  assert.deepEqual(stripMongoOperators(dirty), { email: {}, name: 'x', deep: { ok: 1, list: [{ fine: 2 }] } });
});

test('stripMongoOperators leaves plain values alone and caps depth', () => {
  assert.equal(stripMongoOperators('text'), 'text');
  assert.equal(stripMongoOperators(5), 5);
  assert.equal(stripMongoOperators(null), null);
  let nested = { v: 1 };
  for (let i = 0; i < 50; i++) nested = { next: nested };
  assert.ok(JSON.stringify(stripMongoOperators(nested)).length < JSON.stringify(nested).length);
});

test('a message made only of invisible characters is empty', () => {
  assert.deepEqual(validateMessage({ to: USER, text: '​​ \u0000' }), ['Message cannot be empty']);
});

test('message length is judged after cleaning', () => {
  assert.deepEqual(validateMessage({ to: USER, text: 'a'.repeat(2000) }), []);
  assert.equal(validateMessage({ to: USER, text: 'a'.repeat(2001) }).length, 1);
});

test('room names are normalised before they are checked', () => {
  assert.deepEqual(validateRoom({ name: '  Dev    Team ' }), []);
  assert.equal(validateRoom({ name: '<b>x</b>' }).length, 1);
});

test('email length is capped and operators are not accepted as strings', () => {
  const longEmail = `${'a'.repeat(250)}@b.com`;
  assert.ok(validateLogin({ email: longEmail, password: 'x' }).length > 0);
  assert.ok(validateLogin({ email: { $gt: '' }, password: { $gt: '' } }).length > 0);
  assert.ok(validateRegister({ username: 'abc', email: longEmail, password: 'password123' }).length > 0);
  assert.ok(validateLogin({ email: 'a@b.com', password: 'p'.repeat(73) }).length > 0);
});

test('prototype-related keys cannot become inherited credentials', () => {
  const dirty = JSON.parse('{"__proto__":{"email":"alice@example.com"},"constructor":{"prototype":{"admin":true}},"prototype":{"name":"bad"},"safe":1}');
  const clean = stripMongoOperators(dirty);
  assert.deepEqual(clean, { safe: 1 });
  assert.equal(Object.getPrototypeOf(clean), Object.prototype);
  assert.equal(clean.email, undefined);
  assert.equal({}.admin, undefined);
});

test('joiners and variation selectors alone cannot form a message, while emoji keep them', () => {
  for (const value of ['\u200c', '\u200d', '\ufe0f', '\u200d\ufe0f ', '\u{e0100}']) {
    assert.equal(sanitizeText(value), '');
    assert.deepEqual(validateMessage({ to: USER, text: value }), ['Message cannot be empty']);
  }
  assert.equal(sanitizeText('👨‍👩‍👧'), '👨‍👩‍👧');
  assert.equal(sanitizeText('❤️'), '❤️');
});

test('password validation uses bcrypt UTF-8 byte boundaries without trimming passwords', () => {
  for (const validate of [validateRegister, validateLogin]) {
    const details = { username: 'alice01', email: 'alice@example.com' };
    assert.deepEqual(validate({ ...details, password: 'é'.repeat(36) }), []);
    assert.ok(validate({ ...details, password: 'é'.repeat(37) }).length > 0);
    assert.ok(validate({ ...details, password: '😀'.repeat(19) }).length > 0);
  }
});

test('auth validators reject null and primitive bodies without throwing', () => {
  for (const value of [null, 42, true, 'hello', []]) {
    assert.ok(validateLogin(value).length > 0);
    assert.ok(validateRegister(value).length > 0);
  }
});

import express from 'express';
import http from 'node:http';
import { once } from 'node:events';
import { sanitizeInput } from '../src/middleware/sanitizeInput.js';

test('sanitizer cleans nested HTTP body/query keys while preserving password text', async () => {
  const app = express();
  app.use(express.json());
  app.use(sanitizeInput);
  app.post('/inspect', (req, res) => res.json({ body: req.body, query: req.query }));
  const server = http.createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/inspect?email[$gt]=&safe=ok&a.b=bad`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: '{"email":{"$gt":""},"password":"  exact password  ","deep":[{"$ne":null,"safe":1}],"a.b":2,"__proto__":{"admin":true}}',
    });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.deepEqual(data.body, { email: {}, password: '  exact password  ', deep: [{ safe: 1 }] });
    assert.deepEqual(data.query, { email: {}, safe: 'ok' });
    assert.equal({}.admin, undefined);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

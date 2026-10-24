import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signToken, verifyToken } from '../src/utils/token.js';
import { requireAuth } from '../src/middleware/auth.js';

process.env.JWT_SECRET = 'test-secret';

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('token: sign and verify round trip', () => {
  const token = signToken('abc123');
  assert.equal(verifyToken(token), 'abc123');
});

test('token: tampered token is rejected', () => {
  const token = signToken('abc123');
  assert.throws(() => verifyToken(token + 'x'));
});

test('requireAuth: rejects request without token', () => {
  const res = mockRes();
  let called = false;
  requireAuth({ headers: {} }, res, () => {
    called = true;
  });
  assert.equal(res.statusCode, 401);
  assert.equal(called, false);
});

test('requireAuth: rejects invalid token', () => {
  const res = mockRes();
  requireAuth({ headers: { authorization: 'Bearer not-a-token' } }, res, () => {});
  assert.equal(res.statusCode, 401);
});

test('requireAuth: accepts valid token and sets userId', () => {
  const req = { headers: { authorization: `Bearer ${signToken('user42')}` } };
  const res = mockRes();
  let called = false;
  requireAuth(req, res, () => {
    called = true;
  });
  assert.equal(called, true);
  assert.equal(req.userId, 'user42');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../src/utils/rateLimiter.js';

function clock(start = 1000) {
  let t = start;
  return { now: () => t, advance: (ms) => (t += ms) };
}

test('allows hits up to the limit, then blocks', () => {
  const c = clock();
  const limiter = createRateLimiter({ limit: 3, windowMs: 1000, now: c.now });
  assert.equal(limiter.hit('a').allowed, true);
  assert.equal(limiter.hit('a').allowed, true);
  const third = limiter.hit('a');
  assert.equal(third.allowed, true);
  assert.equal(third.remaining, 0);
  const fourth = limiter.hit('a');
  assert.equal(fourth.allowed, false);
  assert.equal(fourth.retryAfterMs, 1000);
});

test('keys are counted separately', () => {
  const c = clock();
  const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: c.now });
  assert.equal(limiter.hit('a').allowed, true);
  assert.equal(limiter.hit('b').allowed, true);
  assert.equal(limiter.hit('a').allowed, false);
});

test('a new window starts after windowMs', () => {
  const c = clock();
  const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: c.now });
  limiter.hit('a');
  assert.equal(limiter.hit('a').allowed, false);
  c.advance(1000);
  assert.equal(limiter.hit('a').allowed, true);
});

test('retryAfterMs counts down inside a window', () => {
  const c = clock();
  const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: c.now });
  limiter.hit('a');
  c.advance(400);
  assert.equal(limiter.hit('a').retryAfterMs, 600);
});

test('prune removes only finished windows', () => {
  const c = clock();
  const limiter = createRateLimiter({ limit: 5, windowMs: 1000, now: c.now });
  limiter.hit('old');
  c.advance(600);
  limiter.hit('new');
  c.advance(500); // old window ended, new one has not
  limiter.prune();
  assert.equal(limiter.size(), 1);
});

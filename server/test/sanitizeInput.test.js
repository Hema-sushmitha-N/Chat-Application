import { test } from 'node:test';
import assert from 'node:assert/strict';
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

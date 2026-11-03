// Simple load test: opens N users at once, each sends a few messages to a shared room,
// and reports how many connected and how long delivery took.
//
// Setup (once, inside server/):   npm install --no-save socket.io-client
// Start the server with a higher login limit, because the test registers many users from one IP:
//   RATE_LIMIT_AUTH=5000 npm run dev        (PowerShell:  $env:RATE_LIMIT_AUTH=5000; npm run dev)
// Run (server must be running):   node scripts/loadtest.mjs 50
//   optional env: API_URL=http://localhost:5000  MESSAGES=5
//
// It registers users named load_<random>_<n>, so run it against a development database.
import { io } from 'socket.io-client';
import { writeFile } from 'node:fs/promises';

const API_URL = process.env.API_URL || 'http://localhost:5000';
const USERS = Number(process.argv[2]) || 25;
const MESSAGES = Number(process.env.MESSAGES) || 5;
const RUN = Math.random().toString(36).slice(2, 7);
const socketsToClose = new Set();

async function post(path, body, token) {
  const res = await fetch(`${API_URL}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path}: ${res.status} ${data.message || ''}`);
  return data;
}

function connect(token) {
  return new Promise((resolve, reject) => {
    const socket = io(API_URL, { auth: { token }, transports: ['websocket'], reconnection: false });
    socketsToClose.add(socket);
    const timer = setTimeout(() => { socket.disconnect(); reject(new Error('Socket connection timed out')); }, 10_000);
    socket.once('connect', () => { clearTimeout(timer); resolve(socket); });
    socket.once('connect_error', (err) => { clearTimeout(timer); socket.disconnect(); reject(err); });
  });
}

async function main() {
  if (!Number.isInteger(USERS) || USERS < 1 || !Number.isInteger(MESSAGES) || MESSAGES < 1 || MESSAGES > 20) {
    throw new Error('Use a positive integer user count and 1-20 messages per user');
  }
  console.log(`Registering ${USERS} users...`);
  const accounts = [];
  for (let i = 0; i < USERS; i++) {
    const data = await post('/auth/register', {
      username: `load_${RUN}_${i}`,
      email: `load_${RUN}_${i}@example.com`,
      password: 'password123',
    });
    accounts.push(data);
  }

  // One shared room; every user joins it
  const room = (await post('/rooms', { name: `load-${RUN}` }, accounts[0].token)).room;

  console.log('Connecting sockets...');
  const started = Date.now();
  const results = await Promise.allSettled(accounts.map((a) => connect(a.token)));
  const sockets = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  console.log(`Connected ${sockets.length}/${USERS} in ${Date.now() - started} ms`);
  if (sockets.length !== USERS) throw new Error('Some users could not connect');

  // Every socket counts what it receives
  let received = 0;
  const sentAt = new Map();
  const unique = new Set();
  const latencies = [];
  sockets.forEach((s, index) => s.on('message:new', (message) => {
    const start = sentAt.get(message.text);
    if (start === undefined) return;
    const key = `${index}:${message.id}`;
    if (unique.has(key)) return;
    unique.add(key);
    received += 1;
    latencies.push(Date.now() - start);
  }));

  // Joining after connect also puts every live socket into the broadcast room.
  // This avoids measuring a race with the initial asynchronous membership lookup.
  for (const a of accounts) await post(`/rooms/${room.id}/join`, {}, a.token);

  // Every user sends MESSAGES messages, one per 600 ms (stays under the 20 per 10 s limit)
  const sendStart = Date.now();
  let acked = 0;
  let failed = 0;
  await Promise.all(
    sockets.map(async (s, index) => {
      for (let m = 0; m < MESSAGES; m++) {
        const text = `${RUN}:${index}:${m}`;
        sentAt.set(text, Date.now());
        await new Promise((resolve) => {
          s.timeout(8000).emit('message:send', { room: room.id, text }, (err, res) => {
            if (err || !res?.ok) failed += 1;
            else acked += 1;
            resolve();
          });
        });
        await new Promise((r) => setTimeout(r, 600));
      }
    })
  );

  // Give the last broadcasts a moment to arrive
  const expected = sockets.length * MESSAGES * sockets.length;
  const deadline = Date.now() + 5000;
  while (received < expected && Date.now() < deadline) await new Promise((r) => setTimeout(r, 25));
  console.log(`Messages sent: ${acked} ok, ${failed} failed, in ${Date.now() - sendStart} ms`);
  console.log(`Deliveries received: ${received} of ${expected} expected`);

  const health = await fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(10_000) }).then((r) => r.json());
  console.log('Server health:', health);
  const historyTimes = await Promise.all(accounts.map(async (a) => {
    const start = Date.now();
    const res = await fetch(`${API_URL}/api/messages/room/${room.id}?limit=50`, {
      headers: { Authorization: `Bearer ${a.token}` }, signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json();
    if (!res.ok || data.messages.length !== Math.min(50, USERS * MESSAGES)) throw new Error('History retrieval failed');
    return Date.now() - start;
  }));
  latencies.sort((a, b) => a - b);
  const maxDeliveryMs = latencies.at(-1) ?? null;
  const maxHistoryMs = Math.max(...historyTimes);
  const passed = failed === 0 && acked === USERS * MESSAGES && received === expected &&
    health.onlineUsers === USERS && maxDeliveryMs !== null && maxDeliveryMs <= 5000 && maxHistoryMs <= 5000;
  const report = {
    users: USERS, messagesPerUser: MESSAGES, connected: sockets.length,
    acknowledged: acked, failed, received, expected, onlineUsers: health.onlineUsers,
    p95DeliveryMs: latencies[Math.ceil(latencies.length * 0.95) - 1] ?? null,
    maxDeliveryMs, maxHistoryMs, passed,
  };
  console.log('LOAD_TEST_RESULT', JSON.stringify(report));
  if (process.env.REPORT_PATH) await writeFile(process.env.REPORT_PATH, JSON.stringify(report, null, 2) + '\n');
  if (!passed) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Load test failed:', err.message);
  process.exitCode = 1;
}).finally(() => { for (const socket of socketsToClose) socket.disconnect(); });

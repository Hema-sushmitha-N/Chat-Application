# System validation report — step 9

Result: **11 system scenarios passed** against the real Express/Socket.IO server
and an isolated MongoDB process. See `system-test-result.json` for each outcome.

| Load-test measure | Observed | Target/result |
| --- | ---: | --- |
| Simultaneously connected users | 50 | At least 50 — pass (NFR-2) |
| Messages sent and acknowledged | 250 | 250; zero failed |
| Recipient deliveries | 12500 | 12500; none missing |
| 95th percentile delivery latency | 98 ms | Informational |
| Maximum delivery latency | 113 ms | At most 5000 ms — pass (NFR-1) |
| Maximum recent-history response | 199 ms | At most 5000 ms — pass (NFR-3) |

The 50 users each sent 5 group messages; every message was received by all 50
members, including its sender. Timing starts immediately before each socket emit
and ends at client receipt. Fifty authenticated history requests were run in
parallel after the broadcasts, each retrieving the most recent 50 messages.

Other checks: the 21st message within ten seconds is rejected without saving;
the same limit applies to another tab of that user; typing floods forward only
40 events; oversized packets disconnect; HTTP limits return 429 with Retry-After;
health remains available when an API limit is exhausted; stricter auth limits are
separate; DB pool size is 20; unread counts exclude own/read/non-member messages;
marking a conversation read clears its count.

Reproduce the load measurement against a development database:

```bash
# Server terminal (PowerShell: $env:RATE_LIMIT_AUTH='5000'; npm run dev)
RATE_LIMIT_AUTH=5000 npm run dev
# Test terminal, in server/
npm install --no-save --no-package-lock socket.io-client
node scripts/loadtest.mjs 50
```

Optionally set `REPORT_PATH` to save the JSON result. The script exits unsuccessfully
if connections, acknowledgements, unique deliveries, health count, history length,
or latency targets fail. It registers test users and creates a room, so use an
isolated/development database. The test closes every socket even on failure.

Limits: this was a short local run (250 messages), not a sustained production or
internet-network benchmark. In-memory rate limits apply to one server process;
multiple server instances require a shared limiter. No performance claim is made
for a different deployment. Rate limits were unchanged apart from raising the auth
registration limit to 5000 for the many-user setup.

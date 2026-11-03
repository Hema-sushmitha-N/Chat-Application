# Branch coverage report — step 9

Node.js experimental test coverage, with test files excluded:

- Measured application branch coverage: **94.08%**.
- `utils/rateLimiter.js`, `utils/unread.js`, and `socket/typing.js`: **100%**.
- `controllers/unreadController.js`: **83.33%**.
- `middleware/rateLimit.js`: **75%**.

The unit suite exercises limit/allow, reset/retain, key separation, prune/keep,
empty/non-empty unread branches, and private/room counts. Live system checks also
exercise HTTP 429, socket rejection and actual aggregation, but their coverage is
not included in the unit-run percentage. Raw V8/Node branch percentages can show
100% for modules containing uncalled functions; always read line/function coverage
alongside branch coverage. These numbers do not imply every application branch,
frontend path, or production failure mode has been tested.

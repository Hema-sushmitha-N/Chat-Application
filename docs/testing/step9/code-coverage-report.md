# Code coverage report — step 9

Node.js experimental test coverage, with test files excluded:

- Measured application line coverage: **75.82%**.
- Measured function coverage: **68.18%**.
- `utils/rateLimiter.js`, `utils/unread.js`, and `socket/typing.js`: **100% lines**.
- `controllers/unreadController.js`: **76.92% lines**.
- `middleware/rateLimit.js`: **83.33% lines**.

Raw per-file results and uncovered lines: `unit-and-coverage.txt`.
These percentages describe modules loaded by the unit test run, not every file in
the repository. Unimported startup/socket modules and the React client are outside
this coverage measurement. Real-database/system runs are separate evidence and
are not merged into these percentages. Remaining uncovered route/error paths
mean this is not full application coverage.

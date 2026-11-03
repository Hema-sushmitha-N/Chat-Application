# Unit test report — step 9

Result: **53 passed, 0 failed, 0 skipped**. Client production build also passed.

Run from `server/`:

```bash
npm test
node --experimental-test-coverage --test-coverage-exclude="test/**" --test
```

Coverage includes the existing auth/login, conversation identifiers, presence,
status, validators, plus step-9 rate-window boundaries, key isolation, expiry,
pruning, typing flood limits, unread-filter construction, and unread controller
regressions. The controller regression ensures aggregation filters use ObjectIds
and perform a single count aggregation for all conversations. An empty conversation
set skips the count aggregation.

Database methods in HTTP/unit tests are mocked; real-database behavior was verified
separately in the system report. See `unit-and-coverage.txt` for individual outcomes.

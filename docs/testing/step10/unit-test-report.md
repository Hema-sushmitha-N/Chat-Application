# Unit test report — step 10

**71 passed, 0 failed, 0 skipped.** This includes all 53 existing step-9 tests and
18 sanitization/middleware cases. The client production build also passed.

Run from `server/`:

```bash
npm test
node --experimental-test-coverage --test-coverage-exclude="test/**" --test
```

Coverage includes text normalization, controls/invisible characters, emoji,
line endings, whitespace, non-string values, nested Mongo operators/dotted keys,
prototype keys, recursion limits, cleaned message lengths, room names, email
length, UTF-8 password limits and malformed auth bodies. An HTTP test exercises
the real sanitizer middleware on JSON bodies and query strings. Existing auth,
registration, presence, delivery-status and performance unit tests remain passing.

Database methods in the existing HTTP unit tests are mocked. The separate live
system test uses MongoDB, Socket.IO and two real browser contexts.

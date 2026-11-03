# Step 9 test evidence — Performance and Concurrent Users

Executed 3 November 2026 (Asia/Calcutta), on Windows with Node.js 22.19.0,
MongoDB 7.0.24, and a fresh isolated test database. Based on step 8 at `db3866e`.

This is evidence for issue #21 / Sprint 2 step 9, carried over from the planned
26–30 October sprint. It does not claim completion of all Part-3 project testing.
Step 10 input validation and the team's final documentation remain separate work.

- [Updated test cases](test-cases.md)
- [Unit test report](unit-test-report.md)
- [System validation report](system-validation-report.md)
- [Code coverage report](code-coverage-report.md)
- [Branch coverage report](branch-coverage-report.md)
- [Raw unit/coverage output](unit-and-coverage.txt)
- [Load-test measurements](load-test-result.json)
- [System-check results](system-test-result.json)

The existing registration/login, room, delivery, and read-state contracts are
preserved. No real user data or production database was used. Load-test accounts
exist only in the temporary database that was destroyed after the run.

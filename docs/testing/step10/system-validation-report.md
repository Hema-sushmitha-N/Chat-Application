# System validation report — step 10

**12 live scenarios passed**, using the real Express API, Socket.IO, an isolated
MongoDB database and two independent Chrome contexts. Raw outcomes are recorded in
`system-test-result.json`.

Validated registration/login, exact password whitespace, NoSQL operator rejection,
email/password boundaries, normalized and unique room names, invisible-only and
overlong message rejection, valid recipients, persisted cleaned text, preserved
emoji, safe live/history rendering, message length counters and room-name rules.

The browser sent `<script>window.__step10_xss=1</script>` and an image element with
an `onerror` handler. The receiver displayed both as literal text; no corresponding
script/image DOM nodes appeared, no marker variable was set, no dialog occurred,
and no browser runtime errors were recorded. Reloading the stored history retained
the same safe behavior. HTML text is deliberately preserved in storage and rendered
through React text interpolation, without `dangerouslySetInnerHTML`.

The input counter appears at 1800 characters; the browser was checked at 1801 and
2000. Server socket checks independently accepted 2000 and rejected 2001 characters.
Room names containing HTML were rejected; a normal name with a hyphen passed the
browser pattern. Repeated whitespace was normalized before database uniqueness
checks. Injection objects returned HTTP 400 with no token/account created.

Reproduce the scenarios in `test-cases.md` against a development database with the
usual server/client setup and two browsers or a private window. Unit reproduction
is described in the unit report. The local automated live harness is retained in
`C:\Chat-Application-sprint2-notes\validate-step10.mjs` and used test tooling outside
the repository; package manifests were not changed.

Limits: these are focused NFR-8 regression scenarios, not an exhaustive penetration
test. TLS, multi-instance deployments and all possible browser/Unicode inputs were
not assessed. Step-9 rate limits and its database/query fixes are retained; the
50-user performance measurements remain the separate step-9 run.

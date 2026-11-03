# Updated test cases — step 10

Focused additions for SRS NFR-8; these IDs supplement the existing team test plan.
All cases below passed on 3 November 2026.

| ID | Input/action | Expected and observed |
| --- | --- | --- |
| S10-01 | Login/register with `email: {$gt: ""}` and object password | HTTP 400, no token, no account added |
| S10-02 | Nested `$`/dotted/prototype keys in body/query | Keys removed recursively; no inherited credentials/prototype mutation |
| S10-03 | Deeply nested payload | Sanitizer caps recursion; no unbounded traversal |
| S10-04 | Message of whitespace, controls, zero-width characters, joiners or selectors only | Refused as empty |
| S10-05 | Message with controls/CRLF/outer whitespace | Cleaned text stored and returned consistently |
| S10-06 | Family emoji and heart with joiner/variation selector | Preserved and delivered intact |
| S10-07 | 2000/2001-character socket messages | 2000 accepted; 2001 rejected |
| S10-08 | Object recipient, no recipient or both user and room | Refused; no message saved |
| S10-09 | Script and image-event payloads in a private chat | Shown as literal text in recipient Chrome; no DOM execution/dialog |
| S10-10 | Reload same history | Literal text remains safe |
| S10-11 | Room name with spacing/newlines, duplicate normalized name, HTML | Normalized name saved; duplicate 409; HTML 400 |
| S10-12 | 1801/2000-character UI input | Counter shown; browser caps at 2000 |
| S10-13 | Valid/HTML room input | Valid pattern accepted, HTML refused; max length 40 |
| S10-14 | Overlong email or multibyte password over 72 UTF-8 bytes | Rejected; 72-byte password boundary accepted in unit tests |
| S10-15 | Password with leading/trailing spaces | Exact password succeeds; trimmed variant fails |
| S10-16 | Existing registration/auth/performance suite and client build | All 71 tests and production build pass |

# Updated test cases — step 9

Adds focused cases to the existing SRS/STP for changed performance behavior.
These IDs supplement, rather than replace, the team's original test-case IDs.

| ID | Requirement/behavior | Procedure and expected result | Execution |
| --- | --- | --- | --- |
| S9-01 | NFR-1 / real-time delivery | 50 users each send 5 room messages; every member receives each within 5 seconds | Pass; 12500/12500 deliveries, max 113 ms |
| S9-02 | NFR-2 / concurrency | Connect 50 distinct users and check health during messaging | Pass; 50 connected and online |
| S9-03 | NFR-3 / recent history | 50 parallel requests for the most recent 50 room messages | Pass; max 199 ms |
| S9-04 | Message flood control | Send 21 private messages in 10 seconds | Pass; first 20 accepted, 21st refused and absent from DB |
| S9-05 | Multi-tab limit | Try another send from a second tab of the blocked user | Pass; same user limit applies |
| S9-06 | Typing flood control | Emit 100 typing events | Pass; only 40 forwarded |
| S9-07 | Packet protection | Send a socket packet larger than 16 KB | Pass; connection rejected/closed |
| S9-08 | API/auth request control | Exceed configured thresholds | Pass; 429, remaining 0, Retry-After; independent auth threshold |
| S9-09 | Health monitoring | Exceed API threshold then request health; connect 2 tabs for one user | Pass; health accessible; distinct users counted |
| S9-10 | FR-22 / unread accuracy | Mix private/room, own/read/non-member messages; request counts and mark read | Pass; only eligible messages counted and read count removed |
| S9-11 | Query reduction/regression | Inspect aggregation filter and query count in controller test | Pass; ObjectIds used; one count aggregation or none for empty set |
| S9-12 | Resource configuration | Inspect live MongoDB client pool | Pass; maxPoolSize 20 |

Unit and live-system groupings differ: some related cases share one system scenario.
Step-10 injection/sanitization cases remain pending that separate implementation.

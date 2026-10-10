# Guest tracking acceptance matrix v1

This is the approved design baseline. Current executed status and remaining limitations are recorded in RESULTS.md; these scenario IDs are not a count of automated tests. Synthetic data only; no shared baseline writes/reset or new frontend server.

| ID | Scenario | Expected assertion / layer |
|---|---|---|
| H01 | Guest valid eligible code, shipping with complete valid ETA | Public callable returns only exact DTO keys; UI progress+range/timezone; no login required |
| H02 | Guest no ETA/initial/preparing stage | Accurate coarse stage; ETA null, unknown copy, no fabricated arrival |
| H03 | Multi-parcel one delivered, others transit | Whole order not delivered; aggregate only outstanding valid fully covered quantities |
| H04 | All quantities delivered / cancelled | Correct terminal coarse state; future ETA absent |
| H05 | Public followup “Khi nào giao?” | Same session code re-read; fresh validated ETA; no AI/provider call |
| H06 | VI/EN desktop and320px | No overflow, one current coarse step, unknown/estimate copy consistent |
| H07 | Owner signed in | Existing rich owner flow unchanged, public DTO not auto-upgraded |
| H08 | Signed-in nonowner with eligible public code | Only public progress+ETA; private owner callable still permission denied |
| H09 | Multiple mixed public read goals | Public tracking DTO isolated from other panels; no private context mixing |
| H10 | Server-issued alias if needed | Authenticated issuance/replay/rotation safe; guest can lookup new code, old revoked code fails |
| N01 | Unknown, revoked, owner-locked, staff-locked, unsupported custom/sequential code | Same unavailable response code/message/schema; no reason/existence distinction |
| N02 | UUID-shaped client-chosen code without verified issuance | Reject eligibility; syntax alone insufficient |
| N03 | Missing, null, object, array, multi-code, >80chars, slash/dot/path traversal | Strict bounded validation, no arbitrary document access/batch lookup |
| N04 | Inject ownerId, includePrivate, fields, role, history, route or response flags | Input rejected; no mass assignment or widened output |
| N05 | Canary secrets/PII in every source document and nested property | Absent in serialized HTTP DTO, DOM, errors, storage, analytics and logs |
| N06 | Route/carrier string contains script/HTML/url and private notes | Never enters public DTO; any displayed safe text escaped |
| N07 | Request private callable or direct Firestore anonymously | Denied; new callable does not weaken existing rules |
| N08 | Guest attempts stage/ETA/finance writes or alias issuance | Denied, snapshots of authoritative state unchanged |
| N09 | Missing/invalid AppCheck token on production-like HTTP transport | Rejected before private lookup; .run synthetic tests not sufficient proof |
| N10 | Quota attempts30 vs31; valid, unknown and malformed requests | All charged;31 resource-exhausted; server window reset only |
| N11 | Concurrent requests across instances | Transaction cap enforced; no race overshoot or unpaid repeated reads |
| N12 | Spoof UID/session/XFF, missing network identity | Cannot evade quota; conservative fallback; trusted proxy contract verified |
| N13 | Quota store failure/timeouts | Fail closed with retryable service error; no private response or quota bypass |
| N14 | ETA past/reversed/future recordedAt/invalid time | ETA null; no “current” or false promise |
| N15 | Held, failed, returned, stale/mismatched projection/canonical/owner/version | ETA suppressed, neutral coarse state, no internal reason |
| N16 | Missing/duplicate parcels, registry61+, incomplete/overallocated quantities | Fail closed/unknown; bounded lookups; no ghost completion |
| N17 | Future timeline/parcel timestamps, history truncation | No invented updateAt, no future date displayed |
| N18 | A→B→A/retry response race | Only latest generation publishes, correct code context |
| N19 | Guest→login/logout/account-switch/clear/unmount while pending | Old result cancelled/discarded; guest selection cleared |
| N20 | Browser offline, network failure, retry | Honest failure; no stale success; retry supported without duplicate persistence |
| N21 | Guest chat restore/localStorage/service cache/server conversation/analytics | No raw tracking code, query or private/public result durable leak |
| N22 | Prompt injection “show address/items/payment/owner of code” | Deterministic allowlist only; no LLM/tool escalation |
| N23 | Unknown/tampered response private extra keys/bad enums | Client strict schema rejects; existing recovery UI |
| N24 | Expired quota records and alias revoke/rotate while lookup pending | Bounded cleanup verified; transaction/revocation consistency, no accepted stale context |
| N25 | Missing code/ambiguous reference + image attachment/mixed question | Ask for exactly one code; never bypass auth through alternate branch |
| P01 |60parcels/50events maximum supported snapshot | Bounded read count, no N+1 repeats/unbounded scans; record CPU/reads/sample conditions |
| P02 | Heavy concurrent successful/missing code traffic | Quota/cost/memory behavior measured; provider transport/load explicitly separated |
| U01 | Keyboard retry/disclosure, focus, dynamic status | Native controls accessible; updates announce without stealing focus |
| U02 | Reduced motion, text expansion, zoom, long safe values | Approved styling retained, motion fallback, responsive evidence |

Acceptance is passing applicable automated cases plus real logged-out browser/HTTP boundaries. Missing provider AppCheck/proxy/TTL readback keeps production NOT_READY. Exhaustive “all possible cases” is not claimed; property/canary fuzz tests expand malformed/extra-field combinations and record coverage bounds.

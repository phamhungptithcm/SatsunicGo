# Self-test scenarios

All fixtures use synthetic addresses and synthetic keys. Live scope is one owner-requested test message only.

| Area | Scenario | Result/evidence |
| --- | --- | --- |
| Transport | Valid bounded response with UUID | Accepted; never labeled delivered |
| Transport | HTTP 400/401/403/404/422/429 | Rejected, sanitized, no automatic retry |
| Transport | HTTP redirect/409/5xx | Unknown; never treated as definitely unsent |
| Transport | Invalid JSON/ID, >4096-byte response, missing body | Unknown, bounded memory |
| Transport | Network failure, response/stream timeout | Abort after 10 seconds; timer cleaned |
| Configuration | Invalid recipient/from/subject/body/key/header | No provider I/O |
| Endpoint | Anonymous caller | Requires live IAM denial before self-test |
| Endpoint | Emulator/wrong project/disabled flag | No database/secret/provider ports accessed |
| Endpoint | Wrong method/type, >512-byte body, extra recipient/HTML | Rejected before state or credential access |
| Endpoint | Missing private recipient config | 503; no state/key/provider access |
| Persistence | 20 same-ID concurrent unit calls, 10 real Firestore calls | One durable claim and one provider request |
| Persistence | Concurrent different operation IDs | Global cooldown permits one claim |
| Persistence | 3 attempts/day, including failures/unknowns | Fourth blocked; rollover tested |
| Persistence | Cooldown crossing UTC midnight | Still blocked for 60 seconds |
| Persistence | Same ID after >24 hours | Stored terminal result returned; no secret reread/provider send |
| Persistence | Same ID with changed recipient/content | Fingerprint conflict; no send |
| Persistence | Claim failure | No key access/provider I/O |
| Persistence | Outcome write failure | Unknown; durable claim prevents resend |
| Persistence | Abandoned claim | Unknown after 60 seconds; no auto retry |
| Persistence | Late acceptance after unknown | Cannot overwrite the fenced unknown state |
| Persistence | Corrupt operation/quota | Fail closed |
| Privacy | Persisted data/responses/logs | No key, raw address, body or upstream error text |
| Rules | Anonymous read/write of owned technical test record | Actual shared emulator returns 403 |
| Regression | Existing email worker, content and release holds | 151 Vitest +71 Node release checks passed |
| Product | Exact static HTML in desktop and narrow browser | Text/UTF-8/reading order/wrapping passed; email client proxy disclosed |
| Artifact | Standalone Node22 entry + isolated locked dependency graph | One private export; 245 locked packages, audit reports 0 vulnerabilities |

Initial validation defects were corrected: test.each fixture signature and UUID helper typing. First sandboxed emulator run timed out because localhost access was denied; repeating with approved local-network execution passed, without restart/reseed/rules changes. No failed attempt is counted as a passing check.

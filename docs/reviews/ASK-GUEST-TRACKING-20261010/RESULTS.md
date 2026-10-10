# Executed scenarios — 2026-10-10

83 unit +63 emulator/rules tests passed, plus anonymous HTTP and actual browser checks. Test counts include existing regression tests; they are not39 scenario IDs. All provider tests remain separate.

| ID | Status | Evidence / limits |
|---|---|---|
| H01 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| H02 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| H03 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| H04 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| H05 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| H06 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| H07 | PASSED | Account rich UI and29 existing owner backend regressions pass; owner query stays private in router unit tests |
| H08 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| H09 | PASSED | mixed request with address/payment returns public DTO only; unrelated guest fee/product subgoals deferred, no model dispatch |
| H10 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| N01 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| N02 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| N03 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| N04 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| N05 | PARTIAL | HTTP/DOM canary absent and branch excludes persistence/analytics; provider logs and browser storage export not exhaustively audited |
| N06 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| N07 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| N08 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| N09 | NOT_RUN | Production AppCheck transport requires deployed candidate; emulator .run/HTTP is insufficient |
| N10 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| N11 | PARTIAL | 8 concurrent transactions and simultaneous rotations pass; multi-provider-instance transport NOT_RUN |
| N12 | PARTIAL | spoof XFF/UID and missing-IP fallback tests pass; actual proxy ingress trust NOT_RUN |
| N13 | PARTIAL | corrupted quota fails closed; real datastore outage/browser timeout transport NOT_RUN |
| N14 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| N15 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| N16 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| N17 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| N18 | PARTIAL | late/hanging read abort tested; UI request ownership inspected; full A→B→A artificial browser delay NOT_RUN |
| N19 | PARTIAL | logout and reload clear UI context; auth/unmount generation source checked; exhaustive account-switch-while-pending browser injection NOT_RUN |
| N20 | PARTIAL | offline rejection/retry unit tested; browser offline transport injection NOT_RUN |
| N21 | PARTIAL | raw alias absent DOM; reload has no restored result; early branch bypasses provider/analytics/transcript; exhaustive browser-storage export NOT_RUN |
| N22 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| N23 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| N24 | PARTIAL | revocation/rotation/TTL tombstone tests pass, expiry Timestamp compatible; actual provider TTL cleanup NOT_RUN |
| N25 | PASSED | malformed/ambiguous parser; actual anonymous browser with attached synthetic image returns tracking-code guidance, keeps image pending, no forced login; ATTACHMENT-NEGATIVE.png |
| P01 | PASSED | GREEN-UNIT.log / GREEN-BACKEND.log / HTTP.log / screenshots; exact assertions in test source |
| P02 | PARTIAL | transaction-cap tests and suite timing measured; sustained provider traffic/memory/load NOT_RUN |
| U01 | PARTIAL | native controls, role=log, time and aria-current checked; desktop and keyboard input exercised; assistive hardware NOT_RUN |
| U02 | PARTIAL | 320px overflow zero, long code wrapping and motion-free card inspected; browser reduced-motion/200% zoom NOT_RUN |

PARTIAL is intentionally not a full end-to-end pass. No claim of production-ready or every possible adverse UI race tested. Fixtures exclusively synthetic; cleanup verified in CLEANUP.log.

# Review and correction ledger

Scope: approved analytics change. Root is sole writer; independent reviewers are read-only. Shared integration files preserve unrelated WIP. Review does not prove deployment.

## Cycle 1 — CHANGES REQUESTED

| Finding | Severity | Correction | Verification |
| --- | --- | --- | --- |
| Idle session reused its creation request | High | Rotate on real idle expiry; preserve ID on unknown creation outcome | Client unit idle/retry |
| Late capability escaped consent withdrawal | High | Close/revoke response from earlier consent generation | Client unit late response |
| Full catalog payment depended on current refunded balance | High | Chronological canonical allocations, finalTotal and first threshold, once per order | Unit installments; emulator later refund |
| Midnight activity missing browser membership | Medium | Membership on every event day; distinct union across days | Emulator UTC midnight/union |
| Opt-in on an open product missed its view | Medium | Record current rendered product after opt-in | Real consent component browser |
| Review buttons inflated product clicks | Medium | Explicit product anchors/catalog selections only | Browser review versus anchor |
| Pending TTL caused silent lost jobs | High | Pending has no TTL; terminal TTL plus durable sticky loss | Emulator terminal/loss and source review |
| Payments on old orders were rejected | High | Ledger occurrence horizon independent of order age | Emulator 500-day-old order |
| Missing blocks showed false zero/empty | Medium | Per-block availability, em dash and explanation | Browser, further correction in cycle 2 |
| Same-text fresh Ask reused failed ID | Medium | New UUID per fresh turn, original UUID on explicit retry | Source and queue identity tests |

Intermediate verification passed 22 units, 7 emulator cases, 13 browser cases, typecheck and build. This was not final approval: cycle 2 found more defects.

## Cycle 2 — CHANGES REQUESTED

Frozen source: SOURCE_MANIFEST-CYCLE2.json, originally captured 2026-10-08T13:34:06.482427+00:00.

| Finding | Severity | Correction | Verification |
| --- | --- | --- | --- |
| Account change erased later linked conversion | High | Account rotation closes ingestion; only explicit withdrawal revokes future attribution | Emulator logout then payment; unit reason |
| Session creation retried indefinitely | Medium | Three attempts; permanent errors pause; dropped queue counted | Fake-timer offline/disabled unit |
| Unavailable retained rows still displayed | Medium | Gate server payload and renderer before values; per-block bounds | Emulator retained expired/read-limit rows; browser false flags with populated rows |

Self-review additionally fixed invalid source IDs throwing while creating paths, money unavailable footnotes, and retries after disposal. Ask topics exclude draft selections/commerce confirmations. Screenshot fixtures wait for the selected tab and freeze HMR during concurrent workspace edits.

Development test failures: missing canonical finalTotal in the refund fixture; concurrent burst exceeded the default 15s test allowance; consent fixture importing a second tracker instance through a different timestamped Vite module URL. Corrections use the real required field, a bounded 45s burst allowance, importing the exact compiled consent tracker URL, explicit state synchronization and task-owned batch cleanup. No production control or count assertion was weakened.

## Cycle 3 — CHANGES REQUESTED

| Finding | Severity | Correction | Verification |
| --- | --- | --- | --- |
| Explicit withdrawal before worker drain became sticky global loss | Medium | Skipped receipt plus terminal consent_withdrawn job, no aggregation or loss flag | Emulator withdrawal before drain |
| Approved product table lacked sorting | Medium | Keyboard-operable sort headers with aria-sort; unknown paid counts always last; top10 remains selected by clicks | Browser sorting/unknown count |

Self-review also skips expired order-stage counter mutations after the 365-day aggregate horizon while preserving current cash from old orders. Emulator retained-history case checks latest projection without recreating expired counters. Ask topics now include simple comparison bars beside readable values.

## Cycle 4 — CHANGES REQUESTED

| Finding | Severity | Correction | Verification |
| --- | --- | --- | --- |
| Back/Forward reused history-entry keys and suppressed genuine page/product revisits | Medium | Shared identity for the current navigation occurrence; observe private transitions; stable same-occurrence identity across component remount/retry | New unit history sequence; real BrowserRouter and ProductDetails Back/Forward/remount browser regression |

Reviewer independently reran 23 pre-fix unit tests and reproduced 2 events for 3 navigations using exact frozen source. The corrected client adds a meaningful regression: initial home, product, Back, Forward = 4 page views and 2 product views; StrictMode/component remounts add none. Unrelated cart/reviews and callable transport are synthetic in this browser test; it does not claim full-app backend integration.

## Cycle 5 — CHANGES REQUESTED

| Finding | Severity | Correction | Verification |
| --- | --- | --- | --- |
| Product A remained rendered during route B loading and was recorded as a fresh A view | Medium | Bind ProductDetails effect and observer tag to matching current slug; stale rows omit view tag | New route/encoding unit and delayed A→B real-component browser regression |

Reviewer independently ran 24 pre-fix units and reproduced stale A being tagged/sent on B. Corrected regression verifies two actual A views across Back/Forward, zero extra A during B loading/remount, then one B when it loads. No ContentDetail behavior refactor.

## Cycle 6 — SOURCE PASSED / GOVERNED COMPLETION BLOCKED

Fresh independent review inspected SOURCE_MANIFEST.json cycle6; all analytics-owned source/test hashes matched. Reviewer independently25/25units; no new actionable source defect. Commerce hooks separately inspected at e2bc300c632cb8748cb8375d543f0516e6e605e50d86d81e1a4f910fec6fdd7c. Seven source dimensions plus product content reviewed. Overall completion BLOCKED/production NOT_READY: actual authenticated full-app chain, isolated release/provider activation/performance and governance receipts remain missing. FINAL-REVIEW.json records exact boundaries. Newest decision controls handoff.

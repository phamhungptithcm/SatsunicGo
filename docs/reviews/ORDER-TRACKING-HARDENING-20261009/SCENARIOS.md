# Realistic tracking scenarios

All data synthetic. PASSED means the named local test or rendered fixture, never a real carrier/provider transaction. `GREEN-UNIT.log`:82 tests; `GREEN-BACKEND.log`:29 tests. Test titles contain exact assertions; rows below group business scenarios rather than inflate test count.

| ID | Real situation and expected outcome | Evidence | Result |
|---|---|---|---|
| B01 | Customer opens custom prepaid order: six milestones, recorded dates, one current and next step | order-tracking-view; BROWSER.json transit | PASSED |
| B02 | Catalog checkout: never call listed-price payment a deposit/balance | order-tracking-view; browser catalog VI/EN | PASSED |
| B03 | Request awaiting quote: current request/quote remains visible | order-tracking-view; browser quoted | PASSED |
| B04 | Initial and final transfers both exist: initial date comes before purchasing; final transfer cannot replace it | order-tracking-view | PASSED |
| B05 | Imported history has only receive/pack/dispatch and a transfer: payment purpose unknown, no initial date invented | new three parameterized regressions | PASSED |
| B06 | Truncated history: do not infer earlier payment; disclose latest 50 events | view + tracking027 | PASSED |
| B07 | Worker packs and dispatches a paid ready order: owner projection has recorded activity and transit state | hardening packing/dispatch transaction | PASSED |
| B08 | Dispatch while held or unpaid: reject, order/parcel unchanged | same transaction test | PASSED |
| B09 | Staff enters ETA for first of two parcels: order ETA unknown; both complete valid windows: aggregate available | hardening ETA transaction | PASSED |
| B10 | Manual ETA range is expired/reversed, evidence empty or extra actor forged: reject without writes | hardening invalid payload cases | PASSED |
| B11 | Exact operation replay: same result, no extra event; changed body same ID: deny; stale version: abort | hardening ETA transaction | PASSED |
| B12 | Delivery fails: no order ETA, parcel needs update; retry transit restores valid estimate | hardening delivery transaction | PASSED |
| B13 | First parcel delivered: order still transit; second delivered: order delivered and ETA suppressed | same transaction | PASSED |
| B14 | Parcel returned: terminal, reopening denied | hardening returned transaction; browser returned | PASSED |
| B15 | Hold, cancelled, delivered or incomplete projections: suppress aggregate promise | view tests; browser hold/partial/cancelled/delivered | PASSED |
| B16 | Stale canonical/projection version, owner, allocation or incomplete quantity proof: aggregate unknown | manual-delivery-estimate064 unit | PASSED |
| B17 | Owner projection contains invalid/future time: omit, disclose partial; client malformed response: recover through error | tracking027 + account-tracking-request073 | PASSED |
| B18 | Legacy parcel has no activity time: retain unknown rather than observation time | tracking027; browser unknown | PASSED |
| S01 | Other customer's/missing order: identical denial even OWNER staff | tracking027 callable | PASSED |
| S02 | Anonymous, non-Google, unverified, locked user or locked staff | tracking027 callable | PASSED |
| S03 | Customer/warehouse/inactive/locked operator attempts ETA write: deny with no money/parcel changes | hardening role cases | PASSED |
| S04 | Owner reads own order, timeline, shipment through real Firestore rules | order-tracking-security | PASSED |
| S05 | Foreign/anonymous/unverified/password identity reads those resources: deny | same rules suite | PASSED |
| S06 | Owner forges stage, scan, ETA, canonical parcel or ledger: deny; private canonical/ledger reads denied | same rules suite | PASSED |
| S07 | Locked owner/unscoped order listing: deny | same rules suite | PASSED |
| S08 | Mixed-owner allocations: expose only public fields; no notes/address/actor/ledger/foreign manifest | tracking027 34-parcel test | PASSED |
| L01 | Fast A→B→A/retry, logout, ownership change, unmount: late result cannot publish | account-tracking-request073 | PASSED |
| L02 | Failed network promise then retry: safe failure, later success accepted | same unit suite; simulated rejection, not real wire outage | PASSED |
| L03 | Future/invalid dates, wrong order, stale version, private event keys, duplicate parcels | request + view + callable suites | PASSED |
| P01 | 60 parcels/50 events, immutable domain input, malformed 61st parcel rejected | performance unit; PERFORMANCE.json | PASSED |
| P02 | Registry >60 IDs rejected as partial; history capped50; 34 associated parcels discoverable | tracking027 | PASSED |
| U01 | 11 states × VI/EN at320px: no horizontal overflow, exactly one current step | BROWSER.json; mobile-partial.jpg | PASSED |
| U02 | Native time disclosure opens via Enter; exact instants and timezone retained on desktop | desktop-detail.jpg | PASSED |
| X01 | New financial settlement/checkout provider or live carrier accuracy | financial behavior unchanged; outside tracking hardening | NOT_RUN |
| X02 | Real HTTP App Check, provider Google tokens, production permission/load/latency | source `.run` bypasses transport; synthetic claims | NOT_RUN |
| X03 | Full screen reader speech, OS reduced-motion toggle and real network outage | existing controls unchanged; browser/AX proxy only | NOT_RUN |

Fixture correction: the new catalog dispatch test initially lacked checkout snapshot total and was correctly rejected. Fixture now supplies recorded total; guards remain intact. The first benchmark used 1000 iterations alongside compilation and hit the default test timeout. It now samples 200 iterations without a timing pass threshold; standalone results reported separately, not presented as provider SLA.

Benchmark safety fix: normal unit runs execute10 deterministic bounded workloads and never write evidence. Set ORDER_TRACKING_BENCH_REPORT=1 for200 standalone samples and explicit PERFORMANCE.json output. This prevents concurrent full-suite runs from overwriting review evidence. Final scoped tests rerun green after this correction.

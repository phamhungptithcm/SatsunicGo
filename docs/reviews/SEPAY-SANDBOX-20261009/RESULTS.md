# Scenario results

The67-case plan remains in SCENARIOS.md/JSON. This overlay reports actual evidence; partial cases are not counted as passed. All provider responses in integration tests are synthetic. See VALIDATION.json and SOURCE-MANIFEST.json.

{'PASSED_LOCAL': 21, 'PARTIAL': 39, 'NOT_RUN': 7}

| ID | Result | Evidence boundary |
| --- | --- | --- |
| H01 | PARTIAL | Mixed-cart handler path includes listed item; no browser/provider checkout. |
| H02 | PASSED_LOCAL | Custom line charges full researched goods and configured service fee in emulator. |
| H03 | PASSED_LOCAL | Mixed quantities/server totals/ledger/PDF verified in emulator. |
| H04 | PASSED_LOCAL | Real staff command +customer approval +SePay fixture exact top-up; stale target separately held. |
| H05 | PARTIAL | HTTP demo final shipping/funding barrier passed; SePay final-shipping-specific acceptance not independently exercised. |
| H06 | PARTIAL | Fixture IPN then status verified; actual browser return NOT_RUN. |
| H07 | NOT_RUN | Readback currently requires provider order ID learned from authenticated IPN; pre-IPN real return cannot be certified. |
| H08 | PARTIAL | Persisted invoice reuse proved; actual provider-tab close/reopen not exercised. |
| H09 | PASSED_LOCAL | Concurrent sign/create uses one invoice. |
| H10 | PASSED_LOCAL | Current initial/balance PDF visually inspected and unit/emulator snapshots checked. |
| A01 | PARTIAL | Guest/foreign handler rejection; actual sign-in recovery UI not exercised. |
| A02 | PARTIAL | Foreign owner handler +private collections denied; full staff receipt UI not exercised. |
| A03 | PARTIAL | Locked post-payment money review verified. |
| A04 | NOT_RUN | Production AppCheck configuration inspected; real enforcement not run. |
| A05 | PARTIAL | Five private collections guest/owner/foreign/staff denied. Existing ledger rule not newly certified. |
| V01 | PARTIAL | Domain/form overposting bindings checked; full browser tamper flow not run. |
| V02 | PARTIAL | ID/schema/method/body checks run; malformed raw-JSON parser outside bare handler not exercised. |
| V03 | PASSED_LOCAL | Exact VND parser unit negative cases. |
| V04 | PARTIAL | Stale balance target held; not every policy/cart/product branch rerun for SePay. |
| V05 | PASSED_LOCAL | Existing checkout bounds/sums and 30line PDF resource probe. |
| W01 | PARTIAL | Auth wrong/missing/oversize and constant-time comparison tests; duplicate HTTP header transport not separately exercised. |
| W02 | PARTIAL | Bare real HTTP handler method/content/body guards; deployed raw malformed JSON not run. |
| W03 | PASSED_LOCAL | Unknown invoice/conflicting replay rejected. |
| W04 | PARTIAL | Contradictory provider fields unit tested; every mismatch not exercised through inbox HTTP. |
| W05 | PASSED_LOCAL | Sequential/concurrent replay one evidence/ledger/receipt. |
| W06 | PARTIAL | Four process persisted-proof settlement proved; live IPN-vs-browser timing not run. |
| W07 | PASSED_LOCAL | Foreign checkout reference reuse retains conflict evidence. |
| W08 | PARTIAL | VOID +same/second replay guarded; all out-of-order notification permutations not run. |
| W09 | PASSED_LOCAL | VOID review/hold, no automatic money reversal. |
| W10 | PASSED_LOCAL | Unknown PII/card fields stripped by schema. |
| P01 | PARTIAL | Captured approved exact vs pending fixture verifier; live contract not run. |
| P02 | PASSED_LOCAL | Underpayment persisted review, no order/receipt. |
| P03 | PASSED_LOCAL | Overpayment persisted review, no order/receipt. |
| P04 | PARTIAL | Bounded transport/error/timeout/stream tests; not each remote status/TLS case against provider. |
| P05 | PARTIAL | Return fields never financial authority by source/contracts; browser refresh forgery not run. |
| P06 | PARTIAL | Already-cancelled then paid fixture held; concurrent provider cancellation race not run. |
| P07 | PARTIAL | Late/expired/cancelled money review evidence; no live provider transaction. |
| P08 | PASSED_LOCAL | Official SDK signature ordering +exact allowlist +CSP unit tested. |
| P09 | PARTIAL | Fixed order-ID path/docs and fixture validation; live provider lookup acceptance not run. |
| R01 | PARTIAL | Repeated create/sign reuses intent; real lost network response browser not run. |
| R02 | PARTIAL | Persisted proof recovery/expired leases tested; actual process kill at every step not run. |
| R03 | PARTIAL | Four independent process allocation race; injected every Firestore abort class not run. |
| R04 | PARTIAL | Active/expired intent and inbox leases tested; stale-worker timing permutations incomplete. |
| R05 | PASSED_LOCAL | Repeated PDF render failure bounded; paid/ledger unchanged. |
| R06 | PARTIAL | PDF failure and receipt unit guards; every snapshot/job/storage fault not covered in this SePay suite. |
| U01 | PARTIAL | Actual selector/CSS desktop320px/200% proxy; full authenticated checkout NOT_RUN. |
| U02 | PARTIAL | Selector keyboard/disabled/busy proxy; payment route dynamics NOT_RUN. |
| U03 | NOT_RUN | Generation/timer guards source reviewed; browser route/account switch not run. |
| U04 | NOT_RUN | Same-attempt recovery source/contract only; browser offline/provider-return loss not run. |
| S01 | PARTIAL | Config/domain/merchant guards checked; shared flag remains false; no real host acceptance. |
| S02 | PARTIAL | Exact demo guard source/unit; no production allocation attempted. |
| S03 | PARTIAL | 156JS files forbidden marker scan0, redaction fixtures; actual credential never accessed, not a whole-history secret scan. |
| S04 | PARTIAL | Exact demo DB plus testMode/provider metadata; real production analytics/shipment not exercised. |
| F01 | PARTIAL | Lease/cooldown regressions and bounded worker config; no production load benchmark. |
| F02 | PARTIAL | 10s/256KiB transport/cleanup tests; source confirms external I/O outside transactions. |
| F03 | NOT_RUN | Offline 50x30line PDF/queue probe available; repeated UI lifecycle measurement NOT_RUN. |
| D01 | PARTIAL | 238unit/27integration/17HTTPdemo checks passed; old asynchronous-PDF script failure retained, not relabeled. |
| D02 | NOT_RUN | Public IPN explicitly deferred. |
| D03 | NOT_RUN | Production/real money/email excluded. |
| M01 | PASSED_LOCAL | Real selector proxy3methods/defaultBANK_TRANSFER; same initial/balance component. |
| M02 | PASSED_LOCAL | Native disabled methods, keyboard,320px/200% proxy. |
| M03 | PASSED_LOCAL | Missing/CARD/NAPAS backend reject before checkout. |
| M04 | PARTIAL | Changed method ACK/fingerprint checks. |
| M05 | PARTIAL | Pinnedmethod form/proof/PDF checks; actual browser refresh not run. |
| M06 | PASSED_LOCAL | Initial/balance integration +legacy demo acknowledgement compatibility. |
| M07 | PARTIAL | Missing capability UI +server readiness guards; actual live credential revocation not run. |
| M08 | PASSED_LOCAL | Selector has no payment effect; confirmation/server commit remains required. |

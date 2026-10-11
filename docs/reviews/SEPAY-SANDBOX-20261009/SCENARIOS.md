# SePay sandbox scenario matrix — v2

Planned only; no new SePay tests executed. Public IPN/production remain deferred.

| ID | Category | Scenario / expected result | Status |
| --- | --- | --- | --- |
| H01 | happy | Listed item → recipient → overview → SePay sandbox → verified payment → one order/ledger/PDF job. | NOT_RUN |
| H02 | happy | Custom researched-price item charges full researched goods plus configured service fee, no legacy deposit. | NOT_RUN |
| H03 | happy | Mixed cart with quantities/variants allocates exact server totals across all order lines. | NOT_RUN |
| H04 | happy | Approved sourcing-price increase → customer-reviewed balance → exact due only, receipt links prior payment. | NOT_RUN |
| H05 | happy | Final shipping/customs adjustment → balance checkout → funding barrier clears only after proof. | NOT_RUN |
| H06 | happy | IPN before browser return; returning page reads paid, no duplicate writes. | NOT_RUN |
| H07 | happy | Browser return before IPN; authenticated provider readback settles once. | NOT_RUN |
| H08 | happy | Close tab on provider page; reopen same checkout, reuse invoice and reconcile. | NOT_RUN |
| H09 | happy | Repeated create/sign request reuses immutable invoice and amount. | NOT_RUN |
| H10 | happy | Private PDF contains correct product lines, quantities, method, sandbox notice, timestamp and total. | NOT_RUN |
| A01 | auth | Guest cannot create/status/reconcile another payment; direct route offers existing sign-in recovery. | NOT_RUN |
| A02 | auth | Different owner/staff without owner authority cannot read or mutate another intent/receipt. | NOT_RUN |
| A03 | auth | Locked account cannot create new attempts; received money retained with fulfillment hold if lock occurs later. | NOT_RUN |
| A04 | auth | AppCheck checks remain enforced outside exact emulator; no broad auth bypass. | NOT_RUN |
| A05 | auth | Direct Firestore guest/owner/staff writes to intent/index/inbox/proof/ledger denied. | NOT_RUN |
| V01 | validation | Tampered client total, currency, merchant, provider, invoice or callback URL rejected/ignored in favor of server snapshot. | NOT_RUN |
| V02 | validation | Malformed UUID, oversized body/description, unknown fields/enums and unsupported payment method rejected. | NOT_RUN |
| V03 | validation | Exact VND parser handles decimal .00 only; rejects fractional VND, negatives, exponent/NaN/Infinity/unsafe integers. | NOT_RUN |
| V04 | validation | Expired preview, changed policy/product/cart revision or stale balance version cannot create a payable new snapshot. | NOT_RUN |
| V05 | validation | Amount/line sums and max30line bound verified; no float rounding or overflow. | NOT_RUN |
| W01 | ipn | Missing/wrong/duplicate auth header or timing-safe mismatch cannot admit IPN or reveal key. | NOT_RUN |
| W02 | ipn | GET/wrong content type/oversize/malformed JSON/IPN schema rejected with bounded response and no raw logs. | NOT_RUN |
| W03 | ipn | Valid auth but unknown invoice/reference cannot allocate or create arbitrary orders. | NOT_RUN |
| W04 | ipn | Valid IPN contradicted by authenticated provider readback stays pending/review; no trust in callback alone. | NOT_RUN |
| W05 | ipn | Same valid IPN repeated sequentially produces one evidence/ledger/receipt/outbox. | NOT_RUN |
| W06 | ipn | Concurrent IPN and return-reconcile across two processes produce one settlement transaction. | NOT_RUN |
| W07 | ipn | Same provider transaction reused for different checkout cannot pay both. | NOT_RUN |
| W08 | ipn | Reordered or stale authenticated notifications cannot downgrade paid or overwrite immutable proof. | NOT_RUN |
| W09 | ipn | TRANSACTION_VOID event records review/audit; no autonomous refund or ledger reversal. | NOT_RUN |
| W10 | ipn | Card/PII fields in unexpected provider payload are dropped and not persisted/logged. | NOT_RUN |
| P01 | provider | Provider CAPTURED plus approved PAYMENT transaction exact invoice/amount/currency settles; pending does not. | NOT_RUN |
| P02 | provider | Underpayment enters review without releasing funding/fulfillment; evidence retained. | NOT_RUN |
| P03 | provider | Overpayment enters review without invented refund or silently accepting wrong total. | NOT_RUN |
| P04 | provider | Provider401/403/404/429/500, timeout, TLS/network error retain same attempt and redact credentials. | NOT_RUN |
| P05 | provider | Success/error/cancel URL forged or refreshed cannot change payment state. | NOT_RUN |
| P06 | provider | Cancellation races with real payment: readback determines paid/review, no double checkout/free reservation. | NOT_RUN |
| P07 | provider | Payment received after local expiry/cancel keeps financial evidence for reconciliation, no lost receipt. | NOT_RUN |
| P08 | provider | SDK signing field order and exact sandbox action retained; foreign/production checkout host rejected. | NOT_RUN |
| P09 | provider | Provider invoice-versus-order_id lookup semantics verified; unknown response shapes fail closed. | NOT_RUN |
| R01 | recovery | Lost create/sign response: exact same operation/invoice replay, no second financial intent. | NOT_RUN |
| R02 | recovery | Process stops after inbox admit, after proof save, or before acknowledgement; restart safely resumes without duplicate allocation. | NOT_RUN |
| R03 | recovery | Firestore transaction abort/conflict/retry preserves all-or-nothing money/order/job writes. | NOT_RUN |
| R04 | recovery | Expired worker lease reclaimed; active lease respected; stale worker cannot overwrite newer outcome. | NOT_RUN |
| R05 | recovery | Receipt rendering/storage failure retries independently; paid state remains paid and cannot charge again. | NOT_RUN |
| R06 | recovery | Receipt snapshot mutation/missing job/duplicate trigger fails safely with bounded non-sensitive failure code. | NOT_RUN |
| U01 | ui | Desktop/mobile preserves approved cart/checkout cards and compact action; no unexpected provider-only empty page. | NOT_RUN |
| U02 | ui | Keyboard/focus/loading/error/manual retry accessible; pending does not claim payment success. | NOT_RUN |
| U03 | ui | Route/account switch/unmount while request pending ignores stale response, clears timers and preserves other account privacy. | NOT_RUN |
| U04 | ui | Browser offline or provider return lost presents durable recovery for same checkout; no auto-new attempt. | NOT_RUN |
| S01 | isolation | Missing secret/config or non-test merchant fails closed; no production SePay endpoint ever contacted. | NOT_RUN |
| S02 | isolation | Wrong DB/project/emulator identity blocks sandbox allocation; production payment/email holds remain unchanged. | NOT_RUN |
| S03 | isolation | Secret/auth/signed form values absent from bundle, source, Git, error logs, telemetry and report artifacts. | NOT_RUN |
| S04 | isolation | Bank-transfer sandbox records and receipts cannot count as production revenue or release real shipment. | NOT_RUN |
| F01 | performance | Bounded parallel retries/duplicate notifications: one provider readback per lease, bounded queries/body/response/queue. | NOT_RUN |
| F02 | performance | HTTP timeout/backoff/response limits and no provider I/O inside retrying Firestore transaction. | NOT_RUN |
| F03 | performance | Repeated UI mounting/route swaps and max30line PDF renders leave no unbounded timer/subscription/buffer growth; measure, do not claim zero leaks. | NOT_RUN |
| D01 | regression | Existing demo happy/negative/cross-process and legacy order/payment guards still pass after allocation extraction. | NOT_RUN |
| D02 | deferred | Real SePay→public HTTPS IPN dashboard test explicitly NOT_RUN in local-only phase. | NOT_RUN |
| D03 | deferred | Production gateway/real money/email deployment explicitly excluded and NOT_RUN. | NOT_RUN |
| M01 | methods | Overview displays3methods; only backend-ready BANK_TRANSFER is enabled/default selected; no new checkout step. | NOT_RUN |
| M02 | methods | Disabled NAPAS/CARD cannot be selected by mouse/keyboard; labels/reason remain readable at320px. | NOT_RUN |
| M03 | methods | Tampered NAPAS/CARD/unknown method payload rejected by backend capability gate even when enum knows all3. | NOT_RUN |
| M04 | methods | Changing method with same operation ID after commit/retry fails fingerprint validation; no new allocation. | NOT_RUN |
| M05 | methods | Stored method survives return/refresh/unknown response and matches signed form, verified provider transaction and PDF. | NOT_RUN |
| M06 | methods | Initial and balance checkout use identical method selection/admission; legacy demo replay missing method remains compatible. | NOT_RUN |
| M07 | methods | Missing secret/runtime/capability or capability revoked before provider form: no misleading ready state, no provider submission. | NOT_RUN |
| M08 | methods | Choosing method alone causes no order/intent/provider call; confirmation and server snapshot validation still required. | NOT_RUN |

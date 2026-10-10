# Required CRM→customer scenarios

Status: PLANNED; these acceptance cases are not claimed executed. Existing baseline71unit+54emulator passed in adjacent logs, with narrower coverage. Use synthetic fixtures and real CRM/callable transport for end-to-end gates. Do not seed the timeline events being tested. Every executed case must record trigger, DB before/after, UI Account/owner Ask/guest Ask observed outcome, transport mode, assertions, screenshot/log and cleanup.

| ID | Class | Scenario | Required outcome |
| --- | --- | --- | --- |
| H01 | Happy | Custom approved checkout → purchase → receive → pack → dispatch | Each real business command produces correct current/next step and recorded date; financial policy intact. |
| H02 | Happy | Catalog full-payment order through delivery | No deposit/balance semantics invented; correct shared owner timeline. |
| H03 | Happy | CRM single-parcel dispatch | Parcel, order.stage/version, projection, safe order event and owner/public recorded time commit together. |
| H04 | Happy | CRM set/edit/remove ETA with customer Account already open | Order version signal triggers reload; aggregate/time/unknown matches database without browser reload. |
| H05 | Happy | Owner Ask already open during CRM update | Active answer refreshes, old turns remain snapshots, no new provider/AI calls. |
| H06 | Happy | Anonymous Ask active during CRM update | Allowlisted progress/ETA refresh within60seconds, no private data or ordinary order-ID access. |
| H07 | Happy | Two parcels partially then fully delivered | One parcel never completes whole order; only exact delivered quantities yield DELIVERED. |
| H08 | Happy | Two orders/owners share one parcel | Each gets own redacted allocations, correct events and versions, no manifest leak. |
| H09 | Happy | Consolidated batch dispatch | Parity with direct dispatch; updatedAt and milestone time present; finance unchanged. |
| H10 | Happy | ETA + shipment tracking then recipient confirmation | ETA edit does not rewrite dispatch date; delivery/receipt times remain event-backed. |
| N01 | Negative | Unauthenticated/unverified/locked/revoked staff | Server denies, zero partial writes/projections/events/version bumps. |
| N02 | Negative | Warehouse attempts ETA/track; manager attempts unauthorized pack | Live role enforcement preserved regardless UI button tampering. |
| N03 | Negative | Owner/nonowner/anonymous direct private reads | Rules+callable deny cross-owner access; SGT only exposes strict4-field DTO. |
| N04 | Negative | Unpaid/hold/unapproved final total dispatch | Rejected; no stage/version/history/projection side effect. |
| N05 | Negative | Overallocated/duplicate/wrong-order/wrong-line parcel | Rejected atomically; allocation registry consistent. |
| N06 | Negative | Partial/incomplete allocation, missing parcel/projection, mismatched revisions | No false whole-order ETA/completion; partial/unknown disclosed. |
| N07 | Negative | Malformed/null/future/reversed/elapsed ETA and missing evidence | Server validates; no invented time; existing safe message/recovery. |
| N08 | Negative | ETA expired while UI open | No current promise from stale estimate; null/expired distinct. |
| N09 | Negative | Failed delivery, return, hold | Public uncertainty/ETA suppression; owner sees actual known state; no delivered success. |
| N10 | Negative | Delivered/returned terminal parcel reopening attempt | Denied except any separately approved domain recovery; no ad hoc regression. |
| N11 | Negative | Same operationId exact replay after response loss | Same result; one event/revision/outbox record only. |
| N12 | Negative | Same operationId changed payload or action | Denied; no overwritten result or duplicated mutation. |
| N13 | Negative | Stale expectedVersion/orderVersions | Atomic abort; CRM retains draft and offers legitimate refresh/reconcile. |
| N14 | Negative | Two staff concurrent ETA/delivery; financial update concurrent shipment | No lost update/double version or duplicate history; conflicts recover safely. |
| N15 | Negative | Transaction failure after scheduling writes | No partial canonical/projection/order/event publication. |
| N16 | Negative | Transport timeout after commit vs before commit | Unknown outcome reconciled with same operationId; no blind fresh-operation retry. |
| N17 | Negative | Customer offline during CRM update then reconnect | Honest stale state/read time; bounded refresh resumes, no data cross-scope. |
| N18 | Negative | Slow lookup15s and late response | Deadline ends pending; stale completion cannot overwrite newer revision. |
| N19 | Negative | Logout/account switch while subscription/refetch pending | Immediate scope clearing, listener cleanup; old response discarded. |
| N20 | Negative | Order/code A→B→A response permutations | Generation fencing even same final identifier; no stale publication. |
| N21 | Negative | Modal close/reopen, unmount, hidden tab | Cleanup; no hidden polling, duplicate listener, repeated request storm. |
| N22 | Negative | Guest code invalid/expired/revoked/rotated/ordinary order ID | Generic safe failure; no existence oracle, private fallback or resurrected capability. |
| N23 | Negative | Guest quota429, same IP multiple tabs/users | Stop/backoff honestly; limits unchanged, coalescing and one-flight work. |
| N24 | Negative | Backend missing/unavailable, permission-denied during refresh | Safe recovery; current owner data scope verified or cleared; no raw diagnostics/PII. |
| N25 | Negative | Tampered public DTO/internal note actor or PII injection | Strict schema/redaction; DOM/storage/URL/analytics/provider/log sinks remain clear. |
| N26 | Negative | Legacy missing times/history beyond50 events | Unknown/partial explicit; no backfill from read time or guessed transitions. |
| N27 | Negative | Out-of-order/duplicate/future events and ETA-only activity | Latest valid semantic status timestamp chosen; estimate edit not new dispatch. |
| N28 | Negative | Cross-owner code issuance/rotation concurrent auth change | Denied or fenced; code not persisted/exposed in transcript or private API fallback. |
| U01 | UI/UX | VI/EN320/390/1280px, long translated labels/timezone | Approved Account/Ask visual fidelity, single-line time, no card overflow. |
| U02 | UI/UX | Keyboard log/refresh/stop/close and dynamic update | Focus stable; semantic ordered list/current step; concise aria-live, no repeated announcement storm. |
| U03 | UI/UX | Settled axe and reduced motion | No critical accessibility finding; motion finite and disabled when requested; missing automated checks disclosed. |
| U04 | UI/UX | CRM success/error/conflict/unknown acknowledgement | Success only after authoritative response; actions explain parcel versus whole-order delivery. |
| P01 | Performance | 1/10 affected orders +1/20 batch parcels | Bounded transaction write count/latency, no unbounded loop, no duplicate publication. |
| P02 | Performance | 60 parcels/50 history events + invalid over-limit inputs | Read/query cap preserved; fail closed, measure no production SLA claim. |
| P03 | Performance | Rapid10 revisions and many active/hidden tabs | One-flight/coalesced owner refresh; bounded guest traffic; no listener/timer leak. |
| P04 | Performance | Concurrent staff and shared-IP guest quota load | Contention/retry cost measured; no auth/rate-limit weakening. |

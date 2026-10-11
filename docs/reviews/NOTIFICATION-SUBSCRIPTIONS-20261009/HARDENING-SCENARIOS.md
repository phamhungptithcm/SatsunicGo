# Real scenario coverage

149 unit/regression tests + 6 actual React controller browser scenarios + 2 Firestore emulator tests. Counts represent test cases; security integration contains 63 denied access assertions. All statuses below come from current executed evidence.

| ID | Layer | Scenario | Result |
|---|---|---|---|
| NSH-001 | unit/regression | approved customer email catalog renders request_received as concise safe HTML and matching plain text | PASSED |
| NSH-002 | unit/regression | approved customer email catalog renders order_received as concise safe HTML and matching plain text | PASSED |
| NSH-003 | unit/regression | approved customer email catalog renders quote_ready as concise safe HTML and matching plain text | PASSED |
| NSH-004 | unit/regression | approved customer email catalog renders quote_accepted as concise safe HTML and matching plain text | PASSED |
| NSH-005 | unit/regression | approved customer email catalog renders payment_reported as concise safe HTML and matching plain text | PASSED |
| NSH-006 | unit/regression | approved customer email catalog renders payment_confirmed as concise safe HTML and matching plain text | PASSED |
| NSH-007 | unit/regression | approved customer email catalog renders payment_review as concise safe HTML and matching plain text | PASSED |
| NSH-008 | unit/regression | approved customer email catalog renders payment_failed as concise safe HTML and matching plain text | PASSED |
| NSH-009 | unit/regression | approved customer email catalog renders payment_expired as concise safe HTML and matching plain text | PASSED |
| NSH-010 | unit/regression | approved customer email catalog renders price_change_proposed as concise safe HTML and matching plain text | PASSED |
| NSH-011 | unit/regression | approved customer email catalog renders change_proposed as concise safe HTML and matching plain text | PASSED |
| NSH-012 | unit/regression | approved customer email catalog renders change_accepted as concise safe HTML and matching plain text | PASSED |
| NSH-013 | unit/regression | approved customer email catalog renders change_rejected as concise safe HTML and matching plain text | PASSED |
| NSH-014 | unit/regression | approved customer email catalog renders change_applied as concise safe HTML and matching plain text | PASSED |
| NSH-015 | unit/regression | approved customer email catalog renders order_hold as concise safe HTML and matching plain text | PASSED |
| NSH-016 | unit/regression | approved customer email catalog renders purchase_partial as concise safe HTML and matching plain text | PASSED |
| NSH-017 | unit/regression | approved customer email catalog renders purchase_completed as concise safe HTML and matching plain text | PASSED |
| NSH-018 | unit/regression | approved customer email catalog renders warehouse_received as concise safe HTML and matching plain text | PASSED |
| NSH-019 | unit/regression | approved customer email catalog renders warehouse_issue as concise safe HTML and matching plain text | PASSED |
| NSH-020 | unit/regression | approved customer email catalog renders final_balance_due as concise safe HTML and matching plain text | PASSED |
| NSH-021 | unit/regression | approved customer email catalog renders final_no_balance as concise safe HTML and matching plain text | PASSED |
| NSH-022 | unit/regression | approved customer email catalog renders excess_payment_review as concise safe HTML and matching plain text | PASSED |
| NSH-023 | unit/regression | approved customer email catalog renders shipment_dispatched as concise safe HTML and matching plain text | PASSED |
| NSH-024 | unit/regression | approved customer email catalog renders shipment_progress as concise safe HTML and matching plain text | PASSED |
| NSH-025 | unit/regression | approved customer email catalog renders delivery_estimate_changed as concise safe HTML and matching plain text | PASSED |
| NSH-026 | unit/regression | approved customer email catalog renders delivery_failed as concise safe HTML and matching plain text | PASSED |
| NSH-027 | unit/regression | approved customer email catalog renders shipment_returned as concise safe HTML and matching plain text | PASSED |
| NSH-028 | unit/regression | approved customer email catalog renders parcel_delivered_partial as concise safe HTML and matching plain text | PASSED |
| NSH-029 | unit/regression | approved customer email catalog renders order_delivered as concise safe HTML and matching plain text | PASSED |
| NSH-030 | unit/regression | approved customer email catalog renders order_cancelled as concise safe HTML and matching plain text | PASSED |
| NSH-031 | unit/regression | approved customer email catalog renders refund_requested as concise safe HTML and matching plain text | PASSED |
| NSH-032 | unit/regression | approved customer email catalog renders refund_request_cancelled as concise safe HTML and matching plain text | PASSED |
| NSH-033 | unit/regression | approved customer email catalog renders refund_recorded as concise safe HTML and matching plain text | PASSED |
| NSH-034 | unit/regression | approved customer email catalog renders financial_adjustment as concise safe HTML and matching plain text | PASSED |
| NSH-035 | unit/regression | approved customer email catalog renders payment_allocated as concise safe HTML and matching plain text | PASSED |
| NSH-036 | unit/regression | approved customer email catalog renders order_reply as concise safe HTML and matching plain text | PASSED |
| NSH-037 | unit/regression | approved customer email catalog renders support_reply as concise safe HTML and matching plain text | PASSED |
| NSH-038 | unit/regression | approved customer email catalog renders membership_activated as concise safe HTML and matching plain text | PASSED |
| NSH-039 | unit/regression | approved customer email catalog renders membership_expiring as concise safe HTML and matching plain text | PASSED |
| NSH-040 | unit/regression | approved customer email catalog renders membership_expired as concise safe HTML and matching plain text | PASSED |
| NSH-041 | unit/regression | approved customer email catalog renders receipt_ready as concise safe HTML and matching plain text | PASSED |
| NSH-042 | unit/regression | approved customer email catalog renders internal_document_issued as concise safe HTML and matching plain text | PASSED |
| NSH-043 | unit/regression | approved customer email catalog keeps all 42 approved layouts byte-identical to the reviewed authoring templates | PASSED |
| NSH-044 | unit/regression | approved customer email catalog escapes hostile text, rejects header controls and never accepts a supplied CTA | PASSED |
| NSH-045 | unit/regression | approved customer email catalog rejects unknown/invalid money null instead of showing zero | PASSED |
| NSH-046 | unit/regression | approved customer email catalog rejects unknown/invalid money undefined instead of showing zero | PASSED |
| NSH-047 | unit/regression | approved customer email catalog rejects unknown/invalid money -1 instead of showing zero | PASSED |
| NSH-048 | unit/regression | approved customer email catalog rejects unknown/invalid money 1.5 instead of showing zero | PASSED |
| NSH-049 | unit/regression | approved customer email catalog rejects unknown/invalid money 9007199254740992 instead of showing zero | PASSED |
| NSH-050 | unit/regression | approved customer email catalog rejects unknown/invalid money 0 instead of showing zero | PASSED |
| NSH-051 | unit/regression | approved customer email catalog rejects missing fields, new versions, excessive text and arbitrary payment promises | PASSED |
| NSH-052 | unit/regression | approved customer email catalog keeps conditional/unread/receipt/progress policy closed without evidence | PASSED |
| NSH-053 | unit/regression | approved customer email catalog hashes persisted snapshots independently of Firestore field ordering | PASSED |
| NSH-054 | unit/regression | uses net collections, blocks reserved final balance and preserves refund-recorded semantics | PASSED |
| NSH-055 | unit/regression | projects only the recipient's parcel allocations and distinguishes partial/full delivery | PASSED |
| NSH-056 | unit/regression | stable business keys do not depend on retry timestamp | PASSED |
| NSH-057 | unit/regression | requires cutover and authoritative owner; suppresses renewed membership and stale proposals before send | PASSED |
| NSH-058 | unit/regression | invalid notification projection never aborts the enclosing business command | PASSED |
| NSH-059 | unit/regression | batch parcel projection links only orders actually present in the parcel | PASSED |
| NSH-060 | unit/regression | rejects inconsistent customer-visible financial arithmetic | PASSED |
| NSH-061 | unit/regression | suppresses obsolete refund requests, cleared warehouse issues and stale proposals | PASSED |
| NSH-062 | unit/regression | does not request final payment during a hold or invent missing warehouse quantity | PASSED |
| NSH-063 | unit/regression | rechecks confirmed optional order-email purpose and destination; opt-out never falls back to promotions | PASSED |
| NSH-064 | unit/regression | preserves required financial confirmation independently of optional update preferences | PASSED |
| NSH-065 | unit/regression | notification email meaning does not describe membership or unknown events as order updates | PASSED |
| NSH-066 | unit/regression | internal statement email discloses its type without customer data or capability secrets | PASSED |
| NSH-067 | unit/regression | invalid invoice document ID  does not starve later queued email | PASSED |
| NSH-068 | unit/regression | invalid invoice document ID nested/id does not starve later queued email | PASSED |
| NSH-069 | unit/regression | invalid invoice document ID nested/id/valid does not starve later queued email | PASSED |
| NSH-070 | unit/regression | invalid invoice document ID undefined does not starve later queued email | PASSED |
| NSH-071 | unit/regression | SMTP uncertainty persists reconciliation-required and never resends automatically | PASSED |
| NSH-072 | unit/regression | a current issued invoice with matching owner and number still sends | PASSED |
| NSH-073 | unit/regression | abandoned sending claims require reconciliation and are not resent | PASSED |
| NSH-074 | unit/regression | late SMTP outcome cannot overwrite a reconciled job | PASSED |
| NSH-075 | unit/regression | actual code-owned email hold denies before every port despite enabled config and queued work | PASSED |
| NSH-076 | unit/regression | legacy backlog never sends merely because transport settings are enabled | PASSED |
| NSH-077 | unit/regression | recipient/content mutation or expired provider window requires reconciliation | PASSED |
| NSH-078 | unit/regression | typed sending rechecks policy and pins HTML and recipient before provider acceptance | PASSED |
| NSH-079 | unit/regression | preflight dependency failure records a known unsent failure without calling SMTP | PASSED |
| NSH-080 | unit/regression | unauthenticated and non-Google callers cannot read preferences | PASSED |
| NSH-081 | unit/regression | owner/email fields supplied by caller are rejected | PASSED |
| NSH-082 | unit/regression | verified current Auth identity and uid drive read; release holds cannot be bypassed with settings | PASSED |
| NSH-083 | unit/regression | disabled current identity overrides stale verified session claims | PASSED |
| NSH-084 | unit/regression | possession token can confirm without login, and only reaches token service | PASSED |
| NSH-085 | unit/regression | malformed public token is rejected before service or database access | PASSED |
| NSH-086 | unit/regression | notification consent ownership and lifecycle phone parsing, strict payloads and no caller-selected owner/destination email | PASSED |
| NSH-087 | unit/regression | notification consent ownership and lifecycle no historical opt-in; destination change requires reconfirmation | PASSED |
| NSH-088 | unit/regression | notification consent ownership and lifecycle concurrent replay queues one job; different intent with same operation fails | PASSED |
| NSH-089 | unit/regression | notification consent ownership and lifecycle stale version cannot overwrite consent and accounts are isolated | PASSED |
| NSH-090 | unit/regression | notification consent ownership and lifecycle locked user cannot save; phone is required for SMS | PASSED |
| NSH-091 | unit/regression | notification consent ownership and lifecycle revocation is allowed at quota and does not resend another pending channel | PASSED |
| NSH-092 | unit/regression | notification consent ownership and lifecycle resend is bounded and an all-off save does not consume sending quota | PASSED |
| NSH-093 | unit/regression | notification consent ownership and lifecycle confirmation stores hashes only, activates once and queues one welcome | PASSED |
| NSH-094 | unit/regression | notification consent ownership and lifecycle old link cannot reactivate revoked choices | PASSED |
| NSH-095 | unit/regression | notification consent ownership and lifecycle expired, wrong-action, changed-email and disabled identity links fail closed | PASSED |
| NSH-096 | unit/regression | notification consent ownership and lifecycle corrupt cross-channel challenge is rejected | PASSED |
| NSH-097 | unit/regression | notification consent ownership and lifecycle welcome unsubscribe revokes scoped topics and cannot grant account access | PASSED |
| NSH-098 | unit/regression | subscription delivery boundary missing SMS provider does no database or sender I/O | PASSED |
| NSH-099 | unit/regression | subscription delivery boundary concurrent workers send once; accepted job cannot be replayed | PASSED |
| NSH-100 | unit/regression | subscription delivery boundary unknown provider outcome is terminal until reconciliation | PASSED |
| NSH-101 | unit/regression | subscription delivery boundary historical queued confirmations expire instead of sending on later activation | PASSED |
| NSH-102 | unit/regression | subscription delivery boundary revoked before delivery suppresses without sending | PASSED |
| NSH-103 | unit/regression | subscription delivery boundary unverified identity suppresses delivery; unsafe origin fails | PASSED |
| NSH-104 | unit/regression | subscription delivery boundary email and SMS templates have real actions and no tracking assets | PASSED |
| NSH-105 | unit/regression | subscription delivery boundary optional delivery fails closed and required financial mail is preserved | PASSED |
| NSH-106 | unit/regression | legacy marketing consent alone cannot authorize promotion dispatch | PASSED |
| NSH-107 | unit/regression | NOT-17 terminal queue retirement missing identity retires queued job without changing consent | PASSED |
| NSH-108 | unit/regression | NOT-17 terminal queue retirement disabled identity retires queued job without changing consent | PASSED |
| NSH-109 | unit/regression | NOT-17 terminal queue retirement unverified identity retires queued job without changing consent | PASSED |
| NSH-110 | unit/regression | NOT-17 terminal queue retirement no email identity retires queued job without changing consent | PASSED |
| NSH-111 | unit/regression | NOT-17 terminal queue retirement auth/user-not-found is permanent, not an outage | PASSED |
| NSH-112 | unit/regression | NOT-17 terminal queue retirement auth/invalid-uid is permanent, not an outage | PASSED |
| NSH-113 | unit/regression | NOT-17 terminal queue retirement auth/internal-error leaves job retryable and later healthy lookup can send | PASSED |
| NSH-114 | unit/regression | NOT-17 terminal queue retirement auth/network-request-failed leaves job retryable and later healthy lookup can send | PASSED |
| NSH-115 | unit/regression | NOT-17 terminal queue retirement auth/too-many-requests leaves job retryable and later healthy lookup can send | PASSED |
| NSH-116 | unit/regression | NOT-17 terminal queue retirement unknown leaves job retryable and later healthy lookup can send | PASSED |
| NSH-117 | unit/regression | NOT-17 terminal queue retirement expired queued job retires before Auth lookup even during an outage | PASSED |
| NSH-118 | unit/regression | NOT-17 terminal queue retirement malformed queued snapshot is retired: {"ownerId":"bad/owner"} | PASSED |
| NSH-119 | unit/regression | NOT-17 terminal queue retirement malformed queued snapshot is retired: {"channel":"sms"} | PASSED |
| NSH-120 | unit/regression | NOT-17 terminal queue retirement malformed queued snapshot is retired: {"scopes":[]} | PASSED |
| NSH-121 | unit/regression | NOT-17 terminal queue retirement malformed queued snapshot is retired: {"createdAt":"unknown"} | PASSED |
| NSH-122 | unit/regression | NOT-17 terminal queue retirement never overwrites existing sending state | PASSED |
| NSH-123 | unit/regression | NOT-17 terminal queue retirement never overwrites existing accepted state | PASSED |
| NSH-124 | unit/regression | NOT-17 terminal queue retirement never overwrites existing unknown state | PASSED |
| NSH-125 | unit/regression | NOT-17 terminal queue retirement never overwrites existing rejected state | PASSED |
| NSH-126 | unit/regression | NOT-17 terminal queue retirement never overwrites existing expired state | PASSED |
| NSH-127 | unit/regression | NOT-17 terminal queue retirement never overwrites existing blocked_recipient state | PASSED |
| NSH-128 | unit/regression | NOT-17 terminal queue retirement never overwrites existing blocked_content state | PASSED |
| NSH-129 | unit/regression | NOT-17 terminal queue retirement identity block cannot overwrite raced accepted snapshot | PASSED |
| NSH-130 | unit/regression | NOT-17 terminal queue retirement identity block cannot overwrite raced unknown snapshot | PASSED |
| NSH-131 | unit/regression | NOT-17 terminal queue retirement identity block cannot overwrite raced sending snapshot | PASSED |
| NSH-132 | unit/regression | NOT-17 terminal queue retirement identity block cannot overwrite raced queued snapshot | PASSED |
| NSH-133 | unit/regression | NOT-17 terminal queue retirement successful identity cannot claim a changed queued payload | PASSED |
| NSH-134 | unit/regression | NOT-17 malformed persisted preference retires job without resetting consent | PASSED |
| NSH-135 | unit/regression | real-world subscription delivery interleavings customer becomes locked after claim: no provider side effect | PASSED |
| NSH-136 | unit/regression | real-world subscription delivery interleavings customer becomes revoked after claim: no provider side effect | PASSED |
| NSH-137 | unit/regression | real-world subscription delivery interleavings customer becomes missing-consent after claim: no provider side effect | PASSED |
| NSH-138 | unit/regression | real-world subscription delivery interleavings customer becomes corrupt-consent after claim: no provider side effect | PASSED |
| NSH-139 | unit/regression | real-world subscription delivery interleavings customer becomes lost-claim after claim: no provider side effect | PASSED |
| NSH-140 | unit/regression | real-world subscription delivery interleavings preflight database outage records uncertainty without calling provider or hanging sending | PASSED |
| NSH-141 | unit/regression | real-world subscription delivery interleavings late provider acceptance cannot report accepted over a newer reconciliation state | PASSED |
| NSH-142 | unit/regression | real-world subscription delivery interleavings provider rejection is terminal; repeated worker does not send again | PASSED |
| NSH-143 | unit/regression | real-world subscription delivery interleavings 50 competing workers create one challenge and make one provider call | PASSED |
| NSH-144 | unit/regression | real-world subscription delivery interleavings 20 concurrent resend requests respect recipient quota atomically | PASSED |
| NSH-145 | unit/regression | real-world subscription delivery interleavings SMS choice is stored pending with normalized phone; unavailable sender does not claim | PASSED |
| NSH-146 | unit/regression | release hold prevents database, secrets and transport access | PASSED |
| NSH-147 | unit/regression | disabled subscription setting prevents secret and provider access | PASSED |
| NSH-148 | unit/regression | worker bounds both scans to 20 and closes transport after batch | PASSED |
| NSH-149 | unit/regression | one database failure cannot starve subsequent jobs; warning excludes raw exception and recipient | PASSED |
| NSH-150 | real React in browser, service fake | Lost save response retries same operation once | PASSED |
| NSH-151 | real React in browser, service fake | Reload during save must not orphan busy state | PASSED |
| NSH-152 | real React in browser, service fake | Duplicate clicks send one command | PASSED |
| NSH-153 | real React in browser, service fake | Version conflict allows explicit reload | PASSED |
| NSH-154 | real React in browser, service fake | Sign out while save in flight hides old owner and ignores late response | PASSED |
| NSH-155 | real React in browser, service fake | Invalid SMS never calls mutation endpoint | PASSED |
| NSH-156 | shared demo Firestore emulator | Real Firestore: concurrent replay, confirmation, scoped opt-out, stale token, permanent/transient identity, expiry, malformed/raced job | PASSED |
| NSH-157 | shared demo Firestore emulator | Real Firestore rules: owner/stranger/anonymous denied read/write/delete across seven server-only collections (63 assertions) | PASSED |

## Business journey and limits

| Journey / risk | Expected result | Current evidence |
|---|---|---|
| First opt-in | Pending until explicit token confirmation; no imported legacy consent | Lifecycle unit + real Firestore |
| Order messages and promotion messages | Independent confirmed scope; disabling promotion preserves order topic | Policy regressions + real Firestore |
| SMS without provider | Store normalized phone and pending choice; zero provider calls/claim | Unit; SMS actual delivery NOT_RUN |
| Save response lost / retry | Freeze edits; reuse operation ID; one durable version change | Actual React browser harness + transaction replay |
| Reload/double-click/sign-out during save | No orphaned busy state, duplicate mutation or previous-owner UI | Actual React browser harness |
| Lock/revoke/change consent or claim between transaction and send | Suppress without provider call; preserve newer durable result | Controlled unit interleavings |
| Corrupt stored consent / dependency outage | No unintended delivery; suppressed or explicit unknown awaiting reconciliation | Unit injection |
| Email provider rejects / throws / returns late | No automatic replay; fenced durable outcome wins | Unit fake provider |
| Auth outage vs deleted owner | Temporary outage retains queued state; invalid recipient retires | Unit + real Firestore |
| Direct client mutation / token owner spoof | Server-only collections inaccessible; strict callable payload and current Auth identity | Rules 63 deny assertions + endpoint unit |
| Financial email after optional opt-out | Required receipt/action/financial policy remains eligible | Email regressions |
| Worker failure | One failing selected job does not abort subsequent selected jobs; sanitized warning, transport cleanup | Worker unit |
| Resource bounds | Queued/stale scans limit20; 50 same-job workers → one provider call, one challenge; 20 resend contenders → one successful cooldown request | Worker/controller transaction fakes; real Firestore eight duplicate saves/three workers |
| Live checkout→authenticated callable→provider→inbox/SMS | Actual deployed source, real verified identity, actual delivery and unsubscribe required | NOT_VERIFIED / NOT_RUN; provider unavailable/release holds intact |
| Production latency, throughput, long backlog fairness | Measure real backend/provider under agreed load | NOT_RUN; local stress is not production capacity |

## Residual risks

- Final Firestore preflight and external send are not atomic. Revocation/lock/identity changes after the last check can race an already-started send.
- Selective persistent Auth outages at the first 20 queued jobs can delay later jobs. Current worker retains retryable jobs; durable backoff/fair queue scheduling is deferred to provider integration. Existing permanent poison rows retire.
- Stale sending recovery scans 20 rows; sufficiently large active/stuck populations require backlog/fairness validation before release.
- An unknown result requires reconciliation. SMTP message IDs do not prove provider deduplication.
- No authenticated browser-to-running-Functions E2E, real SMTP/Resend acceptance, SMS delivery, load/SLA certification, production activation or deployment is claimed.

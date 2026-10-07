# SatsunicGo release sanity cases — 2026-10-05

Production decision: **NOT_READY** until the external cases and release gates below have verified evidence. Production target is `satsunicgo`; the owner explicitly declined a separate staging project. Local execution uses disposable demo emulators, never synthetic production orders, bank receipts or customer messages.

The owner requested happy cases, bad cases and a repeated fix/verification loop. This suite supplements the twelve master acceptance scenarios; handler, HTTP, browser and real-provider evidence are distinct. A passing emulator case does not complete its production counterpart.

## Execution and common assertions

Use synthetic customers A/B, owner, finance, support, revoked owner and locked owner. Browser fixture initialization refuses any project other than `demo-satsunicgo`, Firestore8187/Auth9197 and the emulator flag. UI5187, Functions5107 and Storage9297 are dedicated loopback services. Existing regression tests retain their guarded shared demo Firestore8181 and support only the approved loopback Storage9297/9298.

Each write receives a unique operation UUID and current expected version. Repeat selected writes with the **same** UUID; assert exactly one durable effect. Read authoritative orders, financial entries and audit/history, not only a toast or redirect. All amounts below are integer VND. Never treat a QR, quote, AI answer, queued email or transfer notice as confirmed collection.

```sh
# After starting the isolated services described in SATSUNICGO-RELEASE-INTEGRATION-021-SANITY.md:
GCLOUD_PROJECT=demo-satsunicgo FUNCTIONS_EMULATOR=true \
FIRESTORE_EMULATOR_HOST=127.0.0.1:8187 \
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9197 \
FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9297 \
SATSUNICGO_SANITY_URL=http://127.0.0.1:5187 \
npx playwright test --config tests/browser/playwright.config.ts
```

Unit: `npm test`. Integration: guarded `vitest run --config vitest.rules.config.ts`, Firestore8181, Storage9297. Pin Node22 for Firebase. Reports: `output/playwright/release021/{unit-results,integration-results,browser-results}.json`. Earlier failed reports are retained separately. The final report is authoritative for current pass counts; the table is a scenario/procedure inventory.

## Happy cases and paired bad cases

| ID / master | Preconditions and steps | Expected result / invariant | Automation and evidence boundary |
| --- | --- | --- | --- |
| CAT-H01 | Published orderable product120000/v1; A selects Large, quantity2; submit checkout | One catalog order240000, frozen terms/selection, no quote, collected0; account order opens | browser `release-sanity.spec.ts`; local UI + Firestore |
| CAT-B01 | Same page; omit variant; enter0,1.5,101 | Submit disabled; no order; understandable field labels | same browser file |
| CAT-B02 | Submit; allow server commit then abort response; reload and retry original operation | Exactly one order; pending action remains recoverable; no collection | same browser file; genuine HTTP response loss |
| CAT-B03 | Change product price/version after page load; submit original snapshot; unpublished/nonorderable product | Server rejects stale/unavailable product; no client-supplied price accepted | `catalog-checkout.test.ts` unit/rules |
| FLOW-H02 | Catalog240000; finance confirms240000 once; buy2→receive2→pack→dispatch→tracking→customer confirms | COMPLETED, one payment entry240000; no deposit/balance or quote phase | HTTP `release-api.spec.ts` |
| FLOW-UI01 | Isolated catalog order with synthetic confirmed240000; owner uses CRM claim→purchase→receive→pack→dispatch→track; customer explicitly confirms from order detail | Native staff actions reflect latest version; customer can complete own delivered order without opening Ask; one payment entry remains | browser; current final result controls status, not earlier HTTP result |
| ORDER-B01 | Own order deliberately outside first50 account rows; open deep link; switch customer | Own document opens independently of list; foreign customer cannot read title/actions | native browser + actual Firestore rules |
| RECEIPT-B01 | Guard-only synthetic order; test undelivered, held, oneVND short and IN_TRANSIT snapshots | Customer completion hidden in every invalid state; no financial proof claimed from directly seeded guard fixtures | browser, paired with authoritative lifecycle case |
| CAT-B04 | Attempt buy before collection; accept quote/approve final on catalog; finalize240001 | All rejected; no freight surcharge; authoritative price remains240000 | HTTP + catalog rules |
| REQ-H01 / M1 | Unlisted name/link entered; reload saved request draft; submit | Custom REQUESTED order, no quote, collected0; staff must review | browser |
| FLOW-H01 / M1–2 | Staff reviews custom2m quote; A accepts; confirm1m; buy/receive/pack; finalize2160000; A approves; confirm1160000; dispatch/deliver | Two confirmed installments totaling2160000; final balance1160000; COMPLETED | HTTP |
| REQ-B01 / M1–2 | Buy before first installment; dispatch before final approval/balance; accept stale/expired quote | Denied without ledger/order corruption; reload current terms | HTTP, server/domain and Ask rules |
| MONEY-H01 / M3 | Approved discount/partial purchase/out-of-stock/cancel/return; reserve then confirm refund with synthetic proof | Net money equals confirmed receipts minus confirmed refunds; pending refund does not deduct money | `server`, `changes`, `lifecycle`, `quantities`, `consolidation` tests; handler/domain evidence |
| MONEY-B01 / M3 | Concurrent refund requests; insufficient refundable funds; duplicate bank proof; overpayment | Reservations serialize, duplicate proof not reused, overpayment explicit; no negative net | server/domain tests |
| PAY-H01 / M4 | Correct signed simulated callback for full/deposit/balance; replay concurrently | Correct intent allocation exactly once; matching order/purpose/version | catalog and server integration, payos-signature unit; provider mocked |
| PAY-B01 / M4 | Forged signature; wrong amount/currency/order/purpose; late/expired intent; provider timeout | Reject or quarantine mismatch; no false collection; retry reconciliation does not double allocate | same tests; real callback NOT_RUN |
| OPS-H01 / M5 | Buyer claims/purchases; warehouse receives/packs current version | Quantity and role boundaries, audit and evidence preserved | server/order-conversation integration |
| OPS-B01 / M5 | Two buyers/receivers/packers act concurrently; reused/stale versions; unassigned buyer | One valid transition; no double quantity or unauthorized mutation | same tests |
| SHIP-H01 / M6 | Funded, approved packed parcels; dispatch batch; record partial then full delivery | Partial remains incomplete; completion requires actual remaining quantities | server/shipping/consolidation tests |
| SHIP-B01 / M6 | Held/unfunded order or batch; excess quantities; another owner recipient | Dispatch/allocation denied atomically; no cross-owner leakage | same tests |
| AUTH-H01 / M7–8 | Verified synthetic Google A; own order/document/chat/file | Only own projection and permitted actions accessible | browser, HTTP, Firestore rules, media, Ask tests |
| AUTH-B01 / M7–8 | Anonymous/forged/customer/support/revoked/locked caller issues document or reads B's customer/order/document | UNAUTHENTICATED/PERMISSION_DENIED; no protected object or mutation | HTTP; real Google/App Check/MFA NOT_RUN |
| AUTH-B02 / M7–8 | Customer writes money, roles, membership, FX, shipping directly; probes raw conversations/notes | Firestore/API deny; backend financial authority and private fields retained | Firestore/server/order-conversation tests |
| MEM-H01 / M9 | Fresh customer purchases PLUS100000/30days; finance confirms; replay concurrently; pay next renewal | Pending gives no benefits; first term30days; one first receipt; paid renewal adds30days once | HTTP; membership integration |
| MEM-H02 / M9 | FREE plan; simultaneous/repeated activation; expiry job replay | One free term, no invoice/receipt; expiry/history/notification exactly once | membership integration |
| MEM-B01 / M9 | Customer confirms own invoice; wrong plan/amount/proof; expired term; reminder outcome unknown | Confirmation denied or validated; no premature benefits/extension; no blind resend | HTTP + membership tests |
| CMS-H01 / M10 | Owner creates post draft; publish; read public HTML; archive | Draft404→published200 with content→archived404; versions/audit retained | HTTP |
| CMS-B01 / M10 | Customer publishes; stale version; invalid schedule/slug/unsafe reference or media | Forbidden/ABORTED/validation rejection; draft not exposed publicly | HTTP, public-products/HTML/content editor tests; full scheduled job UI NOT_RUN |
| SUP-H01 / M10 | A opens ticket; support replies/resolves; fresh customer opts in then out | Ticket stays A-owned; one queued notification; two consent records; final consent false | HTTP; no SMTP delivery |
| SUP-UI01 / M10 | Customer submits unique subject; SUPPORT opens its linked CRM ticket and resolves; customer reopens thread | Private persisted response visible to customer, resolved state and one queued notification; no delivered-email claim | native browser |
| PROFILE-UI01 / M10 | Customer saves opt-in, withdraws it, follows data-deletion link | Final consent false; correct request topic; explicit request is not completed deletion | native browser; no actual deletion performed |
| SUP-B01 / M10 | B replies to A ticket; stale edit; unsupported campaign auto-post | Owner boundary rejects; social posting remains disabled | HTTP/workspace source; real marketing delivery NOT_RUN |
| ASK-H01 / M11 | Restored reviewed synthetic product source; native Large/qty2; select catalog; save recipient | Frozen240000 order; recipient private, absent from AI turns; payment requires recipient | browser + Ask integration; no real model |
| ASK-B01 / M11 | Server commits chat checkout then browser loses response; reload/recover; payment provider disabled | Exactly one order; original operation recovered; safe provider error; collected0 | browser + Ask workflow/transport tests |
| ASK-B02 / M11 | Prompt injection/unsafe links/redaction; owner/lock/quota/policy/model failure | Safe bounded output/error; no model financial authority or cross-owner data | ask-content/knowledge/links/transport/workflow unit/rules; actual model NOT_RUN |
| LOGIN-H01 / M12 | Synthetic login; route navigation; reload; account draft restores; logout | Correct owner/route/draft; protected access closes after logout | browser and auth/controller units; native logout and reload/deep-link denial verified by LOGIN-B02; real Google session logout NOT_RUN |
| LOGIN-B02 / M12 | Open staff draft and own customer order; logout; reload protected routes | Private data/action removed; signed-out deep links remain denied | native browser, synthetic auth; real Google session NOT_RUN |
| LOGIN-B01 / M12 | One Tap absent/dismissed/blocked; invalid/non-Google auth; offline/slow exchange | Fallback/controller guards; no signed-in state from failure | controller/guards units; real OAuth browser NOT_RUN |
| DOC-H01 | A catalog source, configured seller; create draft; concurrent same-op issue; anonymous share | One immutable issue number, minimal snapshot only, token removed from URL | HTTP + browser |
| DOC-B01 | Source changes before issue; refresh; issue; expire token | Stale issue rejected; explicit refresh required; expired public token NOT_FOUND | HTTP |
| DOC-B02 | Browser draft response lost; reload/retry; issue/share; revoke; open same link again | One draft; no retained shared projection after revocation; reload revalidates | browser; regression for actual same-fragment bug |
| DOC-B03 | Invoice list request fails; remove failure and press retry | Visible error and retry; successful empty state, no stale list | browser |
| DOC-B06 | Hold issued detail response; open newer draft; release issued response | Draft stays selected, print stays disabled; stale result cannot publish | native deferred HTTP response |
| PROFILE-B02 | Load recipient address; lock synthetic account; retry after unlock; switch account | Private address cleared on denied listener; save disabled; recovery restores only owner data | native UI + actual emulator rules |
| DOC-B05 | Create draft; block detail read after successful commit; recover by reload/open | Explicit saved-but-unread message; no mutation retry offered; exactly one draft | native browser |
| CRM-B02 | Reload selected order; hold actual response; navigate to another order; release stale response | Old private selection/action cleared during reload; newer context remains selected | native browser with deferred HTTP response |
| CRM-UI390/768/1440 | Reduced motion; keyboard-open/close mobile menu; attempt unfunded purchase | No page overflow; focus restored; rejected command leaves version/stage/money unchanged | native browser |
| DOC-B04 | Void internal statement; replace same source; request email while disabled | Retained void history, linked replacement; no order/ledger/refund side effect; no sent claim | HTTP/invoice rules |
| OUT-H01 | Unknown email; operator records proof confirmed_not_sent; reselect current filter | Failedv2, attempts unchanged; rows remain; reconciliation does not resend | browser + email-delivery rules |
| OUT-B01 | Late SMTP completion after manual reconciliation; retry uncertain delivery | Claim/version CAS preserves manual result and audits late outcome; no blind resend | email-delivery integration; SMTP mocked |
| UI-H390/768/1440 | Checkout at three widths; quantity→Tab→submit; open Ask; Escape | No horizontal overflow; useful labels; focused textbox; Escape closes dialog | native Playwright actions/screenshots |
| UI-H200 | Fresh owned browser profile, actual200% page zoom; checkout and20-row statement labels/keyboard | Verify720 CSS pixels at1440viewport and DPR2 before claiming zoom; no overflow | native page-zoom control plus AX snapshots; current final result controls status |
| PRINT-H01 | Synthetic statement20long rows; print A4 PDF | All20row markers/totals retained across3pages; readable first/last pages | current browser PRINT-H01 PDF + pypdf20markers/totals +3page visual inspection; native OS print dialog NOT_RUN |
| RESTORE-H01 | Dedicated demo Firestore/Storage namespace; export/import; compare fixtures | Restored values/assets match; no shared reset or cloud writes | historical isolated restore rehearsal; production restore NOT_RUN |

## Production-only release cases — all remain NOT_RUN until explicitly authorized

| ID | Procedure and expected evidence | Required boundary |
| --- | --- | --- |
| LIVE-01 | Securely verify configured seller, catalog all-inclusive prices/terms, FX and refund/privacy/membership policies; owner accepts exact values | Read presence/approval, do not expose secrets or real customer data |
| LIVE-02 | Real Google login/fallback/logout, staff MFA, revoked roles and App Check rejection on actual deployed origin | Controlled accounts, approved deployment and no bypasses |
| LIVE-03 | Authorized provider payment/verified bank lifecycle for catalog one charge and custom two installments; callback replay and reconciliation | Explicit provider/financial authority; never manufacture production receipts |
| LIVE-04 | Approved SMTP controlled inbox, unknown-outcome handling and AI safe question/model-failure/quota | Explicit recipient/provider authority; no customer test mail |
| LIVE-05 | Confirm billing/IAM, deployed Functions/rules/indexes/Storage, metrics/alerts; exact candidate smoke and rollback | Current readback + reviewed release/rollback plan |
| LIVE-06 | Verified production backup and approved recovery rehearsal with retained history | Separate production/data-protection approval; no autonomous datafix |
| LIVE-07 | Full staff/customer browser journeys, AT/mobile OAuth, latency and accessibility acceptance | Real provider/platform evidence; automated labels alone do not certify VoiceOver |

## Review loop

Cycle1:17 combined cases,12passed/5failed. Four failures were UI harness assumptions; one reproduced stale shared content after same-fragment link reopening. Corrected native Ask entry/resume selectors and `SharedDocument` hash revalidation. Cycle2 focused: Ask loss-response recovery and revoked-share reopening passed; responsive entry assumptions still failed. Corrected responsive fixture precondition; all three responsive tests then passed. Native zoom setup must prove actual zoom before acceptance; its failed preference attempt is a harness failure, not a confirmed product defect. Final full-suite results are recorded independently; no retries mask a failure.

Remaining real-provider, production security and release requirements keep the final review fail-closed even when all local cases pass. Token usage and billed/API-equivalent cost: Unavailable. Memory candidates: None.

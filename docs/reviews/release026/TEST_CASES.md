# Test cases and scenarios026 — current final local receipt

Local synthetic Chromium/emulators. Final whole199/23specfiles PASS,0fail/skip/flaky,325frozeninputs0drift; original budgets/retries retained. Current unit207 and unchanged-backend integration408 PASS. Declared SDK/model faults stay explicit; no production/provider acceptance. Historical failing/blocked runners remain in CYCLE_JOURNAL.json.

## Business journeys: happy, bad and race cases

| Journey/setup | Happy-case steps and expected result | Bad/race checks and expected result |
|---|---|---|
| Listed published catalog product | Select product/variant/quantity; review all-inclusive listed price/terms; explicitly create; privately save recipient; full payment collected once; verified funds allow staff purchase; warehouse/shipping/delivery; explicit customer receipt | No quote/deposit/freight surcharge; stale product/invalid selection rejected; no model auto-order; replay returns same order; lost committed response/reload recovers same identity; cancelled collection rejected |
| Unlisted custom request | Save draft, complete bounded item/market, explicit submit; staff reviews quote; customer accepts current quote; verified deposit; staff buying/warehouse; explicit final liability approval; verified balance; delivery/receipt | Unquoted payment/purchase blocked; old quote/version refused; hold/underfunding blocks purchase/receipt; replay preserves immutable money; no catalog conversion or skipped final approval |
| Ask continuity | Follow-up on same candidates preserves reviewed choices; changed candidates reset; EN/VI restore matches controls; private linked order retained through permitted navigation | Reordered same citations do not erase quantity/variant; duplicate citation links removed; malformed/stale/foreign context denied; product read outage never interpreted as absence; explicit retry |
| General and order support | Open support from current Ask context before order; actual ticket created; later order keeps distinct contextual history; explicit reply and staff resolution | Existing old ticket beyond50 is found owner-exactly; foreign subject hidden; lost commit/no-commit reload preserves operation identity; original retry text required; changed body cannot create unintended duplicate; no raw body session storage |
| Customer order changes | Open own order disclosure; verify server result; review payable/costs/terms; explicit accept/reject; staff apply separately | Cached empty not absence; loading/offline/error distinct and explicit retry; no automatic money/refund; bought lines/history preserved; foreign order deny and no private proposal leakage |
| Staff permissions | Owner explicitly reads verified current target and selects roles/active/lock/orders; save requires server owner/MFA/CAS | Delayed A read after editing B cannot restore A form; malformed arrays/flags/version rejected before edit; exhausted stored version cannot write; actual SDK omitted legacy fields stay omitted; revoked/locked/account switch cannot retain prior authority |
| CRM filters and operations | Explicit apply current filter; current results/page/cursors; role-specific current-order next action | Dirty/loading clear; old response cannot replace new query/order; denied overview uses permitted landing; three viewport/keyboard/reduced-motion controls; unfunded/held/wrong-role actions denied |
| Statements/documents | Create draft/current detail; issue frozen statement; share/revoke; void/replacement preserves immutable history | Draft is not issued/tax/paid; stale source/version cannot issue; expiry/revoke/cross-owner denied; uncertain draft saves do not duplicate; old detail cannot replace selected row; print keeps long A4 rows/totals |
| Membership | Approved plan/price/term and confirmed funds activate/renew exactly once | Underfunding/customer grant/duplicate collection blocked; expiry/unknown reflects server projection, not guessed benefit |
| Content/campaign | Authorized draft/publish/archive updates real public visibility | Customer cannot publish; stale edits and locked/revoked staff denied; notification targeting/privacy contracts remain authoritative |
| Finance/media/refunds | Authorized private evidence/allocation/reconciliation, conservation and reservations retained | No paid claim from link/notice; no cancelled new allocation; images stay private; upload/read after navigation cannot restore old context; uncertain email reconciliation does not resend |
| Account/privacy/logout | Explicit consent withdrawal/private account settings and actual logout | Customer cannot open CRM; owner-only views protected; private order/address/document state clears after authorization loss/logout/reload |


## CRM presentation and recovery

19 routes at390/768/1440: meaningful headings/actions, current read/loading completion, no horizontal overflow, enabled native focus, viewport plus full-page screenshot. Default states are not every nested/populated/error state. Content mobile editor must remain in viewport. Invalid collapsed optional URL must reveal/focus, zero save/no persisted draft until corrected, then exactlyone actual draft save. Support A→B held read must hide A form until B verified. Accepted ChangeQueue server-filter/paging/loading/error/empty/retry and scroll retention keep explicit apply/financial consequences. Native200% checkout/statement/support and A4 PDF remain original budgets/assertions.

## Populated item and restoration scenarios

18 new native cases use actual demo HTTP reads at390/768/1440: return quantities all visible without horizontal swipe; native Xử lý hàng trả opens retained complete form; refund amount/state/reservation meaning and separated rows; packed parcel dispatch versus in-transit manual update/allocation; sealed batch cutoff/freight/shares; finance exception explicit evidence-only choices; campaign selected caption/title and native missing-title refusal. Required invalid input causes zero commands and exact synthetic records remain unchanged. Before receipts preserve actual gap/overflow defects and corrected test-selector mistakes separately. No real money/provider delivery inferred.

Ask initial actual durable SDK snapshot is held in a declared dev-module harness: signed-in composer disabled until explicit release, then existing saved context visible through Tiếp tục hội thoại; no document writes. Genuine BEFORE wrong enabled composer; fixed source plus corrected actual navigation AFTER passed. Original privacy/support tests retained unchanged.

## Automated native inventory

Source: `output/playwright/release026/crm-final199-native-round4.json`. Duration 541.884 seconds.

| File:line | Happy/bad/race case and enforced expectation | Current result |
|---|---|---|
| `release-accessibility.spec.ts:19` | UI-H200 native browser 200 percent zoom preserves checkout labels and keyboard controls | PASS |
| `release-api.spec.ts:18` | MEM-H01 paid membership requires confirmed funds and renews exactly once | PASS |
| `release-api.spec.ts:87` | CMS-H01 draft publication and archive follow public visibility; customer cannot publish | PASS |
| `release-api.spec.ts:133` | SUP-H01 ticket handoff and consent preserve ownership and audit without external delivery | PASS |
| `release-api.spec.ts:200` | FLOW-H01 custom HTTP lifecycle preserves two installments and explicit final approval | PASS |
| `release-api.spec.ts:334` | FLOW-H02 catalog HTTP lifecycle collects once and rejects quote and freight surcharge | PASS |
| `release-api.spec.ts:435` | AUTH-B01 anonymous forged cross-owner revoked locked and support writes fail through actual HTTP | PASS |
| `release-api.spec.ts:489` | DOC-H01 concurrent issue frozen statement share revoke void replacement and email-disabled preserve money | PASS |
| `release-api.spec.ts:576` | DOC-B01 expiry and source version conflict refuse share and issue | PASS |
| `release-ask-changes-states026.spec.ts:104` | ASK026-STATE01 proposal disclosure loads before verified empty | PASS |
| `release-ask-changes-states026.spec.ts:150` | ASK026-STATE02 actual offline proposal read has explicit retry and no decision | PASS |
| `release-ask-changes-states026.spec.ts:197` | ASK026-STATE03 English Ask keeps proposal meaning and explicit decisions in English | PASS |
| `release-ask-changes026.spec.ts:93` | ASK026-CHANGE-accept own pending proposal requires explicit customer decision and preserves money | PASS |
| `release-ask-changes026.spec.ts:93` | ASK026-CHANGE-reject own pending proposal requires explicit customer decision and preserves money | PASS |
| `release-ask-changes026.spec.ts:129` | ASK026-CHANGE-foreign cannot reveal a foreign selected order proposal or mutate its decision | PASS |
| `release-ask-hydration026.spec.ts:11` | ASK026 initial owned durable snapshot must restore before composer permits a new turn | PASS |
| `release-ask-hydration026.spec.ts:74` | ASK026 older same-identity restoration response cannot replace a newer verified context | PASS |
| `release-ask-support-entry.spec.ts:18` | ASK026-S06 confirmed lost open allows an explicit follow-up without a second ticket | PASS |
| `release-ask-support-entry.spec.ts:86` | ASK026-S05 unknown uncommitted send keeps identity and requires original text after reload | PASS |
| `release-ask-support-entry.spec.ts:166` | ASK026-S04 general ticket history remains distinct when the same conversation has an order | PASS |
| `release-ask-support-entry.spec.ts:218` | ASK026-S03 general support uses durable fresh context before a held model answer | PASS |
| `release-ask-support-entry.spec.ts:437` | ASK026-S02 pre-order support persists privately after a lost response and reload without an order | PASS |
| `release-ask-taskflow.spec.ts:88` | ASK026-C01 sole catalog candidate previews without creating an order at 390 | PASS |
| `release-ask-taskflow.spec.ts:88` | ASK026-C01 sole catalog candidate previews without creating an order at 768 | PASS |
| `release-ask-taskflow.spec.ts:88` | ASK026-C01 sole catalog candidate previews without creating an order at 1440 | PASS |
| `release-ask-taskflow.spec.ts:139` | ASK026-C02 same cited product followup preserves reviewed variant and quantity | PASS |
| `release-ask-taskflow.spec.ts:208` | ASK026-S01 existing private support ticket beyond fifty unrelated tickets remains reachable | PASS |
| `release-ask-taskflow.spec.ts:286` | ASK026-C03 ambiguous candidates need a choice and changed sources reset stale variant and quantity | PASS |
| `release-ask-taskflow.spec.ts:359` | ASK026-C04 transient catalog read failure supports explicit retry without creating an order | PASS |
| `release-ask-taskflow.spec.ts:402` | ASK026-C05 restored English answer keeps catalog actions in English | PASS |
| `release-ask-taskflow.spec.ts:434` | ASK026-C06 reordered identical candidates preserve explicit variant and quantity | PASS |
| `release-auth-hardening.spec.ts:8` | AUTH025-A01 Ask waits for restored identity before mounting after reload | PASS |
| `release-changequeue026.spec.ts:63` | CQ026 newest accepted proposal remains discoverable beyond closed history at 390 | PASS |
| `release-changequeue026.spec.ts:63` | CQ026 newest accepted proposal remains discoverable beyond closed history at 768 | PASS |
| `release-changequeue026.spec.ts:63` | CQ026 newest accepted proposal remains discoverable beyond closed history at 1440 | PASS |
| `release-changequeue026.spec.ts:122` | CQ026 more than thirty accepted decisions paginate in review order without duplicates or autoapply | PASS |
| `release-changequeue026.spec.ts:194` | CQ026 held read and injected error/empty projection remain distinct with explicit recovery | PASS |
| `release-crm-hardening.spec.ts:59` | CRM025-A01 deferred committed outbox reconciliation cannot reload an obsolete activity kind | PASS |
| `release-crm-hardening.spec.ts:147` | CRM025-A02 SPA customer and follow-up navigation reloads the correct list and resets view filters | PASS |
| `release-crm-populated026.spec.ts:97` | CRM populated returns facts forms and separated items at 390 | PASS |
| `release-crm-populated026.spec.ts:97` | CRM populated refunds facts forms and separated items at 390 | PASS |
| `release-crm-populated026.spec.ts:97` | CRM populated shipping facts forms and separated items at 390 | PASS |
| `release-crm-populated026.spec.ts:97` | CRM populated batches facts forms and separated items at 390 | PASS |
| `release-crm-populated026.spec.ts:97` | CRM populated finance facts forms and separated items at 390 | PASS |
| `release-crm-populated026.spec.ts:97` | CRM populated returns facts forms and separated items at 768 | PASS |
| `release-crm-populated026.spec.ts:97` | CRM populated refunds facts forms and separated items at 768 | PASS |
| `release-crm-populated026.spec.ts:97` | CRM populated shipping facts forms and separated items at 768 | PASS |
| `release-crm-populated026.spec.ts:97` | CRM populated batches facts forms and separated items at 768 | PASS |
| `release-crm-populated026.spec.ts:97` | CRM populated finance facts forms and separated items at 768 | PASS |
| `release-crm-populated026.spec.ts:97` | CRM populated returns facts forms and separated items at 1440 | PASS |
| `release-crm-populated026.spec.ts:97` | CRM populated refunds facts forms and separated items at 1440 | PASS |
| `release-crm-populated026.spec.ts:97` | CRM populated shipping facts forms and separated items at 1440 | PASS |
| `release-crm-populated026.spec.ts:97` | CRM populated batches facts forms and separated items at 1440 | PASS |
| `release-crm-populated026.spec.ts:97` | CRM populated finance facts forms and separated items at 1440 | PASS |
| `release-crm-populated026.spec.ts:201` | CRM populated campaign editing preserves caption and blocks missing title at 390 | PASS |
| `release-crm-populated026.spec.ts:201` | CRM populated campaign editing preserves caption and blocks missing title at 768 | PASS |
| `release-crm-populated026.spec.ts:201` | CRM populated campaign editing preserves caption and blocks missing title at 1440 | PASS |
| `release-crm-presentation026.spec.ts:9` | CRM content closed optional field validates visibly before a real draft save | PASS |
| `release-crm-presentation026.spec.ts:78` | CRM membership bounded list keeps editor reachable and selection read-only at 390 | PASS |
| `release-crm-presentation026.spec.ts:78` | CRM membership bounded list keeps editor reachable and selection read-only at 768 | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation overview at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation orders at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation purchasing at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation warehouse at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation returns at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation shipping at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation changes at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation refunds at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation finance at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation documents at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation customers at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation follow-ups at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation support at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation content at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation campaigns at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation membership at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation staff at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation activity at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation settings at 390: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation overview at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation orders at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation purchasing at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation warehouse at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation returns at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation shipping at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation changes at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation refunds at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation finance at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation documents at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation customers at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation follow-ups at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation support at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation content at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation campaigns at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation membership at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation staff at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation activity at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation settings at 768: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation overview at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation orders at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation purchasing at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation warehouse at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation returns at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation shipping at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation changes at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation refunds at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation finance at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation documents at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation customers at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation follow-ups at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation support at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation content at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation campaigns at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation membership at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation staff at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation activity at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-presentation026.spec.ts:189` | CRM presentation settings at 1440: route, pending read, keyboard and contained layout | PASS |
| `release-crm-records026.spec.ts:41` | CRM record customers calendar and open action need no horizontal swipe at 390 | PASS |
| `release-crm-records026.spec.ts:41` | CRM record follow-ups calendar and open action need no horizontal swipe at 390 | PASS |
| `release-crm-records026.spec.ts:163` | CRM record outbox manual reconciliation and retry are contained at 390 | PASS |
| `release-crm-records026.spec.ts:41` | CRM record customers calendar and open action need no horizontal swipe at 768 | PASS |
| `release-crm-records026.spec.ts:41` | CRM record follow-ups calendar and open action need no horizontal swipe at 768 | PASS |
| `release-crm-records026.spec.ts:163` | CRM record outbox manual reconciliation and retry are contained at 768 | PASS |
| `release-crm-records026.spec.ts:292` | CRM settings held verified read preserves the native open editor without a save | PASS |
| `release-crm-records026.spec.ts:339` | CRM settings declared read outage has explicit actual-service retry and no write | PASS |
| `release-crm-taskflow.spec.ts:9` | CRM026-390 changed filters explain the next step and actual list loading | PASS |
| `release-crm-taskflow.spec.ts:9` | CRM026-768 changed filters explain the next step and actual list loading | PASS |
| `release-crm-taskflow.spec.ts:9` | CRM026-1440 changed filters explain the next step and actual list loading | PASS |
| `release-crm.spec.ts:65` | CRM024-390 clear shell and customer filters retain keyboard and empty recovery | PASS |
| `release-crm.spec.ts:65` | CRM024-768 clear shell and customer filters retain keyboard and empty recovery | PASS |
| `release-crm.spec.ts:65` | CRM024-1440 clear shell and customer filters retain keyboard and empty recovery | PASS |
| `release-crm.spec.ts:147` | CRM024 membership expiry and unknown state reflect server projection without changing subscription | PASS |
| `release-crm.spec.ts:186` | CRM024 restricted finance landing keeps allowed fallback and denies overview | PASS |
| `release-crm.spec.ts:186` | CRM024 restricted support landing keeps allowed fallback and denies overview | PASS |
| `release-finance-hardening.spec.ts:8` | BIZ025-UI cancelled catalog blocks new transfer with clear error and no money writes | PASS |
| `release-hardening.spec.ts:67` | CRM item pending target read cannot expose previous ticket actions | PASS |
| `release-hardening.spec.ts:130` | HARD-UI01 committed ticket reply cannot restore old ticket after navigation | PASS |
| `release-hardening.spec.ts:220` | HARD-UI02 committed upload does not reload an obsolete order image list | PASS |
| `release-hardening.spec.ts:287` | HARD-UI03 deferred private image read cannot publish after order navigation | PASS |
| `release-image-disclosure-hardening.spec.ts:12` | IMG025-A01 image disclosure stays open when its initial list response arrives | PASS |
| `release-proposal.spec.ts:25` | CHANGE-UI01 native proposal accept/apply and reject preserve bought lines and verified money | PASS |
| `release-sanity.spec.ts:29` | PROFILE-UI01 consent can be withdrawn and privacy request links preserve truthful scope | PASS |
| `release-sanity.spec.ts:75` | SUP-UI01 customer opens private ticket and staff resolves it through linked CRM | PASS |
| `release-sanity.spec.ts:132` | PROFILE-B02 authorization loss clears recipient addresses and recovery restores them | PASS |
| `release-sanity.spec.ts:195` | ORDER-B01 own deep link opens outside the bounded list and foreign customer cannot read it | PASS |
| `release-sanity.spec.ts:233` | LOGIN-B02 native logout removes private order and staff document access across reload | PASS |
| `release-sanity.spec.ts:285` | RECEIPT-B01 customer completion remains hidden before delivery, when held or underfunded | PASS |
| `release-sanity.spec.ts:336` | FLOW-UI01 catalog staff operations link to explicit customer receipt confirmation | PASS |
| `release-sanity.spec.ts:468` | CRM-B02 old queue response cannot replace a new order or leave stale actions during reload | PASS |
| `release-sanity.spec.ts:542` | CRM-UI390 keyboard navigation, reduced motion and unfunded purchase guard | PASS |
| `release-sanity.spec.ts:542` | CRM-UI768 keyboard navigation, reduced motion and unfunded purchase guard | PASS |
| `release-sanity.spec.ts:542` | CRM-UI1440 keyboard navigation, reduced motion and unfunded purchase guard | PASS |
| `release-sanity.spec.ts:654` | CAT-H01 listed checkout creates a frozen full-payment order without quote | PASS |
| `release-sanity.spec.ts:680` | CAT-B01 variant and quantity invalid states prevent submission | PASS |
| `release-sanity.spec.ts:702` | CAT-B02 committed checkout response loss survives reload and produces one order | PASS |
| `release-sanity.spec.ts:736` | REQ-H01 unlisted request persists a draft then creates an unquoted custom order | PASS |
| `release-sanity.spec.ts:767` | ASK-B01 completed checkout response loss recovers through visible pending action after reload | PASS |
| `release-sanity.spec.ts:843` | DOC-B06 deferred issued detail cannot replace a newer draft selection | PASS |
| `release-sanity.spec.ts:918` | PRINT-H01 current long statement retains all rows and totals in A4 print | PASS |
| `release-sanity.spec.ts:939` | DOC-B05 committed draft with failed detail read reports saved state and recovers without duplicate creation | PASS |
| `release-sanity.spec.ts:981` | DOC-B02 draft response loss and reload retry create one document; native share and revoke protect identity | PASS |
| `release-sanity.spec.ts:1074` | DOC-B03 failed list recovers, empty filter stays empty, and order filter reloads after navigation | PASS |
| `release-sanity.spec.ts:1092` | CRM-B01 customer identity cannot open protected CRM | PASS |
| `release-sanity.spec.ts:1108` | OUT-B01 native uncertain email reconciliation does not resend and repeated current filter preserves rows | PASS |
| `release-sanity.spec.ts:1158` | UI-H390 responsive catalog keyboard and Ask dialog focus remain usable | PASS |
| `release-sanity.spec.ts:1158` | UI-H768 responsive catalog keyboard and Ask dialog focus remain usable | PASS |
| `release-sanity.spec.ts:1158` | UI-H1440 responsive catalog keyboard and Ask dialog focus remain usable | PASS |
| `release-staff-authority026.spec.ts:29` | STAFF026 denies malformed truthy-string without rendering privileged workspace | PASS |
| `release-staff-authority026.spec.ts:29` | STAFF026 denies malformed truthy-number without rendering privileged workspace | PASS |
| `release-staff-authority026.spec.ts:29` | STAFF026 denies malformed roles-string without rendering privileged workspace | PASS |
| `release-staff-authority026.spec.ts:29` | STAFF026 denies malformed roles-object without rendering privileged workspace | PASS |
| `release-staff-authority026.spec.ts:29` | STAFF026 denies malformed mixed-array without rendering privileged workspace | PASS |
| `release-staff-authority026.spec.ts:70` | STAFF026 typed roles remain safe ["OWNER"] | PASS |
| `release-staff-authority026.spec.ts:70` | STAFF026 typed roles remain safe ["SUPPORT"] | PASS |
| `release-staff-authority026.spec.ts:70` | STAFF026 typed roles remain safe [] | PASS |
| `release-staff-authority026.spec.ts:70` | STAFF026 typed roles remain safe ["UNKNOWN_FUTURE_ROLE"] | PASS |
| `release-staff-authority026.spec.ts:70` | STAFF026 typed roles remain safe ["SUPPORT","UNKNOWN_FUTURE_ROLE"] | PASS |
| `release-staff-authority026.spec.ts:99` | STAFF026 actual snapshot revocation removes navigation and denies current CRM | PASS |
| `release-staff-authority026.spec.ts:129` | STAFF026 account switch cannot reuse previous authority while current snapshot is held | PASS |
| `release-staff-target026.spec.ts:31` | STAFF026-TARGET delayed actual A read cannot restore form after editing B | PASS |
| `release-staff-target026.spec.ts:128` | STAFF026-TARGET malformed roles-null cannot render editable grant | PASS |
| `release-staff-target026.spec.ts:128` | STAFF026-TARGET malformed roles-missing cannot render editable grant | PASS |
| `release-staff-target026.spec.ts:128` | STAFF026-TARGET malformed roles-scalar cannot render editable grant | PASS |
| `release-staff-target026.spec.ts:128` | STAFF026-TARGET malformed roles-mixed cannot render editable grant | PASS |
| `release-staff-target026.spec.ts:128` | STAFF026-TARGET malformed orders-scalar cannot render editable grant | PASS |
| `release-staff-target026.spec.ts:128` | STAFF026-TARGET malformed orders-mixed cannot render editable grant | PASS |
| `release-staff-target026.spec.ts:128` | STAFF026-TARGET malformed active-string cannot render editable grant | PASS |
| `release-staff-target026.spec.ts:128` | STAFF026-TARGET malformed locked-string cannot render editable grant | PASS |
| `release-staff-target026.spec.ts:128` | STAFF026-TARGET malformed version-negative cannot render editable grant | PASS |
| `release-staff-target026.spec.ts:128` | STAFF026-TARGET malformed version-null cannot render editable grant | PASS |
| `release-staff-target026.spec.ts:128` | STAFF026-TARGET malformed version-exhausted cannot render editable grant | PASS |
| `release-staff-target026.spec.ts:166` | STAFF026-TARGET valid preserves explicit grant review without saving | PASS |
| `release-staff-target026.spec.ts:166` | STAFF026-TARGET legacy preserves explicit grant review without saving | PASS |
| `release-staff-target026.spec.ts:166` | STAFF026-TARGET absent preserves explicit grant review without saving | PASS |
| `release-staff-target026.spec.ts:215` | STAFF026-TARGET legacy SDK read and explicit save omit absent version | PASS |
| `release-staff-target026.spec.ts:256` | STAFF026-TARGET verified identifier remains readable and keyboard reachable at 390 | PASS |
| `release-staff-target026.spec.ts:256` | STAFF026-TARGET verified identifier remains readable and keyboard reachable at 768 | PASS |
| `release-staff-target026.spec.ts:256` | STAFF026-TARGET verified identifier remains readable and keyboard reachable at 1440 | PASS |
| `release-support-hardening.spec.ts:15` | SUP025-A01 newest submitted private ticket stays first beyond the 30-ticket window | PASS |

## Remaining acceptance scenarios

Real QA customer/staff identities, Google/MFA/AppCheck, bank/merchant/email/Gemini, deployed candidate/indexes/Storage, backup/rollback/restore, production load/soak/frame and actual AT/physical device acceptance: NOT_TESTED. Every nested state and huge-value/RTL context is not proven by default screenshots. Required live financial journey needs exact human-controlled identities/amount/provider plan; no automated paid-state datafix. Ask cache-first hypothesis remains native BEFORE NOT_RUN and is not counted as a fixed issue.

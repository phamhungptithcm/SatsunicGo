# Native end-to-end scenarios — 025

Final complete receipt: output/playwright/release025/browser-final51-complete.json;51/51PASS, zero skips/retries/flaky. Synthetic loopback evidence, not provider/production certification. Happy, bad, ownership, race, lost-response, keyboard and responsive assertions are in the linked source files.

| # | Case / assertions | Source | Result |
|---|---|---|---|
| 1 | UI-H200 native browser 200 percent zoom preserves checkout labels and keyboard controls | release-accessibility.spec.ts | PASS |
| 2 | MEM-H01 paid membership requires confirmed funds and renews exactly once | release-api.spec.ts | PASS |
| 3 | CMS-H01 draft publication and archive follow public visibility; customer cannot publish | release-api.spec.ts | PASS |
| 4 | SUP-H01 ticket handoff and consent preserve ownership and audit without external delivery | release-api.spec.ts | PASS |
| 5 | FLOW-H01 custom HTTP lifecycle preserves two installments and explicit final approval | release-api.spec.ts | PASS |
| 6 | FLOW-H02 catalog HTTP lifecycle collects once and rejects quote and freight surcharge | release-api.spec.ts | PASS |
| 7 | AUTH-B01 anonymous forged cross-owner revoked locked and support writes fail through actual HTTP | release-api.spec.ts | PASS |
| 8 | DOC-H01 concurrent issue frozen statement share revoke void replacement and email-disabled preserve money | release-api.spec.ts | PASS |
| 9 | DOC-B01 expiry and source version conflict refuse share and issue | release-api.spec.ts | PASS |
| 10 | AUTH025-A01 Ask waits for restored identity before mounting after reload | release-auth-hardening.spec.ts | PASS |
| 11 | CRM025-A01 deferred committed outbox reconciliation cannot reload an obsolete activity kind | release-crm-hardening.spec.ts | PASS |
| 12 | CRM025-A02 SPA customer and follow-up navigation reloads the correct list and resets view filters | release-crm-hardening.spec.ts | PASS |
| 13 | CRM024-390 clear shell and customer filters retain keyboard and empty recovery | release-crm.spec.ts | PASS |
| 14 | CRM024-768 clear shell and customer filters retain keyboard and empty recovery | release-crm.spec.ts | PASS |
| 15 | CRM024-1440 clear shell and customer filters retain keyboard and empty recovery | release-crm.spec.ts | PASS |
| 16 | CRM024 membership expiry and unknown state reflect server projection without changing subscription | release-crm.spec.ts | PASS |
| 17 | CRM024 restricted finance landing keeps allowed fallback and denies overview | release-crm.spec.ts | PASS |
| 18 | CRM024 restricted support landing keeps allowed fallback and denies overview | release-crm.spec.ts | PASS |
| 19 | BIZ025-UI cancelled catalog blocks new transfer with clear error and no money writes | release-finance-hardening.spec.ts | PASS |
| 20 | HARD-UI01 committed ticket reply cannot restore old ticket after navigation | release-hardening.spec.ts | PASS |
| 21 | HARD-UI02 committed upload does not reload an obsolete order image list | release-hardening.spec.ts | PASS |
| 22 | HARD-UI03 deferred private image read cannot publish after order navigation | release-hardening.spec.ts | PASS |
| 23 | IMG025-A01 image disclosure stays open when its initial list response arrives | release-image-disclosure-hardening.spec.ts | PASS |
| 24 | CHANGE-UI01 native proposal accept/apply and reject preserve bought lines and verified money | release-proposal.spec.ts | PASS |
| 25 | PROFILE-UI01 consent can be withdrawn and privacy request links preserve truthful scope | release-sanity.spec.ts | PASS |
| 26 | SUP-UI01 customer opens private ticket and staff resolves it through linked CRM | release-sanity.spec.ts | PASS |
| 27 | PROFILE-B02 authorization loss clears recipient addresses and recovery restores them | release-sanity.spec.ts | PASS |
| 28 | ORDER-B01 own deep link opens outside the bounded list and foreign customer cannot read it | release-sanity.spec.ts | PASS |
| 29 | LOGIN-B02 native logout removes private order and staff document access across reload | release-sanity.spec.ts | PASS |
| 30 | RECEIPT-B01 customer completion remains hidden before delivery, when held or underfunded | release-sanity.spec.ts | PASS |
| 31 | FLOW-UI01 catalog staff operations link to explicit customer receipt confirmation | release-sanity.spec.ts | PASS |
| 32 | CRM-B02 old queue response cannot replace a new order or leave stale actions during reload | release-sanity.spec.ts | PASS |
| 33 | CRM-UI390 keyboard navigation, reduced motion and unfunded purchase guard | release-sanity.spec.ts | PASS |
| 34 | CRM-UI768 keyboard navigation, reduced motion and unfunded purchase guard | release-sanity.spec.ts | PASS |
| 35 | CRM-UI1440 keyboard navigation, reduced motion and unfunded purchase guard | release-sanity.spec.ts | PASS |
| 36 | CAT-H01 listed checkout creates a frozen full-payment order without quote | release-sanity.spec.ts | PASS |
| 37 | CAT-B01 variant and quantity invalid states prevent submission | release-sanity.spec.ts | PASS |
| 38 | CAT-B02 committed checkout response loss survives reload and produces one order | release-sanity.spec.ts | PASS |
| 39 | REQ-H01 unlisted request persists a draft then creates an unquoted custom order | release-sanity.spec.ts | PASS |
| 40 | ASK-B01 completed checkout response loss recovers through visible pending action after reload | release-sanity.spec.ts | PASS |
| 41 | DOC-B06 deferred issued detail cannot replace a newer draft selection | release-sanity.spec.ts | PASS |
| 42 | PRINT-H01 current long statement retains all rows and totals in A4 print | release-sanity.spec.ts | PASS |
| 43 | DOC-B05 committed draft with failed detail read reports saved state and recovers without duplicate creation | release-sanity.spec.ts | PASS |
| 44 | DOC-B02 draft response loss and reload retry create one document; native share and revoke protect identity | release-sanity.spec.ts | PASS |
| 45 | DOC-B03 failed list recovers, empty filter stays empty, and order filter reloads after navigation | release-sanity.spec.ts | PASS |
| 46 | CRM-B01 customer identity cannot open protected CRM | release-sanity.spec.ts | PASS |
| 47 | OUT-B01 native uncertain email reconciliation does not resend and repeated current filter preserves rows | release-sanity.spec.ts | PASS |
| 48 | UI-H390 responsive catalog keyboard and Ask dialog focus remain usable | release-sanity.spec.ts | PASS |
| 49 | UI-H768 responsive catalog keyboard and Ask dialog focus remain usable | release-sanity.spec.ts | PASS |
| 50 | UI-H1440 responsive catalog keyboard and Ask dialog focus remain usable | release-sanity.spec.ts | PASS |
| 51 | SUP025-A01 newest submitted private ticket stays first beyond the 30-ticket window | release-support-hardening.spec.ts | PASS |

# Product Content Review — ASK-COMMERCE-008

## Scope

Ask customer chat and staff recipient readout; approved local plan v1. Web React UI, Vietnamese primary and English conversational responses. Files: Ask.tsx, Commerce.tsx, Ask.module.css, OperationsDetails.tsx and deterministic domain action labels. Audience: customer requesting buying assistance; staff fulfill physical work. Apple HIG is not a platform contract here; HTML forms, native dialog and repository brand patterns govern. Reviewed 2026-10-04; independent final review references this record.

## Context And Evidence

Verified: quote/payment/fulfillment state comes from owner-scoped Firestore snapshots and validated server commands. AI output alone cannot authorize staff actions or establish payment/delivery. Synthetic browser fixture traversed request → recipient → quote acceptance → final amount approval → delivered → customer receipt → completed. Finance and physical fulfillment used explicitly synthetic staff commands in isolated demo emulator. Saved order restored on reload and after A→B→A account switching; B showed no A order or resume control. Payment-provider failure showed no additional confirmed money.

Assumptions: owner operates actual sourcing/warehouse process. Unknown: live Gemini extraction, Google authentication/App Check, payOS happy path/webhook and merchant/carrier connectivity. These remain NOT TESTED; production remains NOT_READY.

## Content Inventory

54 bilingual call sites are inventoried with source positions in ASK-COMMERCE-008-STRINGS.json. Fee labels also map to the six authoritative quote fields. Existing Ask FAQ/citations/privacy and existing stage vocabulary are retained. New staff readout labels describe recipient, phone and delivery address, visible only to authorized operational roles.

| Location/state | Current → proposed content | Customer job | Behavior evidence |
| --- | --- | --- | --- |
| Preparation | Advice/navigation → Prepare buying request; market, name, optional link, variant, quantity, optional notes; Save draft | Supply known details | Native labelled inputs; schema rejects missing market/name/variant and invalid quantity |
| Review | Draft navigation → inline item/market/budget summary; Send buying request | Confirm submission | Auth required, operation hash and unique order per conversation |
| Login | Sign in to save and send | Continue in same chat | Existing auth UI and draftRef preservation on anonymous→authenticated hydration |
| Quote | Quote total, 50% deposit, valid-until, terms version and six fees | Review actual cost | Server quote/version/expiry validation; not model-derived |
| Recipient | Delivery details, Use saved address, Save delivery details, Saved delivery details, Review/edit address | Review destination | Separate owner-only record; editable only before acceptance |
| Payment | Confirmed money net of refunds; Amount due; Prepare payment | Authorize provider payment | Existing createPaymentLink and safe HTTPS payOS hostname; failure explicitly says no added money |
| Final charges | Final total; Approve final total | Authorize changed amount | Deterministic finalApproved guard; browser fixture 1,300→1,400 required approval |
| Waiting/hold | Staff next-step/hold wording | Understand who acts next | Domain stage/hold drives control selection |
| Receipt/completion | Confirm all items received; Completed; Tracking reference | Confirm actual receipt | DELIVERED plus packing, approved total, verified net funds and tracking required |
| Recovery | Processing; Recover pending action; connection/retry errors | Avoid duplicate action | Persistent server pending envelope and idempotent command replay |
| Subsequent order/support | Start another request; Request support/returns | Continue or resolve exception | Existing support surface; order query is contextual URL only, not a prefilled ticket |

## State Coverage

| State | Applicable | Content/rationale | Evidence |
| --- | --- | --- | --- |
| Default/action | Yes | Draft, request, quote, recipient, final and receipt controls | Source plus VI browser lifecycle and EN form |
| Loading/pending/disabled | Yes | Processing and disabled controls during hydration/queue | Browser callable pending snapshots; source |
| Empty/no result/zero | Yes | Prepare request; confirmed zero distinct from unavailable quote | B empty conversation; initial deposit zero |
| Success | Yes | Saved recipient, current stage, Completed | Desktop/mobile completion screenshots |
| Error/recovery | Yes | No payment created/no money added; recover unknown operation | Browser provider-unavailable; emulator lost-finalization replay |
| Offline/stale/partial | Yes | Connection retry and pending recovery; stale quote denied | Source and stale-version tests; deliberate offline browser NOT RUN |
| Unauthorized | Yes | Sign in before save/send; generic owner-safe errors | Anonymous/other-owner/locked rule tests |
| Confirmation/destructive | Yes | Explicit quote, final amount and receipt buttons; no destructive action | Native browser fixture plus server guards |

## Data Semantics

VND integer money is authoritative; quote total is fee sum less discount; 50% deposit rounds up. Confirmed funds exclude completed refunds; dispatch also excludes reserved refunds. Amount due is deterministic, not AI estimated. Quote expiry uses browser locale/timezone and server epoch expiry validation. Zero funds is real zero; absent quote/final total is not fabricated. Recipient operational PII is outside model context; chat text redaction is best effort, not a guarantee for arbitrary unlabeled PII. Customers are told not to put sensitive information in AI questions. No production PII used in this review.

## Mandatory Human Interface Principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Same chat exposes the current buying action, not an operational dashboard |
| Agency | PASSED | Review draft/address, accept exact quote, approve final total, externally authorize payment, confirm receipt |
| Responsibility | PASSED | Paid/delivered derives from authorized events; explicit staff waiting and provider error; live gaps disclosed |
| Familiarity | PASSED | Native labels, select/input/form/button/link and existing dialog conventions |
| Flexibility | PASSED | Optional link, editable variants, saved address, resume and VI/EN normal-state forms |
| Simplicity | PASSED | Inline next action; no need to navigate staff forms; no repeated details after resume |
| Craft | PASSED | 390×844 and 1280×900 rendered evidence, focusable controls, wrapping recipient text and bounded scroll area |
| Delight | PASSED | Calm processing/recovery/completion wording; no invented progress or pressure to pay |

## Platform Fit / Pattern Checks

Web platform, existing white/royal-blue SatsunicGo branding. No Apple-only copy or patterns introduced. Labelled controls, native dialog, role=status feedback and existing privacy link preserve platform expectations. Source and AX checks cover writing/labels, feedback, consequential choices, contextual FAQ help, privacy/account boundaries and both normal-state locales. Keyboard Tab reached support inside the dialog; native AX exposed form labels and disabled states. Full screen-reader announcements, RTL, browser zoom and every English backend error remain NOT TESTED; operational/server errors retain existing Vietnamese fallback.

## Gate Results

Human principles, web fit, business meaning, audience, natural tone, brevity, state coverage, data semantics/privacy, scoped accessibility, normal-state localization, terminology and current rendered-context verification: PASSED for this local implementation. Scope does not certify full accessibility conformance or provider readiness.

## Verification Evidence

- ASK-COMMERCE-008-desktop-completed.jpg: VI 1280×900, restored completed synthetic order.
- ASK-COMMERCE-008-mobile-completed.jpg and mobile-balance.jpg: VI 390×844 completion/receipt controls (balance filename captured after delivery event).
- ASK-COMMERCE-008-mobile-english.jpg: EN native buying form/optional link/quantity.
- 15 focused unit tests; 6 emulator workflow/rules tests; typecheck, lint and Vite build pass.
- Browser native AX: pending, payment unavailable with zero/unchanged ledger, final approval and amount due, receipt, close/reopen, separate accounts, English FAQ/form.

## Decision

Product Language Gate: PASSED for approved local scope. Fixed: resume without chat turns; recipient review/edit; async identity-bound results. Residual limits above require live integration/accessibility validation before production acceptance. No additional owner decision required for this local handoff.

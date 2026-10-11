# SatsunicGo Ask · v1

Status: PLAN_PENDING_HUMAN_REVIEW. Preview: `docs/previews/ASK-PANEL-WORKCELL-20261008.html`, VI/EN; synthetic data, no backend or provider. Task HEAD and intelligence as TEAM-BRIEF revision1. This changes existing application layout and approval behavior, so workflow step15 requires explicit review approval before applying this slice.

## Product flow

Ask retains conversation, current task and composer inside one panel. At wide widths, conversation is left and a 320–420px action window is right. On mobile the action window replaces the conversation viewport; returning to chat preserves the task and reading position. Header, conversation waypoints, action footer and composer remain reachable while a long form scrolls inside its own body.

One current action window shows the fields, reviewed values, status, named consequence and primary button. Other buttons are secondary Edit, Back or Later. Native labels, validation and 44px controls remain. Canonical white/blue/navy styles are retained. Proposed preview uses a custom request with unknown price; it makes no seller/price/availability claims.

Chat can edit supported fields, go to the next review step, explicitly approve or decline the single current preview. “Tiếp tục” advances review; it does not imply payment or consent to unspecified terms. “Đồng ý”/“yes” executes only an already rendered exact current preview. Questions, conditions, mixed approval+edits, quoted speech and ambiguous text clarify without executing. Decline keeps the draft and dismisses the preview; cancelling an existing order is a separately named action.

Waypoints navigate bounded rendered history. History is read-only. Viewing an old order/quote never recreates consent or reruns a command. Return to the current task before any confirmation.

## Exact impact and stages

| Path / functions | Change | Risk / validation |
| --- | --- | --- |
| `Ask.tsx` modal/work layout, conversation rendering, submit routing | Current task window, fixed composer, bounded waypoint selection and focus/scroll control | MEDIUM; mobile320/390/768/1440, keyboard, IME, reduced motion, loading/error/auth switch |
| `Ask.module.css` scoped panel styles | Grid/scroll containment, compact controls and consistent hierarchy | MEDIUM; no page/global style changes; horizontal overflow and long content |
| NEW `ActionWindow.tsx` + scoped styles | Nonmodal labelled region with fixed header/footer and independently scrolling form body | MEDIUM; Escape hierarchy, focus restoration, native validation, draft preservation |
| `Commerce.tsx` stable task shell and shared current-action readiness | Move display into task window while retaining UID/CID/order/version generation fences and exact command recovery | HIGH; late callbacks, ABA auth, multi-tab/version conflicts, duplicate/unknown action |
| `CatalogChat.tsx` selection and review | Same action window; existing server snapshot/price/terms/version checks | HIGH; full-payment catalog vs custom deposit, expiry, no-orderable product |
| NEW internal `packages/domain/action-preview.ts`, `chat-action.ts` callers | Canonical internal preview lifecycle and strict contextual consent/decline corpus | HIGH; no generic server executor, exact target/payload/version/hash/expiry binding |
| `CustomerWorkspace.tsx`, `customer-workspace.css` | Mount existing Profile/Membership forms in action window; preserve drafts under same UID, block task switch while operation outcome is unknown | MEDIUM; initially keep their existing dedicated save/purchase controls |
| NEW owned unit/browser regressions and review docs | VI/EN corpus plus complete happy/bad lifecycle/visual/focus/performance scenarios | Actual local component evidence separated from mocked data/provider/production |

First contextual approval slice: existing customer `submitRequest`, `acceptQuote`, `approveFinal`, `confirmReceipt`, catalog create-order; delivery saving through existing secure form command may use shared current form review. Payment preparation remains a named checkout action; payment verification remains authoritative. Profile and Membership generic approvals are follow-up scope until their exact form/plan snapshot contracts are proven; paid membership creates a pending invoice, never immediate payment.

## Internal preview contract

Capture one immutable preview: previewId, kind, owner/CID, target, canonical validated payload/hash, reviewed conversation/order/product/quote/terms revisions, local form revision, rendered consequence, createdAt and expiry. Suggested maximum TTL five minutes bounded by actual quote/source expiry; product review approval admits this proposal.

States: editing → awaiting_approval → executing → confirmed; or declined/expired/stale/unknown. Any edit, target/version/account change invalidates approval. Both chat and button consume one handler with the same readiness checks. Executing and unknown states cannot accept new consent. Repeated confirmation uses the existing operation outcome/recovery; never generate a fresh retry identity. Private contact/address data stay outside model context and transcript.

## Scenarios and performance

Cover source-backed current defects first. Then contextual VI/EN happy approval/decline/edit, no preview, question/negation/conditional/mixed/quoted approval, multiple actions, historical navigation, expired/revised quote/product, duplicate/reload/unknown, UID/CID/ABA, multi-tab, payment claim, partial receipt, staff-only action, catalog/custom differences, long forms, keyboard/screen-reader basics, IME, mobile and reduced motion. Scenario register records each as NOT_RUN until executed.

Measure actual local Ask shell separately from the static preview with synthetic bounded24turns and valid item limits. Capture interaction→paint, rAF gaps, long tasks, DOM/listener/request count across10cycles. Provisional budget: warm discrete interaction p95≤100ms, no repeatable Ask-attributed task>50ms and no duplicated requests/listeners/monotonic DOM growth. Authored animation durations are not automatically input delay. No production load test or provider latency claim.

## Approval and operational limits

The preview demonstrates arrangement/interaction only. It does not prove application integration, semantic LLM understanding, merchant verification, payment, retention or production readiness. Existing Gemini cap50000VND is fullyheld; no new paid probe. Official knowledge corpus/feedback retention decision remains pending. No deployment/configuration/datafix/finance/secret changes are included. Final independent review must be current; product content and every required failure scenario remain gates.

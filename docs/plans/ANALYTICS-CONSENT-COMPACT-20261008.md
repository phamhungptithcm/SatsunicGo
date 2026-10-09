# ANALYTICS-CONSENT-COMPACT-20261008 — v5

Status: PENDING HUMAN APPROVAL. Application implementation and verification NOT_RUN.

## Repository intelligence brief

CodeGraph queried first for AnalyticsConsent/setAnalyticsConsent; CocoIndex second for consent and privacy. Both returned the current component, verified against source. CodeGraph includes generated output in its blast radius and misses relevant tests. Repository Intelligence Gate completed: both health checks passed, both indexes stale; current/indexed commit 53d59bd88fa7da9d1243692336ecd09b6540ea31. DEGRADED; completeness is not claimed.

Source evidence: `src/shared/AnalyticsConsent.tsx`, `src/shared/analytics-consent.css`, `src/shared/analytics.ts`, `src/app/App.tsx:310`, `tests/unit/analytics-client.test.ts`. App renders the shared component. It displays on public routes; tracker is gated by explicit consent and auth readiness. Choosing stores yes/no and broadcasts an event; reopening exposes stop/allow/close. Consent defaults to unknown. Source is concurrent uncommitted work; preserve unrelated edits.

React 19 / TypeScript 6 / Vite 8 / web / Vietnamese. Applicable profiles: universal, web-app, visual-design, product-content. Context map and build command files are placeholders; package.json provides actual commands.

## Concrete implementation and impact

1. `src/shared/AnalyticsConsent.tsx`: replace long banner content with preview wording, remove duplicate English line, retain privacy link, explicit choices, stop-recording and reopen/close states. Use a labelled non-modal dialog with native buttons. No forced focus when initially displayed; return focus on user-initiated close/reopen. X is always available in the top-right heading row; closing hides the panel for the current mount without changing consent or enabling tracking. Keep a reopen control available even when consent remains unknown. Do not use an interruptive alertdialog or block shopping.
2. `src/shared/analytics-consent.css`: fixed bottom-right card, 320px desktop, 20px edge spacing, white surface, navy text, blue action, thin border, 14px radius, restrained shadow. Two readable 40px-high actions. Mobile: 16px spacing, viewport-bounded width/height, scroll for short screens, safe-area insets. Keep visible focus; avoid motion. Small reopen button in the same corner after choice.
3. Verify stacking against existing Toast/cart/mobile navigation before choosing final offsets/z-index; do not modify other components. Preserve existing consent storage, event handling, tracking, auth gating, route conditions, schemas, APIs and backend. Privacy link remains /privacy. No dependencies, runtime restart, deployment or data change.

Revision v2: user requests a smaller card, a top-right X that stays on the title row, and simpler neutral wording. No customer benefit is invented.

Risk: low visual scope, consent meaning sensitive. Possible floating-control overlap, keyboard focus loss, narrow-screen overflow and callers/tests relying on old labels. Mitigation: scoped diff plus real public-shell browser checks.

Alternative: a modal blocks the main task unnecessarily. Recommended: non-modal corner card as shown in `docs/previews/ANALYTICS-CONSENT-COMPACT-20261008.html`.

## Content inventory and principle mapping for proposed design

- Heading: “Tôn trọng riêng tư của bạn”
- Description: “Khi chọn “Đồng ý”, bạn cho phép lưu dữ liệu trên trình duyệt để chúng mình hiểu cách bạn dùng website và cải thiện trải nghiệm mua sắm. Bạn có thể đổi lựa chọn bất cứ lúc nào tại “Quyền thống kê”.”
- Privacy link: “Cách dùng dữ liệu”.
- Actions: “Từ chối”, “Đồng ý”; reconfiguration labels “Dừng ghi nhận”, “Quyền thống kê” remain; “Đóng” becomes the accessible label for the top-right X icon on all visible panel states.
- Accessible name/description come from heading and description. No additional data claims.

Purpose: consent decision; Agency: decline/allow/reopen/stop; Responsibility: explicit data scope and question exclusion; Familiarity: native web controls and existing vocabulary; Flexibility: narrow/short viewport, keyboard, safe area; Simplicity: one short paragraph and no duplicate English or rhetorical benefit claim; Craft: explicit states, focus, no truncated content; Delight: calm unobtrusive placement. These are design commitments, NOT a passed implementation review. Complete the product-content review template with current rendered evidence after approval.

## Validation after approval

- Read current shared runtime listener; reuse 127.0.0.1:5207 without restart.
- Verify real public shell at 1440, 390, 320px and short viewport; no horizontal overflow or hidden controls. Check floating surfaces, keyboard, reduced motion, privacy navigation.
- Exercise unknown / yes / no / reopen / stop / close / reload; confirm no tracking before opt-in and no implicit consent on close.
- Run focused ESLint for changed TSX, frontend TypeScript check, existing analytics-client unit tests. Add UI regression only where needed for interaction changes.
- Run mandatory final-implementation-review, record review cycles, quality/product-content evidence and completion report. Production readiness remains NOT_VERIFIED without deployment evidence.

Approval requested for the two application files and proportionate validation above; preview and plan only exist at this stage. Shared 5207 listener verified; HTTP request from sandbox returned 000, so rendered preview/browser validation is NOT_RUN. Memory candidates: None.

## Revision v3 — researched cookie-banner wording

User requests familiar cookie wording based on other websites. Primary references inspected: https://design-system.service.gov.uk/components/cookie-banner/ and https://github.com/mozmeao/consent-banner . GOV.UK uses neutral service naming, short purpose explanation, explicit accept/reject and details; its scope includes HTML5 local storage and similar device storage. Adopt the writing pattern, not a claim of legal compliance or its layout.

Source verification: analytics.ts uses localStorage for consent/browser ID and sessionStorage for session ID; this analytics flow has no explicit document.cookie operation. “Cookie” is a familiar umbrella label here for cookie-like browser storage, not an assertion that analytics HTTP cookies were found. The body specifies analytics only; accepting must never authorize unrelated marketing or change essential authentication. The privacy details should explicitly clarify browser storage when implemented; current PrivacyPage analytics section already describes random browser/session codes and linked account data. If that clarification needs a source edit, include only the analytics disclosure subsection in a separately reviewed scope delta.

Prototype still 320px with top-right X and no application changes. Rendered narrow-screen and text-size verification NOT_RUN.

## Revision v4 — natural, respectful Vietnamese

User requests warm everyday language and a simpler heading. Current prototype inventory above is authoritative; v3 is historical research. Heading is “Một chút về cookie”; body starts with the person’s choice, “Nếu bạn đồng ý”; primary action is “Đồng ý” within this labelled consent surface. “Chúng mình” is a proposed brand voice choice based on the user’s request. Improving shopping experience describes the intended use of analytics, not a promise of personalization, discounts or immediate customer benefit. Product IDs and Ask classifications remain the recorded scope; “chủ đề bạn quan tâm” is a plain-language rendering of recorded Ask topics. The raw-question exclusion remains explicitly limited to analytics. Decline, close without opt-in, withdrawal and reopen must remain available. No application implementation or rendered verification is claimed.

## Revision v5 — supplied privacy-first reference

User supplies “We value your privacy” as a writing reference. Adopt respectful heading, consent consequence, purpose and a real withdrawal path. No marketing permission or Accept All is introduced: source grants optional analytics only. Body accurately describes browser storage, intended improvement and the existing Quyền thống kê control; privacy details retain recorded-event scope and question exclusion. Prototype heading is 14px and stays in the flex heading row with X; narrow/text-scale rendered verification remains NOT_RUN. Content inventory above supersedes prior revision inventories. Application edits still await reviewed-plan approval.

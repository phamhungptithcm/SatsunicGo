# Product Content Review — v5 historical evidence; v6 current delta below

## Scope

Surface: shared AnalyticsConsent, public web routes. Locale: Vietnamese. Audience: customers browsing and shopping. Purpose: optional analytics consent. Approved plan v5 and user approval in APPROVAL.md. Reviewer: Codex, 2026-10-08 America/Chicago. Native web dialog, buttons and link; non-modal, no initial focus stealing. Apple-specific HIG compliance: NOT_APPLICABLE; bundled eight-principle reference used as human-centered quality guidance. Changed paths and hashes: SOURCE-MANIFEST.json.

## Context and evidence

Verified: tracker requires yes and ready; localStorage stores preference/browser code, sessionStorage stores session; withdrawal resets active collection; choice is independent of shopping. Copy approved by user. Current rendered real home and privacy shell inspected, not an isolated string file. Improving shopping is intended purpose, not a guarantee of discounts or personalized recommendations. Cookie-style preview refers to browser storage; implemented text explicitly says browser storage. Unknown: provider delivery; emulator analyticsSession returned 400 during opt-in, and collection delivery is NOT_VERIFIED.

## Content inventory

| State/location | Before | Current | Job/evidence |
| --- | --- | --- | --- |
| Heading | Cho phép thống kê để cải thiện SatsunicGo? | Tôn trọng riêng tư của bạn | Neutral privacy-first heading; approved v5 |
| Body | Long technical description plus English duplicate | Khi chọn “Đồng ý”, bạn cho phép lưu dữ liệu trên trình duyệt để chúng mình hiểu cách bạn dùng website và cải thiện trải nghiệm mua sắm. Bạn có thể đổi lựa chọn bất cứ lúc nào tại “Quyền thống kê”. | Choice consequence, purpose and actual reopen control; browser storage and state verified |
| Privacy link | Cách sử dụng dữ liệu | Cách dùng dữ liệu | /privacy navigation verified; details retain scope/question exclusion |
| Allow | Cho phép thống kê | Đồng ý | Explicit opt-in in labelled consent dialog |
| Decline | Từ chối / Dừng ghi nhận | Unchanged | no stored; withdrawal verified |
| Close | Đóng button only on reopen | X, accessible label Đóng, on all panel states | Hide without modifying choice |
| Reopen | Quyền thống kê | Unchanged | Available after choice or X |
| Accessible name/description | Aside label | Heading/body via unique useId IDs | Rendered named dialog and controls verified |

## State coverage

Default/action PASSED: unknown choice visible, X available. Success PASSED: choice stored and settings shown; no claim of provider success. Recovery PASSED: reopen/stop/close/reload. Offline/storage failure: source review PASSED, existing memory-only preference fallback unchanged; no persistence or provider success promise. Backend failure: existing tracker behavior unchanged; emulator 400 disclosed. Loading/disabled, empty, unauthorized, destructive: NOT_APPLICABLE to these synchronous preference controls; ready gate and public route conditions unchanged.

## Data semantics

Only optional analytics permission is changed by yes/no. No marketing or essential auth permission is requested. Body does not say anonymous, cookie-only, instant deletion, or guaranteed storage. Zero/null metrics, currency/timezone, freshness: NOT_APPLICABLE; no metrics displayed. Privacy details retain IDs, topics, order linking, raw-question exclusions and withdrawal consequences. No schema or payload changes.

## Mandatory Human Interface Principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Consent decision is the only task; actual card screenshot |
| Agency | PASSED | Decline/allow/X/reopen/stop and focus restoration executed |
| Responsibility | PASSED | Explicit browser-storage consequence; real preference path; provider success not claimed |
| Familiarity | PASSED | Native web controls, familiar Vietnamese and approved privacy-first wording |
| Flexibility | PASSED | 1440/390/320px, 320x420, keyboard Enter/Tab, text enlarged 2x without horizontal card overflow |
| Simplicity | PASSED | One paragraph, no English duplicate; compact 320px card |
| Craft | PASSED | Heading/description association, named X, visible focus; overlapping Ask fixed and tested |
| Delight | PASSED | Calm presentation, no coercion/urgency/animation, X retains agency |

## Platform fit and pattern checks

Web conventions and SatsunicGo white/navy/blue retained. No Apple-only expression. Writing/controls, interruption, consequential choice, permission/privacy, inclusion/localization: PASSED with rendered screenshots and keyboard assertions. Onboarding: NOT_APPLICABLE. No focus trap or aria-modal. Title and X remain in one flex row; enlarged heading may wrap within its own cell while X stays top-right.

## Gate results

Human Interface principles, platform fit, behavior/meaning, audience, natural respectful tone, brevity, states, privacy semantics, accessibility, localization/expansion, terminology and in-context verification: PASSED within scoped local evidence above. Full assistive-technology manual review: NOT_RUN, not claimed. RTL localization: NOT_APPLICABLE to Vietnamese-only changed copy. Browser evidence: Chromium only.

## Verification evidence and decision

18 browser assertions passed after overlap fix: three viewports fit/X row/unobscured action, close without consent, close/reopen focus, no/yes/withdraw storage, X preserves yes, short viewport, privacy navigation. Supplemental Enter/Tab order and 2x heading/body expansion passed. Screenshots output/playwright/consentcompact-{1440,390,320}.png inspected. ESLint and frontend tsc passed; analytics-client tests 7/7 passed.

Product Language Gate: PASSED for local implementation. Finding fixed: Ask composer intercepted pointer events; measured clearance now handles both composer and collapsed launcher with observers cleaned on unmount. Residual risk: floating-surface detection uses existing accessible names; changes to those names require review. Provider/production delivery NOT_VERIFIED. No additional owner decision required for this approved local scope.

## Current v6 delta review (supersedes v5 reopen-button inventory)

User directly requests automatic initial display and no lingering button after X/decline/accept. Implemented: no analyticsSettings markup/CSS, unknown choice automatically visible; X hides for current mount without granting consent; yes/no stored and hide across reload. /privacy exposes the existing dialog for withdrawal/change and can be dismissed per route entry. Body now ends “Bạn có thể đổi lựa chọn bất cứ lúc nào tại trang “Quyền riêng tư”.” PrivacyPage analytics instructions changed only from the removed button reference to “mở lại trang Quyền riêng tư và chọn Dừng ghi nhận”. Heading, remaining description, link, X label and choices unchanged. Focus after dismissal goes to existing #main, not a nonexistent button.

State/content/meaning/platform/terminology review: PASSED. Browser checks on actual 5207 home/privacy executed X, no, yes, no leftover button/dialog, exact stored choice, reload behavior, privacy-page withdrawal and Enter dismissal/main focus. 320px closed-state screenshot: output/playwright/consentcompact-closed-no-button.png. Earlier viewport/Ask-clearance geometry unchanged; only removed-control CSS deleted. Loading/errors remain synchronous preference operations with existing storage/transport fallback. Data claims stay unchanged and no new marketing permission.

Purpose PASSED: consent choice; Agency PASSED: three dismissals plus privacy withdrawal; Responsibility PASSED: real withdrawal destination and no implicit yes; Familiarity PASSED: native web actions and existing Privacy footer route; Flexibility PASSED: narrow screen and keyboard tested; Simplicity PASSED: no lingering floating control; Craft PASSED: removed stale guidance and returned keyboard focus; Delight PASSED: removes visual clutter without coercion. Product Language Gate: PASSED for current local delta. Full screen-reader/cross-browser/provider proof still unavailable as previously disclosed.

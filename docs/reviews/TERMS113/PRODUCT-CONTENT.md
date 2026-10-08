# Product Content Review — TERMS113

## Scope
Public /terms, Vietnamese responsive web; customers need to understand payment and policy limitations. Reviewer: Codex, 2026-10-07 America/Chicago. Files: TermsPage.tsx, terms-page.css, App.tsx and packages/domain/public-content.ts. Web conventions: semantic headings/list, normal link navigation, visible focus, no animation. Apple-specific component guidance: NOT_APPLICABLE. Bundled Human Interface principles applied as web quality reference.

## Context and evidence
Verified: publicCopy feeds both App.tsx and functions/src/public.ts. Server contentHtml splits paragraphs and escapes text. Current purchase documentation distinguishes full listed payment from accepted-quote two-payment purchases. Existing policy is unapproved. No new policies, timelines or refund promises invented. Owner approval: APPROVAL.md. Assumption: this is informational content, not legal-policy approval. Unknown: actual commercial policy, deployment/provider rendering.

## Content inventory
| Location/state | Previous | Current | Job/evidence |
| --- | --- | --- | --- |
| H1/default | Điều khoản mua hộ | Unchanged | Identify page |
| Intro/default | Dense payment/policy paragraph | Những điều bạn cần biết về thanh toán, đổi trả và hoàn tiền. | Explain reading purpose |
| Section 1/default | Sản phẩm niêm yết thanh toán toàn bộ | Sản phẩm trong danh mục / Bạn thanh toán toàn bộ theo giá niêm yết. | Identify listed purchase obligation |
| Section 2/default | Yêu cầu ngoài danh mục thanh toán hai đợt theo báo giá | Sản phẩm ngoài danh mục / Bạn gửi yêu cầu, xem và đồng ý với báo giá trước khi thanh toán. Khoản thanh toán được chia thành hai đợt theo báo giá. | Sequence matches purchase workflow |
| Section 3/default | Internal approval phrase | Đổi trả, hủy đơn và hoàn tiền / Các điều kiện này chưa được duyệt. SatsunicGo cần hoàn tất và công bố điều khoản trước khi nhận giao dịch thực tế. | Preserve material policy limitation |
| CTA/default/focus | Gửi yêu cầu mua hộ | Unchanged, decorative arrow hidden | /request link, does not submit or charge |
| Accessible structure | Single paragraph | Named region, three h2 headings, ordered list with explicit list role | Playwright semantic snapshot |
| Numbers | Absent | Decorative 1–3, aria-hidden | Reading order; no business metrics |

## State coverage
Default, focus and navigation: PASSED in browser. Hover uses existing primary styles. Loading, pending, disabled, empty, success, error/recovery, stale/partial, unauthorized, confirmation/destructive: NOT_APPLICABLE to static public information (no asynchronous operation, data mutation or restricted data). Offline: compiled static copy needs no backend; loading the entire app offline is outside this page change, NOT_VERIFIED. Destination request handling unchanged.

## Data semantics
Source of truth: purchaseTerms; publicCopy.terms derives from the same source. No amounts, percentages, dates, metrics or guarantees added. Policy approval remains explicitly unavailable. No personal data or permission changes.

## Mandatory Human Interface principles
| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Heading and intro explain payment/policy reading task |
| Agency | PASSED | Optional ordinary /request link; no consent or auto-submit |
| Responsibility | PASSED | Unapproved policy disclosed in full; no refund guarantee |
| Familiarity | PASSED | Natural Vietnamese, products/báo giá/thanh toán wording |
| Flexibility | PASSED | 390x844 and 1440x1000 screenshots, wrapping, heading/list semantics, keyboard navigation |
| Simplicity | PASSED | Three brief sections, one main CTA |
| Craft | PASSED | Shared browser/server source; corrected CSS specificity; visible focus; no overflow |
| Delight | PASSED | Calm tone, easy reading and clear sequence; no decorative motion |

## Platform fit and pattern checks
Responsive web using existing SatsunicGo blue-white-navy styles; no Apple-specific controls or copied branding. Writing/controls: PASSED. Inclusion/accessibility/localization: PASSED within tested browser and Vietnamese. Feedback/alerts/consequential choices/onboarding/permissions/accounts: NOT_APPLICABLE; page performs no operation. RTL: NOT_APPLICABLE to Vietnamese. Text scales without fixed text height or truncation; 200% zoom and screen-reader/device runtime NOT_RUN, residual limitation.

## Gate results
Human Interface principles, platform fit, behavioral meaning, audience context, respectful tone, brevity, state coverage, data semantics/privacy, accessible structure/focus, Vietnamese wrapping, terminology and current in-context verification: PASSED within local scope.

## Verification evidence
Desktop 1440x1000, mobile 390x844: output/playwright/terms113/{desktop,mobile}.png directly inspected. Browser reports scrollWidth equal viewport width, reading width 800px desktop and three section headings. CTA href /request, keyboard Tab/Shift+Tab and Enter verified. TypeScript frontend/functions, scoped ESLint, Prettier: PASSED. Server HTML reviewed from source; deployed SSR NOT_VERIFIED. No synthetic user data required.

## Decision
Product Language Gate: PASSED for local implementation. Commercial/legal approval and deployment remain unverified. CSS reading width corrected within scope. No owner decision required for the approved local work.

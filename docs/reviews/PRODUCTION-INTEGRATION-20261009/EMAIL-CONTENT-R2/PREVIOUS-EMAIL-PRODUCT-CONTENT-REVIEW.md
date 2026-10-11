# Email product content review

Current decision: **PARTIAL / NOT_READY.** The review below is historical component-proxy evidence. Its checkout-dependent25-case acceptance predates the checkout label change and must not certify the current complete UI. Current actual desktop checkout/keyboard evidence is archived separately. A fresh independent supplement, `EMAIL-EVIDENCE/satsunicgo-email-product-profile-supplement-final-20261009.json`, verifies three actual Profile states and the approved footer fix at1280/390/320px plus Tab, with14 current source hashes. The later catalog scope is excluded. Actual VoiceOver was blocked before any toggle; save/token/CRM-candidate/provider/release outcomes remain uncertified. Existing production MFA/session read is not proof of the local candidate. Historical detailed results below retain their original scope.

The latest independent phase review, `EMAIL-EVIDENCE/satsunicgo-final-catalog-product-review.json`, binds actual READY and the unchanged878-file pre-cart snapshot. It accepts the catalog owner's separate scoped cycle3 evidence and retains the CRM cycle9/product gate and broader current notification state coverage as **BLOCKED before deployment**. The new cart recovery/banner/merge task has no final handoff yet. Native catalog accessibility/explicit text-scale proxy does not substitute for spoken AT on the changed custom address combobox. Exact deployed revision/configuration/readback, authorized owner opt-in canary, and live App Check/confirmation/opt-out/stale-token outcomes are the separately approved postdeployment steps. No requirement was waived or promoted from a fixture to authenticated/live proof.

## Scope

- Reviewed 2026-10-09 by independent `email_product_review` agent.
- Approved scope: EMAIL-RELEASE-DELTA-v1 and v1.1. This agent edited only this report and adjacent `EMAIL-CONTENT-*` review evidence. No production source, product wording, layout, runtime settings, existing preview generator/output, or shared data was changed by this agent.
- Meaning change: `functions/src/notification-preferences.ts` now derives email availability from the exact production environment/database fence, validated Resend configuration, verified-domain receipt, elapsed cutover, enabled sending, and enabled subscriptions. SMS availability remains false.
- Affected surfaces: actual `NotificationPreferences`, `CheckoutNotificationChoices`, `NotificationSaveStatus`, `NotificationLinkAction`, their actual hook, the Profile third tab and PurchaseCheckout recipient form.
- Audience/task: Vietnamese customers selecting optional notification topics, saving preferences, confirming subscriptions, or revoking the link's topics. Checkout/order/payment remains the primary business task.
- Platform/locale: Vietnamese responsive web. React 19.3.0, TypeScript 6.0.3, Vite 8.3.2, Node 22.23.3, headless Chromium 153.0.8010.12, Playwright 1.63.0. Existing blue/navy/white product styles and native web controls remain authoritative.
- Apple HIG: bundled human-interface principles applied as a quality reference. No Apple-platform implementation or current Apple HIG compliance claim; an external HIG compliance audit is not applicable to this scoped web change.

## Repository intelligence and evidence boundary

Actual pre-review gate: `/private/tmp/satsunicgo-email-product-rig.txt`, **READY**, both indexes Current/Passed, commit `0d6e721698608eebb36b0b2f68021c3054d97d1c`. An initial unprivileged refresh did not produce a healthy CocoIndex check; a permitted cache refresh/check recovered READY before QA began. Role-specific CodeGraph exploration ran first, then CocoIndex located the prior subscriptions content review and implementation evidence. Critical availability, state, and hook conclusions were checked in canonical source.

Concurrent work makes index freshness temporary. The review is bound to `EMAIL-CONTENT-source-manifest.json`, not a claim that the entire dirty worktree or index remains frozen. Parent coordinated a later source pause for another agent's READY check; no duplicate refresh was run during that pause.

`EMAIL-CONTENT-build.mjs` imports current real React components and the actual preference hook. Firebase Auth/Firestore/callables/cart are replaced by explicit in-memory fixtures. The historical r4 app shell is retained and disclosed. These are rendered component tests, not authenticated end-to-end browser tests. Every browser request except `http://127.0.0.1:5207` is blocked; no additional server, reseed, restart, provider call, customer message, or account write occurred.

The backend readiness helper changed after rendering to fix the finding below. Rendered component/hook/style hashes remained unchanged. `EMAIL-CONTENT-readiness-check.json` verifies the changed helper directly; the source manifest records post-fix hashes. The 25 unchanged rendered scenarios were not unnecessarily repeated after that backend-only fix.

## Verified facts, assumptions, and unknowns

Verified:

- Requested selection, confirmed generation, and channel availability are separate concepts. A checked switch can retain a saved choice while its channel says `Chưa sẵn sàng`.
- Available email displays `Đã tắt`, `Chờ xác nhận`, or `Đang nhận` according to the saved requested/confirmed generation. `Đang nhận` describes active subscription eligibility; it does not report delivery of an individual message.
- The resend button is offered only for an available channel with pending consent, and is disabled while local edits are unsaved. Success says a request was saved, never that an email arrived.
- SMS preparation permits saving a choice and separate subscriber phone, while consistently marking sending unavailable. Checkout does not silently copy the delivery recipient phone into that field.
- The actual hook retains the same operation ID after an uncertain save, disables edits, and supplies explicit recovery. A definitive failure does not announce success.
- Token actions clear the URL fragment and require explicit action. Confirmation/opt-out success describes the preference outcome, not provider delivery.

Assumptions bounded by existing approved implementation: Vietnamese mobile numbers and Vietnamese product UI are the current supported scope; the supplied fixture user is synthetic. The existing product's notification terminology is retained.

Not verified here: real Resend domain state, DNS, secret access/bindings, production configuration, provider receipt/inbox, SMS carrier, deployed App Check/auth, OS screen-reader operation, real browser zoom, cross-browser compatibility, production performance, retention/export/deletion wiring. These are not turned into passing release evidence.

## Content inventory

`EMAIL-CONTENT-inventory.json` contains **42 source-located Vietnamese literals/JSX fragments** across the component, hook, endpoint, and phone schema. They were reviewed in context; none was edited by the email delta or this review. The dynamic resend labels are `Gửi lại xác nhận email` / `Gửi lại xác nhận SMS`; only email is rendered as available in prepared fixtures. API/domain messages may be safely mapped to the hook's generic user message rather than shown verbatim.

| Location | State / content | User job | Behavior evidence |
| --- | --- | --- | --- |
| Profile topic rows | `Cập nhật đơn hàng qua email`, `Ưu đãi qua email`, `Cập nhật đơn hàng qua SMS` | Choose each topic independently | Actual labeled switches; independent promotion opt-out scenario |
| Profile row status | `Chưa sẵn sàng`, `Đã tắt`, `Chờ xác nhận`, `Đang nhận` | Distinguish capability, choice, confirmation | Canonical domain state function, endpoint/helper checks, four rendered state cases |
| Checkout choices | `Nhận cập nhật đơn hàng và ưu đãi qua email`; `Nhận cập nhật đơn hàng qua SMS` | Make optional choices while entering recipient details | Real PurchaseCheckout; unchecked defaults; native mixed state for partial email selection |
| SMS field/helper | `Số di động nhận thông báo`, `Số di động nhận SMS`, `Số di động của bạn`; unavailable helper | Supply a separate subscriber number without assuming sending exists | Blank separate field; missing-number validation; availability=false |
| Loading/read failure | `Đang tải tùy chọn…`, `Đang tải tùy chọn nhận tin…`, failed-load text; `Thử tải lại` | Understand unavailable data and retry read | Actual hook loading/failure/recovery |
| Save | `Lưu tùy chọn`; `Đã lưu tùy chọn thông báo.` | Persist the preference | Fake durable view round trip through actual hook; production persistence is separately owned backend evidence |
| Resend | `Gửi lại xác nhận email`; `Đã lưu yêu cầu gửi lại xác nhận.` | Request another confirmation | One mocked command; no delivery success claim |
| Uncertain save | `Chưa rõ kết quả lưu. Kiểm tra lại lần gửi này.`; `Kiểm tra lần gửi` | Resolve the same operation safely | Same operation ID on retry; edits disabled until result known |
| Conflict/quota/permission | Specific reload/wait/safe generic failure text in inventory | Recover without false success or leaked internals | Three separate rendered negative cases |
| Public token action | `Xác nhận đăng ký`, `Tắt nhận tin`, `Đang xử lý…` and scoped success/error text | Confirm or revoke the link's subscription scope | Real component, explicit Enter, fragment removal, mocked success/failure |
| Endpoint/schema messages | Invalid choice, sign-in, Vietnamese phone validation | Maintain a safe boundary | Canonical strict schemas/current identity checks; current endpoint positive readiness tests are owned by parent QA |

No proposed copy or layout change is part of this handoff. Existing wording `Kiểm tra lần gửi` is understandable alongside `kết quả lưu`; a future copy pass could prefer `Kiểm tra lần lưu` if the owner wants to distinguish preference saving even more explicitly. This is low-priority existing wording, not a correctness blocker or authorization to edit it.

## State coverage

| State | Status | Current evidence / rationale |
| --- | --- | --- |
| Default/action/selected | PASSED | Unchecked checkout defaults; ready off/pending/active; saved unavailable selection; partial email indeterminate state |
| Hover/focus | PASSED | Native labels/controls and unchanged styles inspected; actual keyboard focus outline and activation verified; no hover-only meaning |
| Loading/pending/disabled | PASSED | Read pending hides unavailable controls; save pending prevents repeat actions; unchanged-save disabled; dirty pending resend disabled |
| Empty/no result/true zero | PASSED | Missing preference defaults off; unread view/loading/failure is not treated as off or zero |
| Success | PASSED | Save/resend/token messages match the mocked durable operation result and do not imply inbox delivery |
| Error/recovery | PASSED | SMS missing number, failed load/retry, version conflict, denied mutation, quota, token failure |
| Offline/uncertain/stale/partial | PASSED | Lost response retains operation identity and blocks edits; explicit retry; mixed email state; conflict requires reload. This is a lost-response proxy, not full network/device-offline acceptance |
| Unauthorized/forbidden | PASSED | Safe generic rendered failure; canonical endpoint derives owner and current identity server-side; real deployed authentication remains NOT_RUN |
| Confirmation/revocation | PASSED | Explicit confirm/unsubscribe button, no automatic mutation on navigation, scoped language, cleared fragment |
| Cancellation/real timeout | NOT_RUN | No new cancellation UI exists; real callable/provider timeout and browser recovery are outside this content-only fixture and must remain in parent release QA |

## Data semantics and privacy

- Source of truth: server-owned preference record plus current provider eligibility. The fixture models their view shape; it does not prove real writes.
- Requested=true is not confirmed=true; confirmation compares generation values. Missing/unread and unavailable are not rendered as zero or a successful subscription.
- Availability is capability eligibility, not a per-email receipt. Sender verification is a referenced release prerequisite, not a claim made by the customer UI.
- Separate SMS phone follows existing Vietnamese E.164 validation; no new phone/address/owner leakage was observed in the rendered error states.
- No price, currency, delivery ETA, retry deadline, or retention claim was added. Timestamps are internal to eligibility; no new localized date or metric format is in this delta.
- Synthetic fixture emails use `.invalid`. Fixture calls retain only synthetic test operation identifiers; no customer data, live token, API key, or secret was read.

## Mandatory Human Interface principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Two compact optional checkout choices preserve the recipient/order task; profile provides independent controls |
| Agency | PASSED | Unchecked defaults, explicit save, independent opt-out, token confirmation, no silent mutation on link open; uncertain edits safely held |
| Responsibility | PASSED | Unavailable SMS is explicit; saved request is distinct from delivery; future cutover no longer exposes false readiness |
| Familiarity | PASSED | Existing web profile tab/card, standard checkboxes/switch semantics, labels and ordinary Vietnamese action verbs |
| Flexibility | PASSED | Space/Tab/Enter, visible focus, accessible names, 1280/390/320px, no horizontal overflow, supplemental doubled-text proxy |
| Simplicity | PASSED | Existing two checkout labels retained; detailed channel state stays in profile; no extra transport/provider explanations added to customer UI |
| Craft | PASSED | 42-location inventory, safe failures/recovery, state mapping, accessible snapshot/live regions, label wrapping and source-bound current screenshots |
| Delight | PASSED | Calm saved-state feedback, retained choices on error, safe same-operation recovery, no forced celebration or unnecessary interruption |

## Platform and interaction checks

| Pattern | Status | Evidence / boundary |
| --- | --- | --- |
| Writing, labels, controls | PASSED | Persistent visible labels, accessible switch names matching them, local ordinary Vietnamese; raw internal enum/property names absent |
| Feedback/interruption | PASSED | `aria-live=polite`, `role=status` and `role=alert` verified in actual component; no added modal interruption |
| Consequential actions | PASSED | Explicit subscription confirmation/revocation; no order/payment consequences invented |
| Onboarding/contextual help | PASSED | Existing short SMS unavailability helper is contextual; no new onboarding |
| Permission/privacy/accounts | PASSED | No owner supplied by client; permission failure is generic; URL-fragment token cleared; real auth test remains a separate backend/release gate |
| Accessibility/localization/inclusion | PASSED | Current DOM accessibility snapshot, keyboard and Vietnamese narrow/text-expansion rendering. Real VoiceOver/other AT, EN/RTL product localization and complete cross-browser accessibility certification are not claimed |

Target-platform fit: PASSED for this web delta. Human-centered principles were used without Apple-only controls, assets, or trade dress. No motion was added; reduced-motion changes are not applicable.

## Review and fix cycles

1. **Rendered cycle 1:** 22 passed, 3 harness failures. Loading was asserted before the effect updated, exact phone accessible-name matching excluded the nested helper, and repeated token navigation reused the same document. Fixed only the review runner: polling, accessible-name prefix, and fresh query navigation. Production code was not changed to satisfy these assertions.
2. **Rendered cycle 2:** **25/25 PASSED**, zero page errors, zero non-local requested origins. Machine record: `EMAIL-CONTENT-browser-results.json`. This is the retained current component cycle.
3. **Meaning finding EMAIL-CONTENT-01, Medium:** real `emailProviderReady` initially returned true before future cutover. With worker pre-cutover rejection, the UI could expose an available channel while a new confirmation was ineligible. Parent fixed the canonical helper to require `now >= cutoverAt`. Direct post-fix checks: future 1ms=false, exact cutover=true, elapsed=true, all PASSED (`EMAIL-CONTENT-readiness-check.json`). No remaining finding in this scoped content gate.
4. **Supplemental text expansion:** doubled computed font sizes for 12 notification-region elements at 390px, viewport/scrollWidth both390, keyboard Space still works. `EMAIL-CONTENT-text-expansion.json/png`. This is explicitly a text-expansion proxy, not full OS/browser zoom or handset testing.

## Gate results

| Dimension | Status | Evidence |
| --- | --- | --- |
| Human Interface principles/platform fit | PASSED | Eight principles and web-pattern checks above |
| Meaning matches behavior | PASSED | Canonical state/eligibility checks, future-cutover correction, actual rendering proxy |
| Audience/business context/natural tone | PASSED | Vietnamese optional consent; reviewed complete labels/messages, no invented delivery/cost promises |
| Concision/actions/state coverage | PASSED | Inventory and 25 current scenarios; no new copy or extra containers |
| Data semantics/privacy | PASSED | Availability/consent/request/delivery separation; synthetic fixture only |
| Accessibility | PASSED | Scoped unchanged controls: labels, keyboard/focus, status/alert, accessible snapshot; live AT explicitly NOT_RUN |
| Localization/text expansion | PASSED | Vietnamese 320/390 layouts and doubled-region text proxy; unsupported EN/RTL not claimed |
| Terminology/in-context verification | PASSED | Actual component/hook current hashes, visual inspection, source-located inventory |
| Real provider/deployed integration/production performance | NOT_RUN | Not reachable through fake I/O; remain required parent release evidence |

## Commands and handoff evidence

Review generation (no existing preview files overwritten):

```sh
/Users/hunpeo97/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node docs/reviews/PRODUCTION-INTEGRATION-20261009/EMAIL-CONTENT-build.mjs
/Users/hunpeo97/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node docs/reviews/PRODUCTION-INTEGRATION-20261009/EMAIL-CONTENT-browser.mjs
```

The first Chromium launch was sandbox-blocked by macOS Mach bootstrap permission; the permitted headless rerun used a separate temporary browser profile and did not touch the user's Chrome session. Loopback-only routing remained enforced. Readiness used Node22's strip-types import of the canonical helper; that command emitted a package-module-type performance warning, not a failed assertion. No dependency/module change is recommended merely to silence the review command warning.

Evidence: source manifest; 42-string inventory; 25-scenario JSON; accessibility YAML; wide unavailable/pending and validation screenshots; profile320/390; checkout1280/390/320; confirm/unsubscribe390; supplemental text expansion; three readiness boundary assertions. Source and evidence hashes are listed in `EMAIL-CONTENT-handoff.json`.

Code-quality/delivery summary: real shared components/domain state/hook were reused, no framework/dependency/source edits were introduced, fake I/O and historical shell limitations are explicit, and meaningful failure states were exercised. No application architecture/ADR/schema/production release instruction changes are proposed by this review. Parent remains responsible for fresh full-candidate tests, actual endpoint readiness contract cases, immutable artifact, provider verification/readback, deployment and rollback evidence.

Runtime ledger CLI is unavailable on this host (`command -v ai-agent-kit` had no result); these repository JSON/report files are reviewable evidence, not native runtime attestation. Token usage and actual billed cost: Unavailable. No real provider call was made. Memory candidates: None. No external work item, commit, push, or deployment was performed by this agent.

Final scoped review: PASSED. Production-readiness decision: **NOT_READY** until the parent release's remaining required gates pass. No successful full-system release claim is made.

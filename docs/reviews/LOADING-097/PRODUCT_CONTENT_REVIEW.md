# Product Content Review — LOADING-097

## Scope
Shared LoadingState/LoadingBar/LoadingOverlay; CRM CrmState; route and workspace fallbacks. Vietnamese web app, React 19.3 / TypeScript / CSS / Vite 8.3, desktop and mobile browser. Existing contextual messages remain unchanged. Human-interface principles used as a web quality reference; no Apple-platform compliance claim. Reviewed 2026-10-06.

## Context and evidence
Source: Loading.tsx, loading.css, CrmPresentation.tsx, Workspace.tsx, App.tsx, feedback.ts and Customers.tsx. User requests consistent bars and stable waiting screens. Existing operation ownership and data reads remain unchanged. Browser evidence: real components rendered by docs/reviews/LOADING-097/preview.html on the shared 5207 frontend with explicitly synthetic content. Tested desktop 1280×720, 320×700 and 390×844. This is component evidence, not an authenticated CRM end-to-end test.

## Content inventory
| Location | State | Existing and retained content | Purpose and behavior |
| --- | --- | --- | --- |
| LoadingOverlay | pending | Đang xử lý… | Indeterminate operation; no promise or percentage |
| LoadingOverlay | pending under 10s | Thông tin sẽ cập nhật khi có kết quả. | Existing waiting explanation |
| LoadingOverlay | pending over 10s | Thao tác đang cần thêm thời gian. | Existing 10-second timer, observed in browser |
| LoadingState consumers | pending | Contextual caller children, unchanged | Distinguish loading list, opening view and restoring account |
| CrmState | loading | Existing title/children/action, unchanged | Retain operation-specific meaning and available recovery |
| LoadingState overlay variant | assistive technology | status, aria-live polite, aria-atomic true, aria-busy true | One announced status; decorative bar hidden |

## State coverage
Default/hover/focus: native underlying controls remain reachable. Loading: inline, panel and overlay checked. Disabled: existing operation locks untouched. Empty/error/recovery: CrmState branches untouched; error and retry rendered and activated in fixture. Success/unmount: stop action removes status without trapping focus. Offline/stale/partial/unauthorized/confirmation/destructive: unchanged caller semantics; no fabricated zero, freshness or successful save. No changes to business/data meanings, currency, privacy or authorization boundaries.

## Mandatory principles
| Principle | Result | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Contextual task message alongside one shared indeterminate bar |
| Agency | PASSED | No pointer interception on waiting layer; stop button clicked through overlay |
| Responsibility | PASSED | No percentage or success claim; existing slow status observed at 10.5 seconds |
| Familiarity | PASSED | Existing Vietnamese loading labels; web status semantics |
| Flexibility | PASSED | 320/390 widths without overflow; source has static prefers-reduced-motion rule |
| Simplicity | PASSED | Shared compact card; duplicate CRM status hidden while foreground status exists |
| Craft | PASSED | 128px panel bar and 72px inline bar; centered 280px card within mobile viewport |
| Delight | PASSED | Transform-only motion; retained underlying content and reachable actions |

## Platform fit and pattern checks
Web-native status/live announcements; no focus trap, no dialog semantics, no new keyboard shortcuts. Royal blue #163cff / navy #111c35 retained. Feedback prominence matches waiting; no new confirmation or permission flow. No new localized business strings; caller children wrap. Alerts/error meaning unchanged. Inclusion: non-color textual indication, semantic status and static motion fallback. Onboarding and consequential choices: NOT_APPLICABLE.

## Gate results
Meaning, context, tone, brevity, terminology, privacy/data semantics, eight principles, platform fit and in-context component verification: PASSED for scoped change. Accessibility semantics and underlying keyboard operation checked; assistive speech output and OS reduced-motion emulation NOT_RUN. Full authenticated CRM journeys, every individual consumer viewport and production performance NOT_RUN. These limits prevent production certification but do not invalidate the bounded shared-component review.

## Verification
Browser DOM and screenshots observed for inline, panel, CRM and global overlay. Panel height 240px; 390px card centered at x=195; 320px card x=20, width=280, no horizontal overflow; desktop card centered at x=640/y=360. Error/retry and stop action checked. Foreground plus CRM DOM exposes only foreground status; computed CRM display:none. Long wait observed after 10.5 seconds then status removed on stop. Source timer cleanup retained. Motion preference handled in CSS, not emulated in browser.

Decision: PASSED for local shared-component scope. Production/readiness: NOT_READY; authenticated CRM journey evidence remains unavailable.

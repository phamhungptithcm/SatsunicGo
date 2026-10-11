# Product Content Review

## Scope
Ask.tsx / Commerce.tsx authenticated purchase-control visibility and restoration. Vietnamese/English responsive web, existing SatsunicGo design system and semantic buttons/links/dialog/log. No label, copy, style, animation or currency-format changes. Apple-native HIG certification is not applicable; bundled human-interface principles used as a web quality reference.

## Context and evidence
Verified source: currentAskConversation enforces verified Google, current settings, sandbox owner allowlist, policy expiry and transaction fences. Existing release omitted a compile flag and could never probe this authority. Probe now runs once per auth transition; purchase UI requires current UID and owner-verified server snapshot. Failures retain plain Ask and existing fallback routes. No new user information is requested or publicly readable config introduced.

## Inventory and states
| Surface/state | Existing content preserved | Behavior evidence |
|---|---|---|
| Published answer, nonadmitted/loading/denied/offline/timeout | Gửi yêu cầu mua hộ / Request an item; Review draft · not submitted where applicable | Same commerce state passed to PublishedAnswer and composer; component fixtures |
| Current owner successfully hydrated | Thêm ảnh sản phẩm / Add product images; existing purchase workspace | Owner and restoration predicate; actual hook server-snapshot fixture |
| Snapshot rejection/error | Existing recovery text; no raw error/foreign owner details | Hook schema/owner validation; generic catch; no generated admission UUID |
| Concurrent admission / plain question | Existing answer and composer remain | Dedicated local-turn sequence; request context adoption waits until read completes |
| Auth change/reset | Previous private context cleared | Existing auth generation/context fence; A-B-A tests |
| Success/confirmation/destructive/pending operation | Existing purchase review and server commands unchanged | No financial mutation/API change in delta |

## Data semantics and privacy
Admission is current-user eligibility, not purchase success. Null, missing, malformed and cached initial data cannot stand for successful admission. No amounts, timestamps, ETA, estimates, owner names, contact information or private policy details are added to customer content. Backend transaction validation remains authoritative after UI visibility.

## Mandatory principles
| Principle | Status | Evidence |
|---|---|---|
| Purpose | PASSED | Ordinary questions work without purchase admission; tests assert usable composer and tracking answer. |
| Agency | PASSED | Existing request fallback, cancel and input preserved; background admission does not abort new plain turns. |
| Responsibility | PASSED | No success from null/cache/foreign snapshot; exact current owner checked; raw errors not surfaced. |
| Familiarity | PASSED | Existing labels, routes, buttons and approved layout retained. |
| Flexibility | NOT_RUN | Final hosted narrow/wide, keyboard and scaling acceptance pending new immutable release. Existing DOM semantics unchanged. |
| Simplicity | PASSED | Removes compile-flag divergence; one predicate controls composer and fallback. No new interruption. |
| Craft | NOT_RUN | Actual final-artifact browser state acceptance pending; component fixtures cover initial/postrestore failures and races. |
| Delight | PASSED | Recoverable background failure preserves the person's ongoing question without forced sign-in for Ask. |

## Platform fit / pattern checks
Web React semantic controls, native browser focus and existing localization; no Apple-only convention/assets. No new alerts, onboarding, forms, permission requests or consequential choice text. Existing actionable request/draft links retained on nonadmission. Keyboard/screen reader/zoom and full rendered width checks remain NOT_RUN for final artifact, not inferred from strings or component tests.

## Gate result
BLOCKED for successful final handoff pending final hosted in-context and accessibility evidence. Source semantics/security checks and component fixtures are recorded separately. No claim of complete HIG/WCAG certification.

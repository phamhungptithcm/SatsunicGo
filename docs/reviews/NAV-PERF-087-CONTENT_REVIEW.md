# Product Content Review — NAV-PERF-087

Reviewer: Codex; client date 2026-10-06. Decision: PASSED for scoped local web changes.

## Scope and context

Surfaces: account orders/shipments/notifications, cold profile/security routes, shared loading, Home entrance and Ask composer entrance. Audience: customers navigating their account or public information. Goal: show the chosen destination without repeated entrance movement or passive loading blur, while retaining status and recovery. Locale: existing Vietnamese with existing English Ask support. Platform: responsive web; native links, history, keyboard focus, ARIA status and reduced motion remain the conventions. No Apple-platform compliance claim or Apple-specific expression is introduced.

Evidence: `NAV-PERF-087-SOURCE.json`, `NAV-PERF-087-task.diff`, `navigation-performance087.spec.ts`, desktop/mobile and inline-loading screenshots. Existing data/auth rules and route-specific Ask reset remain authoritative. No new business claim, field, financial interpretation or translation is introduced. Real screen-reader speech and physical-device testing were not performed; accessibility evidence is the current browser DOM/ARIA and keyboard proxy.

## Inventory

| Location | State | Content/change | User job and behavior |
| --- | --- | --- | --- |
| App profile/security Suspense | Cold module loading | Reuse “Đang mở mục này…” in two local boundaries | Identify a pending destination; rail and active link remain available; role=status/aria-busy=true |
| LoadingState default | Passive read | Existing destination-specific messages remain inline; overlay now opt-in | Understand waiting without a duplicate fullscreen layer |
| LoadingOverlay | Explicit foreground operation | Existing “Đang xử lý…” and slow message preserved; blur removed | Retain operation feedback and recovery controls; ownership/cleanup unchanged |
| Account main/content | Tab selection | Labels and displayed values preserved; main focus now follows query view changes | Keyboard users reach the selected destination; aria-current conveys selection without animation |
| Home/account/Ask entrance | Default/return | Text preserved; decorative translation/fade removed | Read immediately without a repeated bounce |
| Navigation intent | Hover/focus | Labels and hrefs unchanged; only module code preloads | Activate normal web navigation; no private data prefetch |

## State coverage

| State | Result | Evidence |
| --- | --- | --- |
| Default, selected, hover, keyboard focus | PASSED | Five tab switches at 1440 and 390; native navigation and main focus assertions; screenshots |
| Cold/slow loading | PASSED | Held Security module, inline status, rail retained, no global layer after 450ms; inline-loading screenshot |
| Empty | PASSED | Authenticated demo inbox empty state in current desktop/mobile screenshots; no missing data converted into zero |
| Error/offline dependency recovery | PASSED | Failed optional module preload and subsequent navigation/reload recovery regression; unit rejected-loader retry |
| Rapid navigation/cancellation | PASSED | Leave a held module, return to orders, release it and open destination; retained account host |
| Unauthenticated/account boundary | PASSED | Anonymous account and security navigation; existing sign-in paths preserved |
| Pending foreground operations, success | PASSED within unchanged contract | Ownership overlap/failure unit tests; operation copy and withProgress implementation unchanged |
| Confirmation/destructive | NOT_APPLICABLE | No such controls or semantics changed |
| Partial/stale business data | NOT_APPLICABLE to changed data semantics | No data fetching/cache/schema/value mapping change; existing messages retained |

## Data meaning and privacy

No currency, unit, time, aggregation, scope, freshness or business value mapping changes. Auth/user keys and Ask pathname reset remain. Preloading evaluates bounded local code modules; it does not initiate private-data fetching through component hooks. Explicit loading overlays remain supported, including Profile's existing explicit choice; no claim that every existing read in the application now suppresses overlays.

## Mandatory principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Selected tab title appears without waiting for an entrance animation; existing task labels retained |
| Agency | PASSED | Rail remains usable during a held module; leave/reenter and browser history tested; recovery available |
| Responsibility | PASSED | No fabricated progress percentage or performance guarantee; no new private-data cache; Ask reset retained |
| Familiarity | PASSED | Native links/history, selected aria-current, destination-specific status and established SatsunicGo labels |
| Flexibility | PASSED | 390/1440 widths, 200% zoom, keyboard Enter/focus and reduced motion regressions |
| Simplicity | PASSED | One inline waiting message for default passive loads, no repeated panel entrance or blur |
| Craft | PASSED | Failure and slow-load regressions, preserved meaning, current screenshots and source-bound manifest |
| Delight | PASSED | Removed distracting movement without adding playful copy or concealing waiting/errors |

## Platform and pattern checks

Web conventions and current product royal-blue/white design preserved. Writing/labels, feedback, accounts/privacy and keyboard/ARIA patterns: PASSED in current DOM/rendered proxy. Alerts and consequential choices, onboarding, new permissions, RTL translation changes: NOT_APPLICABLE because these flows/texts are unchanged. Motion never carries selection by itself. Existing reduced-motion handling remains for retained purposeful motion.

All scoped gate dimensions (principles, platform fit, meaning/behavior, audience/context, natural tone, brevity, actions/states, data/privacy, accessibility proxy, localization/text expansion, terminology and in-context verification): PASSED. Locale copy is reused verbatim; zoom/wrapping and unchanged labels were reviewed at representative widths. Native AT, real device and production-provider outcomes remain outside this local pass.

Fixed findings: loading threshold test now measures elapsed navigation time; Ask test targets its actual aside rather than a nonexistent section. No owner decision remains for this approved local change.

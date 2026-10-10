# Product Content Review — design v2

Scope: all 42 proposed email designs and browser preview. Locale vi-VN; cross-platform email. Brand and footer verified in SiteChrome.tsx, palette in global.css, origin in public.ts/robots.txt, routes in App.tsx. The browser is an explicitly disclosed proxy; no Apple platform/HIG or mail-client compliance claim.

Inventory: TEMPLATES.vi.json schema 2 contains all subject/preheader/heading/lead/details/hero/closing/CTA strings and required fields; EMAIL-COPY.md renders the complete copy. templates/ holds 42 HTML/text pairs; samples/ holds 42 fictional counterparts. No real customer data.

## Context, meaning and states

All previous sendGuard/channel policies remain mandatory. Confirmed payment, reported transfer, sourcing proposal, partial purchase/delivery, refund request and recorded refund remain separate. The final-cost compact layout must be blocked when refund reservations require additional facts. ZeroAmount is actual integer zero, never a missing-value fallback. PreviousTotal uses the same scope/currency as proposed total.

Default, action-required, confirmed, pending and partial event states are designed. Loading/transport/offline/auth failure is handled by the future backend, not sent as a success email. No unsupported one-click purchase/accept/refund link. Unread grace/ETA event wiring remains conditional. CTA preview goes to real account routes because references are fictional; implementation needs exact authenticated entity mapping.

## Eight principles — design/browser proxy scope

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | One meaningful heading, concise lead, fact table and one primary link per scenario |
| Agency | PASSED | Decisions remain authenticated in app; email links only navigate |
| Responsibility | PASSED | Uncertainty, price scope, partial quantities and refund-bank boundary retained |
| Familiarity | PASSED | Source wordmark, colors, attribution and actual route vocabulary |
| Flexibility | PASSED proxy | 42 mobile 320px cases, 390px price proposal, desktop, HTML/text counterparts; no required image/font |
| Simplicity | PASSED | Values moved from repetitive paragraphs to compact facts; one email shown at a time |
| Craft | PASSED proxy | Template field parity, one H1, HTML title escaping, 42 cases without overflow, working selector |
| Delight | PASSED | Short gratitude at relevant milestones; calm problem/decision copy, no ceremonial filler |

## Dimensions

| Dimension | Draft result | Evidence / limitation |
| --- | --- | --- |
| Platform fit | PASSED proxy | Presentation tables/inline styles, responsive CSS, no email scripts/forms/image dependence |
| Meaning/behavior | PASSED conditional | SendGuard and design schema; backend NOT_IMPLEMENTED |
| Audience/business | PASSED | Vietnamese commerce, support, Membership and document journeys |
| Natural tone/brevity | PASSED | Concrete heading/lead/facts; no repeated formal greeting/sign-off |
| State coverage | PASSED design | State variants and partial/unknown boundaries preserved |
| Data/privacy | PASSED artifact scope | Fictional examples, escaped values, no transcript/PII/bank data; actual recipient guards pending |
| Accessibility | PASSED browser proxy | Semantic headings/links/select, visible status text, mobile wrap; actual AT NOT_RUN |
| Localization | PASSED samples | Vietnamese text, currency kept together, typed dates; real maximum-value stress pending |
| Terminology | PASSED | SatsunicGo consistent, full plan name without repeated prefix |
| In-context | PASSED proxy | MOBILE-AUDIT-v2.json, desktop/320/390 screenshots |

Source-defined links are not proof of live availability: network/tool access unavailable. Gmail/Outlook/Apple Mail, mail dark mode, actual screen reader and provider delivery NOT_RUN. Full application Product Language Gate remains BLOCKED/NOT_IMPLEMENTED.

Design review cycles: (1) user rejected v1 layout; all 42 redesigned; (2) corrected title escaping/raw text parity, structural validation and all-42 mobile check passed. Current design-only decision PASSED with proxy limits. No application deployment or email sent.

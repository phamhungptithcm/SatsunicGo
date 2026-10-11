# Ask panel content review — revised in-panel proposal

**DESIGN ONLY. Product Language Gate: BLOCKED for application completion.**

Reviewer: root, 2026-10-09 UTC. Current proposal HTML `9d893540cdbadf77d66e29946e103772995fcf3c5e0f95c63cb91dd63e728d07`; plan `e2c34e6bb65dfaa0a756a681df59c84431c616a4cd0817c3a99c74e32e1c569c`. Rendered and keyboard evidence: [executor receipt](PANEL-r2-EXECUTOR-r1.json). Independent BA/UX bounded reviews preceded the quantity and header corrections; they are historical observations, not current formal acceptance.

## Scope and platform

Ask conversation, inline catalog review, temporary native editor and same-conversation history inside the existing outer panel. Audience: customers reviewing a selected product and continuing their conversation. VI/EN responsive web, SatsunicGo blue-white-navy design. Native web labels, required fields, keyboard focus and visible consent/recovery controls apply. Apple-only conventions and current Apple HIG compliance are not claimed; this is a web application. Application source, provider behavior and private forms are outside this prototype's execution scope.

## Facts, assumptions and boundaries

- Actual candidate source places Ask outside CRM after auth readiness. The inert background is a public chrome proxy; these pixels do not establish authenticated React integration or a CRM host.
- Catalog selection uses canonical product/variant/quantity, with quantity1–100. Catalog has no Notes field. Custom buying requests have distinct Notes, quotation and payment semantics.
- Illustrative unit490000VND, quantity2, total980000VND and terms1.2 inspect presentation only. Stock, current price, official terms and orderability have not been verified by these pixels.
- Creating a catalog order leads to delivery review before full payment. It does not collect payment at this step. The local confirmation explicitly says not sent/no order created.
- The planned application uses existing immutable preview, owner/version, pending-kind, cancellation and payment guards. Prototype state is not commercial authority.
- Native assistive technology speech/live-region acceptance, real-device keyboard, native browser zoom and actual application form integration are NOT_RUN. Human layout approval is pending.

## Content inventory and changed meaning

The complete current 70-key VI/EN inventory is in [the plan](PANEL-REDESIGN-r2-PLAN.md). Root re-extracted both locale objects from current source: matching key sets, 70each. Source-derived public navigation and sample M/L/XL values are also explicitly inventoried there.

| Location/state | Proposed content and job | Behavior/data evidence |
| --- | --- | --- |
| Header | Brand, earlier messages, VI/EN, close; no permanent task tabs or waypoint chips | Current desktop/header/history pixels; one same-conversation history view |
| Catalog review | Product, variant, required quantity, all-inclusive unit/total, terms and full-payment consequence | Current desktop VI and explicitly reused unchanged desktop EN pixels; current source |
| Decision | One specific Create product order plus quiet Edit; contextual yes/not yet hint | Root UI fresh review/yes sequence; only local not-sent outcome |
| Editor | Native product/colour/size/quantity; Review selection and Back to chat | Current editor pixels and keyboard/native validation; no unsupported catalog Notes |
| Paused composer | Return-to-chat placeholder and explanation during editor/history list | Current editor/history pixels and guards; draft restored on return |
| Read-only history | Earlier messages / Tin nhắn trước; confirmation unavailable here | Root history UI; no historic confirmation actions |
| Recovery | Checking, unknown, details unavailable, stale, not sent stay distinct | Source and root unknown-outcome UI; no simulated durable success |
| Quantity ambiguity | Clarify and preserve current selection | Live signed/decimal/oversized input retained2/980000VND; negated input unchanged |

## State coverage

| State | Applicability and content | Evidence/status |
| --- | --- | --- |
| Default/action | Inline product review, one primary and Edit | PASSED bounded current pixels |
| Loading/pending/disabled | Checking selection/outcome; paused composer explains return | PASSED bounded unknown check and editor/list; other fixture states source-only |
| Empty/no result/true zero | Local empty conversation prompt; unknown total says unavailable rather than0 | NOT_RUN rendered empty; source reviewed. No catalog search result or true-zero claim |
| Success | No durable success simulation; explicit not-sent/no-order | PASSED bounded UI consequence; real business success NOT_RUN |
| Error/recovery | Unknown keeps exact pending action and Check outcome; editor disabled | PASSED bounded unknown UI. Actual reconciliation/provider NOT_RUN |
| Offline/stale/partial | Stale selection asks for fresh review; unavailable loading preserves selection | PASSED bounded stale UI; offline/partial provider paths NOT_RUN |
| Unauthorized/forbidden | Illustrative sign-in remains local; existing source auth/owner fences preserved | NOT_RUN authenticated acceptance; source-only scope review |
| Confirmation/destructive | Contextual unchanged visible receipt; edit+approve cannot silently approve | PASSED bounded fresh-review sequence. Financial dispatch NOT_RUN; no destructive operation added |

## Data semantics and privacy

Money uses VND and locale formatting; total is sample unit × selected quantity. Unknown/unavailable states do not become zero or success. Numeric parsing consumes one complete unsigned safe integer; signed, decimal, out-of-range and ambiguous values clarify. Product selection is illustrative, not a staff quote. History is earlier turns in the same conversation, not a newly invented stored-thread API. Private Profile/address/recipient/Membership forms retain their separate native Save/Cancel and authorized server persistence; the new design proposes no new chat/model/log/browser-storage copies of private field values. Existing Google processing notice is retained without making a new policy or retention claim.

## Mandatory Human Interface principles

Statuses apply to the bounded design evidence. Required missing accessibility/integration evidence prevents the global application gate from passing.

| Principle | Status | Current evidence or limit |
| --- | --- | --- |
| Purpose | PASSED | One continuous purchase conversation, clear next action; desktop/mobile pixels |
| Agency | PASSED | Edit/return, native validation, draft retention, inner-first Escape and no approval from history |
| Responsibility | PASSED | Unit/total/consequence together; explicit not-sent/unknown; sample facts disclosed in this review |
| Familiarity | PASSED | Labeled native fields, ordinary VI/EN language and visible web focus |
| Flexibility | NOT_RUN | Desktop/mobile/short-height and200percent text fixture verified; native AT, actual browser zoom and soft keyboard still unverified |
| Simplicity | PASSED | Single stream and composer; temporary editor/list inside panel; unboxed summary |
| Craft | NOT_RUN | Current header clipping fixed; locale70keys, quantity guards and keyboard verified. Integrated live announcements/private forms not exercised |
| Delight | NOT_RUN | Calm composition and continuity observed; human layout review still pending |

## Pattern and gate checks

| Dimension | Status | Evidence/limit |
| --- | --- | --- |
| Human Interface principles | NOT_RUN | Required Flexibility/Craft/Delight acceptance remains incomplete |
| Target-platform fit | PASSED | Web-native controls and responsive panel; no Apple-specific expression or compliance claim |
| Meaning matches behavior | PASSED | Only prototype-local outcomes claimed; BA fixes retain domain distinctions |
| Audience/business context | PASSED | Source-bound catalog selection and delivery/full-payment meaning |
| Natural respectful tone | PASSED | Short conversational VI/EN, no visible technical/mock/test labels |
| Concise without meaning loss | PASSED | Compact inline summary retains product/variant/money/terms/consequence |
| Actions/state coverage | NOT_RUN | Core bounded states exercised; full authenticated/loading/offline/provider paths absent |
| Data semantics/privacy | PASSED | Explicit sample/current-policy boundaries, no new private copies or commercial writes |
| Accessibility/inclusion | NOT_RUN | Native validation, focus, Escape and text fixture verified; native AT speech and integration missing |
| Localization/text expansion | PASSED | Matching70keys; VI/EN desktop, mobile VI, EN text200 fixture; native zoom not claimed |
| Terminology consistency | PASSED | Catalog/custom quote distinct; earlier messages; specific action wording |
| In-context verification | PASSED | Ten hashed pixels and actual UI/DOM observations scoped in executor receipt |

Writing/labels, feedback level and consequential choices are covered in the inventory/state table. Onboarding is not changed. Account/privacy controls are preserved rather than newly authored. No RTL locale is proposed. Animation is not added in this design slice; actual app motion behavior remains governed by existing checks.

## Decision

Product Language Gate **BLOCKED for successful application handoff**; formal UX QA **NOT_RUN**, because its role requires a READY repository-intelligence gate and the current brief is DEGRADED. Root bounded source/rendered work is permitted by repository fallback policy and is not promoted to formal QA.

Fixed: unsupported Notes; misleading history/quote/private-persistence wording; missing paused-history explanation; negative/decimal quantity substring recognition; concurrent App hash labeling; history header close-icon width. Current bounded executor observations contain no further known defect within their scope. Required next decision is the exact revised panel layout approval. Integration, native AT and real-provider/business evidence remain separate acceptance work after approval.

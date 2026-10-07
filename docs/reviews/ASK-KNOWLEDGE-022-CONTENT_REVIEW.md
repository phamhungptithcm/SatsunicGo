# Product Content Review — ASK-KNOWLEDGE-022

## Scope and context
Surface: Ask generated answers and sources; Vietnamese/English web customers seeking published guidance. Existing components, controls and labels are unchanged. Reviewer: primary agent, client date 2026-10-04. Web platform; no Apple-platform HIG compliance claim. Source/fixture evidence is current but provider/rendered evidence is absent.

## Inventory and state coverage
Only model instructions and evidence selection change: bounded lexical context, partial excerpts, insufficient-evidence explanation in requested language, published-source/support guidance. No fixed user-visible labels added. Default/success answers and empty/partial retrieval are affected. Pending, disabled, error/recovery, offline, unauthorized and confirmation controls are unchanged; verified against task-baseline diff, no new UI content in those states. Stopword-only, invalid, accented/no-accent, English and long-body fixtures pass. Actual model abstention, translated tone and citation rendering remain NOT_RUN.

## Data semantics
Source: published posts, exact original excerpts and existing post IDs. Scan at most 100 records; body capped at 20000 characters; at most eight excerpts, one per source. Missing results mean unknown, not absent. No private-customer corpus ingestion. No generated price/payment or authorization logic changed. Published eligibility does not imply extra approval or automatic expiry. Request-local refresh is not a cross-page snapshot.

## Mandatory principles
| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | NOT_RUN | Relevant-excerpt fixtures pass; usefulness of generated customer answer unverified. |
| Agency | NOT_RUN | Controls preserved; actual response next-step clarity unverified. |
| Responsibility | NOT_RUN | Limits included in prompt; actual uncertainty disclosure unverified. |
| Familiarity | NOT_RUN | Existing source links preserved; generated terminology unverified. |
| Flexibility | NOT_RUN | Vietnamese/no-accent/English retrieval pass; generated bilingual output unverified. |
| Simplicity | NOT_RUN | Bounded context; rendered response clarity unverified. |
| Craft | NOT_RUN | Citation ID/budget tests pass; provider/rendered state evidence absent. |
| Delight | NOT_RUN | Helpful recovery instructed; actual considerate response unverified. |

## Platform fit and pattern checks
Web interaction/brand/accessible controls unchanged. No Apple-only patterns/assets introduced. Content and feedback pattern verification BLOCKED pending actual output; permission/privacy source review PASSED; consequential choices unchanged. Keyboard/assistive technology, narrow/wide render, localization/text expansion for changed generated responses NOT_RUN. No screenshot or browser success claimed.

## Gate results and decision
Meaning/data semantics/privacy source review PASSED; natural tone, brevity, state wording, accessibility/localization of generated output and all eight principles NOT_RUN in context. Product Language Gate BLOCKED. Required next evidence: current-candidate provider answers for matched, empty and partial corpus cases in Vietnamese/English, rendered citations and assistive-technology behavior. No string-file-only pass asserted.

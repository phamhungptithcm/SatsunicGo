# Product content review — recipient autocomplete and CRM projection

Decision: **BLOCKED**. Actual desktop checkout and CRM entry are verified. Authenticated CRM recipient rendering, 320/390 checkout/overview now pass; candidate CRM recipient, text-size and spoken assistive-technology acceptance remain incomplete.

## Scope and context

Audience: Vietnamese customers choosing a destination and authorized staff fulfilling paid orders. Platform: web, existing SatsunicGo blue/white design and semantic HTML. Apple-platform compliance is not claimed; Apple-only expression not applicable. Reviewer: current source/evidence review2026-10-09; actual browser operator: human-authorized integration chat. Fresh human authorization later allowed this chat to test its own IAB320/390 checkout surface.

Changes: searchable current directory; initial paid settlement supplies existing CRM output; existing label text now associated inside reusable control. No new CRM editor. Customer confirms canonical destination/amount before proceeding.

## Content inventory and state coverage

| Surface/state | Content / behavior | Current evidence |
| --- | --- | --- |
| Province default | “Tỉnh / thành phố”, decorative *, “Tìm tỉnh / thành phố” | Associated native required input; unchanged audit3/3; actual desktop selection. |
| Commune disabled/default | “Phường / xã”, decorative *, “Chọn tỉnh / thành phố trước” / “Tìm phường / xã” | Disabled before province; actual parent change clears commune. |
| Search/results | Exact canonical names/codes, accent-insensitive | Actual ho chi minh, sai gon,01; Arrow/Enter selection; Escape focus. |
| No result/live status | “Không tìm thấy. Thử tên khác hoặc gõ không dấu.”; count/keyboard instruction; “Không tìm thấy địa danh phù hợp.” | Actual message/live-region DOM; screen-reader announcement NOT_RUN. |
| Invalid/recovery | Existing per-field errors and first-invalid focus; typed text never supplies a valid code | Actual empty submit; strict-code source/unit evidence. |
| Overview/confirmation | Canonical destination and amount; acknowledgement required and reset by edits | Actual overview/edit-return flow. No real/provider browser payment. |
| Authorized CRM details | Existing “Người nhận:” then name/phone/address | Actual HTTP confirms canonical3fields; rendered content BLOCKED by MFA. |
| Buyer/denied roles | Buyer recipient null; unsupported roles denied | Imported-handler/HTTP cases; actual customer CRM denial. |
| Staff MFA pending/error | Existing setup; “Chưa tạo được thiết lập. Thử lại.” | Actual owned warehouse screenshot; no recipient content beyond fence. |
| Pending/unknown/cancelled | No projection/allocation | Emulator regressions; no fabricated paid state. |
| Paid replay/balance | Frozen address; later warehouse data preserved | Replay/balance/collision regressions. |
| Historical missing recipient | Remains absent | Source; backfill outside scope. |
| Loading/disabled/offline/stale/partial/IME | Existing safe disabled/loading/setup-recovery behavior; no invented choice | Source/unit evidence only; actual browser paths NOT_RUN. |
| Seller/legacy address | Separate seller identity and public Profile/Ask contracts | Inventoried and unchanged. |

## Data semantics

Truth: official dated directory → parent-bound codes → server canonical names → confirmed frozen checkout → transactional3field projection. Missing/null/unauthorized is not an empty successful destination. Address order: street, commune, province, Việt Nam. No new metric/unit/timezone is introduced. Notes, financial details, email and full checkout are excluded; existing staff roles/account locks remain authoritative.

## Mandatory principles

| Principle | Status | Evidence / limit |
| --- | --- | --- |
| Purpose | PASSED | Customer finds destination by name/code; staff callable receives confirmed destination. |
| Agency | PASSED | Explicit code selection; overview confirmation required and reset after editing. |
| Responsibility | PASSED | Parent validation/canonicalization, atomic allocation, privacy and enforced MFA verified. |
| Familiarity | PASSED | Vietnamese labels and canonical address order; actual name/code interaction. |
| Flexibility | NOT_RUN | Desktop and320/390 keyboard/long checkout address verified; text-size/spoken AT and CRM long-address wrapping incomplete. |
| Simplicity | PASSED | Two existing fields and same3field CRM output; no duplicate form/section. |
| Craft | NOT_RUN | Desktop labels/errors/overview inspected; CRM responsive rendering incomplete. |
| Delight | NOT_RUN | Search/confirmation task observed; full staff address-reading task not reached. |

## Platform, pattern and gate results

| Dimension | Status | Rationale |
| --- | --- | --- |
| Target-platform fit | PASSED within desktop scope | Web combobox/listbox, native labels/required and local popup scroll; brand preserved. |
| Meaning/audience/tone | PASSED | Exact directory choice and confirmed destination; factual respectful recovery. |
| Brevity/terminology | PASSED | Existing compact Vietnamese labels and messages. |
| Action/confirmation | PASSED within checks | Keyboard, invalid focus, overview/acknowledgement; no automatic payment. |
| Data/privacy | PASSED | Transaction/HTTP roles, actual customer denial and staff MFA fence. |
| Accessibility/localization expansion | NOT_RUN | Labels/keyboard verified; actual AT, zoom/text-size, narrow and long CRM content missing. |
| Loading/offline/partial/IME actual UI | NOT_RUN | Source/unit evidence only. |
| All principles/complete in-context verification | NOT_RUN | Three required principles and CRM rendering incomplete. |

## Evidence and decision

Actual desktop1890×965. CONTINUATION-UI-RESULTS.json binds unchanged33file SOURCE-MANIFEST.json. Twelve checks passed; copied screenshots/hashes in CONTINUATION-FRESHNESS.json. Requested320/390 resize left actual1890px DOM; locked Mac prevented native responsive tooling. No narrow result counted. Assistive technology NOT_RUN.

Actual CRM setup failed safely because Auth emulator lacks TOTP; screenshot proves fence/error, not recipient rendering. [Firebase official SDK documentation](https://github.com/firebase/firebase-js-sdk/blob/main/packages/auth/README.md#integration-testing-with-the-production-backend) confirms the limit. Required environment: separately authorized TOTP-capable test backend and accessible browser/AT session. Local-only authority does not authorize live Auth or MFA bypass. Full gate remains BLOCKED under .ai/skills-src/write-product-content/SKILL.md and product-content profile.

## Current own mobile evidence — cycle9

CONTINUATION-MOBILE-UI-RESULTS.json records actual320/390 geometry, unaccented/code search, parent clear, invalid free text, pointer/Enter/Tab,126-item popup End scroll (window506unchanged,popup5310), and320long canonical overview/edit preservation without horizontal overflow. Screenshots autocomplete-390.png/autocomplete-320.png/review-320.png. Earlier NOT_RUN narrow paragraphs above describe historical cycle7; this section supersedes their current narrow status. Full custom-combobox spoken AT/IME/offline/text-size and authenticated candidate CRM recipient evidence remain unavailable; full gate remains BLOCKED.

Human approved production read-only use; own login failed and integration owner observed existing legitimate MFA/dashboard only. Candidate is not deployed. No production writes, PII persistence or auth bypass. See CONTINUATION-PRODUCTION-READONLY-RESULTS.json.

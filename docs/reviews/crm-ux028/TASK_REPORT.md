# CRM-UX028 current task report

Status: IN_PROGRESS; newest final review BLOCKED; production NOT_READY. The entire CRM request is not complete.

Completed: audited all 19 navigation screens plus customer detail, captured current fixture screenshots, reproduced mobile detail appearing 6435px below selection, verified purchase prerequisites against domain source, coordinated exclusive file ownership with active chats. Human approval and Workbench lease are verified in docs/approvals/SATSUNICGO-CRM-UX-028.md.

Implemented in owned scope: responsive list/detail navigation, heading focus, Back with list position and draft preservation, desktop selection prompt, compact card spacing, reduced-motion-aware transition, domain-derived purchase prerequisite explanation and disabled action. Server/domain financial authority is unchanged. Root integrated the isolated stylesheet into Workspace.

Verification on FROZEN_SOURCE.json: frontend TypeScript compilation PASS; targeted ESLint PASS; 11 tests across three focused unit suites PASS (4 new prerequisite tests and 7 existing Workbench tests). Browser scenarios at 390, 768 and 1440px PASS in root serial round1 (BROWSER_ROUND1.json); they use an explicitly mocked 30-order list projection and do not certify financial mutations. Build, full integration, screen reader, zoom, complete error/recovery coverage and production deployment NOT_RUN by this task.

Review cycles:
1. All-screen audit NEEDS_CHANGES: UX028-01 through UX028-10; factual inventory from auxiliary reviewer, no independent passing review.
2. Scoped implementation review found oversized detail scroll and repeated-card focus risks. Fixed mobile block-start scrolling and selection revision. Initial new test fixture lacked catalogSnapshot; corrected fixture to match the domain contract. Re-ran focused checks successfully.
3. Current source review checked approved scope, fail-closed prerequisites, form preservation and unchanged command authority. Scoped three-width browser evidence now PASS, all four frozen hashes reverified unchanged. Broad product-content and all-screen evidence remain pending. Valid runtime review receipt is BLOCKED; runtime report is retained. No successful final review is claimed.

Remaining: complete in-context product-content review for remaining required states; CRM owner's remaining screen fixes with per-file leases; all-screen re-review; integrated candidate freeze and release gates. Current observed listWork loading was reported to root; cause is unconfirmed. Root is addressing shared integration and callable deadlines. Do not restart competing services or seed fixtures.

Intelligence: DEGRADED after shared source drift, with bounded indexed/source/domain evidence. Shared HEAD at audit: 3bd0d093255963a2cbf66ddd80d27456da7076e0. Only owned file hashes are frozen; no whole-release freeze claimed. No production/provider/money/deploy operations performed. Token usage unavailable; actual cost unavailable. Memory candidates: None.

4. Native verification: CRM028 three-width scenarios PASS (1.882s, 1.947s, 1.784s; no retries/errors). Full root batch had 8 PASS and 3 catalog failures outside this scoped fix. Saved receipt and after-list screenshots. Whole-CRM review remains BLOCKED; remaining file leases delayed until root final native freeze releases.

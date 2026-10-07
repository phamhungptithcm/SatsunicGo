# CRM-ENTRY-097 v1 — CRM entry and sign-in recovery

Status: PLAN_READY / AWAITING_HUMAN_APPROVAL. This is a new scope; OPERATIONS095 approval does not cover authentication changes.

Evidence: App.tsx Staff currently combines anonymous/denied/read failure inside generic page/empty markup. Staff uses onSnapshot staffAccess + staffRoles; active/locked/roles validation remains authoritative. Google login catches MFA into observable resolver with root LoginChallenge; other errors become generic, popup-blocked redirects. App.signIn uses overlay progress, producing floating waiting UI like screenshot. getRedirectResult currently suppresses non-MFA failures. Missing MFA is not established as current root cause. Local runtime recovery was owned by CRM095; do not restart services. CodeGraph/CocoIndex query evidence verified against source; gate DEGRADED due stale metadata and local CocoIndex log permission failure. Dirty App/auth/shared WIP preserved.

Design: narrow 440px white entry card on soft gray, SatsunicGo wordmark above; title Đăng nhập CRM, concise staff-account instruction, single full-width Google action, quiet customer account/site links. No duplicate headings, oversized empty panel, decorative metrics or fake workspace preview. Loading/read failures/denied access retain same frame. Inline task-specific pending message, no floating generic login overlay on CRM. Mobile16px margins,44px actions,keyboard focus,320/390px/reflow.

State model:
- Anonymous: Đăng nhập CRM; Dùng tài khoản Google được cấp quyền nhân viên; primary Tiếp tục với Google.
- Popup pending: Đang mở đăng nhập Google…; duplicate attempts blocked; no claim login finished.
- MFA required: keep actual Firebase challenge, six-digit input on same route; wrong/expired code retry/cancel and focus retained. No MFA enrollment changes.
- Auth restored/permission read: Đang kiểm tra quyền CRM…; do not show denied before response.
- Denied: Tài khoản chưa có quyền CRM; explain owner grants access, offer account security / switch-account path without granting roles or exposing internal doc details.
- Permission read failure: Chưa kiểm tra được quyền CRM; retry resubscribes; never show cached authorized workspace.
- Google popup cancelled/network failure/unsupported MFA: safe code-based feedback with retry as appropriate. Redirect non-MFA failures must reach user-visible state; do not silently swallow. Provider configuration changes require separate delta approval.

Files:
1. src/features/auth/CrmAccessScreen.tsx + crm-access-screen.css new: reusable presentation/state frame, native actions and accessible status/error.
2. src/app/App.tsx: only Staff gate rendering/retry state and CRM signIn progress/error wiring; preserve authReady, subscriptions cleanup, route target, Workspace keyed roles and existing LOGIN093 WIP. Keep public account login behavior unchanged.
3. src/shared/firebase.ts: preserve Firebase error codes for safe UI mapping; surface redirect result failure through observable auth event helper if needed. No OAuth/provider settings or credentials accessed.
4. src/features/auth/auth-feedback.ts new if needed: pure typed error mapping/observable redirect outcome; no logs/storage of tokens,OTP,account identifiers.
5. LoginChallenge.tsx/login-challenge.css only when a reproduced state/focus bug requires bounded correction; mfa.ts only lifecycle fixes supported by failing test. Keep Firebase resolveSignIn/TOTP verification intact.
6. tests/unit/crm-entry097.test.ts and tests/browser/crm-entry097.spec.ts: synthetic signed-out/pending/MFA/error/denied/read-retry/stale events + focus/mobile; existing login093 tests rerun. No real OTP captured and no business writes/seed changes.
7. docs/reviews/CRM-ENTRY-097/: product-content inventory, 8 principles, candidate hashes, quality/final review cycles/task report.

Risk MEDIUM/HIGH authentication-facing UI; no security control reductions. New UX must not turn enrollment into successful sign-in, show unauthorized private data, clear a replacement challenge from stale response, or repeat Google popup. Existing MFA/AppCheck/server permissions/recent-auth/financial controls unchanged. No new dependency, deployment, runtime restart or cloud auth changes. Rollback scoped hunks only. Coordinate App/firebase/LoginChallenge ownership before editing.

Validation: focused unit tests, existing MFA lifecycle and dialog tests, compiler/scoped lint; browser shared5207 states at desktop/320/390 and keyboard/reflow/reduced motion. Live Google and actual user MFA acceptance remain NOT_TESTED unless user completes privately. Diagnose provider failures by sanitized error code only. Mandatory write-product-content and final-implementation-review; no successful handoff with missing newest review. Current implementation/test/review NOT_RUN. Token/cost Unavailable; memory candidates None.

Approval requested for CRM-ENTRY-097 v1 frontend/auth UX scope above; no removal of MFA and no provider/IAM/deployment authorization.

Implementation status: IMPLEMENTED_LOCAL (user approval in docs/approvals/SATSUNICGO-CRM-ENTRY-097.md). Final approved copy supersedes draft wording above: Không gian làm việc, upper-right CRM badge, icon/title same row. Current review/evidence: docs/reviews/CRM-ENTRY-097/TASK_REPORT.md. Live Google acceptance NOT_TESTED; production NOT_READY.

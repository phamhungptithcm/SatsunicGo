# SECURITY076 v1 — security page QR and account navigation

Status: APPROVED. Direct human approval: latest user message “Approved”, 2026-10-06. User requests clearer security enrollment layout, QR code and restored Settings sidebar. OWNER075 production bootstrap remains approved independently; this UI delta does not grant rights or certify deployment.

## Current evidence and intelligence

Intelligence DEGRADED: stale CodeGraph/CocoIndex, semantic health unavailable; bounded source reads used. Shared App/account/style WIP preserved. Screenshot contains a real enrollment key/code; neither is copied into files, QR fixtures, logs or tests.

Verified: App.tsx renders /account/security directly as Security. Account's sidebar is local inline markup inside the order/account component, so Security and Profile do not inherit it. Security.tsx returns a generic page with unstyled buttons and separate enrollment/verification panels. It exposes secretKey inline and has no QR. SDK provides TotpSecret.generateQrCodeUrl; qrcode and its types are already installed. API400 MFA enum fix and productionTOTP setup belong to OWNER075, not this UI delta.

Current cloud targeted readback: designated Google account now exists, email verified, enabled and Google linked; no MFA enrollment exists. Therefore user login is complete but OWNER075 enrollment and role grant remain incomplete. Error in screenshot establishes failed enrollment, not its precise cause. Never mark MFA enabled from local generated secret, reauthentication message or entered code.

## Concrete layout and implementation

White/light-gray, navy111c35 and royal-blue163cff; compact web layout aligned with existing account.css. Retain existing routes and labels. Desktop: existing196px account rail, content max-width around840px,32px security heading,16px card radius and consistent24px gaps. Mobile: rail follows existing account navigation treatment, cards stack, no horizontal overflow.

1. `src/features/account/AccountRail.tsx` (new): extract the existing sidebar markup without changing destinations, query-view semantics or order filters. Explicit active selection for security/profile and existing order/shipment/notification states; accessible nav and aria-current. No broader routing or account data refactor.
2. `src/app/App.tsx`: replace only the existing sidebar block with AccountRail; preserve other chats' tracking/filter edits. Wrap /account/security and /account/profile in the existing accountWorkspace/accountPage layout with active rail. Keep route keys/user identity reset semantics.
3. `src/features/auth/Security.tsx`: add status summary and one enrollment card. Step1 shows a locally generated QR from generateQrCodeUrl with issuerSatsunicGo; offer a collapsed manual-key alternative. Step2 contains labeled six-digit input, a prominent confirm button and secondary cancel. Use existing Firebase enrollment/challenge/reauthentication APIs. A completed enrollment is acknowledged only after Firebase success and refreshed enrollment state. Clear conflicting previous status/error on a new attempt. Keep recoverable wrong-code input and show truthful retry guidance; do not invent an expiry diagnosis. Guard async generation/enrollment with user/attempt epochs so cancelled/switched sessions cannot restore a previous secret or success state.
4. `src/styles/security.css` (new): scoped styling, button roles, QR white quiet zone, compact typography, mobile stacking, keyboard focus and reduced-motion behavior. Avoid global styles or unrelated account rules.
5. `tests/unit/security-enrollment076.test.ts` and `tests/browser/security-enrollment076.spec.ts` (new): secret/session lifecycle and rendered QR/manual fallback/sidebar/retry checks with synthetic values only. Reuse isolated local test patterns; no production enrollments or real OTP fixtures.
6. `docs/reviews/SECURITY-076*`: string/state inventory, product-content review, source manifest, test results, review cycles and completion report. Any documentation preview is explicitly static/synthetic and grants no authentication capability.

## Security, data and boundaries

High risk because UI handles authentication material. No auth enforcement, MFA interval, OWNER condition, Firestore Rules, server permissions, provider holds or dependency changes. No unenrollment flow in scope. Generate QR entirely locally using existing qrcode; no remote image/QR service, analytics, logging, URL parameters, storage or screenshots containing real secrets. Manual key remains hidden until explicitly expanded; clear key/QR/code on cancellation, user switch, unmount and successful enrollment. Clipboard copying, if implemented, must be explicit and report failures; no automatic clipboard clearing/writes or secret capture.

Existing localhost preview connects to productionAuth; use only synthetic isolated fixtures for development screenshots/tests. Preserve that human enrollment session and preview server; do not rebuild/reload it while a person may be entering credentials. Show updated preview only after implementation verification and a safe handoff.

## Strings and states to verify

Preserve Bảo mật tài khoản/sidebar terms. Proposed enrollment actions: Thêm ứng dụng xác thực, Quét mã QR, Không quét được mã?, Khóa thiết lập, Mã xác thực, Bật xác thực hai bước, Hủy thiết lập. Challenge confirmation remains Xác nhận mã rather than claiming to enable a new factor. Status: Chưa bật/Đã bật only from successfully loaded enrollment state; loading/error state must not become zero or success. Explain that QR/key is private, without displaying backend setup details.

Cover unauthenticated, pending, zero/one/multiple factors, generating QR, QR failure with manual alternative, wrong code, expired/recent-login failure when provider confirms it, offline, cancel, user change, enrollment success and existing MFA challenge. Existing labels remain associated with inputs, statuses use role=status, errors role=alert/aria-describedby, QR has descriptive alt rather than embedded secret text.

## Validation and completion gates

TypeScript, scoped ESLint, Node22 unit checks; isolated browser390/768/1440, keyboard/focus,200percent zoom, reduced motion, QR decoding against a synthetic expectedURI, cancellation/stale async response, fresh-login/retry/success and sidebar destinations/selection. No tests or screenshots using attached secret/code. Product Language Gate applies all eight principles: Purpose(clear enrollment), Agency(cancel/manual), Responsibility(secret privacy/true status), Familiarity(existing rail/buttons), Flexibility(QR/manual/mobile), Simplicity(two steps), Craft(complete states/focus), Delight(calm success without overclaim).

Complete current in-context product-content evidence and final review→fix→verify→review; plan acceptance alone is not an implementation PASS. Rollback is scoped UI/source revert, without altering production factors, accounts, roles or financial data. Actual production release remains separately gated.

Approval requested: this exact UI/navigation/security-state delta and proportional tests. No protected application files changed before approval.

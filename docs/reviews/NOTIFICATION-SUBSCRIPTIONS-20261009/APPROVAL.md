# Implementation Approval Record

Plan ID/version: NOTIFICATION-SUBSCRIPTIONS-20261009 r5
Repository intelligence gate status: DEGRADED — CodeGraph then CocoIndex queried; concurrent checkout/email work means global freshness is not certified. Critical paths re-read from current source.
Indexed analysis reviewed: docs/plans/NOTIFICATION-SUBSCRIPTIONS-20261009.md
Approval status: APPROVED
Approver: repository owner in current chat
Approval timestamp or task reference: 2026-10-09, user reply "apporved" following r5 source-derived preview.
Approved scope: Local implementation of the two existing-checkout choices, profile third notification tab, independent preferences, server consent/confirmation/opt-out and email integration in the reviewed plan. User subsequently confirmed "Chưa có, chuẩn bị tích hợp trước" for SMS: prepare provider boundary without selecting/provisioning a paid provider.
Approved paths:
- `src/features/cart/purchase-checkout.tsx`
- `src/features/cart/purchase-checkout.css`
- `src/features/profile/Profile.tsx`
- `src/features/profile/profile.css`
- `src/features/notifications/**`
- `packages/domain/notification-preferences.ts`
- `functions/src/notification-*.ts`
- `functions/src/subscription-*.ts`
- `functions/src/customer-email-job.ts`
- `functions/src/email.ts`
- `functions/src/index.ts`
- `tests/**/notification-*.ts`
- `tests/unit/customer-emails.test.ts`
- `docs/**`
Required constraints: Preserve concurrent financial/checkout/email work, source design and unrelated WIP. No secret access, paid provisioning, marketing dispatch, production sending, release-hold weakening, deployment, runtime restarts or reseeds. No automatic legacy consent migration; required financial/security messages retained. Missing providers must stay unavailable.
Explicit exclusions: Financial core edits, price/payment/provider flags, production activation, generated assets and dependency changes.

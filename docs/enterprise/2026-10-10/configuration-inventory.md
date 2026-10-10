# Configuration Reference Inventory

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Static name references only

Chỉ tên được tham chiếu tĩnh, không đọc .env/secret values. Không đủ để kết luận biến required, active hoặc configured. Dynamic lookups có thể không nằm trong inventory này.

Toàn bộ vị trí tham chiếu nằm trong [CONFIGURATION-REFERENCES.json](review/CONFIGURATION-REFERENCES.json). Bảng in giữ tối đa năm tệp đầu mỗi tên.

| Tên | Tệp tham chiếu | Tổng số tệp |
| --- | --- | --- |
| `DEV` | `src/app/App.tsx`, `src/features/ask/Ask.tsx`, `src/features/ask/CatalogSearch.tsx`, `src/features/auth/EmulatorLogin.tsx`, `src/shared/firebase.ts` | 5 |
| `EMAIL_TEST_ENABLED` | `functions/src/email/self-test.ts` | 1 |
| `EMAIL_TEST_RECIPIENT` | `functions/src/email/self-test.ts` | 1 |
| `FIREBASE_AUTH_EMULATOR_HOST` | `functions/src/ai/ask-production.ts` | 1 |
| `FIREBASE_CONFIG` | `functions/src/purchase-environment.ts` | 1 |
| `FIRESTORE_EMULATOR_HOST` | `functions/src/ai/ask-production.ts`, `functions/src/email/dispatch.ts`, `functions/src/purchase-environment.ts` | 3 |
| `FUNCTIONS_EMULATOR` | `functions/src/ai/approved-knowledge.ts`, `functions/src/ai/ask-production.ts`, `functions/src/ai/ask-workflow.ts`, `functions/src/ai/ask.ts`, `functions/src/ai/customer-save.ts` … | 50 |
| `GCLOUD_PROJECT` | `functions/src/ai/ask-pilot.ts`, `functions/src/ai/ask-production.ts`, `functions/src/ai/ask-workflow.ts`, `functions/src/ai/ask.ts`, `functions/src/ai/research-live.ts` … | 11 |
| `GOOGLE_CLOUD_PROJECT` | `functions/src/ai/ask-production.ts`, `functions/src/email/self-test.ts`, `functions/src/payments/sepay-sandbox.ts` | 3 |
| `GUEST_TRACKING_QUOTA_KEY` | `functions/src/public-order-tracking.ts` | 1 |
| `NODE_OPTIONS` | `functions/src/ai/telemetry-policy.ts` | 1 |
| `OTEL_METRICS_EXPORTER` | `functions/src/ai/telemetry-policy.ts` | 1 |
| `OTEL_PROPAGATORS` | `functions/src/ai/telemetry-policy.ts` | 1 |
| `PAYOS_API_KEY` | `functions/src/payments/payos.ts` | 1 |
| `PAYOS_CHECKSUM_KEY` | `functions/src/payments/payos.ts` | 1 |
| `PAYOS_CLIENT_ID` | `functions/src/payments/payos.ts` | 1 |
| `PUBLIC_ORIGIN` | `functions/src/public.ts` | 1 |
| `PURCHASE_SEPAY_SANDBOX_ENABLED` | `functions/src/payments/sepay-sandbox.ts` | 1 |
| `SEPAY_SANDBOX_IPN_SECRET_KEY` | `functions/src/payments/sepay-sandbox.ts` | 1 |
| `SEPAY_SANDBOX_SECRET_KEY` | `functions/src/payments/sepay-sandbox.ts` | 1 |
| `SFTP_PASSWORD` | `functions/src/email.ts`, `functions/src/email/self-test.ts`, `functions/src/subscription-email.ts` | 3 |
| `VITE_ASK_COMMERCE_ENABLED` | `src/features/ask/Ask.tsx` | 1 |
| `VITE_ASK_FEEDBACK_ENABLED` | `src/features/ask/Ask.tsx` | 1 |
| `VITE_ASK_RESEARCH_ENABLED` | `src/features/ask/Ask.tsx`, `src/features/ask/CatalogSearch.tsx` | 2 |
| `VITE_AUTH_EMULATOR_PORT` | `src/shared/firebase.ts` | 1 |
| `VITE_BETA_RELEASE` | `src/shared/firebase.ts` | 1 |
| `VITE_FIREBASE_API_KEY` | `src/shared/firebase.ts` | 1 |
| `VITE_FIREBASE_APP_ID` | `src/shared/firebase.ts` | 1 |
| `VITE_FIREBASE_AUTH_DOMAIN` | `src/shared/firebase.ts` | 1 |
| `VITE_FIREBASE_PROJECT_ID` | `src/shared/firebase.ts` | 1 |
| `VITE_FIREBASE_REGION` | `src/shared/firebase.ts` | 1 |
| `VITE_FIREBASE_STORAGE_BUCKET` | `src/shared/firebase.ts` | 1 |
| `VITE_FIRESTORE_EMULATOR_PORT` | `src/shared/firebase.ts` | 1 |
| `VITE_FUNCTIONS_EMULATOR_PORT` | `src/features/cart/purchase-thumbnail.tsx`, `src/shared/firebase.ts` | 2 |
| `VITE_GOOGLE_CLIENT_ID` | `src/features/auth/OneTap.tsx` | 1 |
| `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` | `src/shared/firebase.ts` | 1 |
| `VITE_USE_EMULATORS` | `src/features/auth/OneTap.tsx`, `src/shared/firebase.ts` | 2 |

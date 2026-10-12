# Checkout Ask overlay repair

Plan ID/version: CHECKOUT-ASK-OVERLAY-20261012-v1
Authority: direct human instruction in this task: “Tiếp tục monitor release production, kiểm tra UI thanh toán mới trên desktop/mobile, fix hết bug phát hiện và xử lý nốt AI/sandbox.” Prior human release instruction authorizes scoped fixes/review/release without repeated approval. This is a bounded presentation bug in the requested payment UI, not a material backend or security expansion.

Observed: nativev0.15.8/source50c3c34, viewport1512x772/scrollY0. Payment check button rect429,620.38,654,44; elementFromPoint(center) is Ask “Tiếp tục hội thoại”, not payment action. Screenshot primary PAYMENT-PRODUCTION-DESKTOP.png. Mobile390 has no horizontal overflow but composer consumes space.

Intelligence: CodeGraph PurchasePayment/App route callers and CocoIndex release/Ask context available on primary. Isolated merged source directly verified; structural index reflects primary WIP, so candidate impact confidence DEGRADED with bounded source reads. React19/TypeScript/Vite8, existing Ask startCollapsed prop. App currently collapses Ask on cart/account/request/posts but omits checkout; Ask useState(startCollapsed) and launcher preserve loaded conversation. No new component/module or dependencies required.

Smallest change: src/app/App.tsx Ask startCollapsed additionally covers exact /checkout, /checkout/ descendants, and existing /products/:slug/checkout route (including trailing slash). Preserve other routes and existing collapse rules. Do not hide Ask or change history, provider calls, checkout IDs, pricing, auth/AppCheck/MFA, database, CI, infrastructure or financial proof.

Tests: one source-linked executable route-policy regression reads the actual JSX prop via TypeScript AST and executes that expression against concrete purchase, cart/account/request/posts and public/boundary routes. It does not duplicate the proposed expression. Existing focused payment component15 and purchase/SePay/domain157 tests, typecheck/lint, real current Ask launcher interaction proxy on desktop/mobile, independent review then exact CI/native artifact and hosted acceptance. No paid AI calls: owner5000 reached. Existing synthetic payment only, no new payment or replay.

Risk/tradeoff: checkout starts with a smaller existing Ask launcher; support remains one click away, history retained. Native overlay/focus behavior unchanged. Rollback previous immutable artifact. No migration.

## Human toast consistency delta
Direct human steering: “lỗi đã hiển thị ở toast không cần hiện duplicate ở đây consistency”. Scope additionally purchase-payment.tsx read() and focused component test: use existing callService inline-feedback option for the three status/reconcile reads, then publish exactly one safe existing global toast on current-generation failure, never a second inline error. Existing notify/ToastHost remains authoritative; offline preflight errors must also produce this one toast. Preserve owned checkout, unknown warning/retry; when initial read fails stop the loading indicator and retain retry. Do not change financial-review status or paid receipt behavior. Add offline/timeout/second-status failure, success/no-toast, single-flight and stale-account rejection tests. No shared Firebase API change.

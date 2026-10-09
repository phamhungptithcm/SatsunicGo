# Repository intelligence brief — analytics dashboard v1

Base: `53d59bd88fa7da9d1243692336ecd09b6540ea31`; shared dirty worktree.
Gate: DEGRADED after one refresh. CodeGraph current/health passed; CocoIndex stale/health failed. Source and bounded searches verify claims; optional index results include generated output and do not prove exhaustive coverage.

Entrypoints: App public shell/product routes; CatalogCard/ProductsCatalog/ProductDetails; Ask accepted-turn/local/API routing; Checkout/cart/Commerce order outcomes; CRM Dashboard → operationalDashboard; canonical orders/financialEntries; separate proposed analytics ingestion/workers/read model.

Verified constraints: current overview has sampled overlapping queue counts only; market US/JP/KR; financial entries lack consistent payment-purpose labels; local Ask replies bypass provider API; default rules deny unlisted collections; shared frontend listener 5207 already running; `/crm` browser read shows staff sign-in and cannot certify authenticated dashboard.

Dirty touched-boundary files at discovery: functions/src/index.ts; src/features/ask/Ask.tsx; CatalogSearch.tsx; Commerce.tsx. Other concurrent Ask/workspace/domain/test changes exist. Recheck current revisions and preserve them. No agent delegation, source edits, restart or data reset occurred.

Quality profiles selected for implementation: universal, typescript-javascript, frontend-html-css, web-app, api, database, concurrency, memory/resource lifecycle, product-content. HIGH privacy/financial-interpretation boundaries, MEDIUM background jobs/query costs. No production throughput, analytics policy or linked issue verified.

Evidence pointers: plan `docs/plans/SATSUNICGO-ANALYTICS-DASHBOARD-20261008.md`; source packages/domain/index.ts, functions/src/crm.ts, payments/payos.ts, finance-review.ts, workspace.ts, jobs.ts, catalog-checkout.ts, cart.ts, ai/ask.ts; frontend Ask.tsx, CatalogCard.tsx, ProductsCatalog.tsx, ProductDetail.tsx, PrivacyPage.tsx, App.tsx; tests/unit/dashboard094.test.ts and tests/browser/dashboard094.spec.ts.

Firebase primary references used to verify background design assumptions:
- https://firebase.google.com/docs/functions/firestore-events — triggers may duplicate and arrive out of order.
- https://firebase.google.com/docs/firestore/solutions/counters — shared counter contention and sharding tradeoffs.
- https://firebase.google.com/docs/firestore/query-data/aggregation-queries — aggregation semantics and missing/non-numeric field behavior.

Unknowns are bounded in the plan: consented tracking coverage, source-attribution losses, production job/IAM activation, exact retention approval, scale and financial-source history. Confidence: high for inspected source boundaries, medium for proposed architecture until implementation/integration tests.

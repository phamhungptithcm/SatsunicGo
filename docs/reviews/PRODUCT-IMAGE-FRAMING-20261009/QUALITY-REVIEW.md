# Scoped code quality review

Reviewed 2026-10-09 against SOURCE-MANIFEST.json and IMAGE-ONLY.patch. Recommendation: **APPROVED for integration of this image scope**; production release is NOT_READY until the integration/release owner validates the complete candidate.

## Repository evidence and stack

Initial intelligence check was READY. Final check is **DEGRADED** because both global indexes report Stale during concurrent work, although health checks pass. CodeGraph was queried before CocoIndex; both return the current changed image helper, handler and consumers. CodeGraph also surfaces cached output/ duplicates. Critical conclusions were verified against live source, compiler and executed tests; this is bounded image-scope coverage, not a clean repository-wide gate.

React 19, TypeScript 6, Vite 8, Vitest, Firebase Auth/Firestore/Storage/Functions, Sharp 0.35. Functions target Node 22; local command runtime was Node 25.9. A separate Node 22 runtime compatibility run is NOT_RUN. No dependency change introduced by this task.

Profiles: universal, typescript-javascript, frontend-html-css, web-app, visual-design, product-content, api, memory, concurrency and seo-geo preservation review. No animation introduced. Database schema/migration and infrastructure profiles do not require implementation changes.

## Architecture and execution paths

- CatalogCard -> existing public media responsive source delivery; only scoped CSS changes.
- ProductDetails -> original public media; existing mobile/desktop frame proportions retained.
- CartPage and purchase checkout -> existing PurchaseThumbnail; only image sizing and onLoad hidden reset change.
- purchaseDraftImage -> new small pure purchaseImageThumbnail helper; owner/locked-account checks, post-download identity recheck, transactions, upload storage paths and response shape retained.
- Ask -> existing useAskImages; white fill added before its existing JPEG canvas conversion. File selection bounds, scope identity checks, upload destination and bitmap close remain.

## Quality checks

| Gate | Status | Evidence / rationale |
| --- | --- | --- |
| Compilation / type checking | PASSED | `npx tsc --noEmit`; `npx tsc --noEmit -p functions/tsconfig.json`, exit 0 after production edits. |
| Production-mode frontend build | PASSED | `VITE_USE_EMULATORS=false npx vite build --logLevel warn --outDir /private/tmp/satsunicgo-product-image-implementation-20261009/dist`, exit 0 after production edits. Existing large-chunk and Changes.tsx mixed-import warnings remain outside scope. |
| Unit/regression tests | PASSED | 21 tests in six files, SCENARIOS.md. |
| Integration/security HTTP | PASSED | 14 image upload/read and rejection scenarios on demo emulators. |
| Static/language analysis | PASSED | Scoped ESLint on changed TS/TSX, helper, tests and fixture; both typechecks. |
| Formatter | PASSED | Prettier check of all new source/test fixture files. Existing files changed minimally; unrelated formatting preserved. |
| Architecture/API compatibility | PASSED | Pure helper; MIME/base64 response contract unchanged. No public routes/contracts/config changed. |
| Database connection/transaction safety | PASSED | Source review: owner reads/reservations/rechecks and mutation transactions unchanged; HTTP owner/checkout guards executed. |
| Database migration | NOT_APPLICABLE | No schema, index, TTL or persisted identifier changes. |
| Security/privacy | PASSED | Verified Google identity required, locked-owner/object checks intact; no public private-image URL, secret/logging addition, new dependency or relaxed guard. HTTP negative cases pass. |
| Memory / resource lifecycle | PASSED scoped review | Existing byte/pixel limits retained; helper output <=160x160, no enlargement/cache/persistent buffers. Sharp uses async buffer transform. Ask bitmap closes as before; no new retained resource. Concurrent transform regression passes. Heap/load profiling NOT_RUN. |
| Concurrency / retry | PASSED scoped review | Helper has no shared mutable state; existing maxInstances 2 / concurrency 4 and upload idempotency intact. Two concurrent transforms and upload replay tested. No queue/worker/scheduler introduced. |
| Performance | PASSED scoped review | No extra requests, DB reads, watchers, polling or jobs. Existing responsive public delivery retained. Header validation is also local to the pure helper; it adds a bounded validation pass over <=2 MB, no I/O. No throughput improvement claimed. |
| Error handling / failure paths | PASSED | Broken/absent/recovery image states, invalid files, unauthorized/locked owner, replay mismatch and checkout-active rejection verified. |
| Observability | PASSED scoped impact review | No new metrics, logs or sensitive payloads. Existing callable error handling retained; final fixture console empty. No operational instrumentation change needed. |
| SEO/GEO / metadata | PASSED preservation review | No alt, title, link, JSON-LD, route, canonical, crawler or public claim changes. CatalogCard and ProductDetails source hashes unchanged. No provider ranking/indexing outcome claimed. |
| Product language / design / accessibility | PASSED | PRODUCT-CONTENT-REVIEW.md; actual component rendering, four widths, CSS 200% layout zoom and keyboard focus/remove checks. |
| Motion | NOT_APPLICABLE | No new animation or motion behavior. |
| Diff review / ownership | PASSED | IMAGE-ONLY.patch; owner released cart.css and Cart.tsx before image-only edits. Reverse onLoad-hunk removal matches their saved source hashes. |
| Deployment / rollback impact | PASSED review only | No migration or production mutation. Revert only image-specific hunks/helper and rebuild. Read-time thumbnails need no stored-image rewrite. |
| Final implementation review | PASSED | FINAL-REVIEW.json, fresh cycle 3. |

## Findings and fixes

Medium IMG-01: Ask transparent PNG was encoded with black corners. White canvas fill fixed it; actual file selection produces white corners.

Medium IMG-02: portrait cart image was 86x185 within 86x104 frame. Definite direct-child image box fixes it without changing cart dimensions; responsive matrix passes.

Medium IMG-03: failed image remained hidden after a valid source replaced it. onLoad resets hidden in existing img elements; broken -> valid matrix passes.

Low TEST-01: repeated fixture HMR createRoot warning. Vite dispose now unmounts the root; fresh final console is empty. Early hidden-tab viewport observations were discarded and replaced with measured actual-width runs.

No open actionable finding remains within the reviewed image diff. This is not a claim that the entire dirty workspace is issue-free.

## Limitations, deployment and rollback

Full authenticated CartPage/PurchaseThumbnail lifecycle is not mounted in this presentation fixture; backend authorization and image transforms are separately tested through real emulator HTTP. Native browser 200% zoom, full screen-reader testing, heap profiling, high-volume load testing, separate Node 22 execution, provider payment and deployed readback are NOT_RUN. These do not substitute for integration owner's complete release acceptance.

Shared Functions uses a copied tree: only the regenerated purchase-images.js and purchase-image-thumbnail.js were hot-reloaded after ownership release, with old runtime bytes saved in task temporary storage. No process restart/reset or runtime config change occurred. Source originals are unchanged; existing private thumbnails improve on the next read. Existing in-memory views may need navigation/refresh.

Git checkout remains dirty with unrelated concurrent work; no commit/push/deploy performed for this image scope. Final report runtime CLI is unavailable; manual evidence files provide the review/report instead. Token usage and actual billed cost: Unavailable. Memory candidates: None.

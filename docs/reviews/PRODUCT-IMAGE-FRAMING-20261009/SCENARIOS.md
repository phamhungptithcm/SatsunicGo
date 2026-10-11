# Executed image scenarios — 2026-10-09

All evidence is local or synthetic. No real payment, order submission, production write, new server, emulator reset or shared-data reseed occurred.

## Browser matrix

Shared frontend: http://127.0.0.1:5207/tests/browser/fixtures/product-image-framing/index.html.

At each actual innerWidth 320, 390, 768 and 1440, selected portrait -> landscape -> square -> transparent -> small -> broken -> portrait -> absent. Real CatalogCard and ProductDetails, current cart/checkout image markup and current CSS rendered. Seven frame checks per context, 32 contexts: **224 checks PASSED**, no horizontal overflow or geometry failures. Ask: three files at each width, **12 checks PASSED**. Native 200% browser zoom NOT_RUN; **200% CSS layout zoom PASSED** without overflow, recorded separately.

| Scenario | Expected and observed |
| --- | --- |
| Three existing catalog product photos | Complete packaging visible and centered; original pixels/backgrounds preserved. |
| Tall / wide / square image | Contained with equal center coordinates; no box exceeds its frame. |
| Transparent PNG | Private JPEG and Ask canvas conversion flatten onto white; no black background. |
| Tiny original | Backend does not enlarge stored thumbnail pixels; UI contains the complete image. |
| Broken source | Catalog/detail fallback and hidden thumbnail preserve the frame. |
| Broken -> valid source | Valid image becomes visible again; cart and checkout load handlers reset hidden. |
| No image | Existing placeholder remains, same frame dimensions. |
| Keyboard catalog focus | Tab from image selector reaches the named catalog link with a solid outline. |
| Ask selection | Native file chooser accepts three valid local photos. |
| Fourth Ask photo | Existing limit message; three photos retained. |
| Ask remove | Enter on “Gỡ ảnh” removes one selected photo. |
| Invalid Ask file | Existing format/size message; valid selection retained. |
| Fresh final fixture console | Empty warning/error list; HMR root disposal corrected a test-only warning found during review. |

Cart/checkout fixture is a presentation test, not an authenticated full business-flow test. Its image handlers mirror the current source. Source hashes and reverse-hunk comparison verify all unrelated Cart.tsx/PurchaseThumbnail content is preserved. Quantity/remove/login/price/recovery behavior was not modified by this task. Integration owner must rerun their full candidate checks after combining concurrent changes.

## Backend HTTP scenarios

**14 PASSED**, actual Auth/Functions/Firestore/Storage demo emulators. HTTP-RESULTS.json and derived image files record outcomes without tokens or private customer data.

1. Owner uploads and reads portrait: 64x160 JPEG; top/bottom edge markers retained.
2. Owner uploads and reads landscape: 160x64 JPEG; edge markers retained.
3. Owner uploads and reads transparent PNG: 80x160 JPEG; corner RGB [255,255,255].
4. Same upload operation replay returns stable image identity.
5. Anonymous read rejected.
6. Different owner read rejected.
7. Different owner upload rejected.
8. Unverified identity read rejected.
9. Out-of-range item index rejected.
10. Invalid image bytes rejected.
11. Same operation with changed bytes rejected.
12. No ready image returns explicit null MIME/base64.
13. Locked owner read rejected.
14. New upload during active checkout rejected.

Only task-created synthetic identities/draft/cart/storage objects were used. After verification, exact-owner guards and local-emulator environment guards preceded deletion of those fixtures. cleanup.json confirms three storage objects, three auth users and corresponding task-owned Firestore records removed. No settings or financial records changed.

## Unit/regression checks

Command: `npm test -- tests/unit/purchase-image-thumbnail.test.ts tests/unit/product-thumbnail.test.ts tests/unit/product-images.test.ts tests/unit/cart107.test.ts tests/unit/media.test.ts tests/unit/purchase-owner-guard.test.ts`.

**21 tests / six files PASSED.** New thumbnail cases check all four colored edges for three ratios, tiny-input bounds, alpha flattening, EXIF orientation/metadata stripping, JPEG/WebP compatibility, invalid/mismatched/oversized/over-pixel input rejection and independent concurrent transforms. Existing public image, media and cart/owner regressions also pass.

No high-volume load test or heap profiler was run. Source review establishes the unchanged 2 MB / 20 million pixel input validation, bounded 160x160 output, two function instances and concurrency four. No persistent cache, polling, extra DB roundtrip, timer, dependency or background job was added.

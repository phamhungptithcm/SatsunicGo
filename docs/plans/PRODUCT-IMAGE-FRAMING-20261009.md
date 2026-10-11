# Product image framing — plan v1

Status: **AWAITING_APPROVAL — application changes NOT_IMPLEMENTED**.

Request: center uploaded product images in balanced containers, keep the complete product visible in catalog and detail, and review other product-image consumers.

## Repository intelligence brief

- Working revision: `0d6e721`; shared checkout contains unrelated concurrent changes. Preserve them.
- Repository intelligence gate: READY on 2026-10-09; CodeGraph queried before CocoIndex. CodeGraph also returned cached `output/` duplicates, so live source and rendered DOM are the authority for this plan.
- Structural evidence: product catalog -> `CatalogCard` -> `/media/:id?w=320|640|960` -> `publicImage` -> `productThumbnail`. Product detail -> `ProductDetails` -> original public media. Custom purchase -> authenticated `purchaseDraftImage` read -> generated thumbnail -> `PurchaseThumbnail`. Ask attachments use local selected-photo previews.
- Source evidence: `CatalogCard.tsx`, `ProductsCatalog.tsx`, `products-catalog.css`, `product-detail080.css`, `ProductDetail.tsx`, `Content.tsx`, `public-ux.css`, `media.ts`, `product-thumbnail.ts`, `purchase-images.ts`, `purchase-thumbnail.tsx`, `purchase-checkout.css`, `cart.css`, and `Ask.module.css`.
- Shared context files inspected: architecture/repository map/build-test context are placeholders; implementation and tests establish behavior.
- Stack: React 19 / TypeScript 6 / CSS; Firebase Functions Node 22 / Sharp; Vitest. Profiles for frontend, backend, security, performance, and product content apply to implementation.
- No dependency, database, schema, API-shape, financial, provider, or runtime configuration change is proposed.

## Verified findings

1. **Public catalog clips portrait photos despite `object-fit: contain`.** The image is an intrinsic-size grid item with `min-height: auto`; its height exceeds the reserved square. At a 1280 px browser viewport, Eagle Brand's frame is 244.66 px high while the image/grid track is 380.20 px high. Puritan's Pride reaches 433.95 px in the same frame. `overflow: hidden` conceals the lower portion. Verified on the public website and against current CSS.
2. **Detail has the same sizing problem.** Eagle Brand's frame is 366 x 332.73 px; its image/grid track is 364 x 520 px. The lower image is clipped.
3. **Private purchase thumbnails are cropped before rendering.** `purchaseDraftImage` uses Sharp `resize(160, 160, { fit: "cover" })`; checkout CSS also uses `object-fit: cover`. A frontend-only adjustment cannot recover these generated cropped pixels.
4. Public media originals are preserved. `productThumbnail` bounds width, does not crop, and does not enlarge small inputs. Baseline `tests/unit/product-thumbnail.test.ts`: **2/2 passed**. A separate synthetic Sharp probe using the current cover recipe loses the red/blue top/bottom edge bands; the proposed inside recipe preserves both. This is transform-level evidence, not an authenticated endpoint test. No public-media processing change is needed.
5. Cart images use `contain`, but should use a definite inner box to prevent the same intrinsic sizing issue. Ask's active `.composerPhotos img` uses `cover`; `.photos img` has no current consumer and does not need an unrelated cleanup.

The local `/products` list currently starts with synthetic gateway fixtures without photos. Public website inspection and an isolated document preview using the three existing public photos provide design evidence; they do not certify the local application fix.

## Proposed presentation

- Catalog: keep the current square frame, border radius, surface, text, actions, and card layout. Give the image a definite bounded box, centered horizontally and vertically, using `object-fit: contain` and `object-position: center`. Use proportional, bounded inset spacing so narrow cards retain useful image area.
- Detail: preserve the current frame proportions and responsive layout. Bound the image to the frame rather than an intrinsic grid track or a separate 520 px image height. Keep the full image visible.
- Cart / checkout / Ask attachment: retain the existing container dimensions and controls; center the complete image with a small inset suitable for thumbnails.
- Private thumbnail generation: preserve aspect ratio using bounded `fit: "inside"`, auto-rotate as today, prevent enlargement, and explicitly flatten transparent inputs onto white before JPEG encoding. Preserve owner checks, post-read recheck, byte/pixel limits, and the existing response shape.
- Originals remain unchanged. No automatic trimming, background removal, AI retouching, or cropping. Embedded margins/backgrounds in uploaded photos remain part of the image; centering the complete canvas cannot guarantee identical apparent object size across arbitrary uploads.

Reviewable static prototype: `docs/previews/PRODUCT-IMAGE-FRAMING-20261009.html`. It uses unchanged existing public images and demonstrates only the proposed frame sizing; it is not an implemented application route.

## File-by-file implementation scope

| File | Planned change |
| --- | --- |
| `src/features/content/products-catalog.css` | Consolidate product-scoped image sizing; reserve square frame and bound/center the image. Preserve other dirty catalog changes. |
| `src/features/content/product-detail080.css` | Bound detail image to the reserved frame at desktop/mobile sizes; remove the conflicting intrinsic/max-height behavior. |
| `src/features/cart/cart.css` | Bound and center product image within the existing cart cell. Keep cart UI structure and dimensions. |
| `src/features/cart/purchase-checkout.css` | Switch product thumbnail to centered containment with modest inset. Preserve payment layout and unrelated changes. |
| `src/features/ask/Ask.module.css` | Contain the selected product-photo preview only; preserve removal control and mobile targets. |
| `functions/src/purchase-images.ts` | Replace only thumbnail crop/alpha treatment, preferably via a small pure helper. Keep authorization/storage/lifecycle unchanged. |
| `functions/src/purchase-image-thumbnail.ts` (new, if needed) | Isolate the existing bounded Sharp transform for meaningful pixel-level testing. No shared public/private cache. |
| `tests/unit/purchase-image-thumbnail.test.ts` (new) | Portrait, landscape, square, orientation, transparent and tiny inputs; edge preservation, bounds, invalid input. |
| Temporary browser fixture / checks | Exercise current components on shared 5207, with representative image ratios and failure/loading states; do not start an additional frontend. |
| Review documentation | Current source manifest, product-content review, scenarios, test evidence, final review cycles and task report. |

Conditional scope: `CatalogCard.tsx` / `ProductDetail.tsx` only if the existing markup cannot support definite sizing through scoped CSS. No new user-facing strings are currently planned. Do not edit `public-ux.css` globally; local feature selectors must override safely. Exclude blog covers, avatars, QR codes, market/country artwork, order evidence, and Studio editorial images.

## Validation and acceptance

1. Browser at 320, 390, 768 and 1440 px: catalog, detail, cart, checkout thumbnail, and selected Ask photo use centered, fully contained images; no image bounding box exceeds its frame.
2. Tall/wide/square images, transparent PNG, small image, and EXIF-rotated upload preserve aspect and all four visible edge markers. No distortion or crop in backend thumbnail and rendered image.
3. Loading/error/absent image reserves the same frame; image load must not shift card text. Lazy loading, responsive sources, alt text and decorative thumbnail semantics remain intact.
4. Cart quantity/remove and Ask remove actions retain keyboard/focus behavior. No horizontal overflow at narrow widths or 200% zoom; no new animation.
5. Run focused meaningful thumbnail tests, typecheck/build and applicable lint; then inspect actual component rendering through the shared frontend. Do not treat static preview as application acceptance.
6. Re-run review -> fix approved findings -> affected verification -> fresh final review until the scoped cycle passes. Record NOT_RUN or BLOCKED for unexecuted checks.

## Impact, risk, release

- Risk: low for feature-scoped CSS; medium for the private derived-image transform because authenticated checkout consumes it. Private bytes remain private and response format stays JPEG/base64.
- Performance/memory: no new requests, polling, dependencies, original-image processing jobs, or caches. Keep the current byte/pixel limits and bounded concurrency. Derive at most a 160 x 160 thumbnail, without enlargement. Keep public responsive image delivery unchanged.
- Concurrency: recheck target source hashes immediately before edits; coordinate image-file ownership with the existing integration chat; preserve unrelated dirty files and shared demo data.
- Compatibility: originals and existing persisted media IDs require no migration. Read-time private thumbnails will render completely on the next read. In-memory consumer refresh may require revisiting the view.
- Rollback: revert only the approved CSS and private-transform hunks. No data rollback required.
- Deployment: not part of this plan. Local 5207 only; no backend/frontend restart without an actual need and existing runtime ownership coordination.

## Current handoff status

- Review and proposed design: **PLAN_READY**. Static prototype checked through the browser at 320, 390, 768 and 1440 px: all 7 images loaded, centered, and bounded; no horizontal overflow. Screenshot: `/private/tmp/satsunicgo-product-image-review-20261009/preview-desktop.jpg`; mobile: `preview-mobile.jpg`; measurements: `preview-checks.json`. These are prototype checks, not implemented-component acceptance.
- Application implementation / E2E acceptance / final implementation review: **NOT_RUN, pending plan approval**.
- Production readiness: **NOT_READY for this change**.
- Token usage and actual billed cost: Unavailable.
- Memory candidates: None.

Approval required by `.ai/workflows/plan-existing-system-change.md`, step 15: “Stop and request developer-team approval.” Approval authorizes this exact framing plan and its scoped tests, not unrelated UI, financial, schema, or deployment changes.

## Review cycle 1 — plan and prototype only

- Requirement match: includes catalog, detail, cart, checkout and selected product-photo previews. Keeps the current cart UI.
- Findings: existing public CSS clips portrait photos; private derived thumbnails crop; Ask selected-photo preview crops. Fixes are proposed, not implemented.
- Scope review: no application code changed; two new planning documents and a static preview only. No dependency/install, data write, provider action, or server restart.
- Prototype visual review: all four widths have complete photos and no overflow. Original image backgrounds/margins remain visible; equal subject scale is not promised.
- Quality gates: repository intelligence READY; baseline public thumbnail tests PASSED (2); static prototype responsive geometry PASSED (28/28 image cases). Application compilation/static analysis/integration/E2E/final implementation review NOT_RUN pending approval; no code change is being handed off as complete. Database migration NOT_APPLICABLE.
- Implementation review status: NOT_RUN; this is the mandatory plan approval boundary. Production readiness remains NOT_READY.
- Remaining work: human approval, scoped implementation, private-thumbnail pixel regressions, actual component success/failure/accessibility checks, and fresh review/fix/verify cycles.
- Usage/cost: provider token usage Unavailable; actual cost Unavailable; no estimate fabricated. Memory candidates: None.

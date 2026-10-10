# Product content review — product image framing

Reviewed 2026-10-09 by the implementing agent against the approved v1 plan and current rendered fixture. Result: **PASSED for this image-only scope**.

## Scope and context

Customers identify a product in the catalog, inspect it, review cart/checkout items, or attach a reference photo in Ask. Vietnamese public web UI; React, the existing blue/white/navy design, browser keyboard interaction and accessible HTML conventions apply. Apple-specific components and platform contracts are not applicable. No production text, alt text, price, availability, payment statement or navigation label was changed.

Verified behavior: complete image canvases are contained within existing frames. Private derived thumbnails are JPEGs with preserved aspect ratio and white transparency flattening. The original upload remains unchanged. Arbitrary whitespace embedded in an original image stays visible; equal apparent subject size is not promised.

## Content inventory

| Location / state | Current → final content | User job and evidence |
| --- | --- | --- |
| Catalog loaded image | Existing supplied alt / title; unchanged | Identify the complete product; three existing product photos and synthetic edge markers render in the actual CatalogCard. |
| Catalog failure | “Chưa tải được ảnh”; unchanged | Understand an unavailable image without losing the card/link; broken-source browser case. |
| Catalog absent | Existing monogram placeholder; unchanged | Continue reviewing the item; absent-source browser case. |
| Detail loaded / absent / error | Existing mediaAlt/title and missing-photo content; unchanged | Inspect the product; actual ProductDetails rendered at four widths. |
| Catalog cart photo | Existing product alt/title; unchanged | Identify a cart line; image markup uses current CSS and exactly the current load/error handlers. |
| Custom cart / checkout thumbnail | Empty alt within aria-hidden container; unchanged | Decorative duplicate of the adjacent product name; source inspection and rendered image markup. |
| Ask selected image | “Ảnh sản phẩm đã chọn”; unchanged | Review the full selected reference; actual useAskImages and actual CSS. |
| Ask removal | “Gỡ ảnh”; unchanged | Remove a selected reference; Enter on the named button removed one photo. |
| Ask file limit | “Chọn tối đa 3 ảnh sản phẩm.”; unchanged | Keep the existing selection when attempting a fourth file; count stayed three. |
| Ask invalid file | “Dùng ảnh PNG, JPEG hoặc WebP rõ nét, tối đa 2 MB.”; unchanged | Correct the file without losing valid photos; invalid.txt rejected and two prior photos preserved. |

No new production strings require translation. English error branches remain unchanged. Test-fixture labels explicitly describe local component checks and carry no product availability or financial claims.

## State coverage and semantics

| State | Result and evidence |
| --- | --- |
| Default / success | PASSED: complete photos, centered boxes, aspect preservation; matrix-final.json and ask-final-matrix.json. |
| Loading / pending | PASSED by source review: absolute images do not size their reserved frames; existing lazy loading and responsive sources unchanged. A throttled-network timing experiment was not run. |
| Empty / no image | PASSED: absent-source frame retained at all four widths; null private-image response tested over HTTP. |
| Error / recovery | PASSED: broken -> portrait recovery at all four widths; no financial action or blocking modal introduced. |
| Offline / partial | PASSED scoped review: existing image error fallback remains in place; this change introduces no connectivity claims, polling or alternate data. Full application offline workflow is outside this image task. |
| Unauthorized / forbidden | PASSED: anonymous, other-owner, unverified and locked-owner HTTP reads rejected; no private bytes in public assets. |
| Destructive / confirmation | NOT_APPLICABLE: no consequential product action changed. Ask removal is local and existing. |

Source of truth is the original uploaded canvas. Null means no ready image; failed retrieval does not imply a missing product. Units, currency, periods, totals, business status and payment behavior are unchanged. No cache is added; existing private no-store storage metadata and owner validation remain.

## Mandatory Human Interface principles

| Principle | Status | Current in-context evidence |
| --- | --- | --- |
| Purpose | PASSED | The complete product is visible in catalog/detail; the original Eagle Brand photo now shows its lower packaging. final-desktop.jpg. |
| Agency | PASSED | Existing catalog links remain keyboard focusable; Ask remove works with Enter; selections survive rejection. |
| Responsibility | PASSED | No image implies purchase availability or successful upload; private owner checks and explicit null response verified by HTTP. |
| Familiarity | PASSED | Current card, cart dimensions, square checkout thumbnail and named controls remain; no new production interaction pattern. |
| Flexibility | PASSED | Actual widths 320/390/768/1440; portrait, landscape, square, transparent and tiny sources. |
| Simplicity | PASSED | No additional production labels or controls; image rules are feature-scoped. |
| Craft | PASSED | 224 geometry/state checks, 12 Ask checks, clear inset spacing, safe fallback/recovery and EXIF rotation tests. |
| Delight | PASSED | Full uncropped photos remain easy to recognize; no gratuitous motion or interruption. Screenshots show the current code. |

## Platform fit and pattern checks

- Writing, labels, terminology, feedback, permission and account flows: PASSED scoped preservation review; no production strings or permission prompts changed.
- Alerts and consequential choices: NOT_APPLICABLE to the framing change; existing Ask limit/invalid-file alerts verified.
- Onboarding: NOT_APPLICABLE.
- Inclusion/accessibility: PASSED scoped checks of existing names/decorative semantics and real keyboard focus/removal. No new focus order or targets. Full screen-reader announcement testing was not run.
- Localization/text expansion: PASSED preservation review; no new localized production strings or altered text containers. Four widths and 200% CSS layout zoom verified. Native browser zoom keyboard shortcut had no effect in the in-app browser, so native 200% browser zoom is NOT_RUN; zoom-200.json records CSS layout zoom explicitly.
- Branding: existing surfaces, borders, radii and color roles retained. No Apple-only expression or new design system introduced.

## Decision and boundaries

Meaning/behavior, audience, tone, brevity, actions, data semantics/privacy, terminology, target-platform fit and in-context verification: **PASSED**. No changed production wording needs an owner decision.

Browser fixture mounts real CatalogCard, ProductDetails and useAskImages. Cart/checkout render image-only markup with real CSS and backend-generated synthetic bytes; they do not mount the entire authenticated CartPage/PurchaseThumbnail checkout lifecycle. Native authenticated business E2E and deployment certification remain separate integration gates. This review certifies image presentation and preservation of language/semantics within that boundary.

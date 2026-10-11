# Implementation Approval Record

Plan ID/version: PRODUCT-IMAGE-FRAMING-20261009 v1
Repository intelligence gate status: READY — current status/query checks pass
Approval status: APPROVED
Approver: repository owner in current chat
Approval timestamp or task reference: 2026-10-09 current human message, after reviewable plan and prototype
Approved scope: Implement the reviewed image-framing plan across catalog, detail, cart, checkout and Ask; scoped thumbnail and browser tests; review/fix/verify loop.
Human approval: “Approved triển khai theo bản mẫu, giữ nguyên UI giỏ hàng hiện tại. Hardness implement review fix test loop ảnh ở danh sách, detail, cart, checkout và Ask đến khi done.”
Approved paths:
- `src/features/content/products-catalog.css`
- `src/features/content/product-detail080.css`
- `src/features/cart/cart.css`
- `src/features/cart/Cart.tsx`
- `src/features/cart/purchase-thumbnail.tsx`
- `src/features/cart/purchase-checkout.css`
- `src/features/ask/Ask.module.css`
- `src/features/ask/ImageIntake.tsx`
- `functions/src/purchase-images.ts`
- `functions/src/purchase-image-thumbnail.ts`
- `tests/unit/purchase-image-thumbnail.test.ts`
- `tests/browser/fixtures/product-image-framing/**`
- `docs/reviews/PRODUCT-IMAGE-FRAMING-20261009/**`

Required constraints: Preserve existing cart UI structure and dimensions, unrelated dirty WIP and shared runtime. No production mutation, deploy, real payment, new dependencies, schema/API shape change, data reseed, or extra frontend.

In-scope review correction: the approved Ask image flow converts transparent PNG to JPEG with a black background before CSS sees it. Browser reproduction confirmed this defect. A white canvas fill in ImageIntake.tsx is necessary to satisfy the approved transparent-image acceptance criterion and the human's explicit Ask review/fix loop; no upload destination, image format, size limit, authentication, or API behavior changes.

In-scope failure-path correction: replacing a failed cart/checkout thumbnail with a valid source left its existing hidden attribute set. Add only an onLoad reset on the existing img elements in Cart.tsx and purchase-thumbnail.tsx. This restores the image without changing UI structure, cart state, identity, requests, or financial behavior. The human explicitly approved the cart/checkout image review/fix loop and image error/recovery acceptance criterion. Existing owner was notified after releasing cart.css; preserve all unrelated Cart.tsx changes.

# CART-107 human approval
Plan ID/version: SATSUNICGO-CART-107 / docs/plans/SATSUNICGO-CART-107.md
Repository intelligence gate status: READY
Approval status: APPROVED
Approver: Repository user in this task
Approval timestamp or task reference: 2026-10-07 user message "Approved có icon giở hàng ở navbae too"
Approved scope: Implement the reviewed cart mockup/flow and CART-107 plan, with cart icon and quantity badge on navbar. SiteChrome.tsx is the verified navbar implementation; its scoped icon integration is explicitly authorized by the user.
Constraints: Preserve unrelated WIP. No production writes, deployment, dependencies, payment aggregation, global persistent Firestore cache, shared server restart or reseed. Shared frontend 5207 only.
Approved paths:
- `packages/domain/cart.ts`
- `functions/src/cart.ts`
- `functions/src/index.ts`
- `firestore.rules`
- `src/features/cart/**`
- `src/app/App.tsx`
- `src/app/SiteChrome.tsx`
- `src/features/content/ProductsCatalog.tsx`
- `src/features/content/ProductDetail.tsx`
- `src/features/products/Checkout.tsx`
- `src/shared/firebase.ts`
- `tests/unit/cart107.test.ts`
- `tests/rules/cart107.test.ts`
- `tests/browser/cart107.spec.ts`
- `tests/browser/cart107.config.ts`
- `tests/browser/cart107.integration.config.ts`
- `docs/plans/SATSUNICGO-CART-107*`
- `docs/approvals/SATSUNICGO-CART-107.md`
- `docs/reviews/SATSUNICGO-CART-107/**`
- `output/cart107/**`

## Clean copy delta approval, 2026-10-07
Direct user instruction: "Bỏ mấy label giải thích rươdm rà máy móc không cần thiêdt đi clean nhấtt" with cart screenshot.
Approved plan: docs/plans/SATSUNICGO-CART-107-CLEAN.md. Presentation-only removal of redundant explanations and labels, shorter headings; essential errors and per-product checkout meaning retained. Same approved paths and business constraints apply.

Production release authorized by current user instruction: Release lên production commit and push to main. Release plan docs/plans/SATSUNICGO-CART-107-RELEASE.md. Necessary test mock compatibility path tests/unit/product-reviews080.test.ts and regenerated functions/generated/public-assets.json included.

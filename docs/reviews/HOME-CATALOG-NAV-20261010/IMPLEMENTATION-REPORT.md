# HOME-CATALOG-NAV v1 — implementation review

Status: **IMPLEMENTED_LOCAL; FINAL_REVIEW_BLOCKED; production NOT_READY**.

Human approved this exact plan via call_d4efe982c52d4e3daa89da4cefa7c0e8 item0, “Duyệt và triển khai”. Historical PLAN/preview reviews are preserved, not current pending approval. Current source hashes are in IMPLEMENTATION-SOURCE-FREEZE.json; before/after preservation is proven in SOURCE-PRESERVATION.json.

## Change and boundary

Hero prioritizes Xem sản phẩm, keeps Gửi yêu cầu mua hộ second, moves Xem cách hoạt động below the original animated journey. Navbar labels use Phí dịch vụ/Thành viên/Mua hộ theo yêu cầu; catalog gets a small icon and visible interaction hierarchy. Preserve1200px menu collapse as explicitly allowed by the plan for customer/staff width. Small screens use the existing avatar trigger with full accessible name/name in dropdown. Keyboard opening focuses the first link; pointer opening retains trigger focus. No backend/API/auth/MFA/consent/payment/database/dependency/CI/IAM changes. public-assets.json is regenerated from build, not hand edited. Existing candidate test-mode changes are preserved; shared App was not copied wholesale.

## Review cycles and fixes

1. R1: actual component long-name customer/staff at390/320 pushed the menu outside the viewport (Medium, SiteHeader CSS). Fixed with44px avatar/cart controls and narrower gaps/padding. R2:18/18 layouts pass; account dropdown fits and full name remains accessible.
2. R2: actual390px hero heading left “xa.” on its own line (Low, hero h1). Scoped mobile typography corrected. R3: actual390/320 screenshots and measured2line heights pass;1440/1280/1024 also pass.
3. R3 fresh complete diff review: no additional actionable defect found in executed source/local scope. Product Language Gate and overall final review remain BLOCKED by native200%zoom/spoken AT, and broader genuine staff MFA/release/live proof. An AX snapshot or synthetic staff adapter does not satisfy those gates.

Initial fixture missing module type and stale locator were harness/tool failures corrected before component checks; outside-close probe initially hit an overlapping menu link, so that probe did not count. A later actual blank-area outside click closed menu on /; only that result counts. Historical receipts remain.

## Repository/engineering evidence

Shared intelligence refreshed once and queried CodeGraph then CocoIndex before edits, with source verification. Candidate lacks indexes; changed-source review is DEGRADED/bounded. No fresh whole-graph PASS claimed. Stack Node22.23.3, TypeScript6, React19.3, Vite8.3.2, responsive ecommerce web/Firebase; profiles universal,typescript-javascript,frontend-html-css,web-app,visual-design,product-content,seo-geo,animation-motion. Direct diff verifies only Home/Journey/SiteHeader/CSS and regenerated asset references changed. Existing listeners/subscription cleanup, navigation preload, safe avatar fallback, role checks and cart labels retained. No new dynamicHTML or user input. No API/schema/migration/observability change. Motion adds only short color/border transition; existing underline/reduced-motion and journey lifecycle unchanged. No frame-rate/load/leak-free claims.

SEO/GEO bounded impact: public destinations/route policy/canonical/robots/metadata/structured data are unchanged, important catalog/request/how-it-works links remain crawlable anchors. No new rating, stock, ranking or conversion claim. Full-site contract/provider measurement is not rerun or claimed for this local UI delta.

## Quality gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Compilation | PASSED | Candidate frontend tsc --noEmit, Node22 |
| Static analysis | PASSED | ESLint App.tsx/SiteChrome.tsx; diff check |
| Focused regression | PASSED | navigation-performance0873/3 tests |
| Public config/build/generated manifest | PASSED | BUILD-CHECKS-R2.json,3exit0 commands/log hashes |
| Actual route and keyboard integration | PASSED | Products/request/form/how-it-works; menu Enter/Space/Tab/Escape/focus/pointer/outside checks |
| Responsive composition | PASSED | APP-VIEWPORT-CHECKS-R3.json, current3screenshots |
| Header/cart/account states | PASSED, component scope |18layout checks+5cart/avatar states; real auth not faked |
| Source integrity | PASSED | Inverse App preimages and identical common source hashes |
| Security/API/database/observability impact | PASSED, source scope | Existing boundaries unchanged; no new I/O or data |
| Selected profiles | PASSED | Listed above, current diff/target inspected |
| Product content/accessibility/text zoom | NOT_RUN | Product review BLOCKED, native Mac locked |
| Current combined mandatory PR CI | NOT_RUN at source freeze | Must run on new candidate SHA;0929CI is historical after this delta |
| Main immutable release/provider/live | NOT_RUN | Current delta not on production |
| Final implementation review | BLOCKED | Current FINAL-IMPLEMENTATION-REVIEW.json |

## Integration/release posture

Changes applied to shared source and current PR3 candidate, with candidate-specific App/test-mode preservation. Explicit staged paths only; pre-existing pyc drift and node_modules symlink excluded. No shared runtime restart/reseed, extra server, account/cart/order/payment mutation or secret access. Synthetic header bundle/tab removed. Keep PR3 draft and production main unchanged while manual gates remain. Once current mandatory CI/manual review is complete, normal immutable workflow and exact artifact/provider/runtime/IAM/secret/index/Scheduler/domain readback, controlled opted-in sandbox/email canary and live authorization checks remain required. Rollback uses verified artifact and preserves accepted/unknown/consent/financial states.

Progress: UI source, local routes, responsive/failure-state checks and scoped fixes complete. Remaining: native zoom/spoken AT, broader PRE001 genuine MFA acceptance, current CI then immutable release/live validation. Do not equate this report with production readiness.

Token usage: Unavailable. Actual billed cost: Unavailable. No new Gemini/paid-provider calls. Memory candidates: None.

# Product Content Review

## Scope

- Surface: existing `/cart`, recovery beside the summary action, cart header count.
- Changed source: `Cart.tsx`, `cart-store.tsx`, `cart-cache.ts`, `cart-guest-transfer.ts`, `cart.css`, `SiteChrome.tsx`; shared callable feedback opt-in in `firebase.ts`.
- Audience/task: Vietnamese customers reviewing chosen products and continuing to checkout.
- Business outcome: remove a manual account-transfer step and duplicate blue recovery boxes while retaining chosen items and price verification.
- Locale/platform: vi-VN, cross-platform React web. Native HTML buttons, links, live status, keyboard focus and responsive layouts.
- Apple HIG: repository Human Interface principles and pattern references used as a human-centered quality reference; no Apple-specific expression or platform contract introduced. No claim of a live Apple documentation check.
- Reviewer/date: current task agent, 2026-10-09. Current source hashes in `SOURCE-MANIFEST.json`.

## Context And Evidence

Verified facts: guest and account carts are separate; server merge rejects unavailable products, invalid variants and quantity overflow; uncertain commits need exact replay. A missing product ID can reject a public query, confirmed by real emulator reads. Account cart and checkout remain server-authoritative.

Assumptions: opening the cart after login should continue the person's existing product choices automatically. No marketing, financial or availability claim is inferred.

Current native evidence: after explicit human authorization for localhost5207, a clean Chrome session completed real Google Auth Emulator popup login, automatic transfer, reload, a second tab and two active cart tabs during a second login. Account1 + guest1 became2 once, server revision2/quantity2; no manual merge or price box. Existing127sessions were preserved. The earlier rejection is historical and was resolved by new explicit authorization. IAB guest add/cart passed; its popup did not become available, so successful login evidence is Chrome. Spoken assistive technology and OS browser zoom remain NOT_RUN.

## Content Inventory

Unchanged surrounding product, quantity, currency, login and checkout labels remain in their existing components. The following inventory covers changed or newly reached content, including safety recovery.

| Location/state | Before | Current content | User job and behavior evidence |
| --- | --- | --- | --- |
| Normal signed-in guest continuity | Browser cart banner and “Gộp vào giỏ tài khoản” | No manual banner; automatic transfer | Opening cart invokes bounded transfer once; unit and real HTTP success/concurrency/replay cases |
| Price failure | Large blue connection box and long retry button | “Chưa tải được giá mới. Thử lại để tiếp tục.” / “Thử lại” in summary | Does not falsely attribute every failure to network; cached price blocks review |
| Offline price | Separate global offline notice | “Kết nối mạng để cập nhật giá.”; summary “Kết nối mạng để tiếp tục đặt mua.” | No server query offline; no enabled checkout with unverified price |
| Loading cart/transfer | Prominent loading overlay | “Đang cập nhật giỏ hàng…” | Inline live status; existing server mutation and MFA recovery remain active |
| Price loading | Page-wide price loader | “Đang cập nhật giá…” | Summary action disabled while reading |
| Stale total | “Tạm tính” | “Tạm tính · giá chưa cập nhật” | Stored prices are informational, never current by implication |
| Missing/invalid product | Generic global connection failure | “Chưa thể đặt mua sản phẩm hoặc mẫu này. Xóa món này hoặc chọn lại trong danh mục.” | Row remains visible with local remove/quantity controls; no private product details inferred |
| Valid guest not saved | Manual merge banner | “Chưa lưu vào giỏ tài khoản.” | Row state remains honest after rejected/deferred save |
| Guest transfer failure | Manual banner | “Chưa lưu được các món đã chọn. Thử lại hoặc xóa món không cần mua.” or specific safe error | One summary retry; no repeated automatic failure loop |
| Storage/reconciliation error | No shared recovery guarantee | “Chưa lưu được các món đã chọn vào giỏ. Các món vẫn được giữ lại để thử lại.” | Source and journal retained on uncertain/failed reconciliation |
| Different account with uncertain transfer | No cross-tab owner journal | “Có món đang được lưu vào tài khoản trước. Đăng nhập lại tài khoản đó để hoàn tất.” | Exact journal owner checked before sending; no transfer to another account |
| Unsupported cross-tab locking | Manual per-tab merge | “Mở giỏ bằng trình duyệt mới hơn để tiếp tục với các món đã chọn.” | Fail closed without Web Locks; no unsafe fallback write |
| Editing uncertain guest transfer | Per-tab state only | “Kiểm tra lại lần lưu giỏ trước khi sửa món đã chọn.” | Edit blocked while shared journal exists |
| Stale guest edit | Hidden separate guest data | “Món đã được cập nhật. Xem lại giỏ trước khi sửa.” | Re-read source under the same lock before changing a row |
| Guest edit failure | No normal guest row editing | “Chưa sửa được món đã chọn. Thử lại.” | Failed write preserves source and shows summary recovery |
| Reset uncertain storage | Unconditional reset | “Kiểm tra lại lần lưu giỏ trước khi xóa bản lưu.” | Does not discard a pending journal |
| Unreadable journal retry | Per-tab pending only | “Chưa đọc được lần lưu giỏ. Các món đã chọn vẫn được giữ lại.” | No remote write after malformed journal |
| Pending checkout | Guest choices absent from rows | “Đang chờ thanh toán”; “Hoàn tất thanh toán đang chờ để thêm các món đã chọn.” | Summary excludes unmerged guest choices from the existing payment amount; original payment route retained |
| General recovery | Blue notice styling | Existing safe error + small inline recovery action | Required errors remain visible; no duplicate global toast/overlay for cart commands |
| Header count | Mutation error hides all count | Includes visible guest choices; failed read only when cached + error | Actual native cart AX label “Giỏ hàng, 1 sản phẩm” matches visible row |

## State Coverage

| State | Applicable | Result/evidence |
| --- | --- | --- |
| Default/action | Yes | Normal SSR component has products, summary and existing review action, no merge/price banners |
| Loading/pending/disabled | Yes | Source and component assertions; inline live state, unchanged pending command, disabled review |
| Empty/no result/true zero | Yes | Empty/custom-only does not fetch catalog prices; empty SSR has no spurious price recovery; unknown price is not zero |
| Success | Yes | Coordinator + real verified Google emulator HTTP and actual Chrome Google Auth Emulator login/transfer/reload/two-tab success |
| Error/recovery | Yes | Real unavailable cart retry retains row, no global alerts/overlay; current price-error rendered proxy verified |
| Offline/stale/partial | Yes | Unit offline/stale/retry tests, bounded query isolation, cached caption and summary reason |
| Unauthorized/forbidden | Yes | Real unauthenticated/locked/forged requests rejected; UID generation guards; journal owner mismatch unit |
| Confirmation/destructive | Yes | Existing row “Xóa” action retained and keyboard/touch target checked; reset refuses uncertain journal; no new destructive confirmation flow |

## Data Semantics

- Chosen quantity includes account and not-yet-transferred guest rows. A pending existing checkout summary uses account rows only.
- Source of truth: private Firestore cart and server product validation; local guest data is a choice to transfer, not a confirmed purchase.
- Missing/unreadable price: “Chưa xác định”, never 0 đ. Stale previews are labeled and cannot enable review.
- Currency: existing locale-aware vi-VN VND formatting; no date/period/aggregation change. Custom product total uses the existing domain calculation.
- Freshness: public previews bounded to100, TTL5minutes; server read and checkout revalidation remain. Unreadable product isolation never treats a network failure as a verified price.
- Privacy: journal contains bounded existing selection command and pseudonymous account binding; no tokens, contact/address, payment details or new analytics.

## Mandatory Human Interface Principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Chosen products and next checkout action are primary; unnecessary transfer task removed |
| Agency | PASSED | Unavailable guest row remains visible and removable; retry remains explicit after failure |
| Responsibility | PASSED | Unknown price stays unknown; server errors/pending checkout are not hidden; no client payment claim |
| Familiarity | PASSED | Existing cart, product rows, quantity controls and checkout route retained; plain Vietnamese recovery |
| Flexibility | PASSED | Keyboard focus checked; actual320/390 and desktop; visible action targets44px; text expansion proxy320 |
| Simplicity | PASSED | No manual merge banner, no duplicate global price/offline boxes; one short next step near review |
| Craft | PASSED | Current rendered surface/proxies, currency wrapping correction, focus ring and product-aligned recovery |
| Delight | PASSED | Quiet continuity and preserved choices reduce work; no decorative motion or invented success |

## Platform Fit

Cross-platform web, using existing blue/white/navy design system. No Apple-only control, gesture or copy. Buttons/links have semantic accessible names; pending messages use live status without moving focus. Native320/390/default1280 evidence has no horizontal overflow. Price-error and text200 views are explicitly rendered-component proxies, not live network failure or OS zoom proof.

## Human Interface Pattern Checks

| Pattern | Applicable | Result/evidence |
| --- | --- | --- |
| Writing/labels/controls | Yes | PASSED: short Vietnamese action, persistent product context, existing quantity accessible names |
| Feedback/interruption | Yes | PASSED: native rejected retry gives inline recovery without duplicate toast/overlay |
| Alerts/consequential choices | Yes | PASSED: errors retained; uncertain command cannot be silently discarded or replayed with new ID |
| Onboarding/help | No | NOT_APPLICABLE: no new onboarding; familiar cart continuity |
| Permission/privacy/accounts | Yes | PASSED: account-scoped command; real server rejects unauthorized/locked requests; no permission weakening |
| Inclusion/accessibility/localization/RTL | Yes | PASSED within scoped evidence: vi-VN, native keyboard/AX names, narrow/text expansion proxy. Spoken AT/RTL locale acceptance NOT_RUN; no RTL feature changed |

## Gate Results

Meaning/behavior, audience/context, natural tone, brevity, state coverage, data semantics/privacy, terminology, target-platform fit and all eight principles: PASSED for the changed content and disclosed evidence. Accessibility/localization: PASSED for native keyboard/AX/target/narrow checks and explicit text expansion proxy; spoken AT and OS zoom not claimed. In-context verification: PASSED for changed cart content, including actual Chrome successful login/transfer/reload/two-tab states; the separately disclosed price-error/text expansion states remain component proxies.

## Verification Evidence

- Actual shared5207 unavailable cart: desktop1280,320,390; `cart-final-desktop.png`, `cart-unavailable-320.png`, `cart-unavailable-390.png` and `UI-RESULTS.json`.
- Current rendered price-error component proxies320/390 and explicit200% text proxy320: corresponding `price-error-*.png`; retry44px, disabled review, no horizontal overflow.
- Keyboard: real pointer retry and Shift+Tab focus to previous link; AX labels and disabled state inspected. No spoken AT claim.
- Automated: source-bound36focused tests,2339full application tests plus4telemetry at the pre-image integration baseline,9real HTTP cases,3candidate price-read cases.
- Actual Chrome1512: native Google Auth Emulator popup login, automatic account transfer, reload, second tab and two-tab login transfer; NATIVE-LOGIN-RESULTS.json, cart-native-login-success.png and cart-native-two-tab-success.png.

## Decision

Product Language Gate: PASSED. Required clean-browser sign-in acceptance is now closed by NATIVE-LOGIN-RESULTS.json and the two current Chrome screenshots, in addition to the prior native negative/proxy evidence. Findings fixed: duplicate banners/feedback, misleading connection wording, hidden guest rows, stale total semantics and currency wrapping. No required owner decision remains for this cart scope. Real-provider/production, spoken AT and external image integration boundaries remain explicit in FINAL-REVIEW.json. No existing customer session was reset.

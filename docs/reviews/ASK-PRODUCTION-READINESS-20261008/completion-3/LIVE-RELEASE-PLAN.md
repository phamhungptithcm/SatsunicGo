# Ask · Kiểm chứng live và phát hành

Execution plan để review, chưa deploy hoặc gọi provider. HEAD hiện53d59bd88fa7da9d1243692336ecd09b6540ea31; worktree có nhiều WIP song song. Hash source-tree diagnostic không thay thế Git candidate/artifact/provider binding.

## 1. Đóng các điều kiện đầu vào

| Gate | Bằng chứng cần có | Hiện tại |
| --- | --- | --- |
| Nội dung dịch vụ/corpus | Owner-approved exact text, published source/hash/version/locale/window, authenticated active readback | PENDING/UNSET |
| Giao dịch/privacy | Official owner policy về điều kiện còn thiếu; contact/operator/storage/backup phạm vi rõ | PENDING_OWNER |
| Feedback | Owner quyết định30days hoặc giá trị khác; approved operational scope, current strict policy readback | PENDING; chưa activation |
| Panel | Review DESIGN-PLAN v1, r4preview và PANEL-INTEGRATION-ADDENDUM; exact implementation scope/test oracle | PENDING_OWNER; prototype-only |
| Runtime thử | Một môi trường hợp lệ/tài khoản synthetic được phép, nguồn/version đóng băng, auth/AppCheck/MFA không giảm | Frontend5207 sống; Auth19207/Functions15207 không có listener ở check đợt này |
| Gemini | Settled evidence cho hai lượt cũ; reviewed accounting/admission delta nếu muốn mở lại capacity; current pricing/model/region/merchant policy |0unreserved; current production discovery fail-closed; actual cost Unavailable |
| Release candidate | Chọn exact approved source changes, loại WIP không được duyệt, commit/source identity và source manifest | NOT_CREATED |

Không dùng một approval chung để tự điền policy/resource/hash/ngày hiệu lực chưa có. Không restart/reseed shared runtime hoặc lift release holds khi chưa có scope cụ thể. Không thêm service/env/IAM/dependency/CI từ kế hoạch này.

## 2. Reconcile ngân sách Gemini

Ngân sách 50.000₫ do người dùng chốt cho kiểm chứng web research/LLM thật. Đây không phải approval cho ngân sách tìm web trả phí thường xuyên của khách, replenishment/tăng hạn mức, production activation hoặc accounting writes. Mọi caller trả phí trong đợt kiểm chứng phải cùng giới hạn đã duyệt; không chuyển sang helper/pilot khác để né reservations. Operational spending policy và đường accounting/configuration write cần scope/approval riêng.

Hai UTC windows cần đối chiếu:2026-10-08T05:41:17.852Z→05:41:23.350Z và05:45:40.963Z→05:45:43.691Z. Đây là cửa sổ quan sát local, không phải provider billing settlement interval. Lượt1BLOCKED/usage unknown; lượt2validated333tokens. Mỗi lượt25.000₫reserved; tổng50.000₫. Reserve không phải actual charge, blocked không phải zero.

Người có quyền cung cấp bằng chứng được khử nhạy cảm: project/model/region, usage window/SKU count/generate/grounding, charge/currency, credits/adjustments, mức hoàn tất dữ liệu, request/response correlation hoặc isolation/completeness có căn cứ cho cả hai lượt. Không lấy prompts/tokens/private logs/customer records. Nếu charge khácVND, cần phương pháp quy đổi đã duyệt; multiplier ceiling trong source không phải FX quote.

Không tự release dự phòng, tăng ngân sách hay retry paid probe. Existing live helper kiểm tra budget trước credential acquisition; không chạy helper chỉ để tạo zero-cost proof. Settings research cần ledger import đã có50.000₫reserved; không bỏ ledger cũ để tạo capacity mới. Pricing window trong source hết2026-10-09T00:00:00Z: phải xác minh giá/giới hạn hiện hành trước lượt mới, không đổi ngày expiry tùy ý.

Source hiện tại không thể mở lượt production mới chỉ bằng reconciliation hoặc settings: runWebDiscovery yêu cầu importedReservedVnd≥50.000 và reservedVnd≥importedReservedVnd, trong khi researchReservation yêu cầu reservedVnd+25.000≤50.000. Đối chiếu charge thấp hơn không thay admission này. Nếu cần dùng phần ngân sách còn lại sau settlement, phải review một delta accounting/admission riêng: immutable attempt records, bằng chứng settled/unknown, chống release hai lần và concurrent reservation, giữ nguyên ceiling50.000₫; chưa có delta đó được áp dụng. Không reset ledger hoặc giảm import để vượt gate.

Hai strict settings khác nhau: askResearch gồm version/enabled/expiresAt/merchants; askWebDiscovery gồm enabled:true/version/termsReviewed:true/expiresAt/merchantPolicyVersion/budgetImportHash. Vertex target hiện satsunicgo/us-central1/gemini-2.5-flash-lite; callable triển khai asia-southeast1. Xác minh từng region theo đúng dịch vụ, không dùng region của callable thay Vertex. Chưa xác lập settings writer hoặc activation evidence từ packet này.

[Public provider check](PUBLIC-PROVIDER-CHECK.md) xác minh tài liệu chính thức về giá/region và retirement20-10-2026 của model hiện dùng. Chưa có live/project health proof. Cần review lifecycle/migration trước rollout dài hạn; không tự thay model hay suy actual charge/quota từ bảng giá.

## 3. Acceptance matrix

Registry hiện có:79platform targets trong REAL-SCENARIOS.json và75purchase targets trong CHAT-PURCHASE-SCENARIOS.json.154targets là inventory, không phải154livePASS. Các statuses lịch sử giữ nguyên; đợt này58Node release contracts+155focused units và240current static preview runs có phạm vi riêng. Không gộp các tầng thành một tỷ lệ hoàn thành.

| Nhóm | Happy case | Bad case bắt buộc | Evidence live cần lưu |
| --- | --- | --- | --- |
| Knowledge | Official guidance đúng locale/hash/citation | Draft/edit/revoke/expiry/duplicate slug/MFA/locale/over-limit | Current admitted-source readback+retrieval IDs/text |
| Answer/context | Không dấu/typo, follow-up rõ một item, user correction | Sai tiền đề catalog cọc, mơ hồ nhiều item, account/CID/ABA/stale/overflow/injection | Exact customer answer oracle, used source revisions, no private transcript |
| Catalog | Current product/variant/quantity, full server price | Non-orderable/missing/more pages/offline/expired price | Current snapshot/version; bounded coverage explicitly disclosed |
| Research | Authorized merchant, exact model/variant/condition and source-backed comparison | No budget/expired pricing/429/timeout/redirect/privatehost/fakehost/marketplace seller unknown/no review | Grounding/source/seller provenance, rating+count+date or unknown, usage/cost bound |
| Draft/form | Choice fills current task; manual notes remain; chat edits atomic | Unsupported variant/quantity/mixed edit+send/private contact in chat | Form readback and exact validated payload; no inferred financial field |
| Preview/consent | Current displayed exact action; explicit approve/decline | Question/negation/conditional/quoted/mixed/old waypoint/language switch/expiry/revision mismatch | One handler chat/button, preview binding, operation identity |
| Request/quote | Submit once; staff quotation; customer exact-version accept | Duplicate/lost response/reload/stale quote/foreign order | Server order/op/audit readback; zero collected until verified payment |
| Payment | Approved sandbox path and provider status verification | Duplicate/out-of-order webhook/unknown charge/chat paid claim | No real finance mutation without explicit scope; provider authoritative readback |
| Profile/membership | Authorized save/pending invoice with recovery | Locked/foreign/plan change/corrupt storage/auth switch/unknown | Exact domain outcome; invoice≠paid or entitlement |
| Support/document/shipping | Own permitted resource/current route and rate | Foreign/draft/revoked/missing rate/partial delivery/staff-only action | Owner/stage/status readback; missing≠0, no fake ETA |
| Feedback/learning | Current policy consent; withdraw; owner source review | Expired/version changed/replay/foreign/withdrawn/bad holdout/regression | Policy/review/source/evaluation hashes; automaticPromotion=false |
| UI/accessibility | Long form independent scroll, fixed composer, keyboard, small widths | Overflow/IME/Escape/history/focus/error/reduced motion/stale pending | Actual integrated application screenshots/AX/interaction, not prototype only |
| Performance | Warm interaction within reviewed provisional budgets |10cycles listeners/DOM/request growth, repeated long tasks, retrieval/provider tail | Same candidate/environment/data, real timing and limits; no authored-duration proxy |

Run local → isolated authorized emulator → provider pilot → integrated test account → deployed acceptance, preserving layer labels. Existing shared backend absence blocks actual handler E2E now; source/unit/fixture cannot substitute. Add endpoint/configuration availability as an admission check before scenarios.

## 4. Immutable artifact

Existing source workflow `.github/workflows/release.yml`: quality → choose version/candidate → release build once → artifact/checksum → production environment → verify immutable artifact and current head → provider inventory check → promote precompiled package → provider readback → publish verified release.

Preparation after candidate approval:

1. Freeze candidate Git SHA and explicit reviewed file/source manifest. Current dirty493pathdiagnostic input is not that candidate. Coordinate Analytics and other work; do not sweep WIP into release.
2. Run required quality/security/unit/rules/browser/acceptance for exact candidate. Current local applied two-file review remains evidence only for its scope.
3. Build once with verified production public configuration through existing release:build; inspect frontend/assets/backend/library freshness/standalone dependency lock. Never access/print credential payloads or copy `.env` into artifact.
4. Existing artifact helper applies eight holds including cleanup; verify exact held/remaining inventory and compiled bindings. Keep all previous holds. Any lifted hold needs its own source/risk/approval/readback scope.
5. Package immutable bundle+manifest+checksum+candidate+notes and verify extraction/path safety. Record actual artifact hash, source SHA, test receipts and deployment plan. Placeholders in this packet are not a created artifact.
6. Stop at concrete candidate/artifact review before authorized external promotion. Push-to-main triggers release; do not push merely to save local work. Do not rebuild an already published/draft artifact during retry.

## 5. Rollout / rollback

Before promotion: verify provider inventory to prevent implicit Function deletion, selected project/region/auth/AppCheck/config, baseline artifact availability and rollback owner. Packaging hold cannot deactivate an existing scheduler; don't assume cleanup absent from selected metadata. No production deletion or datafix from this plan.

After authorized promotion: compare Hosting metadata/static hashes, Function source packages and active revisions to the exact artifact; re-read public metadata; run authorized AppCheck/identity-bound service and task acceptance. HTTP200/ACTIVE/build success alone is insufficient. Verify limited rollout/canary and agreed monitoring; no payment/refund/retention success claim from response text.

On failure: stop new dispatch where existing authorized controls allow; preserve unknown operations for reconciliation, inspect provider state before retry/rollback, restore an original tested approved artifact and its source revision. No guessed retry identities, blind payment retry, policy reversal deleting data or permanent feedback deletion. Record partially deployed state and exact recovery evidence. Rollback rehearsal/provider acceptance are NOT_RUN here.

## 6. Handoff

Return current exact-source review, all check results with tier, artifact/provider identity, acceptance gate outcomes, unresolved risks, token usage and actual/estimated cost availability. Only after all required gates have current evidence may Production become READY. Current result remains NOT_READY; no release artifact, paid call or deployment was created by this plan.

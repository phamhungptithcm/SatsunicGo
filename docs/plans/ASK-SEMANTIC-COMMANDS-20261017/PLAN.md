# Ask Anything — Gemini hiểu ý định và tạo lệnh có cấu trúc

Plan ID: `ASK-SEMANTIC-COMMANDS-20261017-v1`.
Status: `APPROVED`; see APPROVAL.md for explicit human authorization and subsequent scope deltas.
Ngày: 2026-10-17. The following is the original planning baseline; current implementation and release evidence are in REVIEW.md.

## Kết quả cần đạt

Khách diễn đạt tự nhiên bằng tiếng Việt hoặc tiếng Anh. Gemini hiểu câu hiện tại cùng ngữ cảnh hội thoại, chọn capability được hỗ trợ và cung cấp tham số. Ask kiểm tra rồi gọi handler nghiệp vụ tương ứng. Không yêu cầu khách dùng đúng mẫu câu; không chuyển lời khách thành một câu mẫu rồi chạy lại regex.

Ví dụ: “đồ mình tới đâu rồi”, “kiểm tra giúp kiện đang về”, “where is my package?” cùng dẫn tới tra cứu khi ngữ cảnh xác định được đúng đơn. “lấy thêm một cái nữa” sửa số lượng của món đang chọn khi tham chiếu rõ ràng; nhiều món thì hỏi món nào. “chưa mua đâu, xem giá trước” chỉ tra cứu. Mọi ví dụ ở đây là tiêu chí dự kiến, chưa phải kết quả Gemini thật.

## Repository intelligence brief và evidence

- HEAD: `99822aae502cc75406184ee345e4527c6e0db66d`; worktree có nhiều WIP. Không lấy HEAD làm đại diện nội dung đang sửa.
- Gate ban đầu DEGRADED do cả hai index stale; đã refresh một lần và chạy lại: CodeGraph Current/health Passed, CocoIndex Current/health Passed, gate READY.
- Đã query CodeGraph trước CocoIndex; kết quả được đối chiếu với source, manifests và các test liên quan. Đây là khảo sát phạm vi Ask, không phải audit toàn repo.
- `.ai/context/repository-map.md` và `build-test-commands.md` còn là placeholder; lệnh/runtime lấy từ package manifests.
- Stack: React 19, TypeScript 6, Zod 4, Firebase Functions Node 22, Genkit/Google provider; Vitest và Playwright.
- Plan nền tham khảo: `docs/plans/ASK-PLATFORM-20261007/PLAN.md`. Các capability trong tài liệu cũ là mục tiêu; chính sách và source hiện tại có thẩm quyền hơn.
- `src/features/ask/Ask.tsx:1077` xử lý câu chat, nhiều nhánh local return trước `askService` ở khoảng dòng 2130: request assistance, mixed reads, tracking, chat action, draft, FAQ, catalog.
- `packages/domain/chat-action.ts:3` — `customerChatAction` dùng regex neo đầu/cuối cho submitRequest, acceptQuote, approveFinal, confirmReceipt. `packages/domain/ask-task-frame.ts:51` dùng trusted lexical detectors để tách bounded reads.
- `functions/src/ai/ask.ts:88` — project satsunicgo đi qua `pilotAnswer` trước nhánh Genkit phía dưới. Chỉ thêm tool vào nhánh Genkit sẽ không giải quyết nhánh project này.
- `functions/src/ai/ask-pilot-answer.ts:23` — output chủ yếu answer/draft, `action` bị chuẩn hóa thành request/workflow. Draft kiểm tra chuỗi từ câu hiện tại ở khoảng dòng 145; có thể từ chối thông tin được diễn đạt khác hoặc trải qua nhiều lượt. Cần thay kiểm tra ý nghĩa bằng binding tới dữ liệu/ngữ cảnh, giữ kiểm tra schema và nghiệp vụ.
- `packages/domain/ask-stream.ts:4` — response strict, chưa có discriminated command plan. `action: string` hiện tại không phải quyền gọi handler bất kỳ.
- `useActionPreview.ts`, `action-preview.ts`, `ask-workflow.ts` đã có preview, version, owner, operationId/hash và recovery. Tái sử dụng; model không tự sinh approval, giá hoặc quyền.
- Các file Ask.tsx, ask.ts, ask-pilot-answer.ts, transport.ts đang có thay đổi trước task này. Phải so lại diff/hash trước sửa, giữ WIP; material overlap cần giải quyết rõ ràng.

## Thiết kế được đề xuất

1. Với câu chat tự do trong phiên đủ điều kiện AI, gọi semantic planner ở backend trước các nhánh lexical có thể trả lời kết thúc. Giữ nút UI/command có cấu trúc và recovery đang chờ theo handler hiện tại. AI chưa được phép/không hoạt động thì giữ tính năng hiện có và thông báo đúng khả năng tạm thời; không gán “không hỗ trợ” chỉ vì parser không khớp.
2. Planner nhận câu nguyên bản đã lọc dữ liệu nhạy cảm, các lượt gần đây có ranh giới user/assistant, task snapshot có owner/version và danh sách capability đúng phiên. Không gửi toàn bộ hồ sơ, địa chỉ hoặc dữ liệu thanh toán tới model. Client context chỉ là gợi ý; server xác thực đối tượng và dựng dữ liệu có thẩm quyền.
3. Output versioned discriminated union: `answer`, `clarify`, `read`, `draft`, `review`, `unsupported`. Mỗi command có enum capability, params schema riêng và reference tới context đã kiểm chứng. Chỉ registry xác định read/draft/write và yêu cầu confirmation; không tin nhãn an toàn hoặc confidence do model khai báo.
4. Lệnh đọc: tracking, catalog search, shipping fees, membership/public knowledge. Dùng API/adapter hiện có. Cho phép tối đa 4 reads độc lập, dùng scheduler giới hạn 2 concurrent; thiếu tham số hoặc phụ thuộc chưa được giải thì hỏi lại, không chạy phần ghi chen vào.
5. Chuẩn bị tác vụ: chọn sản phẩm/variant/quantity, cập nhật draft, mở request assistance/profile/membership. Không đoán productId, orderId, giá, thị trường hay quantity mặc định. “hai” có thể thành 2; định danh lấy từ exact input hoặc server-owned context, không dùng fuzzy guess.
6. Hành động hiện có: registry chuyển proposal thành command cho preview hiện tại. Model có thể nhận diện “đồng ý” theo hội thoại, nhưng kết quả chỉ được xét khi tồn tại preview đang hiển thị, cùng owner/conversation, hash/version và chưa hết hạn. Phủ định, câu hỏi, ý định có điều kiện hoặc vừa sửa nội dung không tạo consent. Không có preview hợp lệ thì tạo review trước. Server vẫn kiểm tra quyền/state/idempotency khi thực thi.
7. Trả kết quả từ handler, phân biệt prepared/review/committed/unknown. Không dùng lời model làm bằng chứng thành công. Timeout, sai schema, unsupported tool, context đổi, quota hết: không ghi dữ liệu và không tự retry mutation. Khách vẫn có đường tiếp tục tác vụ hiện có.
8. Ngữ cảnh theo nhiều lượt và tình huống mơ hồ phải hỏi đúng phần thiếu; không yêu cầu viết lại theo câu mẫu. Không tự chạy lại câu cũ sau khi đăng nhập/đổi tài khoản.

Scope covers natural-language dispatch for existing customer capabilities, not new business powers. Listed items continue through catalog/cart; custom request preparation uses the existing request flow. Legacy order actions retain their recorded workflow. Payment status remains provider/backend authoritative. Current US-to-Vietnam availability and paused routes are unchanged.

Google documents structured output and function calling; valid JSON does not establish semantic correctness. Start with bounded structured JSON through the current provider transport and application validation. Verify schema support against the installed provider/model before choosing responseSchema syntax; do not change model/dependencies to force it.

References: https://ai.google.dev/gemini-api/docs/structured-output and https://ai.google.dev/gemini-api/docs/function-calling (consulted 2026-10-17).

## File-by-file implementation plan after approval

| File | Planned change |
|---|---|
| NEW `packages/domain/ask-command-plan.ts` | Versioned output union, params schemas, bounded plan validation; no arbitrary names/code/URLs |
| NEW `functions/src/ai/ask-command-planner.ts` | `planAskTurn`: registry-driven prompt, trusted snapshot binding, output admission; proposal only |
| NEW `functions/src/ai/ask-command-admission.ts` | `admitAskPlan`: resolve references and allowed capabilities against current owner/task/state; reject injected IDs/actions |
| `functions/src/ai/ask.ts` | Route eligible free-text turns through planner before lexical evidence shortcut; preserve auth/AppCheck/risk/admission |
| `functions/src/ai/ask-pilot-answer.ts` | Integrate plan and answer without duplicate generation; replace single-turn literal draft checks with validated context/provenance; preserve citation and stale-context guards |
| `functions/src/ai/server-context.ts` | Minimal validated task references/capability input; recheck stamp; no new private context exposure |
| `functions/src/ai/ask-production.ts`, `ask-pilot.ts` | Bounded structured-output request if supported; preserve countTokens, reservation, quota, deadlines, environment/policy gates and completion receipt |
| `packages/domain/ask-stream.ts`, `src/features/ask/knowledge.ts`, `transport.ts` | Optional versioned plan response, strict parsing, legacy response compatibility and stream/final agreement |
| NEW `src/features/ask/command-dispatch.ts` | Explicit mapping to existing read/draft/workspace/review handlers; no dynamic function lookup or text rewrite |
| `src/features/ask/Ask.tsx` | Semantic path for eligible free text; reuse UI handlers and ownership/cancellation fences; no duplicate local/model action |
| `src/features/ask/useActionPreview.ts`, `packages/domain/action-preview.ts` | Only if needed: consume a typed contextual consent candidate under existing preview binding; preserve hash/version/expiry checks |
| Focused unit/handler/component/browser tests; this plan's evidence folder | Paraphrase eval, negative cases, baseline regressions, product-content review and final review |

No business-handler rewrites, new collection/migration, infrastructure, CI, dependency upgrade, provider enablement, push or deploy in this scope. Need broader contract/domain change: document delta before editing. Old strict clients reject new response fields: request must opt into plan protocol; server returns legacy shape without opt-in. Release ordering and rollback must account for mixed client versions.

## Risk and trade-offs

Risk HIGH: language understanding now proposes actions across account/order/cart boundaries. The smallest safe implementation adds semantic planning/admission/dispatch while retaining business executors. More keyword synonyms would not meet the requirement. Replacing all workflows with an autonomous agent would expand scope unnecessarily.

Latency and paid calls may increase when free-text turns previously resolved locally. Use one bounded planning generation per turn initially, preserve existing spend limits, no automatic repair loop or retry. If current token/output envelope cannot fit the capability contract, reduce per-context capability descriptions or seek a budget delta; never silently raise limits. Record non-sensitive outcome/reason/latency through existing telemetry only; no raw prompts, private args or new analytics consent behavior.

Unknowns: deployed AI admission/config and model access, actual paraphrase quality, guest AI requirements (current model endpoint requires verified Google), full browser/runtime behavior and concurrent WIP ownership. Guest public actions remain available; enabling anonymous paid AI is outside scope. No live provider access/activation assumed.

## Acceptance and verification

- Same business intent expressed differently reaches the same capability without matching a phrase list. Build at least 10 independently phrased examples per supported intent across Vietnamese, unaccented Vietnamese, English, typos and spoken numbers. Include held-out cases absent from prompt examples. Report model results separately from mocks; every incorrect consequential dispatch blocks acceptance.
- Multi-turn examples: “món thứ hai”, “thêm một cái”, “đơn vừa nãy”; correct binding or specific clarification. No stale/cross-account execution.
- Negation/questions/conditional examples: “đừng đặt”, “chưa thanh toán”, “giá hợp thì mới mua”, “đã thanh toán chưa?”. No consent inferred from these.
- Missing/ambiguous entities, several orders/items, unsupported capability, prompt injection, invented IDs/price, malformed output, wrong version, stale context and revoked eligibility produce safe, truthful results.
- Provider timeout/quota/offline, duplicate send, lost response, cancellation, logout/login/account switch preserve existing recovery and avoid duplicate operations.
- Integration invokes actual Ask handler with controlled provider output and actual admission/executor boundaries; spies confirm zero writes on rejected plans. Test project-specific pilot/customer and nonproduction branches, plus old clients without protocol opt-in.
- Browser on shared `http://127.0.0.1:5207`: complete read, draft, clarification, review/confirm, cancellation and error paths, both languages, mobile/keyboard. Do not start another server; preserve emulator data/config.
- Apply universal/TypeScript/web/API/database/concurrency/privacy profiles as relevant. Complete Product Language Gate with changed-string/state inventory and current in-context evidence. Run typecheck, targeted lint and affected regression tests. Final implementation review must pass after fixes before implementation handoff.

## Current task report

- Investigation and concrete plan: complete. Implementation: awaiting approval under repository existing-system gate.
- Baseline validation: `npx vitest run tests/unit/ask-task-frame.test.ts tests/unit/action-preview.test.ts tests/unit/ask-pilot106.test.ts` — 3 files, 125 tests PASS. These validate existing behavior only; no new semantic capability proven.
- Application edits: none. Shared runtime restart: none. Live Gemini/browser/deployed verification: NOT_RUN. Production readiness for this change: NOT_READY.
- Final implementation review: NOT_RUN (no implementation yet); no implementation-success claim. Plan checked against source and boundaries once; execution proof remains future work.
- Token usage and actual billed cost: Unavailable. Memory candidates: None.

Approval requested for this exact plan v1, local implementation and validation only. Existing historical approvals do not establish approval for this new semantic dispatch change.

# Ask continuous conversation — design proposal

Status: **PROPOSAL / APPLICATION NOT IMPLEMENTED / LAYOUT APPROVAL PENDING**. The latest human feedback rejects the current dense arrangement of boxes and regions and asks for a continuous chat. This document and the HTML below are the only changes in this design slice. Prior panel approval does not authorize this new layout automatically. Root will present the concrete preview for approval; no additional application, transport, policy or dependency changes are made here.

Preview: [ASK-CHAT-CONTINUOUS-20261009.html](../../../previews/ASK-CHAT-CONTINUOUS-20261009.html). It is self-contained, uses local interactions only, contains no resource imports, storage or provider transport, and requires no additional server. Root renders it by fulfilling the existing shared5207 browser route. The literal example product, price, terms and pending identity are illustrative data for reviewing composition, not current catalog/order/business evidence. Confirmation only shows “Confirmation has not been sent. No order has been created.” It never reports a sent command, created order or successful payment. Unknown/loading/unavailable/signed-out/empty are selectable inspection states, not external outcomes.

## Evidence and direction

Intelligence remains **DEGRADED**. Consumed shared integration-4/TEAM-BRIEF-r8.json; its older index/baseline references do not prove today's source. Bounded direct reads of Ask, ActionWindow, useActionPreview and CustomerWorkspace verified critical placement, consent and recovery facts. No index retry, browser test, provider, authentication, runtime import, restart or reseed was performed in this design slice. Repository context map/build-command files are placeholders; they were not treated as facts.

Current source puts a waypoint row above Conversation/Current task controls and places a permanent ActionWindow beside the conversation. ActionWindow repeats the action heading in its heading, review and primary action. Its existing hook supplies immutable canonical review details, a rendered-preview receipt, exact scope admission and pending recovery. The proposed visual simplification must preserve that hook and the Commerce queue, UUID, version, recipient, auth-generation and recovery fences.

Use the project palette first: blue `#163cff`, navy `#111c35`, white, light neutral surfaces and thin borders. The explicitly applied awesome-design-md-ui-ux skill yielded local Claude and Coinbase references. Only their editorial reading rhythm and restrained functional accent informed the proposal; no brand assets, font, copy, protected composition, warm palette or pill-heavy components are copied. Target platform is the web. The repository write-product-content skill and product-content profile apply; the bundled eight principles are a quality reference, with no Apple-platform/HIG compliance claim.

The current [OpenAI UI guidelines](https://developers.openai.com/plugins/concepts/ui-guidelines), read2026-10-09, recommend lightweight inline decisions, one primary with an optional secondary, concise answers that avoid repeating structured content, and no internal tabs, nested scrolling or duplicated chat inputs inside cards. They also favor system fonts, consistent spacing, neutral reading surfaces and restrained brand accents. Applied here as design inference for SatsunicGo's standalone web chat: one stream, one inline decision, one composer, temporary separate editing, and the existing SatsunicGo palette. This is a reference, not repository authority, ChatGPT plugin compliance, copied branding or a new SDK dependency.

Preview refinement r2: initial opening aligns the complete latest turn when it fits; otherwise it aligns the complete review or a clean detail/consequence/action boundary that fits. Small trailing whitespace permits alignment without browser scroll clamping leaving a stray fragment from the previous answer. Older content stays scrollable; no target, total, terms, consequence or state is hidden or fabricated. The reply is shorter and spacing tighter. A separate local readiness boundary prevents yes/named actions from bypassing signed-out/loading/unavailable; rendered admission is bound to unchanged visible review details and cleared when the action is offscreen, history, sheet or closed. These local preview guards are illustrative; production continues using its existing hook/queue, not this script. The short/text-enlarged sheet now has a named-size-container whole-form scroller fallback, and the header can wrap. Source review is not proof of actual keyboard, bounds or hit-testing; root owns the current rendered checks.

## Reviewable composition

One centered reading column, up to680px inside a960px shell, occupies the entire body. The slim header contains the brand, optional history disclosure, small VI/EN controls and close. Remove the always-visible waypoint row, Conversation/Current task tabs, permanent split pane and nested review containers. AI answers use normal text; user questions use one quiet neutral bubble. Keep existing answer contents, source links, catalog results, partial/error qualifications and stop/retry behavior rather than flattening meaningful data.

Place one action summary at its originating turn in the same conversation scroller. It contains a specific target, variant/items, quantity, authoritative money and material terms/consequence, followed by one compact action-specific primary and a secondary text Edit. The example uses catalog checkout. Production must retain all material detail for submitRequest, acceptQuote, approveFinal and confirmReceipt: target order, quoted/final amount, deposit where applicable, quote expiry, all received items and consequence. Reference versions may remain in a native details disclosure; they are never replaced by visually invented values. No repeat “Current task” or action heading. Ordinary answers need no card or boxed heading.

Edit opens a temporary bounded native dialog/sheet with a fixed header, one internal body scroller and reachable footer. It is overlaid temporarily rather than becoming a second permanent reading pane. Native form fields remain mounted and owner-keyed across ordinary close/reopen, and entered values survive cancellation and recoverable failure. Edit invalidates the old review immediately; the sheet's Review selection action prepares a fresh immutable review and returns to the conversation. It is not consent to purchase or payment. Invalid fields stay visible and labelled; absent/invalid totals remain unavailable, never zero or NaN.

History is an optional disclosure/list. Selection enters a clearly labelled read-only history view with a Return to current conversation control; no hidden/current action can accept contextual consent from history. Returning restores reading position and composer focus, but requires current review again. Language changes preserve owner, raw input, operation, draft and history state while invalidating any current confirmation receipt, as today.

Manual form entry for buying requests and dedicated Profile/Membership remains discoverable through the current request/context response and a compact optional task menu; do not recreate an always-visible row of task cards. The catalog preview demonstrates only the commerce sheet. The task menu/native account-sheet composition needs rendered evidence during implementation; it does not grant generic yes/no permission for Profile, Membership or direct payment.

Preview-only r3 corrections: catalog consequence now states payment in full in both languages; the composer receives the shared blue outline when its textarea is focus-visible. The outline is limited to active keyboard focus, with no permanent additional container border. Rendered focus verification remains root-owned; these corrections change no application code or layout composition.

## Exact intended implementation delta, after approval

| Path | Function/region | Intended bounded change |
| --- | --- | --- |
| `src/features/ask/Ask.tsx` | Dialog header, waypoint/workControls/workArea render; ConversationContent; onReview/onEdit/close/Escape handlers | Replace the permanent navigation/split with a single stream and optional history/task disclosures. Place one stable inline summary at a nonauthoritative turn anchor. Track sheet visibility independently of review visibility. Preserve current sendMessage/confirmFromButton/baseCommerce wiring, cancellation, abort, request ownership, transcript and feedback behavior. |
| `src/features/ask/Ask.module.css` | Header, conversation, question/answer, workArea/workControls/waypoints, dialogBottom/composer | Center and bound the stream; remove layout rules for permanent two-column/task tabs; subdued question/composer; responsive header wrapping and one conversation scroller. Keep existing shell focus, idle/open/close and reduced-motion behavior. |
| `src/features/ask/ActionSummary.tsx` (new) | Inline review/pending presentation | Extract the existing review details and exact action labels into one semantic inline component, outside the live log's reannounced content. It invokes the existing handlers and markRendered with the actual visible current preview ID. Pending summary exposes exact-operation Check outcome (Kiểm tra kết quả) or Resume visibly even when the sheet is closed. |
| `src/features/ask/ActionSummary.module.css` (new) | Inline summary styles | One thin separator/surface, compact primary, text Edit; wrapping target/amount and full-width receipt details, no nested cards. |
| `src/features/ask/ActionWindow.tsx` | Current wrapper/header/body/footer | Become only the temporary form sheet. Remove duplicate review/confirm content after extracting it, retain native fields and pending feedback, preserve disabled/inert embedded mutation fences. Escape/Return hides the sheet, never cancels an admitted operation. |
| `src/features/ask/ActionWindow.module.css` | Window placement and header/body/footer | Bounded sheet; one body scroller. At very short/text-enlarged heights the whole sheet becomes one reachable scroller rather than clipping its footer; very short mode avoids an oversized sticky footer. |
| `src/features/ask/CustomerWorkspace.tsx` | show(kind), disabled controls and unique pending kind | **Preserve; no redesign edit proposed.** Root already applied the independently reviewed same-pending-kind reopen correction under prior S18/S19 correctness authority. Keep cross-task navigation, blocked/readOnly and owner/auth fences and retained close/reopen regressions. Do not add a remembered pending state for this layout. Dedicated Profile/Membership controls retain their domain semantics. |

Read-only consumers in this layout plan: `Commerce.tsx`, `CatalogChat.tsx`, `CatalogPurchase.tsx`, `CustomerWorkspace.tsx`, its child Profile/Membership and `customer-workspace.css`. Reuse the current native forms and domain/API behavior. Do not change their persistence, validation, financial controls or money mapping for styling. If rendered evidence requires a consumer/source change outside the six planned layout files above, record a concrete delta before editing. The full operation guards in `useActionPreview.ts` and `packages/domain/action-preview.ts` are preserved dependencies; no schema, preview lifetime, command parser, queue policy or backend changes are proposed.

## Consent, focus, scrolling and recovery risks

1. **Review visibility is authority-sensitive.** Moving markRendered from ActionWindow to ActionSummary must not mark a hidden/history/stale/owner-switched review. Opening a drawer invalidates review; merely receiving “yes” without a current rendered review opens/reveals review with zero dispatch. First named action opens a review, then exact yes/đồng ý or the corresponding primary consumes it once. Mixed edit+approve, questions, conditional and quoted consent never approve. Queue-time synchronous scope/version/auth-generation validation remains unchanged.
2. **Chronology is presentation only.** A turn anchor must never substitute for owner/conversation/order/quote/product versions or operation identity. saveDraft/saveTurn acknowledgements can advance version; current readback and admission remain mandatory. Old confirmations remain read-only, without active confirm controls.
3. **Hiding is not cancellation.** Historical root full139 r3 observation was138PASS/1FAIL: Profile inline-unknown could close the current Profile, then reopening was disabled when open=null/profilePending=true. The same old source guard could affect Membership. Root has now corrected unique-pending-kind reopening under prior S18/S19 authority and reports12/12 Profile cases passed; Membership verification is in progress separately. Preserve this current correction and the existing close/reopen test. Any closed pending drawer leaves a persistent reachable inline Check outcome/Resume for that exact task. Same-pending-kind reopen is allowed; other task switches stay blocked. Close/escape/account switch never creates a replacement UUID, interprets an unknown result as success or loses the stored pending request. This correctness authorization does not approve the new layout.
4. **Two scroll areas exist only during deliberate editing.** Normal chat has one stream; the edit sheet temporarily adds its own body scroller. On open, focus enters a labelled field; native modal semantics keep background controls inert. Escape/Return keeps edits and restores the actual opener, otherwise composer. On fresh review, focus lands on its specific primary after it is rendered, without excessive page movement. History focus returns to its control/current composer. Close restores the shell's existing launcher.
5. **Space and text expansion can hide consequential controls.** Check all header buttons, complete amount/target labels, body/footer and composer at320/390/768/1440, narrow short heights,200% text-size and native zoom where available. Use actual bounding,95% visible area and hit testing, not merely page no-overflow or text-in-button checks. Reduced motion disables added transitions. Native AT announcements remain an independent gate.
6. **Presentation may not hide authority failures.** Keep durable draft-conflict, recipient-verification/retry, listener-ended, saved/editing, pending/unknown and connection states. Direct payment retains current handler readiness and authoritative recipient revision checks. Profile/Membership retain dedicated controls and storage/owner/replay constraints. Recipient/private forms never enter LLM context or new storage.

## Selected verification after layout approval

- Keep `tests/unit/action-preview.test.ts`, current readiness and domain regressions unchanged; add only actual wiring tests if presentation introduces a new admission defect.
- Adapt `tests/browser/ask-workcell.spec.ts` and its owned fixture for single-stream placement, first-review/yes/named/button convergence across five preview actions, mixed edit guards, history/language invalidation, exact money/items/targets, auth ABA and queued version changes. Keep unknown/reconcile identity and no-provider assertions.
- Retain `tests/browser/ask-panel-correctness.spec.ts` source-bound recipient/draft/readback/payment readiness cases and current VI/EN keyboard/long text evidence. Do not change domain oracles to fit new appearance.
- Retain all24 catalog and10 Actual Ask web integration scenarios; retain the7 separate Actual feedback review scenarios (evaluation, acknowledge, resolve, unapproved, unknown, switch, mobile). Adjust only obsolete navigation selectors after approval. Keep ownership/version/product payload, operation/once, recovery, malformed outcome and privacy assertions.
- Keep all29 Membership modes plus the actual same-task close/reopen regression; retain Profile inline-unknown close/reopen coverage in `tests/browser/profile-recovery.spec.ts`, including fail-before proof and account switching. New appearance must not conceal a disabled-recovery dead end.
- Render VI/EN at four widths, short-height and200%text; test native field validation, long form scroll/footer, Escape/return/opener focus, history disclosure keyboard, complete target/amount/terms, preserved inputs, empty/loading/stale/unknown/unavailable/signed-out and actual native AT when host permits. Capture current screenshots/AX and label local synthetic evidence separately from provider/deployed acceptance.
- Root coordinates one shared5207 browser lease, current compiler/scoped lint and targeted/final acceptance, then fresh independent review → fix approved findings → verify → review. No extra server, paid call, production mutation or budget change. Root's candidate dependency/evidence work stays separate. The source-bound full suite and candidate/provider checks must be fresh after application edits, not borrowed from this preview.

## Product Content Review — design slice

Surface: customer Ask web conversation, inline commerce review, temporary native form, history and recovery. Audience: Vietnamese/English customers reading and checking purchases on desktop/mobile. Goal: make discussion and a deliberate review understandable while preserving control, costs, private data and exact outcomes. Reviewer: frontend_engineer,2026-10-09. Applicable web conventions: labelled buttons/fields, native dialog/Escape/focus, disclosure, locale currency and polite statuses. Apple HIG current-platform compliance is not applicable. Safe assumption: illustrative product490000VND ×2, all-inclusive as in catalog source; no live orderability/pricing claim.

Observed static evidence: one main stream, no external resource references or duplicate element IDs, no network/storage primitive; Node22 inline-script syntax check passed. Current app/source unchanged. Render/keyboard/AX/zoom/AT evidence is **NOT_RUN** in this slice because root owns the active acceptance/browser lease. The plan does not call the design polished, accessible, usable or production-ready based on HTML alone.

| State | Coverage in proposal | Current evidence |
| --- | --- | --- |
| Default/review | Exact product/variant/quantity/price/total/terms/consequence; action-specific button and Edit | Authored HTML; rendered NOT_RUN |
| Hover/focus/selected/disabled | Quiet hover, visible focus, labelled language selection, native disabled consequential controls | Static CSS/ARIA; keyboard/AT NOT_RUN |
| Loading/pending | Named work, no fake progress/ETA; unknown persistent inline reconciliation | `?state=loading/unknown`; rendered NOT_RUN |
| Empty | Question-oriented first-use prompt; no invented zero | `?state=empty`; rendered NOT_RUN |
| Success | No simulated durable success. Local confirmation says not sent/no order created | Authored guard; browser NOT_RUN |
| Error/recovery | Unavailable keeps choices; local retry redisplays review; unknown keeps same identity and remains unknown | `?state=unavailable/unknown`; source-only preview model |
| Stale/offline/partial | Stale requires fresh review. Actual offline/partial data must retain production messages; the preview invents no network status | `?state=stale`; production offline/partial NOT_RUN |
| Unauthorized/forbidden | Signed-out boundary preserves choices; no real sign-in. No private existence/owner disclosure | `?state=signed-out`; full auth acceptance NOT_RUN |
| Confirmation/decline/destructive | First request opens review; exact contextual yes; decline preserves draft; no destructive action in this example | Script proposal; executable browser NOT_RUN |

| Principle | Status | Current evidence / verification required |
| --- | --- | --- |
| Purpose | NOT_RUN | Single reading task and inline decision authored; verify current rendered hierarchy with user review. |
| Agency | NOT_RUN | Edit/Escape/history/current-return and no-command local confirm authored; verify keyboard and consent paths. |
| Responsibility | NOT_RUN | Exact amount/terms/no-payment consequence and unknown identity authored; verify all five production actions. |
| Familiarity | NOT_RUN | Standard web buttons, native dialog and disclosure authored; verify actual focus/AT semantics. |
| Flexibility | NOT_RUN | VI/EN, wrapping, short height and reduced motion authored; verify four widths and enlarged text. |
| Simplicity | NOT_RUN | Removed persistent split/tabs/waypoints/repeated heading in preview; user/render review pending. |
| Craft | NOT_RUN | Complete string inventory, persistent fields, unavailable/invalid totals and input preservation authored; current in-context evidence pending. |
| Delight | NOT_RUN | Calm reading space and retained work intended; no forced animation/celebration. Human/render judgement pending. |

Gate dimensions — human principles, target-platform fit, meaning/behavior, audience/business, tone, brevity, states, data/privacy, accessibility, localization/expansion, terminology and in-context verification: **NOT_RUN** for a completed acceptance claim; static intent/evidence above is available for review. Pattern checks for labels, feedback, consequential choices, permissions/privacy and inclusion are authored but rendered NOT_RUN. Onboarding is NOT_APPLICABLE: no tutorial is added. No product-language gate PASS is claimed. Decision: **BLOCKED for successful implementation handoff; reviewable design proposal only**. Outstanding: root's rendered inspection, user layout approval, retained current application regression correction, implementation and mandatory independent review. Production readiness remains separate.

Exact VI/EN inventory below covers every authored copy key. Also retained literal brand SatsunicGo; languages VI/EN/Tiếng Việt/English; sizes M/L/XL; numeric constraints1–30 and local VND formatting; variant separators and áo/shirt/shirts reflect selection data, not authoritative account/order values. User-entered messages and notes are displayed literally via textContent, remain unchanged across language switch and never sent or persisted by this HTML.

| Key / state | Vietnamese | English |
| --- | --- | --- |
| shell | Hỏi SatsunicGo | Ask SatsunicGo |
| controls | Điều khiển hội thoại | Conversation controls |
| history | Lịch sử hội thoại | Conversation history |
| historyTitle | Hội thoại gần đây | Recent conversations |
| currentItem | Áo thun AIRism | AIRism T-shirt |
| currentDetail | Lựa chọn hiện tại | Current selection |
| oldItem | Phí vận chuyển từ Nhật | Shipping from Japan |
| oldDetail | Chỉ xem lại | Read only |
| language | Ngôn ngữ | Language |
| close | Đóng hội thoại | Close conversation |
| reopen | Hỏi SatsunicGo | Ask SatsunicGo |
| initialQuestion | Áo AIRism này có thể đặt được không? | Can I order this AIRism T-shirt? |
| initialAnswer | Bạn có thể chọn mẫu và số lượng trước khi tạo đơn. Giá trọn gói của mẫu này là 490.000 ₫ mỗi áo. | Choose a variant and quantity before creating an order. The all-inclusive price for this variant is ₫490,000 per shirt. |
| selectionQuestion | Chọn giúp tôi 2 áo màu trắng, size M. | Choose 2 white shirts in size M. |
| selectionAnswer | Bạn xem lại mẫu và tổng tiền trước khi tạo đơn. | Check the variant and total before creating your order. |
| product | Áo thun AIRism | AIRism T-shirt |
| unit | Đơn giá trọn gói | All-inclusive unit price |
| total | Tổng thanh toán | Total |
| terms | Điều khoản mua hàng | Purchase terms |
| termsValue | Phiên bản 1.2 · Áp dụng cho sản phẩm và lựa chọn đang hiển thị. | Version 1.2 · Applies to the product and selection shown here. |
| consequence | Tạo đơn theo lựa chọn này. Bạn sẽ kiểm tra thông tin nhận hàng trước khi thanh toán toàn bộ. Bước này chưa thu tiền. | Create an order for this selection. Review delivery details before paying in full. This step does not collect payment. |
| confirm | Tạo đơn sản phẩm | Create product order |
| edit | Sửa | Edit |
| editName | Sửa lựa chọn | Edit selection |
| hint | Bạn cũng có thể nhắn “đồng ý”, hoặc “chưa” nếu muốn kiểm tra thêm. | You can also reply “yes”, or “not yet” if you want to review further. |
| message | Nhắn SatsunicGo | Message SatsunicGo |
| placeholder | Hỏi hoặc chỉnh lựa chọn… | Ask a question or edit your selection… |
| send | Gửi tin nhắn | Send message |
| privacy | Khi dùng AI, câu hỏi có thể được Google xử lý. Không chia sẻ thông tin nhạy cảm. | When AI is used, questions may be processed by Google. Avoid sharing sensitive information. |
| log | Tin nhắn mới | New messages |
| sheetTitle | Chỉnh lựa chọn | Edit selection |
| sheetHelp | Thay đổi tại đây được giữ trong hội thoại. Kiểm tra lại trước khi tạo đơn. | Changes here stay in the conversation. Review them again before creating an order. |
| productLabel | Sản phẩm | Product |
| colourLabel | Màu | Colour |
| white | Trắng | White |
| black | Đen | Black |
| sizeLabel | Size | Size |
| quantityLabel | Số lượng (bắt buộc) | Quantity (required) |
| quantityHelp | Từ 1 đến 30 áo. | From 1 to 30 shirts. |
| notesLabel | Ghi chú (không bắt buộc) | Notes (optional) |
| notesHelp | Ví dụ: ưu tiên cùng một lô hàng. | For example: prefer items from the same batch. |
| draftNotice | Chưa tạo đơn hoặc thanh toán. | No order or payment yet. |
| back | Về hội thoại | Return to chat |
| reviewAgain | Kiểm tra lựa chọn | Review selection |
| stale | Kiểm tra lại lựa chọn trước khi xác nhận. | Review your selection again before confirming. |
| invalidQuantity | Số lượng cần kiểm tra lại | Quantity needs review |
| unknownTotal | Chưa tính được | Not available |
| declined | Lựa chọn vẫn được giữ. Bạn có thể sửa hoặc kiểm tra lại khi sẵn sàng. | Your selection is kept. Edit or review it when you are ready. |
| firstReview | Xem lựa chọn và tổng tiền bên trên trước khi xác nhận. | Review the selection and total above before confirming. |
| notSent | Xác nhận chưa được gửi. Đơn hàng chưa được tạo. | Confirmation has not been sent. No order has been created. |
| notSentButton | Chưa gửi | Not sent |
| unknown | Chưa xác minh được kết quả tạo đơn. Kiểm tra kết quả trước khi gửi lại. | The order outcome has not been verified. Check the outcome before retrying. |
| reconcile | Kiểm tra kết quả | Check outcome |
| reconciling | Đang kiểm tra kết quả… | Checking the outcome… |
| stillUnknown | Chưa xác minh được kết quả. Yêu cầu đang chờ vẫn được giữ. Liên hệ hỗ trợ nếu cần. | The outcome could not be verified. Your pending action is kept. Contact support if needed. |
| loading | Đang kiểm tra lựa chọn… | Checking your selection… |
| unavailable | Chưa tải được thông tin để xác nhận. Lựa chọn của bạn vẫn được giữ. | Details could not be loaded for confirmation. Your selection is kept. |
| retryLoad | Thử tải lại | Retry loading |
| signedOut | Đăng nhập để kiểm tra lựa chọn trước khi tạo đơn. | Sign in to review this selection before creating an order. |
| signIn | Đăng nhập | Sign in |
| signInUnavailable | Chưa đăng nhập được. Lựa chọn của bạn vẫn được giữ. | Sign-in did not finish. Your selection is kept. |
| empty | Bạn muốn hỏi về sản phẩm hay theo dõi đơn hàng? | Would you like to ask about a product or track an order? |
| historyNotice | Bạn đang xem lịch sử. Không thể xác nhận tại đây. | You are reading history. Confirmation is unavailable here. |
| returnCurrent | Về hội thoại hiện tại | Return to current conversation |
| oldTitle | Phí vận chuyển từ Nhật | Shipping from Japan |
| oldQuestion | Phí vận chuyển từ Nhật tính thế nào? | How is shipping from Japan calculated? |
| oldAnswer | Phí phụ thuộc vào tuyến vận chuyển và trọng lượng. Xem báo giá của đơn để biết số tiền áp dụng. | The charge depends on the route and weight. Review your order’s quote for the amount that applies. |
| historyBlocked | Về hội thoại hiện tại để chỉnh lựa chọn hoặc xác nhận. | Return to the current conversation to edit or confirm. |
| mixed | Đã chỉnh lựa chọn. Kiểm tra lại nội dung và tổng tiền trước khi xác nhận. | Your selection changed. Review the details and total again before confirming. |
| generic | Bạn có thể hỏi tiếp, hoặc chọn “Sửa” để chỉnh mẫu và số lượng. | Ask another question, or choose “Edit” to change the variant and quantity. |
| pendingReply | Chưa xác minh được kết quả yêu cầu trước. Kiểm tra kết quả trước khi gửi yêu cầu khác. | The earlier outcome has not been verified. Check it before sending another request. |

## Current source boundary

The table records the historical source read for the initial design. Root's subsequent approved correctness fix is independently maintained in shared and candidate `CustomerWorkspace.tsx`, current SHA256 `ee1c9ca83558ec940b0ddbecaf6a381657a50020590e46a53586aa53a6a5e4bf`. Preserve that successor; the older hash below is not a current implementation claim.

| File | SHA256 at design read |
| --- | --- |
| Ask.tsx | `1d3b3488d2f70d9d892f2793bb7570d96f09c592505f0658312c503abefaf47c` |
| Ask.module.css | `c6fc8525db2225f3b5baf7503707254a9088a022649cffd38b9bf275cd357c09` |
| ActionWindow.tsx | `b841591dd82ae86a4410c2385d949abc3d38e58185d21373f091032b88296a22` |
| ActionWindow.module.css | `4527a674a488cae15c07f16047bcbf245b5a29b971aad55eb2c4ad22beb8b9b1` |
| Commerce.tsx | `6b5f8e3823d584f281bed59f00c35a32654669dcf5254ca3f77750a9cf5b7c55` |
| CatalogChat.tsx | `d845859226371021286de977a2636abea6097c8174f4a3573b7936c770d78489` |
| CustomerWorkspace.tsx | `5c730523a9aaf93c61d7132c9afa6b10b0ff35810101a82d23bc80850e47cdb2` |
| useActionPreview.ts | `cbf01fb1209a3211070bc54a3acca0c72b8c9932e3535ad8d1b6ccffc1f151b7` |
| packages/domain/action-preview.ts | `6ee6f5edb8912b806deea82ad432768cf319295274cdfe135bb0ef8eb0c73337` |

Rollback/operations: this proposal is two new docs only; remove/supersede them without application impact. Future layout rollback preserves domain guards and immutable pending state; never reverts unrelated WIP or erases admitted operations. No dependency/API/schema/backend change proposed. Memory candidates: None. Token/cost usage: unavailable here; no paid provider request performed.

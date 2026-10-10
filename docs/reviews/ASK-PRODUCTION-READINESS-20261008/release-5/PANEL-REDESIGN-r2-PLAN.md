# Ask continuous conversation inside the existing panel — r2

**DESIGN ONLY · APPLICATION UNCHANGED · LAYOUT APPROVAL PENDING.** Human feedback rejected the standalone composition and asks for a natural ChatGPT-like chat with everything inside the existing Ask panel. This new proposal supersedes that approval request. The earlier ASK-CHAT-CONTINUOUS-20261009.html and CHAT-REDESIGN-PLAN.md remain rejected historical proposals. Earlier panel/correctness approval does not approve this material layout delta.

Preview: [ASK-PANEL-CONTINUOUS-r2-20261009.html](../../../previews/ASK-PANEL-CONTINUOUS-r2-20261009.html). This plan and that new HTML are the only authored files in this slice. Root owns browser rendering on shared5207 and subsequent presentation for concrete approval. No application, provider, dependency or runtime change.

## Source evidence and direction

Shared release-5/BRIEF.json revision1 records **DEGRADED** intelligence: installed indexes are stale. Root permits bounded source fallback; no index retry, READY or completeness assertion. Critical placement, route, consent and recovery facts were checked in current source. No browser test, application import/build, authentication/provider request or server work was performed here.

The preserved release-5 candidate App.tsx:490–492 mounts Ask only after auth readiness and outside CRM. Current concurrent shared App.tsx:494–496 has the same route fence. Preserve that route boundary; this is no new CRM integration. The inert background is a **static source-derived public chrome proxy**, using SiteChrome.tsx:250+ brand/navigation and global.css:704+/1436+/1490+ public82px desktop/76px compact framing. The page body is neutral, with no account/private data, invented metrics or live product claim. This is not actual React route/auth acceptance. The Ask-only workcell fixture does not prove a CRM host.

Ask.module.css:137–164 defines outer desktop width min(1180px, calc(100% - 40px)), height min(920px, calc(100dvh - 40px)), bottom max(20px, safe-area-inset-bottom), radius28 and overflow hidden. The actual600px breakpoint uses width calc(100% - 28px), height min(760px, calc(100dvh - 32px)), bottom16/safe-area and radius24. The new HTML preserves that footprint. Current waypoints, Conversation/Current task controls and permanent two-column ActionWindow are the presentation being reconsidered.

Ask.tsx:841+ prevents parent closure during operationMode.current === commit; interrupt():817+ guards commerce busy/pending. onCancel:2436+ leaves task view before closing. Preserve these guards and immutable hook/Commerce queue authority. Current CustomerWorkspace.tsx already has the reviewed unique-pending-kind reopen correction under prior S18/S19 correctness authority; preserve it and the existing close/reopen regression. That applied correctness work is separate from this unapproved layout.

Use project design first: blue #163cff, navy #111c35, white, neutral reading surfaces and native controls. Applied awesome-design-md-ui-ux local Claude/Coinbase references informed reading rhythm only, without copied assets/branding/composition/dependency. Repository write-product-content and its web/eight-principle contracts apply. The [official OpenAI UI guidelines](https://developers.openai.com/plugins/concepts/ui-guidelines), read2026-10-09, favor concise responses, lightweight inline decisions, one primary/optional secondary and neutral surfaces without nested card tabs or duplicated chat input. Applied as standalone SatsunicGo design inference, not repository authority, plugin compliance or an SDK dependency.

## Reviewable in-panel composition

One centered stream up to680px and one composer live inside the existing outer panel. A slim wrapping header contains brand, History, VI/EN and Close. No permanent waypoint chips, Conversation/Current task tabs, split pane or nested review cards. A quiet user question leads to a plain assistant answer and compact inline material summary. The initial illustrative turn starts complete at the top; there is no cut preceding answer or synthetic end spacer. Additional local messages extend the same stream. Preserve actual answer contents, source links, catalog results, feedback, error/partial qualifications and stop/retry behavior during implementation.

The inline catalog example contains product/variant/quantity, unit/total, terms and consequence, with one specific primary and text Edit. Illustrative price490000VND ×2 and terms1.2 inspect composition only, proving no current price/orderability. The consequence states delivery details are checked **before paying in full**, and creating an order does not collect payment. The five actual preview actions must retain market/items/store/budget, order target, deposit where applicable, quote expiry, final amount and all-received-items completion semantics from current canonical data.

Edit replaces only the middle reading region with a named internal section/form. It is not a second dialog or top-layer modal. Header and composer stay inside the panel. Desktop color/size/quantity share one native labeled row without a card/border; narrow screens use color/size in two columns and full-width quantity, with16px input text. Normal form height has one body scroller and reachable footer. A named middle-size container switches short/text-enlarged forms to **one whole-form scroller**, with no sticky footer obscuring fields. History means earlier messages in the same conversation, shown as a temporary list in the same middle region; no stored-thread switching capability or viewport popover is proposed. Only one reading/form/list view is active.

The visible composer is **paused while editing or selecting history**, with a localized explanation/placeholder. Typed composer text and editor fields stay mounted locally. Return/Escape restores the current stream/reading position and opener focus. Review selection performs native field validation, prepares a fresh immutable review and returns to the chat; it does not purchase or pay. Escape closes editor/list, then leaves read-only history, then closes the parent subject to production fences. The HTML models a bounded outer role=dialog and keyboard wrapping with inert public background; internal views have no aria-modal, inner focus trap or showModal.

This preview demonstrates **catalog quantity/variant only**. Profile/address/recipient/Membership private forms remain dedicated native forms outside illustrated interactions. Do not create new copies of their values, saved summaries or unsaved changes in chat bubbles, model context, logs or browser storage, or use them as generic yes/no payloads. Preserve authorized native-form server persistence through saveProfile/saveAddress and existing Membership/recipient operations. Keep their distinct Save/Cancel, validation, owner-keyed state and saved/readback semantics. No generic private-form chat editing/approval is authorized. Existing manual-request/Profile/Membership entry paths must remain reachable; deleting their controls is not part of this simplification.

Unknown outcome keeps the exact target/operation and persistent **Kiểm tra kết quả / Check outcome**. No new UUID, success assumption or blind command retry. When a private form is hidden, the conversation must still expose Resume/Check outcome for the unique current pending kind, preserving cross-task/blocked/read-only/auth fences. The local outcome check stays unknown. Local confirmation explicitly says not sent/no order created; no simulated durable success, payment, sign-in or provider outcome.

## Current business forms and preserved contracts

| Current source / native form | Internal view mapping and preserved meaning |
| --- | --- |
| CatalogPurchase.tsx / CatalogChat.tsx and domain/catalog-checkout.ts:29–36 | Actual selection contains productId, productVersion, quantity1–100 and one canonical variant; no notes. Internal editor reuses published product/options and Review selection. The preview color/size row illustrates sample options only; production cannot compose unsupported color/size combinations or change the variant schema. Use the actual canonical option when no supported decomposition exists. Inline Create product order prepares catalog checkout, then recipient check and full payment; never notes/deposit or synthetic success. |
| Commerce.tsx:1307–1510 custom buying-request draft | Reuse marketUS/JP/KR, per-item name/link/variant/quantity1–100 and request Notes; preserve any existing preferred-store/budget/date/condition fields already in the canonical draft. Save draft remains explicit; Send buying request is a fresh inline review and quote request, no purchase/payment. Research price is never an official quote. |
| Commerce.tsx:1635–1816 recipient | Saved-address selector and native recipient/phone/address stay private in the internal form, with explicit save. Keep dirty/verification/current-revision/read-only retry boundaries and authoritative readback before accept/payment. Return does not publish fields to chat. |
| Profile.tsx:430–490 and568–636 | Dedicated displayName/businessName/marketingConsent and address recipient/phone/address forms retain native Save, optionality, required limits and separate saved/recovery state. No generic chat approval; raw fields stay private. |
| Membership.tsx:350–600 | Dedicated plan selection, renewal intent, invoice/history/cancel/recovery controls retain actual published plans, prices/terms and separate membership payment semantics. No invented free/paid activation or generic chat-confirmation. Unique-pending-kind Resume remains reachable. |
| Existing acceptQuote / approveFinal / confirmReceipt ActionWindow | Inline canonical target/money/expiry/deposit/final/all-item details; dedicated recipient/private editor as needed. Receipt confirms all items and completes order. Current specific command/queue/readiness controls stay authoritative. |

Business review corrections in this frozen proposal: unsupported catalog Notes field/summary removed (createCatalogOrder sets notes empty); history copy distinguishes catalog all-inclusive price from a custom request's official quote; negated, conditional, question or quoted quantity text asks for clarification and leaves selection unchanged. Clear positive edits invalidate review; mixed edit+approve cannot purchase. Custom-request Notes remain part of the actual custom form, not this catalog illustration.

## Exact proposed application delta — only after approval

| File | Region / bounded intended change |
| --- | --- |
| src/features/ask/Ask.tsx | Header/waypoints/workControls/workArea and ConversationContent: single stream, optional internal history/editor, stable presentation-only inline-review turn anchor, inner-first Escape/opener/reading restoration. Preserve send/confirm wiring, transcript/feedback, ownership, cancellation and parent commit/pending fences. Guard composer handler while the form/history is active. |
| src/features/ask/Ask.module.css | Preserve outer footprint and600px breakpoint; remove permanent split/tab/waypoint layout; subdued question/composer and compact wrapping header; bounded middle min-height:0 region with independent active scroller. |
| src/features/ask/ActionSummary.tsx (new) | Present existing immutable canonical details/actions inline outside reannounced live-log content. Bind existing markRendered to actual current visible preview identity; turn anchor is not authority. Keep exact pending recovery independent of editor visibility. |
| src/features/ask/ActionSummary.module.css (new) | Unboxed compact material summary, one primary/text Edit, wrapping target/amount; no permanent card stack. |
| src/features/ask/ActionWindow.tsx | Temporary named internal form region reusing current native children/distinct actions; move repeated review presentation to summary, preserve embedded mutation/read-only/pending fences. Return hides without unmounting owner draft or canceling admitted work. |
| src/features/ask/ActionWindow.module.css | Placement strictly inside Ask middle region; body scroller at normal height, whole-window short-height fallback, no top-layer/body escape. |

Preserved read-only dependencies: App.tsx, SiteChrome.tsx, global.css, Commerce.tsx, CatalogChat.tsx, CatalogPurchase.tsx, CustomerWorkspace.tsx, Profile/Membership/customer-workspace CSS, useActionPreview.ts, domain/parser/queue/backend. No schema, auth/payment/version/UUID/preview-lifetime/provider/budget/dependency change. A necessary consumer edit outside the six layout files needs a reviewed concrete delta before editing. No authority to remove parent pending fences or approve generic private-form chat.

## Authority, focus and scrolling risks

1. First named action or yes without current visible canonical review prepares/reveals it with zero dispatch. Only its unchanged rendered receipt accepts exact contextual yes/đồng ý or its specific primary, once. Mixed edit+approve, questions, quoted/conditional consent do not approve; decline preserves work. Editing/history/locale/close/owner/version/expiry changes invalidate receipt. Signed-out/loading/unavailable never become fresh review via chat shortcut.
2. Keep current preparation, synchronous queue-time scope/auth-generation/version checks and consume-once admitted operation. saveDraft/saveTurn ACK can advance versions; current canonical readback remains required. Auth ABA, stale async replies, pending storage/remount, recipient current-revision readiness and direct-payment guard stay intact.
3. Hidden form/history cannot leave an active hidden review. Stable turn anchor is presentation only. Large summaries need feasible sequential review for the same unchanged identity, with active/current primary actually visible; requiring every large block simultaneously visible can dead-end text200. The local sequential-range model is illustrative, not a proposed domain algorithm.
4. Hiding is not cancellation or permission for private chat. Retain source parent close/interrupt/pending fences, unique-pending-kind recovery and explicit private-form controls. Editor/list paused composer must be both visibly disabled and guarded against keyboard/handler bypass.
5. Rendered scroll/focus fit remains NOT_RUN. Verify heading/first-invalid entry, native Tab sequence, Edit/composer restoration, inner-first Escape, outer focus scope and saved draft. Check all header/form/summary/footer controls against panel bounds, actual visibility/hit-testing and text/soft-keyboard expansion. No source-only accessibility/usability claim.

## Selected verification and limits

Root renders frozen HTML on existing5207; no additional server. Documented design-only URL controls: ?lang=vi/en, ?state=review/stale/unknown/loading/empty/unavailable/signed-out and ?text=200. The text query multiplies every declared pixel font-size by2 through a CSS variable (including body, labels and controls), leaving panel geometry unchanged; unitless line heights expand with text. Root must verify actual computed sizes. This is a text-only proxy, not native browser zoom/AT evidence; current200% rendered evidence remains NOT_RUN. Initial pixel/interaction matrix: VI/EN at1280×720,390×844,320×480, then768/1440 and200% text/zoom equivalent. Compare editor/history/confirmation boundaries with the actual outer panel. Check retained composer, independent active middle scroller, no horizontal overflow/orphan snippets, long-form footer, quantity0 native focus/validity, Escape/Return/draft retention, history read-only, locale invalidation and complete target/amount/terms/consequence. Sequential current review must remain feasible when short/enlarged. Capture current screenshots/AX. Native AT/audio is independent NOT_RUN unless actually exercised.

After layout approval retain current unit/readiness/domain checks; ask-panel-correctness draft/recipient/readback/retry/payment cases; workcell first-review/yes/button/catalog/ownership/ABA/queue/money/once/unknown cases; **24 catalog +10 Actual Ask web** and **7 separate Actual feedback review** scenarios (evaluation, acknowledge, resolve, unapproved, unknown, switch, mobile); all29 Membership and12 Profile recovery scenarios including actual unknown-close/reopen/account switching. Adjust obsolete navigation selectors only, preserving ownership/payload/no-provider/unknown/money oracles. Current compiler/scoped lint/full acceptance and independent review → approved fixes → verify → review remain root-owned. Historical application acceptance does not validate this new layout.

Static checks passed: Node22 inline-script syntax; balanced HTML;68 unique IDs;43 literal JS bindings without missing targets; editor/history descendants of panel and middle, composer inside panel/outside middle; zero external resources, native dialog/showModal or network/storage transport. These are parser/source checks, not browser bounds/behavior. No provider/auth/deployed acceptance. Production readiness and release holds remain separate and NOT_READY.

### Prototype scalar correction evidence

Root reports actual browser reproduction on precursor5305af8a: sending change quantity to -5 displayed quantity5, total2450000VND and a stale/changed-selection reply, with no created order. TL independently identified the unsigned-substring source defect. This is a proposal-only finding, not an application/domain defect or layout approval.

Post-fix bounded synthetic checks used Node22 --input-type=module with node:vm to execute the exact pure previewQuantityEdit helper and the exact extracted quantity/intent branch from this HTML. No DOM/browser/application/provider evaluation. **26/26 passed:**17 malformed scalar cases,5 existing intent guards and4 clear-positive cases. Invalid/guarded inputs retained quantity2, emitted clarifyEdit, did not invalidate the selection and retained local confirmation counter0. Positive1/100/VI3 and mixed edit3+yes updated only the draft, invalidated the review and kept local confirmation counter0. This local branch evidence does not replace root's fresh browser matrix or production consent tests.

| Synthetic group | Inputs / observed result |
| --- | --- |
| Signed / malformed | -5, - 5, +5, minus5, negative5, Unicode minus5/dash5 → unchanged2, clarify, counter0 |
| Decimal / alternate numeric forms | 1.5, 1,5, .5, 1.0, 1e2, 1,000, 1 5 → unchanged2, clarify, counter0 |
| Out of range | 0,101,1000 → unchanged2, clarify, counter0 |
| Existing intent guards | VI negated/conditional, EN conditional/question/quoted edit3 → unchanged2, clarify, counter0 |
| Clear positive | EN1/100, VI3, EN3 and yes → draft1/100/3/3 respectively, fresh-review required, counter0 |

Node syntax, balanced markup,68IDs/43bindings, exact70-key VI/EN inventory and static internal containment were rechecked. CSS/layout/current product copy were not changed by this scalar correction. Current browser-after-fix evidence remains root-owned and NOT_RUN in this slice.

## Product Content Review — proposal slice

Surface/audience/job: VI/EN customer web Ask, reading and deliberately checking purchase details inside its panel. Reviewer frontend_engineer,2026-10-09. Verified facts: source public route/geometry, canonical action names/full-payment semantics, immutable review/pending/close guards. Assumptions: illustrative product/price/terms and local selectable states. Unknown: rendered platform/AT fit and integrated behavior. This HTML sends/persists nothing.

Data meaning: VND all-inclusive unit × integer1–100; invalid total unavailable, never zero/NaN. Current owner/version/expiry/private-data authority remains in production source. Raw local messages render with textContent and survive locale changes, without storage/network records. Private forms are not modelled. No metric, timezone or aggregation change.

| Applicable state | Authored treatment | Current evidence |
| --- | --- | --- |
| Default/focus/selected/disabled | Exact summary, specific primary/Edit, shared blue keyboard focus, localized paused composer | Static; rendered/keyboard NOT_RUN |
| Loading/pending/error/recovery | Named checking, no invented progress/ETA, choices retained, exact unknown Check outcome | Local states; actual outcome/provider NOT_RUN |
| Empty/stale/offline/partial | Short first-use question; stale needs fresh review; invalid total unavailable | Empty/stale authored; actual offline/partial NOT_RUN |
| Unauthorized/forbidden | Signed-out keeps draft and blocks review shortcut; no actual sign-in or private existence disclosure | Local state; real auth NOT_RUN |
| Confirmation/decline/success/destructive | Fresh review; explicit no-send/no-order; decline keeps work; no destructive action | Static local model; command/browser NOT_RUN |

| Principle | Status | Evidence / remaining verification |
| --- | --- | --- |
| Purpose | NOT_RUN | One in-panel conversation/decision authored; current pixels/human hierarchy review pending. |
| Agency | NOT_RUN | Edit/Return/Escape/history/draft control authored; keyboard/current-review admission pending. |
| Responsibility | NOT_RUN | Target/money/full-payment terms/exact unknown identity authored; current actual-action rendering pending. |
| Familiarity | NOT_RUN | Native web fields/buttons/internal region and outer dialog scope; keyboard/AX/AT pending. |
| Flexibility | NOT_RUN | VI/EN, actual mobile footprint, wrapping/short-height fallback; text200/zoom checks pending. |
| Simplicity | NOT_RUN | One stream/composer without permanent chips/tabs/split/cards; user approval pending. |
| Craft | NOT_RUN | Exact inventory, retained input and truthful unknown/not-sent states; rendered evidence pending. |
| Delight | NOT_RUN | Calm continuity and retained work intended, no forced celebration/motion; human pixel review pending. |

Platform: web conventions, SatsunicGo brand. Apple HIG platform compliance NOT_APPLICABLE. Writing/labels, durable feedback, consequential choices, privacy/accounts, inclusion/localization pattern checks are authored but NOT_RUN for rendered acceptance; onboarding/destructive patterns NOT_APPLICABLE. Human principles, platform fit, behavior/meaning, audience, tone, brevity, states, data/privacy, accessibility, localization, terminology and in-context gate results: **NOT_RUN**. Product Language Gate **BLOCKED for successful implementation handoff**; reviewable design only. Root's current source/pixel/interaction review and explicit concrete layout approval remain required before application edits.

Exact inventory follows. Current canonical action names/privacy/full-payment/unknown meanings are retained. Changed question, placeholder, English Back to chat and new paused-composer strings are proposal-only. Keys correspond to header/history/review/composer/form/state jobs in the script. Removed task/tab/waypoint labels concern presentation, not authority. Public context literals are current source-derived VI nav: Sản phẩm, Mua hộ, Biểu phí, Membership, Bài viết, Hỗ trợ; brand SatsunicGo and Mua hộ↗ are inert context, not new chrome locale work. Other literals: VI/EN/Tiếng Việt/English, M/L/XL, bounds1–100, VND formatting and áo/shirt/shirts. No visible mockup/test/technical labels.

| Key / local state | Vietnamese | English |
| --- | --- | --- |
| shell | Hỏi SatsunicGo | Ask SatsunicGo |
| controls | Điều khiển hội thoại | Conversation controls |
| history | Lịch sử hội thoại | Conversation history |
| historyTitle | Tin nhắn trước | Earlier messages |
| currentItem | Áo thun AIRism | AIRism T-shirt |
| currentDetail | Lựa chọn hiện tại | Current selection |
| oldItem | Phí vận chuyển từ Nhật | Shipping from Japan |
| oldDetail | Chỉ xem lại | Read only |
| language | Ngôn ngữ | Language |
| close | Đóng hội thoại | Close conversation |
| reopen | Hỏi SatsunicGo | Ask SatsunicGo |
| selectionQuestion | Tôi muốn đặt 2 áo AIRism màu trắng, size M. | I’d like 2 white AIRism T-shirts in size M. |
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
| placeholder | Nhắn SatsunicGo… | Message SatsunicGo… |
| editingPlaceholder | Về hội thoại để nhắn tiếp… | Return to chat to continue… |
| editingPrompt | Bạn có thể nhắn tiếp sau khi về hội thoại. | Return to chat to continue the conversation. |
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
| quantityHelp | Từ 1 đến 100 áo. | From 1 to 100 shirts. |
| draftNotice | Chưa tạo đơn hoặc thanh toán. | No order or payment yet. |
| back | Về hội thoại | Back to chat |
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
| oldAnswer | Sản phẩm trong danh mục dùng giá trọn gói. Với yêu cầu mua hộ riêng, xem báo giá của đơn để biết chi phí áp dụng. | Catalog products use an all-inclusive price. For a custom buying request, check the order’s quote for applicable costs. |
| historyBlocked | Về hội thoại hiện tại để chỉnh lựa chọn hoặc xác nhận. | Return to the current conversation to edit or confirm. |
| clarifyEdit | Bạn muốn đổi sang bao nhiêu áo? Lựa chọn hiện tại vẫn được giữ. | How many shirts would you like instead? Your current selection is unchanged. |
| mixed | Đã chỉnh lựa chọn. Kiểm tra lại nội dung và tổng tiền trước khi xác nhận. | Your selection changed. Review the details and total again before confirming. |
| generic | Bạn có thể hỏi tiếp, hoặc chọn “Sửa” để chỉnh mẫu và số lượng. | Ask another question, or choose “Edit” to change the variant and quantity. |
| pendingReply | Chưa xác minh được kết quả yêu cầu trước. Kiểm tra kết quả trước khi gửi yêu cầu khác. | The earlier outcome has not been verified. Check it before sending another request. |

## Immutable source/proposal receipt

Numeric-recognition precursor: HTML SHA256 5305af8aa99f464ac1a4464bf4c4a72e81096b9d950e1daf80af0cd4e1f2d77d; plan SHA256 bdde55afbf5d6af126ba3e17b80f686093d80debba76deefccdec12faf8eca62. TL found unsigned-substring parsing of negative/decimal quantity text. Root authorized only this prototype scalar fix: consume a complete unsigned safe integer1–100, reject signed/decimal/comma/scientific/oversized or ambiguous numeric tails, clarify without changing selection/confirming. Existing negated/conditional/question/quoted intent guard and all CSS/layout/copy remain unchanged. No application/domain/LLM parser change or layout approval granted.

Immediate precursor before the two paused-list predicate corrections: HTML SHA256 24a978dfce0932ecf1ff5eb1f1690a175ec020df7f1928e62584e47e08505eda; plan SHA256 19f721a6a528ccb8460275c987b86ec65fa861dca29c885b86547ea9c18cae9a. The existing Return-to-chat placeholder and note now apply to editing or history-list selection; no strings, controls, layout or application behavior added.

Precursor frozen proposal before the two copy/scope corrections: HTML SHA256 f283e98c9a058056017d4a567eb8dcec7a0c5189bdef6f3c817ab3d9d20d1eea; plan SHA256 6bff340013375b5c9f75be7595033004c1285b92b03ab8e20db3e2b95a962914. This successor changes only the earlier-messages title/consistent same-conversation wording and the new-copy privacy restriction while preserving authorized server saves.

HEAD at bounded read: 53d59bd88fa7da9d1243692336ecd09b6540ea31. Preview SHA256: 9d893540cdbadf77d66e29946e103772995fcf3c5e0f95c63cb91dd63e728d07. Shared brief SHA256: 1cd2556698ee59b6c850cda49e9f75819406313bf59c1a0f15054c4167f2c309. No READY/index-completeness claim.

Root metadata-only successor resolves REL5-PANEL-CONTEXT-HASH after plan precursor a63f854963aed6e2d32fbe732d4599aed6959116be5f90a9adf3eda9270a543d. App e4ad906828519bab9413c04c05037392d7233ec0624b3f0142ccfa461b838bd0 was the historical shared read. Current shared App64c956bf7dd0f6ecebd89737d9c8363d397f414d0e951d04ecc1cc1a6169e0d5 contains unrelated concurrent WIP and is not copied into the candidate. The table targets preserved candidate App27c0a4ae3c6c14593b5f22a2bd64af4251aabf1feac7a84b0929d237ce844bb5; the other listed sources match candidate and shared. No HTML, CSS, application, artifact or route behavior changed in this correction.

| Candidate-target read-only source | SHA256 |
| --- | --- |
| src/app/App.tsx | 27c0a4ae3c6c14593b5f22a2bd64af4251aabf1feac7a84b0929d237ce844bb5 |
| src/app/SiteChrome.tsx | a4e5ea42051e5f54e3fbccf7034cf710bec33469d6b1a3eb31b99d17fde44434 |
| src/styles/global.css | 017da48de7b6c2e6edc49005e073816b6a6fd2dc49d26a1aa31e59a3394b91cf |
| src/features/ask/Ask.tsx | 1d3b3488d2f70d9d892f2793bb7570d96f09c592505f0658312c503abefaf47c |
| src/features/ask/Ask.module.css | c6fc8525db2225f3b5baf7503707254a9088a022649cffd38b9bf275cd357c09 |
| src/features/ask/ActionWindow.tsx | b841591dd82ae86a4410c2385d949abc3d38e58185d21373f091032b88296a22 |
| src/features/ask/ActionWindow.module.css | 4527a674a488cae15c07f16047bcbf245b5a29b971aad55eb2c4ad22beb8b9b1 |
| src/features/ask/CustomerWorkspace.tsx | ee1c9ca83558ec940b0ddbecaf6a381657a50020590e46a53586aa53a6a5e4bf |
| src/features/ask/Commerce.tsx | 6b5f8e3823d584f281bed59f00c35a32654669dcf5254ca3f77750a9cf5b7c55 |
| src/features/ask/CatalogChat.tsx | d845859226371021286de977a2636abea6097c8174f4a3573b7936c770d78489 |
| src/features/ask/useActionPreview.ts | cbf01fb1209a3211070bc54a3acca0c72b8c9932e3535ad8d1b6ccffc1f151b7 |
| packages/domain/action-preview.ts | 6ee6f5edb8912b806deea82ad432768cf319295274cdfe135bb0ef8eb0c73337 |
| packages/domain/catalog-checkout.ts | eea4948edee36594600421debe6125385bab251805f4dd7f1a8fb9e5546bec4c |
| src/features/profile/Profile.tsx | 5d93d4936216f879fc5f41e982ca340eec6343f1ca8f937e9307656ece78477b |
| src/features/membership/Membership.tsx | 15a929f4d8cc6429c26f5dc4b2adad2ddb10510e1e752e9a1b25af7771416077 |

Historical proposals preserved as found at this task read: old HTML SHA256 b70b9d1e00ddae1346a7d25ee25403821a4612102f25ba87bee9abe0e52ee133; old plan SHA256 1a4e8fa446644fe3a6968d32b17de72e71007cdcbd1100ff3cfa3d791f12a7a7. These grant no new layout approval.

Rollback: remove/supersede these two new docs without application impact. Future approved layout rollback preserves domain guards/pending identity and never reverts unrelated WIP. No stage/commit/deploy, provider/network call, browser/runtime mutation or memory write. Memory candidates: None. Token/cost totals unavailable; no paid-provider request. Design/write lease released at frozen handoff; root owns rendered review and approval presentation.

Root bounded pixel correction: scope the inherited history list button width/hover rules to `.history-list button`, preventing the native close-history icon from consuming the entire header row. Precursor HTML34c4310dc4b47634ced576d974aa81b3de9e8554c812995c04e0ad9f725f7c5c / planf6a989cd63513c1afe374673f4686e3e39acd37ecd766e0cb90de21a3baa98a7. Only these two selectors and this metadata changed; all copy, behavior, controls, other CSS and application source unchanged. Root owns fresh history pixel/bounds verification and current receipt.

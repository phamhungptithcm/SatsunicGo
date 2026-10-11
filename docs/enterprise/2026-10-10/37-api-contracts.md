# Hợp đồng backend chi tiết

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Phạm vi hợp đồng

Danh mục này mô tả các module được entrypoint Functions tham chiếu, cùng schema đầu vào khai báo trong từng module. Đây là tài liệu kỹ thuật để triển khai client, rà soát thay đổi và viết kiểm thử hợp đồng. Các schema tái sử dụng từ packages/domain nằm ở từ điển dữ liệu. Một trường optional ở lớp schema vẫn có thể bắt buộc trong một action cụ thể; điều kiện theo trạng thái và quyền được kiểm tra tiếp trong handler.

Callable dùng Firebase callable protocol; không chuyển thành REST endpoint tùy ý. onRequest là HTTP handler, onSchedule là lịch chạy, onDocument* là trigger dữ liệu. Một export có thể chỉ là wrapper/helper hoặc alias có điều kiện. Trạng thái triển khai cần kiểm kê riêng từ môi trường đích.

Mã lỗi trong bảng là những mã có khai báo trong module, không phải danh sách đảm bảo cho mọi action. Tên guard ghi nhận nơi có gọi helper; không đủ để kết luận mọi nhánh đều được bảo vệ giống nhau. Các giới hạn min/max, enum, UUID và strict schema phải được giữ khi viết integration.

## approved-knowledge

Nguồn: [functions/src/ai/approved-knowledge.ts:1](../../../functions/src/ai/approved-knowledge.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `askKnowledgeCommand` | onCall | [functions/src/ai/approved-knowledge.ts:113](../../../functions/src/ai/approved-knowledge.ts#L113) |
| `askKnowledgePreview` | onCall | [functions/src/ai/approved-knowledge.ts:52](../../../functions/src/ai/approved-knowledge.ts#L52) |

Helper kiểm soát được tham chiếu: `recentMfa`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `not-found`, `permission-denied`, `resource-exhausted`.

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/ai/approved-knowledge.ts:409](../../../functions/src/ai/approved-knowledge.ts#L409) | `documents`, `anchor` |

Payload được chuẩn hóa bằng schema/helper nhập từ module khác hoặc được dựng theo trigger. Tham chiếu domain/imports và handler tại nguồn để xác định hợp đồng đầy đủ.
## ask-workflow

Nguồn: [functions/src/ai/ask-workflow.ts:1](../../../functions/src/ai/ask-workflow.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `askWorkflow` | onCall | [functions/src/ai/ask-workflow.ts:46](../../../functions/src/ai/ask-workflow.ts#L46) |
| `currentAskConversation` | onCall | [functions/src/ai/ask-workflow.ts:394](../../../functions/src/ai/ask-workflow.ts#L394) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`, `unavailable`.

### envelope — schema tại dòng 36

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `conversationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `expectedOrderVersion` | `z.number().int().positive().optional()` | Có optional/default ở lớp ngoài |
| `action` | `z.string()` | Xem helper và điều kiện tiếp theo |
| `payload` | `z.unknown()` | Xem helper và điều kiện tiếp theo |

### recovery — schema tại dòng 58

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `operationId` | `z.string().uuid().optional()` | Có optional/default ở lớp ngoài |

### result — schema tại dòng 99

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `id` | `z .string() .regex(/^[A-Za-z0-9_-]{1,100}$/) .optional()` | Có optional/default ở lớp ngoài |
| `version` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/ai/ask-workflow.ts:88](../../../functions/src/ai/ask-workflow.ts#L88) | `version`, `outcome` |
| [functions/src/ai/ask-workflow.ts:172](../../../functions/src/ai/ask-workflow.ts#L172) | `c`, `done` |
| [functions/src/ai/ask-workflow.ts:416](../../../functions/src/ai/ask-workflow.ts#L416) | `conversationId` |
## ask

Nguồn: [functions/src/ai/ask.ts:1](../../../functions/src/ai/ask.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `ask` | onCall | [functions/src/ai/ask.ts:56](../../../functions/src/ai/ask.ts#L56) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `invalid-argument`, `permission-denied`, `resource-exhausted`, `unauthenticated`, `unavailable`.

### input — schema tại dòng 36

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `images` | `z.array(askImageSchema).max(3).default([])` | Có optional/default ở lớp ngoài |
| `conversationId` | `z.string().uuid().optional()` | Có optional/default ở lớp ngoài |
| `question` | `z.string().trim().min(1).max(1000)` | Xem helper và điều kiện tiếp theo |
| `sessionId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `language` | `z.enum(["vi", "en"])` | Xem helper và điều kiện tiếp theo |
| `history` | `z.array(z.string().trim().min(1).max(1000)).max(6).default([])` | Có optional/default ở lớp ngoài |
| `orderId` | `z .string() .regex(/^[a-zA-Z0-9-]{1,80}$/) .optional()` | Có optional/default ở lớp ngoài |

### schema — schema tại dòng 373

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `name` | `z.string().max(200)` | Xem helper và điều kiện tiếp theo |
| `price` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |
| `periodDays` | `z.number().int().min(1)` | Xem helper và điều kiện tiếp theo |
| `serviceDiscountBps` | `z.number().int().min(0).max(10000)` | Xem helper và điều kiện tiếp theo |
| `discountCap` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/ai/ask.ts:300](../../../functions/src/ai/ask.ts#L300) | `matches`, `coverage` |
| [functions/src/ai/ask.ts:352](../../../functions/src/ai/ask.ts#L352) | `sourceId`, `title`, `text` |
| [functions/src/ai/ask.ts:387](../../../functions/src/ai/ask.ts#L387) | `sourceId`, `plans`, `observedAt` |
| [functions/src/ai/ask.ts:429](../../../functions/src/ai/ask.ts#L429) | `status`, `draft` |
| [functions/src/ai/ask.ts:460](../../../functions/src/ai/ask.ts#L460) | `status`, `shoppingDraft` |
## customer-save

Nguồn: [functions/src/ai/customer-save.ts:1](../../../functions/src/ai/customer-save.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `customerSaveResolve` | onCall | [functions/src/ai/customer-save.ts:11](../../../functions/src/ai/customer-save.ts#L11) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`, `resource-exhausted`.

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/ai/customer-save.ts:120](../../../functions/src/ai/customer-save.ts#L120) | `status`, `result` |
| [functions/src/ai/customer-save.ts:136](../../../functions/src/ai/customer-save.ts#L136) | `status` |

Payload được chuẩn hóa bằng schema/helper nhập từ module khác hoặc được dựng theo trigger. Tham chiếu domain/imports và handler tại nguồn để xác định hợp đồng đầy đủ.
## feedback-lifecycle

Nguồn: [functions/src/ai/feedback-lifecycle.ts:1](../../../functions/src/ai/feedback-lifecycle.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `askFeedbackWithdraw` | onCall | [functions/src/ai/feedback-lifecycle.ts:24](../../../functions/src/ai/feedback-lifecycle.ts#L24) |
| `askFeedbackInbox` | onCall | [functions/src/ai/feedback-lifecycle.ts:89](../../../functions/src/ai/feedback-lifecycle.ts#L89) |
| `askFeedbackCleanup` | onSchedule | [functions/src/ai/feedback-lifecycle.ts:220](../../../functions/src/ai/feedback-lifecycle.ts#L220) |
| `askFeedbackEvaluation` | onCall | [functions/src/ai/feedback-lifecycle.ts:128](../../../functions/src/ai/feedback-lifecycle.ts#L128) |

Helper kiểm soát được tham chiếu: `recentMfa`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `invalid-argument`, `permission-denied`, `resource-exhausted`, `unavailable`.

### input — schema tại dòng 130

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `language` | `z.enum(["vi", "en"])` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/ai/feedback-lifecycle.ts:62](../../../functions/src/ai/feedback-lifecycle.ts#L62) | `id`, `withdrawn` |
| [functions/src/ai/feedback-lifecycle.ts:217](../../../functions/src/ai/feedback-lifecycle.ts#L217) | `deleted` |
## feedback

Nguồn: [functions/src/ai/feedback.ts:1](../../../functions/src/ai/feedback.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `askFeedback` | onCall | [functions/src/ai/feedback.ts:57](../../../functions/src/ai/feedback.ts#L57) |
| `askFeedbackReview` | onCall | [functions/src/ai/feedback.ts:154](../../../functions/src/ai/feedback.ts#L154) |
| `askFeedbackPolicy` | onCall | [functions/src/ai/feedback.ts:23](../../../functions/src/ai/feedback.ts#L23) |

Helper kiểm soát được tham chiếu: `recentMfa`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `not-found`, `permission-denied`, `resource-exhausted`, `unavailable`.

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/ai/feedback.ts:102](../../../functions/src/ai/feedback.ts#L102) | `id`, `version` |

Payload được chuẩn hóa bằng schema/helper nhập từ module khác hoặc được dựng theo trigger. Tham chiếu domain/imports và handler tại nguồn để xác định hợp đồng đầy đủ.
## research-live

Nguồn: [functions/src/ai/research-live.ts:1](../../../functions/src/ai/research-live.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `askWebDiscovery` | onCall | [functions/src/ai/research-live.ts:330](../../../functions/src/ai/research-live.ts#L330) |
| `askWebSelect` | onCall | [functions/src/ai/research-live.ts:479](../../../functions/src/ai/research-live.ts#L479) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `failed-precondition`, `invalid-argument`, `permission-denied`, `resource-exhausted`, `unavailable`.

### discoveryPolicySchema — schema tại dòng 44

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `enabled` | `z.literal(true)` | Xem helper và điều kiện tiếp theo |
| `version` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `termsReviewed` | `z.literal(true)` | Xem helper và điều kiện tiếp theo |
| `expiresAt` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `merchantPolicyVersion` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `budgetImportHash` | `z.string().regex(/^[a-f0-9]{64}$/)` | Xem helper và điều kiện tiếp theo |

### parsed — schema tại dòng 61

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `maxBudgetVnd` | `z.literal(50000)` | Xem helper và điều kiện tiếp theo |
| `reservedVnd` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |
| `importedReservedVnd` | `z.number().int().nonnegative().max(50000)` | Xem helper và điều kiện tiếp theo |
| `importHash` | `z.literal(importHash)` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/ai/research-live.ts:167](../../../functions/src/ai/research-live.ts#L167) | `result`, `policy`, `policyHash` |
| [functions/src/ai/research-live.ts:220](../../../functions/src/ai/research-live.ts#L220) | `error`, `result`, `policy`, `policyHash` |
| [functions/src/ai/research-live.ts:462](../../../functions/src/ai/research-live.ts#L462) | `error` |
| [functions/src/ai/research-live.ts:465](../../../functions/src/ai/research-live.ts#L465) | `result` |
## research

Nguồn: [functions/src/ai/research.ts:1](../../../functions/src/ai/research.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `askResearchCommand` | onCall | [functions/src/ai/research.ts:94](../../../functions/src/ai/research.ts#L94) |
| `askResearchSearch` | onCall | [functions/src/ai/research.ts:184](../../../functions/src/ai/research.ts#L184) |
| `askResearchSelect` | onCall | [functions/src/ai/research.ts:251](../../../functions/src/ai/research.ts#L251) |

Helper kiểm soát được tham chiếu: `recentMfa`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `not-found`, `permission-denied`, `resource-exhausted`, `unavailable`.

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/ai/research.ts:303](../../../functions/src/ai/research.ts#L303) | `error` |
| [functions/src/ai/research.ts:322](../../../functions/src/ai/research.ts#L322) | `result` |

Payload được chuẩn hóa bằng schema/helper nhập từ module khác hoặc được dựng theo trigger. Tham chiếu domain/imports và handler tại nguồn để xác định hợp đồng đầy đủ.
## analytics-ingest

Nguồn: [functions/src/analytics-ingest.ts:1](../../../functions/src/analytics-ingest.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `analyticsSession` | onCall | [functions/src/analytics-ingest.ts:82](../../../functions/src/analytics-ingest.ts#L82) |
| `analyticsIngest` | onCall | [functions/src/analytics-ingest.ts:187](../../../functions/src/analytics-ingest.ts#L187) |
| `analyticsLinkOrder` | onCall | [functions/src/analytics-ingest.ts:292](../../../functions/src/analytics-ingest.ts#L292) |
| `analyticsWithdraw` | onCall | [functions/src/analytics-ingest.ts:348](../../../functions/src/analytics-ingest.ts#L348) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `failed-precondition`, `invalid-argument`, `permission-denied`, `resource-exhausted`.

### p — schema tại dòng 349

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `session` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `reason` | `z.enum(["withdraw", "account_change"]).default("withdraw")` | Có optional/default ở lớp ngoài |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/analytics-ingest.ts:140](../../../functions/src/analytics-ingest.ts#L140) | `session`, `startedAt` |
| [functions/src/analytics-ingest.ts:289](../../../functions/src/analytics-ingest.ts#L289) | `accepted` |
| [functions/src/analytics-ingest.ts:331](../../../functions/src/analytics-ingest.ts#L331) | `linked` |
| [functions/src/analytics-ingest.ts:378](../../../functions/src/analytics-ingest.ts#L378) | `stopped` |
## analytics-worker

Nguồn: [functions/src/analytics-worker.ts:1](../../../functions/src/analytics-worker.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `analyticsOrderChanged` | onDocumentWritten | [functions/src/analytics-worker.ts:56](../../../functions/src/analytics-worker.ts#L56) |
| `analyticsPaymentCreated` | onDocumentCreated | [functions/src/analytics-worker.ts:67](../../../functions/src/analytics-worker.ts#L67) |
| `analyticsJobCreated` | onDocumentCreated | [functions/src/analytics-worker.ts:453](../../../functions/src/analytics-worker.ts#L453) |
| `analyticsCompact` | onSchedule | [functions/src/analytics-worker.ts:459](../../../functions/src/analytics-worker.ts#L459) |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/analytics-worker.ts:168](../../../functions/src/analytics-worker.ts#L168) | `written` |

Payload được chuẩn hóa bằng schema/helper nhập từ module khác hoặc được dựng theo trigger. Tham chiếu domain/imports và handler tại nguồn để xác định hợp đồng đầy đủ.
## blog-comments

Nguồn: [functions/src/blog-comments.ts:1](../../../functions/src/blog-comments.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `blogCommentSubmit` | onCall | [functions/src/blog-comments.ts:115](../../../functions/src/blog-comments.ts#L115) |
| `blogCommentList` | onCall | [functions/src/blog-comments.ts:249](../../../functions/src/blog-comments.ts#L249) |
| `blogCommentCommand` | onCall | [functions/src/blog-comments.ts:375](../../../functions/src/blog-comments.ts#L375) |
| `blogCommentReport` | onCall | [functions/src/blog-comments.ts:443](../../../functions/src/blog-comments.ts#L443) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `not-found`, `permission-denied`.

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/blog-comments.ts:80](../../../functions/src/blog-comments.ts#L80) | `comment` |
| [functions/src/blog-comments.ts:232](../../../functions/src/blog-comments.ts#L232) | `count`, `mine`, `thread`, `items`, `next`, `commentsEnabled` |
| [functions/src/blog-comments.ts:424](../../../functions/src/blog-comments.ts#L424) | `ok` |

Payload được chuẩn hóa bằng schema/helper nhập từ module khác hoặc được dựng theo trigger. Tham chiếu domain/imports và handler tại nguồn để xác định hợp đồng đầy đủ.
## blog-studio-advanced

Nguồn: [functions/src/blog-studio-advanced.ts:1](../../../functions/src/blog-studio-advanced.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `studioAdvancedRead` | onCall | [functions/src/blog-studio-advanced.ts:386](../../../functions/src/blog-studio-advanced.ts#L386) |
| `studioAdvancedCommand` | onCall | [functions/src/blog-studio-advanced.ts:739](../../../functions/src/blog-studio-advanced.ts#L739) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `not-found`, `permission-denied`, `resource-exhausted`.

### target — schema tại dòng 425

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `targetUid` | `z .string() .min(1) .max(128) .regex(/^[a-zA-Z0-9_-]+$/)` | Xem helper và điều kiện tiếp theo |
| `role` | `z.enum(["author", "publisher", "admin"]).optional()` | Có optional/default ở lớp ngoài |
| `active` | `z.literal(true).optional()` | Có optional/default ở lớp ngoài |

### p — schema tại dòng 459

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `kind` | `z.enum(["authors", "taxonomy"])` | Xem helper và điều kiện tiếp theo |
| `name` | `z.string().trim().min(1).max(80)` | Xem helper và điều kiện tiếp theo |
| `bio` | `z.string().max(500).optional()` | Có optional/default ở lớp ngoài |
| `email` | `z.email().optional()` | Có optional/default ở lớp ngoài |

### p — schema tại dòng 534

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `targetUid` | `z.string()` | Xem helper và điều kiện tiếp theo |
| `role` | `z.enum(["author", "publisher", "admin"]).optional()` | Có optional/default ở lớp ngoài |
| `active` | `z.literal(true).optional()` | Có optional/default ở lớp ngoài |

### p — schema tại dòng 605

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `name` | `z.string().trim().min(1).max(80)` | Xem helper và điều kiện tiếp theo |

### p — schema tại dòng 609

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `kind` | `z.enum(["authors", "taxonomy"])` | Xem helper và điều kiện tiếp theo |
| `name` | `z.string().trim().min(1).max(80)` | Xem helper và điều kiện tiếp theo |
| `bio` | `z.string().max(500).optional()` | Có optional/default ở lớp ngoài |
| `email` | `z.email().optional()` | Có optional/default ở lớp ngoài |

### p — schema tại dòng 757

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `email` | `z.email()` | Xem helper và điều kiện tiếp theo |
| `role` | `z.enum(["author", "publisher", "admin"]).optional()` | Có optional/default ở lớp ngoài |
| `active` | `z.literal(true).optional()` | Có optional/default ở lớp ngoài |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/blog-studio-advanced.ts:45](../../../functions/src/blog-studio-advanced.ts#L45) | `id`, `commentId`, `reason`, `state`, `createdAt`, `revision` |
| [functions/src/blog-studio-advanced.ts:97](../../../functions/src/blog-studio-advanced.ts#L97) | `access`, `user` |
| [functions/src/blog-studio-advanced.ts:166](../../../functions/src/blog-studio-advanced.ts#L166) | `items`, `next` |
| [functions/src/blog-studio-advanced.ts:199](../../../functions/src/blog-studio-advanced.ts#L199) | `schemaVersion`, `createdAt`, `collections` |
## blog-studio

Nguồn: [functions/src/blog-studio.ts:1](../../../functions/src/blog-studio.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `studioRead` | onCall | [functions/src/blog-studio.ts:499](../../../functions/src/blog-studio.ts#L499) |
| `studioCommand` | onCall | [functions/src/blog-studio.ts:487](../../../functions/src/blog-studio.ts#L487) |
| `studioMediaUpload` | onCall | [functions/src/blog-studio.ts:778](../../../functions/src/blog-studio.ts#L778) |
| `studioMediaRead` | onCall | [functions/src/blog-studio.ts:907](../../../functions/src/blog-studio.ts#L907) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `not-found`, `permission-denied`.

### studioCommandSchema — schema tại dòng 44

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.enum([ "create", "save", "review", "publish", "schedule", "unpublish", "archive", "restore", "settings", "moderate", ])` | Xem helper và điều kiện tiếp theo |
| `operationId` | `studioIdSchema` | Xem helper và điều kiện tiếp theo |
| `id` | `studioIdSchema.optional()` | Có optional/default ở lớp ngoài |
| `expectedVersion` | `version.optional()` | Có optional/default ở lớp ngoài |
| `payload` | `z.unknown().optional()` | Có optional/default ở lớp ngoài |

### payload — schema tại dòng 133

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `status` | `z.enum(["approved", "hidden", "rejected", "spam"])` | Xem helper và điều kiện tiếp theo |

### p — schema tại dòng 276

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `revision` | `version` | Xem helper và điều kiện tiếp theo |

### executeStudioCommand — schema tại dòng 316

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `dueAt` | `z.string().datetime({ offset: true })` | Xem helper và điều kiện tiếp theo |

### d — schema tại dòng 503

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `kind` | `z.enum(["list", "get", "revisions", "settings", "moderation"])` | Xem helper và điều kiện tiếp theo |
| `status` | `z .enum(["pending", "approved", "hidden", "rejected", "spam"]) .optional()` | Có optional/default ở lớp ngoài |
| `id` | `studioIdSchema.optional()` | Có optional/default ở lớp ngoài |
| `after` | `z.string().max(256).optional()` | Có optional/default ở lớp ngoài |

### d — schema tại dòng 784

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `mime` | `z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"])` | Xem helper và điều kiện tiếp theo |
| `base64` | `z .string() .min(4) .max(6990510) .regex( /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==\|[A-Za-z0-9+/]{3}=)?$/, )` | Xem helper và điều kiện tiếp theo |
| `alt` | `z.string().trim().min(2).max(300)` | Xem helper và điều kiện tiếp theo |
| `rightsConfirmed` | `z.literal(true)` | Xem helper và điều kiện tiếp theo |
| `postId` | `studioIdSchema.optional()` | Có optional/default ở lớp ngoài |
| `authorId` | `studioIdSchema.optional()` | Có optional/default ở lớp ngoài |

### studioMediaRead — schema tại dòng 912

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `id` | `studioIdSchema` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/blog-studio.ts:527](../../../functions/src/blog-studio.ts#L527) | `settings` |
| [functions/src/blog-studio.ts:540](../../../functions/src/blog-studio.ts#L540) | `draft`, `schedule` |
| [functions/src/blog-studio.ts:599](../../../functions/src/blog-studio.ts#L599) | `items`, `next` |
| [functions/src/blog-studio.ts:770](../../../functions/src/blog-studio.ts#L770) | `bytes`, `mime`, `width`, `height` |
| [functions/src/blog-studio.ts:897](../../../functions/src/blog-studio.ts#L897) | `id`, `url`, `alt`, `mime`, `width`, `height` |
| [functions/src/blog-studio.ts:976](../../../functions/src/blog-studio.ts#L976) | `id`, `mime`, `base64`, `alt` |
## campaign-banners

Nguồn: [functions/src/campaign-banners.ts:1](../../../functions/src/campaign-banners.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `websiteBannerCommand` | onCall | [functions/src/campaign-banners.ts:67](../../../functions/src/campaign-banners.ts#L67) |
| `websiteBannerAdmin` | onCall | [functions/src/campaign-banners.ts:257](../../../functions/src/campaign-banners.ts#L257) |
| `websiteBannerPreview` | onCall | [functions/src/campaign-banners.ts:441](../../../functions/src/campaign-banners.ts#L441) |
| `campaignBannersPublic` | onRequest | [functions/src/campaign-banners.ts:307](../../../functions/src/campaign-banners.ts#L307) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `not-found`, `permission-denied`, `resource-exhausted`.

### commandSchema — schema tại dòng 26

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("save")` | Xem helper và điều kiện tiếp theo |
| `id` | `bannerId` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `draft` | `bannerDraftSchema` | Xem helper và điều kiện tiếp theo |
| `operationId` | `bannerId` | Xem helper và điều kiện tiếp theo |

### commandSchema — schema tại dòng 35

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("publish")` | Xem helper và điều kiện tiếp theo |
| `id` | `bannerId` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `startNow` | `z.boolean().optional()` | Có optional/default ở lớp ngoài |
| `operationId` | `bannerId` | Xem helper và điều kiện tiếp theo |

### commandSchema — schema tại dòng 44

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("hide")` | Xem helper và điều kiện tiếp theo |
| `id` | `bannerId` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `operationId` | `bannerId` | Xem helper và điều kiện tiếp theo |

### commandSchema — schema tại dòng 52

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("mode")` | Xem helper và điều kiện tiếp theo |
| `placement` | `bannerPlacement` | Xem helper và điều kiện tiếp theo |
| `mode` | `bannerMode` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `operationId` | `bannerId` | Xem helper và điều kiện tiếp theo |

### input — schema tại dòng 259

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `after` | `bannerId.optional()` | Có optional/default ở lớp ngoài |

### input — schema tại dòng 443

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `mediaId` | `bannerId` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/campaign-banners.ts:285](../../../functions/src/campaign-banners.ts#L285) | `rows`, `next`, `modes`, `manifestVersion`, `owner`, `serverNow` |
| [functions/src/campaign-banners.ts:292](../../../functions/src/campaign-banners.ts#L292) | `id`, `version`, `draft`, `published` |
| [functions/src/campaign-banners.ts:506](../../../functions/src/campaign-banners.ts#L506) | `image`, `alt` |
## cart

Nguồn: [functions/src/cart.ts:1](../../../functions/src/cart.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `cartCommand` | onCall | [functions/src/cart.ts:17](../../../functions/src/cart.ts#L17) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`.

Payload được chuẩn hóa bằng schema/helper nhập từ module khác hoặc được dựng theo trigger. Tham chiếu domain/imports và handler tại nguồn để xác định hợp đồng đầy đủ.
## catalog-checkout

Nguồn: [functions/src/catalog-checkout.ts:1](../../../functions/src/catalog-checkout.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `catalogCheckout` | onCall | [functions/src/catalog-checkout.ts:15](../../../functions/src/catalog-checkout.ts#L15) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`, `unauthenticated`.

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/catalog-checkout.ts:116](../../../functions/src/catalog-checkout.ts#L116) | `productId`, `productVersion`, `quantity`, `variant` |

Payload được chuẩn hóa bằng schema/helper nhập từ module khác hoặc được dựng theo trigger. Tham chiếu domain/imports và handler tại nguồn để xác định hợp đồng đầy đủ.
## changes

Nguồn: [functions/src/changes.ts:1](../../../functions/src/changes.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `changeCommand` | onCall | [functions/src/changes.ts:16](../../../functions/src/changes.ts#L16) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`, `unauthenticated`.

### parsed — schema tại dòng 26

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.enum(["propose", "accept", "reject", "apply"])` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `orderId` | `z.string().regex(/^[a-zA-Z0-9-]{1,80}$/)` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `proposalId` | `z .string() .regex(/^[a-zA-Z0-9-]{1,80}$/) .optional()` | Có optional/default ở lớp ngoài |
| `payload` | `z.unknown().optional()` | Có optional/default ở lớp ngoài |
## consolidation

Nguồn: [functions/src/consolidation.ts:1](../../../functions/src/consolidation.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `consolidationCommand` | onCall | [functions/src/consolidation.ts:20](../../../functions/src/consolidation.ts#L20) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`, `unauthenticated`.

### d — schema tại dòng 31

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.enum(["seal", "dispatch"])` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `batchId` | `z .string() .regex(/^[a-zA-Z0-9-]{1,80}$/) .optional()` | Có optional/default ở lớp ngoài |
| `expectedVersion` | `z.number().int().positive().optional()` | Có optional/default ở lớp ngoài |
| `orderVersions` | `z.record(z.string(), z.number().int().positive())` | Xem helper và điều kiện tiếp theo |
| `parcelVersions` | `z.record(z.string(), z.number().int().positive())` | Xem helper và điều kiện tiếp theo |
| `payload` | `z.unknown()` | Xem helper và điều kiện tiếp theo |

### consolidationCommand — schema tại dòng 90

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `parcelIds` | `z .array(z.string().regex(/^[a-zA-Z0-9-]{1,80}$/)) .min(1) .max(20)` | Xem helper và điều kiện tiếp theo |
| `orderWeights` | `z.record( z.string(), z.number().int().positive().max(1000000), )` | Xem helper và điều kiện tiếp theo |
| `freight` | `money` | Xem helper và điều kiện tiếp theo |
| `hub` | `z.string().min(2).max(100)` | Xem helper và điều kiện tiếp theo |
| `service` | `z.string().min(2).max(100)` | Xem helper và điều kiện tiếp theo |
| `cutoff` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |

### consolidationCommand — schema tại dòng 115

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `carrier` | `z.string().min(2).max(100)` | Xem helper và điều kiện tiếp theo |
| `tracking` | `z.string().min(3).max(100)` | Xem helper và điều kiện tiếp theo |
| `handoffEvidence` | `z.string().min(5).max(1000)` | Xem helper và điều kiện tiếp theo |
## crm

Nguồn: [functions/src/crm.ts:1](../../../functions/src/crm.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `readCustomer` | onCall | [functions/src/crm.ts:221](../../../functions/src/crm.ts#L221) |
| `saveCustomerNotes` | onCall | [functions/src/crm.ts:333](../../../functions/src/crm.ts#L333) |
| `listCustomers` | onCall | [functions/src/crm.ts:42](../../../functions/src/crm.ts#L42) |
| `listFollowUps` | onCall | [functions/src/crm.ts:111](../../../functions/src/crm.ts#L111) |
| `listCrmStaff` | onCall | [functions/src/crm.ts:162](../../../functions/src/crm.ts#L162) |
| `operationalDashboard` | onCall | [functions/src/crm.ts:415](../../../functions/src/crm.ts#L415) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`, `unauthenticated`.

### cursor — schema tại dòng 20

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `id` | `customerId` | Xem helper và điều kiện tiếp theo |
| `name` | `z.string().max(160).optional()` | Có optional/default ở lớp ngoài |
| `at` | `z.number().int().nonnegative().optional()` | Có optional/default ở lớp ngoài |

### p — schema tại dòng 46

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `search` | `z.string().trim().max(128).default("")` | Có optional/default ở lớp ngoài |
| `mode` | `z.enum(["name", "id"]).default("name")` | Có optional/default ở lớp ngoài |
| `after` | `cursor.optional()` | Có optional/default ở lớp ngoài |

### p — schema tại dòng 115

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `mode` | `z.enum(["overdue", "upcoming", "all"]).default("overdue")` | Có optional/default ở lớp ngoài |
| `assigneeId` | `customerId.optional()` | Có optional/default ở lớp ngoài |
| `asOf` | `z.number().int().positive().optional()` | Có optional/default ở lớp ngoài |
| `after` | `cursor.optional()` | Có optional/default ở lớp ngoài |

### p — schema tại dòng 166

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `after` | `customerId.optional()` | Có optional/default ở lớp ngoài |

### parsed — schema tại dòng 225

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `id` | `customerId` | Xem helper và điều kiện tiếp theo |
| `ordersAfter` | `z .object({ createdAt: z.number().int().nonnegative(), id: customerId }) .strict() .optional()` | Có optional/default ở lớp ngoài |
| `ticketsAfter` | `z .object({ createdAt: z.number().int().nonnegative(), id: customerId }) .strict() .optional()` | Có optional/default ở lớp ngoài |

### parsed.ordersAfter — schema tại dòng 228

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `createdAt` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `id` | `customerId` | Xem helper và điều kiện tiếp theo |

### parsed.ticketsAfter — schema tại dòng 232

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `createdAt` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `id` | `customerId` | Xem helper và điều kiện tiếp theo |

### period — schema tại dòng 419

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `from` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `until` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/crm.ts:32](../../../functions/src/crm.ts#L32) | `id`, `displayName`, `businessName`, `tags`, `assigneeId`, `followUpAt` |
| [functions/src/crm.ts:65](../../../functions/src/crm.ts#L65) | `rows`, `next` |
| [functions/src/crm.ts:149](../../../functions/src/crm.ts#L149) | `rows`, `asOf`, `next` |
| [functions/src/crm.ts:284](../../../functions/src/crm.ts#L284) | `profile`, `crm`, `membership`, `orders`, `tickets`, `ordersNext`, `ticketsNext`, `limit` |
| [functions/src/crm.ts:506](../../../functions/src/crm.ts#L506) | `counts`, `from`, `until`, `observedAt`, `timezone`, `limitPerKind`, `truncated`, `basis` |
## customer-notification-delivery

Nguồn: [functions/src/customer-notification-delivery.ts:1](../../../functions/src/customer-notification-delivery.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `customerNotificationCreated` | onDocumentCreated | [functions/src/customer-notification-delivery.ts:105](../../../functions/src/customer-notification-delivery.ts#L105) |

Helper kiểm soát được tham chiếu: `releaseCapabilityAllowed`.

Payload được chuẩn hóa bằng schema/helper nhập từ module khác hoặc được dựng theo trigger. Tham chiếu domain/imports và handler tại nguồn để xác định hợp đồng đầy đủ.
## customer-order-tracking

Nguồn: [functions/src/customer-order-tracking.ts:1](../../../functions/src/customer-order-tracking.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `customerOrderTracking` | onCall | [functions/src/customer-order-tracking.ts:71](../../../functions/src/customer-order-tracking.ts#L71) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `failed-precondition`, `invalid-argument`, `permission-denied`.

### shipment — schema tại dòng 14

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `id` | `z.string().max(80)` | Xem helper và điều kiện tiếp theo |
| `ownerId` | `z.string()` | Xem helper và điều kiện tiếp theo |
| `state` | `z.enum(["packed", "in_transit", "delivered", "failed", "returned"])` | Xem helper và điều kiện tiếp theo |
| `route` | `z.string().max(200)` | Xem helper và điều kiện tiếp theo |
| `carrier` | `z.string().max(100).optional()` | Có optional/default ở lớp ngoài |
| `tracking` | `z.string().max(100).optional()` | Có optional/default ở lớp ngoài |
| `updatedAt` | `z.number().int().positive().max(8_640_000_000_000_000).optional()` | Có optional/default ở lớp ngoài |
| `allocations` | `z .array( z.object({ orderId: z.string(), line: z.number().int().min(0).max(29), quantity: z.number().int().min(1).max(100), }), ) .max(100)` | Xem helper và điều kiện tiếp theo |

### shipment.allocations — schema tại dòng 24

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `orderId` | `z.string()` | Xem helper và điều kiện tiếp theo |
| `line` | `z.number().int().min(0).max(29)` | Xem helper và điều kiện tiếp theo |
| `quantity` | `z.number().int().min(1).max(100)` | Xem helper và điều kiện tiếp theo |

### input — schema tại dòng 79

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `orderId` | `z.string().refine(validTrackingId)` | Xem helper và điều kiện tiếp theo |

### core — schema tại dòng 101

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `stage` | `z.enum(trackingStages)` | Xem helper và điều kiện tiếp theo |
| `purchaseKind` | `z.enum(["catalog", "custom"]).optional()` | Có optional/default ở lớp ngoài |
| `version` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `hold` | `z.string().optional()` | Có optional/default ở lớp ngoài |

### parsed — schema tại dòng 207

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.string().max(80)` | Xem helper và điều kiện tiếp theo |
| `createdAt` | `z.number().int().positive().max(observedAt)` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/customer-order-tracking.ts:224](../../../functions/src/customer-order-tracking.ts#L224) | `orderId`, `stage`, `purchaseKind`, `upfrontPayment`, `version`, `onHold`, `observedAt`, `timeline`, `timelinePartial`, `shipments`, `shipmentsPartial`, `estimate` |
## dashboard-analytics

Nguồn: [functions/src/dashboard-analytics.ts:1](../../../functions/src/dashboard-analytics.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `dashboardAnalytics` | onCall | [functions/src/dashboard-analytics.ts:22](../../../functions/src/dashboard-analytics.ts#L22) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `data-loss`, `invalid-argument`, `permission-denied`.

### rangeSchema — schema tại dòng 15

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `from` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `until` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
## email

Nguồn: [functions/src/email.ts:1](../../../functions/src/email.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `deliverEmail` | onSchedule | [functions/src/email.ts:23](../../../functions/src/email.ts#L23) |

Helper kiểm soát được tham chiếu: `releaseCapabilityAllowed`.

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/email.ts:149](../../../functions/src/email.ts#L149) | `customerEvent`, `customerSnapshotHash`, `recipientHash`, `contentHash`, `providerRequestIdentity`, `providerFrom`, `createdAt`, `ownerId`, `action`, `marketing`, `documentId`, `documentNumber`, `claimId` |

Payload được chuẩn hóa bằng schema/helper nhập từ module khác hoặc được dựng theo trigger. Tham chiếu domain/imports và handler tại nguồn để xác định hợp đồng đầy đủ.
## finance-review

Nguồn: [functions/src/finance-review.ts:1](../../../functions/src/finance-review.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `financeReview` | onCall | [functions/src/finance-review.ts:15](../../../functions/src/finance-review.ts#L15) |

Helper kiểm soát được tham chiếu: `recentMfa`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`, `unauthenticated`.

### parsed — schema tại dòng 27

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("reverse")` | Xem helper và điều kiện tiếp theo |
| `orderId` | `z.string().regex(/^[a-zA-Z0-9-]{1,80}$/)` | Xem helper và điều kiện tiếp theo |
| `entryId` | `z.string().regex(/^[a-zA-Z0-9-]{1,160}$/)` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `amount` | `money.positive()` | Xem helper và điều kiện tiếp theo |
| `bankTransactionId` | `z.string().trim().min(4).max(120)` | Xem helper và điều kiện tiếp theo |
| `evidence` | `z.string().trim().min(5).max(1000)` | Xem helper và điều kiện tiếp theo |
| `reason` | `z.string().trim().min(5).max(500)` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |

### parsed — schema tại dòng 40

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("closeException")` | Xem helper và điều kiện tiếp theo |
| `id` | `z.string().regex(/^[a-zA-Z0-9-]{1,160}$/)` | Xem helper và điều kiện tiếp theo |
| `evidence` | `z.string().trim().min(5).max(1000)` | Xem helper và điều kiện tiếp theo |
| `reason` | `z.string().trim().min(5).max(500)` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |

### parsed — schema tại dòng 49

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("allocateException")` | Xem helper và điều kiện tiếp theo |
| `id` | `z.string().regex(/^[a-zA-Z0-9-]{1,160}$/)` | Xem helper và điều kiện tiếp theo |
| `orderId` | `z.string().regex(/^[a-zA-Z0-9-]{1,80}$/)` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `evidence` | `z.string().trim().min(5).max(1000)` | Xem helper và điều kiện tiếp theo |
| `reason` | `z.string().trim().min(5).max(500)` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
## index

Nguồn: [functions/src/index.ts:1](../../../functions/src/index.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `command` | onCall | [functions/src/index.ts:47](../../../functions/src/index.ts#L47) |

Helper kiểm soát được tham chiếu: `recentMfa`, `requireRole`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`, `unauthenticated`.

### schema — schema tại dòng 29

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.string().min(1).max(60)` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `orderId` | `z .string() .regex(/^[a-zA-Z0-9-]{1,80}$/) .optional()` | Có optional/default ở lớp ngoài |
| `expectedVersion` | `z.number().int().nonnegative().optional()` | Có optional/default ở lớp ngoài |
| `payload` | `z.unknown()` | Xem helper và điều kiện tiếp theo |

### p — schema tại dòng 211

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `amount` | `money.positive()` | Xem helper và điều kiện tiếp theo |
| `bankTransactionId` | `z.string().trim().min(4).max(120)` | Xem helper và điều kiện tiếp theo |
| `evidence` | `z.string().min(5).max(1000)` | Xem helper và điều kiện tiếp theo |
| `reason` | `z.string().min(3).max(500)` | Xem helper và điều kiện tiếp theo |
| `reviewId` | `z .string() .regex(/^[a-zA-Z0-9-]{1,160}$/) .optional()` | Có optional/default ở lớp ngoài |
| `refundRequestId` | `z.string().uuid().optional()` | Có optional/default ở lớp ngoài |

### p — schema tại dòng 283

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `reference` | `z.string().min(3).max(100)` | Xem helper và điều kiện tiếp theo |
| `amount` | `money.positive()` | Xem helper và điều kiện tiếp theo |
## invoice-share

Nguồn: [functions/src/invoice-share.ts:1](../../../functions/src/invoice-share.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `invoiceShare` | onCall | [functions/src/invoice-share.ts:9](../../../functions/src/invoice-share.ts#L9) |

Mã lỗi khai báo: `not-found`, `resource-exhausted`.

### p — schema tại dòng 22

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `token` | `z.string().regex(/^[a-f0-9]{64}$/)` | Xem helper và điều kiện tiếp theo |
## invoices

Nguồn: [functions/src/invoices.ts:1](../../../functions/src/invoices.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `invoiceCommand` | onCall | [functions/src/invoices.ts:44](../../../functions/src/invoices.ts#L44) |
| `invoiceList` | onCall | [functions/src/invoices.ts:293](../../../functions/src/invoices.ts#L293) |
| `invoiceDetail` | onCall | [functions/src/invoices.ts:339](../../../functions/src/invoices.ts#L339) |

Helper kiểm soát được tham chiếu: `recentMfa`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `not-found`, `permission-denied`, `resource-exhausted`.

### schema — schema tại dòng 23

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.enum([ "configure", "createDraft", "refreshDraft", "issue", "void", "createShare", "revokeShare", "queueEmail", ])` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `id` | `idSchema.optional()` | Có optional/default ở lớp ngoài |
| `orderId` | `idSchema.optional()` | Có optional/default ở lớp ngoài |
| `replacesId` | `idSchema.optional()` | Có optional/default ở lớp ngoài |
| `expectedVersion` | `z.number().int().positive().optional()` | Có optional/default ở lớp ngoài |
| `seller` | `sellerSchema.optional()` | Có optional/default ở lớp ngoài |
| `reason` | `z.string().trim().min(5).max(500).optional()` | Có optional/default ở lớp ngoài |

### d — schema tại dòng 295

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `after` | `idSchema.optional()` | Có optional/default ở lớp ngoài |
| `orderId` | `idSchema.optional()` | Có optional/default ở lớp ngoài |

### d — schema tại dòng 341

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `id` | `idSchema` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/invoices.ts:323](../../../functions/src/invoices.ts#L323) | `rows`, `next`, `canIssue`, `canConfigure`, `seller` |
## jobs

Nguồn: [functions/src/jobs.ts:1](../../../functions/src/jobs.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `maintenance` | onSchedule | [functions/src/jobs.ts:15](../../../functions/src/jobs.ts#L15) |
| `readNotification` | onCall | [functions/src/jobs.ts:318](../../../functions/src/jobs.ts#L318) |

Helper kiểm soát được tham chiếu: `releaseCapabilityAllowed`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `invalid-argument`, `permission-denied`.

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/jobs.ts:343](../../../functions/src/jobs.ts#L343) | `ok` |

Payload được chuẩn hóa bằng schema/helper nhập từ module khác hoặc được dựng theo trigger. Tham chiếu domain/imports và handler tại nguồn để xác định hợp đồng đầy đủ.
## media

Nguồn: [functions/src/media.ts:1](../../../functions/src/media.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `uploadContentImage` | onCall | [functions/src/media.ts:10](../../../functions/src/media.ts#L10) |
| `publicImage` | onRequest | [functions/src/media.ts:95](../../../functions/src/media.ts#L95) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `invalid-argument`, `permission-denied`, `unauthenticated`.

### data — schema tại dòng 22

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `mime` | `z.enum(["image/png", "image/jpeg", "image/webp"])` | Xem helper và điều kiện tiếp theo |
| `base64` | `z .string() .max(2800000) .regex(/^[A-Za-z0-9+/]*={0,2}$/)` | Xem helper và điều kiện tiếp theo |
| `alt` | `z.string().min(2).max(300)` | Xem helper và điều kiện tiếp theo |
| `rightsConfirmed` | `z.literal(true)` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/media.ts:92](../../../functions/src/media.ts#L92) | `id` |
## membership-reminder-policy

Nguồn: [functions/src/membership-reminder-policy.ts:1](../../../functions/src/membership-reminder-policy.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `membershipReminderPolicy` | onCall | [functions/src/membership-reminder-policy.ts:29](../../../functions/src/membership-reminder-policy.ts#L29) |

Helper kiểm soát được tham chiếu: `recentMfa`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`.

### membershipReminderInput — schema tại dòng 11

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("read")` | Xem helper và điều kiện tiếp theo |

### membershipReminderInput — schema tại dòng 12

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("save")` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z .number() .int() .nonnegative() .max(Number.MAX_SAFE_INTEGER - 1)` | Xem helper và điều kiện tiếp theo |
| `approved` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `daysBeforeExpiry` | `z.number().int().min(1).max(30).optional()` | Có optional/default ở lớp ngoài |
## membership

Nguồn: [functions/src/membership.ts:1](../../../functions/src/membership.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `membershipCommand` | onCall | [functions/src/membership.ts:53](../../../functions/src/membership.ts#L53) |

Helper kiểm soát được tham chiếu: `recentMfa`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`, `unauthenticated`.

### d — schema tại dòng 64

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.enum([ "purchase", "confirm", "grant", "cancelRenewal", "requestRenewal", "cancelInvoice", ])` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `planId` | `z .string() .regex(/^[a-zA-Z0-9-]{1,80}$/) .optional()` | Có optional/default ở lớp ngoài |
| `invoiceId` | `z .string() .regex(/^[a-zA-Z0-9-]{1,80}$/) .optional()` | Có optional/default ở lớp ngoài |
| `ownerId` | `z .string() .regex(/^[a-zA-Z0-9-]{1,128}$/) .optional()` | Có optional/default ở lớp ngoài |
| `amount` | `money.optional()` | Có optional/default ở lớp ngoài |
| `bankTransactionId` | `z.string().trim().min(4).max(120).optional()` | Có optional/default ở lớp ngoài |
| `evidence` | `z.string().min(5).max(1000).optional()` | Có optional/default ở lớp ngoài |
| `reason` | `z.string().min(5).max(500).optional()` | Có optional/default ở lớp ngoài |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/membership.ts:51](../../../functions/src/membership.ts#L51) | `startsAt`, `endsAt` |
## notification-preferences

Nguồn: [functions/src/notification-preferences.ts:1](../../../functions/src/notification-preferences.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `notificationPreferences` | onCall | [functions/src/notification-preferences.ts:29](../../../functions/src/notification-preferences.ts#L29) |

Helper kiểm soát được tham chiếu: `releaseCapabilityAllowed`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `invalid-argument`, `permission-denied`.

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/notification-preferences.ts:23](../../../functions/src/notification-preferences.ts#L23) | `email`, `verified`, `disabled` |
| [functions/src/notification-preferences.ts:73](../../../functions/src/notification-preferences.ts#L73) | `availability` |

Payload được chuẩn hóa bằng schema/helper nhập từ module khác hoặc được dựng theo trigger. Tham chiếu domain/imports và handler tại nguồn để xác định hợp đồng đầy đủ.
## order-conversation

Nguồn: [functions/src/order-conversation.ts:1](../../../functions/src/order-conversation.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `readOrderConversation` | onCall | [functions/src/order-conversation.ts:53](../../../functions/src/order-conversation.ts#L53) |
| `orderConversationCommand` | onCall | [functions/src/order-conversation.ts:153](../../../functions/src/order-conversation.ts#L153) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`.

### parsed — schema tại dòng 55

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `orderId` | `conversationId` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/order-conversation.ts:47](../../../functions/src/order-conversation.ts#L47) | `ownerId`, `staff` |
| [functions/src/order-conversation.ts:138](../../../functions/src/order-conversation.ts#L138) | `currentStaffId`, `version`, `staff`, `messages`, `hasEarlierMessages`, `notes`, `hasEarlierNotes`, `assignee`, `staffChoices`, `staffChoicesTruncated` |
## order-history

Nguồn: [functions/src/order-history.ts:1](../../../functions/src/order-history.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `orderHistory` | onCall | [functions/src/order-history.ts:5](../../../functions/src/order-history.ts#L5) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `invalid-argument`, `permission-denied`, `unauthenticated`.

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/order-history.ts:60](../../../functions/src/order-history.ts#L60) | `order`, `timeline`, `entries` |

Payload được chuẩn hóa bằng schema/helper nhập từ module khác hoặc được dựng theo trigger. Tham chiếu domain/imports và handler tại nguồn để xác định hợp đồng đầy đủ.
## order-media

Nguồn: [functions/src/order-media.ts:1](../../../functions/src/order-media.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `uploadOrderImage` | onCall | [functions/src/order-media.ts:81](../../../functions/src/order-media.ts#L81) |
| `listOrderImages` | onCall | [functions/src/order-media.ts:199](../../../functions/src/order-media.ts#L199) |
| `readOrderImage` | onCall | [functions/src/order-media.ts:227](../../../functions/src/order-media.ts#L227) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `already-exists`, `invalid-argument`, `permission-denied`, `resource-exhausted`, `unauthenticated`, `unavailable`.

### parsed — schema tại dòng 85

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `mime` | `z.enum(["image/png", "image/jpeg", "image/webp"])` | Xem helper và điều kiện tiếp theo |
| `base64` | `z .string() .max(2800000) .regex(/^[A-Za-z0-9+/]*={0,2}$/)` | Xem helper và điều kiện tiếp theo |
| `description` | `z.string().trim().min(2).max(300)` | Xem helper và điều kiện tiếp theo |

### parsed — schema tại dòng 203

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |

### parsed — schema tại dòng 231

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `id` | `z.string().regex(/^[a-f0-9]{64}$/)` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/order-media.ts:79](../../../functions/src/order-media.ts#L79) | `readableKinds` |
| [functions/src/order-media.ts:166](../../../functions/src/order-media.ts#L166) | `id` |
| [functions/src/order-media.ts:218](../../../functions/src/order-media.ts#L218) | `rows` |
| [functions/src/order-media.ts:254](../../../functions/src/order-media.ts#L254) | `mime`, `base64`, `description` |
## outbox-command

Nguồn: [functions/src/outbox-command.ts:1](../../../functions/src/outbox-command.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `outboxCommand` | onCall | [functions/src/outbox-command.ts:25](../../../functions/src/outbox-command.ts#L25) |

Helper kiểm soát được tham chiếu: `recentMfa`, `releaseCapabilityAllowed`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`.

### schema — schema tại dòng 15

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `id` | `z.string().regex(/^[a-zA-Z0-9_-]{1,256}$/)` | Xem helper và điều kiện tiếp theo |
| `action` | `z.enum(["retry", "resolveUnknown"])` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `outcome` | `z.enum(["confirmed_sent", "confirmed_not_sent"]).optional()` | Có optional/default ở lớp ngoài |
| `evidence` | `z.string().trim().min(5).max(500).optional()` | Có optional/default ở lớp ngoài |
## payos

Nguồn: [functions/src/payments/payos.ts:1](../../../functions/src/payments/payos.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `createPaymentLink` | onCall | [functions/src/payments/payos.ts:163](../../../functions/src/payments/payos.ts#L163) |
| `payosWebhook` | onRequest | [functions/src/payments/payos.ts:362](../../../functions/src/payments/payos.ts#L362) |
| `reconcilePayments` | onSchedule | [functions/src/payments/payos.ts:383](../../../functions/src/payments/payos.ts#L383) |

Helper kiểm soát được tham chiếu: `releaseCapabilityAllowed`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `failed-precondition`, `invalid-argument`, `permission-denied`, `unauthenticated`, `unavailable`.

### p — schema tại dòng 175

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `orderId` | `z.string().regex(/^[a-zA-Z0-9-]{1,80}$/)` | Xem helper và điều kiện tiếp theo |
| `purpose` | `z.enum(["full", "deposit", "balance"])` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/payments/payos.ts:258](../../../functions/src/payments/payos.ts#L258) | `id`, `shouldCreate`, `expiresAt`, `checkoutUrl`, `qrCode`, `description`, `bin` |
| [functions/src/payments/payos.ts:282](../../../functions/src/payments/payos.ts#L282) | `checkoutUrl` |
| [functions/src/payments/payos.ts:344](../../../functions/src/payments/payos.ts#L344) | `checkoutUrl`, `qrCode`, `expiresAt`, `amount`, `accountNumber`, `description`, `bin` |
## product-reviews

Nguồn: [functions/src/product-reviews.ts:1](../../../functions/src/product-reviews.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `productReviewRead` | onCall | [functions/src/product-reviews.ts:518](../../../functions/src/product-reviews.ts#L518) |
| `productReviewEligibility` | onCall | [functions/src/product-reviews.ts:525](../../../functions/src/product-reviews.ts#L525) |
| `productReviewWrite` | onCall | [functions/src/product-reviews.ts:532](../../../functions/src/product-reviews.ts#L532) |
| `productReviewModerate` | onCall | [functions/src/product-reviews.ts:535](../../../functions/src/product-reviews.ts#L535) |
| `productReviewAdmin` | onCall | [functions/src/product-reviews.ts:542](../../../functions/src/product-reviews.ts#L542) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `not-found`, `permission-denied`, `resource-exhausted`.

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/product-reviews.ts:85](../../../functions/src/product-reviews.ts#L85) | `state`, `variant` |
| [functions/src/product-reviews.ts:128](../../../functions/src/product-reviews.ts#L128) | `histogram` |
| [functions/src/product-reviews.ts:197](../../../functions/src/product-reviews.ts#L197) | `items`, `summary`, `next`, `mine` |
| [functions/src/product-reviews.ts:219](../../../functions/src/product-reviews.ts#L219) | `state`, `orders`, `next` |
| [functions/src/product-reviews.ts:221](../../../functions/src/product-reviews.ts#L221) | `orders`, `next` |
| [functions/src/product-reviews.ts:267](../../../functions/src/product-reviews.ts#L267) | `mine` |
| [functions/src/product-reviews.ts:374](../../../functions/src/product-reviews.ts#L374) | `ok` |
| [functions/src/product-reviews.ts:491](../../../functions/src/product-reviews.ts#L491) | `items`, `next` |
| [functions/src/product-reviews.ts:495](../../../functions/src/product-reviews.ts#L495) | `id`, `productId`, `productTitle`, `productSlug`, `version`, `status`, `draft`, `reason`, `hasPublished` |

Payload được chuẩn hóa bằng schema/helper nhập từ module khác hoặc được dựng theo trigger. Tham chiếu domain/imports và handler tại nguồn để xác định hợp đồng đầy đủ.
## public-order-tracking

Nguồn: [functions/src/public-order-tracking.ts:1](../../../functions/src/public-order-tracking.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `publicOrderTracking` | onCall | [functions/src/public-order-tracking.ts:91](../../../functions/src/public-order-tracking.ts#L91) |
| `managePublicTrackingCode` | onCall | [functions/src/public-order-tracking.ts:168](../../../functions/src/public-order-tracking.ts#L168) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `not-found`, `permission-denied`, `resource-exhausted`, `unavailable`.

### parsed — schema tại dòng 98

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `code` | `publicTrackingCode` | Xem helper và điều kiện tiếp theo |

### parsed — schema tại dòng 175

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.enum(["issue", "revoke"])` | Xem helper và điều kiện tiếp theo |
| `orderId` | `z.string().refine(validTrackingId)` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/public-order-tracking.ts:226](../../../functions/src/public-order-tracking.ts#L226) | `code`, `expiresAt` |
## public

Nguồn: [functions/src/public.ts:1](../../../functions/src/public.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `publicPage` | onRequest | [functions/src/public.ts:106](../../../functions/src/public.ts#L106) |
| `publicDiscovery` | onRequest | [functions/src/public.ts:293](../../../functions/src/public.ts#L293) |

Payload được chuẩn hóa bằng schema/helper nhập từ module khác hoặc được dựng theo trigger. Tham chiếu domain/imports và handler tại nguồn để xác định hợp đồng đầy đủ.
## purchase-adjustment

Nguồn: [functions/src/purchase-adjustment.ts:1](../../../functions/src/purchase-adjustment.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `purchaseSourcingChange` | onCall | [functions/src/purchase-adjustment.ts:49](../../../functions/src/purchase-adjustment.ts#L49) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`.

### schema — schema tại dòng 12

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("propose")` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `orderId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `sourceLimitMinor` | `money.positive()` | Xem helper và điều kiện tiếp theo |
| `reason` | `z.string().trim().min(5).max(1000)` | Xem helper và điều kiện tiếp theo |

### schema — schema tại dòng 22

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("approve")` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `orderId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `proposalVersion` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/purchase-adjustment.ts:38](../../../functions/src/purchase-adjustment.ts#L38) | `total`, `reason` |
## purchase-checkout

Nguồn: [functions/src/purchase-checkout.ts:1](../../../functions/src/purchase-checkout.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `purchaseCheckout` | onCall | [functions/src/purchase-checkout.ts:191](../../../functions/src/purchase-checkout.ts#L191) |
| `purchaseBalanceCheckout` | onCall | [functions/src/purchase-checkout.ts:473](../../../functions/src/purchase-checkout.ts#L473) |
| `purchaseCheckoutSetup` | onCall | [functions/src/purchase-checkout.ts:668](../../../functions/src/purchase-checkout.ts#L668) |
| `purchaseOrderRead` | onCall | [functions/src/purchase-checkout.ts:715](../../../functions/src/purchase-checkout.ts#L715) |
| `purchaseDemoPayment` | onCall | [functions/src/purchase-checkout.ts:442](../../../functions/src/purchase-checkout.ts#L442) |

Helper kiểm soát được tham chiếu: `purchaseDemoEnvironment`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`.

### inputSchema — schema tại dòng 49

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("addRequest")` | Xem helper và điều kiện tiếp theo |
| `operationId` | `opId` | Xem helper và điều kiện tiếp theo |
| `expectedRevision` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `request` | `researchedRequestSchema` | Xem helper và điều kiện tiếp theo |

### inputSchema — schema tại dòng 57

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("preview")` | Xem helper và điều kiện tiếp theo |
| `operationId` | `opId` | Xem helper và điều kiện tiếp theo |
| `expectedRevision` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `recipient` | `checkoutRecipientSchema` | Xem helper và điều kiện tiếp theo |
| `shipping` | `shippingQuoteInputSchema.optional()` | Có optional/default ở lớp ngoài |

### inputSchema — schema tại dòng 66

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("commit")` | Xem helper và điều kiện tiếp theo |
| `operationId` | `opId` | Xem helper và điều kiện tiếp theo |
| `previewId` | `opId` | Xem helper và điều kiện tiếp theo |
| `previewHash` | `z.string().regex(/^[a-f0-9]{64}$/)` | Xem helper và điều kiện tiếp theo |
| `confirmed` | `z.literal(true)` | Xem helper và điều kiện tiếp theo |
| `paymentMethod` | `paymentMethodSchema.optional()` | Có optional/default ở lớp ngoài |

### inputSchema — schema tại dòng 76

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("status")` | Xem helper và điều kiện tiếp theo |
| `id` | `opId` | Xem helper và điều kiện tiếp theo |

### parsed — schema tại dòng 454

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `id` | `opId` | Xem helper và điều kiện tiếp theo |
| `outcome` | `z.enum(["pending", "unknown", "paid", "cancelled"])` | Xem helper và điều kiện tiếp theo |

### parsed — schema tại dòng 479

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("preview")` | Xem helper và điều kiện tiếp theo |
| `operationId` | `opId` | Xem helper và điều kiện tiếp theo |
| `orderId` | `opId` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |

### parsed — schema tại dòng 487

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("commit")` | Xem helper và điều kiện tiếp theo |
| `operationId` | `opId` | Xem helper và điều kiện tiếp theo |
| `previewId` | `opId` | Xem helper và điều kiện tiếp theo |
| `previewHash` | `z.string().regex(/^[a-f0-9]{64}$/)` | Xem helper và điều kiện tiếp theo |
| `confirmed` | `z.literal(true)` | Xem helper và điều kiện tiếp theo |
| `paymentMethod` | `paymentMethodSchema.optional()` | Có optional/default ở lớp ngoài |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/purchase-checkout.ts:132](../../../functions/src/purchase-checkout.ts#L132) | `cart`, `policy`, `tariff`, `regions`, `products`, `drafts` |
| [functions/src/purchase-checkout.ts:153](../../../functions/src/purchase-checkout.ts#L153) | `state` |
| [functions/src/purchase-checkout.ts:163](../../../functions/src/purchase-checkout.ts#L163) | `state`, `amountUsdMinor`, `basis`, `version` |
| [functions/src/purchase-checkout.ts:189](../../../functions/src/purchase-checkout.ts#L189) | `province`, `commune` |
| [functions/src/purchase-checkout.ts:683](../../../functions/src/purchase-checkout.ts#L683) | `paymentCapabilities`, `regions`, `pricing`, `shipping`, `shippingOrigin` |
| [functions/src/purchase-checkout.ts:726](../../../functions/src/purchase-checkout.ts#L726) | `version`, `balanceCheckoutId` |
## purchase-demo-gateway

Nguồn: [functions/src/purchase-demo-gateway.ts:1](../../../functions/src/purchase-demo-gateway.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `purchaseDemoWebhook` | onRequest | [functions/src/purchase-demo-gateway.ts:307](../../../functions/src/purchase-demo-gateway.ts#L307) |

Helper kiểm soát được tham chiếu: `purchaseDemoEnvironment`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `failed-precondition`, `invalid-argument`, `permission-denied`.

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/purchase-demo-gateway.ts:60](../../../functions/src/purchase-demo-gateway.ts#L60) | `paymentLinkId`, `orderCode`, `amount`, `currency`, `status`, `expiresAt`, `checkoutUrl` |
| [functions/src/purchase-demo-gateway.ts:84](../../../functions/src/purchase-demo-gateway.ts#L84) | `code`, `desc`, `success`, `data`, `signature` |

Payload được chuẩn hóa bằng schema/helper nhập từ module khác hoặc được dựng theo trigger. Tham chiếu domain/imports và handler tại nguồn để xác định hợp đồng đầy đủ.
## purchase-images

Nguồn: [functions/src/purchase-images.ts:1](../../../functions/src/purchase-images.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `purchaseDraftImage` | onCall | [functions/src/purchase-images.ts:53](../../../functions/src/purchase-images.ts#L53) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`, `resource-exhausted`.

### schema — schema tại dòng 16

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("upload")` | Xem helper và điều kiện tiếp theo |
| `draftId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `itemIndex` | `z.number().int().min(0).max(29)` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `mime` | `z.enum(["image/jpeg", "image/png", "image/webp"])` | Xem helper và điều kiện tiếp theo |
| `base64` | `z .string() .max(2800000) .regex(/^[A-Za-z0-9+/]*={0,2}$/)` | Xem helper và điều kiện tiếp theo |

### schema — schema tại dòng 29

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("read")` | Xem helper và điều kiện tiếp theo |
| `draftId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `itemIndex` | `z.number().int().min(0).max(29)` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/purchase-images.ts:75](../../../functions/src/purchase-images.ts#L75) | `mime`, `base64` |
| [functions/src/purchase-images.ts:154](../../../functions/src/purchase-images.ts#L154) | `id` |
## purchase-receipts

Nguồn: [functions/src/purchase-receipts.ts:1](../../../functions/src/purchase-receipts.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `purchaseReceipt` | onCall | [functions/src/purchase-receipts.ts:207](../../../functions/src/purchase-receipts.ts#L207) |
| `purchaseReceiptWorker` | onDocumentCreated | [functions/src/purchase-receipts.ts:174](../../../functions/src/purchase-receipts.ts#L174) |
| `purchaseReceiptRecovery` | onSchedule | [functions/src/purchase-receipts.ts:186](../../../functions/src/purchase-receipts.ts#L186) |

Helper kiểm soát được tham chiếu: `purchaseDemoEnvironment`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `failed-precondition`, `invalid-argument`, `permission-denied`.

### input — schema tại dòng 216

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `id` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `download` | `z.boolean()` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/purchase-receipts.ts:246](../../../functions/src/purchase-receipts.ts#L246) | `state`, `emailState` |
| [functions/src/purchase-receipts.ts:257](../../../functions/src/purchase-receipts.ts#L257) | `state`, `emailState`, `mime`, `base64` |
## purchase-sepay

Nguồn: [functions/src/purchase-sepay.ts:1](../../../functions/src/purchase-sepay.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `purchaseSePayPayment` | onCall | [functions/src/purchase-sepay.ts:179](../../../functions/src/purchase-sepay.ts#L179) |
| `purchaseSePayIpn` | onRequest | [functions/src/purchase-sepay.ts:276](../../../functions/src/purchase-sepay.ts#L276) |
| `purchaseSePayInboxWorker` | onDocumentCreated | [functions/src/purchase-sepay.ts:503](../../../functions/src/purchase-sepay.ts#L503) |

Helper kiểm soát được tham chiếu: `purchaseDemoEnvironment`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `failed-precondition`, `invalid-argument`, `permission-denied`, `unavailable`.

### command — schema tại dòng 47

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `id` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `action` | `z.enum(["createCheckout", "status", "reconcile"])` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/purchase-sepay.ts:165](../../../functions/src/purchase-sepay.ts#L165) | `id`, `state`, `invoice`, `receiptId` |
| [functions/src/purchase-sepay.ts:304](../../../functions/src/purchase-sepay.ts#L304) | `kind` |
| [functions/src/purchase-sepay.ts:325](../../../functions/src/purchase-sepay.ts#L325) | `kind`, `transactionId` |
## refunds

Nguồn: [functions/src/refunds.ts:1](../../../functions/src/refunds.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `refundCommand` | onCall | [functions/src/refunds.ts:15](../../../functions/src/refunds.ts#L15) |

Helper kiểm soát được tham chiếu: `recentMfa`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`, `unauthenticated`.

### parsed — schema tại dòng 25

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.enum(["request", "cancel"])` | Xem helper và điều kiện tiếp theo |
| `orderId` | `z.string().regex(/^[a-zA-Z0-9-]{1,80}$/)` | Xem helper và điều kiện tiếp theo |
| `id` | `z.string().uuid().optional()` | Có optional/default ở lớp ngoài |
| `expectedVersion` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `amount` | `money.positive().optional()` | Có optional/default ở lớp ngoài |
| `reason` | `z.string().trim().min(5).max(500)` | Xem helper và điều kiện tiếp theo |
## returns

Nguồn: [functions/src/returns.ts:1](../../../functions/src/returns.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `returnCommand` | onCall | [functions/src/returns.ts:18](../../../functions/src/returns.ts#L18) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`, `unauthenticated`.

### schema — schema tại dòng 6

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `id` | `z.string().regex(/^[a-zA-Z0-9-]{1,80}$/)` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `action` | `z.enum(["receive", "inspect", "close"])` | Xem helper và điều kiện tiếp theo |
| `line` | `z.number().int().min(0).max(29).optional()` | Có optional/default ở lớp ngoài |
| `quantity` | `z.number().int().min(1).max(100).optional()` | Có optional/default ở lớp ngoài |
| `condition` | `z.enum(["accepted", "damaged"]).optional()` | Có optional/default ở lớp ngoài |
| `evidence` | `z.string().trim().min(5).max(1000)` | Xem helper và điều kiện tiếp theo |
## shipping-rates

Nguồn: [functions/src/shipping-rates.ts:1](../../../functions/src/shipping-rates.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `shippingRatesPublic` | onCall | [functions/src/shipping-rates.ts:76](../../../functions/src/shipping-rates.ts#L76) |
| `shippingRatesAdmin` | onCall | [functions/src/shipping-rates.ts:82](../../../functions/src/shipping-rates.ts#L82) |

Helper kiểm soát được tham chiếu: `recentMfa`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`.

### shippingRatesAdminInput — schema tại dòng 25

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("read")` | Xem helper và điều kiện tiếp theo |

### shippingRatesAdminInput — schema tại dòng 26

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("save")` | Xem helper và điều kiện tiếp theo |
| `config` | `shippingRateConfigSchema` | Xem helper và điều kiện tiếp theo |

### shippingRatesAdminInput — schema tại dòng 33

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("publish")` | Xem helper và điều kiện tiếp theo |

### shippingRatesAdminInput — schema tại dòng 34

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.literal("delete")` | Xem helper và điều kiện tiếp theo |

### shippingRatesPublic — schema tại dòng 77

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/shipping-rates.ts:59](../../../functions/src/shipping-rates.ts#L59) | `version`, `config`, `origin` |
| [functions/src/shipping-rates.ts:127](../../../functions/src/shipping-rates.ts#L127) | `version`, `config`, `publishedVersion` |
## shipping

Nguồn: [functions/src/shipping.ts:1](../../../functions/src/shipping.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `shippingCommand` | onCall | [functions/src/shipping.ts:26](../../../functions/src/shipping.ts#L26) |

Helper kiểm soát được tham chiếu: `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`, `unauthenticated`.

### parsed — schema tại dòng 30

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.enum([ "packParcel", "dispatchParcel", "trackParcel", "setDeliveryEstimate", ])` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `parcelId` | `z .string() .regex(/^[a-zA-Z0-9-]{1,80}$/) .optional()` | Có optional/default ở lớp ngoài |
| `expectedVersion` | `z.number().int().positive().optional()` | Có optional/default ở lớp ngoài |
| `orderVersions` | `z.record(z.string(), z.number().int().positive())` | Xem helper và điều kiện tiếp theo |
| `payload` | `z.unknown()` | Xem helper và điều kiện tiếp theo |

### p — schema tại dòng 95

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `allocations` | `z.array(allocationSchema).min(1).max(100)` | Xem helper và điều kiện tiếp theo |
| `weightGrams` | `z.number().int().positive().max(1000000)` | Xem helper và điều kiện tiếp theo |
| `warehouse` | `z.string().min(2).max(100)` | Xem helper và điều kiện tiếp theo |
| `route` | `z.string().min(2).max(100)` | Xem helper và điều kiện tiếp theo |
| `dimensionsCm` | `z.array(z.number().positive().max(1000)).length(3)` | Xem helper và điều kiện tiếp theo |
| `checklist` | `z.literal(true)` | Xem helper và điều kiện tiếp theo |
| `evidence` | `z.string().min(5).max(1000)` | Xem helper và điều kiện tiếp theo |

### p — schema tại dòng 161

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `carrier` | `z.string().min(2).max(100)` | Xem helper và điều kiện tiếp theo |
| `tracking` | `z.string().min(3).max(100)` | Xem helper và điều kiện tiếp theo |
| `handoffEvidence` | `z.string().min(5).max(1000)` | Xem helper và điều kiện tiếp theo |

### p — schema tại dòng 188

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `estimate` | `deliveryWindowSchema.nullable()` | Xem helper và điều kiện tiếp theo |
| `evidence` | `z.string().trim().min(5).max(1000)` | Xem helper và điều kiện tiếp theo |

### p — schema tại dòng 214

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `state` | `z.enum(["in_transit", "delivered", "failed", "returned"])` | Xem helper và điều kiện tiếp theo |
| `event` | `z.string().min(3).max(500)` | Xem helper và điều kiện tiếp theo |
## subscription-email

Nguồn: [functions/src/subscription-email.ts:1](../../../functions/src/subscription-email.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `deliverSubscriptionEmail` | onSchedule | [functions/src/subscription-email.ts:22](../../../functions/src/subscription-email.ts#L22) |

Helper kiểm soát được tham chiếu: `releaseCapabilityAllowed`.

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/subscription-email.ts:138](../../../functions/src/subscription-email.ts#L138) | `state`, `attempted`, `retryAt` |

Payload được chuẩn hóa bằng schema/helper nhập từ module khác hoặc được dựng theo trigger. Tham chiếu domain/imports và handler tại nguồn để xác định hợp đồng đầy đủ.
## workspace

Nguồn: [functions/src/workspace.ts:1](../../../functions/src/workspace.ts#L1).

| Thành phần công khai | Loại xử lý khai báo | Vị trí |
| --- | --- | --- |
| `listWork` | onCall | [functions/src/workspace.ts:37](../../../functions/src/workspace.ts#L37) |
| `workspaceCommand` | onCall | [functions/src/workspace.ts:321](../../../functions/src/workspace.ts#L321) |
| `readOwnerConfiguration` | onCall | [functions/src/workspace.ts:909](../../../functions/src/workspace.ts#L909) |
| `ticketMessages` | onCall | [functions/src/workspace.ts:990](../../../functions/src/workspace.ts#L990) |
| `readStaffAccess` | onCall | [functions/src/workspace.ts:1038](../../../functions/src/workspace.ts#L1038) |
| `readOrderOperations` | onCall | [functions/src/workspace.ts:1077](../../../functions/src/workspace.ts#L1077) |

Helper kiểm soát được tham chiếu: `recentMfa`, `requireVerifiedGoogle`.

Mã lỗi khai báo: `aborted`, `already-exists`, `failed-precondition`, `invalid-argument`, `permission-denied`, `unauthenticated`.

### parsed — schema tại dòng 57

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `kind` | Cấu trúc lồng nhau; xem [functions/src/workspace.ts:59](../../../functions/src/workspace.ts#L59) | Xem helper và điều kiện tiếp theo |
| `after` | `z.string().max(256).optional()` | Có optional/default ở lớp ngoài |
| `id` | `z .string() .regex(/^[a-zA-Z0-9-]{1,80}$/) .optional()` | Có optional/default ở lớp ngoài |
| `supportStatus` | `z.enum(["open", "resolved"]).optional()` | Có optional/default ở lớp ngoài |
| `changeState` | `z.literal("accepted").optional()` | Có optional/default ở lớp ngoài |
| `queue` | `z .enum([ "requests", "quotes", "purchasing", "warehouse", "balance", "ready", "holds", ]) .optional()` | Có optional/default ở lớp ngoài |

### contentSchema — schema tại dòng 285

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `title` | `z.string().min(2).max(160)` | Xem helper và điều kiện tiếp theo |
| `slug` | `z.string().regex(/^[a-z0-9-]{2,100}$/)` | Xem helper và điều kiện tiếp theo |
| `body` | `z.string().min(10).max(30000)` | Xem helper và điều kiện tiếp theo |
| `status` | `z.enum(["draft", "published", "archived", "scheduled"])` | Xem helper và điều kiện tiếp theo |
| `publishAt` | `z.number().int().positive().optional()` | Có optional/default ở lớp ngoài |
| `market` | `z.enum(["US", "JP", "KR"]).optional()` | Có optional/default ở lớp ngoài |
| `category` | `z.string().max(80).optional()` | Có optional/default ở lớp ngoài |
| `referenceUrl` | `z .string() .url() .max(2048) .refine((value) =&gt; /^https?:\/\//i.test(value)) .optional()` | Có optional/default ở lớp ngoài |
| `variants` | `z.string().max(500).optional()` | Có optional/default ở lớp ngoài |
| `featured` | `z.boolean().optional()` | Có optional/default ở lớp ngoài |
| `featuredOrder` | `z.number().int().min(0).max(9999).default(9999)` | Có optional/default ở lớp ngoài |
| `origin` | `z.string().max(4000).optional()` | Có optional/default ở lớp ngoài |
| `functions` | `z.string().max(4000).optional()` | Có optional/default ở lớp ngoài |
| `usage` | `z.string().max(4000).optional()` | Có optional/default ở lớp ngoài |
| `seoTitle` | `z.string().min(2).max(160).optional()` | Có optional/default ở lớp ngoài |
| `seoDescription` | `z.string().min(2).max(300).optional()` | Có optional/default ở lớp ngoài |
| `referencePrice` | `money.optional()` | Có optional/default ở lớp ngoài |
| `listedPrice` | `money.positive().optional()` | Có optional/default ở lớp ngoài |
| `orderable` | `z.boolean().optional()` | Có optional/default ở lớp ngoài |
| `termsVersion` | `z.string().trim().min(1).max(80).optional()` | Có optional/default ở lớp ngoài |
| `catalogOptions` | `catalogOptionsSchema.optional()` | Có optional/default ở lớp ngoài |
| `priceCheckedAt` | `z.number().int().positive().optional()` | Có optional/default ở lớp ngoài |
| `mediaId` | `z .string() .regex(/^[a-zA-Z0-9-]{1,80}$/) .optional()` | Có optional/default ở lớp ngoài |

### parsed — schema tại dòng 328

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `action` | `z.enum([ "openTicket", "replyTicket", "saveContent", "saveCampaign", "saveProfile", "saveAddress", "saveMembershipPlan", "saveStaffAccess", "savePricingPolicy", "saveAskPilotPolicy", "saveAskCustomerPolicy", ])` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `id` | `z .string() .regex(/^[a-zA-Z0-9-]{1,128}$/) .optional()` | Có optional/default ở lớp ngoài |
| `expectedVersion` | `z.number().int().nonnegative().optional()` | Có optional/default ở lớp ngoài |
| `payload` | `z.unknown()` | Xem helper và điều kiện tiếp theo |

### payload — schema tại dòng 494

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `enabled` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `audience` | `z.enum(["owner-canary", "customers"])` | Xem helper và điều kiện tiếp theo |

### payload — schema tại dòng 544

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `enabled` | `z.boolean()` | Xem helper và điều kiện tiếp theo |

### workspaceCommand — schema tại dòng 565

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `title` | `z.string().min(2).max(160)` | Xem helper và điều kiện tiếp theo |
| `caption` | `z.string().min(3).max(4000)` | Xem helper và điều kiện tiếp theo |
| `path` | `z .string() .regex(/^\/(?:products\|posts)\/[a-z0-9-]{2,100}$/)` | Xem helper và điều kiện tiếp theo |
| `source` | `z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/)` | Xem helper và điều kiện tiếp theo |
| `medium` | `z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/)` | Xem helper và điều kiện tiếp theo |
| `campaign` | `z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/)` | Xem helper và điều kiện tiếp theo |
| `scheduledAt` | `z.number().int().positive().optional()` | Có optional/default ở lớp ngoài |
| `status` | `z.enum(["draft", "approved", "archived"])` | Xem helper và điều kiện tiếp theo |

### workspaceCommand — schema tại dòng 585

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `subject` | `z.string().min(3).max(160)` | Xem helper và điều kiện tiếp theo |
| `message` | `z.string().min(3).max(4000)` | Xem helper và điều kiện tiếp theo |
| `topic` | `z .enum(["purchase", "data-export", "data-deletion"]) .optional()` | Có optional/default ở lớp ngoài |

### workspaceCommand — schema tại dòng 601

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `message` | `z.string().min(3).max(4000)` | Xem helper và điều kiện tiếp theo |
| `status` | `z.enum(["open", "resolved"])` | Xem helper và điều kiện tiếp theo |

### p — schema tại dòng 611

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `kind` | `z.enum(["products", "posts"])` | Xem helper và điều kiện tiếp theo |
| `content` | `contentSchema` | Xem helper và điều kiện tiếp theo |

### workspaceCommand — schema tại dòng 641

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `displayName` | `z.string().min(1).max(120)` | Xem helper và điều kiện tiếp theo |
| `businessName` | `z.string().max(160)` | Xem helper và điều kiện tiếp theo |
| `marketingConsent` | `z.boolean()` | Xem helper và điều kiện tiếp theo |

### workspaceCommand — schema tại dòng 655

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `recipient` | `z.string().min(2).max(120)` | Xem helper và điều kiện tiếp theo |
| `phone` | `z.string().min(8).max(20)` | Xem helper và điều kiện tiếp theo |
| `address` | `z.string().min(10).max(500)` | Xem helper và điều kiện tiếp theo |

### workspaceCommand — schema tại dòng 669

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `name` | `z.enum(["FREE", "PLUS", "BUSINESS"])` | Xem helper và điều kiện tiếp theo |
| `price` | `money` | Xem helper và điều kiện tiếp theo |
| `periodDays` | `z.number().int().min(1).max(366)` | Xem helper và điều kiện tiếp theo |
| `serviceDiscountBps` | `z.number().int().min(0).max(10000)` | Xem helper và điều kiện tiếp theo |
| `discountCap` | `money` | Xem helper và điều kiện tiếp theo |
| `status` | `z.enum(["draft", "published", "archived"])` | Xem helper và điều kiện tiếp theo |

### workspaceCommand — schema tại dòng 684

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `approved` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `termsVersion` | `z.string().min(1).max(80)` | Xem helper và điều kiện tiếp theo |
| `rates` | Cấu trúc lồng nhau; xem [functions/src/workspace.ts:688](../../../functions/src/workspace.ts#L688) | Xem helper và điều kiện tiếp theo |
| `effectiveFrom` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `expiresAt` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |

### workspaceCommand.rates — schema tại dòng 688

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `USD` | `z.object({ numerator: z.number().int().positive().max(1e9), denominator: z.number().int().positive().max(1e9), })` | Xem helper và điều kiện tiếp theo |
| `JPY` | `z.object({ numerator: z.number().int().positive().max(1e9), denominator: z.number().int().positive().max(1e9), })` | Xem helper và điều kiện tiếp theo |
| `KRW` | `z.object({ numerator: z.number().int().positive().max(1e9), denominator: z.number().int().positive().max(1e9), })` | Xem helper và điều kiện tiếp theo |

### workspaceCommand.rates.USD — schema tại dòng 689

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `numerator` | `z.number().int().positive().max(1e9)` | Xem helper và điều kiện tiếp theo |
| `denominator` | `z.number().int().positive().max(1e9)` | Xem helper và điều kiện tiếp theo |

### workspaceCommand.rates.JPY — schema tại dòng 693

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `numerator` | `z.number().int().positive().max(1e9)` | Xem helper và điều kiện tiếp theo |
| `denominator` | `z.number().int().positive().max(1e9)` | Xem helper và điều kiện tiếp theo |

### workspaceCommand.rates.KRW — schema tại dòng 697

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `numerator` | `z.number().int().positive().max(1e9)` | Xem helper và điều kiện tiếp theo |
| `denominator` | `z.number().int().positive().max(1e9)` | Xem helper và điều kiện tiếp theo |

### own — schema tại dòng 720

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `roles` | `z.array(z.string())` | Xem helper và điều kiện tiếp theo |
| `active` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `locked` | `z.boolean()` | Xem helper và điều kiện tiếp theo |

### workspaceCommand — schema tại dòng 735

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `roles` | `z.array(z.enum(roles)).max(8)` | Xem helper và điều kiện tiếp theo |
| `active` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `locked` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `orderIds` | `z .array(z.string().regex(/^[a-zA-Z0-9-]{1,80}$/)) .max(100)` | Xem helper và điều kiện tiếp theo |

### parsed — schema tại dòng 1079

| Trường | Ràng buộc khai báo | Đầu vào |
| --- | --- | --- |
| `orderId` | `z.string().regex(/^[a-zA-Z0-9-]{1,80}$/)` | Xem helper và điều kiện tiếp theo |

### Đối tượng trả về khai báo trực tiếp

Các dòng dưới ghi hình dạng return xuất hiện trong module, gồm cả hàm hỗ trợ và nhánh giao dịch. Chúng không tự xác định response của mọi export; kiểm tra vị trí nguồn và nhánh trước khi dùng. Giá trị secret/token thật không được đưa vào tài liệu.

| Vị trí | Các trường trả về |
| --- | --- |
| [functions/src/workspace.ts:185](../../../functions/src/workspace.ts#L185) | `rows`, `next` |
| [functions/src/workspace.ts:230](../../../functions/src/workspace.ts#L230) | `id`, `action`, `resourceId`, `createdAt` |
| [functions/src/workspace.ts:237](../../../functions/src/workspace.ts#L237) | `id`, `action`, `state`, `emailState`, `createdAt`, `attempts`, `version` |
| [functions/src/workspace.ts:258](../../../functions/src/workspace.ts#L258) | `id`, `ownerId`, `items`, `market`, `stage`, `version`, `packingComplete`, `packedQuantity`, `hold`, `createdAt` |
| [functions/src/workspace.ts:271](../../../functions/src/workspace.ts#L271) | `id` |
| [functions/src/workspace.ts:937](../../../functions/src/workspace.ts#L937) | `customerAi`, `askPilot`, `pricing` |
| [functions/src/workspace.ts:1027](../../../functions/src/workspace.ts#L1027) | `messages` |
| [functions/src/workspace.ts:1064](../../../functions/src/workspace.ts#L1064) | `access` |
| [functions/src/workspace.ts:1114](../../../functions/src/workspace.ts#L1114) | `recipient`, `receiving`, `packing`, `purchase` |

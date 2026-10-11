# Từ điển dữ liệu và schema nghiệp vụ

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Cách đọc

Phần này ghi các cấu trúc có tên và schema trong thư viện domain. TypeScript type mô tả hình dạng ở bước biên dịch; Zod schema kiểm tra dữ liệu lúc chạy. Type và schema không đồng nghĩa quyền truy cập hoặc khả năng lưu trực tiếp vào Firestore. Trường có dấu optional chỉ nói về hình dạng; nghiệp vụ có thể yêu cầu theo trạng thái.

Các biểu thức giữ tên helper trong nguồn để tránh diễn giải sai giới hạn. Ví dụ money là helper tiền VND; instant là thời điểm hợp lệ; một refine có thể kiểm tra quan hệ nhiều trường mà bảng thuộc tính không thể biểu diễn đủ. Xem hàm/schema tại liên kết nguồn khi thay đổi contract. Không thay payload bằng giá trị mẫu chỉ để vượt validation.

## action-preview.ts

Nguồn: [packages/domain/action-preview.ts:1](../../../packages/domain/action-preview.ts#L1).

### PreviewCommand — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `action` | `PreviewAction` | Không |
| `payload` | `unknown` | Không |
| `expectedOrderVersion` | `number` | Có |

### PreviewScope — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `ownerId` | `string` | Không |
| `conversationId` | `string` | Không |
| `epoch` | `number` | Không |
| `conversationVersion` | `number` | Không |
| `orderId` | `string \| null` | Không |
| `orderVersion` | `number \| null` | Không |
| `draftSignature` | `string` | Không |
| `localRevision` | `number` | Không |
| `history` | `boolean` | Không |

### PreviewDetail — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `vi` | `string` | Không |
| `en` | `string` | Không |
| `value` | `string \| number` | Không |
| `kind` | `"money" \| "time"` | Có |
| `secondary` | `boolean` | Có |

## analytics.ts

Nguồn: [packages/domain/analytics.ts:1](../../../packages/domain/analytics.ts#L1).

### analyticsEventSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `at` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `kind` | `z.literal("page")` | Xem helper và điều kiện tiếp theo |
| `route` | `publicRouteSchema` | Xem helper và điều kiện tiếp theo |

### analyticsEventSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `at` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `kind` | `z.enum(["product_view", "product_click"])` | Xem helper và điều kiện tiếp theo |
| `productId` | `analyticsId` | Xem helper và điều kiện tiếp theo |

### analyticsEventSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `at` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `kind` | `z.literal("ask")` | Xem helper và điều kiện tiếp theo |
| `topic` | `topicSchema` | Xem helper và điều kiện tiếp theo |

### sessionSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `version` | `z.literal(1)` | Xem helper và điều kiện tiếp theo |
| `consent` | `z.literal(CONSENT_VERSION)` | Xem helper và điều kiện tiếp theo |
| `browserId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `requestId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |

### ingestSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `version` | `z.literal(1)` | Xem helper và điều kiện tiếp theo |
| `session` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `events` | `z.array(analyticsEventSchema).min(1).max(20)` | Xem helper và điều kiện tiếp theo |

### linkSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `session` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `orderId` | `analyticsId` | Xem helper và điều kiện tiếp theo |

### dayRow — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `day` | `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` | Xem helper và điều kiện tiếp theo |
| `counts` | `z.record(z.string(), count)` | Xem helper và điều kiện tiếp theo |

### productRow — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `analyticsId` | Xem helper và điều kiện tiếp theo |
| `title` | `z.string().max(160).optional()` | Có optional/default ở lớp ngoài |
| `slug` | `z .string() .regex(/^[a-zA-Z0-9-]{1,160}$/) .optional()` | Có optional/default ở lớp ngoài |
| `views` | `count` | Xem helper và điều kiện tiếp theo |
| `clicks` | `count` | Xem helper và điều kiện tiếp theo |
| `paidOrders` | `count.nullable()` | Xem helper và điều kiện tiếp theo |

### topicRow — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `topicSchema` | Xem helper và điều kiện tiếp theo |
| `questions` | `count` | Xem helper và điều kiện tiếp theo |
| `sessions` | `count` | Xem helper và điều kiện tiếp theo |

### analyticsSnapshotSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `version` | `z.literal(1)` | Xem helper và điều kiện tiếp theo |
| `from` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `until` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `asOf` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `startedAt` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `enabled` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `complete` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `workingAvailable` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `finance` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `availability` | `z .object({ traffic: z.boolean(), products: z.boolean(), topics: z.boolean(), stages: z.boolean(), reason: z.enum(["ready", "not_collected", "retention", "read_limit"]), }) .strict()` | Xem helper và điều kiện tiếp theo |
| `days` | `z.array(dayRow).max(31)` | Xem helper và điều kiện tiếp theo |
| `products` | `z.array(productRow).max(10)` | Xem helper và điều kiện tiếp theo |
| `topics` | `z.array(topicRow).max(10)` | Xem helper và điều kiện tiếp theo |
| `stages` | `z.record(z.string(), count)` | Xem helper và điều kiện tiếp theo |
| `sessions` | `count.nullable()` | Xem helper và điều kiện tiếp theo |
| `browsers` | `count.nullable()` | Xem helper và điều kiện tiếp theo |
| `accounts` | `count.nullable()` | Xem helper và điều kiện tiếp theo |
| `buyers` | `count.nullable()` | Xem helper và điều kiện tiếp theo |
| `convertedSessions` | `count.nullable()` | Xem helper và điều kiện tiếp theo |
| `productSessions` | `count.nullable()` | Xem helper và điều kiện tiếp theo |
| `convertedProductSessions` | `count.nullable()` | Xem helper và điều kiện tiếp theo |
| `paidOrders` | `count.nullable()` | Xem helper và điều kiện tiếp theo |
| `linkedPaidOrders` | `count.nullable()` | Xem helper và điều kiện tiếp theo |
| `provisional` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `backlog` | `count` | Xem helper và điều kiện tiếp theo |
| `deadLetters` | `count` | Xem helper và điều kiện tiếp theo |
| `oldestPendingAt` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `lastWorkerAt` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |

### analyticsSnapshotSchema.availability — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `traffic` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `products` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `topics` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `stages` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `reason` | `z.enum(["ready", "not_collected", "retention", "read_limit"])` | Xem helper và điều kiện tiếp theo |

## ask-command-result.ts

Nguồn: [packages/domain/ask-command-result.ts:1](../../../packages/domain/ask-command-result.ts#L1).

### resultSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `z .string() .regex(/^[A-Za-z0-9_-]{1,100}$/) .optional()` | Có optional/default ở lớp ngoài |
| `version` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |

### pendingSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `conversationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |
| `expectedOrderVersion` | `z.number().int().positive().safe().optional()` | Có optional/default ở lớp ngoài |
| `action` | `z.enum([ "submitRequest", "catalogCheckout", "acceptQuote", "approveFinal", "confirmReceipt", ])` | Xem helper và điều kiện tiếp theo |
| `payload` | `z.unknown().optional()` | Có optional/default ở lớp ngoài |

### absent — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `version` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |
| `outcome` | `z.literal("no_operation")` | Xem helper và điều kiện tiếp theo |

## ask-feedback.ts

Nguồn: [packages/domain/ask-feedback.ts:1](../../../packages/domain/ask-feedback.ts#L1).

### feedbackPolicySchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `enabled` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `version` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `retentionDays` | `z.number().int().min(1).max(90)` | Xem helper và điều kiện tiếp theo |
| `expiresAt` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |

### askFeedbackSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `submittedAt` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `expectedPolicyVersion` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `conversationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `answerHash` | `hash` | Xem helper và điều kiện tiếp theo |
| `consent` | `z.literal(true)` | Xem helper và điều kiện tiếp theo |
| `category` | `z.enum([ "helpful", "missing_information", "incorrect_information", "hard_to_understand", ])` | Xem helper và điều kiện tiếp theo |

### feedbackReviewSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `ownerId` | `z.string().regex(/^[A-Za-z0-9_-]{1,128}$/)` | Xem helper và điều kiện tiếp theo |
| `feedbackId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `disposition` | `z.enum(["acknowledged", "needs_source_review", "resolved"])` | Xem helper và điều kiện tiếp theo |
| `source` | `z .object({ key: z.string().regex(/^(?:posts\|blogPublished)-[A-Za-z0-9_-]{1,100}$/), version: z.number().int().positive().safe(), contentHash: hash, }) .strict() .optional()` | Có optional/default ở lớp ngoài |

### feedbackReviewSchema.source — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `key` | `z.string().regex(/^(?:posts\|blogPublished)-[A-Za-z0-9_-]{1,100}$/)` | Xem helper và điều kiện tiếp theo |
| `version` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `contentHash` | `hash` | Xem helper và điều kiện tiếp theo |

### feedbackWithdrawalSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `feedbackId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |

### feedbackInboxSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `rows` | Cấu trúc lồng nhau; xem [packages/domain/ask-feedback.ts:52](../../../packages/domain/ask-feedback.ts#L52) | Xem helper và điều kiện tiếp theo |
| `limited` | `z.boolean()` | Xem helper và điều kiện tiếp theo |

### feedbackInboxSchema.rows — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `ownerId` | `z.string().regex(/^[A-Za-z0-9_-]{1,128}$/)` | Xem helper và điều kiện tiếp theo |
| `feedbackId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `category` | `askFeedbackSchema.shape.category` | Xem helper và điều kiện tiếp theo |
| `reviewVersion` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `createdAt` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `expiresAt` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `disposition` | `z.enum([ "unreviewed", "acknowledged", "needs_source_review", "resolved", ])` | Xem helper và điều kiện tiếp theo |

### feedbackEvaluationResultSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `datasetHash` | `hash` | Xem helper và điều kiện tiếp theo |
| `corpusHash` | `hash` | Xem helper và điều kiện tiếp theo |
| `cases` | `z .array( z .object({ id: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/), passed: z.boolean(), }) .strict(), ) .min(1) .max(100)` | Xem helper và điều kiện tiếp theo |
| `passed` | `z.number().int().nonnegative().max(100)` | Xem helper và điều kiện tiếp theo |
| `total` | `z.number().int().positive().max(100)` | Xem helper và điều kiện tiếp theo |
| `decision` | `z.enum(["REVIEW_REQUIRED", "REJECTED"])` | Xem helper và điều kiện tiếp theo |
| `scope` | `z.literal("retrieval_only")` | Xem helper và điều kiện tiếp theo |
| `automaticPromotion` | `z.literal(false)` | Xem helper và điều kiện tiếp theo |

### feedbackEvaluationResultSchema.cases — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `z.string().regex(/^[A-Za-z0-9_-]{1,100}$/)` | Xem helper và điều kiện tiếp theo |
| `passed` | `z.boolean()` | Xem helper và điều kiện tiếp theo |

## ask-hybrid-policy.ts

Nguồn: [packages/domain/ask-hybrid-policy.ts:1](../../../packages/domain/ask-hybrid-policy.ts#L1).

### HybridFacts — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `scope` | `"business" \| "outside" \| "unclear"` | Không |
| `authority` | `"complete" \| "needs-explanation" \| "needs-details" \| "unavailable"` | Không |
| `criticalAction` | `boolean` | Không |
| `access` | `"allowed" \| "denied"` | Không |
| `pilotEligible` | `boolean` | Không |
| `aiEnabled` | `boolean` | Không |
| `evidenceCurrent` | `boolean` | Không |
| `budgetAvailable` | `boolean` | Không |
| `hasImage` | `boolean` | Không |

### HybridDecision — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `path` | `"existing" \| "clarify" \| "support" \| "boundary" \| "ai"` | Không |
| `reason` | `string` | Không |

## ask-images.ts

Nguồn: [packages/domain/ask-images.ts:1](../../../packages/domain/ask-images.ts#L1).

### askImageSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `mime` | `z.enum(["image/png", "image/jpeg", "image/webp"])` | Xem helper và điều kiện tiếp theo |
| `base64` | `z .string() .min(32) .max(2800000) .regex(/^[A-Za-z0-9+/]*={0,2}$/)` | Xem helper và điều kiện tiếp theo |

## ask-knowledge.ts

Nguồn: [packages/domain/ask-knowledge.ts:1](../../../packages/domain/ask-knowledge.ts#L1).

### knowledgePreviewSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `sourceId` | `identifier` | Xem helper và điều kiện tiếp theo |

### knowledgePreviewResultSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `sourceId` | `identifier` | Xem helper và điều kiện tiếp theo |
| `title` | `z.string().max(200)` | Xem helper và điều kiện tiếp theo |
| `body` | `z.string().max(20000)` | Xem helper và điều kiện tiếp theo |
| `published` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `contentHash` | `z .string() .regex(/^[a-f0-9]{64}$/) .nullable()` | Xem helper và điều kiện tiếp theo |
| `version` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |
| `active` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `approved` | `z.boolean()` | Xem helper và điều kiện tiếp theo |

### knowledgeCommandSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("approve")` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `sourceId` | `identifier` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |
| `contentHash` | `z.string().regex(/^[a-f0-9]{64}$/)` | Xem helper và điều kiện tiếp theo |
| `language` | `z.enum(["vi", "en"])` | Xem helper và điều kiện tiếp theo |
| `effectiveFrom` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |
| `effectiveTo` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |

### knowledgeCommandSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("revoke")` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `sourceId` | `identifier` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |

### approvedKnowledgeSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `schemaVersion` | `z.literal(1)` | Xem helper và điều kiện tiếp theo |
| `sourceId` | `identifier` | Xem helper và điều kiện tiếp theo |
| `version` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `active` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `language` | `z.enum(["vi", "en"])` | Xem helper và điều kiện tiếp theo |
| `effectiveFrom` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |
| `effectiveTo` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `contentHash` | `z.string().regex(/^[a-f0-9]{64}$/)` | Xem helper và điều kiện tiếp theo |
| `reviewedBy` | `z.string().min(1).max(128)` | Xem helper và điều kiện tiếp theo |
| `reviewedAt` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |

## ask-read-task-plan.ts

Nguồn: [packages/domain/ask-read-task-plan.ts:1](../../../packages/domain/ask-read-task-plan.ts#L1).

### ReadTask — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `id` | `string` | Không |
| `tool` | `ReadTool` | Không |
| `params` | `JsonValue` | Không |

### ReadAdapter — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `parseParams` | `(value: unknown) =&gt; JsonValue` | Không |
| `parseResult` | `(value: unknown) =&gt; JsonValue` | Không |
| `read` | `(input: { subject: string; requestId: string; params: JsonValue; signal: AbortSignal; }) =&gt; unknown \| Promise&lt;unknown&gt;` | Không |

## ask-research.ts

Nguồn: [packages/domain/ask-research.ts:1](../../../packages/domain/ask-research.ts#L1).

### researchPolicySchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `version` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `enabled` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `expiresAt` | `timestamp` | Xem helper và điều kiện tiếp theo |
| `merchants` | Cấu trúc lồng nhau; xem [packages/domain/ask-research.ts:16](../../../packages/domain/ask-research.ts#L16) | Xem helper và điều kiện tiếp theo |

### researchPolicySchema.merchants — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `kind` | `z.enum(["retailer", "marketplace"])` | Xem helper và điều kiện tiếp theo |
| `market` | `z.enum(["US", "JP", "KR"])` | Xem helper và điều kiện tiếp theo |
| `sellerIds` | `z.array(identifier).min(1).max(20)` | Xem helper và điều kiện tiếp theo |

### researchOfferInputSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `title` | `z.string().trim().min(2).max(160)` | Xem helper và điều kiện tiếp theo |
| `market` | `z.enum(["US", "JP", "KR"])` | Xem helper và điều kiện tiếp theo |
| `variant` | `z.string().trim().min(1).max(160)` | Xem helper và điều kiện tiếp theo |
| `sellerId` | `identifier` | Xem helper và điều kiện tiếp theo |
| `url` | Cấu trúc lồng nhau; xem [packages/domain/ask-research.ts:42](../../../packages/domain/ask-research.ts#L42) | Xem helper và điều kiện tiếp theo |
| `observedAt` | `timestamp` | Xem helper và điều kiện tiếp theo |
| `expiresAt` | `timestamp` | Xem helper và điều kiện tiếp theo |
| `price` | `z .object({ amountMinor: z.number().int().positive().safe().max(1_000_000_000), currency: z.enum(["USD", "JPY", "KRW"]), sourceText: quote, }) .strict() .nullable()` | Xem helper và điều kiện tiếp theo |
| `reviews` | `z .object({ rating: z.number().min(0).max(5), count: z.number().int().positive().max(100_000_000), sourceText: quote, }) .strict() .nullable()` | Xem helper và điều kiện tiếp theo |

### researchOfferInputSchema.price — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `amountMinor` | `z.number().int().positive().safe().max(1_000_000_000)` | Xem helper và điều kiện tiếp theo |
| `currency` | `z.enum(["USD", "JPY", "KRW"])` | Xem helper và điều kiện tiếp theo |
| `sourceText` | `quote` | Xem helper và điều kiện tiếp theo |

### researchOfferInputSchema.reviews — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `rating` | `z.number().min(0).max(5)` | Xem helper và điều kiện tiếp theo |
| `count` | `z.number().int().positive().max(100_000_000)` | Xem helper và điều kiện tiếp theo |
| `sourceText` | `quote` | Xem helper và điều kiện tiếp theo |

### researchCommandSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("approve")` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `id` | `identifier` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |
| `offer` | `researchOfferInputSchema` | Xem helper và điều kiện tiếp theo |

### researchCommandSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("revoke")` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `id` | `identifier` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |

### researchSearchSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `query` | `z.string().trim().min(2).max(200)` | Xem helper và điều kiện tiếp theo |
| `market` | `z.enum(["US", "JP", "KR"])` | Xem helper và điều kiện tiếp theo |

### researchSearchResultSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `offers` | `z.array(researchOfferSchema).max(5)` | Xem helper và điều kiện tiếp theo |
| `scanned` | `z.number().int().nonnegative().max(100)` | Xem helper và điều kiện tiếp theo |
| `limited` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `observedAt` | `timestamp` | Xem helper và điều kiện tiếp theo |

### researchSelectSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `identifier` | Xem helper và điều kiện tiếp theo |
| `version` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `contentHash` | `z.string().regex(/^[a-f0-9]{64}$/)` | Xem helper và điều kiện tiếp theo |
| `quantity` | `z.number().int().min(1).max(99)` | Xem helper và điều kiện tiếp theo |

### researchSelectResultSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `offer` | `researchOfferSchema` | Xem helper và điều kiện tiếp theo |
| `draft` | `requestSchema` | Xem helper và điều kiện tiếp theo |

## ask-response-composer.ts

Nguồn: [packages/domain/ask-response-composer.ts:1](../../../packages/domain/ask-response-composer.ts#L1).

### BusinessPanel — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `id` | `string` | Không |
| `subject` | `string` | Không |
| `requestId` | `string` | Không |
| `conversationId` | `string` | Không |
| `kind` | `ReadTool` | Không |
| `resourceKey` | `string` | Không |
| `revision` | `number` | Không |
| `status` | `"ready" \| "unavailable" \| "pending"` | Không |
| `payload` | `JsonValue` | Không |

### ConversationView — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `subject` | `string` | Không |
| `requestId` | `string` | Không |
| `conversationId` | `string` | Không |
| `evidenceVersion` | `number` | Không |
| `addressRevision` | `number` | Không |
| `address` | `Address` | Không |
| `panels` | `BusinessPanel[]` | Không |
| `explanation` | `string \| null` | Không |

## ask-stream.ts

Nguồn: [packages/domain/ask-stream.ts:1](../../../packages/domain/ask-stream.ts#L1).

### askAnswerSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `language` | `z.enum(["vi", "en"])` | Xem helper và điều kiện tiếp theo |
| `title` | `z.string().max(160)` | Xem helper và điều kiện tiếp theo |
| `paragraphs` | `z.array(z.string().max(1500)).min(1).max(6)` | Xem helper và điều kiện tiếp theo |
| `bullets` | `z.array(z.string().max(400)).max(8)` | Xem helper và điều kiện tiếp theo |
| `sourceIds` | `z.array(z.string().max(108)).max(8)` | Xem helper và điều kiện tiếp theo |
| `action` | `z.string().max(108)` | Xem helper và điều kiện tiếp theo |
| `followUp` | `z.string().max(500).optional()` | Có optional/default ở lớp ngoài |
| `draft` | `requestSchema.optional()` | Có optional/default ở lớp ngoài |
| `shoppingDraft` | `requestSchema.partial().optional()` | Có optional/default ở lớp ngoài |

### askStreamEventSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `type` | `z.literal("status")` | Xem helper và điều kiện tiếp theo |
| `phase` | `z.enum(["retrieving", "selecting"])` | Xem helper và điều kiện tiếp theo |

### askStreamEventSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `type` | `z.literal("answer")` | Xem helper và điều kiện tiếp theo |
| `answer` | `askAnswerSchema` | Xem helper và điều kiện tiếp theo |

## ask-task-frame.ts

Nguồn: [packages/domain/ask-task-frame.ts:1](../../../packages/domain/ask-task-frame.ts#L1).

### TaskPayloads — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `tracking` | `unknown` | Không |
| `catalog` | `unknown` | Không |
| `fees` | `unknown` | Không |

### VerifiedPayloads — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `tracking` | `{ orderId: string }` | Không |
| `catalog` | `{ question: string }` | Không |
| `fees` | `{ direction: "US_VN" \| "VN_US"; question: string }` | Không |

### CanonicalReadDetectors — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `tracking` | `( raw: string, ) =&gt; \| { kind: "none" } \| { kind: "order"; orderId: string } \| { kind: "ambiguous"; orderIds: string[] }` | Không |
| `catalog` | `(raw: string) =&gt; boolean` | Không |
| `product` | `(raw: string) =&gt; { requiresInterpretation: boolean }` | Không |
| `direction` | `(raw: string) =&gt; "US_VN" \| "VN_US" \| null` | Không |
| `actionOrAmbiguity` | `(raw: string) =&gt; boolean` | Không |

## ask-web.ts

Nguồn: [packages/domain/ask-web.ts:1](../../../packages/domain/ask-web.ts#L1).

### webDiscoveryResultSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `conversationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |
| `market` | `z.enum(["US", "JP", "KR"])` | Xem helper và điều kiện tiếp theo |
| `queryHash` | `z.string().regex(/^[a-f0-9]{64}$/)` | Xem helper và điều kiện tiếp theo |
| `discoveryId` | `z.string().regex(/^[a-f0-9]{64}$/)` | Xem helper và điều kiện tiếp theo |
| `observedAt` | `time` | Xem helper và điều kiện tiếp theo |
| `expiresAt` | `time` | Xem helper và điều kiện tiếp theo |
| `candidates` | Cấu trúc lồng nhau; xem [packages/domain/ask-web.ts:18](../../../packages/domain/ask-web.ts#L18) | Xem helper và điều kiện tiếp theo |
| `suggestionsHtml` | `z.string().min(1).max(30000)` | Xem helper và điều kiện tiếp theo |

### webDiscoveryResultSchema.candidates — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `url` | `z .string() .url() .max(4096) .refine((value) =&gt; { const u = new URL(value); return ( u.protocol === "https:" && !u.username && !u.password && !u.port && !u.hash ); })` | Xem helper và điều kiện tiếp theo |
| `title` | `z.string().min(1).max(160)` | Xem helper và điều kiện tiếp theo |
| `price` | `z.null()` | Xem helper và điều kiện tiếp theo |
| `reviews` | `z.null()` | Xem helper và điều kiện tiếp theo |
| `verified` | `z.literal(false)` | Xem helper và điều kiện tiếp theo |

### webSelectInputSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `discoveryId` | `z.string().regex(/^[a-f0-9]{64}$/)` | Xem helper và điều kiện tiếp theo |
| `conversationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |
| `index` | `z.number().int().min(0).max(4)` | Xem helper và điều kiện tiếp theo |
| `quantity` | `z.number().int().min(1).max(99)` | Xem helper và điều kiện tiếp theo |
| `variant` | `z.string().trim().min(1).max(160)` | Xem helper và điều kiện tiếp theo |

### webSelectResultSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `draft` | `requestSchema` | Xem helper và điều kiện tiếp theo |

## ask-workflow.ts

Nguồn: [packages/domain/ask-workflow.ts:1](../../../packages/domain/ask-workflow.ts#L1).

### recipientSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `recipient` | `z.string().trim().min(2).max(120)` | Xem helper và điều kiện tiếp theo |
| `phone` | `z.string().trim().min(8).max(20)` | Xem helper và điều kiện tiếp theo |
| `address` | `z.string().trim().min(10).max(500)` | Xem helper và điều kiện tiếp theo |

### conversationTurnSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `question` | `z.string().trim().min(1).max(1000)` | Xem helper và điều kiện tiếp theo |
| `answer` | `askAnswerSchema` | Xem helper và điều kiện tiếp theo |

### askConversationSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `ownerId` | `z.string().min(1).max(128)` | Xem helper và điều kiện tiếp theo |
| `version` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |
| `updatedAt` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |
| `turns` | `z.array(conversationTurnSchema).max(24)` | Xem helper và điều kiện tiếp theo |
| `draft` | `shoppingDraftSchema.optional()` | Có optional/default ở lớp ngoài |
| `orderId` | `z .string() .regex(/^[A-Za-z0-9_-]{1,100}$/) .optional()` | Có optional/default ở lớp ngoài |
| `recipientSaved` | `z.boolean().optional()` | Có optional/default ở lớp ngoài |
| `pendingOperation` | `z.string().uuid().nullable().optional()` | Có optional/default ở lớp ngoài |

### conversationActionSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("catalogCheckout")` | Xem helper và điều kiện tiếp theo |
| `payload` | `catalogSelectionSchema` | Xem helper và điều kiện tiếp theo |

### conversationActionSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("confirmReceipt")` | Xem helper và điều kiện tiếp theo |
| `payload` | `z.object({ received: z.literal(true) }).strict()` | Xem helper và điều kiện tiếp theo |

### conversationActionSchema.payload — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `received` | `z.literal(true)` | Xem helper và điều kiện tiếp theo |

### conversationActionSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("saveDraft")` | Xem helper và điều kiện tiếp theo |
| `payload` | `shoppingDraftSchema` | Xem helper và điều kiện tiếp theo |

### conversationActionSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("saveTurn")` | Xem helper và điều kiện tiếp theo |
| `payload` | `conversationTurnSchema` | Xem helper và điều kiện tiếp theo |

### conversationActionSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("submitRequest")` | Xem helper và điều kiện tiếp theo |
| `payload` | `requestSchema` | Xem helper và điều kiện tiếp theo |

### conversationActionSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("acceptQuote")` | Xem helper và điều kiện tiếp theo |
| `payload` | `z.object({ quoteVersion: z.number().int().positive() }).strict()` | Xem helper và điều kiện tiếp theo |

### conversationActionSchema.payload — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `quoteVersion` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |

### conversationActionSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("approveFinal")` | Xem helper và điều kiện tiếp theo |
| `payload` | `z.object({}).strict()` | Xem helper và điều kiện tiếp theo |

### conversationActionSchema.payload — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |

### conversationActionSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("saveRecipient")` | Xem helper và điều kiện tiếp theo |
| `payload` | `recipientSchema` | Xem helper và điều kiện tiếp theo |

### AskConversation — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `ownerId` | `string` | Không |
| `version` | `number` | Không |
| `updatedAt` | `number` | Không |
| `turns` | `ConversationTurn[]` | Không |
| `draft` | `ShoppingDraft` | Có |
| `orderId` | `string` | Có |
| `recipientSaved` | `boolean` | Có |
| `pendingOperation` | `string \| null` | Có |

## blog-comments.ts

Nguồn: [packages/domain/blog-comments.ts:1](../../../packages/domain/blog-comments.ts#L1).

### blogCommentSubmitSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `postId` | `studioIdSchema` | Xem helper và điều kiện tiếp theo |
| `parentId` | `z.union([studioIdSchema, z.literal("")]).default("")` | Có optional/default ở lớp ngoài |
| `text` | `z .string() .trim() .min(1) .max(2000) .refine( (v) =&gt; v.normalize("NFKC").replace(/[\u200b-\u200d\ufeff\s]/gu, "").length &gt; 0, )` | Xem helper và điều kiện tiếp theo |
| `name` | `z.string().trim().min(1).max(80)` | Xem helper và điều kiện tiếp theo |
| `operationId` | `studioIdSchema` | Xem helper và điều kiện tiếp theo |

### blogCommentListSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `postId` | `studioIdSchema` | Xem helper và điều kiện tiếp theo |
| `parentId` | `z.union([studioIdSchema, z.literal("")]).default("")` | Có optional/default ở lớp ngoài |
| `sort` | `z.enum(["newest", "oldest"]).default("newest")` | Có optional/default ở lớp ngoài |
| `commentId` | `studioIdSchema.optional()` | Có optional/default ở lớp ngoài |
| `after` | `z .string() .regex(/^[A-Za-z0-9_-]{1,256}$/) .optional()` | Có optional/default ở lớp ngoài |

### blogCommentCommandSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.enum(["edit", "delete"])` | Xem helper và điều kiện tiếp theo |
| `id` | `studioIdSchema` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z .number() .int() .positive() .max(Number.MAX_SAFE_INTEGER - 1)` | Xem helper và điều kiện tiếp theo |
| `operationId` | `studioIdSchema` | Xem helper và điều kiện tiếp theo |
| `text` | `z.string().trim().min(1).max(2000).optional()` | Có optional/default ở lớp ngoài |

### blogCommentReportSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `studioIdSchema` | Xem helper và điều kiện tiếp theo |
| `reason` | `z.string().trim().min(1).max(500)` | Xem helper và điều kiện tiếp theo |
| `operationId` | `studioIdSchema` | Xem helper và điều kiện tiếp theo |

### BlogComment — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `id` | `string` | Không |
| `postId` | `string` | Không |
| `parentId` | `string` | Không |
| `uid` | `string` | Không |
| `name` | `string` | Không |
| `text` | `string` | Không |
| `status` | `string` | Không |
| `revision` | `number` | Không |
| `createdAt` | `string` | Không |
| `updatedAt` | `string` | Không |
| `badge` | `string` | Có |
| `avatar` | `string` | Có |
| `approvedReplyCount` | `number` | Có |

## blog-studio-advanced.ts

Nguồn: [packages/domain/blog-studio-advanced.ts:1](../../../packages/domain/blog-studio-advanced.ts#L1).

### studioAdvancedReadSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `kind` | `z.enum([ "list", "summary", "catalog", "members", "assignable", "export", "reports", ])` | Xem helper và điều kiện tiếp theo |
| `reportState` | `z.enum(["open", "resolved"]).optional()` | Có optional/default ở lớp ngoài |
| `catalog` | `z.enum(["authors", "taxonomy"]).optional()` | Có optional/default ở lớp ngoài |
| `q` | `z.string().max(200).optional()` | Có optional/default ở lớp ngoài |
| `state` | `z .enum(["draft", "review", "published", "archived", "open", "resolved"]) .optional()` | Có optional/default ở lớp ngoài |
| `category` | `z.string().max(80).optional()` | Có optional/default ở lớp ngoài |
| `after` | `z.string().max(256).optional()` | Có optional/default ở lớp ngoài |

### studioAdvancedCommandSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.enum([ "categoryCreate", "catalogUpdate", "memberSave", "memberRevoke", "cancelSchedule", "reportResolve", ])` | Xem helper và điều kiện tiếp theo |
| `id` | `z .string() .regex(/^[a-zA-Z0-9_-]{1,200}$/u) .optional()` | Có optional/default ở lớp ngoài |
| `operationId` | `studioIdSchema` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z .number() .int() .positive() .max(Number.MAX_SAFE_INTEGER - 1) .optional()` | Có optional/default ở lớp ngoài |
| `payload` | `z.unknown().optional()` | Có optional/default ở lớp ngoài |

## blog-studio.ts

Nguồn: [packages/domain/blog-studio.ts:1](../../../packages/domain/blog-studio.ts#L1).

### studioDraftSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `title` | `z.string().trim().max(180)` | Xem helper và điều kiện tiếp theo |
| `slug` | `z.union([slug, z.literal("")])` | Xem helper và điều kiện tiếp theo |
| `summary` | `z.string().trim().max(500)` | Xem helper và điều kiện tiếp theo |
| `answer` | `z.string().trim().max(1200).default("")` | Có optional/default ở lớp ngoài |
| `authorId` | `z.string().max(128)` | Xem helper và điều kiện tiếp theo |
| `assignee` | `z.string().max(128).default("")` | Có optional/default ở lớp ngoài |
| `category` | `z.string().max(80)` | Xem helper và điều kiện tiếp theo |
| `tags` | `z.array(z.string().trim().min(1).max(40)).max(10)` | Xem helper và điều kiện tiếp theo |
| `language` | `z.enum(["vi", "en"])` | Xem helper và điều kiện tiếp theo |
| `coverId` | `z.union([studioIdSchema, z.literal("")]).default("")` | Có optional/default ở lớp ngoài |
| `commentsEnabled` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `seoTitle` | `z.string().max(180).default("")` | Có optional/default ở lớp ngoài |
| `seoDescription` | `z.string().max(500).default("")` | Có optional/default ở lớp ngoài |
| `sources` | `z .array( z .object({ title: z.string().trim().min(1).max(200), url: z.string().max(2000).refine(safeUrl), }) .strict(), ) .max(30)` | Xem helper và điều kiện tiếp theo |
| `body` | `z.unknown().transform((v, ctx) =&gt; { try { return validateBody(v); } catch { ctx.addIssue({ code: "custom", message: "INVALID_BODY" }); return z.NEVER; } })` | Xem helper và điều kiện tiếp theo |

### studioDraftSchema.sources — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `title` | `z.string().trim().min(1).max(200)` | Xem helper và điều kiện tiếp theo |
| `url` | `z.string().max(2000).refine(safeUrl)` | Xem helper và điều kiện tiếp theo |

### studioSettingsSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `commentsEnabled` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `requireReview` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `categories` | `z.array(z.string().trim().min(1).max(80)).max(100)` | Xem helper và điều kiện tiếp theo |
| `authors` | Cấu trúc lồng nhau; xem [packages/domain/blog-studio.ts:247](../../../packages/domain/blog-studio.ts#L247) | Xem helper và điều kiện tiếp theo |

### studioSettingsSchema.authors — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `z.string().min(1).max(128)` | Xem helper và điều kiện tiếp theo |
| `name` | `z.string().trim().min(1).max(120)` | Xem helper và điều kiện tiếp theo |
| `bio` | `z.string().max(500).default("")` | Có optional/default ở lớp ngoài |
| `avatarId` | `z.union([studioIdSchema, z.literal("")]).optional()` | Có optional/default ở lớp ngoài |
| `googleAvatar` | Cấu trúc lồng nhau; xem [packages/domain/blog-studio.ts:255](../../../packages/domain/blog-studio.ts#L255) | Có optional/default ở lớp ngoài |

### RichNode — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `type` | `string` | Không |
| `text` | `string` | Có |
| `attrs` | `Record&lt;string, unknown&gt;` | Có |
| `marks` | `{ type: string; attrs?: Record&lt;string, unknown&gt; }[]` | Có |
| `content` | `RichNode[]` | Có |

## campaign-banners.ts

Nguồn: [packages/domain/campaign-banners.ts:1](../../../packages/domain/campaign-banners.ts#L1).

### bannerDraftSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `title` | `z.string().trim().min(2).max(80)` | Xem helper và điều kiện tiếp theo |
| `description` | `z.string().trim().max(160)` | Xem helper và điều kiện tiếp theo |
| `cta` | `z.string().trim().min(2).max(40)` | Xem helper và điều kiện tiếp theo |
| `path` | `z .string() .regex( /^\/(?:products(?:\/[a-z0-9-]{2,100})?\|posts(?:\/[a-z0-9-]{2,100})?\|request\|fees\|membership)$/, )` | Xem helper và điều kiện tiếp theo |
| `desktopMediaId` | `bannerId` | Xem helper và điều kiện tiếp theo |
| `mobileMediaId` | `bannerId.optional()` | Có optional/default ở lớp ngoài |
| `placements` | `z .array(bannerPlacement) .min(1) .max(2) .refine((v) =&gt; new Set(v).size === v.length)` | Xem helper và điều kiện tiếp theo |
| `priority` | `z.number().int().min(0).max(100)` | Xem helper và điều kiện tiếp theo |
| `startsAt` | `timestamp` | Xem helper và điều kiện tiếp theo |
| `endsAt` | `timestamp` | Xem helper và điều kiện tiếp theo |

### publishedBannerSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `bannerId` | Xem helper và điều kiện tiếp theo |
| `revision` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `draft` | `bannerDraftSchema` | Xem helper và điều kiện tiếp theo |
| `desktopAlt` | `z.string().min(2).max(300)` | Xem helper và điều kiện tiếp theo |
| `mobileAlt` | `z.string().min(2).max(300).optional()` | Có optional/default ở lớp ngoài |

### bannerManifestSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `entries` | `z .array(publishedBannerSchema) .max(12) .refine((v) =&gt; new Set(v.map((x) =&gt; x.id)).size === v.length)` | Xem helper và điều kiện tiếp theo |
| `modes` | `z.object({ home: bannerMode, products: bannerMode }).strict()` | Xem helper và điều kiện tiếp theo |

### bannerManifestSchema.modes — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `home` | `bannerMode` | Xem helper và điều kiện tiếp theo |
| `products` | `bannerMode` | Xem helper và điều kiện tiếp theo |

## cart.ts

Nguồn: [packages/domain/cart.ts:1](../../../packages/domain/cart.ts#L1).

### cartItemSchema.custom — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `draftId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `itemIndex` | `z.number().int().min(0).max(29)` | Xem helper và điều kiện tiếp theo |
| `name` | `z.string().min(2).max(200)` | Xem helper và điều kiện tiếp theo |
| `market` | `z.enum(["US", "JP", "KR"])` | Xem helper và điều kiện tiếp theo |
| `unitSourceMinor` | `z.number().int().positive().max(1000000000000)` | Xem helper và điều kiện tiếp theo |
| `fxNumerator` | `z.number().int().positive().max(1e9)` | Xem helper và điều kiện tiếp theo |
| `fxDenominator` | `z.number().int().positive().max(1e9)` | Xem helper và điều kiện tiếp theo |
| `serviceBps` | `z.number().int().min(0).max(10000)` | Xem helper và điều kiện tiếp theo |

### cartSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `ownerId` | `z.string().min(1)` | Xem helper và điều kiện tiếp theo |
| `revision` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `updatedAt` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `items` | `cartItemsSchema` | Xem helper và điều kiện tiếp theo |
| `activeCheckoutId` | `z.string().uuid().nullable().optional()` | Có optional/default ở lớp ngoài |

### cartCommandSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("merge")` | Xem helper và điều kiện tiếp theo |
| `items` | `cartItemsSchema.min(1)` | Xem helper và điều kiện tiếp theo |

### cartCommandSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("quantity")` | Xem helper và điều kiện tiếp theo |
| `lineId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `quantity` | `z.number().int().min(1).max(100)` | Xem helper và điều kiện tiếp theo |

### cartCommandSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("remove")` | Xem helper và điều kiện tiếp theo |
| `lineId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |

### cartCommandSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("consume")` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `orderId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `lineId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |

## catalog-chat.ts

Nguồn: [packages/domain/catalog-chat.ts:1](../../../packages/domain/catalog-chat.ts#L1).

### CatalogChatScope — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `ownerId` | `string \| null` | Không |
| `conversationId` | `string \| null` | Không |

## catalog-checkout.ts

Nguồn: [packages/domain/catalog-checkout.ts:1](../../../packages/domain/catalog-checkout.ts#L1).

### catalogProductSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `title` | `z.string().trim().min(2).max(160)` | Xem helper và điều kiện tiếp theo |
| `slug` | `z.string().regex(/^[a-z0-9-]{2,100}$/)` | Xem helper và điều kiện tiếp theo |
| `status` | `z.literal("published")` | Xem helper và điều kiện tiếp theo |
| `version` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `orderable` | `z.literal(true)` | Xem helper và điều kiện tiếp theo |
| `listedPrice` | `money.positive()` | Xem helper và điều kiện tiếp theo |
| `termsVersion` | `z.string().trim().min(1).max(80)` | Xem helper và điều kiện tiếp theo |
| `catalogOptions` | `catalogOptionsSchema.default([])` | Có optional/default ở lớp ngoài |
| `variants` | `z.string().max(500).optional()` | Có optional/default ở lớp ngoài |
| `referenceUrl` | `z .string() .url() .refine((url) =&gt; /^https?:\/\//i.test(url)) .optional()` | Có optional/default ở lớp ngoài |

### catalogSelectionSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `productId` | `z.string().regex(/^[a-zA-Z0-9-]{1,80}$/)` | Xem helper và điều kiện tiếp theo |
| `productVersion` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `quantity` | `z.number().int().min(1).max(100)` | Xem helper và điều kiện tiếp theo |
| `variant` | `z.string().trim().max(200).default("")` | Có optional/default ở lớp ngoài |

### CatalogSnapshot — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `productId` | `string` | Không |
| `productVersion` | `number` | Không |
| `slug` | `string` | Không |
| `title` | `string` | Không |
| `variant` | `string` | Không |
| `unitPrice` | `number` | Không |
| `quantity` | `number` | Không |
| `total` | `number` | Không |
| `termsVersion` | `string` | Không |

## changes.ts

Nguồn: [packages/domain/changes.ts:1](../../../packages/domain/changes.ts#L1).

### proposalSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `kind` | `z.enum([ "substitution", "partialCancellation", "cancellation", "return", ])` | Xem helper và điều kiện tiếp theo |
| `resolveHold` | `z.boolean().default(false)` | Có optional/default ở lớp ngoài |
| `reason` | `z.string().min(5).max(1000)` | Xem helper và điều kiện tiếp theo |
| `termsVersion` | `z.string().min(1).max(80)` | Xem helper và điều kiện tiếp theo |
| `lines` | Cấu trúc lồng nhau; xem [packages/domain/changes.ts:14](../../../packages/domain/changes.ts#L14) | Xem helper và điều kiện tiếp theo |
| `finalPayable` | `money` | Xem helper và điều kiện tiếp theo |
| `actualCosts` | `money` | Xem helper và điều kiện tiếp theo |
| `evidence` | `z.string().min(5).max(1000)` | Xem helper và điều kiện tiếp theo |

### proposalSchema.lines — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `line` | `z.number().int().min(0).max(29)` | Xem helper và điều kiện tiếp theo |
| `cancelQuantity` | `z.number().int().min(0).max(100)` | Xem helper và điều kiện tiếp theo |
| `replacementName` | `z.string().min(2).max(200).optional()` | Có optional/default ở lớp ngoài |
| `replacementVariant` | `z.string().max(200).optional()` | Có optional/default ở lớp ngoài |

## consolidation.ts

Nguồn: [packages/domain/consolidation.ts:1](../../../packages/domain/consolidation.ts#L1).

### Batch — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `id` | `string` | Không |
| `version` | `number` | Không |
| `state` | `"sealed" \| "dispatched"` | Không |
| `parcelIds` | `string[]` | Không |
| `orderIds` | `string[]` | Không |
| `freight` | `number` | Không |
| `shares` | `Record&lt;string, number&gt;` | Không |
| `warehouse` | `string` | Không |
| `route` | `string` | Không |
| `hub` | `string` | Không |
| `service` | `string` | Không |
| `cutoff` | `number` | Không |

## crm.ts

Nguồn: [packages/domain/crm.ts:1](../../../packages/domain/crm.ts#L1).

### customerNotesSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `customerId` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().positive().optional()` | Có optional/default ở lớp ngoài |
| `tags` | `z.array(z.string().trim().min(1).max(40)).max(15)` | Xem helper và điều kiện tiếp theo |
| `notes` | `z.string().max(4000)` | Xem helper và điều kiện tiếp theo |
| `assigneeId` | `customerId.or(z.literal(""))` | Xem helper và điều kiện tiếp theo |
| `followUpAt` | `z.number().int().nonnegative().max(8640000000000000)` | Xem helper và điều kiện tiếp theo |

### CustomerRow — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `id` | `string` | Không |
| `displayName` | `string` | Không |
| `businessName` | `string` | Không |
| `tags` | `string[]` | Không |
| `assigneeId` | `string` | Không |
| `followUpAt` | `number` | Không |

## customer-save.ts

Nguồn: [packages/domain/customer-save.ts:1](../../../packages/domain/customer-save.ts#L1).

### customerSavePointerSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `schemaVersion` | `z.literal(1)` | Xem helper và điều kiện tiếp theo |
| `action` | `z.enum(["saveProfile", "saveAddress"])` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `commandHash` | `z.string().regex(/^[a-f0-9]{64}$/)` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |

### customerSaveResultSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `z.string().min(1).max(128)` | Xem helper và điều kiện tiếp theo |
| `version` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |

### customerSaveResolutionSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `status` | `z.literal("saved")` | Xem helper và điều kiện tiếp theo |
| `result` | `customerSaveResultSchema` | Xem helper và điều kiện tiếp theo |

### customerSaveResolutionSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `status` | `z.literal("not-saved")` | Xem helper và điều kiện tiếp theo |

## index.ts

Nguồn: [packages/domain/index.ts:1](../../../packages/domain/index.ts#L1).

### itemSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `name` | `z.string().trim().min(2).max(200)` | Xem helper và điều kiện tiếp theo |
| `url` | `z .string() .url() .max(2048) .refine((value) =&gt; /^https?:\/\//i.test(value)) .optional() .or(z.literal(""))` | Có optional/default ở lớp ngoài |
| `quantity` | `z.number().int().min(1).max(100)` | Xem helper và điều kiện tiếp theo |
| `variant` | `z.string().max(200).default("")` | Có optional/default ở lớp ngoài |
| `condition` | `z.enum(["new", "used", "any"]).optional()` | Có optional/default ở lớp ngoài |
| `unitSourceMinor` | `money.positive().optional()` | Có optional/default ở lớp ngoài |

### requestSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `items` | `z.array(itemSchema).min(1).max(30)` | Xem helper và điều kiện tiếp theo |
| `notes` | `z.string().max(2000).default("")` | Có optional/default ở lớp ngoài |
| `preferredStore` | `z.string().max(160).optional()` | Có optional/default ở lớp ngoài |
| `budget` | `money.optional()` | Có optional/default ở lớp ngoài |
| `desiredAt` | `z.number().int().positive().optional()` | Có optional/default ở lớp ngoài |

### quoteSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `goods` | `money` | Xem helper và điều kiện tiếp theo |
| `service` | `money` | Xem helper và điều kiện tiếp theo |
| `sourceCosts` | `money` | Xem helper và điều kiện tiếp theo |
| `internationalShipping` | `money` | Xem helper và điều kiện tiếp theo |
| `destinationShipping` | `money` | Xem helper và điều kiện tiếp theo |
| `discount` | `money` | Xem helper và điều kiện tiếp theo |
| `sourceCurrency` | `z.enum(["USD", "JPY", "KRW"])` | Xem helper và điều kiện tiếp theo |
| `sourceMinor` | `money` | Xem helper và điều kiện tiếp theo |
| `fxNumerator` | `z.number().int().positive().max(1e9)` | Xem helper và điều kiện tiếp theo |
| `fxDenominator` | `z.number().int().positive().max(1e9)` | Xem helper và điều kiện tiếp theo |
| `termsVersion` | `z.string().min(1).max(80)` | Xem helper và điều kiện tiếp theo |
| `expiresAt` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `verifiedProduct` | `z.string().min(2).max(1000)` | Xem helper và điều kiện tiếp theo |

### lineCountsSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `line` | `z.number().int().min(0).max(29)` | Xem helper và điều kiện tiếp theo |
| `quantity` | `z.number().int().positive().max(100)` | Xem helper và điều kiện tiếp theo |

### p — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `quoteVersion` | `z.number().int()` | Xem helper và điều kiện tiếp theo |

### p — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `quantity` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `supplierOrder` | `z.string().min(2).max(100)` | Xem helper và điều kiện tiếp theo |
| `evidence` | `z.string().min(5).max(1000)` | Xem helper và điều kiện tiếp theo |
| `actualSourceMinor` | `money` | Xem helper và điều kiện tiếp theo |
| `lines` | `lineCountsSchema.optional()` | Có optional/default ở lớp ngoài |

### p — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `quantity` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `condition` | `z.enum(["good", "damaged"])` | Xem helper và điều kiện tiếp theo |
| `shelf` | `z.string().trim().max(80).optional()` | Có optional/default ở lớp ngoài |
| `lines` | `lineCountsSchema.optional()` | Có optional/default ở lớp ngoài |
| `evidence` | `z.string().min(5).max(1000)` | Xem helper và điều kiện tiếp theo |

### evolve — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `weightGrams` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `dimensionsCm` | `z.array(z.number().positive()).length(3)` | Xem helper và điều kiện tiếp theo |
| `evidence` | `z.string().min(5).max(1000)` | Xem helper và điều kiện tiếp theo |
| `checklist` | `z.literal(true)` | Xem helper và điều kiện tiếp theo |

### p — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `total` | `money` | Xem helper và điều kiện tiếp theo |
| `reason` | `z.string().min(5).max(1000)` | Xem helper và điều kiện tiếp theo |
| `freightShare` | `money.optional()` | Có optional/default ở lớp ngoài |

### p — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `tracking` | `z.string().min(3).max(100)` | Xem helper và điều kiện tiếp theo |
| `delivered` | `z.boolean()` | Xem helper và điều kiện tiếp theo |

### evolve — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `received` | `z.literal(true)` | Xem helper và điều kiện tiếp theo |

### evolve — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `reason` | `z.string().max(500)` | Xem helper và điều kiện tiếp theo |

### Order — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `checkoutId` | `string` | Có |
| `latestReceiptId` | `string` | Có |
| `balanceCheckoutId` | `string \| null` | Có |
| `actualSourceMinor` | `number` | Có |
| `requiresSourcing` | `boolean` | Có |
| `purchaseAdjustment` | `{ version: number; sourceLimitMinor: number; total: number; reason: string; approved: boolean; }` | Có |
| `upfront` | Cấu trúc lồng nhau; xem [packages/domain/index.ts:179](../../../packages/domain/index.ts#L179) | Có |
| `purchaseKind` | `"catalog" \| "custom"` | Có |
| `catalogSnapshot` | `import("./catalog-checkout").CatalogSnapshot` | Có |
| `id` | `string` | Không |
| `ownerId` | `string` | Không |
| `market` | `z.infer&lt;typeof market&gt;` | Không |
| `items` | `z.infer&lt;typeof itemSchema&gt;[]` | Không |
| `notes` | `string` | Không |
| `preferredStore` | `string` | Có |
| `budget` | `number` | Có |
| `desiredAt` | `number` | Có |
| `stage` | `Stage` | Không |
| `version` | `number` | Không |
| `createdAt` | `number` | Không |
| `quote` | `Quote` | Có |
| `quoteVersion` | `number` | Có |
| `acceptedQuoteVersion` | `number` | Có |
| `acceptedAt` | `number` | Có |
| `deposit` | `number` | Có |
| `collected` | `number` | Không |
| `refunded` | `number` | Không |
| `refundReserved` | `number` | Có |
| `finalTotal` | `number` | Có |
| `finalApproved` | `boolean` | Có |
| `hold` | `string` | Có |
| `packingComplete` | `boolean` | Có |
| `membershipSnapshot` | `{ name: string; endsAt: number; serviceDiscountBps: number; discountCap: number; }` | Có |
| `tracking` | `string` | Có |
| `receivedQuantity` | `number` | Có |
| `packedQuantity` | `number` | Có |
| `purchasedQuantity` | `number` | Có |
| `purchasedLines` | `number[]` | Có |
| `consolidatedFreight` | `{ batchId: string; version: number; amount: number }` | Có |
| `finalFreightVersion` | `number` | Có |
| `receivedLines` | `number[]` | Có |

## invoices.ts

Nguồn: [packages/domain/invoices.ts:1](../../../packages/domain/invoices.ts#L1).

### sellerSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `name` | `z.string().trim().min(2).max(160)` | Xem helper và điều kiện tiếp theo |
| `address` | `z.string().trim().min(5).max(300)` | Xem helper và điều kiện tiếp theo |
| `contact` | `z.string().trim().min(3).max(160)` | Xem helper và điều kiện tiếp theo |

### SalesDocument — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `id` | `string` | Không |
| `ownerId` | `string` | Không |
| `sourceOrderId` | `string` | Không |
| `sourceVersion` | `number` | Không |
| `replacesId` | `string` | Có |
| `version` | `number` | Không |
| `state` | `"draft" \| "issued" \| "void"` | Không |
| `kind` | `"internal_statement"` | Không |
| `currency` | `"VND"` | Không |
| `purchaseKind` | `"catalog" \| "custom"` | Không |
| `seller` | `Seller` | Không |
| `sellerVersion` | `number` | Không |
| `buyerName` | `string` | Không |
| `lines` | `{ name: string; quantity: number; variant: string }[]` | Không |
| `total` | `number` | Không |
| `collected` | `number` | Không |
| `refunded` | `number` | Không |
| `netCollected` | `number` | Không |
| `remainingDue` | `number` | Không |
| `overpayment` | `number` | Không |
| `termsVersion` | `string` | Không |
| `createdAt` | `number` | Không |
| `changedAt` | `number` | Không |
| `issuedAt` | `number` | Có |
| `issueNumber` | `string` | Có |
| `voidReason` | `string` | Có |
| `voidedAt` | `number` | Có |
| `shareEpoch` | `number` | Không |

## notification-preferences.ts

Nguồn: [packages/domain/notification-preferences.ts:1](../../../packages/domain/notification-preferences.ts#L1).

### notificationSelectionsSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `orderEmail` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `promotionsEmail` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `orderSms` | `z.boolean()` | Xem helper và điều kiện tiếp theo |

### topicSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `requested` | `z.boolean()` | Xem helper và điều kiện tiếp theo |
| `generation` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `confirmedGeneration` | `z.number().int().nonnegative().nullable()` | Xem helper và điều kiện tiếp theo |

### notificationPreferencesSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `schemaVersion` | `z.literal(1)` | Xem helper và điều kiện tiếp theo |
| `version` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `email` | `z.string().max(254)` | Xem helper và điều kiện tiếp theo |
| `phone` | `notificationPhoneSchema` | Xem helper và điều kiện tiếp theo |
| `topics` | `z .object({ orderEmail: topicSchema, promotionsEmail: topicSchema, orderSms: topicSchema, }) .strict()` | Xem helper và điều kiện tiếp theo |
| `updatedAt` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |

### notificationPreferencesSchema.topics — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `orderEmail` | `topicSchema` | Xem helper và điều kiện tiếp theo |
| `promotionsEmail` | `topicSchema` | Xem helper và điều kiện tiếp theo |
| `orderSms` | `topicSchema` | Xem helper và điều kiện tiếp theo |

### notificationRequestSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("read")` | Xem helper và điều kiện tiếp theo |

### notificationRequestSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("save")` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.uuid()` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `selected` | `notificationSelectionsSchema` | Xem helper và điều kiện tiếp theo |
| `phone` | `notificationPhoneSchema` | Xem helper và điều kiện tiếp theo |
| `source` | `z.enum(["checkout", "profile"])` | Xem helper và điều kiện tiếp theo |

### notificationRequestSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("resend")` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.uuid()` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `channel` | `z.enum(["email", "sms"])` | Xem helper và điều kiện tiếp theo |

### notificationRequestSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("confirm")` | Xem helper và điều kiện tiếp theo |
| `token` | `z.string().regex(/^[a-f0-9]{64}$/)` | Xem helper và điều kiện tiếp theo |

### notificationRequestSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("unsubscribe")` | Xem helper và điều kiện tiếp theo |
| `token` | `z.string().regex(/^[a-f0-9]{64}$/)` | Xem helper và điều kiện tiếp theo |

## order-conversation.ts

Nguồn: [packages/domain/order-conversation.ts:1](../../../packages/domain/order-conversation.ts#L1).

### conversationCommandSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("message")` | Xem helper và điều kiện tiếp theo |
| `orderId` | `conversationId` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `text` | `z.string().trim().min(1).max(4000)` | Xem helper và điều kiện tiếp theo |

### conversationCommandSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("note")` | Xem helper và điều kiện tiếp theo |
| `orderId` | `conversationId` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `text` | `z.string().trim().min(1).max(4000)` | Xem helper và điều kiện tiếp theo |

### conversationCommandSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("assign")` | Xem helper và điều kiện tiếp theo |
| `orderId` | `conversationId` | Xem helper và điều kiện tiếp theo |
| `operationId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `assigneeId` | `staffId` | Xem helper và điều kiện tiếp theo |

### ConversationAccess — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `active` | `boolean` | Có |
| `locked` | `boolean` | Có |
| `roles` | `string[]` | Có |
| `orderIds` | `string[]` | Có |

### ConversationEntry — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `id` | `string` | Không |
| `text` | `string` | Không |
| `createdAt` | `number` | Không |
| `fromCustomer` | `boolean` | Không |

### OrderConversationData — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `currentStaffId` | `string \| null` | Không |
| `version` | `number` | Không |
| `staff` | `boolean` | Không |
| `messages` | `ConversationEntry[]` | Không |
| `hasEarlierMessages` | `boolean` | Không |
| `notes` | `ConversationEntry[]` | Không |
| `hasEarlierNotes` | `boolean` | Không |
| `assignee` | `{ id: string; name: string; available: boolean } \| null` | Không |
| `staffChoices` | `{ id: string; name: string }[]` | Không |
| `staffChoicesTruncated` | `boolean` | Không |

## order-tracking.ts

Nguồn: [packages/domain/order-tracking.ts:1](../../../packages/domain/order-tracking.ts#L1).

### estimateParcelSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `z.string().refine(validTrackingId)` | Xem helper và điều kiện tiếp theo |
| `version` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `state` | `z.enum(["packed", "in_transit", "delivered", "failed", "returned"])` | Xem helper và điều kiện tiếp theo |
| `allocations` | `z.array(allocationSchema).min(1).max(100)` | Xem helper và điều kiện tiếp theo |
| `deliveryEstimate` | `z.unknown().optional()` | Có optional/default ở lớp ngoài |

### items — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `quantity` | `z.number().int().min(1).max(100)` | Xem helper và điều kiện tiếp theo |

### allocation — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `parcelIds` | `z.array(z.string().refine(validTrackingId)).min(1).max(60)` | Xem helper và điều kiện tiếp theo |
| `allocations` | `z.array(allocationSchema).min(1).max(6000)` | Xem helper và điều kiện tiếp theo |

### OrderDeliveryEstimate — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `source` | `"staff_aggregate"` | Không |
| `startAt` | `number` | Không |
| `endAt` | `number` | Không |
| `oldestRecordedAt` | `number` | Không |
| `latestRecordedAt` | `number` | Không |

### TrackingShipment — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `id` | `string` | Không |
| `state` | `"packed" \| "in_transit" \| "delivered" \| "failed" \| "returned"` | Không |
| `route` | `string` | Không |
| `carrier` | `string` | Có |
| `tracking` | `string` | Có |
| `updatedAt` | `number` | Có |
| `deliveryEstimate` | `ShipmentDeliveryEstimate` | Có |

### CustomerOrderTracking — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `orderId` | `string` | Không |
| `stage` | `Stage` | Không |
| `purchaseKind` | `"catalog" \| "custom"` | Không |
| `upfrontPayment` | `boolean` | Có |
| `version` | `number` | Không |
| `observedAt` | `number` | Không |
| `onHold` | `boolean` | Không |
| `timeline` | `{ action: string; createdAt: number }[]` | Không |
| `timelinePartial` | `boolean` | Không |
| `shipments` | `TrackingShipment[]` | Không |
| `shipmentsPartial` | `boolean` | Không |
| `estimate` | `OrderDeliveryEstimate \| null` | Không |

## payment-qr.ts

Nguồn: [packages/domain/payment-qr.ts:1](../../../packages/domain/payment-qr.ts#L1).

### ChatPayment — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `checkoutUrl` | `string` | Không |
| `qrCode` | `string` | Có |
| `amount` | `number` | Có |
| `accountNumber` | `string` | Có |
| `description` | `string` | Có |
| `bin` | `string` | Có |
| `expiresAt` | `number` | Có |

## product-reviews.ts

Nguồn: [packages/domain/product-reviews.ts:1](../../../packages/domain/product-reviews.ts#L1).

### reviewDraftSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `rating` | `z.number().int().min(1).max(5)` | Xem helper và điều kiện tiếp theo |
| `name` | `z.string().trim().min(2).max(40)` | Xem helper và điều kiện tiếp theo |
| `text` | `meaningful` | Xem helper và điều kiện tiếp theo |

### reviewWriteSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("submit")` | Xem helper và điều kiện tiếp theo |
| `orderId` | `id.optional()` | Có optional/default ở lớp ngoài |
| `draft` | `reviewDraftSchema` | Xem helper và điều kiện tiếp theo |

### reviewWriteSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal("withdraw")` | Xem helper và điều kiện tiếp theo |

### reviewReadSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `productId` | `id` | Xem helper và điều kiện tiếp theo |
| `after` | `id.optional()` | Có optional/default ở lớp ngoài |

### reviewEligibilitySchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `productId` | `id` | Xem helper và điều kiện tiếp theo |
| `orderId` | `id.optional()` | Có optional/default ở lớp ngoài |
| `after` | `id.optional()` | Có optional/default ở lớp ngoài |

### reviewModerateSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `operationId` | `id` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `action` | `z.enum(["approve", "reject", "hide", "reply"])` | Xem helper và điều kiện tiếp theo |
| `reason` | `z.string().trim().max(1000).default("")` | Có optional/default ở lớp ngoài |

### reviewAdminSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `after` | `id.optional()` | Có optional/default ở lớp ngoài |

### p — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `count` | `z.number().int().nonnegative().max(100000000)` | Xem helper và điều kiện tiếp theo |
| `sum` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `histogram` | `z.array(z.number().int().nonnegative()).length(5)` | Xem helper và điều kiện tiếp theo |

### a — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `orderId` | `id` | Xem helper và điều kiện tiếp theo |
| `line` | `z.number().int().min(0).max(29)` | Xem helper và điều kiện tiếp theo |
| `quantity` | `z.number().int().min(1).max(100)` | Xem helper và điều kiện tiếp theo |

### parcel — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `version` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `state` | `z.enum(["packed", "in_transit", "delivered", "failed", "returned"])` | Xem helper và điều kiện tiếp theo |
| `allocations` | `z.array(a).min(1).max(100)` | Xem helper và điều kiện tiếp theo |

### order — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `ownerId` | `z.string()` | Xem helper và điều kiện tiếp theo |
| `purchaseKind` | `z.literal("catalog")` | Xem helper và điều kiện tiếp theo |
| `stage` | `z.string()` | Xem helper và điều kiện tiếp theo |
| `acceptedAt` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `collected` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `finalTotal` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `catalogSnapshot` | `z.object({ productId: id, variant: z.string().max(200), quantity: z.number().int().min(1).max(100), total: z.number().int().positive(), })` | Xem helper và điều kiện tiếp theo |
| `items` | `z .array(z.object({ quantity: z.number().int().min(1).max(100) })) .length(1)` | Xem helper và điều kiện tiếp theo |

### order.catalogSnapshot — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `productId` | `id` | Xem helper và điều kiện tiếp theo |
| `variant` | `z.string().max(200)` | Xem helper và điều kiện tiếp theo |
| `quantity` | `z.number().int().min(1).max(100)` | Xem helper và điều kiện tiếp theo |
| `total` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |

### order.items — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `quantity` | `z.number().int().min(1).max(100)` | Xem helper và điều kiện tiếp theo |

### alloc — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `parcelIds` | `z.array(id).min(1).max(60)` | Xem helper và điều kiện tiếp theo |
| `allocations` | `z.array(a).min(1).max(6000)` | Xem helper và điều kiện tiếp theo |

### ProductReview — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `id` | `string` | Không |
| `productId` | `string` | Không |
| `uid` | `string` | Không |
| `orderId` | `string` | Không |
| `variant` | `string` | Không |
| `version` | `number` | Không |
| `status` | `"pending" \| "approved" \| "rejected" \| "withdrawn" \| "hidden"` | Không |
| `draft` | `ReviewDraft` | Không |
| `approved` | `PublicProductReview \| null` | Không |
| `createdAt` | `number` | Không |
| `updatedAt` | `number` | Không |
| `reason` | `string` | Không |

### RatingSummary — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `count` | `number` | Không |
| `sum` | `number` | Không |
| `histogram` | `number[]` | Không |

### ReviewPage — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `items` | `PublicProductReview[]` | Không |
| `next` | `string \| null` | Không |
| `summary` | `{ count: number; average: number \| null; histogram: number[]; } \| null` | Không |
| `mine` | `Pick&lt;ProductReview, "version" \| "status" \| "draft" \| "reason"&gt; \| null` | Không |

### EligibilityPage — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `state` | `"eligible" \| "not_received" \| "unknown"` | Không |
| `orders` | `{ id: string; label: string }[]` | Không |
| `next` | `string \| null` | Không |

## public-order-tracking.ts

Nguồn: [packages/domain/public-order-tracking.ts:1](../../../packages/domain/public-order-tracking.ts#L1).

### publicTrackingSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `publicStatus` | `z.enum([ "received", "preparing", "shipping", "delivered", "cancelled", "temporarily_unavailable", ])` | Xem helper và điều kiện tiếp theo |
| `updatedAt` | `time.nullable()` | Xem helper và điều kiện tiếp theo |
| `observedAt` | `time` | Xem helper và điều kiện tiếp theo |
| `eta` | `z .object({ source: z.literal("staff"), startAt: time, endAt: time, recordedAt: time, }) .strict() .nullable()` | Xem helper và điều kiện tiếp theo |

### publicTrackingSchema.eta — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `source` | `z.literal("staff")` | Xem helper và điều kiện tiếp theo |
| `startAt` | `time` | Xem helper và điều kiện tiếp theo |
| `endAt` | `time` | Xem helper và điều kiện tiếp theo |
| `recordedAt` | `time` | Xem helper và điều kiện tiếp theo |

### e — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.string()` | Xem helper và điều kiện tiếp theo |
| `createdAt` | `time.max(input.observedAt)` | Xem helper và điều kiện tiếp theo |

## purchase-checkout.ts

Nguồn: [packages/domain/purchase-checkout.ts:1](../../../packages/domain/purchase-checkout.ts#L1).

### checkoutRecipientSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `recipient` | `z.string().trim().min(2).max(120)` | Xem helper và điều kiện tiếp theo |
| `phone` | `z .string() .trim() .regex(/^(?:\+84\|0)[0-9]{9,10}$/)` | Xem helper và điều kiện tiếp theo |
| `country` | `z.literal("VN")` | Xem helper và điều kiện tiếp theo |
| `provinceCode` | `z.string().regex(/^[0-9]{2}$/)` | Xem helper và điều kiện tiếp theo |
| `communeCode` | `z.string().regex(/^[0-9]{5}$/)` | Xem helper và điều kiện tiếp theo |
| `province` | `z.string().trim().min(2).max(120)` | Xem helper và điều kiện tiếp theo |
| `commune` | `z.string().trim().min(2).max(120)` | Xem helper và điều kiện tiếp theo |
| `street` | `z.string().trim().min(5).max(300)` | Xem helper và điều kiện tiếp theo |
| `note` | `z.string().trim().max(500).default("")` | Có optional/default ở lớp ngoài |

### checkoutPolicySchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `enabled` | `z.literal(true)` | Xem helper và điều kiện tiếp theo |
| `approved` | `z.literal(true)` | Xem helper và điều kiện tiếp theo |
| `version` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `serviceBps` | `z.number().int().min(0).max(10000)` | Xem helper và điều kiện tiếp theo |
| `termsVersion` | `z.string().min(1).max(80)` | Xem helper và điều kiện tiếp theo |
| `effectiveFrom` | `z.number().int().nonnegative()` | Xem helper và điều kiện tiếp theo |
| `expiresAt` | `z.number().int().positive()` | Xem helper và điều kiện tiếp theo |
| `rates` | Cấu trúc lồng nhau; xem [packages/domain/purchase-checkout.ts:47](../../../packages/domain/purchase-checkout.ts#L47) | Xem helper và điều kiện tiếp theo |

### checkoutPolicySchema.rates — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `USD` | `z.object({ numerator: z.number().int().positive().max(1e9), denominator: z.number().int().positive().max(1e9), })` | Xem helper và điều kiện tiếp theo |
| `JPY` | `z.object({ numerator: z.number().int().positive().max(1e9), denominator: z.number().int().positive().max(1e9), })` | Xem helper và điều kiện tiếp theo |
| `KRW` | `z.object({ numerator: z.number().int().positive().max(1e9), denominator: z.number().int().positive().max(1e9), })` | Xem helper và điều kiện tiếp theo |

### checkoutPolicySchema.rates.USD — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `numerator` | `z.number().int().positive().max(1e9)` | Xem helper và điều kiện tiếp theo |
| `denominator` | `z.number().int().positive().max(1e9)` | Xem helper và điều kiện tiếp theo |

### checkoutPolicySchema.rates.JPY — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `numerator` | `z.number().int().positive().max(1e9)` | Xem helper và điều kiện tiếp theo |
| `denominator` | `z.number().int().positive().max(1e9)` | Xem helper và điều kiện tiếp theo |

### checkoutPolicySchema.rates.KRW — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `numerator` | `z.number().int().positive().max(1e9)` | Xem helper và điều kiện tiếp theo |
| `denominator` | `z.number().int().positive().max(1e9)` | Xem helper và điều kiện tiếp theo |

### checkoutAcknowledgementSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `state` | `z.literal("pending")` | Xem helper và điều kiện tiếp theo |
| `total` | `money.positive()` | Xem helper và điều kiện tiếp theo |
| `provider` | `z.enum(["demo", "sepay_sandbox"])` | Xem helper và điều kiện tiếp theo |
| `paymentMethod` | `z.literal("BANK_TRANSFER").optional()` | Có optional/default ở lớp ngoài |

### sourcingAcknowledgementSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `version` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |

### sourcingAcknowledgementContextSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `orderId` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `expectedVersion` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |

### CheckoutLine — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `lineId` | `string` | Không |
| `orderId` | `string` | Không |
| `kind` | `"catalog" \| "custom"` | Không |
| `name` | `string` | Không |
| `variant` | `string` | Không |
| `quantity` | `number` | Không |
| `market` | `"US" \| "JP" \| "KR"` | Không |
| `goods` | `number` | Không |
| `service` | `number` | Không |
| `total` | `number` | Không |
| `termsVersion` | `string` | Không |
| `productVersion` | `number` | Có |
| `productId` | `string` | Có |
| `draftId` | `string` | Có |
| `itemIndex` | `number` | Có |
| `unitSourceMinor` | `number` | Có |
| `fxNumerator` | `number` | Có |
| `fxDenominator` | `number` | Có |
| `mediaId` | `string` | Có |

### CheckoutSnapshot — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `purpose` | `"balance"` | Có |
| `balanceReason` | `"sourcing" \| "final"` | Có |
| `sourceOrderVersion` | `number` | Có |
| `sourceOrderId` | `string` | Có |
| `previouslyPaid` | `number` | Có |
| `finalTotal` | `number` | Có |
| `id` | `string` | Không |
| `ownerId` | `string` | Không |
| `version` | `number` | Không |
| `cartRevision` | `number` | Không |
| `policyVersion` | `number` | Không |
| `createdAt` | `number` | Không |
| `expiresAt` | `number` | Không |
| `currency` | `"VND"` | Không |
| `lines` | `CheckoutLine[]` | Không |
| `total` | `number` | Không |
| `listed` | `number` | Không |
| `goods` | `number` | Không |
| `service` | `number` | Không |
| `recipient` | `CheckoutRecipient` | Không |
| `shipping` | `{ state: string; amountUsdMinor?: number; basis?: string; version?: number \| null; }` | Không |

## purchase-provider.ts

Nguồn: [packages/domain/purchase-provider.ts:1](../../../packages/domain/purchase-provider.ts#L1).

### demoGatewayInput — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `z.string().uuid()` | Xem helper và điều kiện tiếp theo |
| `action` | `z.enum([ "createLink", "linkStatus", "reconcile", "pay", "cancel", "loseResponse", "payWithoutWebhook", "underpay", "overpay", "decline", ])` | Xem helper và điều kiện tiếp theo |

### demoWebhookSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `code` | `z.literal("00")` | Xem helper và điều kiện tiếp theo |
| `desc` | `z.string().max(100)` | Xem helper và điều kiện tiếp theo |
| `success` | `z.literal(true)` | Xem helper và điều kiện tiếp theo |
| `data` | Cấu trúc lồng nhau; xem [packages/domain/purchase-provider.ts:25](../../../packages/domain/purchase-provider.ts#L25) | Xem helper và điều kiện tiếp theo |
| `signature` | `z.string().regex(/^[a-f0-9]{64}$/)` | Xem helper và điều kiện tiếp theo |

### demoWebhookSchema.data — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `orderCode` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `amount` | `z.number().int().positive().safe()` | Xem helper và điều kiện tiếp theo |
| `description` | `z.string().max(80)` | Xem helper và điều kiện tiếp theo |
| `accountNumber` | `z.literal("DEMO-NO-BANK")` | Xem helper và điều kiện tiếp theo |
| `reference` | `z.string().regex(/^DEMO-[a-zA-Z0-9-]{1,80}$/)` | Xem helper và điều kiện tiếp theo |
| `transactionDateTime` | `z.string().min(1).max(50)` | Xem helper và điều kiện tiếp theo |
| `currency` | `z.literal("VND")` | Xem helper và điều kiện tiếp theo |
| `paymentLinkId` | `z.string().regex(/^[a-f0-9]{32}$/)` | Xem helper và điều kiện tiếp theo |
| `code` | `z.literal("00")` | Xem helper và điều kiện tiếp theo |
| `desc` | `z.string().max(100)` | Xem helper và điều kiện tiếp theo |

### DemoPaymentLink — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `paymentLinkId` | `string` | Không |
| `orderCode` | `number` | Không |
| `amount` | `number` | Không |
| `currency` | `"VND"` | Không |
| `status` | `\| "PENDING" \| "PROCESSING" \| "PAID" \| "CANCELLED" \| "EXPIRED" \| "UNDERPAID" \| "FAILED"` | Không |
| `expiresAt` | `number` | Không |
| `checkoutUrl` | `string` | Không |

## purchase-sepay.ts

Nguồn: [packages/domain/purchase-sepay.ts:1](../../../packages/domain/purchase-sepay.ts#L1).

### transactionSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `providerId` | Xem helper và điều kiện tiếp theo |
| `transaction_id` | `providerId.optional()` | Có optional/default ở lớp ngoài |
| `payment_method` | `paymentMethodSchema` | Xem helper và điều kiện tiếp theo |
| `transaction_type` | `z.string().max(40)` | Xem helper và điều kiện tiếp theo |
| `transaction_status` | `z.string().max(40)` | Xem helper và điều kiện tiếp theo |
| `transaction_amount` | `z.string().max(40)` | Xem helper và điều kiện tiếp theo |
| `transaction_currency` | `z.string().max(10)` | Xem helper và điều kiện tiếp theo |
| `transaction_date` | `z.string().max(40)` | Xem helper và điều kiện tiếp theo |

### orderSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `providerId` | Xem helper và điều kiện tiếp theo |
| `order_id` | `providerId` | Xem helper và điều kiện tiếp theo |
| `order_invoice_number` | `sepayInvoiceSchema` | Xem helper và điều kiện tiếp theo |
| `order_status` | `z.string().max(50)` | Xem helper và điều kiện tiếp theo |
| `order_amount` | `z.string().max(40)` | Xem helper và điều kiện tiếp theo |
| `order_currency` | `z.string().max(10)` | Xem helper và điều kiện tiếp theo |

### sepayIpnSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `timestamp` | `z.number().int().nonnegative().safe()` | Xem helper và điều kiện tiếp theo |
| `notification_type` | `z.enum(["ORDER_PAID", "TRANSACTION_VOID"])` | Xem helper và điều kiện tiếp theo |
| `order` | `orderSchema` | Xem helper và điều kiện tiếp theo |
| `transaction` | `transactionSchema` | Xem helper và điều kiện tiếp theo |

### sepayReadbackSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `data` | `orderSchema.extend({ transactions: z.array(transactionSchema).max(50), })` | Xem helper và điều kiện tiếp theo |

### sepayFormSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `action` | `z.literal(SEPAY_CHECKOUT_URL)` | Xem helper và điều kiện tiếp theo |
| `fields` | `z .array(z.tuple([z.string().regex(/^[a-z_]{1,40}$/), z.string().max(500)])) .min(8) .max(16)` | Xem helper và điều kiện tiếp theo |

### PaymentCapabilities — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `provider` | `"demo" \| "sepay_sandbox" \| "unavailable"` | Không |
| `methods` | `Record&lt;PurchasePaymentMethod, { available: boolean }&gt;` | Không |

### SePayIntent — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `checkoutId` | `string` | Không |
| `ownerId` | `string` | Không |
| `invoice` | `string` | Không |
| `merchant` | `typeof SEPAY_MERCHANT` | Không |
| `provider` | `"sepay_sandbox"` | Không |
| `amount` | `number` | Không |
| `currency` | `"VND"` | Không |
| `paymentMethod` | `"BANK_TRANSFER"` | Không |
| `checkoutHash` | `string` | Không |
| `createdAt` | `number` | Không |
| `expiresAt` | `number` | Không |
| `providerOrderId` | `string` | Có |
| `providerInternalId` | `string` | Có |

### SePayProof — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `checkoutId` | `string` | Không |
| `ownerId` | `string` | Không |
| `provider` | `"sepay_sandbox"` | Không |
| `merchant` | `typeof SEPAY_MERCHANT` | Không |
| `invoice` | `string` | Không |
| `providerOrderId` | `string` | Không |
| `providerInternalId` | `string` | Không |
| `transactionId` | `string` | Không |
| `reference` | `string` | Không |
| `amount` | `number` | Không |
| `expectedAmount` | `number` | Không |
| `currency` | `"VND"` | Không |
| `paymentMethod` | `"BANK_TRANSFER"` | Không |
| `paidAt` | `number` | Không |
| `verifiedAt` | `number` | Không |
| `checkoutHash` | `string` | Không |
| `state` | `"verified"` | Không |

## shipping-rates.ts

Nguồn: [packages/domain/shipping-rates.ts:1](../../../packages/domain/shipping-rates.ts#L1).

### shippingRateRowSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `id` | `z.string().regex(/^[a-z0-9-]{1,64}$/)` | Xem helper và điều kiện tiếp theo |
| `direction` | `z.enum(["VN_US", "US_VN"])` | Xem helper và điều kiện tiếp theo |
| `warehouse` | `z.enum(["vietnam", "texas_cali", "oregon"])` | Xem helper và điều kiện tiếp theo |
| `service` | `z.enum(["standard", "express", "cargo"])` | Xem helper và điều kiện tiếp theo |
| `label` | `z.string().trim().min(1).max(240)` | Xem helper và điều kiện tiếp theo |
| `currency` | `z.enum(["VND", "USD"])` | Xem helper và điều kiện tiếp theo |
| `pricing` | `z.enum(["total", "per_kg", "quote"])` | Xem helper và điều kiện tiếp theo |
| `amountMinor` | `amount.nullable()` | Xem helper và điều kiện tiếp theo |
| `priceDisplay` | `z.string().trim().min(1).max(80)` | Xem helper và điều kiện tiếp theo |
| `clearance` | `z.string().trim().max(80)` | Xem helper và điều kiện tiếp theo |
| `minGrams` | `z.number().int().positive().max(1_000_000_000)` | Xem helper và điều kiện tiếp theo |
| `maxGrams` | `z.number().int().positive().max(1_000_000_000).nullable()` | Xem helper và điều kiện tiếp theo |

### shippingRateConfigSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `sourceLabel` | `z.string().trim().min(1).max(160)` | Xem helper và điều kiện tiếp theo |
| `sourceUrls` | `z .array( z .string() .url() .refine((v) =&gt; { const u = new URL(v); return ( u.protocol === "https:" && u.hostname === "www.vietcargo.vn" && !u.username && !u.password ); }), ) .min(1) .max(2)` | Xem helper và điều kiện tiếp theo |
| `conditions` | `z.array(z.string().trim().min(1).max(500)).min(1).max(20)` | Xem helper và điều kiện tiếp theo |
| `rows` | `z.array(shippingRateRowSchema).min(1).max(160)` | Xem helper và điều kiện tiếp theo |

### shippingQuoteInputSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `direction` | `z.enum(["VN_US", "US_VN"])` | Xem helper và điều kiện tiếp theo |
| `service` | `z.enum(["standard", "express", "cargo"])` | Xem helper và điều kiện tiếp theo |
| `warehouse` | `z.enum(["vietnam", "texas_cali", "oregon"])` | Xem helper và điều kiện tiếp theo |
| `weightGrams` | `z.number().int().positive().max(1_000_000_000)` | Xem helper và điều kiện tiếp theo |
| `rowId` | `z.string().max(64).optional()` | Có optional/default ở lớp ngoài |

### ShippingRatesSnapshot — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `version` | `number` | Không |
| `config` | `ShippingRateConfig \| null` | Không |
| `publishedVersion` | `number \| null` | Không |

### ShippingRatesPublicSnapshot — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `version` | `number \| null` | Không |
| `config` | `ShippingRateConfig \| null` | Không |
| `origin` | `"reference" \| "published" \| "unavailable"` | Không |

## shipping.ts

Nguồn: [packages/domain/shipping.ts:1](../../../packages/domain/shipping.ts#L1).

### deliveryWindowSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `startAt` | `instant` | Xem helper và điều kiện tiếp theo |
| `endAt` | `instant` | Xem helper và điều kiện tiếp theo |

### manualDeliveryEstimateSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `source` | `z.literal("staff")` | Xem helper và điều kiện tiếp theo |
| `startAt` | `instant` | Xem helper và điều kiện tiếp theo |
| `endAt` | `instant` | Xem helper và điều kiện tiếp theo |
| `recordedAt` | `instant` | Xem helper và điều kiện tiếp theo |

### allocationSchema — kiểm tra dữ liệu

| Trường | Ràng buộc trong schema | Ghi chú đầu vào |
| --- | --- | --- |
| `orderId` | `z.string().regex(/^[a-zA-Z0-9-]{1,80}$/)` | Xem helper và điều kiện tiếp theo |
| `line` | `z.number().int().min(0).max(29)` | Xem helper và điều kiện tiếp theo |
| `quantity` | `z.number().int().min(1).max(100)` | Xem helper và điều kiện tiếp theo |

### Parcel — cấu trúc TypeScript

| Thuộc tính | Kiểu | Có thể thiếu |
| --- | --- | --- |
| `id` | `string` | Không |
| `version` | `number` | Không |
| `state` | `"packed" \| "in_transit" \| "delivered" \| "failed" \| "returned"` | Không |
| `allocations` | `Allocation[]` | Không |
| `weightGrams` | `number` | Không |
| `route` | `string` | Không |
| `warehouse` | `string` | Không |
| `carrier` | `string` | Có |
| `tracking` | `string` | Có |
| `batchId` | `string` | Có |
| `deliveryEstimate` | `ManualDeliveryEstimate` | Có |


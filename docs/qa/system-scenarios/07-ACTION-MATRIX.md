# Command actions — matrix thực thi

120 action/source entries từ lexical scan của action schemas/comparisons/switch. Cùng action ở Ask và command gốc là hai paths riêng. Chỉ inventory, mọi entry NOT_RUN. Không cộng entries/variants vào số 477 scenarios.

Mỗi entry cần tạo fixture group source-valid và chạy 7 variants: success; invalid schema/boundary; invalid business state/context; unauthorized/current rights; stale version nếu versioned; retry/payload collision nếu idempotent; dependency/transaction failure nếu mutation. Mỗi variant có expected theo domain case của nhóm, DB before/after và evidence riêng. Read/public/no-version/no-operationId ghi N/A variant không áp dụng kèm lý do; không thêm fields giả vào schema.

Nguồn action phải đọc cả body/guards cùng schema; table không suy ra tất cả roles hoặc payload từ tên action. Dùng roles/grants của source hiện tại và fixtures README. Provider actions giữ gate đóng. Enum có thể được định nghĩa gián tiếp; private/local methods và branch paths chưa là exhaustive.

| Action | Source | Groups | Ca tham chiếu |
|---|---|---|---|
| `acceptQuote` | `functions/src/ai/ask-workflow.ts:216` | ASKFLOW, INT | SG-ASKFLOW-001, SG-ASKFLOW-002, SG-ASKFLOW-003… (đầy đủ trong ACTIONS.json) |
| `catalogCheckout` | `functions/src/ai/ask-workflow.ts:301` | ASKFLOW, INT | SG-ASKFLOW-001, SG-ASKFLOW-002, SG-ASKFLOW-003… (đầy đủ trong ACTIONS.json) |
| `resume` | `functions/src/ai/ask-workflow.ts:54` | ASKFLOW, INT | SG-ASKFLOW-001, SG-ASKFLOW-002, SG-ASKFLOW-003… (đầy đủ trong ACTIONS.json) |
| `saveDraft` | `functions/src/ai/ask-workflow.ts:176` | ASKFLOW, INT | SG-ASKFLOW-001, SG-ASKFLOW-002, SG-ASKFLOW-003… (đầy đủ trong ACTIONS.json) |
| `saveRecipient` | `functions/src/ai/ask-workflow.ts:202` | ASKFLOW, INT | SG-ASKFLOW-001, SG-ASKFLOW-002, SG-ASKFLOW-003… (đầy đủ trong ACTIONS.json) |
| `saveTurn` | `functions/src/ai/ask-workflow.ts:227` | ASKFLOW, INT | SG-ASKFLOW-001, SG-ASKFLOW-002, SG-ASKFLOW-003… (đầy đủ trong ACTIONS.json) |
| `edit` | `functions/src/blog-comments.ts:264` | COMMENT, SEC | SG-COMMENT-001, SG-COMMENT-002, SG-COMMENT-003… (đầy đủ trong ACTIONS.json) |
| `cancelSchedule` | `functions/src/blog-studio-advanced.ts:511` | STUDIOADV | SG-STUDIOADV-001, SG-STUDIOADV-002, SG-STUDIOADV-003… (đầy đủ trong ACTIONS.json) |
| `catalogUpdate` | `functions/src/blog-studio-advanced.ts:457` | STUDIOADV | SG-STUDIOADV-001, SG-STUDIOADV-002, SG-STUDIOADV-003… (đầy đủ trong ACTIONS.json) |
| `categoryCreate` | `functions/src/blog-studio-advanced.ts:603` | STUDIOADV | SG-STUDIOADV-001, SG-STUDIOADV-002, SG-STUDIOADV-003… (đầy đủ trong ACTIONS.json) |
| `memberRevoke` | `functions/src/blog-studio-advanced.ts:423` | STUDIOADV | SG-STUDIOADV-001, SG-STUDIOADV-002, SG-STUDIOADV-003… (đầy đủ trong ACTIONS.json) |
| `memberSave` | `functions/src/blog-studio-advanced.ts:423` | STUDIOADV | SG-STUDIOADV-001, SG-STUDIOADV-002, SG-STUDIOADV-003… (đầy đủ trong ACTIONS.json) |
| `reportResolve` | `functions/src/blog-studio-advanced.ts:494` | STUDIOADV | SG-STUDIOADV-001, SG-STUDIOADV-002, SG-STUDIOADV-003… (đầy đủ trong ACTIONS.json) |
| `archive` | `functions/src/blog-studio.ts:46` | STUDIO | SG-STUDIO-001, SG-STUDIO-002, SG-STUDIO-003… (đầy đủ trong ACTIONS.json) |
| `create` | `functions/src/blog-studio.ts:46` | STUDIO | SG-STUDIO-001, SG-STUDIO-002, SG-STUDIO-003… (đầy đủ trong ACTIONS.json) |
| `moderate` | `functions/src/blog-studio.ts:46` | STUDIO | SG-STUDIO-001, SG-STUDIO-002, SG-STUDIO-003… (đầy đủ trong ACTIONS.json) |
| `publish` | `functions/src/blog-studio.ts:46` | STUDIO | SG-STUDIO-001, SG-STUDIO-002, SG-STUDIO-003… (đầy đủ trong ACTIONS.json) |
| `restore` | `functions/src/blog-studio.ts:46` | STUDIO | SG-STUDIO-001, SG-STUDIO-002, SG-STUDIO-003… (đầy đủ trong ACTIONS.json) |
| `review` | `functions/src/blog-studio.ts:46` | STUDIO | SG-STUDIO-001, SG-STUDIO-002, SG-STUDIO-003… (đầy đủ trong ACTIONS.json) |
| `save` | `functions/src/blog-studio.ts:46` | STUDIO | SG-STUDIO-001, SG-STUDIO-002, SG-STUDIO-003… (đầy đủ trong ACTIONS.json) |
| `schedule` | `functions/src/blog-studio.ts:46` | STUDIO | SG-STUDIO-001, SG-STUDIO-002, SG-STUDIO-003… (đầy đủ trong ACTIONS.json) |
| `settings` | `functions/src/blog-studio.ts:46` | STUDIO | SG-STUDIO-001, SG-STUDIO-002, SG-STUDIO-003… (đầy đủ trong ACTIONS.json) |
| `unpublish` | `functions/src/blog-studio.ts:46` | STUDIO | SG-STUDIO-001, SG-STUDIO-002, SG-STUDIO-003… (đầy đủ trong ACTIONS.json) |
| `hide` | `functions/src/campaign-banners.ts:46` | BANNER | SG-BANNER-001, SG-BANNER-002, SG-BANNER-003… (đầy đủ trong ACTIONS.json) |
| `mode` | `functions/src/campaign-banners.ts:54` | BANNER | SG-BANNER-001, SG-BANNER-002, SG-BANNER-003… (đầy đủ trong ACTIONS.json) |
| `publish` | `functions/src/campaign-banners.ts:37` | BANNER | SG-BANNER-001, SG-BANNER-002, SG-BANNER-003… (đầy đủ trong ACTIONS.json) |
| `save` | `functions/src/campaign-banners.ts:28` | BANNER | SG-BANNER-001, SG-BANNER-002, SG-BANNER-003… (đầy đủ trong ACTIONS.json) |
| `accept` | `functions/src/changes.ts:24` | CHANGE | SG-CHANGE-001, SG-CHANGE-002, SG-CHANGE-003… (đầy đủ trong ACTIONS.json) |
| `apply` | `functions/src/changes.ts:24` | CHANGE | SG-CHANGE-001, SG-CHANGE-002, SG-CHANGE-003… (đầy đủ trong ACTIONS.json) |
| `propose` | `functions/src/changes.ts:24` | CHANGE | SG-CHANGE-001, SG-CHANGE-002, SG-CHANGE-003… (đầy đủ trong ACTIONS.json) |
| `reject` | `functions/src/changes.ts:24` | CHANGE | SG-CHANGE-001, SG-CHANGE-002, SG-CHANGE-003… (đầy đủ trong ACTIONS.json) |
| `dispatch` | `functions/src/consolidation.ts:29` | BATCH, INT | SG-BATCH-001, SG-BATCH-002, SG-BATCH-003… (đầy đủ trong ACTIONS.json) |
| `seal` | `functions/src/consolidation.ts:29` | BATCH, INT | SG-BATCH-001, SG-BATCH-002, SG-BATCH-003… (đầy đủ trong ACTIONS.json) |
| `invoiceIssued` | `functions/src/email.ts:84` | EMAIL, INT | SG-EMAIL-001, SG-EMAIL-002, SG-EMAIL-003… (đầy đủ trong ACTIONS.json) |
| `allocateException` | `functions/src/finance-review.ts:47` | FIN | SG-FIN-001, SG-FIN-002, SG-FIN-003… (đầy đủ trong ACTIONS.json) |
| `closeException` | `functions/src/finance-review.ts:38` | FIN | SG-FIN-001, SG-FIN-002, SG-FIN-003… (đầy đủ trong ACTIONS.json) |
| `reverse` | `functions/src/finance-review.ts:25` | FIN | SG-FIN-001, SG-FIN-002, SG-FIN-003… (đầy đủ trong ACTIONS.json) |
| `acceptQuote` | `functions/src/index.ts:365` | REQ, QUOTE, LIFE, FIN, REFUND, HISTORY, INT, SEC, PERF | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `claimPurchase` | `functions/src/index.ts:342` | REQ, QUOTE, LIFE, FIN, REFUND, HISTORY, INT, SEC, PERF | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `issueQuote` | `functions/src/index.ts:261` | REQ, QUOTE, LIFE, FIN, REFUND, HISTORY, INT, SEC, PERF | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `recordPurchase` | `functions/src/index.ts:327` | REQ, QUOTE, LIFE, FIN, REFUND, HISTORY, INT, SEC, PERF | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `refund` | `functions/src/index.ts:157` | REQ, QUOTE, LIFE, FIN, REFUND, HISTORY, INT, SEC, PERF | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `submitRequest` | `functions/src/index.ts:139` | REQ, QUOTE, LIFE, FIN, REFUND, HISTORY, INT, SEC, PERF | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `transferReview` | `functions/src/index.ts:242` | REQ, QUOTE, LIFE, FIN, REFUND, HISTORY, INT, SEC, PERF | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `verifyTransfer` | `functions/src/index.ts:157` | REQ, QUOTE, LIFE, FIN, REFUND, HISTORY, INT, SEC, PERF | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `configure` | `functions/src/invoices.ts:25` | DOC, INT | SG-DOC-001, SG-DOC-002, SG-DOC-003… (đầy đủ trong ACTIONS.json) |
| `createDraft` | `functions/src/invoices.ts:25` | DOC, INT | SG-DOC-001, SG-DOC-002, SG-DOC-003… (đầy đủ trong ACTIONS.json) |
| `createShare` | `functions/src/invoices.ts:25` | DOC, INT | SG-DOC-001, SG-DOC-002, SG-DOC-003… (đầy đủ trong ACTIONS.json) |
| `issue` | `functions/src/invoices.ts:25` | DOC, INT | SG-DOC-001, SG-DOC-002, SG-DOC-003… (đầy đủ trong ACTIONS.json) |
| `queueEmail` | `functions/src/invoices.ts:25` | DOC, INT | SG-DOC-001, SG-DOC-002, SG-DOC-003… (đầy đủ trong ACTIONS.json) |
| `refreshDraft` | `functions/src/invoices.ts:25` | DOC, INT | SG-DOC-001, SG-DOC-002, SG-DOC-003… (đầy đủ trong ACTIONS.json) |
| `revokeShare` | `functions/src/invoices.ts:25` | DOC, INT | SG-DOC-001, SG-DOC-002, SG-DOC-003… (đầy đủ trong ACTIONS.json) |
| `void` | `functions/src/invoices.ts:25` | DOC, INT | SG-DOC-001, SG-DOC-002, SG-DOC-003… (đầy đủ trong ACTIONS.json) |
| `read` | `functions/src/membership-reminder-policy.ts:11` | REM | SG-REM-001, SG-REM-002, SG-REM-003… (đầy đủ trong ACTIONS.json) |
| `save` | `functions/src/membership-reminder-policy.ts:14` | REM | SG-REM-001, SG-REM-002, SG-REM-003… (đầy đủ trong ACTIONS.json) |
| `cancelInvoice` | `functions/src/membership.ts:62` | MEM, INT | SG-MEM-001, SG-MEM-002, SG-MEM-003… (đầy đủ trong ACTIONS.json) |
| `cancelRenewal` | `functions/src/membership.ts:62` | MEM, INT | SG-MEM-001, SG-MEM-002, SG-MEM-003… (đầy đủ trong ACTIONS.json) |
| `confirm` | `functions/src/membership.ts:62` | MEM, INT | SG-MEM-001, SG-MEM-002, SG-MEM-003… (đầy đủ trong ACTIONS.json) |
| `grant` | `functions/src/membership.ts:62` | MEM, INT | SG-MEM-001, SG-MEM-002, SG-MEM-003… (đầy đủ trong ACTIONS.json) |
| `purchase` | `functions/src/membership.ts:62` | MEM, INT | SG-MEM-001, SG-MEM-002, SG-MEM-003… (đầy đủ trong ACTIONS.json) |
| `requestRenewal` | `functions/src/membership.ts:62` | MEM, INT | SG-MEM-001, SG-MEM-002, SG-MEM-003… (đầy đủ trong ACTIONS.json) |
| `assign` | `functions/src/order-conversation.ts:168` | SUP | SG-SUP-001, SG-SUP-002, SG-SUP-003… (đầy đủ trong ACTIONS.json) |
| `message` | `functions/src/order-conversation.ts:202` | SUP | SG-SUP-001, SG-SUP-002, SG-SUP-003… (đầy đủ trong ACTIONS.json) |
| `note` | `functions/src/order-conversation.ts:231` | SUP | SG-SUP-001, SG-SUP-002, SG-SUP-003… (đầy đủ trong ACTIONS.json) |
| `resolveUnknown` | `functions/src/outbox-command.ts:13` | EMAIL | SG-EMAIL-001, SG-EMAIL-002, SG-EMAIL-003… (đầy đủ trong ACTIONS.json) |
| `retry` | `functions/src/outbox-command.ts:13` | EMAIL | SG-EMAIL-001, SG-EMAIL-002, SG-EMAIL-003… (đầy đủ trong ACTIONS.json) |
| `cancel` | `functions/src/refunds.ts:23` | REFUND | SG-REFUND-001, SG-REFUND-002, SG-REFUND-003… (đầy đủ trong ACTIONS.json) |
| `request` | `functions/src/refunds.ts:23` | REFUND | SG-REFUND-001, SG-REFUND-002, SG-REFUND-003… (đầy đủ trong ACTIONS.json) |
| `close` | `functions/src/returns.ts:11` | RETURN | SG-RETURN-001, SG-RETURN-002, SG-RETURN-003… (đầy đủ trong ACTIONS.json) |
| `inspect` | `functions/src/returns.ts:11` | RETURN | SG-RETURN-001, SG-RETURN-002, SG-RETURN-003… (đầy đủ trong ACTIONS.json) |
| `receive` | `functions/src/returns.ts:11` | RETURN | SG-RETURN-001, SG-RETURN-002, SG-RETURN-003… (đầy đủ trong ACTIONS.json) |
| `delete` | `functions/src/shipping-rates.ts:34` | RATES | SG-RATES-001, SG-RATES-002, SG-RATES-003… (đầy đủ trong ACTIONS.json) |
| `publish` | `functions/src/shipping-rates.ts:33` | RATES | SG-RATES-001, SG-RATES-002, SG-RATES-003… (đầy đủ trong ACTIONS.json) |
| `read` | `functions/src/shipping-rates.ts:25` | RATES | SG-RATES-001, SG-RATES-002, SG-RATES-003… (đầy đủ trong ACTIONS.json) |
| `save` | `functions/src/shipping-rates.ts:28` | RATES | SG-RATES-001, SG-RATES-002, SG-RATES-003… (đầy đủ trong ACTIONS.json) |
| `dispatchParcel` | `functions/src/shipping.ts:28` | SHIP, INT | SG-SHIP-001, SG-SHIP-002, SG-SHIP-003… (đầy đủ trong ACTIONS.json) |
| `packParcel` | `functions/src/shipping.ts:28` | SHIP, INT | SG-SHIP-001, SG-SHIP-002, SG-SHIP-003… (đầy đủ trong ACTIONS.json) |
| `setDeliveryEstimate` | `functions/src/shipping.ts:28` | SHIP, INT | SG-SHIP-001, SG-SHIP-002, SG-SHIP-003… (đầy đủ trong ACTIONS.json) |
| `trackParcel` | `functions/src/shipping.ts:28` | SHIP, INT | SG-SHIP-001, SG-SHIP-002, SG-SHIP-003… (đầy đủ trong ACTIONS.json) |
| `openTicket` | `functions/src/workspace.ts:307` | PROFILE, WORK, SUP, CONTENT, SEC, PERF | SG-PROFILE-001, SG-PROFILE-002, SG-PROFILE-003… (đầy đủ trong ACTIONS.json) |
| `replyTicket` | `functions/src/workspace.ts:307` | PROFILE, WORK, SUP, CONTENT, SEC, PERF | SG-PROFILE-001, SG-PROFILE-002, SG-PROFILE-003… (đầy đủ trong ACTIONS.json) |
| `saveAddress` | `functions/src/workspace.ts:307` | PROFILE, WORK, SUP, CONTENT, SEC, PERF | SG-PROFILE-001, SG-PROFILE-002, SG-PROFILE-003… (đầy đủ trong ACTIONS.json) |
| `saveCampaign` | `functions/src/workspace.ts:307` | PROFILE, WORK, SUP, CONTENT, SEC, PERF | SG-PROFILE-001, SG-PROFILE-002, SG-PROFILE-003… (đầy đủ trong ACTIONS.json) |
| `saveContent` | `functions/src/workspace.ts:307` | PROFILE, WORK, SUP, CONTENT, SEC, PERF | SG-PROFILE-001, SG-PROFILE-002, SG-PROFILE-003… (đầy đủ trong ACTIONS.json) |
| `saveMembershipPlan` | `functions/src/workspace.ts:307` | PROFILE, WORK, SUP, CONTENT, SEC, PERF | SG-PROFILE-001, SG-PROFILE-002, SG-PROFILE-003… (đầy đủ trong ACTIONS.json) |
| `savePricingPolicy` | `functions/src/workspace.ts:307` | PROFILE, WORK, SUP, CONTENT, SEC, PERF | SG-PROFILE-001, SG-PROFILE-002, SG-PROFILE-003… (đầy đủ trong ACTIONS.json) |
| `saveProfile` | `functions/src/workspace.ts:307` | PROFILE, WORK, SUP, CONTENT, SEC, PERF | SG-PROFILE-001, SG-PROFILE-002, SG-PROFILE-003… (đầy đủ trong ACTIONS.json) |
| `saveStaffAccess` | `functions/src/workspace.ts:307` | PROFILE, WORK, SUP, CONTENT, SEC, PERF | SG-PROFILE-001, SG-PROFILE-002, SG-PROFILE-003… (đầy đủ trong ACTIONS.json) |
| `acceptQuote` | `packages/domain/ask-workflow.ts:57` | ASKFLOW | SG-ASKFLOW-001, SG-ASKFLOW-002, SG-ASKFLOW-003… (đầy đủ trong ACTIONS.json) |
| `approveFinal` | `packages/domain/ask-workflow.ts:63` | ASKFLOW | SG-ASKFLOW-001, SG-ASKFLOW-002, SG-ASKFLOW-003… (đầy đủ trong ACTIONS.json) |
| `catalogCheckout` | `packages/domain/ask-workflow.ts:36` | ASKFLOW | SG-ASKFLOW-001, SG-ASKFLOW-002, SG-ASKFLOW-003… (đầy đủ trong ACTIONS.json) |
| `confirmReceipt` | `packages/domain/ask-workflow.ts:42` | ASKFLOW | SG-ASKFLOW-001, SG-ASKFLOW-002, SG-ASKFLOW-003… (đầy đủ trong ACTIONS.json) |
| `saveDraft` | `packages/domain/ask-workflow.ts:47` | ASKFLOW | SG-ASKFLOW-001, SG-ASKFLOW-002, SG-ASKFLOW-003… (đầy đủ trong ACTIONS.json) |
| `saveRecipient` | `packages/domain/ask-workflow.ts:68` | ASKFLOW | SG-ASKFLOW-001, SG-ASKFLOW-002, SG-ASKFLOW-003… (đầy đủ trong ACTIONS.json) |
| `saveTurn` | `packages/domain/ask-workflow.ts:50` | ASKFLOW | SG-ASKFLOW-001, SG-ASKFLOW-002, SG-ASKFLOW-003… (đầy đủ trong ACTIONS.json) |
| `submitRequest` | `packages/domain/ask-workflow.ts:53` | ASKFLOW | SG-ASKFLOW-001, SG-ASKFLOW-002, SG-ASKFLOW-003… (đầy đủ trong ACTIONS.json) |
| `delete` | `packages/domain/blog-comments.ts:91` | COMMENT | SG-COMMENT-001, SG-COMMENT-002, SG-COMMENT-003… (đầy đủ trong ACTIONS.json) |
| `edit` | `packages/domain/blog-comments.ts:91` | COMMENT | SG-COMMENT-001, SG-COMMENT-002, SG-COMMENT-003… (đầy đủ trong ACTIONS.json) |
| `cancelSchedule` | `packages/domain/blog-studio-advanced.ts:26` | STUDIOADV | SG-STUDIOADV-001, SG-STUDIOADV-002, SG-STUDIOADV-003… (đầy đủ trong ACTIONS.json) |
| `catalogUpdate` | `packages/domain/blog-studio-advanced.ts:26` | STUDIOADV | SG-STUDIOADV-001, SG-STUDIOADV-002, SG-STUDIOADV-003… (đầy đủ trong ACTIONS.json) |
| `categoryCreate` | `packages/domain/blog-studio-advanced.ts:26` | STUDIOADV | SG-STUDIOADV-001, SG-STUDIOADV-002, SG-STUDIOADV-003… (đầy đủ trong ACTIONS.json) |
| `memberRevoke` | `packages/domain/blog-studio-advanced.ts:26` | STUDIOADV | SG-STUDIOADV-001, SG-STUDIOADV-002, SG-STUDIOADV-003… (đầy đủ trong ACTIONS.json) |
| `memberSave` | `packages/domain/blog-studio-advanced.ts:26` | STUDIOADV | SG-STUDIOADV-001, SG-STUDIOADV-002, SG-STUDIOADV-003… (đầy đủ trong ACTIONS.json) |
| `reportResolve` | `packages/domain/blog-studio-advanced.ts:26` | STUDIOADV | SG-STUDIOADV-001, SG-STUDIOADV-002, SG-STUDIOADV-003… (đầy đủ trong ACTIONS.json) |
| `acceptQuote` | `packages/domain/index.ts:374` | REQ, QUOTE, LIFE, BATCH, MEM | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `approveFinal` | `packages/domain/index.ts:501` | REQ, QUOTE, LIFE, BATCH, MEM | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `cancelRequest` | `packages/domain/index.ts:543` | REQ, QUOTE, LIFE, BATCH, MEM | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `claimPurchase` | `packages/domain/index.ts:392` | REQ, QUOTE, LIFE, BATCH, MEM | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `confirmReceipt` | `packages/domain/index.ts:526` | REQ, QUOTE, LIFE, BATCH, MEM | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `dispatch` | `packages/domain/index.ts:509` | REQ, QUOTE, LIFE, BATCH, MEM | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `finalize` | `packages/domain/index.ts:471` | REQ, QUOTE, LIFE, BATCH, MEM | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `hold` | `packages/domain/index.ts:537` | REQ, QUOTE, LIFE, BATCH, MEM | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `issueQuote` | `packages/domain/index.ts:361` | REQ, QUOTE, LIFE, BATCH, MEM | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `pack` | `packages/domain/index.ts:453` | REQ, QUOTE, LIFE, BATCH, MEM | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `receive` | `packages/domain/index.ts:424` | REQ, QUOTE, LIFE, BATCH, MEM | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `recordPurchase` | `packages/domain/index.ts:401` | REQ, QUOTE, LIFE, BATCH, MEM | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `track` | `packages/domain/index.ts:513` | REQ, QUOTE, LIFE, BATCH, MEM | SG-REQ-001, SG-REQ-002, SG-REQ-003… (đầy đủ trong ACTIONS.json) |
| `assign` | `packages/domain/order-conversation.ts:26` | SUP | SG-SUP-001, SG-SUP-002, SG-SUP-003… (đầy đủ trong ACTIONS.json) |
| `message` | `packages/domain/order-conversation.ts:8` | SUP | SG-SUP-001, SG-SUP-002, SG-SUP-003… (đầy đủ trong ACTIONS.json) |
| `note` | `packages/domain/order-conversation.ts:17` | SUP | SG-SUP-001, SG-SUP-002, SG-SUP-003… (đầy đủ trong ACTIONS.json) |

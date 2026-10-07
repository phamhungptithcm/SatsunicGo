# Truy vết phạm vi hệ thống

Candidate source commit `1d9c5824e5d0647948a1986dabc7480c4b7b8cb2` cộng hashes worktree trong SOURCE_MANIFEST.json. Index DEGRADED; inventory lexical/source-referenced, không là call graph completeness hoặc branch coverage.

## Phạm vi nhóm

| Nhóm | Chức năng | Scenarios business/module | Source |
|---|---|---:|---|
| AUTH | Đăng nhập, phiên và MFA | 8 | src/features/auth/OneTap.tsx<br>src/features/auth/one-tap-controller.ts<br>src/features/auth/Security.tsx<br>src/features/auth/mfa.ts<br>functions/src/auth/guards.ts |
| PUBLIC | Website, nội dung public và discovery | 8 | src/features/content/Content.tsx<br>src/app/App.tsx<br>functions/src/public.ts<br>src/shared/public-content.ts |
| CAT | Catalog, tìm kiếm và checkout | 9 | packages/domain/catalog-checkout.ts<br>packages/domain/catalog-search.ts<br>src/features/content/ProductsCatalog.tsx<br>src/features/ask/CatalogPurchase.tsx<br>functions/src/catalog-checkout.ts |
| REQ | Yêu cầu custom và dữ liệu đầu vào | 16 | packages/domain/request-input.ts<br>packages/domain/index.ts<br>src/features/requests/RequestForm.tsx<br>functions/src/index.ts |
| QUOTE | Báo giá, FX và chấp thuận | 8 | packages/domain/index.ts<br>functions/src/index.ts |
| LIFE | State machine và procurement | 10 | packages/domain/index.ts<br>functions/src/index.ts<br>src/features/operations/Workbench.tsx |
| PAY | Payment intent, webhook và reconcile | 9 | functions/src/payments/payos.ts<br>functions/src/provider-release-gate.ts<br>packages/domain/payment-qr.ts |
| FIN | Đối soát, reversal và exceptions | 8 | functions/src/finance-review.ts<br>functions/src/index.ts<br>src/features/payments/Finance.tsx |
| CHANGE | Đổi hàng, hủy một phần và customer consent | 8 | functions/src/changes.ts<br>packages/domain/changes.ts<br>src/features/orders/Changes.tsx |
| SHIP | Kiện, tracking và ngày giao | 9 | functions/src/shipping.ts<br>packages/domain/shipping.ts<br>functions/src/customer-order-tracking.ts<br>packages/domain/order-tracking.ts<br>src/features/orders/AccountTracking.tsx |
| BATCH | Gom kiện và phân bổ cước | 8 | functions/src/consolidation.ts<br>packages/domain/consolidation.ts<br>packages/domain/index.ts |
| RETURN | Nhận, kiểm tra và đóng hàng trả | 8 | functions/src/returns.ts<br>src/features/operations/Returns.tsx |
| REFUND | Yêu cầu hoàn tiền và reservation | 8 | functions/src/refunds.ts<br>src/features/payments/Refunds.tsx<br>functions/src/index.ts |
| DOC | Hóa đơn, chứng từ và chia sẻ | 9 | functions/src/invoices.ts<br>packages/domain/invoices.ts<br>functions/src/invoice-share.ts<br>src/features/invoices/Documents.tsx |
| EMAIL | Outbox, retry và unknown delivery | 8 | functions/src/email.ts<br>functions/src/outbox-command.ts<br>functions/src/email-content.ts |
| MEM | Membership, gia hạn và quyền lợi | 9 | functions/src/membership.ts<br>packages/domain/index.ts<br>src/features/membership/Membership.tsx<br>src/features/membership/PlanEditor.tsx |
| REM | Reminder, notifications và scheduled maintenance | 8 | functions/src/membership-reminder-policy.ts<br>functions/src/jobs.ts<br>functions/src/provider-release-gate.ts<br>src/features/notifications/Notifications.tsx<br>src/features/membership/ReminderSettings.tsx |
| PROFILE | Profile, địa chỉ và snapshot người nhận | 8 | functions/src/workspace.ts<br>src/features/profile/Profile.tsx<br>src/features/profile/profile-state.ts |
| CRM | Khách hàng, notes và follow-up | 8 | functions/src/crm.ts<br>packages/domain/crm.ts<br>src/features/crm/Customers.tsx<br>src/features/crm/Customer.tsx |
| WORK | CRM workspace, queues và quyền hiện hành | 9 | functions/src/workspace.ts<br>packages/domain/staff-route.ts<br>src/features/crm/Workspace.tsx<br>src/shared/staff-access.ts |
| SUP | Support tickets và hội thoại order | 8 | functions/src/order-conversation.ts<br>packages/domain/order-conversation.ts<br>functions/src/workspace.ts<br>src/features/support/Support.tsx<br>src/features/support/OrderConversation.tsx |
| MEDIA | Ảnh hàng và content media | 8 | functions/src/order-media.ts<br>functions/src/media.ts<br>packages/domain/media.ts<br>functions/src/ai/product-images.ts<br>src/features/orders/OrderImages.tsx |
| ASK | Ask AI, retrieval, quota và ngôn ngữ | 10 | functions/src/ai/ask.ts<br>functions/src/ai/ask-paid-gate.ts<br>functions/src/ai/knowledge-retrieval.ts<br>packages/domain/ask-language-query.ts<br>packages/domain/ask-response-composer.ts<br>src/features/ask/Ask.tsx |
| ASKFLOW | Ask workflow, draft và commerce handoff | 9 | functions/src/ai/ask-workflow.ts<br>packages/domain/ask-workflow.ts<br>packages/domain/ask-task-frame.ts<br>src/features/ask/Commerce.tsx |
| RATES | Biểu phí vận chuyển và ước tính | 8 | functions/src/shipping-rates.ts<br>packages/domain/shipping-rates.ts<br>src/features/shipping/ShippingRates.tsx<br>src/features/ask/ShippingQuote.tsx |
| CONTENT | Sản phẩm, posts và campaigns | 8 | functions/src/workspace.ts<br>packages/domain/public-content.ts<br>src/features/content/ContentEditor.tsx<br>src/features/content/Campaigns.tsx |
| BANNER | Website banners, preview và publish | 8 | functions/src/campaign-banners.ts<br>packages/domain/campaign-banners.ts<br>src/features/content/WebsiteBanners.tsx<br>src/features/content/CampaignBanner.tsx |
| STUDIO | Blog Studio editor và xuất bản | 9 | functions/src/blog-studio.ts<br>packages/domain/blog-studio.ts<br>src/features/content/studio/Studio.tsx<br>src/features/content/studio/source-editor.tsx |
| STUDIOADV | Studio taxonomy, members, reports và export | 8 | functions/src/blog-studio-advanced.ts<br>packages/domain/blog-studio-advanced.ts<br>functions/src/blog-studio-access.ts |
| COMMENT | Blog comments, replies và moderation | 8 | functions/src/blog-comments.ts<br>packages/domain/blog-comments.ts<br>src/features/content/BlogComments.tsx |
| HISTORY | Lịch sử order, activity và audit | 8 | functions/src/order-history.ts<br>functions/src/index.ts<br>src/features/crm/Activity.tsx |
| OPS | Environment, backup/restore và release boundary | 8 | scripts/emulator-test.mjs<br>tests/http/restore-fixture.mjs<br>scripts/release/preflight.mjs<br>scripts/release/bootstrap-owner.mjs<br>functions/src/provider-release-gate.ts |
| INT | Luồng integration xuyên hệ thống | 46 | src/app/App.tsx<br>functions/src/index.ts<br>functions/src/catalog-checkout.ts<br>functions/src/payments/payos.ts<br>functions/src/shipping.ts<br>functions/src/consolidation.ts<br>functions/src/invoices.ts<br>functions/src/membership.ts<br>functions/src/crm.ts<br>functions/src/ai/ask-workflow.ts<br>functions/src/email.ts |
| SEC | Security và abuse scenarios | 33 | firestore.rules<br>storage.rules<br>functions/src/auth/guards.ts<br>functions/src/workspace.ts<br>functions/src/index.ts<br>functions/src/blog-comments.ts<br>functions/src/invoice-share.ts<br>functions/src/provider-release-gate.ts |
| UX | UI, UX, accessibility và product language | 26 | src/app/App.tsx<br>src/features/crm/Workspace.tsx<br>src/features/account/AccountRail.tsx<br>src/shared/Loading.tsx<br>src/shared/Toast.tsx<br>src/styles/global.css<br>src/features/ask/Ask.tsx |
| PERF | Performance, capacity và resource lifecycle | 23 | functions/src/index.ts<br>functions/src/workspace.ts<br>functions/src/jobs.ts<br>functions/src/payments/payos.ts<br>src/shared/live-cache.ts<br>src/features/ask/transport.ts<br>src/features/content/studio/source-editor.tsx |
| HELP | Domain helpers và transport contracts | 10 | packages/domain/csv.ts<br>packages/domain/chat-action.ts<br>packages/domain/product-selection.ts<br>packages/domain/ask-stream.ts<br>packages/domain/ask-images.ts<br>packages/domain/ask-read-task-plan.ts<br>packages/domain/ask-hybrid-policy.ts<br>packages/domain/notification-content.ts<br>packages/domain/customer-order-filter.ts<br>packages/domain/rich-content-html.ts<br>packages/domain/ask-language-query.ts<br>packages/domain/ask-response-composer.ts<br>src/features/ask/transport.ts<br>src/shared/service-error.ts |

## Routes — parameterized sweep

Mỗi route chạy ca SG-UX-001/002/004/005/006/007/020 và SG-SEC-009/010/031 nếu private; expand actual URL từ fixture. Với route CRM thêm WORK/role-matrix. `/:page`, `*`, `:slug`, `:id` cần tồn tại/không tồn tại/draft/ngoài quyền. Parent route không chứng minh nested coverage.

| Route | Wiring source | Sweep |
|---|---|---|
| `/` | `src/app/App.tsx:297` | UX, SEC, PUBLIC |
| `/request` | `src/app/App.tsx:299` | UX, SEC, PUBLIC |
| `/account/security` | `src/app/App.tsx:309` | UX, SEC, PUBLIC |
| `/account/profile` | `src/app/App.tsx:320` | UX, SEC, PUBLIC |
| `/account` | `src/app/App.tsx:331` | UX, SEC, PUBLIC |
| `/account/orders/:id` | `src/app/App.tsx:341` | UX, SEC, PUBLIC |
| `/account/documents` | `src/app/App.tsx:351` | UX, SEC, PUBLIC |
| `/documents/shared` | `src/app/App.tsx:354` | UX, SEC, PUBLIC |
| `/products` | `src/app/App.tsx:355` | UX, SEC, PUBLIC |
| `/products/:slug/checkout` | `src/app/App.tsx:357` | UX, SEC, PUBLIC |
| `/posts` | `src/app/App.tsx:360` | UX, SEC, PUBLIC |
| `/posts/:slug` | `src/app/App.tsx:362` | UX, SEC, PUBLIC |
| `/products/:slug` | `src/app/App.tsx:366` | UX, SEC, PUBLIC |
| `/membership` | `src/app/App.tsx:370` | UX, SEC, PUBLIC |
| `/support` | `src/app/App.tsx:380` | UX, SEC, PUBLIC |
| `/crm/*` | `src/app/App.tsx:384` | UX, SEC, WORK |
| `/staff/*` | `src/app/App.tsx:401` | UX, SEC, PUBLIC |
| `/:page` | `src/app/App.tsx:402` | UX, SEC, PUBLIC |
| `*` | `src/app/App.tsx:404` | UX, SEC, PUBLIC |
| `/crm/documents` | `src/features/crm/Workspace.tsx:135` | UX, SEC, WORK |
| `/crm/overview` | `src/features/crm/Workspace.tsx:141` | UX, SEC, WORK |
| `/crm/orders` | `src/features/crm/Workspace.tsx:147` | UX, SEC, WORK |
| `/crm/purchasing` | `src/features/crm/Workspace.tsx:153` | UX, SEC, WORK |
| `/crm/warehouse` | `src/features/crm/Workspace.tsx:159` | UX, SEC, WORK |
| `/crm/returns` | `src/features/crm/Workspace.tsx:165` | UX, SEC, WORK |
| `/crm/shipping` | `src/features/crm/Workspace.tsx:171` | UX, SEC, WORK |
| `/crm/changes` | `src/features/crm/Workspace.tsx:177` | UX, SEC, WORK |
| `/crm/refunds` | `src/features/crm/Workspace.tsx:183` | UX, SEC, WORK |
| `/crm/finance` | `src/features/crm/Workspace.tsx:189` | UX, SEC, WORK |
| `/crm/customers` | `src/features/crm/Workspace.tsx:194` | UX, SEC, WORK |
| `/crm/follow-ups` | `src/features/crm/Workspace.tsx:196` | UX, SEC, WORK |
| `/crm/support` | `src/features/crm/Workspace.tsx:202` | UX, SEC, WORK |
| `/crm/content` | `src/features/crm/Workspace.tsx:208` | UX, SEC, WORK |
| `/crm/campaigns` | `src/features/crm/Workspace.tsx:214` | UX, SEC, WORK |
| `/crm/membership` | `src/features/crm/Workspace.tsx:220` | UX, SEC, WORK |
| `/crm/staff` | `src/features/crm/Workspace.tsx:226` | UX, SEC, WORK |
| `/crm/activity` | `src/features/crm/Workspace.tsx:232` | UX, SEC, WORK |
| `/crm/studio` | `src/features/crm/Workspace.tsx:238` | UX, SEC, WORK |
| `/crm/shipping-rates` | `src/features/crm/Workspace.tsx:244` | UX, SEC, WORK |
| `/crm/settings` | `src/features/crm/Workspace.tsx:249` | UX, SEC, WORK |
| `/crm/customers/:id` | `src/features/crm/Workspace.tsx:418` | CRM, UX, SEC |

## Firebase exported handlers

| Handler | Protocol | Source | Case | Module groups | Test refs (NOT_RUN) |
|---|---|---|---|---|---|
| askWorkflow | onCall | `functions/src/ai/ask-workflow.ts:46` | SG-API-001 | ASKFLOW, INT | 15 |
| currentAskConversation | onCall | `functions/src/ai/ask-workflow.ts:370` | SG-API-002 | ASKFLOW, INT | 15 |
| ask | onCall | `functions/src/ai/ask.ts:52` | SG-API-003 | ASK | 41 |
| blogCommentSubmit | onCall | `functions/src/blog-comments.ts:115` | SG-API-004 | COMMENT, SEC | 5 |
| blogCommentList | onCall | `functions/src/blog-comments.ts:249` | SG-API-005 | COMMENT, SEC | 6 |
| blogCommentCommand | onCall | `functions/src/blog-comments.ts:375` | SG-API-006 | COMMENT, SEC | 5 |
| blogCommentReport | onCall | `functions/src/blog-comments.ts:443` | SG-API-007 | COMMENT, SEC | 5 |
| studioAdvancedRead | onCall | `functions/src/blog-studio-advanced.ts:386` | SG-API-008 | STUDIOADV | 7 |
| studioAdvancedCommand | onCall | `functions/src/blog-studio-advanced.ts:739` | SG-API-009 | STUDIOADV | 8 |
| studioCommand | onCall | `functions/src/blog-studio.ts:487` | SG-API-010 | STUDIO | 23 |
| studioRead | onCall | `functions/src/blog-studio.ts:499` | SG-API-011 | STUDIO | 19 |
| studioMediaUpload | onCall | `functions/src/blog-studio.ts:778` | SG-API-012 | STUDIO | 18 |
| studioMediaRead | onCall | `functions/src/blog-studio.ts:907` | SG-API-013 | STUDIO | 19 |
| websiteBannerCommand | onCall | `functions/src/campaign-banners.ts:67` | SG-API-014 | BANNER | 3 |
| websiteBannerAdmin | onCall | `functions/src/campaign-banners.ts:257` | SG-API-015 | BANNER | 3 |
| campaignBannersPublic | onRequest | `functions/src/campaign-banners.ts:307` | SG-API-016 | BANNER | 3 |
| websiteBannerPreview | onCall | `functions/src/campaign-banners.ts:441` | SG-API-017 | BANNER | 3 |
| catalogCheckout | onCall | `functions/src/catalog-checkout.ts:15` | SG-API-018 | CAT, INT | 25 |
| changeCommand | onCall | `functions/src/changes.ts:12` | SG-API-019 | CHANGE | 15 |
| consolidationCommand | onCall | `functions/src/consolidation.ts:16` | SG-API-020 | BATCH, INT | 7 |
| listCustomers | onCall | `functions/src/crm.ts:42` | SG-API-021 | CRM, INT | 19 |
| listFollowUps | onCall | `functions/src/crm.ts:111` | SG-API-022 | CRM, INT | 19 |
| listCrmStaff | onCall | `functions/src/crm.ts:162` | SG-API-023 | CRM, INT | 19 |
| readCustomer | onCall | `functions/src/crm.ts:221` | SG-API-024 | CRM, INT | 20 |
| saveCustomerNotes | onCall | `functions/src/crm.ts:333` | SG-API-025 | CRM, INT | 19 |
| operationalDashboard | onCall | `functions/src/crm.ts:415` | SG-API-026 | CRM, INT | 19 |
| customerOrderTracking | onCall | `functions/src/customer-order-tracking.ts:66` | SG-API-027 | SHIP | 6 |
| deliverEmail | onSchedule | `functions/src/email.ts:10` | SG-API-028 | EMAIL, INT | 12 |
| financeReview | onCall | `functions/src/finance-review.ts:11` | SG-API-029 | FIN | 8 |
| command | onCall | `functions/src/index.ts:45` | SG-API-030 | REQ, QUOTE, LIFE, FIN, REFUND, HISTORY, INT, SEC, PERF | 53 |
| invoiceShare | onCall | `functions/src/invoice-share.ts:9` | SG-API-031 | DOC, SEC | 2 |
| invoiceCommand | onCall | `functions/src/invoices.ts:44` | SG-API-032 | DOC, INT | 10 |
| invoiceList | onCall | `functions/src/invoices.ts:292` | SG-API-033 | DOC, INT | 9 |
| invoiceDetail | onCall | `functions/src/invoices.ts:338` | SG-API-034 | DOC, INT | 10 |
| maintenance | onSchedule | `functions/src/jobs.ts:7` | SG-API-035 | REM, PERF | 4 |
| readNotification | onCall | `functions/src/jobs.ts:256` | SG-API-036 | REM, PERF | 1 |
| uploadContentImage | onCall | `functions/src/media.ts:9` | SG-API-037 | MEDIA | 10 |
| publicImage | onRequest | `functions/src/media.ts:94` | SG-API-038 | MEDIA | 11 |
| membershipReminderPolicy | onCall | `functions/src/membership-reminder-policy.ts:29` | SG-API-039 | REM | 3 |
| membershipCommand | onCall | `functions/src/membership.ts:49` | SG-API-040 | MEM, INT | 18 |
| readOrderConversation | onCall | `functions/src/order-conversation.ts:49` | SG-API-041 | SUP | 5 |
| orderConversationCommand | onCall | `functions/src/order-conversation.ts:149` | SG-API-042 | SUP | 4 |
| orderHistory | onCall | `functions/src/order-history.ts:5` | SG-API-043 | HISTORY | 4 |
| uploadOrderImage | onCall | `functions/src/order-media.ts:81` | SG-API-044 | MEDIA | 6 |
| listOrderImages | onCall | `functions/src/order-media.ts:199` | SG-API-045 | MEDIA | 5 |
| readOrderImage | onCall | `functions/src/order-media.ts:227` | SG-API-046 | MEDIA | 4 |
| outboxCommand | onCall | `functions/src/outbox-command.ts:20` | SG-API-047 | EMAIL | 7 |
| createPaymentLink | onCall | `functions/src/payments/payos.ts:160` | SG-API-048 | PAY, INT, PERF | 11 |
| payosWebhook | onRequest | `functions/src/payments/payos.ts:354` | SG-API-049 | PAY, INT, PERF | 7 |
| reconcilePayments | onSchedule | `functions/src/payments/payos.ts:375` | SG-API-050 | PAY, INT, PERF | 7 |
| publicPage | onRequest | `functions/src/public.ts:106` | SG-API-051 | PUBLIC | 3 |
| publicDiscovery | onRequest | `functions/src/public.ts:293` | SG-API-052 | PUBLIC | 1 |
| refundCommand | onCall | `functions/src/refunds.ts:11` | SG-API-053 | REFUND | 10 |
| returnCommand | onCall | `functions/src/returns.ts:18` | SG-API-054 | RETURN | 8 |
| shippingRatesPublic | onCall | `functions/src/shipping-rates.ts:76` | SG-API-055 | RATES | 12 |
| shippingRatesAdmin | onCall | `functions/src/shipping-rates.ts:82` | SG-API-056 | RATES | 11 |
| shippingCommand | onCall | `functions/src/shipping.ts:22` | SG-API-057 | SHIP, INT | 18 |
| listWork | onCall | `functions/src/workspace.ts:22` | SG-API-058 | PROFILE, WORK, SUP, CONTENT, SEC, PERF | 22 |
| workspaceCommand | onCall | `functions/src/workspace.ts:298` | SG-API-059 | PROFILE, WORK, SUP, CONTENT, SEC, PERF | 23 |
| readOwnerConfiguration | onCall | `functions/src/workspace.ts:730` | SG-API-060 | PROFILE, WORK, SUP, CONTENT, SEC, PERF | 5 |
| ticketMessages | onCall | `functions/src/workspace.ts:762` | SG-API-061 | PROFILE, WORK, SUP, CONTENT, SEC, PERF | 5 |
| readStaffAccess | onCall | `functions/src/workspace.ts:810` | SG-API-062 | PROFILE, WORK, SUP, CONTENT, SEC, PERF | 6 |
| readOrderOperations | onCall | `functions/src/workspace.ts:849` | SG-API-063 | PROFILE, WORK, SUP, CONTENT, SEC, PERF | 5 |

## Exported helper/schema coverage

SCENARIOS.json có inventory `symbols` với path:line, groups và tests nhắc trực tiếp tên symbol. Mapping vào nhóm chỉ là nguồn liên quan; không chứng minh từng branch hoặc từng helper được assert. `INVENTORY_ONLY_NEEDS_REVIEW` là gap cần bổ sung trước yêu cầu exhaustive execution.

- 274 exported const/functions được inventory bằng lexical scan (không gồm tất cả private/local methods hoặc export re-exports).
- 63 handlers có endpoint-contract case; 41 route wiring entries có sweep.
- 235 source/config files và 210 test files có SHA256; tests đều NOT_RUN.

## Khoảng trống đã biết

- Business ownership, SLAs, commercial policy cho đổi membership giữa kỳ, production topology và acceptance budgets chưa có owner contract; `.ai/context` vẫn placeholder.
- Providers AI/email/payments/scheduled maintenance đang code-held. Paid Ask luôn unavailable kể cả policy/pilot hợp lệ. Native Google/MFA/AppCheck và provider sandbox cần thực thi riêng.
- Không có bằng chứng branch coverage, mọi mobile/browser/device tổ hợp, tải thực tế, IAM/deployed Rules hoặc production restore. Không dùng số scenarios để tuyên bố 100%.
- Tests referenced được dò theo file/symbol; phải đọc assertion trước chọn runner. Test filename/symbol match không là proof scenario được automate.
- Source shared worktree có thể thay sau manifest; chạy validate.py và tạo revision/hash mới trước execution.
- API contract cases yêu cầu payload source-valid theo schema hiện tại. Đây là envelope coverage; các action/body fixtures phải được chuẩn bị, không tự đoán hoặc dùng payload production.

## Review refinement

Current order conversation API trả bounded newest50, chưa có older-page cursor. SG-SUP-005 ghi gap rõ; không giả support paging hoàn chỉnh. RequestForm revision mới có requestHeading/finalActions và request-form.css; SG-REQ-009–016 thêm reorder, prefill agency, CSV, anonymous image handoff, partial uploads, corrupt pending, UID/storage failure và frozen payload.

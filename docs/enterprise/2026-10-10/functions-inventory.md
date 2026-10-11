# Backend Functions Inventory

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Export groups extracted from functions/src/index.ts

Không phải danh sách Functions đã deploy. Trigger type, schema, rights, environment và capability cần kiểm tra tại module. Emulator-only aliases cũng xuất hiện và không phải production capability.

| Export | Module | Entrypoint line |
| --- | --- | --- |
| `ask` | `./ai/ask` | 479 |
| `askWorkflow` | `./ai/ask-workflow` | 480 |
| `currentAskConversation` | `./ai/ask-workflow` | 480 |
| `listWork` | `./workspace` | 481 |
| `workspaceCommand` | `./workspace` | 481 |
| `readOwnerConfiguration` | `./workspace` | 481 |
| `ticketMessages` | `./workspace` | 481 |
| `membershipCommand` | `./membership` | 487 |
| `publicPage` | `./public` | 488 |
| `publicDiscovery` | `./public` | 488 |
| `maintenance` | `./jobs` | 489 |
| `readNotification` | `./jobs` | 489 |
| `createPaymentLink` | `./payments/payos` | 490 |
| `payosWebhook` | `./payments/payos` | 490 |
| `reconcilePayments` | `./payments/payos` | 490 |
| `deliverEmail` | `./email` | 495 |
| `readOrderConversation` | `./order-conversation` | 496 |
| `orderConversationCommand` | `./order-conversation` | 496 |
| `shippingCommand` | `./shipping` | 501 |
| `orderHistory` | `./order-history` | 502 |
| `changeCommand` | `./changes` | 503 |
| `returnCommand` | `./returns` | 504 |
| `refundCommand` | `./refunds` | 505 |
| `uploadContentImage` | `./media` | 507 |
| `publicImage` | `./media` | 507 |
| `consolidationCommand` | `./consolidation` | 508 |
| `readStaffAccess` | `./workspace` | 509 |
| `readCustomer` | `./crm` | 510 |
| `saveCustomerNotes` | `./crm` | 510 |
| `listCustomers` | `./crm` | 510 |
| `listFollowUps` | `./crm` | 510 |
| `listCrmStaff` | `./crm` | 510 |
| `operationalDashboard` | `./crm` | 517 |
| `uploadOrderImage` | `./order-media` | 519 |
| `listOrderImages` | `./order-media` | 519 |
| `readOrderImage` | `./order-media` | 519 |
| `financeReview` | `./finance-review` | 525 |
| `membershipReminderPolicy` | `./membership-reminder-policy` | 527 |
| `readOrderOperations` | `./workspace` | 529 |
| `catalogCheckout` | `./catalog-checkout` | 531 |
| `cartCommand` | `./cart` | 532 |
| `invoiceCommand` | `./invoices` | 534 |
| `invoiceList` | `./invoices` | 534 |
| `invoiceDetail` | `./invoices` | 534 |
| `invoiceShare` | `./invoice-share` | 535 |
| `outboxCommand` | `./outbox-command` | 536 |
| `customerOrderTracking` | `./customer-order-tracking` | 538 |
| `shippingRatesPublic` | `./shipping-rates` | 539 |
| `shippingRatesAdmin` | `./shipping-rates` | 539 |
| `studioRead` | `./blog-studio` | 540 |
| `studioCommand` | `./blog-studio` | 540 |
| `studioMediaUpload` | `./blog-studio` | 540 |
| `studioMediaRead` | `./blog-studio` | 540 |
| `blogCommentSubmit` | `./blog-comments` | 547 |
| `blogCommentList` | `./blog-comments` | 547 |
| `blogCommentCommand` | `./blog-comments` | 547 |
| `blogCommentReport` | `./blog-comments` | 547 |
| `studioAdvancedRead` | `./blog-studio-advanced` | 553 |
| `studioAdvancedCommand` | `./blog-studio-advanced` | 553 |
| `websiteBannerCommand` | `./campaign-banners` | 558 |
| `websiteBannerAdmin` | `./campaign-banners` | 558 |
| `websiteBannerPreview` | `./campaign-banners` | 558 |
| `campaignBannersPublic` | `./campaign-banners` | 558 |
| `productReviewRead` | `./product-reviews` | 565 |
| `productReviewEligibility` | `./product-reviews` | 565 |
| `productReviewWrite` | `./product-reviews` | 565 |
| `productReviewModerate` | `./product-reviews` | 565 |
| `productReviewAdmin` | `./product-reviews` | 565 |
| `askKnowledgeCommand` | `./ai/approved-knowledge` | 573 |
| `askKnowledgePreview` | `./ai/approved-knowledge` | 573 |
| `customerSaveResolve` | `./ai/customer-save` | 578 |
| `askResearchCommand` | `./ai/research` | 579 |
| `askResearchSearch` | `./ai/research` | 579 |
| `askResearchSelect` | `./ai/research` | 579 |
| `askFeedback` | `./ai/feedback` | 580 |
| `askFeedbackReview` | `./ai/feedback` | 580 |
| `askFeedbackPolicy` | `./ai/feedback` | 580 |
| `analyticsSession` | `./analytics-ingest` | 583 |
| `analyticsIngest` | `./analytics-ingest` | 583 |
| `analyticsLinkOrder` | `./analytics-ingest` | 583 |
| `analyticsWithdraw` | `./analytics-ingest` | 583 |
| `analyticsOrderChanged` | `./analytics-worker` | 584 |
| `analyticsPaymentCreated` | `./analytics-worker` | 584 |
| `analyticsJobCreated` | `./analytics-worker` | 584 |
| `analyticsCompact` | `./analytics-worker` | 584 |
| `dashboardAnalytics` | `./dashboard-analytics` | 585 |
| `askWebDiscovery` | `./ai/research-live` | 587 |
| `askWebSelect` | `./ai/research-live` | 587 |
| `askFeedbackWithdraw` | `./ai/feedback-lifecycle` | 588 |
| `askFeedbackInbox` | `./ai/feedback-lifecycle` | 588 |
| `askFeedbackCleanup` | `./ai/feedback-lifecycle` | 588 |
| `askFeedbackEvaluation` | `./ai/feedback-lifecycle` | 588 |
| `purchaseCheckout` | `./purchase-checkout` | 590 |
| `purchaseBalanceCheckout` | `./purchase-checkout` | 595 |
| `purchaseCheckoutSetup` | `./purchase-checkout` | 596 |
| `purchaseDraftImage` | `./purchase-images` | 598 |
| `purchaseOrderRead` | `./purchase-checkout` | 599 |
| `purchaseReceipt` | `./purchase-receipts` | 601 |
| `purchaseReceiptWorker` | `./purchase-receipts` | 601 |
| `purchaseReceiptRecovery` | `./purchase-receipts` | 601 |
| `purchaseSourcingChange` | `./purchase-adjustment` | 603 |
| `customerNotificationCreated` | `./customer-notification-delivery` | 612 |
| `notificationPreferences` | `./notification-preferences` | 614 |
| `deliverSubscriptionEmail` | `./subscription-email` | 615 |
| `publicOrderTracking` | `./public-order-tracking` | 617 |
| `managePublicTrackingCode` | `./public-order-tracking` | 617 |
| `command` | `./index (local definition / conditional alias)` | 47 |
| `purchaseDemoPayment` | `./index (local definition / conditional alias)` | 592 |
| `purchaseDemoWebhook` | `./index (local definition / conditional alias)` | 594 |
| `purchaseSePayPayment` | `./index (local definition / conditional alias)` | 608 |
| `purchaseSePayIpn` | `./index (local definition / conditional alias)` | 609 |
| `purchaseSePayInboxWorker` | `./index (local definition / conditional alias)` | 610 |

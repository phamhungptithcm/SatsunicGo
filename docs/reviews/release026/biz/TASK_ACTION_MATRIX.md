# Task/action/navigation inventory026

Source-observed module inventory, not claim every screen/state tested. Customer/staff roles remain server authority; route/menu is visibility only. Existing prior acceptance cannot certify026 candidate.

| Customer task | Existing surface/service boundary | Ask support observed | Required confirmation / navigational simplification |
| --- | --- | --- | --- |
| Find listed product and choose variant/quantity | products/Checkout, CatalogPurchase, catalogCheckout | catalogCheckout action schema and explicit catalog card | Product version/terms/total confirmation mandatory; keep selected product context instead of reconstructing custom draft |
| Unlisted purchase request | requests/RequestForm, Commerce, command submitRequest | draft/saveDraft/submitRequest | Complete bounded items+market and explicit submit mandatory; preserve draft through login, no retyping from Ask→request |
| Reviewed custom quote | requests order detail, command acceptQuote | acceptQuote version payload | Customer approves latest reviewed quote, catalog excludes this step; show consequences in current order context |
| Final custom liability | order detail, command approveFinal | approveFinal | Customer approves changed final total before remaining money; catalog excludes surcharge/finalization |
| Recipient details | profile/addresses and Commerce private recipient | saveRecipient separate private schema | Save privately before payment; do not ask user to paste PII into model turn; retain recipient per conversation/order contract |
| Payment/transfer notice | Finance, TransferNotice, createPaymentLink/command transferReview | separate provider payment creation in Commerce, no model money command | QR/link/notice not paid; staff/provider verified allocation only; avoid repeating full-price vs deposit instruction ambiguously |
| Delivery/receipt | CustomerShipments, customer order detail | confirmReceipt payload received true | Explicit actual full receipt required after delivery; track delivered cannot auto-complete receipt |
| Change/cancel/return | CustomerChanges explicit native disclosure now embedded in selected-order Commerce; staff Changes/Returns remain separate | Customer accept/reject native component reuse, restored EN/VI with server-confirmed loading/empty/error/offline/retry; not a new conversation action tool | Explicit customer decision on proposed payable mandatory; staff propose/apply remain separate. Own accept/reject/foreign3 and read-state3 passed root026 round2; no AI proposal/apply authority |
| Documents/history/share | invoices/Documents, OrderTools, InvoiceSummary | summary display not issue/share/void tool authority | Issued immutable internal statement, share revoke/expiry independent; do not infer tax or paid from statement |
| Membership/renewal | membership/Membership, PlanEditor, membershipCommand | no membership grant/purchase action observed in Ask allowlist | Plan/price/term confirmation and verified collection; benefit expiry server time; no AI grant |
| Support/order conversation | support/Support/Thread/OrderConversation, InlineSupport | embedded help surface, not generic staff authority | Preserve private linked order identity and actor roles; secondary disclosure can reduce navigation without changing ownership |
| Profile/consent/security | Profile, Security, notifications | no saveProfile/MFA/consent tool observed | Explicit consent withdrawal/security actions remain dedicated; account locks clear private state |

| Staff task | Existing main surface | Primary decision and invariant |
| --- | --- | --- |
| Queue/quote/buy/receive/pack | Workbench and OperationsDetails | Current stage+role+verified funds/line quantities/hold, actual evidence; navigation to same order retains ID |
| Customer follow-up | CRM Customers/Customer/Dashboard | Assignee/current appointment/version, snapshot counters bounded; no stale response replaces current query |
| Finance/refund/exceptions | Finance/Refunds/FinancialReview | Money verified evidence, cancelled new collection blocked, reservations conserved; no AI authorization |
| Parcels/batches/tracking | Shipping/Consolidation/Returns | Allocation conservation/current freight approval and warehouse checks; recipient privacy |
| Approved changes | Changes queue | Pending customer decision distinct accepted/applicable vs applied; bought replacements rejected |
| Document operations | Documents | Current source version before issue, immutable history, share/revoke capability; no financial mutation |
| Content/campaign/media | ContentEditor/Campaigns/MediaUpload | Existing permission/validation, preview/draft distinct public publish; AI cannot publish |
| Membership/settings/staff access | PlanEditor/Settings/StaffAccess | Owner-only commercial/config/admin changes; never expose controls through customer Ask |
| Logs/outbox | Activity | Current type/query snapshot; unknown email needs evidence reconciliation, no blind retry |

Natural Ask happy/bad/race requirements: explicit intent stages must reflect catalog vs custom and linked order; server reads latest owner/lock/version, durable operation identity on uncertain result; login retains task/draft but never private foreign state; expired/stale quote rejection preserves draft and money; duplicate checkout/review/submit returns same context, conflicting reuse fails; no concurrent event may bypass hold/refund reserve or grant role/payment/publication. New unit ask-business-contract026.test.ts covers6 intent/tool contract matrices; root/backend existing/NEW integration covers stale/concurrent/projection. Test not run by biz.

Navigation opportunities are product proposals, not confirmed source defects: one current task summary/card with next permitted action, separate optional history/media/support, keep in-chat recipient/order continuity and safe resume, link specific order/service rather than generic account route. Preserve confirmations with consequences; do not skip them merely to reduce clicks. No claim all capabilities can be performed naturally by Ask; unsupported tasks should link exact existing screen without pretending completion.

Evidence gaps: exhaustive per-screen loading/empty/error/offline/stale/role/keyboard/reduced-motion/viewport/AT/performance026 matrix belongs UI/root. No current user research or measured navigation savings; business-policy unknowns remain unknown. Production/provider/real auth acceptance not established. Memory candidates None.

Latest docs-only sync: root complete105 round2 reports101PASS4FAIL, with customerChanges accept/reject/foreign3 and state3 PASSED; legacy runtime/harness failures elsewhere preserved, do not report entire105 PASS. Root current fullunit207/integration241 reported PASS; after-recovery full105 run pending final receipt. These root reports supplement previously directly read main3 console/fullunit6 evidence, no complete receipt reinspection claim in this docs-only update. Membership/security/all unsupported services remain deliberate existing screen links or proposals, not naturally completed Ask capability. Source/tests and private docs frozen after update; production NOT_READY.

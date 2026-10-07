# Read-only data/privacy/performance map026

Authorization/ownership: PLAN.md assigns database read-only mapping and private026 reports. No source, rules, indexes, migration, datafix, synthetic/production financial write, emulator reset or runtime/compiler/test process performed. Gate freshly executed DEGRADED: CodeGraph stale/healthy; CocoIndex stale/failed daemon.log permission. No recovery/indexREADY claim; bounded current source fallback. Prior025194/133/51 receipts are historical, not026 candidate validation.

## Query/listener and privacy map

| Surface | Current source contract/bound | Privacy/index/cleanup evidence |
|---|---|---|
| Public shared content | products: featured30 plus published legacy30; posts published30 | shared publicStores/createLiveCache, one source per kind across subscribers,200ms last-subscriber release, generation guards, RAM public data only. published status filter; products status+featured+featuredOrder composite defined |
| Full catalog | useCatalogPages published30/page, document-ID cursor, incremental dedup | owner-independent public collection; publication filter; live/mounted guards. Bound is per page, client intentionally accumulates visited pages |
| Public content detail | status+slug limit1 live query | composite products/posts status+slug defined; effect unsubscribe on kind/slug changes |
| Public HTTP content / sitemap | products/posts list30, detail1; sitemap200 each collection | Admin source explicitly published-only; sitemap is bounded and not proof of complete corpus/indexing |
| Ask product suggestions | CatalogPurchase up to8 slug-specific limit1 getDocs calls | published-only, slug+status composite, live guard; validates orderable catalog schema. Potential repeated mount/search reads are measurable, not established unnecessary |
| Ask model retrieval | posts up to100 per request,25-page scan; title/body lexical retrieval cap20k chars/document,8 excerpts,12k context; products30 per search tool; membership plans10 | Public-only data. Four total tool calls; posts tool reuses request-local scanned knowledge (not more Firestore scans). Product tool re-queries on repeated invocations. Prompt explicitly disallows absence inference from bounded/no matches and all money/role/publish authority |
| Ask private commerce | conversation doc, linked order doc, addresses owner query20, recipient doc | owner-scoped rules and user/conversation context guards; unsubscribes on effect cleanup. Recipient loads only when recipientSaved. Addresses/recipient are separate from public knowledge corpus |
| Inline support | owner supportTickets query50, client find subject by order; ticketMessages latest50+3 permission docs per refresh | rules require owner; callback scope guard; messages refresh on ticket id/version. Listener starts while widget is collapsed; target completeness hypothesis below |
| Customer account | own orders list50 or selected order direct doc | useOrders mounted in Account (not globally across public routes), selected-ID direct lookup, UID/active callback checks and unsubscribe |
| CRM customers/followups/staff |31 primary rows +30 counterpart documents +2 actor documents;30 displayed and cursor sentinel | current strict active/roles/lock server guard; keyset name/ID, followUpAt/ID and role-array indexes defined; search/mode/asOf contracts retained |
| CRM detail | two independent owner queries31 each +profile/CRM/membership3 +actor2: up to67 materialized documents per transaction callback | ownerId+createdAt DESC+name DESC composites. Server profile whitelist. Current read-only membership expiry projection; no membership write |
| CRM dashboard |4 collections x100 +2 actor documents: up to402 per transaction callback |31-day bound, current manager-only guard; source bounded snapshot, not global counts or measured SLA |
| Private order conversation | public/internal messages51 each; staff choices51 plus eligible profiles up to50 | transaction-current owner/handler authorization, private staff notes not returned to customer; explicit truncation flag for staff options; owner/assignee rules preserved |

Counts are source bounds for document materialization, not billing predictions, actual network bytes or per-event read charges. Transaction retries can repeat callback work. Realtime snapshots do not imply every update bills the entire query result. Empty query minimum charges, indexes and provider pricing were not assessed.

## Bounded hypotheses and optimization opportunities

### DB026-1 Inline-support lookup completeness — SOURCE_SUPPORTED / runtime NOT_RUN

InlineSupport.tsx45 queries first50 owner tickets and uses client-side subject equality. A valid target ticket outside those50 is indistinguishable from missing. submit then chooses openTicket rather than replyTicket. workspace.ts openTicket persists provided subject/topic/message under UID and operation id; there is no subject/order uniqueness check in this path. Actual mounted caller Commerce.tsx1058 renders widget for the current order. No customer-data leak or live duplicate was observed.

Minimal root-before repro: seed51 unique owner tickets sorted by document ID,50 unrelated first and target subject `Ask · ORDER_ID` last, matching a real synthetic order owned by signed-in customer. Mount actual order widget and open support; target replies should remain reachable. Attempt reply and assert target version/messages update with no52nd ticket. Compare cross-owner denial and lock/retry behavior. A production backend change or new composite must remain separately planned/owned; do not simply increase arbitrary limit or infer absence. Consider owner+subject filtered lookup or verified existing order-conversation service only after owner confirms service/business contract; no patch proposed here.

### DB026-2 CRM pagination read amplification — optimization opportunity, not correctness defect

readCustomer re-reads both31doc related sections on every call. Customer.tsx preserves unaffected section when paginating the other section, so that returned section can be discarded while its database work repeats. Profile/CRM/membership refresh may be deliberate freshness behavior. Measure collection get counts and response bytes for initial/ordersNext/ticketsNext before proposing an API/projection change. Preserve independent cursors, UI freshness, safe profile projection, current authorization and version/retry contract. No performance gain claimed.

### DB026-3 Ask per-request scan/product tool repetition — bounded measurement target

Each Ask request scans up to100 published posts; four tool calls cap product re-queries. publishedKnowledge trims fetched body to20k characters, but Firestore get already materializes whole document. Workspace CMS body cap30k reduces canonical size; scan/read payload must still be measured. Request-local post cache correctly avoids repeated scans within one request. Cross-request caching would need publication/version/invalidation/privacy design and is not an authorized speculative patch.

### Refuted or not established

Public multiple-subscriber listener duplication is refuted by shared publicStores/createLiveCache with proper disconnect/generation handling. Account orders50 is not an always-on global public-route listener: actual useOrders caller is Account. No unbounded database query was confirmed in these targeted surfaces. A bound can still omit a target or amplify repeated reads; bounds alone do not prove correctness/performance. No cross-principal leak is asserted from component internals without actual caller/remount and scope verification.

## Root-owned test/metric proposals

1. Support51 target outside sample before/after; assert existing target retrieval/no duplicate/open/reply version conflict/lock/cross-owner denial.
2. Public same-kind two subscribers: one upstream connection,200ms teardown, stopped callback ignored; retry/offline/public withdrawal cache behavior. Existing cache tests should be inspected before adding coverage.
3. CRM initial/ordersNext/ticketsNext counters: queries, returned/materialized document counts, response size, duration; keep timestamp ties and asOf stable. No raw notes/addresses/tokens in metrics.
4. Ask0/25/100/101 posts,4 product tool calls, malformed/unpublished content and cancellation: track per-request query count, retrieved docs, scanned chars, CPU/event-loop duration, first-status latency and total latency. Coverage stays incomplete;101st document absent from sample never implies absent product/policy.
5. Route/conversation/principal changes and collapsed support: active upstream listener count/connect/disconnect, no retained private UI, ignored stale callbacks. Collect counts/timestamps/service names only; exclude payloads, auth headers, session tokens and private body fields.

No metrics executed here. Local demo latency under accumulated runtime degradation is not production SLA/load/restore acceptance. Defined index files are not proof of deployed indexes or production execution plans. Product/business contract remains catalog one full fixed payment versus custom reviewed quote/two installments; AI text is not authoritative money/role action.

## Handoff

Current source-backed report and hash snapshot only. Findings/metrics sent to root/backend; source fixes/tests remain assigned owners and root serial runner. Final current candidate compiler/integration/browser/content/final review and external auth/provider/AT/load/restore/dependency/deployment acceptance NOT_RUN by this owner. Production NOT_READY. Token usage and billed/API-equivalent cost Unavailable. Memory candidates: None.

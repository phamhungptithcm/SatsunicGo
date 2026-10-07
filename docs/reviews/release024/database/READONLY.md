# Database CRM round024 read-only audit

Scope: current CRM data contracts, bounded queries/index definitions, roles, version/replay and displayed-data semantics. Per root TEAM_CONTEXT.md, backend owns crm.ts plus new crm-hardening.test.ts; UI owns CRM components. This owner has made no source/rules/index/test/runtime changes. Root serializes all executable validation. Earlier023 results are historical baseline only.

## Repository evidence

Fresh Repository Intelligence Gate executed after root recovered login:false source/read/report commands: CodeGraph and CocoIndex health Passed, both Stale, mode DEGRADED/ready false. No refresh/install or indexREADY claim. CodeGraph returned current on-disk symbol source; CocoIndex no-refresh search used as contextual evidence and checked against current source. Reviewed functions/src/crm.ts, packages/domain/crm.ts, existing server.test.ts CRM regression, current firestore.indexes.json and actual Workspace/App callers. Member-expiry follow-up also inspected functions/src/membership.ts and jobs.ts. No compile, tests, browser process, reset/reseed, provider or production action started.

## Preserved CRM contracts sent to UI/backend

- crmRoles is OWNER/OPERATIONS_MANAGER/SUPPORT. Verified Google/current active unlocked actor authorization remains server-side before replay/read. UI navigation and assignee filters are not access authority.
- listCustomers is normalized name PREFIX search or exact ID, not substring/email search. Up to30 rows, sentinel31, ordered document-ID tie break. Search cursor includes name+id; reset on filter/mode change.
- listFollowUps has stable returned asOf across pages,30+sentinel31, cursor at+id. Overdue is 0<followUpAt<=asOf; upcoming asOf<followUpAt<=asOf+7*86400000; all includes positive schedules, not unscheduled records. Device display timezone does not change stored UTC milliseconds.
- readCustomer independently paginates owner-filtered orders/support tickets,30 each, createdAt DESC plus document-ID DESC tie break. Profile projection includes displayName/businessName/marketingConsent, not arbitrary user document. Missing finalTotal returns remaining:null (unknown, not zero). Catalog factory sets fixed finalTotal; no catalog/custom policy change proposed.
- Internal notes use expectedVersion, stable operationId and current assignee eligibility. Current version/replay checks happen within transaction. UI must not convert save uncertainty into a new operation ID or claim a message was sent to customer.
- Current indexes cover CRM assigneeId+followUpAt+name, searchName+name, active+roles-array+name and ownerId+createdAt DESC+name DESC for orders/tickets. This is definition review, not proof of deployed indexes or production query plans. No index edit warranted by this bounded audit.
- Result-set materialization is bounded: list pages read at most31 primary documents plus30 counterpart lookups and actor reads; detail related queries cap31 each. These are source bounds, not measured latency/billing/performance acceptance.

## Findings and owner decisions

1. Backend-confirmed CAS/malformed-role findings are already assigned to backend, not duplicate DB fixes: absent CRM record with supplied expectedVersion may be recreated by old.exists-only guard; active truthiness/unchecked roles can authorize malformed state or throw TypeError. Backend reports16 new regressions awaiting root failing-before run. This audit does not claim those tests ran or fixes passed.

2. REFUTED hypothesis: component internals alone suggested Customer A data surviving navigation to B and being saved under B route ID after load failure. Actual caller Workspace renders Customer key={pathname}; App keys Workspace by UID+roles. Navigation and principal/role changes therefore remount these components. The proposed trigger is not present in current call path. Earlier HIGH classification was withdrawn and correction delivered to root/UI. No production defect or fix is claimed. Keep these caller keys through redesign; navigation/load failure regression may protect existing behavior.

3. Membership expiry meaning REVIEW_PENDING with biz owner: readCustomer returns stored membership state/endsAt; Customer maps raw active to "Đang có hiệu lực". membershipTerm defines active as state==='active' AND endsAt>now; scheduled maintenance writes expired asynchronously (max30/run). A past-end active document before the job is a source-supported timing case. Biz was asked to confirm established contract before defect/fix classification. No live/read-write repro or code change is claimed. A correction, if confirmed, should be an owner-approved projection/rendering change with boundary-time regression, not a membership datafix.

## Regression recommendations for root/owners

Preserve actual navigation/principal remount keys; protect same-path retry/stale response behavior. Extend CRM checks for equal sort timestamps/name tie-break cursors, queue asOf consistency, exact expiry boundary, revoked/malformed assignee, and no-write replay/version failures. Current server.test.ts already covers35 normalized-name/schedule/related-order rows, locked assignee, serial replay/version conflict and revoked SUPPORT. Additional recommendations are coverage gaps, not claims of confirmed bugs or tests already run.

## Handoff limits

Read-only analysis complete for this bounded surface; no DB/rules/index edit plan requested. New executable checks NOT_RUN by this owner, root serial window pending. Source is changing under other owners; immutable hash snapshot is a point-in-time record, not final024 candidate certification. Product Language Gate/rendered evidence, current full regression and fresh final implementation review belong to changed owners/root. Production NOT_READY: actual auth/provider/AppCheck, deployed index/query plans, retention/backup/AT/rollout acceptance remain unverified. Token usage and actual/API-equivalent cost Unavailable. Memory candidates: None.

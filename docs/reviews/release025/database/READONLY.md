# Database/rules/transaction read-only round025

Root-authorized scope: read-only current candidate review and bounded source/repro/delta handoff. No application, rules, indexes, tests or production data edited. No emulator reset, compile/browser/test process started. Prior024 acceptance is historical, not current025 certification.

Gate freshly executed: CodeGraph and CocoIndex healthy but stale; DEGRADED/ready false. Source fallback used, no reindex/install/READY claim. Rules, private media, physical-return and consolidation execution paths, actual callable/UI entrypoints, current CRM canonical guard and existing integration fixtures read directly.

## Source-supported findings requiring root executable verification

### DB025-1: noncanonical active/role authority does not fail closed

Severity: medium hardening/correctness. Stored corrupted/noncanonical authority is required; this review found no customer client-write path to staffAccess, no live corruption and no production exploit.

order-media.ts30 selects roles by active truthiness. consolidation.ts62 and returns.ts54 also check !active. Values such as string "false" and number1 therefore retain privileges instead of denial. order-media.ts37 and consolidation.ts65 call roles.some on unchecked data; a string/object can cause generic runtime failure rather than safe permission denial. returns.ts43-57 calls roles.includes through allowed.some: a string "NOT_OWNER" matches OWNER as a substring and grants the close action. The checks execute on actual exported callables (index.ts449/453/466), not unused code.

Canonical current scoped reference: crm.ts authorize196-211, assignee branch363-378 and dashboard428+ use active!==true plus !Array.isArray(roles), retaining exact role membership checks. Existing crm-hardening.test.ts75+ has stringfalse/number1/stringroles/objectroles fixtures. This is an established local hardening expectation, not a proposal to change legitimate role grants.

Minimal root-only repro A (no Storage needed): unique synthetic order with ownerId=customer; actor is another verified-Google UID; staffAccess actor {active:"false",roles:["SUPPORT"]}; users actor unlocked. Seed one ready request metadata row if desired. listOrderImages actor/order is currently accepted; expected permission-denied. Capture no leaked rows; after correction assert safe denial. Canonical active:true SUPPORT should still list non-receipt kinds.

Minimal root-only repro B (return role substring): unique order ownerId customer/version8/collected1000/refunded0/hold string; orderReturns same ID/orderId/version1/state inspecting/lines [{line:0,authorized:1,received:1,accepted:1,damaged:0}]. Staff actor {active:true,roles:"NOT_OWNER"}; actor unlocked. returnCommand {id,action:"close",expectedVersion:1,operationId:new UUID,evidence:"synthetic inspection"} currently passes substring role check and can close. Expect permission-denied and exact unchanged return/order, no new evidence/timeline/audit/idempotency record. No payment or financial write should be performed by the runner.

Minimal root-only repro C (malformed consolidation roles): staff active:true/roles:"OWNER"; invoke consolidationCommand with outer-schema-valid seal request {action:"seal",operationId:UUID,batchId:unique,orderVersions:{},parcelVersions:{},payload:{}}. Actor guard executes before payload parse; current string roles throws TypeError, normalized by handler to generic failure, rather than permission-denied. This minimal fixture demonstrates safe-denial behavior only; it does not prove unauthorized successful seal. For truthy active privilege regression reuse existing server.test.ts604+ valid seal fixture, mutate only active, and assert no batch/package/order/audit/idempotency changes.

Bounded correction recommendation: strict active boolean and roles array membership before privileged operation; keep all canonical grants, owner customer paths, lock/revocation, replay-before-version checks, MFA/AppCheck, error text and payload unchanged. Root assigns backend after its CAS work; no owner edit performed here. No shared-helper refactor or dependency/schema/rule/index change required by this finding.

### DB025-2: media buyer assignment accepts substring strings

Severity: medium corrupted-authority hardening. order-media.ts35 calls (orderIds??[]).includes(id) without array verification. With canonical active:true, roles:["BUYER"] and orderIds:"prefix-target-suffix", requesting orderId:"target" is treated as assigned despite there being no exact array entry.

Minimal root-only repro: order target belongs to customer, ready purchase metadata exists; BUYER actor has the string above and unlocked user. listOrderImages actor/target currently accepts; expected permission-denied. Repeat canonical array ["prefix-target-suffix"] (deny) and ["target"] (allow). Requested ID must satisfy actual orderId regex. A list-only check avoids Storage I/O. If testing upload, denial must happen before reservation/counter/Storage writes.

Bounded correction: array verification before exact .includes(id); preserve legitimate BUYER mixed-role union and independent WAREHOUSE/SUPPORT/FINANCE grants. Do not coerce strings or split them into guessed assignments. Root/assigned owner handles implementation and regression.

Additional current caller: workspace.ts listWork27-32 also uses truthy active and unchecked roles. Its buyerOnly exact-id branch136 checks unchecked orderIds.includes(id), sharing the substring counterexample; list path127 spreads new Set(orderIds), so a malformed string becomes individual character IDs rather than the expected assigned-ID array. Legitimate staff write schemas do specify array(enum roles) and orderIds array; this is stored-read validation hardening, not an observed client-write bypass. Root was sent this bounded read-only extension for explicit owner/delta assignment.

## Transaction and coverage review

- Media: UID+operation-derived ID and metadata fingerprint reserve once in Firestore; count cap20 transaction; Storage generation precondition outside transaction; ready state publication reauthorizes; read reauthorizes after download. Existing scoped regressions exercise identical concurrent uploads, one counter/audit, mismatched retry, quota cap, private receipt denial, mixed roles/current assignment revocation and account lock during I/O. They do not cover the malformed authority cases above.
- Returns: current privilege check precedes idempotent replay; expectedVersion checks serialize later writes; physical receive/inspect limits preserve authorized quantities; close changes no money/hold. Existing server.test.ts1054+ covers serial replay, stale version, role denial and revoked actor replay. Independent simultaneous distinct-operation receive/inspect with the same expectedVersion remains a coverage gap, not a proven defect: recommend exactly one fulfilled, one aborted, quantity conserved and one new evidence/audit.
- Consolidation: current role/lock checks before replay; operation hash and order/parcel versions checked within transaction, actual monetary/hold dispatch guards preserved. Existing seal/dispatch fixtures cover held/unpaid orders. Concurrent seal of same parcel across distinct batches and replay after actor revocation deserve root-selected regression; no duplicate allocation defect established from this bounded read.
- Consolidation double-batch hypothesis is further constrained by explicit parcels.some(batchId)/orders.some(consolidatedFreight) rejection and versioned transaction writes. A concurrent cross-batch test should verify exactly one seal; this review does not label duplicate allocation a confirmed defect.
- Firestore: client private reads still require verified Google/current user-unlocked ownership; nested records require parent owner; client business writes denied; private admin/media collections default deny. Storage recursive read/write deny. No rules/index edit warranted by this audit.

## Handoff and evidence boundary

Findings sent to root/backend with explicit malformed-data preconditions. All repro execution NOT_RUN by database owner; root serializes suites and assigns bounded ownership/delta. Source facts are distinct from runtime outcomes. No previous passing suite certifies these new counterexamples. Source SHA snapshot accompanies this report; other owners may change files later. No successful implementation/production handoff claimed. Production NOT_READY; external provider/auth/AppCheck/index plans/backup/retention/AT/performance/dependency acceptance remains root-owned. Token usage and actual/API-equivalent cost Unavailable. Memory candidates: None.

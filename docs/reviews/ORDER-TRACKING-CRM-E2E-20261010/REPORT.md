# Current implementation and validation report

Status: scoped local acceptance46/46 verified; final self-review cycle6 PASSED. Production NOT_READY. No deploy, push, commit, PR or production mutation. Current source remains in the shared dirty worktree; unrelated WIP preserved. Previous report/matrix retained as REPORT-CYCLE3.md and SCENARIO-RESULTS-CYCLE3.json.

## Approved implementation

CRM shipping and batch mutations atomically publish one safe deterministic order event/revision and the matching shipment projection timestamp. Account/owner Ask refresh from that revision; guest Ask only receives publicStatus,updatedAt,observedAt,eta and uses bounded visible/online polling. Approved compact shared timeline remains unchanged. Generation/auth/deadline fences reject stale responses; offline ETA is suppressed; lost/unknown mutation acknowledgement retains intent and uses idempotent retry. Owner receipt confirmation requires complete canonical parcel quantities without fabricating order.tracking. Stage transitions remain business logic; no editable timeline master-data CRUD was added.

Product defects previously fixed and verified: atomic revision/timestamp parity; terminal-abort state overwrite; canonical parcel receipt gap; refresh keyboard focus loss; aggregate and per-parcel stale ETA offline; incorrect allocation negative fixture; ordinary-build dependency on ignored QA metadata. All are detailed in prior cycles and REPORT-CYCLE3.md. The earlier continuation changed test utilities/coverage; the final accessibility delta adds post-close input focus restoration without changing strings, timeline design or backend behavior.

## Completed continuation

Human approved temporary expiresAt-only demo pricing delta. H01 custom and H02 catalog checkout ran through real HTTP Auth/Functions/Firestore: checkout→demo paid→purchase→receive→pack→parcel dispatch→ETA set/remove→delivered→owner receipt COMPLETED. One payment ledger entry each; collected/refunded unchanged by shipping. Checkout UI, external payment/provider and PDF delivery are outside this proof. Pricing restored to original hash/version; no formula/price change. Restore also passed injected apply rollback and post-commit acknowledgement loss. The wrapper was hardened to enter guarded restoration even if apply acknowledgement is lost.

Native actual Shipping component fixtures now cover two-window stale-version conflict with retained draft/reconcile; abort before request; real HTTP abort while consuming response body after server commitment; same-intent retry. Database readback: before-request abort revision2/event1; after-commit abort revision4/event3; retry stays revision4/event3, collected240000/refunded0. This is controlled client transport injection, not physical network cut or production CRM shell acceptance.

Transaction performance:3samples each at1/10 affected orders and1/20 batch parcels. Scheduled SDK writes7/25 and10/67 respectively;1attempt each. Concurrent staff, finance/shipping and eight guest contenders preserve one authoritative winner and quota cap; exact attempt/read/write/duration receipts in TRANSACTION-PERFORMANCE.json. Counts include aborted attempts and are not provider billing/SLA. Four actual visible owner contexts over~80seconds add at most one read per mounted Account or Ask polling component; hidden/coalescing/lifecycle coverage remains component/unit, not native hidden-tab capacity proof.

## Checks and evidence

- Current changed backend suites:87/87 passed; baseline scoped backend100/5files remains in logs, unchanged suites verified by source hashes. No claim that these are187 unique tests.
- Baseline scoped unit130 + shipping regression20; Ask35 + Account/public-code9 component checks, SDK mocks explicitly distinguished from real HTTP/native layers.
- Fresh npm run build (frontend TypeScript/Vite) PASSED; existing chunk/dynamic-import warnings retained. Scoped eslint and current tsc PASSED. Functions source unchanged from prior passing build/source manifest.
- Guest native axe:zero violations/zero incomplete, capability absent from DOM, forbidden provider sinks0. Owner axe connector pseudo-element incomplete nodes manually checked from live computed colors/background/geometry:minimum4.98:1, no connector/text vertical overlap. No WCAG certification claim.
- Cleanup:117 business,21 native adverse and15 lifecycle guard paths removed, readback0 and test Auth users absent. Duplicate setup guard rejects active fixture and preserves metadata. Private pricing backups and tracking capability removed; shared quota buckets retain normal TTL. Seven owned browser tabs closed; original user tabs retained.

## Remaining acceptance and readiness

U03 passed on native Chrome after unlock: DevTools Rendering prefers-reduced-motion reduce readback true; Account/owner Ask579 and guest144 element/pseudo styles have zero remaining motion. Default media emulation restored (reduce=false). No OS setting changed. Guest axe0violations/0incomplete; owner contrast resolution retained. Escape/close lost focus was reproduced, fixed with post-close composer focus, verified with native reduce/normal-motion interactions and2 component regressions. All46 cases retain explicit evidence layers; nativeE2E46=false.

No new known product defect in the executed continuation checks. Test-helper missing-argument defect was fixed and both backend suites rerun87/87. Pricing apply-acknowledgement cleanup risk was fixed and negative restoration cases verified. Full physical-network cuts, native hidden-tab capacity, text zoom, screen-reader hardware and provider/production operations remain unverified limitations. Shared Storage19208 unavailable; no PDF/provider acceptance claimed.

Repository intelligence:CodeGraph→CocoIndex DEGRADED (stale indexes/local CLI health); bounded current source/hash/compiler/test verification used under root AGENTS. Executable approval validator cannot accept DEGRADED; not bypassed or modified. Human approval evidence is APPROVAL.md plus DEMO-PRICING-APPROVAL.md. HostNode25 differs from Functions22; no production runtime proof. Self-review only, not authenticated independent release assurance. Runtime adapter task state/Git/workcell/routing limitations remain separately disclosed by rendered report; no READY claim.

Newest review cycle6:PASSED for approved local implementation. Cycle5 records keyboard focus defect; cycle6 verifies correction. Production readiness assessment reviewed limitations, not provider approval. Prior cycles retained. Production NOT_READY. Token usage/API-equivalent estimate/actual billed cost:Unavailable. Memory candidates:None; no memory updated.

Final continuation: MOTION-BROWSER.json, MOTION-CLEANUP.json, motion screenshots/logs. Ask35/35, fresh rootbuild and scoped lint pass. Only Ask focus restoration and regression tests changed application behavior; test harness current readiness gating reviewed. No new strings; approved timeline UI preserved. Disposable QA capability appeared once in tool output before submission; it belonged only to synthetic demo fixture, subsequently removed with all owned documents/Auth. No customer data/provider traffic exposed.

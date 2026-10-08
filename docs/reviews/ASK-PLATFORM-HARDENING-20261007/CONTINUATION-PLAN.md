# Approved continuation — 2026-10-07

Human request: continue the hardening loop until done and production. This continues ASK-PLATFORM-20261007; no broader concurrent WIP is adopted for release.

Current gate: DEGRADED; source/compiler/test fallback permitted by current repository policy.

Next implementation slice: S05/S06/S08 approved knowledge lifecycle and a bounded no-generation evidence path for Ask. Add strict version/effective-period/locale/source-hash contracts; OWNER + recent MFA approval/revocation; operation-id replay protection; recheck source publication/hash at read time. No source is auto-approved and no paid provider is enabled. Existing public posts and commerce paths stay authoritative.

Paths: NEW packages/domain/ask-knowledge.ts, functions/src/ai/approved-knowledge.ts, tests/unit/ask-approved-knowledge.test.ts, tests/rules/ask-approved-knowledge.test.ts; functions/src/ai/ask.ts integration; functions/src/index.ts export only; task review docs. No dependencies or existing data migrations. New collection is default-denied to clients by current Firestore rules.

Validation: exact schema/validity/hash, stale/revoked/locale mismatch, owner/MFA/locked fences, conflicting replay, version conflicts, direct actual Ask handler evidence response without provider call; TypeScript, ESLint, happy/bad tests; fresh final-review loop. Deployment requires frozen reviewed candidate and existing release gates; no dirty-tree deployment.

Authoring integration required by S05: add OWNER/MFA protected preview endpoint, immutable revision snapshots, and new KnowledgeApproval component mounted beside existing AskPilot in Settings. Preserve all other Settings WIP. Unknown write outcome retries the identical operation; no automatic approval or spend enablement.

Release-gate supporting fix: the existing required-label checker incorrectly requires a marker on each radio option instead of the native fieldset legend. Mark the Membership plan radio group's legend once, preserve options/WIP, and recognize only literal-name radio groups in the checker. Add negative fixtures to ensure text fields/unmarked legends cannot bypass the check. This changes displayed required-field semantics only, not membership validation or financial rules.

S18 continuation (human: "Tiếp tục hardness change get work done"): harden existing Profile before inline Ask reuse. Current save retry generates a new operation ID after an unknown response; address create may duplicate. Scope Profile.tsx only plus focused actual-component browser and backend tests; no workspace/backend contract changes. Retain immutable pending command in component memory, retry exact operation, block edited/other writes during unknown result, clear sensitive pending state on identity change/lock/unmount; no PII sent to model or persistent browser storage. Verify happy save, lost response, terminal rejection, account switch/late callback and no duplicate address. Existing profile/address domain rules and all unrelated WIP preserved. This uses approved full-plan S18 and continuation authorization; no new production policy or financial capability.

S18 UI integration: new CustomerWorkspace component in Ask panel reuses hardened Profile form via lazy load and an explicit expand control. No new backend write action, LLM tool or automatic mutation. Preserve mounted form on collapse/dialog close to retain pending operation; remount on UID switch. Scope Ask.tsx import/mount only and Profile instance IDs to avoid duplicate accessibility references when the page and panel coexist. Existing Profile copy remains Vietnamese, wrapper labels VI/EN; complete English form localization remains a tracked limitation.

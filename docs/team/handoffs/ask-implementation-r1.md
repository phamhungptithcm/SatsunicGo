# Ask scoped implementation handoff
Approved E2E005 + explicit lead thaw. READY artifact /tmp/satsunicgo-freeze-gate.json preceded audited source; parallel writes resumed after scope assignments. No provider mutations, deployment, dependencies, secrets, shared App/index/firebase edits.

## Current behavior
Callable streaming carries validated retrieving/selecting status and one validated final answer. Ordinary callable invocation returns the same answer; non-streaming server final data works without chunks. This matches observed Hunpeo JSON-line status/final semantics, not incremental token prose. Client enforces 30KB/12 events, schema validation, duplicate-answer rejection and active-request cancellation; SDK AbortSignal terminates HTTP stream. Server combines disconnect signal and existing bounded model timeout. Quota errors preserve resource-exhausted classification. Six bounded prior questions provide safe continuity. Private order requires verified Google session and current ownership. Public FAQ remains local and operational when AI unavailable.

Narrow getPublicFeePolicy reads publicCopy.fees only (rates pending approval explicitly); comparePublishedPlans queries published plans, projects validated public commercial fields, bounded ten rows, observes current timestamp. No private snapshots/internal fields returned. Membership citations now point to membership page. Conditional Google data-processing notice does not imply enabled provider.

## Evidence
Focused transport/citation tests 4/4 PASS. Scope ESLint PASS. Functions TypeScript build PASS on final history/Google-guard candidate (18:33:59 test run). Global tsc hit concurrent firestore.test.ts fixture provider/MFA types; root notified, no unrelated edits. Shared emulator rules/provider/browser NOT_RUN.

Reference Hunpeo commit 3f9997ea31670ffe7611cf280c98dd9e6eb5bfab; component SHA256 e8e9dfca5fff1641441fbe3bf83db9065cd752cfa5e84f467dedc8b940eff80e. Existing reference emits status + exactly one answer. No viewport, mobile keyboard, animation or 100% parity certification.

## Remaining integration
CRM/root owns App conversation key including UID to clear private conversation on account changes. Provider billing/IAM/model availability/App Check/live Gemini remain NOT_TESTED. CRM AI authoring, published fee-rate contract, human-support handoff, prompt injection live acceptance and browser parity remain outside this slice. Full master readiness NOT_READY. Durable memory candidates None.

## Source hashes
- `src/features/ask/Ask.tsx` SHA256 `70f18741ee4bc1b95db1daa940852ad2e2d01d7624ec94c0d476da3490418c83`
- `src/features/ask/knowledge.ts` SHA256 `d48860fa7b46565e5f1624e1fd92a4c0cf73317215109d9f8f3be3a7a6ba8308`
- `src/features/ask/transport.ts` SHA256 `1abfe91734517ab5088cdf88ad206c4c8c9385bff2d1241178277bf8461bb628`
- `functions/src/ai/ask.ts` SHA256 `727d16e6690587ecba8091d36c662790e03112604306fdffeae242223a8072a6`
- `packages/domain/ask-stream.ts` SHA256 `9129d441d4a3e925b1a8776f1d78ae57334bc5a0d31c0ae199a0cbf80f9997fd`
- `tests/unit/ask-transport.test.ts` SHA256 `a9997dc6300c29971be027e9f7667062f7c14ad2a12ba6aa1bea88075474c3ec`

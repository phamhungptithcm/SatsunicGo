# Ask scenarios

All cases use synthetic data. No provider payment, production traffic, demo reset, rules replacement or server restart.

| Layer / scenario | Preconditions and steps | Expected | Result |
|---|---|---|---|
| Unit: policy eligibility + exception | Published policy with relevant terms in separate spans; retrieve lexical query | Both spans retained, original evidence preserved, hard bounds respected | PASSED |
| Unit: citation conflict | Same source ID with inconsistent title/body | Ambiguous evidence omitted | PASSED |
| Unit: Unicode/chunk bounds | Paragraphs, long text and emoji crossing boundary | Original contiguous spans and valid UTF-16, at most 1200 chars per span / 20000 per doc | PASSED |
| Unit: malformed stream | Duplicate, oversized, invalid or excessive events | Reject without accepted answer | PASSED |
| Unit: final mismatch/provider error | Stream answer followed by inconsistent final or rejection | No success event published | PASSED |
| Unit: stalled cancellation | Never-settling next() or final promise; abort | Prompt rejection and nonblocking cleanup | PASSED |
| Unit: run guard | Registered read/draft tools; 4 calls; deadline; cancel | Fifth call, unknown tool, cancelled/expired run rejected | PASSED |
| Unit: mutable policy | Change maxCalls/tools after factory; destructure admit | Original policy remains authoritative | PASSED |
| Demo integration: duplicate draft | Concurrent same-operation saveDraft, then resume | One version increment, same recovered result | PASSED |
| Demo integration: stale/tampered | Alter payload under same operationId or submit stale version | Reject; original draft intact; no new operation | PASSED |
| Demo integration: identity | Anonymous/password auth, locked user, mismatched owner | Denied before writes | PASSED |
| Demo integration: privileged chat | refund/verifyTransfer/publish/grantMembership/changeRole | invalid-argument, no conversation created | PASSED |
| Demo integration: corrupt recovery | Completed operation with negative/ahead version or foreign order | failed-precondition; locked recovery denied | PASSED |
| Demo integration: draft → submit → recovery | Save synthetic draft, explicitly submit, resume completed operation | Exactly one owned REQUESTED order; collected remains 0 | PASSED |
| Browser: happy/mobile | Actual Ask component and stream consumer; synthetic provider | Answer only after final validation; no page errors | PASSED |
| Browser: mismatch/failure/retry | Final conflicts or rejects after streamed answer; retry and wait | Error and retry visible; no false answer; draft preserved | PASSED |
| Browser: close | Close panel during provider wait | Panel closes; animation stops; no page errors | PASSED |
| Live provider / deployed callable | Requires separately verified paid admission/active provider and deployment | Real provider identity, usage/cost, App Check, error/recovery | NOT_RUN |

Executed commands:

```sh
npx vitest run tests/unit/ask-*.test.ts tests/unit/demo-environment.test.ts
GCLOUD_PROJECT=demo-satsunicgo FUNCTIONS_EMULATOR=true FIRESTORE_EMULATOR_HOST=127.0.0.1:18207 npx vitest run --config vitest.rules.config.ts tests/rules/ask-platform.test.ts tests/rules/ask-hardening.test.ts
npx playwright test --config tests/browser/ask-platform.config.ts
npx playwright test --config tests/browser/ask109.config.ts
npx tsc --noEmit
npx tsc -p functions/tsconfig.json --noEmit
```

Integration new suite: 10 passing cases. Existing hardening regression: 6 passing cases. Browser new suite: 5 passing cases; composer regression: 8 passing cases. Unit counts and whole-repo failure are in REPORT.md. Rules suites that replace shared emulator rules were not run. New tests clean their own UUID-scoped synthetic records only.

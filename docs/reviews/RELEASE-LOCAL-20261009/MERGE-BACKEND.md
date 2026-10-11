# Backend merge receipt

Scope: normal pending merge of origin/main into local main, using the existing approved release integration plan. Repository intelligence remains DEGRADED; findings were verified against current source. Only the four assigned conflict files were changed. No staging, Git mutation, generated-asset edits, runtime changes, tests, provider calls, configuration activation, or data operations occurred.

| File | Resolution | Frozen SHA256 |
| --- | --- | --- |
| scripts/release/preflight.mjs | Retained upstream centralized trusted triggerConstructors map and its constructor lookup. Retained local declaration tracking, bounded immutable imported options, strict emulator-only conditional recognition and shadow/mutation/escape rejection. | b5e14cb67a27f027f5d1f541ac061f9d7ff11a7bf397590d932bcf7dfed87cb6 |
| tests/unit/release-preflight067.test.ts | Union of local guard regression tests and both upstream actual-analytics/Firestore constructor tests. Static expansion counts 77 cases, with no duplicate test names. | 310f6393bfc9ee6e37229dac8e21cb27898eefda58eff8ae71294a4f73230a1e |
| functions/src/index.ts | Preserved customer-save, research, feedback, purchase and upstream analytics exports. Exact prior-local bytes: 103 named source exports, no duplicate names; purchaseDemoPayment remains the exact guarded emulator conditional and is separately excluded from production inventory. | 60f0e3b406c1046181efa638163c309a01ad9330b4e22748169217f4bd46b167 |
| functions/src/dashboard-analytics.ts | Preserved the existing shared analyticsOptions import. Upstream inline options exactly match the exported const: asia-southeast1, maxInstances 2, concurrency 8 and enforceAppCheck when FUNCTIONS_EMULATOR is not true. Authorization, query and cache logic were not changed. Exact prior-local bytes. | 999bc115d30834c9f53afe4cc45fc1eea18c72d32b32a3974465172dfb4c92ce |

Supporting source: functions/src/analytics-ingest.ts SHA256 859c0ec93ecec836ed5c15ce3c04ad6a99afea7c3c0933d6b9fc9d6959dec318; functions/src/provider-release-gate.ts SHA256 82dc7d98a193f4431ea1fdd9dadab777329501ecaf2a987a47763e53110e7a96. The provider/runtime guard source remains unchanged. The existing eight artifact holds were outside this conflict resolution and were not altered.

Validation: Node22 --check scripts/release/preflight.mjs exited 0. TypeScript AST parse diagnostics were empty for all four assigned files; none contain conflict markers. Source-only AST checks confirmed index export uniqueness, the exact emulator conditional, and 77 static expanded test cases. These checks read source and did not import application runtime modules.

Merged execution evidence: NOT_RUN by this worker. Root retains ownership of the full merged typecheck/lint/unit/release/build and independent review. The prior pre-merge 75 preflight and 71 artifact passing cases are historical evidence, not certification of this merge. Whole-repository inventory and production deployment/readback remain pending root validation; no READY or activation claim is made.

Write lease: RELEASED after this frozen handoff. Memory candidates: None.

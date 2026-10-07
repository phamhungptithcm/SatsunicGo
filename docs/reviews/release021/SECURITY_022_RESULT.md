# Security022 local remediation result —2026-10-05

Decision: **local high advisories removed; production release remains BLOCKED**. No production systems, secrets, provider calls, customer mail or financial actions were used. Owner approval: `docs/approvals/SATSUNICGO-RELEASE-SECURITY-022.md`; source impact: corresponding022 plan. Repository Intelligence was DEGRADED (both healthy but stale); bounded exact manifests/imports/tests were used. Root coordinates one final index refresh after all agents freeze.

## Actual installed change

Genkit and Google GenAI remain1.42.0. Root and standalone Functions overrides pin SDK-node0.222.0, auto-instrumentations0.80.0 with scoped core2.11.0, Jaeger2.11.0, Google monitoring exporter0.22.0 and trace exporter3.1.0. Four explicit Functions2.11.0 peer hosts (core/resources/sdk-metrics/sdk-trace-base) and matching root dev-only hosts preserve Genkit's private1.x telemetry APIs. Global core2.x override was rejected after a real `getEnv` runtime error.

Functions now explicitly declares zod4.6.5, the existing root version. The standalone deployment candidate originally selected Genkit's zod3 transitively and failed to cold-load `membership-reminder-policy`: a refined discriminated-union variant lacked zod3's expected `shape`. After declaring zod4 directly, the same compiled Functions entry point cold-loads **46 exports** in the isolated demo environment; standalone Genkit/Vertex local flow, tracing flush and malformed Jaeger extraction also pass again. All other runtime external imports were inventoried and have direct Functions dependencies; Node built-ins require none.

The npm-generated lock changes138 existing package paths, adds251 and removes219. Most are telemetry upgrades or hoisting of already-existing versions; complete paths are in `SECURITY_022_LOCK_DELTA.json`. Preservation pins retain MCP1.32.0, acorn8.18.0, nanoid3.3.19, postcss8.5.28, emnapi-runtime1.11.3 and both existing lightningcss versions1.32.0/1.33.0. Extra emnapi1.11.1 metadata is bundled inside the unchanged optional wasm32 Tailwind oxide4.3.3 artifact with identical integrity; it is not a changed artifact or an executable Mac dependency. New lexer/hooks/types/Google API versions belong to the approved telemetry tree. Range-scoped UUID<11.1.1→11.1.1 preserves existinguuid14.0.2 and CJS callers; new residual details are in `SECURITY_022_RESIDUAL.md`. No root application/tool version or business contract changed.

## Verification and loop

| Cycle | Observed result | Correction / remaining state |
|---|---|---|
|1|Original runtime audit57:6high,51moderate|Verify vendor patches in isolated candidate|
|2|Global core2 override failed `getEnv` cold import|Reject global override; retain private1.x APIs and explicit2.x peer hosts|
|3|Shared install/update silently retained old workspace transitive versions; two new regressions correctly failed|Generate fresh lock with exact baseline preservation; install via `npm ci`|
|4|Actual patched install passes both crash regressions; standalone entry point failed zod3 union|Declare the existing zod4 version in Functions; repeat standalone import|
|5|Standalone `npm ls --all` EXIT0;46-export cold-load PASS; workspace5 focused tests PASS; Node22 typecheck/Functions compile PASS|Pre-UUID runtime audit19moderate,0high,0critical|
|6|Bounded UUID11.1.1 override; malformedbuffer regression,6installedtests,Node22compile and offline CLI15.32.1 version PASS|Current workspace and standalone audit13moderate,0high,0critical;46-export standalonecoldload/npm ls PASS; active patched Baggagecap180 verified|

Focused tests use the installed libraries, not a mocked safe implementation: malformed Jaeger trace and baggage percent encodings do not throw; a real ephemeral loopback HTTP server runs the patched Prometheus request handler, returns400 for `GET http://`, and subsequently returns404 while alive. Genkit initializes the actual Vertex plugin and invokes a local typed flow with tracing flush, without calling a model or cloud collector. Existing safe-configuration guard and default W3C tracer regression remain. Tests: `tests/unit/telemetry-policy.test.ts`, `tests/unit/telemetry-compatibility.test.ts` (6 tests passed).

Workspace `npm ls --all` **does not pass**: npm11 reports the five explicitly overridden upstream dependency families (SDK-node, auto-instrumentations, Google telemetry exporters, and legacyuuid) as invalid and reports unsupported optional Sharp/wasm packages extraneous. It reports no core/resource peer mismatch. Actual installed versions, executable regressions, audit and standalone `npm ls` are separately verified; these do not turn the workspace diagnostic into a PASS. The observed ignored update/invalid reporting is consistent with the official [npm workspace override issue9514](https://github.com/npm/cli/issues/9514). Future workspace install/update must repeat version and crash checks: an unverified install can silently restore vulnerable upstream versions. Do not suppress or hide the diagnostic.

Raw current audits are `SECURITY_022_WORKSPACE_AUDIT.json` and `SECURITY_022_STANDALONE_AUDIT.json`. Baseline57 entries came from the fresh root audit before022. Source hashes are in `SECURITY_022_SOURCE_HASHES.json`; root owns the final combined regression suite and full candidate manifest.

## Review and release limitations

Requirement/compatibility/failure cleanup: focused local evidence passes. High dependency crash paths are patched, and the telemetry guard remains fail-closed. Security and production readiness remain **BLOCKED** by13 moderate package entries, workspace install/update integrity diagnostic and unverified production configuration/provider acceptance. Moderate Genkit-private1.x core/resources/SDKs and its Google transitives remain visible; no owner residual-risk acceptance or zero-vulnerability claim is inferred. Cloud monitoring exporters are deprecated upstream, but this change preserves architecture and does not activate them.

No product copy, routes, invoice/payment state machine, authorization or database schema changed; product-content gate and business diagrams require no022 changes. Root must still review all parallel UI behavior and combined tests. No deploy, independent final approval, production READY or release acceptance is claimed. Token usage/cost unavailable; memory candidates: None.

Vendor fixes verified from [Jaeger advisory](https://github.com/open-telemetry/opentelemetry-js/security/advisories/GHSA-45rx-2jwx-cxfr) and [Prometheus advisory](https://github.com/open-telemetry/opentelemetry-js/security/advisories/GHSA-q7rr-3cgh-j5r3).

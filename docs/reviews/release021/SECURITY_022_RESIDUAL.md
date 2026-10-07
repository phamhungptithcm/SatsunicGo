# Security022 residual assessment —2026-10-05

Decision: **13 moderate runtime package entries remain OPEN; no owner risk acceptance inferred**. Assessment and prototype used isolated local files/demo configuration; no provider, production or customer actions. Repository Intelligence: DEGRADED, both healthy indexes stale; bounded manifests, exact installed bindings and executable local evidence used. Root owns the final index refresh and combined review.

## Two original advisory families; one remains after the bounded UUID fix

The pre-UUID19 entries were propagation of two direct advisories through package parents, not19 distinct vulnerabilities. The final installed workspace and exact standalone Functions audit has13 moderate entries,0high,0critical. Every remaining entry traces to [GHSA-8988-4f7v-96qf](https://github.com/open-telemetry/opentelemetry-js/security/advisories/GHSA-8988-4f7v-96qf). No entry was excluded or suppressed.

Remaining entries: `@genkit-ai/ai`, `@genkit-ai/core`, `@genkit-ai/firebase`, `@genkit-ai/google-cloud`, `@genkit-ai/google-genai`, `@google-cloud/opentelemetry-resource-util`, `@opentelemetry/core`, `@opentelemetry/instrumentation-pino`, `@opentelemetry/resources`, `@opentelemetry/sdk-logs`, `@opentelemetry/sdk-metrics`, `@opentelemetry/sdk-trace-base`, `genkit`. Raw audits remain in the adjacent workspace/standalone JSON files.

## Actual Baggage binding and limits

Genkit1.42 imports legacy core1.25.1 for exporter helpers and creates its telemetry provider through the patched NodeSDK0.222.0. That NodeSDK's own core binding is2.11.0; its `utils.js` registers the W3C Baggage propagator from that patched core. The application does not register a custom propagator. Targeted source reads of Genkit core/Google Cloud/Firebase, Firebase Admin/Functions, SDK-logs and instrumentation-pino found no registration of their legacy W3C Baggage class; Pino's active global propagation remains separate from its utility core binding. Existing guards retain W3C configuration and reject unsupported preload/exporter settings.

Executable isolated proof initialized a real Genkit typed local flow, triggering actual default telemetry initialization, then compared the active global API against a direct instance of the legacy class:

| Synthetic carrier | Active patched global propagator | Direct legacy class |
|---|---|---|
|1,000 entries /9,779bytes|180entries;1,580 serializedbytes|1,000entries|
|One entry /5,006bytes|0entries|1entry|
|180 entries /18,969bytes|78entries;8,180 serializedbytes|180entries|

This proves the active local registration applies limits; it also proves the legacy class still lacks them. The final carrier used direct extraction to test the propagator itself, not acceptance through an HTTP server. No production registration/configuration was inspected.

Node22 reports `http.maxHeaderSize=16384` locally. The vendor explains that the default16KB total HTTP-header bound mitigates ordinary inbound HTTP exposure, while raised limits or custom/non-HTTP transports increase risk. The vendor patch limits total baggage to8,192bytes,180entries and4,096bytes per entry. This evidence does **not** establish cloud gateway/process configuration or protect arbitrary future custom registrations.

Concrete production evidence still needed: exact Node22 process/header limit and preload/telemetry settings, absence of custom legacy propagation in deployed handlers/instrumentation, and candidate/config readback. Request references/presence/effective values through authorized operational tooling; no secrets in chat. Preserve fail-closed guards and do not raise ingress limits to bypass errors.

## UUID root cause fixed within the approved family

[GHSA-w5hq-g745-h8pq](https://github.com/uuidjs/uuid/security/advisories/GHSA-w5hq-g745-h8pq) concerns caller-provided output buffers in v3/v5/v6. SatsunicGo business IDs use Node `randomUUID`; installed Genkit compiled session/evaluator paths use native crypto. Its unused UUID9/10 dependencies still contributed audit entries. Observed Google Gax, Gaxios and Teeny Request call v4 without caller-provided buffers; no v3/v5/v6 buffer path was found in the bounded consumers.

Root and Functions now pin only `uuid@<11.1.1` to11.1.1. This retains CommonJS consumption and leaves analytics UUID14.0.2 unchanged. The generated lock changes the root UUID9.0.1 path to11.1.1, removes two private Genkit/AI UUID10 copies, and restores metadata for an already-existing Google logging-utils1.2.0 hoisted package. Every other existing package's complete lock metadata matches the preceding verified candidate; no unrelated version changed.

Verified on the actual shared install: malformed v5-buffer writes throw `RangeError`; v4 still produces standard version4 strings; six installed UUID/telemetry regressions PASS; Node22 typecheck/Functions compile PASS. Offline Firebase CLI15.32.1 `--version` PASS with owned temporary configuration/CI; the initial personal-config write attempt failed and was not used as success evidence. Exact standalone install: `npm ls --all` EXIT0,46-export current cold-load PASS, Genkit/Vertex local flow and tracing flush PASS, audit13moderate0high0critical. No model was called.

## Boundaries and proposed next action

No safe dependency-only replacement for all Genkit-private1.x core paths was demonstrated. A global core2.x replacement was already rejected by an executable `getEnv` API failure. Genkit's Google telemetry implementation also constructs the1.x `Resource` class. Removing all legacy SDK/core resources would require an upstream compatible release/backport or a separately designed vendor migration; do not mask these failures or activate a broken optional monitoring path to obtain a zero audit.

Retain the measured active patched propagator and ingress-bound evidence, keep raw13 entries visible, and obtain an explicit evidence-bound owner risk decision or an upstream-compatible remediation. Local findings are not automatic production acceptance. Workspace npm11 still reports overridden upstream ranges invalid and optional unsupported Sharp/wasm packages extraneous; the official npm workspace-override issue9514 and standalone validation explain the observed diagnostic without converting it to PASS. Future installs/updates must verify exact patched versions and rerun regressions because the tool can silently restore upstream vulnerable ranges.

Source hashes and full generated lock delta are maintained alongside this file. Product copy, business diagrams, money/auth contracts and database schemas were unchanged by this residual fix; no content/diagram modification is needed. Final production review remains BLOCKED; token usage/cost unavailable; memory candidates: None.

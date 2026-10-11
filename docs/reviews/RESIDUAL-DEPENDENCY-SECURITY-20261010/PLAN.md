# Residual dependency security delta — v1 — PENDING APPROVAL

Candidate: `88150fd6c0e689a2f07290e46554e9d2cd48e670`, branch `hunpeolabs/tracking-release-final-20261010`, draft PR #6. No deploy, merge, release tag, shared-runtime restart/reset, live provider calls, IAM/secret/TTL or business-data changes.

## Verified problem and impact

Current full audit: 2 low, 15 moderate, 0 high/critical. The two roots are KaTeX prototype-pollution trust bypass (GHSA-238p-pmpm-9mq7; patched 0.18.2) and OpenTelemetry core unbounded baggage extraction (GHSA-8988-4f7v-96qf; patched >=2.8.0). The 17 entries include inherited dependency findings, not 17 independent vulnerabilities.

Unlike the previous Firebase watcher/FTP plan, this changes production Functions dependencies. Genkit 1.42.0 is still the latest published version checked today and pins telemetry 1.x. Current nested SDK 1.x invokes core.getEnv/getEnvWithoutDefaults, removed in core 2.x. Genkit Google Cloud constructs Resource and merges GcpDetectorSync.detect(), while resources 2.x removes that constructor and expects getRawAttributes() in merge. A global core override alone is unsafe. Do not remove telemetry, omit packages from audit, rename vulnerable code or suppress advisories.

Current app callers: functions/src/ai/ask.ts initializes genkit with the Vertex plugin; it does not directly import OpenTelemetry or enable Google Cloud telemetry. Google Cloud telemetry is nevertheless installed through Genkit's optional Firebase dependency; preserve its usable initialization/export boundary too. Mermaid strict rendering is used by content/studio/source-mermaid.tsx and MermaidDiagram.tsx; retain securityLevel strict, sanitizer, output and failure behavior.

Intelligence: DEGRADED; CodeGraph/CocoIndex indexes missing. Bounded manifests, lock, callers, telemetry vendor APIs, artifact source, compatibility tests and upstream advisories inspected. No READY index claim.

## Proposed implementation and exact paths

1. `package.json`: pin KaTeX 0.18.2; align telemetry core/resources/context-async-hooks/sdk-metrics/sdk-trace-base to 2.11.0, sdk-node/sdk-logs/api-logs/instrumentation to 0.222.0, pino instrumentation 0.68.0, Winston instrumentation 0.66.0 and Google resource-util 3.1.0. Preserve existing Firebase CLI/watcher/FTP pins and all other direct versions. Prefer only overrides necessary to remove vulnerable versions; verify each resulting consumer.
2. `functions/vendor/otel-resources-compat/package.json` and `index.cjs` (new): small, explicit production adapter scoped ONLY to @genkit-ai/google-cloud's resources import. Delegate to official resources 2.11.0. Add legacy Resource(attributes) construction and normalize detector ResourceDetectionResult to resourceFromAttributes before merge, preserving async detection and attribute precedence. Re-export modern APIs. Do not copy vulnerable telemetry code or install an older core. Verify whether any observed consumer needs additional legacy methods; material expansion requires a new delta.
3. Root and `functions/package.json`: declare adapter as production local-file dependency with portable root/workspace paths; scoped Google Cloud override references that dependency. Functions standalone overrides must resolve the same tested graph.
4. `package-lock.json` and `functions/package-lock.json`: regenerate from source manifests using npm, never hand-edit generated entries. Preserve unrelated locked versions; compare dependency graph explicitly. Validate clean Node22/npm10 (CI) and npm11 installs. An install over old node_modules is insufficient: a temporary trial retained nested affected packages despite updated overrides.
5. `scripts/release/artifact.mjs`: include the adapter source in precompiled standalone Functions package, normalize its local paths inside the artifact and preserve source-lock version/integrity checks. No CI workflow/deploy policy changes. No dependency may resolve outside the downloaded artifact.
6. `tests/unit/telemetry-compatibility.test.ts`, new `tests/unit/residual-dependency-security.test.ts`, `tests/unit/release108.test.mjs`: meaningful security/API/packaging regressions described below. No customer UI/text/business schema/API edits.
7. `docs/reviews/RESIDUAL-DEPENDENCY-SECURITY-20261010/`: approval, intelligence, tests/audits, graph comparison, review cycles, exact commit/run/artifact evidence and completion report.

## Validation required before completion

- Full and production audit: 0 low/moderate/high/critical, without omission/allowlist. Inspect every remaining duplicate telemetry core and every consumer requiring a removed API; no audit-only success claim.
- Baggage: valid context/metadata round trip, malformed headers, oversized header/entry/count bounds with bounded time/memory, preserved W3C trace context.
- Genkit/Vertex: local flow success, thrown error, invalid input, trace and log processor delivery, bounded flush/shutdown, exporter failure/timeout; telemetry disabled and enabled using in-memory exporters, never cloud credentials/model/provider calls. Constructor/detector merge with async attributes, precedence, empty and detector failure cases. Ensure cleanup, no unhandled rejection or process hang.
- KaTeX/Mermaid: normal text/math render and unsupported math, hostile trust commands/prototype-pollution regression, sanitized SVG and unchanged strict behavior. Existing content preview regression suites. Keep customer copy and approved tracking UI unchanged.
- Firebase watcher/FTP compatibility tests from previous fix, Firebase CLI load/version, full unit/static/lint/release/public-config checks and production frontend/Functions builds.
- Existing shared emulator regression against unique disposable demo project IDs: CRM → Account/Ask, guest privacy/ownership, ETA, retry/idempotency and failure paths. Preserve 5207 and shared data. Existing CI executes all emulator groups, HTTP and restore.
- Push only approved candidate branch, rerun existing quality CI and candidate artifact workflow at exact final SHA, verify both successful. Download immutable artifact, verify checksum/manifest/source SHA/Function inventory/held exports, clean standalone npm ci and audit/Genkit compatibility from inside artifact with candidate checkout unavailable. No deploy.
- Apply final-implementation-review after actual implementation; review → fix scoped bugs → rerun → fresh review. Distinguish self-review from user GitHub review. Human release review and hosted acceptance remain separate gates.

## Prototype evidence and limitations

Disposable path `/private/tmp/tracking-residual-proposal` only; candidate implementation unchanged. Initial install over the old lock/modules removed KaTeX lows and PubSub inherited findings but retained 13 moderate entries; offline Genkit/Vertex flow succeeded. This does NOT verify the fully aligned clean graph or adapter. Clean resolution then removed every advisory (0 total) and the offline Genkit/Vertex flow passed. However, the installed Google Cloud telemetry constructor reproducibly failed with `TypeError import_resources.Resource is not a constructor` (detector mocked locally to avoid network). This proves that audit zero alone is insufficient and that the scoped compatibility bridge is necessary. The clean experiment is not the approved candidate and its unrelated resolver drift is not accepted. No emulator/CI/new artifact rerun yet because no approved candidate change exists.

## Risk, alternatives, rollback

HIGH compatibility/supply-chain risk: production transitive major API alignment and portable artifact packaging. Prefer supported upstream packages; waiting for Genkit upstream is an alternative but leaves current advisories. Reject npm audit --force CLI downgrade and blind overrides. Adapter is a narrow temporary bridge; remove when Genkit consumes resources 2.x natively. Abort acceptance if telemetry delivery or artifact portability cannot be demonstrated; do not mask defects. Roll back only this delta to 88150fd6, retaining the completed high-remediation and tracking work. No production rollback needed because deployment is excluded.

## Approval required

`.ai/workflows/plan-existing-system-change.md` step 15: “Stop and request developer-team approval.” `.ai/guards/implementation-approval-gate.yaml` flags new dependencies, additional modules, higher-risk paths and material scope deviation. Previous approved plan explicitly excluded production SDK changes. Request approval for this v1 delta including production telemetry adapter and artifact packaging; no deploy.

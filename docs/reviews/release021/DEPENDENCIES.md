# Dependency assessment021

Sharp source image intake decoder moved from0.34.5 to exact0.35.5; functionsNode22 compatible. Decode/resize metadata stripping and disguised SVG regression passed. Upstream release: https://github.com/lovell/sharp/releases/tag/v0.35.5.

Current audit57affectedentries:6high51moderate0critical. Residual paths include Genkit/Google AI/cloud and older OpenTelemetry transitives; current Genkit1.42.0 metadata offered no simple patched direct upgrade. No forced major transitive override/provider redesign was applied. Inspect dependency-audit.json as original baseline, current npm audit retained in temporary evidence; baseline58/7high is not current result.

Reachability notes are hypotheses: no production source call enablingGoogleCloudTelemetry found and inspected default SDK setup did not auto-install Prometheus exporter. This does not prove transitive vulnerabilities unreachable in every deployment. Prometheus exporter malformed URI denial-of-service advisory https://github.com/advisories/GHSA-q7rr-3cgh-j5r3; Jaeger propagator advisory https://github.com/advisories/GHSA-45rx-2jwx-cxfr. Release risk remains **BLOCKED** pending evidence-backed mitigation or reviewed remediation plan. No high finding was hidden by suppressing npm audit.


Continuation: actual installed tracer default W3C propagators reject no malformed Jaeger header because Jaeger is not selected; test passed. Prometheus exporter is absent from installed dependencies. New fail-closed telemetry environment policy allows only W3C propagators, none/OTLP/console metrics and rejects auto-instrumentation preload before Ask runtime telemetry initialization. Two regression tests passed. This limits opt-in exposure; it does not patch the affected packages or establish production configuration. Raw audit remains57entries/6high/51moderate/0critical. Production security gate stays blocked until current deployed configuration and reviewed risk/remediation are accepted.

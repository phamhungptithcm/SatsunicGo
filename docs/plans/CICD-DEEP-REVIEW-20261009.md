# Open Code Review CI integration plan

Status: APPROVED for implementation by direct user message: “Dùng Gemini API free tier đi, setup Open Code Review vào CI/CD giúp tôi, hướng dẫn thêm API key vào GitHub Secrets.” Approval task reference: current conversation, 2026-10-09. Provider Google Gemini free tier; pinned model gemini-3.8-flash based on current official free-tier/API documentation. User requested integration of https://open-codereview.ai/docs/cicd; URL returned404. Authoritative upstream README/action.yml inspected 2026-10-09. Existing release setup approval does not identify a new LLM endpoint or authorize secrets provisioning for one.

Evidence: current local HEAD0d6e721698608eebb36b0b2f68021c3054d97d1c. ci.yml runs quality gates; release.yml quality -> immutable build -> production deploy/readback. Both indexes healthy but stale: DEGRADED, bounded direct-source inspection. Concurrent application/release-helper WIP preserved.

Impact: add one isolated review job with contents:read, no production environment, WIF or deployment secrets. Source code/context leaves GitHub runner for the selected LLM endpoint. Additional latency and model API cost; exact cost unavailable until model/budget chosen. AI review complements existing tests and human review.

Implementation boundary:
- .github/workflows/deep-review.yml: reusable pinned-tool review job for exact Git SHA/range. Same-repository PRs and main pushes; no pull_request_target or fork secrets. Explicit missing configuration failure for required main release review. Fork behavior explicitly reported, never presented as successful deep review.
- .github/workflows/ci.yml: invoke reusable review for PR/dispatch, preserve existing quality job.
- .github/workflows/release.yml: require deep-review and quality success before build; reuse original immutable artifact/recovery/deploy/readback flow.
- scripts/review/: trusted launcher, validate endpoint/protocol/model configuration, pinned CLI distribution with checksum, bounded concurrency/time/token budget, JSON coverage/severity validator. Treat timeout, missing/malformed results, failed/skipped files and exhausted budget as failure even if CLI exits0. Findings HIGH/CRITICAL block; lower severities retained in report. Exact upstream output schema and severity mapping must be verified against pinned source before implementing parser.
- tests/unit/: meaningful failure-path fixtures for malformed output, incomplete coverage, budget exhaustion, severity thresholds, range identity and configuration errors; workflow assertions ensure build cannot bypass review.
- docs/releases/: setup/runbook, secrets names, privacy/budget controls, finding triage and rollback.

Use GitHub secret OCR_LLM_TOKEN plus variables OCR_LLM_URL/OCR_LLM_MODEL/OCR_LLM_PROTOCOL after user chooses the provider. Never print/read secret payloads or commit credentials. Do not invent a provider/model or reuse unrelated credentials. No automatic PR comments in initial scope; job summary and retained report artifacts suffice. Avoid upstream action default raw stderr/result printing and latest package installation.

Validation: focused parser/config tests, lint/typecheck, workflow validation; real review on isolated candidate branch and API connectivity using configured secret; verify complete reviewed file/range identities and rejection cases. Final mandatory review and exact-SHA main/release verification after activation. No successful live-review claim until real provider run passes.

Open decision: approved LLM provider/endpoint/model and credentials provisioning through GitHub Secrets. Recommended policy HIGH/CRITICAL findings and incomplete/error review block build; finite budget and timeout.

Memory candidates: None. Token usage/actual billed cost Unavailable.

Implementation clarification: GEMINI_API_KEY repository secret; Google endpoint fixed in trusted launcher. Gemini run cannot be verified until owner provisions key. No API key value accessed or fabricated.

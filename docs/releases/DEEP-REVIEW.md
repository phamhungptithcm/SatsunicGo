# Optional Gemini free-tier code review

AI review is advisory and **disabled by default**. It is a standalone workflow and is not a dependency of CI quality, release build, or deployment. AI errors, quota exhaustion, missing credentials and findings do not block production release. Mandatory tests/typecheck/lint/audit and immutable artifact/provider checks remain unchanged.

To run once: Actions → **Optional AI code review** → Run workflow. To enable automatic review on internal PRs/main pushes: Settings → Secrets and variables → Actions → Variables → create repository variable **AI_REVIEW_ENABLED=true**. Delete it or set false to disable. Do not configure the advisory AI job as a required branch-protection check.


Open Code Review v1.12.13 runs with `gemini-3.8-flash` through Google's OpenAI-compatible endpoint. The Linux binary is pinned by SHA-256. No paid fallback is configured. Free-tier eligibility and quota belong to the Google project; the workflow cannot turn a billed project into a free project.

## Add the API key

1. Open https://aistudio.google.com/api-keys and create/select a dedicated project eligible for the Gemini API free tier. Keep Cloud Billing unlinked if your goal is no paid API usage; confirm its tier and model limits in AI Studio. Do not use the production Firebase project's credentials.
2. Generate an API key for that project. Where available, restrict it to the Generative Language API. GitHub-hosted runners do not have one stable outbound IP.
3. Open https://github.com/phamhungptithcm/SatsunicGo/settings/secrets/actions . Choose **New repository secret**.
4. Name: **GEMINI_API_KEY**. Paste the key into the secret value, save, and never commit it or paste it into chat. Use a repository secret, not a production-environment secret: review runs without production access.
5. Open **Actions → Optional AI code review → Run workflow**, select the integration branch/main, and run. The manual AI workflow never deploys production.

Optional CLI alternative (interactive prompt; do not put the key in command history):

```sh
gh secret set GEMINI_API_KEY --repo phamhungptithcm/SatsunicGo
```

## Gates and evidence

- Internal PRs review merge-base → exact PR head. Main pushes and manual dispatch review the latest published, provider-verified production release → exact candidate head. Failed earlier pushes cannot remove unreviewed changes from this range. Missing/non-ancestor baseline blocks the review.
- `deep-review.yml` runs independently from `ci.yml` and `release.yml`. Missing key, quota/429, timeout, malformed output, unexpected warnings, budget exhaustion, missing/waived/failed coverage or High/Critical findings mark the AI report BLOCKED, while the advisory job uses continue-on-error. They do not block build/deploy.
- External fork PRs fail with an explicit NOT_RUN message, without receiving a secret. Maintainers must bring reviewed code to a trusted branch. The PR's integration scripts are read from its base commit; the target is a separate checkout and is never installed/executed.
- Review runs with read-only repository permissions, no production environment, no WIF and no deployment credentials. An isolated HOME prevents loading local credentials/MCP configuration. Repository OCR rule overrides are rejected pending explicit trusted integration.
- Trusted include rules also include tests. The preview artifact lists any paths the CLI cannot review (for example binary/deleted files); CLI-selected coverage must be complete. AI review is not binary-content validation, dependency auditing or business acceptance.
- Concurrency is 1, per-request timeout 120 seconds, per-task timeout 10 minutes, overall command timeout 20 minutes, job timeout 25 minutes. Aggregate token budget is 200,000; this is a soft CLI cap that can overshoot in its final round, not a billing guarantee. Runs serialize within this repository; separate workflows/other applications may still share the provider quota.
- JSON preview/result artifacts are retained for 14 days. They may contain source excerpts/findings; restrict repository artifact access. Raw provider stderr/session traces are not uploaded or printed. Medium/Low findings remain visible in the report and require triage.

## Failure handling

For missing key, add the secret and rerun. For 429/quota, wait for reset and rerun; do not switch to a billed key automatically. For High/Critical findings, inspect the artifact, fix the issue and push a new commit. For incomplete coverage, investigate scope/budget/provider errors; do not label the result PASS. An AI false positive requires documented maintainer assessment and a reviewed policy change; no automatic suppression is provided.

GitHub concurrency keeps at most one running and one pending job in a group, so bursts may cancel an older pending review. Cancelled reviews remain incomplete advisory evidence; rerun the current candidate as needed. Existing release superseded-SHA guards remain active.

## Privacy and readiness

The user selected Gemini free tier for this integration. Google documents that unpaid-service inputs/outputs may be used to improve products; do not submit secrets, production records or private customer data. Source context is sent to Google. See https://ai.google.dev/gemini-api/terms and https://ai.google.dev/gemini-api/docs/pricing .

Local parser/workflow/preview validation does not prove a live Gemini review. Until a real exact-SHA GitHub run completes with the configured secret, status is **PREPARED — LIVE REVIEW NOT_VERIFIED**. The owner explicitly requested optional AI review; use the opt-in variable or manual trigger without changing mandatory release checks.

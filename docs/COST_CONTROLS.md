# Cost controls — planning reference, not project billing evidence

Region in source: asia-southeast1. Billing/Blaze eligibility, project quotas and actual costs have not been inspected or changed. Provider model is configurable and requires enabled + approved settings; no model is enabled by this document.

Application AI admission limits: 500/day globally, 20/global minute, 4/session minute, two instances, concurrency four, bounded context/tool turns, output settings and timeout. These reduce application usage; they are not a guaranteed cloud bill cap. Payment functions have separate limits so disabling AI need not disable money verification.

Current reference Gemini 2.5 Flash standard text input $0.30/million tokens and text output (including reasoning) $2.50/million tokens: [official model pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing). Model/region availability and exact billed token semantics must be verified before selection; [official model specification](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/2-5-flash).

| Illustrative volume | AI requests/month | Assumed 4 turns × 6,000 input and 800 output tokens/request | Model estimate |
| --- | --- | --- | --- |
| Low: 100 orders | 1,000 | 24M input / 3.2M output | USD 15.20 |
| Base: 1,000 orders | 10,000 | 240M input / 32M output | USD 152.00 |
| High: 10,000 orders | 15,000 | 360M input / 48M output | USD 228.00 |

These are hypothetical traffic assumptions, not observed usage or guaranteed bounds. Reasoning/additional context, retries, pricing tier, grounding, taxes and exchange rate can change actual cost. AI request volume is independent of order count. Complete platform estimates require measured Firestore reads/writes/indexes, Storage operations/egress/retention, Functions CPU/memory/duration/network, Hosting bandwidth and SMTP plan, at the chosen regions/SKUs. Those measurements and provider selections are unavailable; no fabricated total is supplied. Use [Firebase pricing](https://firebase.google.com/pricing) and matching second-generation Cloud Run SKUs before approving a budget.

Budget alerts and spend caps are separate settings. Current Google Cloud supports eligible per-project, per-service monthly spend caps for Gemini API, Agent Platform, Cloud Run and Cloud Run functions. They block new eligible usage after estimated spend reaches the threshold; in-flight/persistent work and reporting latency can still incur costs. This is not a general whole-project hard cap. [Official spend-cap limitations](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps). No cap/alert has been created or eligibility confirmed in satsunicgo. Owner-authorized billing setup must specify service, thresholds, alerts, cap eligibility and recovery procedure.

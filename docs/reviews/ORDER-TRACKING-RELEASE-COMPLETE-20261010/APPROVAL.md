# CI approval — v2.1

Approver: human repository owner, current chat 2026-10-10.
Evidence: user replied “Duyệt workflow CI/artifact, chưa deploy” to concrete CI-DELTA-PLAN.md and proposed workflow. Human reviewer: user replied “Toi se review”.
Approved: workflow only for CI and candidate artifact, branch push/draft PR necessary for CI/review; no deploy, main merge, tag, release publication, secret access or production mutations.
Implementation detail: enable same-repository tracking-prefix pull_request bootstrap alongside manual dispatch because GitHub requires dispatch workflows on default branch. Checkout and artifact use exact PR head SHA, not merge SHA. No expanded permissions or deploy capability.

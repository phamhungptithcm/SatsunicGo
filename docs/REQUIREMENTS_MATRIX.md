# Requirements matrix

Plan SATSUNICGO-001 v1 is approved for local implementation. Current source identity: reviews/CANDIDATE_HASHES.json. PARTIAL is a tracking status, not an acceptance result. Executed evidence uses PASS/FAIL/BLOCKED_EXTERNAL/NOT_RUN; no group is certified complete.

| ID | Master sections | Requirement | Current implementation | Evidence and remaining work | Status |
| --- | --- | --- | --- | --- | --- |
| A01 | 3,4,19 | Workspace, shells, reproducible tooling | React/Vite, Node22, pinned CLI, lazy staff chunks, CI source | Compiler/lint/build PASS; clean CI and rendered shell NOT_RUN | PARTIAL |
| A02 | 5,16 | Google auth, MFA, isolation | Popup/redirect/One Tap, TOTP UI, current rights, Web app registered | Rules/HTTP fixtures PASS; live OAuth/MFA/App Check NOT_RUN | PARTIAL |
| B01 | 6 | Requests and quote snapshots | Multi-line/condition/preferences, durable retries, versioned quotes/acceptance | Domain/handler checks PASS; private request photos and full acceptance incomplete | PARTIAL |
| B02 | 7 | Integer money, FX and balances | Rational FX, deposit, membership service-fee discount, final approvals | Unit/handler checks PASS; complete commercial fee policy unapproved | PARTIAL |
| B03 | 8 | Transfers, payOS, refunds and reconciliation | Atomic pending review confirmation, immutable entries, SDK signature/readback | Fixture HMAC/context checks PASS; live callbacks and full exception/refund/reversal queues incomplete | PARTIAL |
| B04 | 9 | Lifecycle, changes and holds | Version/idempotency, line substitution/cancel/return proposals, customer approval | Change/concurrency tests PASS; post-delivery physical return/inspection incomplete | PARTIAL |
| B05 | 10 | Purchase, receipt, packing, consolidation | Per-line quantities, private parcels, conserved batch freight, guarded dispatch | Domain/handler tests PASS; complete warehouse/browser acceptance incomplete | PARTIAL |
| B06 | 11 | Manual and partial tracking | Private customer shipments, per-parcel tracking, no premature order completion | Handler tests PASS; full carrier/failed-delivery/return acceptance incomplete | PARTIAL |
| C01 | 12 | Membership and business tools | Plan editor/invoices/confirm/history/expiry, CSV, reorder/export | Unit/handler checks PASS; full renewal/expiry and rendered workflows incomplete | PARTIAL |
| C02 | 13 | CRM, dashboard and support | Notes/tags/follow-up, bounded UTC dashboard, private support threads | Privacy/handler checks PASS; overdue follow-up and exhaustive assignment/UI acceptance incomplete | PARTIAL |
| D01 | 13 | CMS, campaign, media and SEO | Versions/scheduled publish, SEO/variants, rights-confirmed media, manual campaign captions | HTML/metadata/draft denial and media checks PASS; full publish/consent/campaign workflow acceptance incomplete | PARTIAL |
| D02 | 14 | Ask parity and authorized AI | Reference motion port, safe links, reviewed drafts, approved-model/quota gating | Source/unit only; browser 100% parity BLOCKED_EXTERNAL; live AI/streaming and injection acceptance incomplete | PARTIAL |
| D03 | 17 | Notification/email, retention and recovery | Outbox/SMTP, approved technical cleanup, fixture Firestore+Storage restore | Job fixtures/restore PASS; all event coverage, SMTP, dead-letter UI and production DR incomplete | PARTIAL |
| E01 | 15,16,18 | Full security/acceptance coverage | Default-deny Rules, current-role transaction guards, 29 unit/23 Rules tests, HTTP suite | Bounded checks PASS; 12 complete scenarios NOT_RUN; 6 high advisories open | PARTIAL |
| E02 | 19,20 | Release, docs and readiness | Required docs, hashes, CI source, rollout/rollback limitations | Review BLOCKED; no staging/deploy/rollback/production smoke | PARTIAL |

All detailed master requirements and all twelve acceptance scenarios remain binding. Source gaps must be implemented independently of external credentials; provider absence does not excuse those gaps. No weighted completion percentage is available from runtime ledgers.

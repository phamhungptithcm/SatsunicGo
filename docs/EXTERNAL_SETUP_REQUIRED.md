# External setup required

Completed scoped action: Firebase WEB app SatsunicGo registered in satsunicgo, app ID 1:278913913091:web:e40355cd8ad5abe00f9936; public SDK config stored only in ignored .env.local.

| Gate | Required decision/configuration | Current state |
| --- | --- | --- |
| Google auth | Authorized provider, support identity, origins/domains, One Tap client ID | BLOCKED_EXTERNAL; registration alone does not enable login |
| Identity / access | TOTP/Identity Platform availability, separately authorized first OWNER identity and least-privilege bootstrap | BLOCKED_EXTERNAL |
| App Check | Provider/site registration, debug/staging strategy, enforced production rollout | BLOCKED_EXTERNAL |
| payOS | Merchant beneficiary, return origins, Secret Manager credentials, verified sandbox/live scope | BLOCKED_EXTERNAL |
| Gemini | Supported model/region, IAM, approved quota/cost settings; resolve dependency blockers before enabling | BLOCKED_EXTERNAL |
| SMTP | Approved sender/provider, verified recipient test, secret/config and reconciliation procedure | BLOCKED_EXTERNAL |
| Commercial/privacy | Rates, fee coverage, routes/restricted goods, refund terms, membership, consent and retention | BLOCKED_EXTERNAL |
| Release | Separate staging, protected deploy identity, monitoring, backups/restore/rollback and explicit release authorization | BLOCKED_EXTERNAL |
| Browser | Approved access to current local candidate for interaction/motion/viewport evidence | BLOCKED_EXTERNAL |

Never paste secrets into chat. Complete safe code/contract checks independently; no fake provider success or production fixture seeding. Each external action needs its own concrete authorized scope. Source gaps are tracked separately in REQUIREMENTS_MATRIX.md and are not excused by provider absence.

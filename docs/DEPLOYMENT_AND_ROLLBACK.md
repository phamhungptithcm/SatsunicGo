# Deployment and rollback — NOT_RUN

Production target identity supplied: satsunicgo. Registered Web app receipt is approvals/SATSUNICGO-WEB-APP-001.md. Registration is the only authorized cloud mutation performed. No deployment, IAM/billing change, secret setup, owner bootstrap or push occurred.

CI source pins official checkout/setup-node/setup-java revisions and runs clean install, Node 22 checks, emulator suites, build and fail-closed high-level runtime audit. GitHub execution is NOT_RUN. A protected environment, short-lived deployment identity and verified dev/staging separation must precede deployment.

Release candidate: no Git commit; source hashes in reviews/CANDIDATE_HASHES.json. Build client first, generating functions/generated/public-assets.json, then compile Functions. Hosting assets and server public HTML manifest must belong to the same candidate. A Hosting-only release with mismatched Functions manifest is unsafe. No generated manifest should be hand-edited.

Before authorized staging release: approved provider/owner/policy configuration; exact project and resource diff; indexes/Rules/headers; secrets/IAM; webhooks/domains; App Check rollout; backup; full required checks and passing final review. Record source/artifact hashes and deployed readback, then smoke real login, isolation and payment failure paths in approved test accounts.

Rollback design must preserve financial entries, provider receipts and compatible data versions. Retain prior Hosting/Functions artifact manifests, assess pending provider transactions before reverting handlers and reconcile unknown outcomes. Actual rollback commands/resources and recovery rehearsal require deployment inventory; none is certified here. Do not delete data to revert application code.

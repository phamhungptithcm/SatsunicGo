# Purchase CI fixture correction

Authority: CI-PURCHASE-DELTA-PLAN.md SHA256 1f96355208269bff9845179e94e9826ead21f7f5e803bf54dfa8525f37cf1a7f and root's explicit transfer of the single fixture file. Repository intelligence remains DEGRADED. Application evidence was read only from the committed isolated baseline /private/tmp/satsunicgo-release-local-work-20261009; concurrent dirty functions/payment/receipt/generated source was not edited or used as behavioral authority.

Run37886868261 actual FAIL section confirms three purchase failures: unseeded settings/purchaseRegions in the race case, then both receipt cases reading missing output from that previous test. The committed purchaseDemoEnvironment also requires exact demo-satsunicgo/config/Admin DB, FUNCTIONS_EMULATOR=true and loopback18207, while baseline CI uses8181. Root owns the dedicated serial purchase-group correction; this worker did not edit runners/configuration or broaden the source guard.

Owned fixture tests/rules/purchase-checkout.test.ts: before SHA256 10bff7edc18b046b3270f3b55875d7bddd534a0cf3f00128c1b1792e4f712e36; frozen SHA256 8ed773b258186e28797035246cbb350cec461ed0185fde775c66a1500a0168ca.

Setup first validates demoFirestoreEndpoint plus exact18207 and Storage127.0.0.1:9298, then checks actual purchaseDemoEnvironment after initializing the exact app identity and before any fixture writes. Three synthetic settings are atomically created only when all are absent: upfrontCheckout parsed by checkoutPolicySchema, purchaseRegions using codes/names admitted by checkoutRecipientSchema, and purchaseDemo.enabled with a unique fixture identifier. There is no standalone regions domain schema in this baseline; no such contract was invented. Captured settings values are asserted and cleanup is bound to their exact updateTime.

The receipt seed is produced by actual preview, commit and paid demo handlers using a separate receiptUid, then the actual receipt worker renders it to ready. It is not manufactured from a paid-state stub and is independent of the prior race test. Receipt cases copy that known setup snapshot. The race retains exactly one successful concurrent commit, identical concurrent payment results, one200000 financial entry, an empty cart and foreign-owner denial. Receipt tests retain expired-lease recovery, attachment/hash deduplication, pending_recipient with a null destination, malformed total causing bounded retries/failure with no outbox or financial-entry change, and background recovery amid active/queued jobs. All five original scenarios remain; no skip/retry/timeout changes were introduced.

Cleanup registers exact synthetic document IDs, generated order/timeline/recipient/payment/evidence/operation IDs and deterministic receipt object paths. Audit lookup is bounded to this fixture's exact checkout resource IDs and checks the demo-payment-adapter actor. Documents with an ownerId must belong to one of the two fixture owners; deletes use captured updateTime preconditions. Settings deletes require unchanged updateTime. Storage deletion requires a recorded fixture receipt, SHA metadata and a valid generation precondition; a recorded PDF hash, when present, must match. Missing objects alone are ignored. No broad collection deletion or data reset was added.

Unchanged committed source references:

| Source | SHA256 | Relevant facts |
| --- | --- | --- |
| functions/src/purchase-checkout.ts | 6ff4ebe23cd0dd0fa4d99235d833c951e14aa6e7705d36c921a4e22a34359a16 | Exact demo guard lines71–88; required settings reads lines103–107; guarded demo provider/commit lines375–386; actual receipt creation lines674–709. |
| functions/src/purchase-receipts.ts | 1b76b21d3a2ac6f67e52354156417d6e9adb38cba8c95a0e0315c7701db3ae72 | Actual lease, PDF/storage/outbox worker and bounded recovery selection. |
| packages/domain/purchase-checkout.ts | 1144926ab8865ddcde29e871ed81f834809bd302984535860ed341dbd5bd465a | Strict checkout policy/recipient schemas and server-authoritative checkout construction. |
| packages/domain/catalog-checkout.ts | eea4948edee36594600421debe6125385bab251805f4dd7f1a8fb9e5546bec4c | Catalog product/version/variant and integer price construction. |

Worker evidence: git diff --check passed; TypeScript source AST parse diagnostics were empty; source AST confirms the same five named cases. Formatting used the already-installed formatter only on the owned fixture. No application runtime import or test execution occurred during worker validation. Rules/Storage execution, typecheck, lint, independent review and real CI are NOT_RUN by this worker and root-owned. Failed log remains local at /private/tmp/satsunicgo-release-local-ci-37886868261-failed.log SHA256 faac5875962f926431718d5514d1f57d2f418fcb3de8c689e921bb05b21427c8; it was not copied into source.

No local server/emulator/data/provider/model action, credential access, source guard/payment/budget/policy/hold change, Git mutation, stage, commit or push occurred. Whole-release and production readiness remain pending root's exact successor checks/readback. Write lease: RELEASED. Memory candidates: None.

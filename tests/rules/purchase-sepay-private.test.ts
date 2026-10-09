import { demoFirestoreEndpoint } from "../helpers/demo-environment";
import { beforeAll, afterAll, test } from "vitest";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
let rules: RulesTestEnvironment;
beforeAll(async () => {
  rules = await initializeTestEnvironment({
    projectId: "demo-satsunicgo-sepay-rules",
    firestore: {
      ...demoFirestoreEndpoint(process.env),
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});
afterAll(async () => {
  await rules?.cleanup();
});
for (const collection of [
  "purchaseSePayIntents",
  "purchaseSePayInvoiceIndex",
  "purchaseSePayInbox",
  "purchaseSePayEvidence",
  "purchasePaymentEvidence",
]) {
  test(`private ${collection} rejects guest, owner, other owner and staff reads/writes`, async () => {
    const path = `${collection}/synthetic-private`;
    await rules.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), path), {
        ownerId: "fixture-owner",
        amount: 100,
        state: "verified",
      });
    });
    const contexts = [
      rules.unauthenticatedContext(),
      ...["fixture-owner", "fixture-other", "fixture-staff"].map((uid) =>
        rules.authenticatedContext(uid, {
          email_verified: true,
          firebase: { sign_in_provider: "google.com" },
          roles: ["OWNER"],
        }),
      ),
    ];
    for (const ctx of contexts) {
      await assertFails(getDoc(doc(ctx.firestore(), path)));
      await assertFails(
        setDoc(doc(ctx.firestore(), path), { state: "verified", amount: 1 }),
      );
    }
  });
}

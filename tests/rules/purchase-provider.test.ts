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
    projectId: "demo-satsunicgo-purchase-gateway-rules",
    firestore: {
      ...demoFirestoreEndpoint(process.env),
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});
afterAll(async () => {
  await rules?.cleanup();
});
const paths = [
  "purchaseDemoLinks",
  "purchaseDemoLinkIndex",
  "purchaseDemoMerchant",
  "purchasePaymentEvidence",
  "purchaseReceipts",
  "purchaseReceiptJobs",
  "purchaseEmailOutbox",
  "purchaseCheckouts",
  "purchasePreviews",
  "purchaseDrafts",
  "financialEntries",
];
for (const collection of paths) {
  test(`clients cannot directly read or overwrite ${collection}`, async () => {
    const id = "synthetic-private",
      path = `${collection}/${id}`;
    await rules.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), path), {
        ownerId: "synthetic-owner",
        amount: 100,
        state: "paid",
      });
    });
    for (const uid of ["synthetic-owner", "synthetic-other"]) {
      const db = rules
        .authenticatedContext(uid, {
          email_verified: true,
          firebase: { sign_in_provider: "google.com" },
        })
        .firestore();
      await assertFails(getDoc(doc(db, path)));
      await assertFails(setDoc(doc(db, path), { state: "paid", amount: 1 }));
    }
    await assertFails(
      getDoc(doc(rules.unauthenticatedContext().firestore(), path)),
    );
  });
}

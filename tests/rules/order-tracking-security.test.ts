import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, it, expect } from "vitest";
let env: RulesTestEnvironment;
const claims = {
  email_verified: true,
  firebase: { sign_in_provider: "google.com" as const },
};
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: `demo-trackrules-${randomUUID().slice(0, 8)}`,
    firestore: {
      host: "127.0.0.1",
      port: 18207,
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, "users/locked"), { locked: true }),
      setDoc(doc(db, "orders/order"), {
        ownerId: "customer",
        stage: "IN_TRANSIT",
      }),
      setDoc(doc(db, "orders/order/timeline/scan"), {
        action: "track",
        createdAt: 1,
      }),
      setDoc(doc(db, "customerShipments/customer-p1"), {
        ownerId: "customer",
        state: "in_transit",
      }),
      setDoc(doc(db, "packages/p1"), { internal: "PRIVATE" }),
      setDoc(doc(db, "financialEntries/entry"), { private: "PRIVATE" }),
      setDoc(doc(db, "orders/locked-order"), { ownerId: "locked" }),
    ]);
  });
});
it("verified owner reads their order, history and redacted shipment", async () => {
  const db = env.authenticatedContext("customer", claims).firestore();
  for (const path of [
    "orders/order",
    "orders/order/timeline/scan",
    "customerShipments/customer-p1",
  ])
    expect((await assertSucceeds(getDoc(doc(db, path)))).exists()).toBe(true);
});
it.each(["foreign", "anonymous", "unverified", "password"])(
  "%s cannot read owner tracking data",
  async (identity) => {
    const db =
      identity === "anonymous"
        ? env.unauthenticatedContext().firestore()
        : env
            .authenticatedContext(
              identity === "foreign" ? "foreign" : "customer",
              {
                ...claims,
                ...(identity === "unverified" ? { email_verified: false } : {}),
                ...(identity === "password"
                  ? { firebase: { sign_in_provider: "password" as const } }
                  : {}),
              },
            )
            .firestore();
    for (const path of [
      "orders/order",
      "orders/order/timeline/scan",
      "customerShipments/customer-p1",
    ])
      await assertFails(getDoc(doc(db, path)));
  },
);
it("locked owner and unscoped listing remain denied", async () => {
  await assertFails(
    getDoc(
      doc(
        env.authenticatedContext("locked", claims).firestore(),
        "orders/locked-order",
      ),
    ),
  );
  await assertFails(
    getDocs(
      collection(
        env.authenticatedContext("customer", claims).firestore(),
        "orders",
      ),
    ),
  );
});
it("owner cannot forge stage, scan, ETA, canonical parcel or financial record", async () => {
  const db = env.authenticatedContext("customer", claims).firestore();
  for (const path of [
    "orders/order",
    "orders/order/timeline/scan",
    "customerShipments/customer-p1",
    "packages/p1",
    "financialEntries/entry",
  ])
    await assertFails(
      setDoc(doc(db, path), {
        ownerId: "customer",
        state: "delivered",
        updatedAt: 1,
      }),
    );
  for (const path of ["packages/p1", "financialEntries/entry"])
    await assertFails(getDoc(doc(db, path)));
});
afterAll(async () => {
  if (env) {
    await env.clearFirestore();
    await env.cleanup();
  }
});

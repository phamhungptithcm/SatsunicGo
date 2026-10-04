import { readFileSync } from "node:fs";
import { afterAll, beforeAll, it } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
let env: RulesTestEnvironment;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-satsunicgo",
    firestore: {
      host: "127.0.0.1",
      port: 8181,
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
  await env.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), "orders/a"), {
      ownerId: "a",
      stage: "REQUESTED",
    });
    await setDoc(doc(c.firestore(), "orders/b"), {
      ownerId: "b",
      stage: "REQUESTED",
    });
    await setDoc(doc(c.firestore(), "users/locked"), {
      ownerId: "locked",
      locked: true,
    });
    await setDoc(doc(c.firestore(), "orders/locked"), { ownerId: "locked" });
    await setDoc(doc(c.firestore(), "products/draft"), { status: "draft" });
    await setDoc(doc(c.firestore(), "products/published"), {
      status: "published",
    });
    await setDoc(doc(c.firestore(), "orderOperations/a"), { margin: 10 });
  });
});
afterAll(async () => {
  await env?.cleanup();
});
it("owner reads own order; other customer and anonymous cannot", async () => {
  await assertSucceeds(
    getDoc(doc(env.authenticatedContext("a").firestore(), "orders/a")),
  );
  await assertFails(
    getDoc(doc(env.authenticatedContext("b").firestore(), "orders/a")),
  );
  await assertFails(
    getDoc(doc(env.unauthenticatedContext().firestore(), "orders/a")),
  );
});
it("client cannot mark paid, grant rights or access operations", async () => {
  const d = env.authenticatedContext("a").firestore();
  await assertFails(
    setDoc(doc(d, "orders/a"), { ownerId: "a", collected: 100 }),
  );
  await assertFails(setDoc(doc(d, "staffAccess/a"), { roles: ["OWNER"] }));
  await assertFails(getDoc(doc(d, "orderOperations/a")));
});
it("locked account cannot read own order", async () => {
  await assertFails(
    getDoc(
      doc(env.authenticatedContext("locked").firestore(), "orders/locked"),
    ),
  );
});
it("public access is published-only and queries require filter", async () => {
  const d = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(d, "products/published")));
  await assertFails(getDoc(doc(d, "products/draft")));
  await assertFails(getDocs(collection(d, "products")));
  await assertSucceeds(
    getDocs(
      query(collection(d, "products"), where("status", "==", "published")),
    ),
  );
});

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, it } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
  type TokenOptions,
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
const verifiedGoogle: TokenOptions = {
  email_verified: true,
  firebase: { sign_in_provider: "google.com" },
};
// The emulator accepts raw mock claims; inject a malformed reserved claim
// deliberately without asserting that the invalid value is a boolean.
const malformedVerifiedClaim: TokenOptions = { ...verifiedGoogle };
Reflect.set(malformedVerifiedClaim, "email_verified", "true");
const rejectedClaims: TokenOptions[] = [
  {},
  { email_verified: false, firebase: { sign_in_provider: "google.com" } },
  malformedVerifiedClaim,
  { email_verified: true },
  { email_verified: true, firebase: { sign_in_provider: "password" } },
  {
    email_verified: true,
    firebase: {
      sign_in_provider: "custom",
      identities: { "google.com": ["fixture-linked-google"] },
    },
  },
];
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
    getDoc(
      doc(
        env.authenticatedContext("a", verifiedGoogle).firestore(),
        "orders/a",
      ),
    ),
  );
  await assertFails(
    getDoc(
      doc(
        env.authenticatedContext("b", verifiedGoogle).firestore(),
        "orders/a",
      ),
    ),
  );
  await assertFails(
    getDoc(doc(env.unauthenticatedContext().firestore(), "orders/a")),
  );
});
it("client cannot mark paid, grant rights or access operations", async () => {
  const d = env.authenticatedContext("a", verifiedGoogle).firestore();
  await assertFails(
    setDoc(doc(d, "orders/a"), { ownerId: "a", collected: 100 }),
  );
  await assertFails(setDoc(doc(d, "staffAccess/a"), { roles: ["OWNER"] }));
  await assertFails(getDoc(doc(d, "orderOperations/a")));
});
it("locked account cannot read own order", async () => {
  await assertFails(
    getDoc(
      doc(
        env.authenticatedContext("locked", verifiedGoogle).firestore(),
        "orders/locked",
      ),
    ),
  );
});
it.each(rejectedClaims)(
  "private reads reject absent, unverified or non-Google claims",
  async (claims) => {
    const d = env.authenticatedContext("a", claims).firestore();
    await assertFails(getDoc(doc(d, "orders/a")));
    await assertFails(getDoc(doc(d, "users/a")));
    // Public catalog remains accessible regardless of the authentication method.
    await assertSucceeds(getDoc(doc(d, "products/published")));
  },
);
it("verified Google MFA claims preserve owner reads", async () => {
  // TokenOptions omits the documented MFA field; keep it in a structurally
  // compatible fixture rather than removing the second-factor claim.
  const mfaClaims = {
    ...verifiedGoogle,
    firebase: {
      sign_in_provider: "google.com" as const,
      sign_in_second_factor: "totp",
    },
  };
  const d = env.authenticatedContext("a", mfaClaims).firestore();
  await assertSucceeds(getDoc(doc(d, "orders/a")));
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

it("owner-filtered private queries and nested records stay isolated after lock", async () => {
  const scope = `rules-${randomUUID()}`;
  const owner = `${scope}-owner`,
    other = `${scope}-other`;
  const paths = [
    `orders/${scope}/quotes/1`,
    `orders/${scope}/acceptances/1`,
    `orders/${scope}/timeline/1`,
    `supportTickets/${scope}/messages/1`,
  ];
  await env.withSecurityRulesDisabled(async (c) => {
    const d = c.firestore();
    await setDoc(doc(d, `orders/${scope}`), { ownerId: owner });
    await setDoc(doc(d, `supportTickets/${scope}`), { ownerId: owner });
    for (const path of paths)
      await setDoc(doc(d, path), { internal: "Synthetic private record" });
    await setDoc(doc(d, `salesDocuments/${scope}-issued`), {
      ownerId: owner,
      state: "issued",
    });
    await setDoc(doc(d, `salesDocuments/${scope}-void`), {
      ownerId: owner,
      state: "void",
    });
    await setDoc(doc(d, `salesDocuments/${scope}-draft`), {
      ownerId: owner,
      state: "draft",
    });
    await setDoc(doc(d, `orderMedia/${scope}`), {
      ownerId: owner,
      state: "ready",
    });
  });
  const own = env.authenticatedContext(owner, verifiedGoogle).firestore(),
    foreign = env.authenticatedContext(other, verifiedGoogle).firestore();
  await assertSucceeds(
    getDocs(query(collection(own, "orders"), where("ownerId", "==", owner))),
  );
  await assertFails(getDocs(collection(own, "orders")));
  await assertFails(
    getDocs(
      query(collection(foreign, "orders"), where("ownerId", "==", owner)),
    ),
  );
  for (const path of paths) {
    await assertSucceeds(getDoc(doc(own, path)));
    await assertFails(getDoc(doc(foreign, path)));
    await assertFails(setDoc(doc(own, path), { ownerId: owner }));
  }
  await assertSucceeds(getDoc(doc(own, `salesDocuments/${scope}-issued`)));
  await assertSucceeds(getDoc(doc(own, `salesDocuments/${scope}-void`)));
  await assertFails(getDoc(doc(own, `salesDocuments/${scope}-draft`)));
  await assertFails(getDoc(doc(own, `orderMedia/${scope}`)));
  await env.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), `users/${owner}`), { locked: true });
  });
  for (const path of paths) await assertFails(getDoc(doc(own, path)));
  await assertFails(
    getDocs(query(collection(own, "orders"), where("ownerId", "==", owner))),
  );
});

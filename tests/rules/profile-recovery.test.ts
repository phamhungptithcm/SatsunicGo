import { beforeAll, afterAll, test, expect } from "vitest";
import { randomUUID, createHash } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
let command: typeof import("../../functions/src/workspace").workspaceCommand;
let resolver: typeof import("../../functions/src/ai/customer-save").customerSaveResolve;
let db: ReturnType<typeof getFirestore>;
const owners = new Set<string>();
const paths = new Set<string>();
function owner() {
  const uid = `profile-qa-${randomUUID()}`;
  owners.add(uid);
  return uid;
}
function request(uid: string, data: unknown) {
  return {
    auth: {
      uid,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  } as CallableRequest;
}
function address() {
  return {
    action: "saveAddress",
    operationId: randomUUID(),
    payload: {
      recipient: "Synthetic QA recipient",
      phone: "0900000000",
      address: "Synthetic test address only",
    },
  };
}
async function run(
  uid: string,
  data: ReturnType<typeof address> | Record<string, unknown>,
) {
  paths.add(`idempotencyKeys/${uid}-${data.operationId}`);
  return command.run(request(uid, data));
}
beforeAll(async () => {
  ({ workspaceCommand: command } = await import("../../functions/src/index"));
  ({ customerSaveResolve: resolver } =
    await import("../../functions/src/index"));
  db = getFirestore();
});
afterAll(async () => {
  for (const uid of owners) {
    for (const [collection, field] of [
      ["addresses", "ownerId"],
      ["auditEvents", "actor"],
    ]) {
      const rows = await db
        .collection(collection)
        .where(field, "==", uid)
        .get();
      for (const row of rows.docs) await row.ref.delete();
    }
    await db.doc(`users/${uid}`).delete();
    await db.doc(`staffAccess/${uid}`).delete();
  }
  for (const path of paths) await db.doc(path).delete();
  await db.terminate();
});
test("lost address response: exact concurrent/repeated command creates one owned address and audit", async () => {
  const uid = owner(),
    data = address();
  const [a, b] = await Promise.all([run(uid, data), run(uid, data)]);
  expect(a).toEqual(b);
  expect(await run(uid, data)).toEqual(a);
  const rows = await db
    .collection("addresses")
    .where("ownerId", "==", uid)
    .get();
  expect(rows.size).toBe(1);
  expect(rows.docs[0].id).toBe((a as { id: string }).id);
  expect(
    (await db.collection("auditEvents").where("actor", "==", uid).get()).size,
  ).toBe(1);
});
test("tampered replay cannot change address", async () => {
  const uid = owner(),
    data = address();
  await run(uid, data);
  await expect(
    run(uid, {
      ...data,
      payload: { ...data.payload, address: "Different synthetic address" },
    }),
  ).rejects.toMatchObject({ code: "already-exists" });
  expect(
    (
      await db.collection("addresses").where("ownerId", "==", uid).get()
    ).docs[0].data().address,
  ).toBe(data.payload.address);
});
test("profile recovery keeps original expected version after committed response is lost", async () => {
  const uid = owner();
  await db.doc(`users/${uid}`).set({ ownerId: uid, version: 0 });
  const data = {
    action: "saveProfile",
    operationId: randomUUID(),
    expectedVersion: 0,
    payload: {
      displayName: "Synthetic QA",
      businessName: "",
      marketingConsent: false,
    },
  };
  const first = await run(uid, data);
  expect(await run(uid, data)).toEqual(first);
  expect((await db.doc(`users/${uid}`).get()).data()?.version).toBe(1);
  await expect(
    run(uid, { ...data, operationId: randomUUID() }),
  ).rejects.toMatchObject({ code: "aborted" });
});
test("locked identity cannot replay prior success", async () => {
  const uid = owner(),
    data = address();
  await run(uid, data);
  await db.doc(`users/${uid}`).set({ locked: true });
  await expect(run(uid, data)).rejects.toMatchObject({
    code: "permission-denied",
  });
});
test("invalid address and forged owner payload cannot persist", async () => {
  const uid = owner(),
    data = address();
  await expect(
    run(uid, {
      ...data,
      payload: { ...data.payload, ownerId: "another-account" },
    }),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  await expect(
    run(uid, {
      ...data,
      operationId: randomUUID(),
      payload: { ...data.payload, address: "x" },
    }),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  expect(
    (await db.collection("addresses").where("ownerId", "==", uid).get()).empty,
  ).toBe(true);
});

function pointer(data: Record<string, unknown>) {
  return {
    schemaVersion: 1,
    action: data.action,
    operationId: data.operationId,
    commandHash: createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex"),
    expectedVersion: data.expectedVersion ?? 0,
  };
}
async function resolve(uid: string, value: ReturnType<typeof pointer>) {
  paths.add(`customerSaveFences/${uid}-${value.operationId}`);
  paths.add(`customerSaveQuota/${uid}-${Math.floor(Date.now() / 60000)}`);
  paths.add(`customerSaveQuota/${uid}-${Math.floor(Date.now() / 60000) + 1}`);
  return resolver.run(request(uid, value));
}
test("reload resolves committed address without exposing recipient fields", async () => {
  const uid = owner(),
    data = address(),
    saved = await run(uid, data);
  expect(await resolve(uid, pointer(data))).toEqual({
    status: "saved",
    result: saved,
  });
  expect(await resolve(uid, pointer(data))).toEqual({
    status: "saved",
    result: saved,
  });
  expect(
    (await db.doc(`customerSaveFences/${uid}-${data.operationId}`).get())
      .exists,
  ).toBe(false);
});
test("missing save is fenced atomically: a delayed original cannot commit later", async () => {
  const uid = owner(),
    data = address();
  expect(await resolve(uid, pointer(data))).toEqual({ status: "not-saved" });
  await expect(run(uid, data)).rejects.toMatchObject({
    code: "failed-precondition",
    details: { reason: "SAVE_CANCELLED" },
  });
  expect(
    (await db.collection("addresses").where("ownerId", "==", uid).get()).empty,
  ).toBe(true);
  expect(await resolve(uid, pointer(data))).toEqual({ status: "not-saved" });
  expect(
    (await db.collection("auditEvents").where("actor", "==", uid).get()).size,
  ).toBe(1);
});
test("racing save and resolve agree on one durable outcome", async () => {
  for (let i = 0; i < 4; i++) {
    const uid = owner(),
      data = address();
    const [write, recovery] = await Promise.allSettled([
      run(uid, data),
      resolve(uid, pointer(data)),
    ]);
    expect(recovery.status).toBe("fulfilled");
    if (recovery.status !== "fulfilled") throw Error("missing recovery");
    const rows = await db
      .collection("addresses")
      .where("ownerId", "==", uid)
      .get();
    if (recovery.value.status === "saved") {
      expect(write.status).toBe("fulfilled");
      expect(rows.size).toBe(1);
      if (write.status === "fulfilled")
        expect(recovery.value.result).toEqual(write.value);
    } else {
      expect(write.status).toBe("rejected");
      expect(rows.empty).toBe(true);
    }
  }
});
test("resolver denies mismatched hash/version, foreign owner, locked account and malformed pointer", async () => {
  const uid = owner(),
    data = address();
  await run(uid, data);
  await expect(
    resolve(uid, { ...pointer(data), commandHash: "a".repeat(64) }),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await expect(
    resolve(uid, { ...pointer(data), expectedVersion: 9 }),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  const foreign = owner();
  expect(await resolve(foreign, pointer(data))).toEqual({
    status: "not-saved",
  });
  expect(
    (await db.collection("addresses").where("ownerId", "==", uid).get()).size,
  ).toBe(1);
  await db.doc(`users/${uid}`).set({ locked: true });
  await expect(resolve(uid, pointer(data))).rejects.toMatchObject({
    code: "permission-denied",
  });
  await expect(
    resolver.run(request(uid, { ...pointer(data), recipient: "private" })),
  ).rejects.toMatchObject({ code: "invalid-argument" });
});
test("resolver verifies owned resource and preserves closed pointer correlation", async () => {
  const uid = owner(),
    data = address(),
    result = (await run(uid, data)) as { id: string };
  await db
    .doc(`addresses/${result.id}`)
    .update({ ownerId: "not-this-account" });
  paths.add(`addresses/${result.id}`);
  await expect(resolve(uid, pointer(data))).rejects.toMatchObject({
    code: "failed-precondition",
  });
  const missing = address();
  await resolve(uid, pointer(missing));
  await expect(
    resolve(uid, { ...pointer(missing), action: "saveProfile" }),
  ).rejects.toMatchObject({ code: "already-exists" });
});
test("failed lookups consume admission and corrupt/exhausted quota fails closed", async () => {
  const uid = owner(),
    data = address();
  await run(uid, data);
  const minute = Math.floor(Date.now() / 60000);
  await expect(
    resolve(uid, { ...pointer(data), commandHash: "b".repeat(64) }),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  const counts = await Promise.all(
    [minute, Math.floor(Date.now() / 60000)].map(
      async (m) =>
        (await db.doc(`customerSaveQuota/${uid}-${m}`).get()).data()?.count,
    ),
  );
  expect(counts).toContain(1);
  for (const m of [
    Math.floor(Date.now() / 60000),
    Math.floor(Date.now() / 60000) + 1,
  ]) {
    const key = `customerSaveQuota/${uid}-${m}`;
    paths.add(key);
    await db.doc(key).set({ count: 8 });
  }
  await expect(resolve(uid, pointer(data))).rejects.toMatchObject({
    code: "resource-exhausted",
  });
});
test("clients including OWNER cannot read or write recovery fences/quota directly", async () => {
  const { initializeTestEnvironment, assertFails } =
    await import("@firebase/rules-unit-testing");
  const { doc, getDoc, setDoc } = await import("firebase/firestore");
  const uid = owner();
  await db.doc(`staffAccess/${uid}`).set({ active: true, roles: ["OWNER"] });
  const data = address();
  await resolve(uid, pointer(data));
  const env = await initializeTestEnvironment({
    projectId: "demo-satsunicgo",
    firestore: { host: "127.0.0.1", port: 18207 },
  });
  try {
    const client = env
      .authenticatedContext(uid, {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      })
      .firestore();
    for (const path of [
      `customerSaveFences/${uid}-${data.operationId}`,
      `customerSaveQuota/${uid}-${Math.floor(Date.now() / 60000)}`,
    ]) {
      await assertFails(getDoc(doc(client, path)));
      await assertFails(setDoc(doc(client, path), { count: 0 }));
    }
  } finally {
    await env.cleanup();
  }
});

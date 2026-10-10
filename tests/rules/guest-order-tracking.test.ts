import { initializeApp, getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  initializeTestEnvironment,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { randomUUID, createHash, createHmac } from "node:crypto";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import type { CallableRequest } from "firebase-functions/v2/https";
import { demoFirestoreEndpoint } from "../helpers/demo-environment";
let db: ReturnType<typeof getFirestore>, env: RulesTestEnvironment;
let service: typeof import("../../functions/src/public-order-tracking"),
  privateService: typeof import("../../functions/src/customer-order-tracking");
const projectId = `demo-guesttrack-${randomUUID().slice(0, 8)}`,
  uid = "customer",
  id = "order",
  ip = "192.0.2.100";
const auth = (uid: string) => ({
  uid,
  token: { email_verified: true, firebase: { sign_in_provider: "google.com" } },
});
const request = (data: unknown, identity?: unknown, network = ip) =>
  ({
    data,
    auth: identity,
    rawRequest: {
      ip: network,
      res: { set: () => {} },
      headers: { "x-forwarded-for": randomUUID() },
    },
  }) as unknown as CallableRequest;
const issue = (
  data: Record<string, unknown> = {},
  identity: unknown = auth(uid),
) =>
  service.managePublicTrackingCode.run(
    request(
      {
        action: "issue",
        orderId: id,
        expectedVersion: 1,
        operationId: randomUUID(),
        ...data,
      },
      identity,
    ),
  );
const read = (code: string, data: Record<string, unknown> = {}) =>
  service.publicOrderTracking.run(request({ code, ...data }));
async function seed() {
  const now = Date.now(),
    batch = db.batch();
  batch.set(db.doc("orders/order"), {
    id,
    ownerId: uid,
    stage: "IN_TRANSIT",
    version: 1,
    items: [{ quantity: 2, name: "PII_CANARY" }],
    collected: 240000,
    refunded: 0,
    phone: "PII_CANARY",
    address: "PII_CANARY",
    notes: "PII_CANARY",
  });
  batch.set(db.doc("users/customer"), { locked: false });
  batch.set(db.doc("staffAccess/customer"), {
    locked: false,
    active: true,
    roles: ["OWNER"],
  });
  const allocations = [0, 1].map(() => ({ orderId: id, line: 0, quantity: 1 }));
  batch.set(db.doc("packageAllocations/order"), {
    parcelIds: ["p0", "p1"],
    allocations,
  });
  for (const [i, a] of allocations.entries()) {
    const p = {
      id: `p${i}`,
      version: 1,
      state: "in_transit",
      allocations: [a],
      deliveryEstimate: {
        source: "staff",
        startAt: now + 3600000,
        endAt: now + 7200000,
        recordedAt: now - 1000,
      },
      route: "PII_CANARY",
      carrier: "PII_CANARY",
      tracking: "PII_CANARY",
      actor: "PII_CANARY",
    };
    batch.set(db.doc(`packages/p${i}`), p);
    batch.set(db.doc(`customerShipments/customer-p${i}`), {
      ...p,
      ownerId: uid,
      updatedAt: now - 500,
    });
  }
  batch.set(db.doc("orders/order/timeline/dispatch"), {
    action: "dispatch",
    createdAt: now - 1000,
    actor: "PII_CANARY",
  });
  await batch.commit();
}
beforeAll(async () => {
  // Validate before Admin initialization; CI8181 and shared18207 use a unique
  // disposable project, never the shared demo project's data.
  const endpoint = demoFirestoreEndpoint(process.env);
  initializeApp({ projectId });
  db = getFirestore();
  env = await initializeTestEnvironment({
    projectId,
    firestore: {
      ...endpoint,
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
  service = await import("../../functions/src/public-order-tracking");
  privateService = await import("../../functions/src/customer-order-tracking");
});
beforeEach(async () => {
  for (const c of await db.listCollections()) await db.recursiveDelete(c);
  await seed();
});
it("owner issues capability; anonymous sees only progress/ETA; private state and PII unchanged", async () => {
  const before = (await db.doc("orders/order").get()).data(),
    { code } = await issue();
  expect(code).toMatch(/^SGT-[a-f0-9]{64}$/);
  const result = await read(code!);
  expect(Object.keys(result).sort()).toEqual([
    "eta",
    "observedAt",
    "publicStatus",
    "updatedAt",
  ]);
  expect(result).toMatchObject({
    publicStatus: "shipping",
    eta: { source: "staff" },
  });
  expect(JSON.stringify(result)).not.toContain("PII_CANARY");
  expect((await db.doc("orders/order").get()).data()).toEqual(before);
  for (const c of [
    "guestTrackingCodes",
    "guestTrackingAccess",
    "guestTrackingOperations",
    "guestTrackingQuotas",
  ]) {
    const docs = await db.collection(c).get();
    expect(JSON.stringify(docs.docs.map((d) => d.data()))).not.toContain(code!);
  }
});
it("same issue replay returns same code without rotation; changed replay fails; stale version aborts", async () => {
  const operationId = randomUUID(),
    first = await issue({ operationId });
  expect(await issue({ operationId })).toEqual(first);
  await expect(issue({ operationId, action: "revoke" })).rejects.toMatchObject({
    code: "already-exists",
  });
  await expect(issue({ expectedVersion: 0 })).rejects.toMatchObject({
    code: "aborted",
  });
  expect((await read(first.code!)).publicStatus).toBe("shipping");
});
it("rotation/revoke invalidate old codes; replay cannot resurrect them", async () => {
  const operationId = randomUUID(),
    first = await issue({ operationId }),
    second = await issue();
  await expect(read(first.code!)).rejects.toMatchObject({ code: "not-found" });
  await expect(issue({ operationId })).rejects.toMatchObject({
    code: "failed-precondition",
  });
  expect(await read(second.code!)).toHaveProperty("publicStatus");
  await issue({ action: "revoke" });
  await expect(read(second.code!)).rejects.toMatchObject({ code: "not-found" });
});
it.each(["unknown", "uuid", "short", "array", "null", "private-flags"])(
  "%s guest input never reveals private data",
  async (kind) => {
    const { code } = await issue();
    const input =
      kind === "unknown"
        ? { code: "SGT-" + "b".repeat(64) }
        : kind === "uuid"
          ? { code: randomUUID() }
          : kind === "short"
            ? { code: "../private" }
            : kind === "array"
              ? [code]
              : kind === "null"
                ? null
                : { code, ownerId: uid, includePrivate: true };
    await expect(
      service.publicOrderTracking.run(request(input)),
    ).rejects.toMatchObject({ code: "not-found" });
  },
);
it.each([
  "locked-user",
  "locked-staff",
  "expired",
  "deleted",
  "malformed-stage",
])("%s returns indistinguishable unavailable response", async (kind) => {
  const { code } = await issue();
  if (kind === "locked-user")
    await db.doc("users/customer").update({ locked: true });
  if (kind === "locked-staff")
    await db.doc("staffAccess/customer").update({ locked: true });
  if (kind === "expired")
    await db
      .doc(
        "guestTrackingCodes/" +
          createHash("sha256").update(code!).digest("hex"),
      )
      .update({ expiresAt: 1 });
  if (kind === "deleted") await db.doc("orders/order").delete();
  if (kind === "malformed-stage")
    await db.doc("orders/order").update({ stage: "private-stage" });
  await expect(read(code!)).rejects.toMatchObject({
    code: "not-found",
    message:
      "Chưa tra cứu được đơn này. Kiểm tra mã hoặc đăng nhập để xem đơn của bạn.",
  });
});
it.each(["anonymous", "foreign", "unverified", "password", "locked"])(
  "%s cannot issue/revoke capabilities",
  async (kind) => {
    let identity: unknown =
      kind === "anonymous"
        ? undefined
        : auth(kind === "foreign" ? "foreign" : uid);
    if (kind === "unverified")
      identity = {
        uid,
        token: {
          email_verified: false,
          firebase: { sign_in_provider: "google.com" },
        },
      };
    if (kind === "password")
      identity = {
        uid,
        token: {
          email_verified: true,
          firebase: { sign_in_provider: "password" },
        },
      };
    if (kind === "locked")
      await db.doc("users/customer").update({ locked: true });
    await expect(
      service.managePublicTrackingCode.run(
        request(
          {
            action: "issue",
            orderId: id,
            expectedVersion: 1,
            operationId: randomUUID(),
          },
          identity,
        ),
      ),
    ).rejects.toBeDefined();
    expect((await db.collection("guestTrackingCodes").get()).empty).toBe(true);
  },
);
it("valid and malformed lookups share quota; concurrent attempts cannot exceed30 even with spoofed headers", async () => {
  const { code } = await issue();
  const window = Math.floor(Date.now() / 60000);
  const bucket = createHmac("sha256", "synthetic-emulator-guest-tracking-key")
    .update(`read:${window}:${ip}`)
    .digest("hex");
  await db
    .doc(`guestTrackingQuotas/${bucket}`)
    .set({ count: 27, expiresAt: Date.now() + 120000 });
  const results = await Promise.allSettled(
    Array.from({ length: 8 }, (_, i) =>
      service.publicOrderTracking.run(
        request(i % 2 ? { code } : { code: "bad" }),
      ),
    ),
  );
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => r.reason.code);
  expect(errors.filter((c) => c === "resource-exhausted")).toHaveLength(5);
  expect(
    results.filter((r) => r.status === "fulfilled").length +
      errors.filter((c) => c === "not-found").length,
  ).toBe(3);
});
it("guest cannot read code mappings/quota/private order or forge them through Firestore", async () => {
  const { code } = await issue();
  const client = env.unauthenticatedContext().firestore();
  for (const path of [
    "orders/order",
    "packages/p0",
    "financialEntries/private",
    "guestTrackingCodes/" + createHash("sha256").update(code!).digest("hex"),
    "guestTrackingAccess/order",
    "guestTrackingOperations/forged",
    "guestTrackingQuotas/forged",
  ]) {
    await assertFails(getDoc(doc(client, path)));
    await assertFails(
      setDoc(doc(client, path), {
        ownerId: uid,
        activeHash: "forged",
        count: 0,
      }),
    );
  }
  await expect(
    privateService.customerOrderTracking.run(request({ orderId: id })),
  ).rejects.toMatchObject({ code: "unauthenticated" });
  await expect(
    privateService.customerOrderTracking.run(
      request({ orderId: id }, auth("foreign")),
    ),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
it("partial delivery, held/failed and future projection cannot produce false ETA", async () => {
  const { code } = await issue();
  await db.doc("packages/p0").update({ state: "delivered" });
  await db.doc("customerShipments/customer-p0").update({ state: "delivered" });
  expect((await read(code!)).publicStatus).toBe("shipping");
  await db.doc("orders/order").update({ hold: "PII_CANARY" });
  expect(await read(code!)).toMatchObject({
    publicStatus: "temporarily_unavailable",
    eta: null,
    updatedAt: null,
  });
  await db.doc("orders/order").update({ hold: "" });
  await db
    .doc("customerShipments/customer-p1")
    .update({ updatedAt: Date.now() + 86400000 });
  expect((await read(code!)).eta).toBeNull();
});
it.each([NaN, "30", -1, 1.5])(
  "corrupted quota %s fails closed",
  async (count) => {
    const { code } = await issue();
    await db
      .doc(`guestTrackingQuotas/read-${Math.floor(Date.now() / 60000)}`)
      .set({ count, expiresAt: Date.now() + 120000 });
    await expect(read(code!)).rejects.toMatchObject({ code: "unavailable" });
  },
);
it("thirty attempts are charged and thirty-first denied without exposing raw IP", async () => {
  const { code } = await issue();
  for (let i = 0; i < 30; i++)
    await expect(read("SGT-" + "b".repeat(64))).rejects.toMatchObject({
      code: "not-found",
    });
  await expect(read(code!)).rejects.toMatchObject({
    code: "resource-exhausted",
  });
  const quotas = await db.collection("guestTrackingQuotas").get();
  expect(JSON.stringify(quotas.docs.map((d) => d.data()))).not.toContain(ip);
});
it("signed-in nonowner receives only public DTO, injected extra fields always reject", async () => {
  const { code } = await issue();
  const value = await service.publicOrderTracking.run(
    request({ code }, auth("foreign")),
  );
  expect(Object.keys(value).sort()).toEqual([
    "eta",
    "observedAt",
    "publicStatus",
    "updatedAt",
  ]);
  for (const field of [
    "ownerId",
    "fields",
    "role",
    "history",
    "route",
    "includePrivate",
    "items",
    "address",
  ]) {
    await expect(
      service.publicOrderTracking.run(request({ code, [field]: "PII_CANARY" })),
    ).rejects.toMatchObject({ code: "not-found" });
  }
});
it("missing trusted network identity uses a limited shared fallback; caller UID ignored", async () => {
  const window = Math.floor(Date.now() / 60000);
  const bucket = createHmac("sha256", "synthetic-emulator-guest-tracking-key")
    .update(`read:${window}:unknown`)
    .digest("hex");
  await db.doc(`guestTrackingQuotas/${bucket}`).set({ count: 29 });
  const r = request({ code: "bad", uid: randomUUID() });
  Object.assign(r.rawRequest, { ip: undefined });
  await expect(service.publicOrderTracking.run(r)).rejects.toMatchObject({
    code: "not-found",
  });
  await expect(service.publicOrderTracking.run(r)).rejects.toMatchObject({
    code: "resource-exhausted",
  });
});
it("concurrent rotations leave exactly one active code", async () => {
  const codes = await Promise.all([issue(), issue()]);
  const results = await Promise.allSettled(codes.map((v) => read(v.code!)));
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
});
it("registry beyond60 never produces ETA or scans arbitrary extra parcels", async () => {
  const { code } = await issue();
  await db
    .doc("packageAllocations/order")
    .update({ parcelIds: Array.from({ length: 61 }, (_, i) => `p${i}`) });
  expect(await read(code!)).toMatchObject({
    publicStatus: "shipping",
    eta: null,
  });
});
it("quota expiry is TTL-compatible Firestore Timestamp, not a numeric deletion promise", async () => {
  await issue();
  const snapshots = await db.collection("guestTrackingQuotas").get();
  expect(
    snapshots.docs.every(
      (d) => typeof d.get("expiresAt").toMillis === "function",
    ),
  ).toBe(true);
});
it("expired operation cannot replay a successful code issuance", async () => {
  const operationId = randomUUID();
  await issue({ operationId });
  await db
    .doc(`guestTrackingOperations/${uid}-${operationId}`)
    .update({ expiresAt: 1 });
  await expect(issue({ operationId })).rejects.toMatchObject({
    code: "failed-precondition",
  });
});
it("replaying operation after TTL deletion creates a different code, never resurrects old capability", async () => {
  const operationId = randomUUID();
  const first = await issue({ operationId });
  await issue();
  await db.doc(`guestTrackingOperations/${uid}-${operationId}`).delete();
  const next = await issue({ operationId });
  expect(next.code).not.toBe(first.code);
  await expect(read(first.code!)).rejects.toMatchObject({ code: "not-found" });
});
afterAll(async () => {
  if (db) {
    for (const c of await db.listCollections()) await db.recursiveDelete(c);
    await db.terminate();
  }
  if (env) await env.cleanup();
  await deleteApp(getApp());
});

import { initializeApp, getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
import { vietCargoReferenceRates as config } from "../../packages/domain/shipping-rates";
let db: ReturnType<typeof getFirestore>,
  api: typeof import("../../functions/src/shipping-rates");
const uid = `rates027-${randomUUID()}`;
const token = {
  email_verified: true,
  firebase: { sign_in_provider: "google.com" },
};
function invoke(data: unknown, overrideToken: unknown = token) {
  return api.shippingRatesAdmin.run({
    auth: { uid, token: overrideToken },
    data,
  } as CallableRequest);
}
function mutation(action: "save" | "publish" | "delete", expectedVersion = 0) {
  return {
    action,
    operationId: randomUUID(),
    expectedVersion,
    ...(action === "save" ? { config } : {}),
  };
}
function publicRead(data: unknown = {}) {
  return api.shippingRatesPublic.run({ data } as CallableRequest);
}
async function effects() {
  const docs = await Promise.all([
    db.doc("settings/shippingRates").get(),
    db.doc("shippingRatePublic/current").get(),
    db.collection("idempotencyKeys").get(),
    db.collection("auditEvents").get(),
  ]);
  return {
    draft: docs[0].data(),
    published: docs[1].data(),
    operations: docs[2].docs
      .map((d) => ({ id: d.id, data: d.data() }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    audits: docs[3].docs
      .map((d) => ({ id: d.id, data: d.data() }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };
}
beforeAll(async () => {
  initializeApp({ projectId: `demo-rates027-${randomUUID().slice(0, 8)}` });
  db = getFirestore();
  api = await import("../../functions/src/shipping-rates");
});
beforeEach(async () => {
  await Promise.all([
    db.doc(`users/${uid}`).set({ locked: false }),
    db
      .doc(`staffAccess/${uid}`)
      .set({ active: true, locked: false, roles: ["OWNER"] }),
    db.doc("settings/shippingRates").delete(),
    db.doc("shippingRatePublic/current").delete(),
  ]);
});
it("RATES027 public source reference safe projection requires no identity", async () => {
  const before = await effects();
  expect(await publicRead()).toEqual({
    version: null,
    config,
    origin: "reference",
  });
  expect(await effects()).toEqual(before);
});
it("RATES027 draft save isolated, explicitpublish authoritative, delete tombstone no fallback resurrection", async () => {
  const save = mutation("save");
  expect(await invoke(save)).toMatchObject({
    version: 1,
    publishedVersion: null,
  });
  expect((await publicRead()).origin).toBe("reference");
  const publish = mutation("publish", 1);
  expect(await invoke(publish)).toMatchObject({
    version: 2,
    publishedVersion: 2,
  });
  const after = await effects();
  expect(await invoke(publish)).toMatchObject({ version: 2 });
  expect(await effects()).toEqual(after);
  expect(await publicRead()).toEqual({
    version: 2,
    config,
    origin: "published",
  });
  const changed = structuredClone(config);
  changed.rows[0].amountMinor = 123;
  await invoke({ ...mutation("save", 2), config: changed });
  expect((await publicRead()).config?.rows[0].amountMinor).toBe(1300000);
  const del = mutation("delete", 3);
  expect(await invoke(del)).toEqual({
    version: 4,
    config: null,
    publishedVersion: null,
  });
  expect(await publicRead()).toEqual({
    version: 4,
    config: null,
    origin: "unavailable",
  });
  const deleted = await effects();
  expect(await invoke(del)).toEqual({
    version: 4,
    config: null,
    publishedVersion: null,
  });
  expect(await effects()).toEqual(deleted);
});
it("RATES027 repeated save idempotent and payloadreuse rejected without audit/write", async () => {
  const data = mutation("save");
  await invoke(data);
  const before = await effects();
  await invoke(data);
  expect(await effects()).toEqual(before);
  await expect(invoke({ ...data, expectedVersion: 1 })).rejects.toMatchObject({
    code: "already-exists",
  });
  expect(await effects()).toEqual(before);
});
it("RATES027 staleversion rejects, concurrent sameversion onlyone saves", async () => {
  const outcomes = await Promise.allSettled([
    invoke(mutation("save")),
    invoke(mutation("save")),
  ]);
  expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const before = await effects();
  await expect(invoke(mutation("delete", 0))).rejects.toMatchObject({
    code: "aborted",
  });
  expect(await effects()).toEqual(before);
});
const denied = [
  {
    label: "inactive",
    staff: { active: false, locked: false, roles: ["OWNER"] },
  },
  {
    label: "malformedactive",
    staff: { active: "true", locked: false, roles: ["OWNER"] },
  },
  {
    label: "stafflocked",
    staff: { active: true, locked: true, roles: ["OWNER"] },
  },
  {
    label: "nonowner",
    staff: { active: true, locked: false, roles: ["SUPPORT"] },
  },
  {
    label: "rolesstring",
    staff: { active: true, locked: false, roles: "OWNER" },
  },
  {
    label: "mixedobject",
    staff: { active: true, locked: false, roles: ["OWNER", {}] },
  },
  {
    label: "mixednull",
    staff: { active: true, locked: false, roles: ["OWNER", null] },
  },
  {
    label: "mixednumber",
    staff: { active: true, locked: false, roles: ["OWNER", 1] },
  },
];
for (const action of ["read", "save", "publish", "delete"] as const)
  it.each(denied)(
    `RATES027 ${action} current$label deniedwithout effects`,
    async ({ staff }) => {
      await db.doc(`staffAccess/${uid}`).set(staff);
      const before = await effects();
      await expect(
        invoke(action === "read" ? { action } : mutation(action)),
      ).rejects.toMatchObject({ code: "permission-denied" });
      expect(await effects()).toEqual(before);
    },
  );
it("RATES027 replay rechecks current accountlock and role revocation", async () => {
  const data = mutation("save");
  await invoke(data);
  await db.doc(`users/${uid}`).set({ locked: true });
  const before = await effects();
  await expect(invoke(data)).rejects.toMatchObject({
    code: "permission-denied",
  });
  expect(await effects()).toEqual(before);
  await db.doc(`users/${uid}`).set({ locked: false });
  await db.doc(`staffAccess/${uid}`).set({ active: false, roles: ["OWNER"] });
  await expect(invoke(data)).rejects.toMatchObject({
    code: "permission-denied",
  });
  expect(await effects()).toEqual(before);
});
it("RATES027 missingaccount and unverified/nonGoogle denied", async () => {
  for (const bad of [
    { email_verified: false, firebase: { sign_in_provider: "google.com" } },
    { email_verified: true, firebase: { sign_in_provider: "password" } },
  ])
    await expect(invoke({ action: "read" }, bad)).rejects.toMatchObject({
      code: "permission-denied",
    });
  await db.doc(`users/${uid}`).delete();
  await expect(invoke({ action: "read" })).rejects.toMatchObject({
    code: "permission-denied",
  });
});
it("RATES027 OWNERfuturestring accepted, publish requires durable draft", async () => {
  await db
    .doc(`staffAccess/${uid}`)
    .set({ active: true, roles: ["OWNER", "FUTURE"] });
  expect(await invoke({ action: "read" })).toEqual({
    version: 0,
    config: null,
    publishedVersion: null,
  });
  const before = await effects();
  await expect(invoke(mutation("publish"))).rejects.toMatchObject({
    code: "failed-precondition",
  });
  expect(await effects()).toEqual(before);
});
it.each([null, -1, 1.5, "1", Number.MAX_SAFE_INTEGER + 1])(
  "RATES027 malformedstoredversion%j fails closed",
  async (version) => {
    await db.doc("settings/shippingRates").set({ version, config });
    const before = await effects();
    await expect(invoke({ action: "read" })).rejects.toMatchObject({
      code: "failed-precondition",
    });
    expect(await effects()).toEqual(before);
  },
);
it("RATES027 exhaustedstoredversion never increments or clears publication", async () => {
  await db
    .doc("settings/shippingRates")
    .set({ version: Number.MAX_SAFE_INTEGER, config });
  const before = await effects();
  await expect(
    invoke(mutation("delete", Number.MAX_SAFE_INTEGER - 1)),
  ).rejects.toMatchObject({ code: "aborted" });
  expect(await effects()).toEqual(before);
});
it("RATES027 MFA enforced before completed replay outside emulator bypass", async () => {
  const data = mutation("save");
  await invoke(data);
  const before = await effects(),
    prior = process.env.FUNCTIONS_EMULATOR;
  process.env.FUNCTIONS_EMULATOR = "false";
  try {
    await expect(invoke(data)).rejects.toMatchObject({
      code: "failed-precondition",
    });
    expect(await effects()).toEqual(before);
    const mfa = {
      ...token,
      auth_time: Math.floor(Date.now() / 1000),
      firebase: { ...token.firebase, sign_in_second_factor: "totp" },
    };
    expect(await invoke(data, mfa)).toMatchObject({ version: 1 });
  } finally {
    if (prior === undefined) delete process.env.FUNCTIONS_EMULATOR;
    else process.env.FUNCTIONS_EMULATOR = prior;
  }
});
it("RATES027 public rejects malformedconfig and ignores internaluid auditmetadata", async () => {
  await db.doc("shippingRatePublic/current").set({
    version: 1,
    disabled: false,
    config: { ...config, changedBy: uid },
  });
  await expect(publicRead()).rejects.toMatchObject({
    code: "failed-precondition",
  });
  await db.doc("shippingRatePublic/current").set({
    version: 1,
    disabled: false,
    config,
    changedBy: uid,
    privateNote: "localfixture",
  });
  expect(Object.keys(await publicRead()).sort()).toEqual([
    "config",
    "origin",
    "version",
  ]);
  await expect(publicRead({ uid })).rejects.toMatchObject({
    code: "invalid-argument",
  });
});
afterAll(async () => {
  await db.terminate();
  await deleteApp(getApp());
});

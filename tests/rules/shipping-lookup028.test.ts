import { initializeApp, deleteApp, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import type { CallableRequest } from "firebase-functions/v2/https";

let db: ReturnType<typeof getFirestore>;
let api: typeof import("../../functions/src/workspace");
const uid = `lookup028-${randomUUID()}`;
const id = "z".repeat(80);
const request = (data: unknown) =>
  ({
    auth: {
      uid,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  }) as CallableRequest;
beforeAll(async () => {
  initializeApp({
    projectId: `demo-satsunicgo-lookup-${randomUUID().slice(0, 8)}`,
  });
  db = getFirestore();
  api = await import("../../functions/src/workspace");
  for (const kind of ["packages", "consolidationBatches"]) {
    await db
      .collection(kind)
      .doc(id)
      .set({ version: 4, state: "PACKED", id: "forged-id" });
    await db.collection(kind).doc("aaa").set({ version: 1, state: "PACKED" });
  }
});
beforeEach(async () => {
  await db
    .doc(`staffAccess/${uid}`)
    .set({ active: true, locked: false, roles: ["WAREHOUSE"] });
  await db.doc(`users/${uid}`).set({ locked: false });
});
it.each(["packages", "consolidationBatches"])(
  "exact %s lookup returns canonical ID and only requested row",
  async (kind) => {
    const result = await api.listWork.run(request({ kind, id }));
    expect(result.rows).toEqual([{ id, version: 4, state: "PACKED" }]);
    expect(
      (await api.listWork.run(request({ kind, id: "missing" }))).rows,
    ).toEqual([]);
  },
);
it.each(["packages", "consolidationBatches"])(
  "%s lookup retains current role and revocation checks",
  async (kind) => {
    for (const access of [
      { active: true, roles: ["SUPPORT"] },
      { active: false, roles: ["WAREHOUSE"] },
      { active: true, locked: true, roles: ["OWNER"] },
    ]) {
      await db.doc(`staffAccess/${uid}`).set(access);
      await expect(
        api.listWork.run(request({ kind, id })),
      ).rejects.toMatchObject({ code: "permission-denied" });
    }
  },
);
it.each(["packages", "consolidationBatches"])(
  "%s rejects ambiguous cursor and unsafe ID",
  async (kind) => {
    for (const data of [
      { kind, id, after: "aaa" },
      { kind, id: id + "z" },
      { kind, id: "a/b" },
    ])
      await expect(api.listWork.run(request(data))).rejects.toMatchObject({
        code: "invalid-argument",
      });
  },
);
it("does not enable exact filters on unrelated private queues", async () => {
  await db.doc(`staffAccess/${uid}`).update({ roles: ["OWNER"] });
  await expect(
    api.listWork.run(request({ kind: "refunds", id })),
  ).rejects.toMatchObject({ code: "invalid-argument" });
});
afterAll(async () => {
  await db.terminate();
  await deleteApp(getApp());
});

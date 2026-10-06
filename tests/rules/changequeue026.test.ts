import { initializeApp, getApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { beforeAll, beforeEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
let db: ReturnType<typeof getFirestore>,
  api: typeof import("../../functions/src/workspace");
const uid = `cq026-${randomUUID()}`;
function req(data: unknown) {
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
function read(after?: string) {
  return api.listWork.run(
    req({
      kind: "orderChanges",
      changeState: "accepted",
      ...(after ? { after } : {}),
    }),
  );
}
async function seed(rows: { id: string; state: string; reviewedAt: number }[]) {
  const batch = db.batch();
  for (const { id, ...data } of rows)
    batch.set(db.doc(`orderChanges/${id}`), {
      ...data,
      ownerId: "synthetic-customer",
      orderId: "synthetic-order",
      version: 1,
    });
  await batch.commit();
}
beforeAll(async () => {
  initializeApp({
    projectId: `demo-satsunicgo-cq-${randomUUID().slice(0, 8)}`,
  });
  db = getFirestore();
  api = await import("../../functions/src/workspace");
});
beforeEach(async () => {
  const rows = await db.collection("orderChanges").get();
  const batch = db.batch();
  for (const row of rows.docs) batch.delete(row.ref);
  await batch.commit();
  await Promise.all([
    db.doc(`users/${uid}`).set({ locked: false }),
    db.doc(`staffAccess/${uid}`).set({ active: true, roles: ["OWNER"] }),
  ]);
});
it("CQ026 accepted proposal remains visible behind more than thirty closed records", async () => {
  await seed([
    ...Array.from({ length: 35 }, (_, i) => ({
      id: `a-closed-${String(i).padStart(2, "0")}`,
      state: "applied",
      reviewedAt: 1,
    })),
    { id: "z-current", state: "accepted", reviewedAt: 100 },
  ]);
  const result = await read();
  expect(result.rows.map((r) => r.id)).toEqual(["z-current"]);
  expect(result.next).toBeNull();
});
it("CQ026 thirty-one accepted records produce thirty rows then one without duplicates", async () => {
  await seed(
    Array.from({ length: 31 }, (_, i) => ({
      id: `accepted-${String(i).padStart(2, "0")}`,
      state: "accepted",
      reviewedAt: 1000 - i,
    })),
  );
  const first = await read();
  expect(first.rows.map((r) => r.id)).toEqual(
    Array.from(
      { length: 30 },
      (_, i) => `accepted-${String(i).padStart(2, "0")}`,
    ),
  );
  expect(first.next).toBe("accepted-29");
  const second = await read(first.next!);
  expect(second.rows.map((r) => r.id)).toEqual(["accepted-30"]);
  expect(second.next).toBeNull();
});
it("CQ026 exactly thirty accepted records have no next cursor", async () => {
  await seed(
    Array.from({ length: 30 }, (_, i) => ({
      id: `accepted-${i}`,
      state: "accepted",
      reviewedAt: i,
    })),
  );
  const result = await read();
  expect(result.rows).toHaveLength(30);
  expect(result.next).toBeNull();
});
it("CQ026 reviewed timestamp descending then document ID ascending is deterministic", async () => {
  await seed([
    { id: "a-old", state: "accepted", reviewedAt: 10 },
    { id: "z-new", state: "accepted", reviewedAt: 20 },
    { id: "a-new", state: "accepted", reviewedAt: 20 },
  ]);
  expect((await read()).rows.map((r) => r.id)).toEqual([
    "a-new",
    "z-new",
    "a-old",
  ]);
});
it("CQ026 cursor for a proposal no longer accepted rejects", async () => {
  await seed([{ id: "closed-cursor", state: "applied", reviewedAt: 20 }]);
  await expect(read("closed-cursor")).rejects.toMatchObject({
    code: "invalid-argument",
  });
});
it("CQ026 missing cursor rejects", async () => {
  await expect(read("missing-cursor")).rejects.toMatchObject({
    code: "invalid-argument",
  });
});
it("CQ026 change state cannot be used with another kind", async () => {
  await expect(
    api.listWork.run(req({ kind: "orders", changeState: "accepted" })),
  ).rejects.toMatchObject({ code: "invalid-argument" });
});
it("CQ026 operations manager retains accepted queue access", async () => {
  await db
    .doc(`staffAccess/${uid}`)
    .set({ active: true, roles: ["OPERATIONS_MANAGER"] });
  await seed([{ id: "accepted", state: "accepted", reviewedAt: 10 }]);
  expect((await read()).rows.map((r) => r.id)).toEqual(["accepted"]);
});
it("CQ026 support role cannot access accepted operations queue", async () => {
  await db.doc(`staffAccess/${uid}`).set({ active: true, roles: ["SUPPORT"] });
  await expect(read()).rejects.toMatchObject({ code: "permission-denied" });
});
it("CQ026 existing locked staff guard remains effective", async () => {
  await db
    .doc(`staffAccess/${uid}`)
    .set({ active: true, roles: ["OWNER"], locked: true });
  await expect(read()).rejects.toMatchObject({ code: "permission-denied" });
});
it("CQ026 legacy unfiltered query preserves ID ordering, thirty limit and existing cursor contract", async () => {
  await seed(
    Array.from({ length: 31 }, (_, i) => ({
      id: `legacy-${String(i).padStart(2, "0")}`,
      state: i === 30 ? "accepted" : "applied",
      reviewedAt: 100 - i,
    })),
  );
  const result = await api.listWork.run(req({ kind: "orderChanges" }));
  expect(result.rows.map((r) => r.id)).toEqual(
    Array.from(
      { length: 30 },
      (_, i) => `legacy-${String(i).padStart(2, "0")}`,
    ),
  );
  expect(result.next).toBe("legacy-29");
  const tail = await api.listWork.run(
    req({ kind: "orderChanges", after: result.next }),
  );
  expect(tail.rows.map((r) => r.id)).toEqual(["legacy-30"]);
  expect(tail.next).toBeNull();
});
afterAll(async () => {
  await db.terminate();
  await deleteApp(getApp());
});

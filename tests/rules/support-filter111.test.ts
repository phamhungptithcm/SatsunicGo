import { beforeAll, afterAll, test, expect } from "vitest";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
if (
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  !["127.0.0.1:18207", "127.0.0.1:8181"].includes(
    process.env.FIRESTORE_EMULATOR_HOST ?? "",
  )
)
  throw Error("Shared demo emulator required");
const prefix = `zzzz-support111-${randomUUID()}`,
  uid = `${prefix}-staff`;
const app = initializeApp({ projectId: "demo-satsunicgo" });
const db = getFirestore(app),
  owned: string[] = [];
let api: typeof import("../../functions/src/workspace");
const req = (data: unknown, user = uid) =>
  ({
    auth: {
      uid: user,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  }) as never;
beforeAll(async () => {
  api = await import("../../functions/src/workspace");
  const batch = db.batch();
  for (const [id, roles] of [
    [uid, ["SUPPORT"]],
    [`${uid}-buyer`, ["BUYER"]],
  ] as const) {
    const path = `staffAccess/${id}`;
    owned.push(path);
    batch.set(db.doc(path), { active: true, roles: [...roles] });
  }
  for (let n = 0; n < 65; n++) {
    const path = `supportTickets/${prefix}-${String(n).padStart(3, "0")}`;
    owned.push(path);
    batch.set(db.doc(path), {
      status: n % 2 ? "resolved" : "open",
      version: 1,
      subject: "Synthetic filter111",
      message: "Fixture only",
      ownerId: prefix,
    });
  }
  await batch.commit();
});
afterAll(async () => {
  const batch = db.batch();
  for (const path of owned) batch.delete(db.doc(path));
  await batch.commit();
  await deleteApp(app);
});
test("filter applies before limit and pagination preserves status", async () => {
  const first = await api.listWork.run(
    req({
      kind: "supportTickets",
      supportStatus: "open",
      after: `${prefix}-000`,
    }),
  );
  expect(first.rows).toHaveLength(30);
  expect(first.rows.every((r) => "status" in r && r.status === "open")).toBe(
    true,
  );
  expect(first.rows[0].id).toBe(`${prefix}-002`);
  expect(first.rows[29].id).toBe(`${prefix}-060`);
  const second = await api.listWork.run(
    req({ kind: "supportTickets", supportStatus: "open", after: first.next }),
  );
  expect(
    second.rows.filter((r) => r.id.startsWith(prefix)).map((r) => r.id),
  ).toEqual([`${prefix}-062`, `${prefix}-064`]);
});
test("reject invalid status, wrong collection, mismatched cursor and unauthorized role", async () => {
  for (const data of [
    { kind: "supportTickets", supportStatus: "unknown" },
    { kind: "orders", supportStatus: "open" },
    { kind: "supportTickets", supportStatus: "open", after: `${prefix}-001` },
  ])
    await expect(api.listWork.run(req(data))).rejects.toMatchObject({
      code: "invalid-argument",
    });
  await expect(
    api.listWork.run(
      req({ kind: "supportTickets", supportStatus: "open" }, `${uid}-buyer`),
    ),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
test("target respects status; unfiltered target is compatible", async () => {
  expect(
    (
      await api.listWork.run(
        req({
          kind: "supportTickets",
          id: `${prefix}-001`,
          supportStatus: "open",
        }),
      )
    ).rows,
  ).toHaveLength(0);
  expect(
    (
      await api.listWork.run(
        req({ kind: "supportTickets", id: `${prefix}-001` }),
      )
    ).rows,
  ).toHaveLength(1);
});

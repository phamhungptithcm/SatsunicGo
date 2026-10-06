import { beforeAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
let api: typeof import("../../functions/src/workspace"),
  db: ReturnType<typeof getFirestore>;
const prefix = `workspace025-${randomUUID()}`,
  id = `${prefix}-order`,
  owner = `${prefix}-customer`;
const req = (uid: string, data: unknown) =>
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
  await import("../../functions/src/index");
  api = await import("../../functions/src/workspace");
  db = getFirestore();
  await db.doc(`orders/${id}`).set({ ownerId: owner, version: 1 });
});
it.each([
  { label: "truthy inactive", active: "false", roles: ["OWNER"], orderIds: [] },
  { label: "substring roles", active: true, roles: "NOT_OWNER", orderIds: [] },
  { label: "object roles", active: true, roles: {}, orderIds: [] },
  {
    label: "substring assignment",
    active: true,
    roles: ["BUYER"],
    orderIds: `prefix-${id}-suffix`,
  },
])(
  "WORK025 malformed $label cannot read private order",
  async ({ label, ...access }) => {
    const uid = `${prefix}-${label.replaceAll(" ", "-")}`;
    await db.doc(`staffAccess/${uid}`).set(access);
    await expect(
      api.listWork.run(req(uid, { kind: "orders", id })),
    ).rejects.toMatchObject({ code: "permission-denied" });
  },
);
it("WORK025 exact array assignment retains buyer access and blocks other orders", async () => {
  const uid = `${prefix}-valid`;
  await db
    .doc(`staffAccess/${uid}`)
    .set({ active: true, roles: ["BUYER"], orderIds: [id] });
  expect(
    (await api.listWork.run(req(uid, { kind: "orders", id }))).rows,
  ).toHaveLength(1);
  await expect(
    api.listWork.run(req(uid, { kind: "orders", id: `${id}-other` })),
  ).rejects.toMatchObject({ code: "permission-denied" });
});

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { beforeAll, expect, test } from "vitest";
import type { CallableRequest } from "firebase-functions/v2/https";
import { workspaceCommand } from "../../functions/src/workspace";
const owner = "ask106-owner",
  other = "ask106-customer";
let db: ReturnType<typeof getFirestore>;
beforeAll(async () => {
  if (
    process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
    !process.env.GCLOUD_PROJECT?.startsWith("demo-satsunicgo-ask106")
  )
    throw Error("Dedicated test namespace required");
  initializeApp({ projectId: process.env.GCLOUD_PROJECT });
  db = getFirestore();
  await db.doc(`staffAccess/${owner}`).set({ active: true, roles: ["OWNER"] });
});
function req(uid: string, data: unknown) {
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
const command = (payload: unknown, extra: Record<string, unknown> = {}) => ({
  action: "saveAskPilotPolicy",
  operationId: randomUUID(),
  payload,
  ...extra,
});
test("real transaction rejects nonowner and client-controlled pilot UID or budget", async () => {
  await expect(
    workspaceCommand.run(req(other, command({ enabled: false }))),
  ).rejects.toMatchObject({ code: "permission-denied" });
  for (const payload of [
    { enabled: false, pilotUid: other },
    { enabled: false, reservedVnd: 0 },
    { enabled: false, maxBudgetVnd: 100000 },
  ])
    await expect(
      workspaceCommand.run(req(owner, command(payload))),
    ).rejects.toMatchObject({ code: "invalid-argument" });
});
test("enabling cannot skip recent MFA or provider verification", async () => {
  await expect(
    workspaceCommand.run(req(owner, command({ enabled: true }))),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
test("disable is owner-only, versioned and idempotent; does not reset lifetime budget", async () => {
  await db.doc("aiPilotBudget/lifetime").set({ reservedVnd: 7000 });
  const input = command({ enabled: false });
  const result = await workspaceCommand.run(req(owner, input));
  expect(await workspaceCommand.run(req(owner, input))).toEqual(result);
  const stored = (await db.doc("settings/askPaidPilot").get()).data();
  expect(stored).toMatchObject({
    enabled: false,
    pilotUid: owner,
    maxBudgetVnd: 10000,
    version: 1,
  });
  expect(
    (await db.doc("aiPilotBudget/lifetime").get()).data()?.reservedVnd,
  ).toBe(7000);
  await expect(
    workspaceCommand.run(
      req(owner, command({ enabled: false }, { expectedVersion: 0 })),
    ),
  ).rejects.toMatchObject({ code: "aborted" });
  await db.doc(`staffAccess/${owner}`).update({ active: false });
  await expect(workspaceCommand.run(req(owner, input))).rejects.toMatchObject({
    code: "permission-denied",
  });
});

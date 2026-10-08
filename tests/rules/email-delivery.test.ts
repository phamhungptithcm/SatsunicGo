import { syntheticProviderAllowed } from "../helpers/synthetic-provider-gate";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
const local = vi.hoisted(() => ({
  uid: "email021-worker",
  send: vi.fn(async () => {}),
}));
vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({ sendMail: local.send, close: () => {} }),
  },
}));
vi.mock("firebase-functions/params", () => ({
  defineSecret: () => ({ value: () => "synthetic-not-a-credential" }),
}));
vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({
    getUser: async () => ({
      email: "fixture@example.invalid",
      emailVerified: true,
      disabled: false,
    }),
  }),
}));
vi.mock("firebase-admin/firestore", async (actual) => {
  const m = await actual<typeof import("firebase-admin/firestore")>();
  return {
    ...m,
    getFirestore: () => {
      const db = m.getFirestore();
      return new Proxy(db, {
        get(target, key) {
          if (key === "doc")
            return (path: string) =>
              path === "settings/email"
                ? {
                    path: "settings/email",
                    get: async () => ({
                      data: () => ({
                        enabled: true,
                        host: "example.invalid",
                        user: "synthetic",
                        from: "fixture@example.invalid",
                        messageIdDomain: "example.invalid",
                      }),
                    }),
                  }
                : target.doc(path);
          if (key === "runTransaction")
            return (
              fn: (
                tx: import("firebase-admin/firestore").Transaction,
              ) => Promise<unknown>,
            ) =>
              target.runTransaction((tx) =>
                fn(
                  new Proxy(tx, {
                    get(transaction, field) {
                      if (field === "get")
                        return (
                          ref: import("firebase-admin/firestore").DocumentReference,
                        ) =>
                          ref.path === "settings/email"
                            ? Promise.resolve({
                                exists: true,
                                data: () => ({
                                  enabled: true,
                                  host: "example.invalid",
                                  user: "synthetic",
                                  from: "fixture@example.invalid",
                                  messageIdDomain: "example.invalid",
                                }),
                              })
                            : transaction.get(ref);
                      const value = Reflect.get(transaction, field);
                      return typeof value === "function"
                        ? value.bind(transaction)
                        : value;
                    },
                  }),
                ),
              );
          if (key === "collection")
            return (path: string) =>
              path === "outboxJobs"
                ? target.collection(path).where("ownerId", "==", local.uid)
                : target.collection(path);
          const value = Reflect.get(target, key);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
    },
  };
});
let deliver: typeof import("../../functions/src/email").deliverEmail,
  command: typeof import("../../functions/src/outbox-command").outboxCommand,
  db: ReturnType<typeof getFirestore>;
function req(data: unknown) {
  return {
    auth: {
      uid: local.uid,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  } as CallableRequest;
}
beforeAll(async () => {
  local.uid = `email021-${randomUUID()}`;
  initializeApp({
    projectId: `demo-satsunicgo-email-${randomUUID().slice(0, 8)}`,
  });
  ({ deliverEmail: deliver } = await import("../../functions/src/email"));
  ({ outboxCommand: command } =
    await import("../../functions/src/outbox-command"));
  db = getFirestore();
  await db
    .doc(`staffAccess/${local.uid}`)
    .set({ active: true, roles: ["OWNER"] });
});
it("unknown SMTP outcomes need versioned reconciliation; cannot blindly retry or overwrite a resolution with a late worker", async () => {
  const id = `email021-${randomUUID()}`,
    ref = db.doc(`outboxJobs/${id}`);
  await ref.set({
    ownerId: local.uid,
    action: "catalogCheckout",
    state: "inAppDelivered",
    emailState: "queued",
    emailAttempts: 0,
    version: 0,
    createdAt: Date.now(),
  });
  local.send.mockImplementationOnce(async () => {
    throw Error("synthetic timeout after send");
  });
  await deliver.run({ scheduleTime: new Date().toISOString() });
  expect((await ref.get()).data()).toMatchObject({
    emailState: "unknown",
    version: 2,
  });
  await expect(
    command.run(
      req({
        id,
        action: "retry",
        expectedVersion: 2,
        operationId: randomUUID(),
      }),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await expect(
    command.run(
      req({
        id,
        action: "resolveUnknown",
        expectedVersion: 2,
        operationId: randomUUID(),
        outcome: "confirmed_not_sent",
      }),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  const resolution = {
    id,
    action: "resolveUnknown",
    expectedVersion: 2,
    operationId: randomUUID(),
    outcome: "confirmed_not_sent",
    evidence: "Synthetic provider readback, no real email",
  };
  expect(await command.run(req(resolution))).toEqual({ version: 3 });
  expect(await command.run(req(resolution))).toEqual({ version: 3 });
  await command.run(
    req({ id, action: "retry", expectedVersion: 3, operationId: randomUUID() }),
  );
  local.send.mockImplementationOnce(async () => {
    await ref.update({ emailState: "unknown", version: 6 });
    await command.run(
      req({
        id,
        action: "resolveUnknown",
        expectedVersion: 6,
        operationId: randomUUID(),
        outcome: "confirmed_not_sent",
        evidence: "Synthetic confirmed not sent",
      }),
    );
  });
  await deliver.run({ scheduleTime: new Date().toISOString() });
  expect((await ref.get()).data()).toMatchObject({
    emailState: "failed",
    version: 7,
  });
  expect(
    (
      await db
        .collection("auditEvents")
        .where("resourceId", "==", id)
        .where("action", "==", "emailLateOutcome")
        .get()
    ).size,
  ).toBe(1);
});

afterAll(async () => {
  await db.terminate();
  const { getApp } = await import("firebase-admin/app");
  await deleteApp(getApp());
});

// Exercise only synthetic provider transaction cores; real release-gate tests remain unmocked.
vi.mock("../../functions/src/provider-release-gate", async (actual) => {
  const original = await actual<typeof import("../../functions/src/provider-release-gate")>();
  return { ...original, releaseCapabilityAllowed: syntheticProviderAllowed };
});

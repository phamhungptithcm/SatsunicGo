import { beforeEach, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({
  exerciseProviderBody: true,
  firestoreAccess: vi.fn(),
  secretAccess: vi.fn(),
  authAccess: vi.fn(),
  transportAccess: vi.fn(),
  rows: new Map<string, Record<string, unknown>>(),
  send: vi.fn(async () => {}),
  close: vi.fn(),
}));
vi.mock("../../functions/src/provider-release-gate", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../functions/src/provider-release-gate")>();
  return {
    ...actual,
    releaseCapabilityAllowed: (...args: Parameters<typeof actual.releaseCapabilityAllowed>) =>
      fixture.exerciseProviderBody && args[0] === "email" ? true : actual.releaseCapabilityAllowed(...args),
  };
});
vi.mock("firebase-functions/params", () => ({
  defineSecret: () => ({ value: () => { fixture.secretAccess(); return "synthetic"; } }),
}));
vi.mock("firebase-admin/auth", () => ({
  getAuth: () => { fixture.authAccess(); return ({
    getUser: async () => ({
      email: "fixture@example.invalid",
      emailVerified: true,
      disabled: false,
    }),
  }); },
}));
vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => { fixture.transportAccess(); return { sendMail: fixture.send, close: fixture.close }; },
  },
}));
vi.mock("firebase-admin/firestore", () => {
  function doc(path: string) {
    if (!path || path.split("/").length % 2 || path.split("/").some((p) => !p))
      throw Error("Invalid document path");
    return {
      path,
      id: path.split("/").at(-1),
      get: async () => snapshot(path),
    };
  }
  function snapshot(path: string) {
    return {
      ref: doc(path),
      id: path.split("/").at(-1),
      data: () => fixture.rows.get(path),
    };
  }
  const db = {
    doc,
    collection: (path: string) => ({
      doc: () => doc(`${path}/audit`),
      where: (_field: string, _op: string, state: string) => ({
        limit: () => ({
          get: async () => ({
            docs: [...fixture.rows]
              .filter(
                ([p, d]) => p.startsWith(`${path}/`) && d.emailState === state,
              )
              .map(([p]) => snapshot(p)),
          }),
        }),
      }),
    }),
    runTransaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        get: async (ref: { path: string }) => snapshot(ref.path),
        update: (ref: { path: string }, data: Record<string, unknown>) =>
          fixture.rows.set(ref.path, {
            ...fixture.rows.get(ref.path),
            ...data,
          }),
        create: () => {},
      }),
  };
  return { getFirestore: () => { fixture.firestoreAccess(); return db; } };
});
import { deliverEmail } from "../../functions/src/email";
beforeEach(() => {
  fixture.exerciseProviderBody = true;
  fixture.firestoreAccess.mockClear();
  fixture.secretAccess.mockClear();
  fixture.authAccess.mockClear();
  fixture.transportAccess.mockClear();
  fixture.rows.clear();
  fixture.send.mockReset();
  fixture.close.mockReset();
  fixture.rows.set("settings/email", {
    enabled: true,
    host: "example.invalid",
    user: "synthetic",
    from: "fixture@example.invalid",
    messageIdDomain: "example.invalid",
  });
});
it.each(["", "nested/id", "nested/id/valid", undefined])(
  "invalid invoice document ID %s does not starve later queued email",
  async (documentId) => {
    fixture.rows.set("outboxJobs/bad", {
      ownerId: "owner",
      action: "invoiceIssued",
      documentId,
      emailState: "queued",
      version: 0,
    });
    fixture.rows.set("outboxJobs/good", {
      ownerId: "owner",
      action: "catalogCheckout",
      emailState: "queued",
      version: 0,
    });
    await deliverEmail.run({ scheduleTime: new Date().toISOString() });
    expect(fixture.rows.get("outboxJobs/bad")).toMatchObject({
      emailState: "blocked_document",
      version: 1,
    });
    expect(fixture.rows.get("outboxJobs/good")).toMatchObject({
      emailState: "sent",
      version: 2,
    });
    expect(fixture.send).toHaveBeenCalledTimes(1);
    expect(fixture.close).toHaveBeenCalledTimes(1);
  },
);
it("SMTP uncertainty persists reconciliation-required and never resends automatically", async () => {
  fixture.rows.set("outboxJobs/job", {
    ownerId: "owner",
    action: "catalogCheckout",
    emailState: "queued",
    version: 0,
  });
  fixture.send.mockRejectedValueOnce(Error("synthetic timeout"));
  await deliverEmail.run({ scheduleTime: new Date().toISOString() });
  expect(fixture.rows.get("outboxJobs/job")).toMatchObject({
    emailState: "unknown",
    reconciliationRequired: true,
    version: 2,
  });
  await deliverEmail.run({ scheduleTime: new Date().toISOString() });
  expect(fixture.send).toHaveBeenCalledTimes(1);
});
it("a current issued invoice with matching owner and number still sends", async () => {
  fixture.rows.set("outboxJobs/invoice", {
    ownerId: "owner",
    action: "invoiceIssued",
    documentId: "invoice-123",
    documentNumber: "SG-20261005",
    emailState: "queued",
    version: 0,
  });
  fixture.rows.set("salesDocuments/invoice-123", {
    state: "issued",
    ownerId: "owner",
    issueNumber: "SG-20261005",
  });
  await deliverEmail.run({ scheduleTime: new Date().toISOString() });
  expect(fixture.rows.get("outboxJobs/invoice")).toMatchObject({
    emailState: "sent",
    version: 2,
  });
  expect(fixture.send).toHaveBeenCalledTimes(1);
});
it("abandoned sending claims require reconciliation and are not resent", async () => {
  fixture.rows.set("outboxJobs/abandoned", {
    ownerId: "owner",
    emailState: "sending",
    version: 4,
    claimedAt: Date.now() - 1000000,
  });
  await deliverEmail.run({ scheduleTime: new Date().toISOString() });
  expect(fixture.rows.get("outboxJobs/abandoned")).toMatchObject({
    emailState: "unknown",
    reconciliationRequired: true,
    version: 5,
  });
  expect(fixture.send).not.toHaveBeenCalled();
});
it("late SMTP outcome cannot overwrite a reconciled job", async () => {
  fixture.rows.set("outboxJobs/late", {
    ownerId: "owner",
    action: "catalogCheckout",
    emailState: "queued",
    version: 0,
  });
  fixture.send.mockImplementationOnce(async () => {
    fixture.rows.set("outboxJobs/late", {
      ownerId: "owner",
      emailState: "failed",
      version: 3,
    });
  });
  await deliverEmail.run({ scheduleTime: new Date().toISOString() });
  expect(fixture.rows.get("outboxJobs/late")).toMatchObject({
    emailState: "failed",
    version: 3,
  });
});

it("actual code-owned email hold denies before every port despite enabled config and queued work", async () => {
  fixture.exerciseProviderBody = false;
  fixture.rows.set("outboxJobs/held", {
    ownerId: "owner", action: "catalogCheckout", emailState: "queued", version: 0,
  });
  const before = structuredClone([...fixture.rows.entries()]);
  await deliverEmail.run({ scheduleTime: new Date().toISOString() });
  expect(fixture.firestoreAccess).not.toHaveBeenCalled();
  expect(fixture.secretAccess).not.toHaveBeenCalled();
  expect(fixture.authAccess).not.toHaveBeenCalled();
  expect(fixture.transportAccess).not.toHaveBeenCalled();
  expect(fixture.send).not.toHaveBeenCalled();
  expect(fixture.close).not.toHaveBeenCalled();
  expect([...fixture.rows.entries()]).toEqual(before);
});

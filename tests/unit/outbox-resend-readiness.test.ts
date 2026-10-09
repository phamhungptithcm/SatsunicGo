import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  rows: new Map<string, Record<string, unknown>>(),
  projectId: "satsunicgo",
  options: {} as Record<string, unknown>,
  audits: 0,
}));
vi.mock("firebase-functions/v2/https", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase-functions/v2/https")>()),
  onCall: (options: Record<string, unknown>, handler: unknown) => {
    fixture.options = options;
    return { run: handler };
  },
}));
vi.mock("firebase-admin/firestore", () => {
  const doc = (path: string) => ({ path });
  const db = {
    get projectId() {
      return fixture.projectId;
    },
    doc,
    collection: (path: string) => ({
      doc: () => doc(`${path}/audit-${++fixture.audits}`),
    }),
    runTransaction: async <T>(body: (tx: unknown) => Promise<T>) => {
      const writes: (() => void)[] = [];
      const result = await body({
        get: async (ref: { path: string }) => ({
          exists: fixture.rows.has(ref.path),
          data: () => fixture.rows.get(ref.path),
        }),
        update: (ref: { path: string }, value: Record<string, unknown>) =>
          writes.push(() =>
            fixture.rows.set(ref.path, {
              ...fixture.rows.get(ref.path),
              ...value,
            }),
          ),
        create: (ref: { path: string }, value: Record<string, unknown>) =>
          writes.push(() => {
            if (fixture.rows.has(ref.path)) throw Error("DUPLICATE_CREATE");
            fixture.rows.set(ref.path, value);
          }),
      });
      writes.forEach((write) => write());
      return result;
    },
  };
  return { getFirestore: () => db };
});
import { outboxCommand } from "../../functions/src/outbox-command";

const now = Date.UTC(2026, 9, 9, 12);
const config = {
  approved: true,
  provider: "resend",
  enabled: true,
  subscriptionsEnabled: true,
  from: "contact@hunpeolabs.com",
  verifiedDomain: "hunpeolabs.com",
  cutoverAt: now - 1,
  dailyAttemptLimit: 100,
  domainVerificationEvidenceId: "release/domain-1",
  domainVerifiedAt: now - 1,
};
function request(data: unknown, token: Record<string, unknown> = {}) {
  return {
    data,
    auth: {
      uid: "operator",
      token: {
        email_verified: true,
        auth_time: now / 1000,
        firebase: {
          sign_in_provider: "google.com",
          sign_in_second_factor: "totp",
        },
        ...token,
      },
    },
  } as CallableRequest;
}
const command = () => ({
  id: "job",
  action: "retry",
  expectedVersion: 2,
  operationId: randomUUID(),
});
const call = (data = command(), token?: Record<string, unknown>) =>
  outboxCommand.run(request(data, token));
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("GOOGLE_CLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("FUNCTIONS_EMULATOR", "false");
  vi.stubEnv("FIRESTORE_EMULATOR_HOST", undefined);
  vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", undefined);
  fixture.rows.clear();
  fixture.audits = 0;
  fixture.projectId = "satsunicgo";
  fixture.rows.set("users/operator", { locked: false });
  fixture.rows.set("staffAccess/operator", {
    active: true,
    locked: false,
    roles: ["OWNER"],
  });
  fixture.rows.set("users/customer", { locked: false });
  fixture.rows.set("outboxJobs/job", {
    ownerId: "customer",
    version: 2,
    emailState: "blocked_external",
    emailAttempts: 0,
  });
  fixture.rows.set("settings/email", { ...config });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("staff outbox retry with production Resend readiness", () => {
  test("ready Resend config queues once with idempotent result, audit and no quota/send attempt", async () => {
    const data = command();
    expect(await call(data)).toEqual({ version: 3 });
    expect(await call(data)).toEqual({ version: 3 });
    expect(fixture.rows.get("outboxJobs/job")).toMatchObject({
      emailState: "queued",
      version: 3,
      emailAttempts: 0,
    });
    expect(
      [...fixture.rows.keys()].filter((path) =>
        path.startsWith("auditEvents/"),
      ),
    ).toHaveLength(1);
    expect(
      [...fixture.rows.keys()].some((path) =>
        path.startsWith("emailDispatchQuota/"),
      ),
    ).toBe(false);
    expect(fixture.options.enforceAppCheck).toBe(true);
  });
  test.each([
    { enabled: false },
    { provider: "smtp" },
    { approved: false },
    { from: "other@hunpeolabs.com" },
    { dailyAttemptLimit: 101 },
    { domainVerificationEvidenceId: undefined },
    { domainVerifiedAt: undefined },
  ])("invalid/unverified config does not queue: %j", async (delta) => {
    fixture.rows.set("settings/email", { ...config, ...delta });
    await expect(call()).rejects.toMatchObject({ code: "failed-precondition" });
    expect(fixture.rows.get("outboxJobs/job")?.emailState).toBe(
      "blocked_external",
    );
    expect(
      [...fixture.rows.keys()].some(
        (path) =>
          path.startsWith("auditEvents/") ||
          path.startsWith("idempotencyKeys/"),
      ),
    ).toBe(false);
  });
  test("legacy SMTP settings cannot enable the new retry path", async () => {
    fixture.rows.set("settings/email", {
      enabled: true,
      host: "smtp.example.invalid",
      user: "operator",
      from: config.from,
      messageIdDomain: "hunpeolabs.com",
    });
    await expect(call()).rejects.toMatchObject({ code: "failed-precondition" });
  });
  test.each(["demo-satsunicgo", "other-project", ""])(
    "actual database project %s cannot queue",
    async (project) => {
      fixture.projectId = project;
      await expect(call()).rejects.toMatchObject({
        code: "failed-precondition",
      });
    },
  );
  test.each([
    ["GCLOUD_PROJECT", "demo-satsunicgo"],
    ["GOOGLE_CLOUD_PROJECT", "other-project"],
    ["FUNCTIONS_EMULATOR", "true"],
    ["FIRESTORE_EMULATOR_HOST", "127.0.0.1:18207"],
  ])("runtime identity conflict %s prevents retry", async (key, value) => {
    vi.stubEnv(key, value);
    await expect(call()).rejects.toMatchObject({ code: "failed-precondition" });
  });
  test.each([
    { emailState: "failed", emailAttempts: 3 },
    { emailState: "unknown", emailAttempts: 1 },
    { emailState: "blocked_external", emailAttempts: 1 },
    { emailState: "failed", reconciliationRequired: true },
  ])("attempt/reconciliation fences remain: %j", async (delta) => {
    fixture.rows.set("outboxJobs/job", {
      ...fixture.rows.get("outboxJobs/job"),
      ...delta,
    });
    await expect(call()).rejects.toMatchObject({ code: "failed-precondition" });
  });
  test("unknown can be reconciled with evidence while transport remains disabled", async () => {
    fixture.rows.delete("settings/email");
    fixture.rows.set("outboxJobs/job", {
      ownerId: "customer",
      version: 2,
      emailState: "unknown",
      emailAttempts: 1,
      reconciliationRequired: true,
    });
    const data = {
      ...command(),
      action: "resolveUnknown",
      outcome: "confirmed_sent",
      evidence: "Synthetic provider verification receipt",
    };
    expect(await outboxCommand.run(request(data))).toEqual({ version: 3 });
    expect(fixture.rows.get("outboxJobs/job")).toMatchObject({
      emailState: "sent",
      emailAttempts: 1,
      reconciliationRequired: false,
      resolution: { outcome: "confirmed_sent", actor: "operator", at: now },
    });
  });
  test("unknown cannot be reconciled without explicit outcome and evidence", async () => {
    fixture.rows.set("outboxJobs/job", {
      ownerId: "customer",
      version: 2,
      emailState: "unknown",
    });
    await expect(
      outboxCommand.run(request({ ...command(), action: "resolveUnknown" })),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });
  test("MFA must be recent and this session must be verified Google", async () => {
    await expect(
      call(command(), { firebase: { sign_in_provider: "google.com" } }),
    ).rejects.toMatchObject({
      code: "permission-denied",
      details: { reason: "RECENT_MFA_REQUIRED" },
    });
    await expect(
      call(command(), { auth_time: (now - 300_000) / 1000 }),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await expect(
      call(command(), {
        firebase: {
          sign_in_provider: "password",
          sign_in_second_factor: "totp",
        },
      }),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });
  test("role, account lock, version and operation conflict controls are preserved", async () => {
    fixture.rows.set("staffAccess/operator", {
      active: true,
      roles: ["CUSTOMER_SUPPORT"],
    });
    await expect(call()).rejects.toMatchObject({ code: "permission-denied" });
    fixture.rows.set("staffAccess/operator", {
      active: true,
      roles: ["OPERATIONS_MANAGER"],
    });
    fixture.rows.set("users/customer", { locked: true });
    await expect(call()).rejects.toMatchObject({ code: "failed-precondition" });
    fixture.rows.set("users/customer", { locked: false });
    await expect(
      call({ ...command(), expectedVersion: 1 }),
    ).rejects.toMatchObject({ code: "aborted" });
    const data = command();
    await call(data);
    await expect(call({ ...data, expectedVersion: 3 })).rejects.toMatchObject({
      code: "already-exists",
    });
  });
});

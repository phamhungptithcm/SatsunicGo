import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CallableRequest } from "firebase-functions/v2/https";
const memory = vi.hoisted(() => ({
  records: new Map<string, Record<string, unknown>>(),
  writes: [] as string[],
  sequence: 0,
}));
vi.mock("firebase-admin/firestore", () => {
  type Data = Record<string, unknown>;
  const ref = (path: string) => ({
    path,
    get: async () => snapshot(path),
    collection: (child: string) => collection(`${path}/${child}`),
  });
  const collection = (path: string) => ({
    doc: (id = `auto-${++memory.sequence}`) => ref(`${path}/${id}`),
  });
  const snapshot = (path: string) => ({
    exists: memory.records.has(path),
    data: () => structuredClone(memory.records.get(path)),
  });
  const get = async (r: ReturnType<typeof ref>) => snapshot(r.path);
  return {
    getFirestore: () => ({
      projectId: "satsunicgo",
      doc: ref,
      collection,
      runTransaction: async (work: (tx: unknown) => Promise<unknown>) => {
        const pending: (() => void)[] = [];
        let writing = false;
        const read = (r: ReturnType<typeof ref>) => {
          if (writing) throw Error("READ_AFTER_WRITE");
          return get(r);
        };
        const write = (
          r: ReturnType<typeof ref>,
          value: Data,
          create = false,
        ) => {
          writing = true;
          pending.push(() => {
            if (create && memory.records.has(r.path))
              throw Error("ALREADY_EXISTS");
            memory.records.set(r.path, {
              ...(create ? {} : memory.records.get(r.path)),
              ...structuredClone(value),
            });
            memory.writes.push(r.path);
          });
        };
        const result = await work({
          get: read,
          getAll: (...refs: ReturnType<typeof ref>[]) =>
            Promise.all(refs.map(read)),
          create: (r: ReturnType<typeof ref>, value: Data) =>
            write(r, value, true),
          update: write,
          set: write,
        });
        pending.forEach((commit) => commit());
        return result;
      },
    }),
  };
});
import { getFirestore } from "firebase-admin/firestore";
import { orderConversationCommand } from "../../functions/src/order-conversation";
import { projectCustomerNotification } from "../../functions/src/customer-notification-delivery";
import { prepareCustomerEmail } from "../../functions/src/customer-email-job";
import {
  customerEvent,
  customerEventFields,
} from "../../functions/src/customer-notification-events";
import { emptyNotificationPreferences } from "../../packages/domain/notification-preferences";

const now = 1_791_591_000_000;
const provenance = {
  executionMode: "production_test",
  executionPolicyVersion: 1,
  testRunId: "00000000-0000-4000-8000-000000000001",
  testMode: true,
};
const operationId = "00000000-0000-4000-8000-000000000002";
const jobId = `conversation-staff-${operationId}`;
const put = (path: string, data: Record<string, unknown>) =>
  memory.records.set(path, structuredClone(data));
const request = (uid = "staff", extra = {}) =>
  ({
    auth: {
      uid,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data: {
      action: "message",
      orderId: "order",
      operationId,
      expectedVersion: 0,
      text: "Mẫu bạn chọn còn hàng.",
      ...extra,
    },
  }) as unknown as CallableRequest;
const reply = (uid = "staff", extra = {}) =>
  orderConversationCommand.run(request(uid, extra));
const project = () => projectCustomerNotification(getFirestore(), jobId, now);
const getJob = () => memory.records.get(`outboxJobs/${jobId}`)!;

beforeEach(() => {
  memory.records.clear();
  memory.writes = [];
  memory.sequence = 0;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(now);
  vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", "v1");
  vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("GOOGLE_CLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("FIREBASE_CONFIG", JSON.stringify({ projectId: "satsunicgo" }));
  for (const key of [
    "FUNCTIONS_EMULATOR",
    "FIRESTORE_EMULATOR_HOST",
    "FIREBASE_AUTH_EMULATOR_HOST",
    "FUNCTIONS_EMULATOR_HOST",
    "FIREBASE_STORAGE_EMULATOR_HOST",
  ])
    vi.stubEnv(key, undefined);
  put("orders/order", { ownerId: "owner", version: 1, ...provenance });
  put("users/staff", { locked: false });
  put("users/owner", { locked: false });
  put("staffAccess/staff", { active: true, roles: ["SUPPORT"] });
  put("settings/customerNotifications", {
    approved: true,
    emailEnabled: true,
    cutoverAt: now - 100,
  });
  put("settings/productionTest", {
    enabled: true,
    approved: true,
    version: 1,
    effectiveFrom: now - 100,
    expiresAt: now + 1000,
    origin: "https://satsunicgo.web.app",
    provider: "sepay_sandbox",
    testerUids: ["owner"],
  });
  put("settings/productionTestEmail", {
    enabled: true,
    approved: true,
    version: 1,
    cutoverAt: now - 100,
    expiresAt: now + 1000,
    testerUids: ["owner"],
  });
  const prefs = emptyNotificationPreferences("owner@example.invalid");
  prefs.topics.orderEmail = {
    requested: true,
    generation: 1,
    confirmedGeneration: 1,
  };
  put("notificationPreferences/owner", prefs);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("authoritative reply execution provenance", () => {
  it("pins a staff reply and its inbox item to the source order, without widening unread email policy", async () => {
    await expect(reply()).resolves.toEqual({ version: 1 });
    expect(getJob()).toMatchObject({
      ...provenance,
      ownerId: "owner",
      action: "orderConversationReply",
    });
    expect(JSON.stringify(getJob())).not.toContain("Mẫu bạn chọn");
    await expect(project()).resolves.toBe(true);
    expect(memory.records.get(`notifications/${jobId}`)).toMatchObject({
      ...provenance,
      ownerId: "owner",
      templateId: "order_reply",
      read: false,
    });
    expect(getJob().emailState).toBe("blocked_policy");
    await expect(
      prepareCustomerEmail(
        getFirestore(),
        getJob(),
        now,
        "owner@example.invalid",
      ),
    ).rejects.toThrow("blocked_policy");
    await expect(project()).resolves.toBe(false);
    expect(
      [...memory.records.keys()].filter((key) =>
        key.startsWith("notifications/"),
      ),
    ).toHaveLength(1);
  });
  it("does not add test metadata to an existing live order or reply", async () => {
    put("orders/order", { ownerId: "owner", version: 1 });
    await reply();
    await project();
    for (const row of [getJob(), memory.records.get(`notifications/${jobId}`)!])
      for (const key of Object.keys(provenance))
        expect(row).not.toHaveProperty(key);
  });
  it("replays an identical authorized command without duplicate writes", async () => {
    await reply();
    const count = memory.writes.length;
    await expect(reply()).resolves.toEqual({ version: 1 });
    expect(memory.writes).toHaveLength(count);
    await expect(
      reply("staff", { text: "Nội dung khác" }),
    ).rejects.toMatchObject({ code: "already-exists" });
    expect(memory.writes).toHaveLength(count);
  });
  it.each([
    { executionMode: "production_test" },
    { ...provenance, executionMode: "live" },
    { ...provenance, testRunId: "not-a-uuid" },
  ])(
    "rejects malformed authoritative provenance before any reply write: %j",
    async (source) => {
      put("orders/order", { ownerId: "owner", version: 1, ...source });
      await expect(reply()).rejects.toMatchObject({
        code: "failed-precondition",
      });
      expect(memory.writes).toHaveLength(0);
    },
  );
  it.each(["ownerId", "executionMode", "testRunId"])(
    "rejects client-supplied %s with zero writes",
    async (key) => {
      await expect(reply("staff", { [key]: "forged" })).rejects.toMatchObject({
        code: "invalid-argument",
      });
      expect(memory.writes).toHaveLength(0);
    },
  );
  it.each(["foreign", "locked", "inactive"])(
    "preserves %s authorization denial",
    async (kind) => {
      if (kind === "locked") put("users/staff", { locked: true });
      if (kind === "inactive")
        put("staffAccess/staff", { active: false, roles: ["SUPPORT"] });
      await expect(
        reply(kind === "foreign" ? "outsider" : "staff"),
      ).rejects.toMatchObject({ code: "permission-denied" });
      expect(memory.writes).toHaveLength(0);
    },
  );
  it.each([
    {},
    { ...provenance, testRunId: "00000000-0000-4000-8000-000000000003" },
    { ...provenance, executionPolicyVersion: 2 },
    { executionMode: "production_test" },
    { ...provenance, executionMode: "live" },
  ])(
    "blocks missing, malformed or mismatched job provenance before inbox creation: %j",
    async (fields) => {
      await reply();
      const job = getJob();
      for (const key of Object.keys(provenance)) delete job[key];
      put(`outboxJobs/${jobId}`, { ...job, ...fields });
      memory.writes = [];
      await expect(project()).resolves.toBe(true);
      expect(getJob()).toMatchObject({
        state: "blocked_content",
        emailState: "blocked_content",
        customerContentState: "invalid_execution",
      });
      expect(memory.records.has(`notifications/${jobId}`)).toBe(false);
      expect(memory.writes).toEqual([`outboxJobs/${jobId}`]);
    },
  );
  it.each([
    { ownerId: "owner", version: 1 },
    { ownerId: "owner", executionMode: "production_test" },
    { ownerId: "owner", ...provenance, executionPolicyVersion: 2 },
  ])(
    "blocks authoritative source mode changes or corruption at projection: %j",
    async (source) => {
      await reply();
      put("orders/order", source);
      await project();
      expect(getJob().customerContentState).toBe("invalid_execution");
      expect(memory.records.has(`notifications/${jobId}`)).toBe(false);
    },
  );
  it.each(["owner", "locked"])(
    "keeps current %s projection authorization",
    async (kind) => {
      await reply();
      if (kind === "owner")
        put("orders/order", { ownerId: "other", ...provenance });
      else put("users/owner", { locked: true });
      await project();
      expect(getJob().state).toBe("blocked_recipient");
      expect(memory.records.has(`notifications/${jobId}`)).toBe(false);
    },
  );
  it("keeps a legacy sandbox marker conservative in both derivative records", async () => {
    put("orders/order", { ownerId: "owner", paymentProvider: "sepay_sandbox" });
    await reply();
    await project();
    for (const row of [
      getJob(),
      memory.records.get(`notifications/${jobId}`)!,
    ]) {
      expect(row.testMode).toBe(true);
      expect(row).not.toHaveProperty("executionMode");
    }
  });
  it("retains eligible test email policy and current opt-out controls independently of inbox projection", async () => {
    await reply();
    const event = customerEvent(
      "payment_confirmed",
      {
        ownerId: "owner",
        entityId: "order",
        orderId: "order",
        entityVersion: 1,
        occurredAt: now,
      },
      { orderRef: "order", paidAmount: 100, paymentScope: "custom_initial" },
    );
    put(`outboxJobs/${jobId}`, {
      ...getJob(),
      ...customerEventFields(() => event),
    });
    await project();
    expect(memory.records.get(`notifications/${jobId}`)).toMatchObject(
      provenance,
    );
    await expect(
      prepareCustomerEmail(
        getFirestore(),
        getJob(),
        now,
        "owner@example.invalid",
      ),
    ).resolves.toHaveProperty("subject", expect.stringContaining("[Test]"));
    put(
      "notificationPreferences/owner",
      emptyNotificationPreferences("owner@example.invalid"),
    );
    await expect(
      prepareCustomerEmail(
        getFirestore(),
        getJob(),
        now,
        "owner@example.invalid",
      ),
    ).rejects.toThrow("blocked_policy");
  });
});

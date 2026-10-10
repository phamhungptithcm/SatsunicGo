import { beforeEach, afterEach, expect, it, vi } from "vitest";
const h = vi.hoisted(() => ({
  policy: {} as Record<string, unknown>,
  project: vi.fn(), publish: vi.fn(), warn: vi.fn(),
  query: vi.fn(), docs: [] as Array<{ id: string; data: () => Record<string, unknown> }>,
  cursor: null as unknown, cursorRead: vi.fn(), cursorWrite: vi.fn(), startAfter: vi.fn(),
}));
vi.mock("firebase-functions/v2/scheduler", () => ({ onSchedule: (_options: unknown, handler: unknown) => handler }));
vi.mock("../../functions/src/blog-studio", () => ({ publishDueStudioPosts: h.publish }));
vi.mock("../../functions/src/customer-notification-delivery", () => ({ projectCustomerNotification: h.project }));
vi.mock("firebase-functions/logger", () => ({ warn: h.warn }));
import { scheduledJobAllowed, recoverCustomerNotifications } from "../../functions/src/jobs";
const now = 1791590400000;
const db = {
  projectId: "satsunicgo",
  doc: (path: string) => ({ path, get: async () => {
    if (path === "settings/scheduledJobs") return { data: () => h.policy };
    expect(path).toBe("scheduledJobCursors/customerNotificationRecovery");
    h.cursorRead(); return { data: () => ({ lastId: h.cursor }) };
  } }),
  runTransaction: async (run: (tx: unknown) => unknown) => run({
    get: async (ref: { get: () => unknown }) => ref.get(),
    set: (ref: { path: string }, value: { lastId: unknown }) => {
      expect(ref.path).toBe("scheduledJobCursors/customerNotificationRecovery");
      h.cursorWrite(value); h.cursor = value.lastId;
    },
  }),
  collection: (path: string) => {
    expect(path).toBe("outboxJobs");
    const query = {
      where: (field: string, op: string, value: string) => { h.query(field, op, value); return query; },
      orderBy: () => query,
      startAfter: (value: string) => { h.startAfter(value); return query; },
      limit: (limit: number) => { expect(limit).toBe(30); return { get: async () => ({ docs: h.docs }) }; },
    };
    return query;
  },
} as unknown as Parameters<typeof scheduledJobAllowed>[0];
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", "v1");
  vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("GOOGLE_CLOUD_PROJECT", undefined);
  vi.stubEnv("FIREBASE_CONFIG", JSON.stringify({ projectId: "satsunicgo" }));
  for (const key of ["FUNCTIONS_EMULATOR", "FIRESTORE_EMULATOR_HOST", "FIREBASE_AUTH_EMULATOR_HOST", "FIREBASE_STORAGE_EMULATOR_HOST"]) vi.stubEnv(key, undefined);
  h.policy = { approved: true, version: 1, effectiveFrom: now - 1, expiresAt: now + 100000, studioPublication: false, notificationRecovery: true };
  h.docs = [];
  h.cursor = null;
  h.project.mockResolvedValue(true);
});
afterEach(() => vi.unstubAllEnvs());
it("separates publication and projection capabilities and never activates mixed maintenance", async () => {
  expect(await scheduledJobAllowed(db, "notificationRecovery", now)).toBe(true);
  expect(await scheduledJobAllowed(db, "scheduledPublication", now)).toBe(false);
});
it.each([{ approved: false }, { expiresAt: now }, { effectiveFrom: now + 1 }, { version: 0 }, { technicalQuotaRetentionDays: 2 }])("fails closed on invalid/expired or mixed cleanup policy %j", async patch => {
  Object.assign(h.policy, patch);
  expect(await scheduledJobAllowed(db, "notificationRecovery", now)).toBe(false);
});
it("unknown runtime identity cannot query or project production jobs", async () => {
  vi.stubEnv("FIRESTORE_EMULATOR_HOST", "127.0.0.1:18207");
  await recoverCustomerNotifications(db, now);
  expect(h.query).not.toHaveBeenCalled();
  expect(h.project).not.toHaveBeenCalled();
});
it("projects only queued typed customer events, bounded to five parallel transactional projections", async () => {
  let concurrent = 0, maximum = 0;
  h.project.mockImplementation(async () => { concurrent++; maximum = Math.max(maximum, concurrent); await Promise.resolve(); concurrent--; });
  h.docs = Array.from({ length: 13 }, (_, n) => ({ id: `job-${n}`, data: () => n === 0 ? { action: "membershipExpired" } : { customerEvent: { templateId: "payment_confirmed" } } }));
  await recoverCustomerNotifications(db, now);
  expect(h.query).toHaveBeenCalledWith("state", "==", "queued");
  expect(h.project).toHaveBeenCalledTimes(12);
  expect(maximum).toBeLessThanOrEqual(5);
  expect(h.publish).not.toHaveBeenCalled();
  expect(h.cursorWrite).toHaveBeenCalledOnce();
  expect(h.cursorRead).toHaveBeenCalledTimes(2);
  expect(h.cursor).toBe("job-12");
});
it("one projection failure cannot starve later jobs and logs no exception or recipient payload", async () => {
  h.docs = Array.from({ length: 7 }, (_, n) => ({ id: `job-${n}`, data: () => ({ customerEvent: {} }) }));
  h.project.mockRejectedValueOnce(Error("private-recipient@example.invalid"));
  await recoverCustomerNotifications(db, now);
  expect(h.project).toHaveBeenCalledTimes(7);
  expect(h.warn).toHaveBeenCalledWith("CUSTOMER_NOTIFICATION_RECOVERY_RETRY");
  expect(JSON.stringify(h.warn.mock.calls)).not.toContain("private-recipient");
});
it("advances past mixed legacy heads, wraps once empty, and revisits failed typed jobs", async () => {
  h.docs = Array.from({ length: 30 }, (_, n) => ({ id: `legacy-${n}`, data: () => ({ action: "legacy" }) }));
  await recoverCustomerNotifications(db, now);
  expect(h.project).not.toHaveBeenCalled();
  expect(h.cursor).toBe("legacy-29");
  h.docs = [{ id: "typed-1", data: () => ({ customerEvent: {} }) }];
  h.project.mockRejectedValueOnce(Error("transient"));
  await recoverCustomerNotifications(db, now + 1);
  expect(h.startAfter).toHaveBeenLastCalledWith("legacy-29");
  expect(h.cursor).toBe("typed-1");
  h.docs = [];
  await recoverCustomerNotifications(db, now + 2);
  expect(h.cursor).toBeNull();
  h.docs = [{ id: "typed-1", data: () => ({ customerEvent: {} }) }];
  await recoverCustomerNotifications(db, now + 3);
  expect(h.project).toHaveBeenCalledTimes(2);
  expect(h.cursorWrite).toHaveBeenCalledTimes(4);
  expect(h.cursorRead).toHaveBeenCalledTimes(8);
});
it("overlapping runs cannot overwrite a newer cursor and malformed cursor cannot escape query scope", async () => {
  h.cursor = "../untrusted";
  h.docs = [{ id: "typed-2", data: () => ({ customerEvent: {} }) }];
  h.project.mockImplementationOnce(async () => { h.cursor = "newer-run"; });
  await recoverCustomerNotifications(db, now);
  expect(h.startAfter).not.toHaveBeenCalled();
  expect(h.cursorWrite).not.toHaveBeenCalled();
  expect(h.cursor).toBe("newer-run");
});

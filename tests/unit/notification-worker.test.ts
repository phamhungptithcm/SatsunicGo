import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { EmailDispatchResult } from "../../functions/src/email/dispatch";
import type {
  SubscriptionSender,
  SubscriptionSendResult,
} from "../../functions/src/subscription-delivery-service";
const h = vi.hoisted(() => ({
  secret: vi.fn(),
  db: vi.fn(),
  deliver: vi.fn(),
  dispatch: vi.fn(),
  providerIo: vi.fn(),
  authorize: vi.fn(),
  transport: vi.fn(),
  warning: vi.fn(),
  limits: [] as number[],
  options: {} as Record<string, unknown>,
  secretName: "",
  projectId: "satsunicgo",
  config: {} as Record<string, unknown>,
  jobs: ["job-1", "job-2"],
  outcomes: [] as Array<EmailDispatchResult>,
  results: [] as SubscriptionSendResult[],
}));
vi.mock("firebase-functions/v2/scheduler", () => ({
  onSchedule: (config: Record<string, unknown>, handler: unknown) => {
    h.options = config;
    return handler;
  },
}));
vi.mock("firebase-functions/params", () => ({
  defineSecret: (name: string) => {
    h.secretName = name;
    return { value: h.secret };
  },
}));
vi.mock("firebase-functions/logger", () => ({ warn: h.warning }));
vi.mock("firebase-admin/firestore", () => ({ getFirestore: h.db }));
vi.mock("nodemailer", () => ({ default: { createTransport: h.transport } }));
vi.mock("../../functions/src/notification-preferences", () => ({
  subscriptionIdentity: vi.fn(),
}));
vi.mock("../../functions/src/subscription-delivery-service", () => ({
  deliverSubscriptionJob: h.deliver,
}));
vi.mock("../../functions/src/email/dispatch", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../../functions/src/email/dispatch")
  >()),
  dispatchResend: h.dispatch,
}));
import { deliverSubscriptionEmail } from "../../functions/src/subscription-email";
import { emailRequestIdentity } from "../../functions/src/email/dispatch";
const run = deliverSubscriptionEmail as unknown as () => Promise<void>;
const now = Date.UTC(2026, 9, 9, 12);
const providerId = "9303e799-9923-47e8-aa31-996b9a5d17ab";
function database() {
  return {
    get projectId() {
      return h.projectId;
    },
    doc: () => ({ get: async () => ({ data: () => ({ ...h.config }) }) }),
    collection: () => ({
      where: (_field: string, _op: string, state: string) => ({
        limit: (n: number) => {
          h.limits.push(n);
          return {
            get: async () => ({
              docs: state === "queued" ? h.jobs.map((id) => ({ id })) : [],
            }),
          };
        },
      }),
    }),
  };
}
async function invokeSender(
  _db: unknown,
  _channel: string,
  id: string,
  _origin: string,
  _time: number,
  sender: SubscriptionSender,
) {
  const content = {
    subject: "Synthetic confirmation",
    text: `Fixture link #notification-confirm=${"a".repeat(64)}`,
    html: `<p>Fixture ${id}</p>`,
  };
  const result = await sender.send(
    "email",
    "fixture@example.invalid",
    content,
    `subscription-${id}`,
    h.authorize,
  );
  h.results.push(result);
  return result;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("GOOGLE_CLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("FUNCTIONS_EMULATOR", "false");
  vi.stubEnv("FIRESTORE_EMULATOR_HOST", undefined);
  vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", undefined);
  h.limits.length = 0;
  h.outcomes.length = 0;
  h.results.length = 0;
  h.jobs = ["job-1", "job-2"];
  h.projectId = "satsunicgo";
  h.config = {
    approved: true,
    provider: "resend",
    enabled: true,
    subscriptionsEnabled: true,
    from: "contact@hunpeolabs.com",
    verifiedDomain: "hunpeolabs.com",
    cutoverAt: now - 1,
    dailyAttemptLimit: 100,
    domainVerificationEvidenceId: "qa/domain-receipt",
    domainVerifiedAt: now - 1,
  };
  h.secret.mockReturnValue("re_synthetic_worker_only_123456");
  h.db.mockReturnValue(database());
  h.authorize.mockResolvedValue(true);
  h.deliver.mockImplementation(invokeSender);
  h.dispatch.mockImplementation(
    async (
      deps: Parameters<
        typeof import("../../functions/src/email/dispatch").dispatchResend
      >[0],
    ) => {
      const outcome = h.outcomes.shift() ?? {
        state: "accepted",
        providerId,
        attempted: true,
      };
      if (outcome.attempted) {
        // Model the actual dispatch boundary: preflight deferral does not authorize or start I/O.
        if (!(await deps.beforeSend!()))
          return {
            state: "deferred",
            reason: "claim_unavailable",
            attempted: false,
            retryAt: Date.now() + 30 * 60_000,
          };
        h.providerIo();
      }
      return outcome;
    },
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

test("release hold prevents database, secrets and transport access", async () => {
  vi.stubEnv("GCLOUD_PROJECT", "other-project");
  await run();
  expect(h.db).not.toHaveBeenCalled();
  expect(h.secret).not.toHaveBeenCalled();
  expect(h.dispatch).not.toHaveBeenCalled();
  expect(h.transport).not.toHaveBeenCalled();
});
test("disabled subscription setting prevents secret and provider access", async () => {
  h.config.subscriptionsEnabled = false;
  await run();
  expect(h.secret).not.toHaveBeenCalled();
  expect(h.dispatch).not.toHaveBeenCalled();
  expect(h.transport).not.toHaveBeenCalled();
});
test("worker bounds both scans to 20 and releases batch resources without SMTP transport", async () => {
  await run();
  expect(h.limits).toEqual([20, 20]);
  expect(h.deliver).toHaveBeenCalledTimes(2);
  expect(h.providerIo).toHaveBeenCalledTimes(2);
  expect(h.transport).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
  expect(h.options).toMatchObject({
    schedule: "every 30 minutes",
    maxInstances: 1,
    timeoutSeconds: 300,
  });
  expect(h.secretName).toBe("SFTP_PASSWORD");
  expect(
    h.deliver.mock.calls.every((args) => args[7] === h.config.cutoverAt),
  ).toBe(true);
});
test("one database failure cannot starve subsequent jobs; warning excludes raw exception and recipient", async () => {
  h.deliver.mockRejectedValueOnce(Error("DO_NOT_LOG_sensitive_payload"));
  await expect(run()).resolves.toBeUndefined();
  expect(h.deliver).toHaveBeenCalledTimes(2);
  expect(h.providerIo).toHaveBeenCalledOnce();
  expect(h.warning).toHaveBeenCalledWith("Subscription job processing failed", {
    jobId: "job-1",
  });
  expect(JSON.stringify(h.warning.mock.calls)).not.toContain("DO_NOT_LOG");
  expect(vi.getTimerCount()).toBe(0);
});
test("actual database project mismatch prevents queue or secret access", async () => {
  h.projectId = "demo-satsunicgo";
  await run();
  expect(h.limits).toHaveLength(0);
  expect(h.secret).not.toHaveBeenCalled();
  expect(h.dispatch).not.toHaveBeenCalled();
});
test.each([
  { enabled: false },
  { domainVerificationEvidenceId: undefined },
  { provider: "smtp" },
])("unready configuration prevents dispatch: %j", async (delta) => {
  Object.assign(h.config, delta);
  await run();
  expect(h.dispatch).not.toHaveBeenCalled();
  expect(h.secret).not.toHaveBeenCalled();
});
test("daily cap changed during a batch prevents provider I/O under the old configuration", async () => {
  h.jobs = ["job-1"];
  h.deliver.mockImplementationOnce(
    async (...args: Parameters<typeof invokeSender>) => {
      h.config.dailyAttemptLimit = 1;
      return invokeSender(...args);
    },
  );
  await run();
  expect(h.dispatch).toHaveBeenCalledOnce();
  expect(h.authorize).not.toHaveBeenCalled();
  expect(h.providerIo).not.toHaveBeenCalled();
  expect(h.results[0]).toMatchObject({ state: "deferred", attempted: false });
});

test("one bounded429 retry preserves the exact in-memory message, token, job key and request identity", async () => {
  h.jobs = ["job-1"];
  h.outcomes.push({
    state: "deferred",
    reason: "provider_rate_limit",
    attempted: true,
    retryAt: now + 1_000,
  });
  const active = run();
  await vi.waitFor(() => expect(h.dispatch).toHaveBeenCalledOnce());
  await vi.advanceTimersByTimeAsync(1_000);
  await active;
  expect(h.dispatch).toHaveBeenCalledTimes(2);
  expect(h.providerIo).toHaveBeenCalledTimes(2);
  const [first, second] = h.dispatch.mock.calls.map((args) => args[0]);
  expect(second.message).toBe(first.message);
  expect(second.stableJobKey).toBe(first.stableJobKey);
  const identity = emailRequestIdentity(first.message);
  expect(h.authorize.mock.calls).toEqual([
    [identity, "contact@hunpeolabs.com"],
    [identity, "contact@hunpeolabs.com"],
  ]);
  expect(h.results).toEqual([
    { state: "accepted", providerId, attempted: true },
  ]);
  expect(vi.getTimerCount()).toBe(0);
});
test("persistent429 stops after one retry and returns explicit terminal rejection", async () => {
  h.jobs = ["job-1"];
  h.outcomes.push(
    {
      state: "deferred",
      reason: "provider_rate_limit",
      attempted: true,
      retryAt: now + 1_000,
    },
    {
      state: "deferred",
      reason: "provider_rate_limit",
      attempted: true,
      retryAt: now + 5_000,
    },
  );
  const active = run();
  await vi.waitFor(() => expect(h.dispatch).toHaveBeenCalledOnce());
  await vi.advanceTimersByTimeAsync(1_000);
  await active;
  expect(h.providerIo).toHaveBeenCalledTimes(2);
  expect(h.results).toEqual([
    { state: "rejected", attempted: true, retryAt: now + 5_000 },
  ]);
  expect(vi.getTimerCount()).toBe(0);
});
test("provider backoff beyond60seconds is rejected without waiting or replay", async () => {
  h.jobs = ["job-1"];
  h.outcomes.push({
    state: "deferred",
    reason: "provider_rate_limit",
    attempted: true,
    retryAt: now + 60_001,
  });
  await run();
  expect(h.providerIo).toHaveBeenCalledOnce();
  expect(h.dispatch).toHaveBeenCalledOnce();
  expect(h.results).toEqual([
    { state: "rejected", attempted: true, retryAt: now + 60_001 },
  ]);
  expect(vi.getTimerCount()).toBe(0);
});
test("near invocation deadline no429 backoff is started", async () => {
  h.jobs = ["job-1"];
  h.deliver.mockImplementationOnce(
    async (...args: Parameters<typeof invokeSender>) => {
      vi.setSystemTime(now + 231_000);
      return invokeSender(...args);
    },
  );
  h.outcomes.push({
    state: "deferred",
    reason: "provider_rate_limit",
    attempted: true,
    retryAt: now + 232_000,
  });
  await run();
  expect(h.providerIo).toHaveBeenCalledOnce();
  expect(h.dispatch).toHaveBeenCalledOnce();
  expect(h.results).toEqual([
    { state: "rejected", attempted: true, retryAt: now + 232_000 },
  ]);
  expect(vi.getTimerCount()).toBe(0);
});
test("claim or consent revoked during429 wait prevents a second provider call", async () => {
  h.jobs = ["job-1"];
  h.authorize.mockResolvedValueOnce(true).mockResolvedValue(false);
  h.outcomes.push({
    state: "deferred",
    reason: "provider_rate_limit",
    attempted: true,
    retryAt: now + 1_000,
  });
  const active = run();
  await vi.waitFor(() => expect(h.dispatch).toHaveBeenCalledOnce());
  await vi.advanceTimersByTimeAsync(1_000);
  await active;
  expect(h.dispatch).toHaveBeenCalledTimes(2);
  expect(h.authorize).toHaveBeenCalledTimes(2);
  expect(h.providerIo).toHaveBeenCalledOnce();
  expect(h.results).toEqual([
    {
      state: "rejected",
      attempted: true,
      retryAt: now + 1_801_000,
    },
  ]);
});
test("sending disabled during429 wait is rechecked before authorization and provider I/O", async () => {
  h.jobs = ["job-1"];
  h.outcomes.push({
    state: "deferred",
    reason: "provider_rate_limit",
    attempted: true,
    retryAt: now + 1_000,
  });
  const active = run();
  await vi.waitFor(() => expect(h.dispatch).toHaveBeenCalledOnce());
  h.config.enabled = false;
  await vi.advanceTimersByTimeAsync(1_000);
  await active;
  expect(h.providerIo).toHaveBeenCalledOnce();
  expect(h.authorize).toHaveBeenCalledOnce();
  expect(h.results[0]).toMatchObject({ state: "rejected", attempted: true });
});
test.each(["daily_limit", "quota_unavailable", "rate_limit"] as const)(
  "attempted 429 followed by %s preserves attempted content as terminal instead of requeueing",
  async (reason) => {
    h.jobs = ["job-1"];
    h.outcomes.push(
      {
        state: "deferred",
        reason: "provider_rate_limit",
        attempted: true,
        retryAt: now + 1_000,
      },
      {
        state: "deferred",
        reason,
        attempted: false,
        retryAt: now + 43_200_000,
      },
    );
    const active = run();
    await vi.waitFor(() => expect(h.dispatch).toHaveBeenCalledOnce());
    await vi.advanceTimersByTimeAsync(1_000);
    await active;
    expect(h.dispatch).toHaveBeenCalledTimes(2);
    expect(h.providerIo).toHaveBeenCalledOnce();
    expect(h.authorize).toHaveBeenCalledOnce();
    expect(h.results).toEqual([
      { state: "rejected", attempted: true, retryAt: now + 43_200_000 },
    ]);
    expect(vi.getTimerCount()).toBe(0);
  },
);
test("only one provider backoff is spent across the whole invocation", async () => {
  h.outcomes.push(
    {
      state: "deferred",
      reason: "provider_rate_limit",
      attempted: true,
      retryAt: now + 1_000,
    },
    { state: "accepted", providerId, attempted: true },
    {
      state: "deferred",
      reason: "provider_rate_limit",
      attempted: true,
      retryAt: now + 5_000,
    },
  );
  const active = run();
  await vi.waitFor(() => expect(h.dispatch).toHaveBeenCalledOnce());
  await vi.advanceTimersByTimeAsync(1_000);
  await active;
  expect(h.providerIo).toHaveBeenCalledTimes(3);
  expect(h.dispatch).toHaveBeenCalledTimes(3);
  expect(h.results).toEqual([
    { state: "accepted", providerId, attempted: true },
    { state: "rejected", attempted: true, retryAt: now + 5_000 },
  ]);
  expect(vi.getTimerCount()).toBe(0);
});
test("short quota reservation collision retries without counting a provider attempt until eligible", async () => {
  h.jobs = ["job-1"];
  h.outcomes.push({
    state: "deferred",
    reason: "rate_limit",
    attempted: false,
    retryAt: now + 1_000,
  });
  const active = run();
  await vi.waitFor(() => expect(h.dispatch).toHaveBeenCalledOnce());
  expect(h.providerIo).not.toHaveBeenCalled();
  expect(h.authorize).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1_000);
  await active;
  expect(h.dispatch).toHaveBeenCalledTimes(2);
  expect(h.providerIo).toHaveBeenCalledOnce();
  expect(h.authorize).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

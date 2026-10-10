import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  dispatchResend,
  emailIdempotencyKey,
  emailRequestIdentity,
} from "../../functions/src/email/dispatch";
import { parseEmailProviderConfig } from "../../functions/src/email/provider-config";
import type { ResendMessage } from "../../functions/src/email/resend";

const start = Date.UTC(2026, 9, 9, 12);
const base = {
  approved: true,
  provider: "resend",
  enabled: true,
  subscriptionsEnabled: true,
  from: "contact@hunpeolabs.com",
  verifiedDomain: "hunpeolabs.com",
  cutoverAt: start,
  dailyAttemptLimit: 100,
  domainVerificationEvidenceId: "release/domain-1",
  domainVerifiedAt: start - 1,
};
const message: ResendMessage = {
  from: "contact@hunpeolabs.com",
  to: "customer@example.invalid",
  subject: "Order update",
  text: "Open your account.",
  html: "<p>Open your account.</p>",
};
const apiKey = "re_synthetic_dispatch_only_123456";
const quotaPath = "emailDispatchQuota/resend";

// Models atomic committed transactions; real contention is verified on Firestore separately.
function harness(limit = 100, cutoverAt = start) {
  const rows = new Map<string, unknown>();
  let tail = Promise.resolve();
  let now = start;
  let unavailable = false;
  let transactionCalls = 0;
  let afterTransaction: ((index: number) => void) | undefined;
  const db = {
    projectId: "satsunicgo",
    doc: (path: string) => ({ path }),
    runTransaction<T>(body: (tx: unknown) => Promise<T>): Promise<T> {
      const result = tail.then(async () => {
        if (unavailable) throw Error("private database details");
        const writes: (() => void)[] = [];
        const tx = {
          get: async (ref: { path: string }) => ({
            exists: rows.has(ref.path),
            data: () => rows.get(ref.path),
          }),
          set: (ref: { path: string }, value: unknown) =>
            writes.push(() => rows.set(ref.path, value)),
        };
        const result = await body(tx);
        writes.forEach((write) => write());
        afterTransaction?.(++transactionCalls);
        return result;
      });
      tail = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
  } as unknown as Firestore;
  const request = vi
    .fn<typeof fetch>()
    .mockImplementation(
      async () =>
        new Response(JSON.stringify({ id: randomUUID() }), { status: 200 }),
    );
  const config = parseEmailProviderConfig({
    ...base,
    cutoverAt,
    dailyAttemptLimit: limit,
  })!;
  const call = (
    overrides: Partial<Parameters<typeof dispatchResend>[0]> = {},
  ) =>
    dispatchResend({
      db,
      config,
      message,
      apiKey,
      stableJobKey: `outboxJobs/${randomUUID()}`,
      now: () => now,
      request,
      ...overrides,
    });
  return {
    rows,
    db,
    request,
    config,
    call,
    at: (value: number) => (now = value),
    advance: (value: number) => (now += value),
    unavailable: () => (unavailable = true),
    available: () => (unavailable = false),
    afterTransaction: (callback: (index: number) => void) =>
      (afterTransaction = callback),
  };
}

afterEach(() => vi.unstubAllEnvs());
describe("shared Resend dispatch budget", () => {
  test("one provider call uses immutable bounded identity and technical-only quota", async () => {
    const h = harness();
    const key = "outboxJobs/job-1";
    expect(await h.call({ stableJobKey: key })).toMatchObject({
      state: "accepted",
      attempted: true,
    });
    expect(h.request).toHaveBeenCalledOnce();
    const init = h.request.mock.calls[0][1]!;
    expect((init.headers as Record<string, string>)["Idempotency-Key"]).toBe(
      emailIdempotencyKey(key, emailRequestIdentity(message)),
    );
    expect((init.headers as Record<string, string>)["Idempotency-Key"]).toMatch(
      /^satsunicgo-email-v1\/[a-f0-9]{64}$/,
    );
    expect(JSON.parse(init.body as string)).toEqual(message);
    expect(h.rows.get(quotaPath)).toEqual({
      schemaVersion: 1,
      dayUTC: "2026-10-09",
      attempts: 1,
      lastReservedAtMs: start,
      nextDispatchAtMs: start + 1_000,
    });
    const stored = JSON.stringify([...h.rows.values()]);
    for (const value of [
      message.to,
      message.subject,
      message.text,
      message.html,
      apiKey,
      key,
    ])
      expect(stored).not.toContain(value);
  });
  test("identity is stable and includes sender, recipient and every content field", () => {
    const identity = emailRequestIdentity(message);
    expect(emailRequestIdentity({ ...message })).toBe(identity);
    for (const field of ["from", "to", "subject", "text", "html"] as const) {
      expect(
        emailRequestIdentity({ ...message, [field]: `${message[field]}x` }),
      ).not.toBe(identity);
    }
    expect(emailIdempotencyKey("outboxJobs/a", identity)).not.toBe(
      emailIdempotencyKey("notificationEmailJobs/a", identity),
    );
  });
  test("both queue namespaces share one cadence under 30 concurrent calls", async () => {
    const h = harness();
    const results = await Promise.all(
      Array.from({ length: 30 }, (_, n) =>
        h.call({
          stableJobKey: `${n % 2 ? "outboxJobs" : "notificationEmailJobs"}/job-${n}`,
        }),
      ),
    );
    expect(results.filter((value) => value.state === "accepted")).toHaveLength(
      1,
    );
    expect(
      results.filter((value) => value.state === "deferred" && !value.attempted),
    ).toHaveLength(29);
    expect(h.request).toHaveBeenCalledOnce();
    h.advance(1_000);
    expect((await h.call()).state).toBe("accepted");
  });
  test("async final authorization cannot bunch independent provider starts", async () => {
    const h = harness();
    let authorize!: () => void;
    let entered!: () => void;
    const authorized = new Promise<void>((resolve) => (authorize = resolve));
    const waiting = new Promise<void>((resolve) => (entered = resolve));
    const first = h.call({
      stableJobKey: "outboxJobs/slow-authorize",
      beforeSend: async () => {
        entered();
        await authorized;
        return true;
      },
    });
    await waiting;
    h.advance(1_500);
    const second = await h.call({
      stableJobKey: "notificationEmailJobs/overlap",
    });
    authorize();
    expect(await first).toMatchObject({ state: "accepted", attempted: true });
    expect(second).toMatchObject({ state: "deferred", attempted: false });
    expect(h.request).toHaveBeenCalledOnce();
    h.advance(999);
    expect(await h.call()).toMatchObject({
      state: "deferred",
      attempted: false,
    });
    h.advance(1);
    expect((await h.call()).state).toBe("accepted");
    expect(h.request).toHaveBeenCalledTimes(2);
  });
  test("lease lasts through provider completion and cooldown starts after completion", async () => {
    const h = harness();
    let complete!: () => void;
    let entered!: () => void;
    const completion = new Promise<void>((resolve) => (complete = resolve));
    const waiting = new Promise<void>((resolve) => (entered = resolve));
    h.request.mockImplementationOnce(async () => {
      entered();
      await completion;
      return new Response(JSON.stringify({ id: randomUUID() }), {
        status: 200,
      });
    });
    const first = h.call();
    await waiting;
    h.advance(1_500);
    expect(await h.call()).toMatchObject({
      state: "deferred",
      attempted: false,
    });
    complete();
    expect((await first).state).toBe("accepted");
    expect(h.rows.get(quotaPath)).toEqual({
      schemaVersion: 1,
      dayUTC: "2026-10-09",
      attempts: 1,
      lastReservedAtMs: start,
      nextDispatchAtMs: start + 2_500,
    });
    h.advance(999);
    expect(await h.call()).toMatchObject({
      state: "deferred",
      attempted: false,
    });
    h.advance(1);
    expect((await h.call()).state).toBe("accepted");
    expect(h.request).toHaveBeenCalledTimes(2);
  });
  test.each([
    [329_000, "rate_limit"],
    [330_000, "rate_limit"],
    [-1, "clock_rollback"],
  ])(
    "final synchronous fence rejects expired lease or clock rollback (%s)",
    async (offset, reason) => {
      const h = harness(100, start - 1_000);
      expect(
        await h.call({
          beforeSend: async () => {
            h.at(start + offset);
            return true;
          },
        }),
      ).toMatchObject({
        state: "deferred",
        reason,
        attempted: false,
      });
      expect(h.request).not.toHaveBeenCalled();
      expect(h.rows.get(quotaPath)).toMatchObject({ attempts: 1 });
    },
  );
  test("expired owner never starts I/O or clears a replacement worker's lease", async () => {
    const h = harness();
    let authorizeOld!: () => void;
    let oldEntered!: () => void;
    const oldAuthorization = new Promise<void>(
      (resolve) => (authorizeOld = resolve),
    );
    const oldWaiting = new Promise<void>((resolve) => (oldEntered = resolve));
    const old = h.call({
      beforeSend: async () => {
        oldEntered();
        await oldAuthorization;
        return true;
      },
    });
    await oldWaiting;
    h.advance(330_000);
    expect(await h.call()).toMatchObject({
      state: "deferred",
      reason: "rate_limit",
      attempted: false,
    });
    h.advance(1_000);
    let authorizeNew!: () => void;
    let newEntered!: () => void;
    const newAuthorization = new Promise<void>(
      (resolve) => (authorizeNew = resolve),
    );
    const newWaiting = new Promise<void>((resolve) => (newEntered = resolve));
    const current = h.call({
      beforeSend: async () => {
        newEntered();
        await newAuthorization;
        return true;
      },
    });
    await newWaiting;
    const replacement = structuredClone(h.rows.get(quotaPath));
    authorizeOld();
    expect(await old).toMatchObject({ state: "deferred", attempted: false });
    expect(h.rows.get(quotaPath)).toEqual(replacement);
    expect(h.request).not.toHaveBeenCalled();
    authorizeNew();
    expect((await current).state).toBe("accepted");
    expect(h.request).toHaveBeenCalledOnce();
    expect(h.rows.get(quotaPath)).toMatchObject({
      attempts: 2,
      nextDispatchAtMs: start + 332_000,
    });
    expect(h.rows.get(quotaPath)).not.toHaveProperty("dispatchLeaseId");
  });
  test.each(["accepted", "unknown"] as const)(
    "release failure retains %s and conservatively holds recovery",
    async (state) => {
      const h = harness();
      h.request.mockImplementationOnce(async () => {
        h.unavailable();
        if (state === "unknown") throw Error("private transport detail");
        return new Response(JSON.stringify({ id: randomUUID() }), {
          status: 200,
        });
      });
      expect(await h.call()).toMatchObject({ state, attempted: true });
      const held = structuredClone(h.rows.get(quotaPath));
      expect(held).toMatchObject({
        attempts: 1,
        dispatchLeaseExpiresAtMs: start + 330_000,
      });
      h.available();
      h.advance(1_000);
      expect(await h.call()).toMatchObject({
        state: "deferred",
        reason: "rate_limit",
        attempted: false,
      });
      expect(h.rows.get(quotaPath)).toEqual(held);
      h.at(start + 331_000);
      expect((await h.call()).state).toBe("accepted");
      expect(h.request).toHaveBeenCalledTimes(2);
      expect(h.rows.get(quotaPath)).toMatchObject({ attempts: 2 });
      expect(JSON.stringify(h.rows.get(quotaPath))).not.toContain("private");
    },
  );
  test("completion clock rollback cannot release the live lease", async () => {
    const h = harness(100, start - 1_000);
    h.request.mockImplementationOnce(async () => {
      h.at(start - 1);
      return new Response(JSON.stringify({ id: randomUUID() }), {
        status: 200,
      });
    });
    expect((await h.call()).state).toBe("accepted");
    expect(h.rows.get(quotaPath)).toHaveProperty("dispatchLeaseId");
    h.at(start + 1_000);
    expect(await h.call()).toMatchObject({
      state: "deferred",
      reason: "rate_limit",
      attempted: false,
    });
    expect(h.request).toHaveBeenCalledOnce();
  });
  test("rollback after a delayed provider start cannot shorten the one-second separation", async () => {
    const h = harness();
    h.request.mockImplementationOnce(async () => {
      h.at(start + 1_000);
      return new Response(JSON.stringify({ id: randomUUID() }), {
        status: 200,
      });
    });
    expect(
      (
        await h.call({
          beforeSend: async () => {
            h.at(start + 1_500);
            return true;
          },
        })
      ).state,
    ).toBe("accepted");
    expect(h.rows.get(quotaPath)).toHaveProperty("dispatchLeaseId");
    h.at(start + 2_000);
    expect(await h.call()).toMatchObject({
      state: "deferred",
      attempted: false,
    });
    expect(h.request).toHaveBeenCalledOnce();
  });
  test("legacy v1 quota is upgraded without resetting its same-day count", async () => {
    const h = harness();
    h.rows.set(quotaPath, {
      schemaVersion: 1,
      dayUTC: "2026-10-09",
      attempts: 99,
      lastReservedAtMs: start - 1_000,
    });
    expect((await h.call()).state).toBe("accepted");
    expect(h.rows.get(quotaPath)).toEqual({
      schemaVersion: 1,
      dayUTC: "2026-10-09",
      attempts: 100,
      lastReservedAtMs: start,
      nextDispatchAtMs: start + 1_000,
    });
    h.advance(1_000);
    expect(await h.call()).toMatchObject({
      state: "deferred",
      reason: "daily_limit",
      attempted: false,
    });
  });
  test("authorization spanning midnight cannot charge yesterday for today's provider start", async () => {
    const h = harness();
    const midnight = Date.UTC(2026, 9, 10);
    h.at(midnight - 500);
    expect(
      await h.call({
        beforeSend: async () => {
          h.at(midnight + 500);
          return true;
        },
      }),
    ).toMatchObject({
      state: "deferred",
      attempted: false,
    });
    expect(h.request).not.toHaveBeenCalled();
    expect(h.rows.get(quotaPath)).toMatchObject({
      dayUTC: "2026-10-09",
      attempts: 1,
      nextDispatchAtMs: midnight + 1_500,
    });
    h.at(midnight + 1_499);
    expect(await h.call()).toMatchObject({
      state: "deferred",
      attempted: false,
    });
    h.advance(1);
    expect((await h.call()).state).toBe("accepted");
    expect(h.rows.get(quotaPath)).toMatchObject({
      dayUTC: "2026-10-10",
      attempts: 1,
    });
    expect(h.request).toHaveBeenCalledOnce();
  });
  test("daily cap includes accepted, explicit rejected and uncertain attempts", async () => {
    const h = harness(3);
    await h.call();
    h.advance(1_000);
    h.request.mockResolvedValueOnce(new Response(null, { status: 403 }));
    expect(await h.call()).toMatchObject({
      state: "rejected",
      attempted: true,
    });
    h.advance(1_000);
    h.request.mockRejectedValueOnce(Error("private transport error"));
    expect(await h.call()).toMatchObject({ state: "unknown", attempted: true });
    h.advance(1_000);
    expect(await h.call()).toEqual({
      state: "deferred",
      reason: "daily_limit",
      retryAt: Date.UTC(2026, 9, 10),
      attempted: false,
    });
    expect(h.request).toHaveBeenCalledTimes(3);
    h.at(Date.UTC(2026, 9, 10));
    expect((await h.call()).state).toBe("accepted");
    expect(h.rows.get(quotaPath)).toMatchObject({
      dayUTC: "2026-10-10",
      attempts: 1,
    });
  });
  test("cadence survives UTC midnight", async () => {
    const h = harness();
    h.at(Date.UTC(2026, 9, 9, 23, 59, 59, 500));
    await h.call();
    h.advance(500);
    expect(await h.call()).toMatchObject({
      state: "deferred",
      reason: "rate_limit",
      attempted: false,
    });
    h.advance(500);
    expect((await h.call()).state).toBe("accepted");
  });
  test("429 defers within the provider-attempt budget without becoming unknown or retrying itself", async () => {
    const h = harness(1);
    h.request.mockResolvedValueOnce(
      new Response(null, { status: 429, headers: { "Retry-After": "120" } }),
    );
    expect(await h.call()).toEqual({
      state: "deferred",
      reason: "provider_rate_limit",
      retryAt: start + 120_000,
      attempted: true,
    });
    expect(h.rows.get(quotaPath)).toMatchObject({ attempts: 1 });
    h.advance(120_000);
    expect(await h.call()).toMatchObject({
      state: "deferred",
      reason: "daily_limit",
      attempted: false,
    });
    expect(h.request).toHaveBeenCalledOnce();
  });
  test("429 retry wait includes release transaction latency and permits the next actual attempt", async () => {
    const h = harness(2);
    h.afterTransaction((index) => {
      if (index === 2) h.advance(20);
    });
    h.request.mockResolvedValueOnce(
      new Response(null, { status: 429, headers: { "Retry-After": "1" } }),
    );
    const result = await h.call();
    expect(result).toEqual({
      state: "deferred",
      reason: "provider_rate_limit",
      attempted: true,
      retryAt: start + 1_020,
    });
    if (result.state !== "deferred") throw Error("EXPECTED_DEFERRAL");
    h.at(result.retryAt);
    expect((await h.call()).state).toBe("accepted");
    expect(h.request).toHaveBeenCalledTimes(2);
    expect(h.rows.get(quotaPath)).toMatchObject({ attempts: 2 });
  });
  test("same-day clock correction can resume after the previous reservation without waiting a full day", async () => {
    const h = harness(100, start - 1_000);
    await h.call();
    h.at(start - 1);
    expect(await h.call()).toMatchObject({
      state: "deferred",
      reason: "clock_rollback",
      retryAt: start + 1_000,
      attempted: false,
    });
    h.at(start + 1_000);
    expect((await h.call()).state).toBe("accepted");
    expect(h.request).toHaveBeenCalledTimes(2);
  });
  test.each([
    ["12", 12_000],
    ["0", 1_000],
    ["9999999999", 86_400_000],
    ["Fri, 09 Oct 2026 12:02:00 GMT", 120_000],
    ["Thu, 08 Oct 2026 12:00:00 GMT", 60_000],
    ["invalid upstream value", 60_000],
    ["1.5", 60_000],
    [null, 60_000],
  ])(
    "429 Retry-After is bounded and sanitized (%s)",
    async (retryAfter, expected) => {
      const h = harness();
      h.request.mockResolvedValueOnce(
        new Response("private provider body", {
          status: 429,
          headers: retryAfter === null ? {} : { "Retry-After": retryAfter },
        }),
      );
      expect(await h.call()).toEqual({
        state: "deferred",
        reason: "provider_rate_limit",
        retryAt: start + expected,
        attempted: true,
      });
      expect(h.request).toHaveBeenCalledOnce();
      expect(JSON.stringify([...h.rows.values()])).not.toContain(
        "private provider body",
      );
    },
  );
  test("older invocation cannot roll day or count backwards", async () => {
    const h = harness();
    h.at(Date.UTC(2026, 9, 10));
    await h.call();
    h.at(start);
    expect(await h.call()).toMatchObject({
      state: "deferred",
      reason: "clock_rollback",
      attempted: false,
    });
    expect(h.rows.get(quotaPath)).toMatchObject({
      dayUTC: "2026-10-10",
      attempts: 1,
    });
    expect(h.request).toHaveBeenCalledOnce();
  });
  test.each([
    { apiKey: "bad" },
    { stableJobKey: "../../invalid?" },
    { stableJobKey: "a".repeat(201) },
    { message: { ...message, subject: "bad\nheader" } },
    { message: { ...message, to: "a@b.invalid,c@d.invalid" } },
    { message: { ...message, from: "different@hunpeolabs.com" } },
    { message: { ...message, text: "x".repeat(16_001) } },
  ])("invalid request does not reserve quota: %j", async (overrides) => {
    const h = harness();
    expect(await h.call(overrides)).toEqual({
      state: "rejected",
      reason: "configuration",
      attempted: false,
    });
    expect(h.rows.size).toBe(0);
    expect(h.request).not.toHaveBeenCalled();
  });
  test("disabled config cannot consume quota or provider calls", async () => {
    const h = harness();
    expect(
      await h.call({ config: { ...h.config, enabled: false } }),
    ).toMatchObject({ state: "rejected", attempted: false });
    expect(h.rows.size).toBe(0);
    expect(h.request).not.toHaveBeenCalled();
  });
  test.each([
    { attempts: -1 },
    {
      schemaVersion: 2,
      dayUTC: "2026-10-09",
      attempts: 1,
      lastReservedAtMs: start,
    },
    {
      schemaVersion: 1,
      dayUTC: "2026-10-10",
      attempts: 1,
      lastReservedAtMs: start,
    },
    {
      schemaVersion: 1,
      dayUTC: "2026-10-09",
      attempts: 101,
      lastReservedAtMs: start,
    },
    ...[
      { dispatchLeaseId: randomUUID() },
      { dispatchLeaseExpiresAtMs: start + 330_000 },
      {
        dispatchLeaseId: "private-business-id",
        dispatchLeaseExpiresAtMs: start + 330_000,
      },
      {
        dispatchLeaseId: randomUUID(),
        dispatchLeaseExpiresAtMs: start + 330_001,
      },
      { nextDispatchAtMs: start + 999 },
      { nextDispatchAtMs: Number.NaN },
      { recipient: message.to },
    ].map((fields) => ({
      schemaVersion: 1,
      dayUTC: "2026-10-09",
      attempts: 1,
      lastReservedAtMs: start,
      ...fields,
    })),
  ])("malformed quota fails closed without overwrite", async (quota) => {
    const h = harness();
    h.rows.set(quotaPath, quota);
    expect(await h.call()).toMatchObject({
      state: "deferred",
      reason: "quota_unavailable",
      attempted: false,
    });
    expect(h.rows.get(quotaPath)).toEqual(quota);
    expect(h.request).not.toHaveBeenCalled();
  });
  test("database failure leaves work known-unsent and does not leak details", async () => {
    const h = harness();
    h.unavailable();
    expect(await h.call()).toEqual({
      state: "deferred",
      reason: "quota_unavailable",
      retryAt: start + 30 * 60_000,
      attempted: false,
    });
    expect(h.request).not.toHaveBeenCalled();
  });
  test.each([false, "throw"])(
    "superseded or unavailable final claim never calls provider: %s",
    async (outcome) => {
      const h = harness();
      const beforeSend = vi.fn(async () => {
        if (outcome === "throw") throw Error("private claim detail");
        return false;
      });
      expect(await h.call({ beforeSend })).toMatchObject({
        state: "deferred",
        attempted: false,
      });
      expect(beforeSend).toHaveBeenCalledOnce();
      expect(h.request).not.toHaveBeenCalled();
      // Pessimistic reservation remains consumed; no refund race with another worker.
      expect(h.rows.get(quotaPath)).toMatchObject({ attempts: 1 });
    },
  );
  test("final claim runs only after quota allows dispatch", async () => {
    const h = harness();
    const beforeSend = vi.fn(async () => true);
    await h.call({ beforeSend });
    await h.call({ beforeSend });
    expect(beforeSend).toHaveBeenCalledOnce();
    expect(h.request).toHaveBeenCalledOnce();
  });
  test("test reference override is rejected outside exact demo environment", async () => {
    const h = harness();
    const quotaRef = h.db.doc(`emailDispatchQuota/qa-${randomUUID()}`);
    expect(await h.call({ quotaRef })).toMatchObject({
      state: "rejected",
      reason: "configuration",
      attempted: false,
    });
    expect(h.rows.size).toBe(0);
    expect(h.request).not.toHaveBeenCalled();
  });
});

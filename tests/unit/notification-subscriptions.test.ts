import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { describe, expect, test, vi } from "vitest";
import {
  changeNotificationPreferences,
  emptyNotificationPreferences,
  notificationPhoneSchema,
  notificationRequestSchema,
  notificationState,
} from "../../packages/domain/notification-preferences";
import {
  saveNotificationPreferences,
  subscriptionHash,
} from "../../functions/src/notification-preferences-service";
import { applySubscriptionToken } from "../../functions/src/notification-token-service";
import {
  deliverSubscriptionJob,
  type SubscriptionSender,
  type SubscriptionIdentityReader,
} from "../../functions/src/subscription-delivery-service";
import { subscriptionContent } from "../../functions/src/subscription-content";
import { emailRequestIdentity } from "../../functions/src/email/dispatch";
import {
  optionalOrderNotificationAllowed,
  optionalOrderEmailTemplates,
  emailPreferenceAllowed,
} from "../../functions/src/notification-order-policy";
const email = "owner@example.invalid",
  now = 1791547200000;
const identity = async () => ({ email, verified: true, disabled: false });
// Serialized commit/rollback fake also rejects reads after writes, like Firestore transactions.
function harness() {
  const rows = new Map<string, Record<string, unknown>>();
  let tail = Promise.resolve();
  const snapshot = (ref: { path: string }) => ({
    ref,
    exists: rows.has(ref.path),
    data: () => structuredClone(rows.get(ref.path)),
  });
  const doc = (path: string) => ({
    path,
    get: async () => snapshot(doc(path)),
  });
  const db = {
    doc,
    getAll: async (...refs: { path: string }[]) => refs.map(snapshot),
    runTransaction<T>(body: (tx: unknown) => Promise<T>): Promise<T> {
      const execute = async () => {
        const writes: (() => void)[] = [];
        const read = (ref: { path: string }) => {
          if (writes.length) throw Error("READ_AFTER_WRITE");
          return snapshot(ref);
        };
        const tx = {
          get: async (ref: { path: string }) => read(ref),
          getAll: async (...refs: { path: string }[]) => refs.map(read),
          create: (ref: { path: string }, data: Record<string, unknown>) =>
            writes.push(() => {
              if (rows.has(ref.path)) throw Error("EXISTS");
              rows.set(ref.path, structuredClone(data));
            }),
          set: (ref: { path: string }, data: Record<string, unknown>) =>
            writes.push(() => rows.set(ref.path, structuredClone(data))),
          update: (ref: { path: string }, data: Record<string, unknown>) =>
            writes.push(() =>
              rows.set(ref.path, {
                ...rows.get(ref.path),
                ...structuredClone(data),
              }),
            ),
          delete: (ref: { path: string }) =>
            writes.push(() => {
              rows.delete(ref.path);
            }),
        };
        const result = await body(tx);
        writes.forEach((fn) => fn());
        return result;
      };
      const result = tail.then(execute);
      tail = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
  } as unknown as Firestore;
  const selected = { orderEmail: true, promotionsEmail: true, orderSms: false };
  const save = (overrides: Record<string, unknown> = {}) =>
    saveNotificationPreferences(
      db,
      "owner",
      email,
      notificationRequestSchema.parse({
        action: "save",
        operationId: randomUUID(),
        expectedVersion: 0,
        selected,
        phone: "",
        source: "profile",
        ...overrides,
      }) as Parameters<typeof saveNotificationPreferences>[3],
      now,
    );
  const send = vi
      .fn<SubscriptionSender["send"]>()
      .mockResolvedValue("accepted"),
    sender: SubscriptionSender = { available: () => true, send };
  const job = () =>
    [...rows.keys()]
      .find((k) => k.startsWith("notificationEmailJobs/"))!
      .split("/")[1];
  const deliver = () =>
    deliverSubscriptionJob(
      db,
      "email",
      job(),
      "https://satsunicgo.web.app",
      now,
      sender,
      identity,
    );
  const token = () =>
    /#notification-confirm=([a-f0-9]{64})/.exec(send.mock.calls[0][2].text)![1];
  return { rows, db, save, send, sender, job, deliver, token, selected };
}
describe("notification consent ownership and lifecycle", () => {
  test("phone parsing, strict payloads and no caller-selected owner/destination email", () => {
    expect(notificationPhoneSchema.parse("0912 345 678")).toBe("+84912345678");
    for (const phone of [
      "+12025550101",
      "https://bad.invalid",
      "123",
      "+849123456789",
    ])
      expect(notificationPhoneSchema.safeParse(phone).success).toBe(false);
    expect(
      notificationRequestSchema.safeParse({ action: "read", ownerId: "other" })
        .success,
    ).toBe(false);
    expect(
      notificationRequestSchema.safeParse({
        action: "confirm",
        token: "../bad",
      }).success,
    ).toBe(false);
  });
  test("no historical opt-in; destination change requires reconfirmation", () => {
    const p = emptyNotificationPreferences(email);
    expect(notificationState(p.topics.orderEmail)).toBe("off");
    const active = changeNotificationPreferences(
      p,
      email,
      "",
      { orderEmail: true, promotionsEmail: false, orderSms: false },
      now,
    );
    active.topics.orderEmail.confirmedGeneration = 1;
    const next = changeNotificationPreferences(
      active,
      "changed@example.invalid",
      "",
      { orderEmail: true, promotionsEmail: false, orderSms: false },
      now + 1,
    );
    expect(notificationState(next.topics.orderEmail)).toBe("pending");
    expect(next.version).toBe(2);
  });
  test("concurrent replay queues one job; different intent with same operation fails", async () => {
    const h = harness(),
      operationId = randomUUID();
    const result = await Promise.all(
      Array.from({ length: 10 }, () => h.save({ operationId })),
    );
    expect(result.every((p) => p.version === 1)).toBe(true);
    expect(
      [...h.rows.keys()].filter((k) => k.startsWith("notificationEmailJobs/")),
    ).toHaveLength(1);
    await expect(
      h.save({ operationId, selected: { ...h.selected, orderEmail: false } }),
    ).rejects.toMatchObject({ code: "already-exists" });
  });
  test("stale version cannot overwrite consent and accounts are isolated", async () => {
    const h = harness();
    await h.save();
    await expect(h.save()).rejects.toMatchObject({ code: "aborted" });
    expect(h.rows.has("notificationPreferences/other")).toBe(false);
  });
  test("locked user cannot save; phone is required for SMS", async () => {
    const h = harness();
    h.rows.set("users/owner", { locked: true });
    await expect(h.save()).rejects.toMatchObject({ code: "permission-denied" });
    h.rows.clear();
    await expect(
      h.save({ selected: { ...h.selected, orderSms: true } }),
    ).rejects.toThrow("PHONE_REQUIRED");
    expect(h.rows.size).toBe(0);
  });
  test("revocation is allowed at quota and does not resend another pending channel", async () => {
    const h = harness();
    await h.save();
    h.rows.set(
      `notificationRecipientQuotas/${subscriptionHash("owner:owner")}`,
      { windowAt: now, count: 10, lastAt: now },
    );
    const p = await h.save({
      expectedVersion: 1,
      selected: { ...h.selected, promotionsEmail: false },
    });
    expect(p.topics.promotionsEmail.requested).toBe(false);
    expect(
      [...h.rows.keys()].filter((k) => k.startsWith("notificationEmailJobs/")),
    ).toHaveLength(1);
  });
  test("resend is bounded and an all-off save does not consume sending quota", async () => {
    const h = harness();
    await h.save();
    await expect(
      saveNotificationPreferences(
        h.db,
        "owner",
        email,
        {
          action: "resend",
          operationId: randomUUID(),
          expectedVersion: 1,
          channel: "email",
        },
        now + 1,
      ),
    ).rejects.toMatchObject({ code: "resource-exhausted" });
    await expect(
      h.save({
        expectedVersion: 1,
        selected: {
          orderEmail: false,
          promotionsEmail: false,
          orderSms: false,
        },
      }),
    ).resolves.toMatchObject({ version: 2 });
  });
  test("confirmation stores hashes only, activates once and queues one welcome", async () => {
    const h = harness();
    await h.save();
    expect(await h.deliver()).toBe("accepted");
    const token = h.token();
    expect(JSON.stringify([...h.rows])).not.toContain(token);
    expect(
      await applySubscriptionToken(h.db, token, "confirm", now + 1, identity),
    ).toMatchObject({ status: "confirmed" });
    expect(
      await applySubscriptionToken(h.db, token, "confirm", now + 2, identity),
    ).toMatchObject({ status: "already_processed" });
    const p = h.rows.get("notificationPreferences/owner")!;
    expect(optionalOrderNotificationAllowed(p, "email", email)).toBe(true);
    expect(
      [...h.rows.values()].filter((v) => v.kind === "welcome"),
    ).toHaveLength(1);
  });
  test("old link cannot reactivate revoked choices", async () => {
    const h = harness();
    await h.save();
    await h.deliver();
    await h.save({
      expectedVersion: 1,
      selected: { orderEmail: false, promotionsEmail: false, orderSms: false },
    });
    await expect(
      applySubscriptionToken(h.db, h.token(), "confirm", now + 1, identity),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });
  test("expired, wrong-action, changed-email and disabled identity links fail closed", async () => {
    const h = harness();
    await h.save();
    await h.deliver();
    const token = h.token();
    await expect(
      applySubscriptionToken(h.db, token, "confirm", now + 86400000, identity),
    ).rejects.toThrow();
    await expect(
      applySubscriptionToken(h.db, token, "unsubscribe", now + 1, identity),
    ).rejects.toThrow();
    await expect(
      applySubscriptionToken(h.db, token, "confirm", now + 1, async () => ({
        email: "new@example.invalid",
        verified: true,
        disabled: false,
      })),
    ).rejects.toThrow();
    await expect(
      applySubscriptionToken(h.db, token, "confirm", now + 1, async () => ({
        email,
        verified: true,
        disabled: true,
      })),
    ).rejects.toThrow();
  });
  test("corrupt cross-channel challenge is rejected", async () => {
    const h = harness();
    await h.save();
    await h.deliver();
    const ref = `notificationChallenges/${subscriptionHash(h.token())}`;
    h.rows.set(ref, {
      ...h.rows.get(ref),
      channel: "sms",
      destinationHash: subscriptionHash(""),
    });
    await expect(
      applySubscriptionToken(h.db, h.token(), "confirm", now + 1, identity),
    ).rejects.toThrow();
  });
  test("welcome unsubscribe revokes scoped topics and cannot grant account access", async () => {
    const h = harness();
    await h.save();
    await h.deliver();
    await applySubscriptionToken(h.db, h.token(), "confirm", now + 1, identity);
    const welcome = [...h.rows.entries()]
      .find(
        ([k, v]) =>
          k.startsWith("notificationEmailJobs/") && v.kind === "welcome",
      )![0]
      .split("/")[1];
    await deliverSubscriptionJob(
      h.db,
      "email",
      welcome,
      "https://satsunicgo.web.app",
      now + 2,
      h.sender,
      identity,
    );
    const raw = /#notification-unsubscribe=([a-f0-9]{64})/.exec(
      h.send.mock.calls[1][2].text,
    )![1];
    expect(
      await applySubscriptionToken(h.db, raw, "unsubscribe", now + 3, identity),
    ).toEqual({ status: "unsubscribed" });
    expect(
      optionalOrderNotificationAllowed(
        h.rows.get("notificationPreferences/owner"),
        "email",
        email,
      ),
    ).toBe(false);
  });
});

describe("Resend subscription claim and attempt boundaries", () => {
  const from = "contact@hunpeolabs.com";
  const requestIdentity = (
    to: string,
    content: Parameters<SubscriptionSender["send"]>[2],
  ) => {
    if (!("html" in content) || typeof content.html !== "string")
      throw Error("EMAIL_CONTENT_REQUIRED");
    return emailRequestIdentity({
      from,
      to,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
  };
  const jobPath = (h: ReturnType<typeof harness>) =>
    `notificationEmailJobs/${h.job()}`;
  const challenges = (h: ReturnType<typeof harness>) =>
    [...h.rows.keys()].filter((path) =>
      path.startsWith("notificationChallenges/"),
    );

  test("structured accepted persists provider receipt under current claim without claiming inbox delivery", async () => {
    const h = harness();
    await h.save();
    const io = vi.fn(),
      providerId = randomUUID();
    h.send.mockImplementation(
      async (_channel, to, content, _key, authorize) => {
        expect(await authorize!(requestIdentity(to, content), from)).toBe(true);
        io();
        return { state: "accepted", attempted: true, providerId };
      },
    );
    expect(await h.deliver()).toBe("accepted");
    const row = h.rows.get(jobPath(h))!;
    expect(row).toMatchObject({
      state: "accepted",
      providerState: "accepted",
      providerId,
      providerFrom: from,
      providerAttempts: 1,
      acceptedAt: expect.any(Number),
    });
    expect(row).not.toHaveProperty("deliveredAt");
    expect(io).toHaveBeenCalledOnce();
    expect(row.providerRequestIdentity).toBe(
      requestIdentity(email, h.send.mock.calls[0][2]),
    );
    const stored = JSON.stringify([...h.rows]);
    expect(stored).not.toContain(h.token());
    expect(stored).not.toContain(h.send.mock.calls[0][2].text);
    expect(await h.deliver()).toBe("suppressed");
    expect(io).toHaveBeenCalledOnce();
  });

  test("structured late acceptance cannot replace another claim's unknown state", async () => {
    const h = harness();
    await h.save();
    const providerId = randomUUID();
    h.send.mockImplementation(
      async (_channel, to, content, _key, authorize) => {
        expect(await authorize!(requestIdentity(to, content), from)).toBe(true);
        h.rows.set(jobPath(h), {
          ...h.rows.get(jobPath(h)),
          state: "unknown",
          reconciliationRequired: true,
          claimId: "newer-claim",
        });
        return { state: "accepted", attempted: true, providerId };
      },
    );
    expect(await h.deliver()).toBe("suppressed");
    expect(h.rows.get(jobPath(h))).toMatchObject({
      state: "unknown",
      reconciliationRequired: true,
      claimId: "newer-claim",
    });
    expect(h.rows.get(jobPath(h))).not.toHaveProperty("providerId");
    expect(await h.deliver()).toBe("suppressed");
    expect(h.send).toHaveBeenCalledOnce();
  });

  test.each([
    ["daily quota", 43_200_000],
    ["rate collision", 1_000],
  ] as const)(
    "%s defers known-unsent without spending a job attempt and later creates a fresh usable challenge",
    async (_scenario, delay) => {
      const h = harness();
      await h.save();
      h.send.mockResolvedValueOnce({
        state: "deferred",
        attempted: false,
        retryAt: now + delay,
      });
      expect(await h.deliver()).toBe("queued");
      const firstToken = h.token();
      expect(h.rows.get(jobPath(h))).toMatchObject({
        state: "queued",
        retryAt: now + delay,
        reconciliationRequired: false,
      });
      expect(h.rows.get(jobPath(h))?.providerAttempts ?? 0).toBe(0);
      expect(h.rows.get(jobPath(h))).not.toHaveProperty(
        "providerRequestIdentity",
      );
      expect(challenges(h)).toHaveLength(0);
      expect(await h.deliver()).toBe("deferred");
      expect(h.send).toHaveBeenCalledOnce();
      const io = vi.fn();
      h.send.mockImplementation(
        async (_channel, to, content, _key, authorize) => {
          expect(await authorize!(requestIdentity(to, content), from)).toBe(
            true,
          );
          io();
          return {
            state: "accepted",
            attempted: true,
            providerId: randomUUID(),
          };
        },
      );
      expect(
        await deliverSubscriptionJob(
          h.db,
          "email",
          h.job(),
          "https://satsunicgo.web.app",
          now + delay,
          h.sender,
          identity,
        ),
      ).toBe("accepted");
      const freshToken = /#notification-confirm=([a-f0-9]{64})/.exec(
        h.send.mock.calls[1][2].text,
      )![1];
      expect(freshToken).not.toBe(firstToken);
      expect(challenges(h)).toHaveLength(1);
      expect(io).toHaveBeenCalledOnce();
      expect(
        await applySubscriptionToken(
          h.db,
          freshToken,
          "confirm",
          now + delay + 1,
          identity,
        ),
      ).toMatchObject({ status: "confirmed" });
      const stored = JSON.stringify([...h.rows]);
      expect(stored).not.toContain(firstToken);
      expect(stored).not.toContain(freshToken);
      expect(stored).not.toContain(h.send.mock.calls[1][2].text);
    },
  );

  test("minimumCreatedAt retires pre-cutover backlog without Auth or sender work", async () => {
    const h = harness();
    await h.save();
    const resolve = vi.fn(identity);
    expect(
      await deliverSubscriptionJob(
        h.db,
        "email",
        h.job(),
        "https://satsunicgo.web.app",
        now,
        h.sender,
        resolve,
        now + 1,
      ),
    ).toBe("blocked_policy");
    expect(h.rows.get(jobPath(h))?.state).toBe("blocked_policy");
    expect(resolve).not.toHaveBeenCalled();
    expect(h.send).not.toHaveBeenCalled();
    expect(challenges(h)).toHaveLength(0);
  });

  test("known-unsent final lease denial after pinning is terminal; explicit user resend creates a fresh recoverable operation", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
      const h = harness();
      await h.save();
      const originalId = h.job(),
        originalPath = jobPath(h),
        io = vi.fn();
      h.send.mockImplementationOnce(
        async (_channel, to, content, _key, authorize) => {
          expect(await authorize!(requestIdentity(to, content), from)).toBe(
            true,
          );
          // The final lease fence denies I/O after the job has pinned its immutable body.
          return { state: "deferred", attempted: false, retryAt: now + 60_001 };
        },
      );
      expect(await h.deliver()).toBe("rejected");
      const originalToken = h.token(),
        originalRow = structuredClone(h.rows.get(originalPath));
      expect(originalRow).toMatchObject({
        state: "rejected",
        providerAttempts: 1,
        reconciliationRequired: false,
      });
      expect(originalRow?.providerRequestIdentity).toMatch(/^[a-f0-9]{64}$/);
      expect(await h.deliver()).toBe("suppressed");
      expect(h.send).toHaveBeenCalledOnce();
      expect(io).not.toHaveBeenCalled();
      expect(h.rows.get(originalPath)).toEqual(originalRow);

      vi.setSystemTime(now + 60_001);
      const preferences = h.rows.get("notificationPreferences/owner")!;
      await saveNotificationPreferences(
        h.db,
        "owner",
        email,
        notificationRequestSchema.parse({
          action: "resend",
          channel: "email",
          operationId: randomUUID(),
          expectedVersion: preferences.version,
        }) as Parameters<typeof saveNotificationPreferences>[3],
        now + 60_001,
      );
      const freshId = [...h.rows.entries()]
        .find(
          ([path, row]) =>
            path.startsWith("notificationEmailJobs/") && row.state === "queued",
        )![0]
        .split("/")[1];
      expect(freshId).not.toBe(originalId);
      h.send.mockImplementation(
        async (_channel, to, content, _key, authorize) => {
          expect(await authorize!(requestIdentity(to, content), from)).toBe(
            true,
          );
          io();
          return {
            state: "accepted",
            attempted: true,
            providerId: randomUUID(),
          };
        },
      );
      expect(
        await deliverSubscriptionJob(
          h.db,
          "email",
          freshId,
          "https://satsunicgo.web.app",
          now + 60_001,
          h.sender,
          identity,
        ),
      ).toBe("accepted");
      expect(io).toHaveBeenCalledOnce();
      expect(h.rows.get(originalPath)).toEqual(originalRow);
      const freshToken = /#notification-confirm=([a-f0-9]{64})/.exec(
        h.send.mock.calls[1][2].text,
      )![1];
      expect(freshToken).not.toBe(originalToken);
      expect(
        await applySubscriptionToken(
          h.db,
          freshToken,
          "confirm",
          now + 60_002,
          identity,
        ),
      ).toMatchObject({ status: "confirmed" });
      const stored = JSON.stringify([...h.rows]);
      expect(stored).not.toContain(originalToken);
      expect(stored).not.toContain(freshToken);
      expect(stored).not.toContain(h.send.mock.calls[1][2].text);
    } finally {
      vi.useRealTimers();
    }
  });

  test.each(["disabled", "unverified", "changed-email", "missing"])(
    "Auth becomes %s during final authorization: no provider I/O",
    async (scenario) => {
      const h = harness();
      await h.save();
      const io = vi.fn();
      let live: Awaited<ReturnType<SubscriptionIdentityReader>> =
        await identity();
      h.send.mockImplementation(
        async (_channel, to, content, _key, authorize) => {
          live =
            scenario === "missing"
              ? null
              : {
                  email:
                    scenario === "changed-email"
                      ? "changed@example.invalid"
                      : email,
                  verified: scenario !== "unverified",
                  disabled: scenario === "disabled",
                };
          if (await authorize!(requestIdentity(to, content), from)) io();
          return { state: "deferred", attempted: false, retryAt: now + 1_000 };
        },
      );
      expect(
        await deliverSubscriptionJob(
          h.db,
          "email",
          h.job(),
          "https://satsunicgo.web.app",
          now,
          h.sender,
          async () => live,
        ),
      ).toBe("blocked_recipient");
      expect(h.rows.get(jobPath(h))?.state).toBe("blocked_recipient");
      expect(io).not.toHaveBeenCalled();
      expect(h.rows.get(jobPath(h))?.providerAttempts ?? 0).toBe(0);
    },
  );

  test.each(["revoked", "locked", "changed-claim"])(
    "%s during final authorization prevents provider I/O and preserves the newest state",
    async (scenario) => {
      const h = harness();
      await h.save();
      const io = vi.fn();
      h.send.mockImplementation(
        async (_channel, to, content, _key, authorize) => {
          if (scenario === "revoked")
            await h.save({
              expectedVersion: 1,
              selected: {
                orderEmail: false,
                promotionsEmail: false,
                orderSms: false,
              },
            });
          if (scenario === "locked")
            h.rows.set("users/owner", { locked: true });
          if (scenario === "changed-claim")
            h.rows.set(jobPath(h), {
              ...h.rows.get(jobPath(h)),
              state: "unknown",
              claimId: "other",
              reconciliationRequired: true,
            });
          if (await authorize!(requestIdentity(to, content), from)) io();
          return { state: "deferred", attempted: false, retryAt: now + 1_000 };
        },
      );
      expect(await h.deliver()).toBe("suppressed");
      expect(io).not.toHaveBeenCalled();
      expect(h.rows.get(jobPath(h))?.state).toBe(
        scenario === "changed-claim" ? "unknown" : "suppressed",
      );
    },
  );

  test.each(["body", "from"])(
    "pinned %s mismatch becomes unknown and is never automatically resent",
    async (field) => {
      const h = harness();
      await h.save();
      const io = vi.fn();
      const pinned =
        field === "body"
          ? { providerRequestIdentity: "a".repeat(64) }
          : { providerFrom: "previous@hunpeolabs.com" };
      h.rows.set(jobPath(h), {
        ...h.rows.get(jobPath(h)),
        ...pinned,
        providerAttempts: 1,
        firstProviderAttemptAt: now - 1,
      });
      h.send.mockImplementation(
        async (_channel, to, content, _key, authorize) => {
          if (await authorize!(requestIdentity(to, content), from)) io();
          return { state: "deferred", attempted: false, retryAt: now + 1_000 };
        },
      );
      expect(await h.deliver()).toBe("unknown");
      expect(h.rows.get(jobPath(h))).toMatchObject({
        state: "unknown",
        reconciliationRequired: true,
        providerAttempts: 1,
      });
      expect(await h.deliver()).toBe("suppressed");
      expect(io).not.toHaveBeenCalled();
      expect(h.send).toHaveBeenCalledOnce();
    },
  );

  test.each([
    { providerAttempts: 3 },
    { providerAttempts: 1, firstProviderAttemptAt: now - 86_400_000 },
  ])(
    "exhausted queued attempt/window is retired before any Auth/provider work: %j",
    async (fields) => {
      const h = harness();
      await h.save();
      const resolve = vi.fn(identity);
      h.rows.set(jobPath(h), { ...h.rows.get(jobPath(h)), ...fields });
      expect(
        await deliverSubscriptionJob(
          h.db,
          "email",
          h.job(),
          "https://satsunicgo.web.app",
          now,
          h.sender,
          resolve,
        ),
      ).toBe("expired");
      expect(h.rows.get(jobPath(h))?.state).toBe("expired");
      expect(resolve).not.toHaveBeenCalled();
      expect(h.send).not.toHaveBeenCalled();
    },
  );

  test("24-hour provider window crossed during final authorize prevents another I/O attempt", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
      const h = harness();
      await h.save();
      const io = vi.fn();
      h.rows.set(jobPath(h), {
        ...h.rows.get(jobPath(h)),
        providerAttempts: 1,
        firstProviderAttemptAt: now - 86_400_000 + 1_000,
      });
      h.send.mockImplementation(
        async (_channel, to, content, _key, authorize) => {
          vi.setSystemTime(now + 1_001);
          if (await authorize!(requestIdentity(to, content), from)) io();
          return { state: "deferred", attempted: false, retryAt: now + 2_000 };
        },
      );
      await h.deliver();
      expect(io).not.toHaveBeenCalled();
      expect(h.rows.get(jobPath(h))?.providerAttempts).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
  test.each([
    { kind: "confirm", maximumAge: 86_400_000 },
    { kind: "welcome", maximumAge: 604_800_000 },
  ] as const)(
    "$kind job expiring during final authorize cannot start provider I/O",
    async ({ kind, maximumAge }) => {
      vi.useFakeTimers();
      vi.setSystemTime(now);
      try {
        const h = harness();
        await h.save();
        let id = h.job();
        if (kind === "welcome") {
          await h.deliver();
          await applySubscriptionToken(
            h.db,
            h.token(),
            "confirm",
            now,
            identity,
          );
          id = [...h.rows.entries()]
            .find(
              ([path, row]) =>
                path.startsWith("notificationEmailJobs/") &&
                row.kind === "welcome",
            )![0]
            .split("/")[1];
          h.send.mockClear();
        }
        const path = `notificationEmailJobs/${id}`;
        h.rows.set(path, {
          ...h.rows.get(path),
          createdAt: now - maximumAge + 500,
        });
        const io = vi.fn();
        h.send.mockImplementation(
          async (_channel, to, content, _key, authorize) => {
            vi.setSystemTime(now + 1_000);
            if (await authorize!(requestIdentity(to, content), from)) io();
            return {
              state: "deferred",
              attempted: false,
              retryAt: now + 2_000,
            };
          },
        );
        await deliverSubscriptionJob(
          h.db,
          "email",
          id,
          "https://satsunicgo.web.app",
          now,
          h.sender,
          identity,
        );
        expect(h.send).toHaveBeenCalledOnce();
        expect(io).not.toHaveBeenCalled();
        expect(h.rows.get(path)?.providerAttempts ?? 0).toBe(0);
        expect(h.rows.get(path)?.state).toMatch(/^(expired|suppressed)$/);
      } finally {
        vi.useRealTimers();
      }
    },
  );
});
describe("subscription delivery boundary", () => {
  test("missing SMS provider does no database or sender I/O", async () => {
    const db = { doc: vi.fn() } as unknown as Firestore,
      send = vi.fn();
    expect(
      await deliverSubscriptionJob(
        db,
        "sms",
        "unused",
        "https://satsunicgo.web.app",
        now,
        { available: () => false, send },
        identity,
      ),
    ).toBe("unavailable");
    expect(db.doc).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
  test("concurrent workers send once; accepted job cannot be replayed", async () => {
    const h = harness();
    await h.save();
    await Promise.all([h.deliver(), h.deliver(), h.deliver()]);
    expect(h.send).toHaveBeenCalledOnce();
    await h.deliver();
    expect(h.send).toHaveBeenCalledOnce();
  });
  test("unknown provider outcome is terminal until reconciliation", async () => {
    const h = harness();
    await h.save();
    h.send.mockRejectedValueOnce(Error("provider-private-detail"));
    expect(await h.deliver()).toBe("unknown");
    await h.deliver();
    expect(h.send).toHaveBeenCalledOnce();
    expect(h.rows.get(`notificationEmailJobs/${h.job()}`)).toMatchObject({
      state: "unknown",
      reconciliationRequired: true,
    });
  });
  test("historical queued confirmations expire instead of sending on later activation", async () => {
    const h = harness();
    await h.save();
    expect(
      await deliverSubscriptionJob(
        h.db,
        "email",
        h.job(),
        "https://satsunicgo.web.app",
        now + 86400001,
        h.sender,
        identity,
      ),
    ).toBe("suppressed");
    expect(h.send).not.toHaveBeenCalled();
    expect(h.rows.get(`notificationEmailJobs/${h.job()}`)?.state).toBe(
      "expired",
    );
  });
  test("revoked before delivery suppresses without sending", async () => {
    const h = harness();
    await h.save();
    await h.save({
      expectedVersion: 1,
      selected: { orderEmail: false, promotionsEmail: false, orderSms: false },
    });
    expect(await h.deliver()).toBe("suppressed");
    expect(h.send).not.toHaveBeenCalled();
  });
  test("unverified identity suppresses delivery; unsafe origin fails", async () => {
    const h = harness();
    await h.save();
    expect(
      await deliverSubscriptionJob(
        h.db,
        "email",
        h.job(),
        "https://satsunicgo.web.app",
        now,
        h.sender,
        async () => ({ email, verified: false, disabled: false }),
      ),
    ).toBe("blocked_recipient");
    await expect(
      deliverSubscriptionJob(
        h.db,
        "email",
        h.job(),
        "http://evil.invalid",
        now,
        h.sender,
        identity,
      ),
    ).rejects.toThrow();
    expect(h.send).not.toHaveBeenCalled();
  });
  test("email and SMS templates have real actions and no tracking assets", () => {
    const link =
      "https://satsunicgo.web.app/account/profile#notification-confirm=" +
      "a".repeat(64);
    const content = subscriptionContent(
      "email",
      "confirm",
      ["orderEmail"],
      link,
    );
    expect(content.text).toContain(link);
    expect(content.html).not.toContain("<img");
    expect(content.html).toContain("Xác nhận đăng ký");
    expect(
      subscriptionContent("sms", "confirm", ["orderSms"], link).text,
    ).toContain("SatsunicGo");
    expect(() =>
      subscriptionContent(
        "email",
        "confirm",
        ["orderEmail"],
        "javascript:alert(1)",
      ),
    ).toThrow();
  });
  test("optional delivery fails closed and required financial mail is preserved", () => {
    expect(optionalOrderNotificationAllowed(undefined, "email", email)).toBe(
      false,
    );
    for (const template of [
      "payment_confirmed",
      "receipt_ready",
      "refund_recorded",
      "quote_ready",
      "final_balance_due",
    ])
      expect(optionalOrderEmailTemplates.has(template)).toBe(false);
  });
});

test("legacy marketing consent alone cannot authorize promotion dispatch", async () => {
  const h = harness();
  h.rows.set("users/owner", { marketingConsent: true });
  expect(
    await emailPreferenceAllowed(
      h.db,
      { ownerId: "owner", marketing: true },
      email,
    ),
  ).toBe(false);
  await h.save();
  await h.deliver();
  await applySubscriptionToken(h.db, h.token(), "confirm", now + 1, identity);
  expect(
    await emailPreferenceAllowed(
      h.db,
      { ownerId: "owner", marketing: true },
      email,
    ),
  ).toBe(true);
  expect(
    await emailPreferenceAllowed(
      h.db,
      { ownerId: "owner", marketing: true },
      "changed@example.invalid",
    ),
  ).toBe(false);
  expect(
    await emailPreferenceAllowed(
      h.db,
      { ownerId: "owner", customerEvent: { templateId: "receipt_ready" } },
      email,
    ),
  ).toBe(true);
});

describe("NOT-17 terminal queue retirement", () => {
  const deliverWith = (
    h: ReturnType<typeof harness>,
    resolve: SubscriptionIdentityReader,
    time = now,
  ) =>
    deliverSubscriptionJob(
      h.db,
      "email",
      h.job(),
      "https://satsunicgo.web.app",
      time,
      h.sender,
      resolve,
    );
  test.each([
    ["missing", null],
    ["disabled", { email, verified: true, disabled: true }],
    ["unverified", { email, verified: false, disabled: false }],
    ["no email", { email: "", verified: true, disabled: false }],
  ] as const)(
    "%s identity retires queued job without changing consent",
    async (_name, value) => {
      const h = harness();
      await h.save();
      const original = structuredClone(
        h.rows.get("notificationPreferences/owner"),
      );
      const resolve = vi.fn(async () => value);
      expect(await deliverWith(h, resolve)).toBe("blocked_recipient");
      expect(h.rows.get(`notificationEmailJobs/${h.job()}`)).toMatchObject({
        state: "blocked_recipient",
        finishedAt: now,
      });
      expect(await deliverWith(h, resolve)).toBe("suppressed");
      expect(resolve).toHaveBeenCalledOnce();
      expect(h.send).not.toHaveBeenCalled();
      expect(h.rows.get("notificationPreferences/owner")).toEqual(original);
    },
  );
  test.each(["auth/user-not-found", "auth/invalid-uid"])(
    "%s is permanent, not an outage",
    async (code) => {
      const h = harness();
      await h.save();
      expect(
        await deliverWith(h, async () => {
          throw { code };
        }),
      ).toBe("blocked_recipient");
      expect(h.rows.get(`notificationEmailJobs/${h.job()}`)?.state).toBe(
        "blocked_recipient",
      );
      expect(h.send).not.toHaveBeenCalled();
    },
  );
  test.each([
    "auth/internal-error",
    "auth/network-request-failed",
    "auth/too-many-requests",
    "unknown",
  ])(
    "%s leaves job retryable and later healthy lookup can send",
    async (code) => {
      const h = harness();
      await h.save();
      const ref = `notificationEmailJobs/${h.job()}`,
        original = structuredClone(h.rows.get(ref));
      expect(
        await deliverWith(h, async () => {
          throw { code };
        }),
      ).toBe("identity_unavailable");
      expect(h.rows.get(ref)).toEqual(original);
      expect(h.send).not.toHaveBeenCalled();
      expect(await deliverWith(h, identity)).toBe("accepted");
      expect(h.send).toHaveBeenCalledOnce();
    },
  );
  test("expired queued job retires before Auth lookup even during an outage", async () => {
    const h = harness();
    await h.save();
    const resolve = vi.fn(async () => {
      throw Error("Auth unavailable");
    });
    expect(await deliverWith(h, resolve, now + 86400001)).toBe("suppressed");
    expect(h.rows.get(`notificationEmailJobs/${h.job()}`)?.state).toBe(
      "expired",
    );
    expect(resolve).not.toHaveBeenCalled();
    expect(h.send).not.toHaveBeenCalled();
  });
  test.each([
    { ownerId: "bad/owner" },
    { channel: "sms" },
    { scopes: [] },
    { createdAt: "unknown" },
  ])("malformed queued snapshot is retired: %j", async (bad) => {
    const h = harness();
    await h.save();
    const ref = `notificationEmailJobs/${h.job()}`;
    h.rows.set(ref, { ...h.rows.get(ref), ...bad });
    const resolve = vi.fn(identity);
    expect(await deliverWith(h, resolve)).toBe("blocked_content");
    expect(h.rows.get(ref)?.state).toBe("blocked_content");
    expect(resolve).not.toHaveBeenCalled();
    expect(h.send).not.toHaveBeenCalled();
  });
  test.each([
    "sending",
    "accepted",
    "unknown",
    "rejected",
    "expired",
    "blocked_recipient",
    "blocked_content",
  ])("never overwrites existing %s state", async (state) => {
    const h = harness();
    await h.save();
    const ref = `notificationEmailJobs/${h.job()}`;
    h.rows.set(ref, { ...h.rows.get(ref), state, claimId: "other-claim" });
    const original = structuredClone(h.rows.get(ref)),
      resolve = vi.fn(async () => null);
    expect(await deliverWith(h, resolve)).toBe("suppressed");
    expect(h.rows.get(ref)).toEqual(original);
    expect(resolve).not.toHaveBeenCalled();
    expect(h.send).not.toHaveBeenCalled();
  });
  test.each(["accepted", "unknown", "sending", "queued"])(
    "identity block cannot overwrite raced %s snapshot",
    async (state) => {
      const h = harness();
      await h.save();
      const ref = `notificationEmailJobs/${h.job()}`;
      let raced: Record<string, unknown> | undefined;
      const resolve = async () => {
        raced = { ...h.rows.get(ref), state, claimId: "new-claim" };
        h.rows.set(ref, raced);
        return null;
      };
      expect(await deliverWith(h, resolve)).toBe("suppressed");
      expect(h.rows.get(ref)).toEqual(raced);
      expect(h.send).not.toHaveBeenCalled();
    },
  );
  test("successful identity cannot claim a changed queued payload", async () => {
    const h = harness();
    await h.save();
    const ref = `notificationEmailJobs/${h.job()}`;
    const resolve = async () => {
      h.rows.set(ref, {
        ...h.rows.get(ref),
        destinationHash: subscriptionHash("different@example.invalid"),
      });
      return identity();
    };
    expect(await deliverWith(h, resolve)).toBe("suppressed");
    expect(h.rows.get(ref)?.state).toBe("queued");
    expect(h.send).not.toHaveBeenCalled();
  });
});

test("NOT-17 malformed persisted preference retires job without resetting consent", async () => {
  const h = harness();
  await h.save();
  const corrupted = { schemaVersion: 99, opaque: "preserve-for-investigation" };
  h.rows.set("notificationPreferences/owner", corrupted);
  expect(await h.deliver()).toBe("suppressed");
  expect(h.rows.get(`notificationEmailJobs/${h.job()}`)?.state).toBe(
    "blocked_content",
  );
  expect(h.rows.get("notificationPreferences/owner")).toEqual(corrupted);
  expect(h.send).not.toHaveBeenCalled();
});

// Realistic interleavings at the durable claim boundary, before provider I/O.
function afterClaim(h: ReturnType<typeof harness>, change: () => void) {
  const transaction = h.db.runTransaction.bind(h.db);
  let fired = false;
  h.db.runTransaction = (async (
    ...args: Parameters<Firestore["runTransaction"]>
  ) => {
    const result = await transaction(...args);
    if (
      !fired &&
      h.rows.get(`notificationEmailJobs/${h.job()}`)?.state === "sending"
    ) {
      fired = true;
      change();
    }
    return result;
  }) as Firestore["runTransaction"];
}

describe("real-world subscription delivery interleavings", () => {
  test.each([
    "locked",
    "revoked",
    "missing-consent",
    "corrupt-consent",
    "lost-claim",
  ])(
    "customer becomes %s after claim: no provider side effect",
    async (scenario) => {
      const h = harness();
      await h.save();
      afterClaim(h, () => {
        const path = "notificationPreferences/owner";
        if (scenario === "locked") h.rows.set("users/owner", { locked: true });
        if (scenario === "missing-consent") h.rows.delete(path);
        if (scenario === "corrupt-consent")
          h.rows.set(path, { schemaVersion: 99 });
        if (scenario === "revoked") {
          const p = emptyNotificationPreferences(email);
          h.rows.set(path, p);
        }
        if (scenario === "lost-claim") {
          const ref = `notificationEmailJobs/${h.job()}`;
          h.rows.set(ref, {
            ...h.rows.get(ref),
            state: "unknown",
            reconciliationRequired: true,
          });
        }
      });
      await expect(h.deliver()).resolves.toBe("suppressed");
      expect(h.send).not.toHaveBeenCalled();
      expect(h.rows.get(`notificationEmailJobs/${h.job()}`)?.state).toBe(
        scenario === "lost-claim" ? "unknown" : "suppressed",
      );
    },
  );
  test("preflight database outage records uncertainty without calling provider or hanging sending", async () => {
    const h = harness();
    await h.save();
    afterClaim(h, () => {
      h.db.getAll = vi.fn().mockRejectedValue(Error("unavailable"));
    });
    await expect(h.deliver()).resolves.toBe("unknown");
    expect(h.send).not.toHaveBeenCalled();
    expect(h.rows.get(`notificationEmailJobs/${h.job()}`)).toMatchObject({
      state: "unknown",
      reconciliationRequired: true,
    });
  });
  test("late provider acceptance cannot report accepted over a newer reconciliation state", async () => {
    const h = harness();
    await h.save();
    h.send.mockImplementation(async () => {
      const ref = `notificationEmailJobs/${h.job()}`;
      h.rows.set(ref, {
        ...h.rows.get(ref),
        state: "unknown",
        reconciliationRequired: true,
      });
      return "accepted";
    });
    expect(await h.deliver()).toBe("suppressed");
    expect(h.rows.get(`notificationEmailJobs/${h.job()}`)?.state).toBe(
      "unknown",
    );
    expect(await h.deliver()).toBe("suppressed");
    expect(h.send).toHaveBeenCalledOnce();
  });
  test("provider rejection is terminal; repeated worker does not send again", async () => {
    const h = harness();
    await h.save();
    h.send.mockResolvedValue("rejected");
    expect(await h.deliver()).toBe("rejected");
    expect(await h.deliver()).toBe("suppressed");
    expect(h.send).toHaveBeenCalledOnce();
  });
  test("50 competing workers create one challenge and make one provider call", async () => {
    const h = harness();
    await h.save();
    const results = await Promise.all(
      Array.from({ length: 50 }, () => h.deliver()),
    );
    expect(results.filter((r) => r === "accepted")).toHaveLength(1);
    expect(h.send).toHaveBeenCalledOnce();
    expect(
      [...h.rows.keys()].filter((k) => k.startsWith("notificationChallenges/")),
    ).toHaveLength(1);
  });
  test("20 concurrent resend requests respect recipient quota atomically", async () => {
    const h = harness();
    await h.save();
    const outcomes = await Promise.allSettled(
      Array.from({ length: 20 }, () =>
        saveNotificationPreferences(
          h.db,
          "owner",
          email,
          {
            action: "resend",
            operationId: randomUUID(),
            expectedVersion: 1,
            channel: "email",
          },
          now + 60001,
        ),
      ),
    );
    // First concurrent request consumes cooldown; other requests leave no partial operation/job.
    expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      [...h.rows.keys()].filter((k) => k.startsWith("notificationEmailJobs/")),
    ).toHaveLength(2);
    expect(
      h.rows.get(
        `notificationRecipientQuotas/${subscriptionHash("email:" + email)}`,
      )?.count,
    ).toBe(2);
  });
  test("SMS choice is stored pending with normalized phone; unavailable sender does not claim", async () => {
    const h = harness();
    const p = await h.save({
      selected: { ...h.selected, orderSms: true },
      phone: "0912 345 678",
    });
    expect(p.phone).toBe("+84912345678");
    expect(notificationState(p.topics.orderSms)).toBe("pending");
    const path = [...h.rows.keys()].find((k) =>
      k.startsWith("notificationSmsJobs/"),
    )!;
    const before = structuredClone(h.rows.get(path));
    expect(
      await deliverSubscriptionJob(
        h.db,
        "sms",
        path.split("/")[1],
        "https://satsunicgo.web.app",
        now,
        { ...h.sender, available: () => false },
        identity,
      ),
    ).toBe("unavailable");
    expect(h.rows.get(path)).toEqual(before);
    expect(h.send).not.toHaveBeenCalled();
  });
});

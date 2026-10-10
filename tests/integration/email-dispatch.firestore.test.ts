import { randomUUID } from "node:crypto";
import { deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { afterAll, describe, expect, test, vi } from "vitest";
import { dispatchResend } from "../../functions/src/email/dispatch";
import { parseEmailProviderConfig } from "../../functions/src/email/provider-config";

const enabled = process.env.RUN_EMAIL_DISPATCH_EMULATOR_TESTS === "1";
describe.skipIf(!enabled)("Resend quota on shared demo Firestore", () => {
  let app: ReturnType<typeof initializeApp> | undefined;
  const owned = new Set<string>();
  function setup() {
    if (
      process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
      process.env.GCLOUD_PROJECT !== "demo-satsunicgo"
    ) {
      throw Error("EXACT_DEMO_EMULATOR_REQUIRED");
    }
    app ??= initializeApp(
      { projectId: "demo-satsunicgo" },
      `email-dispatch-${randomUUID()}`,
    );
    const db = getFirestore(app);
    const quotaRef = db.doc(`emailDispatchQuota/qa-${randomUUID()}`);
    owned.add(quotaRef.path);
    let now = Date.UTC(2026, 9, 9, 12);
    const config = parseEmailProviderConfig({
      approved: true,
      provider: "resend",
      enabled: true,
      subscriptionsEnabled: true,
      from: "contact@hunpeolabs.com",
      verifiedDomain: "hunpeolabs.com",
      cutoverAt: now,
      dailyAttemptLimit: 2,
      domainVerificationEvidenceId: "qa/synthetic-receipt",
      domainVerifiedAt: now - 1,
    })!;
    const request = vi
      .fn<typeof fetch>()
      .mockImplementation(
        async () =>
          new Response(JSON.stringify({ id: randomUUID() }), { status: 200 }),
      );
    const call = (key: string, beforeSend?: () => Promise<boolean>) =>
      dispatchResend({
        db,
        config,
        quotaRef,
        now: () => now,
        request,
        beforeSend,
        message: {
          from: config.from,
          to: "fixture@example.invalid",
          subject: "Synthetic test",
          text: "Fixture only.",
          html: "<p>Fixture only.</p>",
        },
        apiKey: "re_synthetic_dispatch_only_123456",
        stableJobKey: key,
      });
    return {
      db,
      quotaRef,
      request,
      call,
      at: (value: number) => (now = value),
      advance: (value: number) => (now += value),
    };
  }
  afterAll(async () => {
    if (!app) return;
    const db = getFirestore(app);
    await Promise.all([...owned].map((path) => db.doc(path).delete()));
    const absent = await Promise.all(
      [...owned].map(async (path) => !(await db.doc(path).get()).exists),
    );
    expect(absent.every(Boolean)).toBe(true);
    await db.terminate();
    await deleteApp(app);
  });
  test("independent workers share cadence, cap, monotonic rollover and isolated cleanup", async () => {
    const h = setup();
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, n) =>
        h.call(
          `${n % 2 ? "outboxJobs" : "notificationEmailJobs"}/fixture-${n}`,
        ),
      ),
    );
    expect(results.filter((value) => value.state === "accepted")).toHaveLength(
      1,
    );
    expect(
      results.filter((value) => value.state === "deferred" && !value.attempted),
    ).toHaveLength(9);
    expect(h.request).toHaveBeenCalledOnce();
    h.advance(1_000);
    expect((await h.call("notificationEmailJobs/second")).state).toBe(
      "accepted",
    );
    h.advance(1_000);
    expect(await h.call("outboxJobs/over-cap")).toMatchObject({
      state: "deferred",
      reason: "daily_limit",
      attempted: false,
    });
    h.at(Date.UTC(2026, 9, 10));
    expect((await h.call("outboxJobs/new-day")).state).toBe("accepted");
    h.at(Date.UTC(2026, 9, 9, 12));
    expect(
      await h.call("notificationEmailJobs/older-invocation"),
    ).toMatchObject({
      state: "deferred",
      reason: "clock_rollback",
      attempted: false,
    });
    expect((await h.quotaRef.get()).data()).toMatchObject({
      dayUTC: "2026-10-10",
      attempts: 1,
    });
    expect(h.request).toHaveBeenCalledTimes(3);
  });
  test("lost final claim consumes only technical quota and never calls provider", async () => {
    const h = setup();
    expect(
      await h.call("outboxJobs/superseded", async () => false),
    ).toMatchObject({
      state: "deferred",
      reason: "claim_unavailable",
      attempted: false,
    });
    expect(h.request).not.toHaveBeenCalled();
    expect((await h.quotaRef.get()).data()).toMatchObject({ attempts: 1 });
  });
  test("async authorization lease excludes real Firestore contenders and enforces completion cooldown", async () => {
    const h = setup();
    let authorize!: () => void;
    let entered!: () => void;
    const authorization = new Promise<void>((resolve) => (authorize = resolve));
    const waiting = new Promise<void>((resolve) => (entered = resolve));
    const first = h.call("outboxJobs/slow-authorization", async () => {
      entered();
      await authorization;
      return true;
    });
    await waiting;
    const held = (await h.quotaRef.get()).data()!;
    expect(held.dispatchLeaseId).toMatch(/^[a-f0-9-]{36}$/);
    expect(held.dispatchLeaseExpiresAtMs - held.lastReservedAtMs).toBe(330_000);
    h.advance(1_500);
    const contenders = await Promise.all(
      Array.from({ length: 10 }, (_, n) =>
        h.call(`notificationEmailJobs/authorization-contender-${n}`),
      ),
    );
    expect(
      contenders.every((row) => row.state === "deferred" && !row.attempted),
    ).toBe(true);
    expect((await h.quotaRef.get()).data()).toEqual(held);
    expect(h.request).not.toHaveBeenCalled();
    authorize();
    expect((await first).state).toBe("accepted");
    h.advance(999);
    expect(await h.call("outboxJobs/before-cooldown")).toMatchObject({
      state: "deferred",
      attempted: false,
    });
    h.advance(1);
    expect((await h.call("notificationEmailJobs/after-cooldown")).state).toBe(
      "accepted",
    );
    expect((await h.quotaRef.get()).data()?.attempts).toBe(2);
    expect((await h.quotaRef.get()).data()).not.toHaveProperty(
      "dispatchLeaseId",
    );
    expect(h.request).toHaveBeenCalledTimes(2);
  });
  test("expired authorization cannot send or release a newer Firestore lease", async () => {
    const h = setup();
    let oldAuthorize!: () => void;
    let oldEntered!: () => void;
    const oldAuthorization = new Promise<void>(
      (resolve) => (oldAuthorize = resolve),
    );
    const oldWaiting = new Promise<void>((resolve) => (oldEntered = resolve));
    const old = h.call("outboxJobs/expired-authorization", async () => {
      oldEntered();
      await oldAuthorization;
      return true;
    });
    await oldWaiting;
    h.advance(330_000);
    expect(await h.call("notificationEmailJobs/expiry-edge")).toMatchObject({
      state: "deferred",
      attempted: false,
    });
    h.advance(1_000);
    let newAuthorize!: () => void;
    let newEntered!: () => void;
    const newAuthorization = new Promise<void>(
      (resolve) => (newAuthorize = resolve),
    );
    const newWaiting = new Promise<void>((resolve) => (newEntered = resolve));
    const current = h.call(
      "notificationEmailJobs/current-authorization",
      async () => {
        newEntered();
        await newAuthorization;
        return true;
      },
    );
    await newWaiting;
    const replacement = (await h.quotaRef.get()).data();
    oldAuthorize();
    expect(await old).toMatchObject({ state: "deferred", attempted: false });
    expect((await h.quotaRef.get()).data()).toEqual(replacement);
    expect(h.request).not.toHaveBeenCalled();
    newAuthorize();
    expect((await current).state).toBe("accepted");
    expect(h.request).toHaveBeenCalledOnce();
    expect((await h.quotaRef.get()).data()?.attempts).toBe(2);
  });
  test("old v1 record upgrades safely while partial lease metadata fails closed", async () => {
    const legacy = setup();
    const now = Date.UTC(2026, 9, 9, 12);
    await legacy.quotaRef.set({
      schemaVersion: 1,
      dayUTC: "2026-10-09",
      attempts: 1,
      lastReservedAtMs: now - 1_000,
    });
    expect((await legacy.call("outboxJobs/legacy-upgrade")).state).toBe(
      "accepted",
    );
    expect((await legacy.quotaRef.get()).data()).toEqual({
      schemaVersion: 1,
      dayUTC: "2026-10-09",
      attempts: 2,
      lastReservedAtMs: now,
      nextDispatchAtMs: now + 1_000,
    });
    const invalid = setup();
    const corrupt = {
      schemaVersion: 1,
      dayUTC: "2026-10-09",
      attempts: 1,
      lastReservedAtMs: now - 1_000,
      dispatchLeaseId: randomUUID(),
    };
    await invalid.quotaRef.set(corrupt);
    expect(
      await invalid.call("notificationEmailJobs/partial-lease"),
    ).toMatchObject({
      state: "deferred",
      reason: "quota_unavailable",
      attempted: false,
    });
    expect((await invalid.quotaRef.get()).data()).toEqual(corrupt);
    expect(invalid.request).not.toHaveBeenCalled();
  });
  test("technical quota is denied to guests, owners and staff by current deployed emulator rules", async () => {
    const h = setup();
    await h.call("outboxJobs/rules-check");
    const environment = await initializeTestEnvironment({
      projectId: "demo-satsunicgo",
      firestore: { host: "127.0.0.1", port: 18207 },
    });
    try {
      const contexts = [
        environment.unauthenticatedContext(),
        environment.authenticatedContext(
          `email-dispatch-owner-${randomUUID()}`,
          {
            email_verified: true,
            firebase: { sign_in_provider: "google.com" },
          },
        ),
        environment.authenticatedContext(
          `email-dispatch-staff-${randomUUID()}`,
          {
            email_verified: true,
            firebase: { sign_in_provider: "google.com" },
            staff: true,
          },
        ),
      ];
      for (const context of contexts) {
        const ref = doc(context.firestore(), h.quotaRef.path);
        await expect(getDoc(ref)).rejects.toMatchObject({
          code: "permission-denied",
        });
        await expect(setDoc(ref, { attempts: 0 })).rejects.toMatchObject({
          code: "permission-denied",
        });
      }
      expect((await h.quotaRef.get()).data()?.attempts).toBe(1);
    } finally {
      await environment.cleanup();
    }
  });
});

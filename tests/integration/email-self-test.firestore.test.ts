import { randomUUID } from "node:crypto";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, describe, expect, test, vi } from "vitest";
import { runSelfTest } from "../../functions/src/email/self-test-service";

// Reuse the shared emulator. Own only unique technical documents; never change rules or reset data.
describe.runIf(process.env.FIRESTORE_EMULATOR_HOST === "127.0.0.1:18207")("real Firestore email test claims", () => {
  const runId = randomUUID();
  const app = initializeApp({ projectId: "demo-satsunicgo" }, `email-self-test-${runId}`);
  const actual = getFirestore(app);
  const quotaPath = `technicalQuotas/emailSelfTest-${runId}`;
  const ownedPaths = new Set([quotaPath]);
  const db = new Proxy(actual, { get(target, property) {
    if (property === "doc") return (path: string) => {
      const own = path === "technicalQuotas/emailSelfTest" ? quotaPath : path;
      ownedPaths.add(own); return actual.doc(own);
    };
    const value = Reflect.get(target, property);
    return typeof value === "function" ? value.bind(target) : value;
  } });
  const send = vi.fn().mockResolvedValue({ state: "accepted", providerId: randomUUID() });
  const readKey = vi.fn(() => "re_synthetic_only_1234567890");
  let now = Date.UTC(2026, 9, 9, 12);
  const call = (operationId: string = randomUUID()) => runSelfTest({ db, operationId, recipient: "operator@example.invalid", send, readKey, now: () => now });
  afterAll(async () => {
    await Promise.all([...ownedPaths].map(path => actual.doc(path).delete()));
    await actual.terminate(); await deleteApp(app);
  });
  test("ten concurrent transactions claim the same operation once", async () => {
    const id = randomUUID();
    const results = await Promise.all(Array.from({ length: 10 }, () => call(id)));
    expect(send).toHaveBeenCalledOnce(); expect(readKey).toHaveBeenCalledOnce();
    expect(results.filter(value => !value.replay)).toHaveLength(1);
    expect((await actual.doc(`emailTestOperations/${id}`).get()).data()?.state).toBe("accepted");
    const url = `http://127.0.0.1:18207/v1/projects/demo-satsunicgo/databases/(default)/documents/emailTestOperations/${id}`;
    expect((await fetch(url)).status).toBe(403);
    expect((await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: { state: { stringValue: "accepted" } } }) })).status).toBe(403);
  });
  test("different concurrent operations cannot bypass persisted quota", async () => {
    now += 60_000;
    const results = await Promise.allSettled([call(), call(), call()]);
    expect(results.filter(value => value.status === "fulfilled")).toHaveLength(1);
    expect(send).toHaveBeenCalledTimes(2);
  });
  test("persisted cap blocks a fourth attempt", async () => {
    now += 60_000; await call(); now += 60_000;
    await expect(call()).rejects.toMatchObject({ code: "DAILY_LIMIT" });
    expect(send).toHaveBeenCalledTimes(3);
  });
  test("transport uncertainty stays terminal across next-day replay", async () => {
    now += 24 * 60 * 60 * 1000;
    send.mockResolvedValueOnce({ state: "unknown", reason: "provider_unknown" });
    const id = randomUUID(); expect((await call(id)).state).toBe("unknown");
    now += 25 * 60 * 60 * 1000;
    expect(await call(id)).toMatchObject({ state: "unknown", replay: true });
    expect(send).toHaveBeenCalledTimes(4);
  });
});

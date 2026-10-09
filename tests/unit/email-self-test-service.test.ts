import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { describe, expect, test, vi } from "vitest";
import { runSelfTest } from "../../functions/src/email/self-test-service";
import { selfTestContent } from "../../functions/src/email/self-test-content";

// Serialized transactional fake models committed claims; real Firestore concurrency is tested separately.
function harness() {
  const rows = new Map<string, Record<string, unknown>>();
  let tail = Promise.resolve();
  let failTransaction = 0;
  let transactions = 0;
  const db = {
    doc: (path: string) => ({ path }),
    runTransaction<T>(body: (tx: unknown) => Promise<T>): Promise<T> {
      const execute = async () => {
        transactions++;
        if (transactions === failTransaction) throw new Error("private database detail");
        const writes: (() => void)[] = [];
        const tx = {
          get: async (ref: { path: string }) => ({ exists: rows.has(ref.path), data: () => rows.get(ref.path) }),
          create: (ref: { path: string }, data: Record<string, unknown>) => writes.push(() => rows.set(ref.path, { ...data })),
          set: (ref: { path: string }, data: Record<string, unknown>) => writes.push(() => rows.set(ref.path, { ...data })),
          update: (ref: { path: string }, data: Record<string, unknown>) => writes.push(() => rows.set(ref.path, { ...rows.get(ref.path), ...data })),
        };
        const value = await body(tx);
        writes.forEach(write => write());
        return value;
      };
      const result = tail.then(execute);
      tail = result.then(() => undefined, () => undefined);
      return result;
    },
  } as unknown as Firestore;
  const send = vi.fn().mockResolvedValue({ state: "accepted", providerId: randomUUID() });
  const readKey = vi.fn(() => "re_synthetic_only_1234567890");
  let now = Date.UTC(2026, 9, 9, 12);
  const call = (operationId: string = randomUUID(), recipient = "operator@example.invalid") =>
    runSelfTest({ db, operationId, recipient, send, readKey, now: () => now });
  return { rows, db, send, readKey, call, advance: (ms: number) => now += ms,
    fail: (number: number) => failTransaction = number };
}

describe("durable self-test orchestration", () => {
  test("one fixed template, technical metadata only, replay after 24h never resends or rereads key", async () => {
    const h = harness(), id = randomUUID();
    expect((await h.call(id)).state).toBe("accepted");
    h.advance(25 * 60 * 60 * 1000);
    expect(await h.call(id)).toMatchObject({ state: "accepted", replay: true });
    expect(h.send).toHaveBeenCalledOnce(); expect(h.readKey).toHaveBeenCalledOnce();
    expect(h.send.mock.calls[0][0]).toEqual({ from: "onboarding@resend.dev", to: "operator@example.invalid", ...selfTestContent });
    const stored = JSON.stringify([...h.rows.values()]);
    for (const privateValue of ["operator@example.invalid", "re_synthetic", selfTestContent.text, selfTestContent.html]) expect(stored).not.toContain(privateValue);
  });
  test("20 concurrent duplicate operations result in exactly one send", async () => {
    const h = harness(), id = randomUUID();
    const results = await Promise.all(Array.from({ length: 20 }, () => h.call(id)));
    expect(h.send).toHaveBeenCalledOnce();
    expect(results.filter(result => !result.replay)).toHaveLength(1);
  });
  test("different concurrent operation IDs still obey global cooldown", async () => {
    const h = harness();
    const result = await Promise.allSettled([h.call(), h.call(), h.call()]);
    expect(result.filter(item => item.status === "fulfilled")).toHaveLength(1);
    expect(h.send).toHaveBeenCalledOnce();
  });
  test("daily cap includes rejected and uncertain attempts; next UTC day works", async () => {
    const h = harness();
    h.send.mockResolvedValue({ state: "unknown", reason: "provider_unknown" });
    for (let n = 0; n < 3; n++) { await h.call(); h.advance(60_000); }
    await expect(h.call()).rejects.toMatchObject({ code: "DAILY_LIMIT" });
    h.advance(24 * 60 * 60 * 1000);
    expect((await h.call()).state).toBe("unknown");
    expect(h.send).toHaveBeenCalledTimes(4);
  });
  test("cooldown survives UTC midnight", async () => {
    const h = harness(); h.advance(12 * 60 * 60 * 1000 - 10_000);
    await h.call(); h.advance(20_000);
    await expect(h.call()).rejects.toMatchObject({ code: "COOLDOWN" });
  });
  test("reusing ID with changed recipient fails closed", async () => {
    const h = harness(), id = randomUUID(); await h.call(id);
    await expect(h.call(id, "different@example.invalid")).rejects.toMatchObject({ code: "OPERATION_CONFLICT" });
    expect(h.send).toHaveBeenCalledOnce();
  });
  test("claim failure prevents secret access and provider I/O", async () => {
    const h = harness(); h.fail(1);
    await expect(h.call()).rejects.toThrow();
    expect(h.readKey).not.toHaveBeenCalled(); expect(h.send).not.toHaveBeenCalled();
  });
  test("lost final write and stale replay stay unknown without another send", async () => {
    const h = harness(), id = randomUUID(); h.fail(2);
    expect((await h.call(id)).state).toBe("unknown");
    expect((await h.call(id)).state).toBe("processing");
    h.advance(60_000);
    expect(await h.call(id)).toMatchObject({ state: "unknown", replay: true });
    expect(h.rows.get(`emailTestOperations/${id}`)?.state).toBe("unknown");
    expect(h.send).toHaveBeenCalledOnce();
  });
  test("provider throw is unknown and replay cannot send again", async () => {
    const h = harness(), id = randomUUID(); h.send.mockRejectedValue(new Error("secret provider error"));
    expect((await h.call(id)).state).toBe("unknown");
    expect((await h.call(id)).state).toBe("unknown");
    expect(h.send).toHaveBeenCalledOnce();
  });
  test("a late provider success cannot overwrite a stale unknown outcome", async () => {
    const h = harness(), id = randomUUID();
    let finish!: (value: unknown) => void;
    h.send.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const first = h.call(id);
    await vi.waitFor(() => expect(h.send).toHaveBeenCalledOnce());
    h.advance(60_000);
    expect((await h.call(id)).state).toBe("unknown");
    finish({ state: "accepted", providerId: randomUUID() });
    expect((await first).state).toBe("unknown");
    expect(h.rows.get(`emailTestOperations/${id}`)?.state).toBe("unknown");
    expect(h.send).toHaveBeenCalledOnce();
  });
  test("a rejected request is terminal on replay", async () => {
    const h = harness(), id = randomUUID();
    h.send.mockResolvedValue({ state: "rejected", reason: "provider_rejected" });
    expect((await h.call(id)).state).toBe("rejected");
    h.advance(25 * 60 * 60 * 1000);
    expect(await h.call(id)).toMatchObject({ state: "rejected", replay: true });
    expect(h.send).toHaveBeenCalledOnce();
  });
  test("corrupt operation and quota records fail closed", async () => {
    const h = harness(), id = randomUUID(); h.rows.set(`emailTestOperations/${id}`, { state: "accepted" });
    await expect(h.call(id)).rejects.toMatchObject({ code: "INVALID_STATE" });
    h.rows.clear(); h.rows.set("technicalQuotas/emailSelfTest", { attempts: -1 });
    await expect(h.call()).rejects.toMatchObject({ code: "INVALID_STATE" });
    expect(h.send).not.toHaveBeenCalled();
  });
  test.each(["../bad", "not-uuid", "", "a".repeat(600)])("invalid operation %s never accesses secret or database", async id => {
    const h = harness(); await expect(h.call(id)).rejects.toThrow();
    expect(h.rows.size).toBe(0); expect(h.readKey).not.toHaveBeenCalled();
  });
});

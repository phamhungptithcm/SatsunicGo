import type { Firestore } from "firebase-admin/firestore";
import { appendFileSync } from "node:fs";
import { vi, expect } from "vitest";
// Count SDK transaction calls and retry attempts, never document paths/payloads.
// These are application SDK counts on the emulator, not provider billing metrics.
export async function profileTransaction<T>(
  db: Firestore,
  label: string,
  work: () => Promise<T>,
  maximumAttempts = 10,
) {
  const counts = { attempts: 0, readCalls: 0, writes: 0 };
  const actual = db.runTransaction.bind(db);
  const spy = vi.spyOn(db, "runTransaction").mockImplementation(((
    update,
    options,
  ) =>
    actual(async (tx) => {
      counts.attempts++;
      const proxy = new Proxy(tx, {
        get(target, property) {
          const value = Reflect.get(target, property);
          if (typeof value !== "function") return value;
          return (...args: unknown[]) => {
            if (["get", "getAll"].includes(String(property)))
              counts.readCalls++;
            if (
              ["create", "set", "update", "delete"].includes(String(property))
            )
              counts.writes++;
            return Reflect.apply(value, target, args);
          };
        },
      });
      return update(proxy);
    }, options)) as typeof db.runTransaction);
  const begin = performance.now();
  try {
    return await work();
  } finally {
    spy.mockRestore();
    const measurement = {
      profile: label,
      ...counts,
      elapsedMs: Math.round((performance.now() - begin) * 100) / 100,
      environment:
        "local emulator, SDK call counts, no provider SLA/billing inference",
    };
    if (process.env.ORDER_TRACKING_TRANSACTION_PROFILE)
      appendFileSync(
        process.env.ORDER_TRACKING_TRANSACTION_PROFILE,
        JSON.stringify(measurement) + "\n",
      );
    console.info(JSON.stringify(measurement));
    expect(counts.attempts).toBeGreaterThan(0);
    expect(counts.attempts).toBeLessThanOrEqual(maximumAttempts);
    expect(counts.writes).toBeLessThanOrEqual(250);
  }
}

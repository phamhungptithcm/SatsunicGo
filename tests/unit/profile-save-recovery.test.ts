import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import {
  reserveSave,
  readSavePointer,
  clearSavePointer,
  type SaveCommand,
} from "../../src/features/profile/save-recovery";
const storage = new Map<string, string>();
beforeEach(() => {
  storage.clear();
  const running = new Map<string, Promise<unknown>>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  vi.stubGlobal("navigator", {
    locks: {
      request: (key: string, fn: () => unknown) => {
        const next = (running.get(key) ?? Promise.resolve()).then(fn);
        running.set(
          key,
          next.catch(() => {}),
        );
        return next;
      },
    },
  });
});
afterEach(() => vi.unstubAllGlobals());
function command(): SaveCommand {
  return {
    action: "saveAddress",
    operationId: randomUUID(),
    payload: {
      recipient: "Synthetic private name",
      phone: "0900000000",
      address: "Synthetic private address",
    },
  };
}
test("durable pointer is exact command hash but contains no payload or owner identity", async () => {
  const data = command(),
    saved = await reserveSave("synthetic-uid", data);
  expect(saved.reserved).toBe(true);
  expect(saved.pointer.commandHash).toBe(
    createHash("sha256").update(JSON.stringify(data)).digest("hex"),
  );
  expect(await readSavePointer("synthetic-uid")).toEqual(saved.pointer);
  const serialized = JSON.stringify([...storage]);
  for (const value of [
    "synthetic-uid",
    "Synthetic private name",
    "0900000000",
    "Synthetic private address",
    "recipient",
    "phone",
    "payload",
  ])
    expect(serialized).not.toContain(value);
});
test("concurrent page/panel admissions reserve exactly one operation", async () => {
  const results = await Promise.all([
    reserveSave("owner", command()),
    reserveSave("owner", command()),
    reserveSave("owner", command()),
  ]);
  expect(results.filter((x) => x.reserved)).toHaveLength(1);
  expect(new Set(results.map((x) => x.pointer.operationId)).size).toBe(1);
});
test("identity scopes separate pointers and correlated clearing does not erase another operation", async () => {
  const a = await reserveSave("a", command());
  expect(await readSavePointer("b")).toBeNull();
  await reserveSave("b", command());
  await expect(
    clearSavePointer("a", { ...a.pointer, operationId: randomUUID() }),
  ).rejects.toThrow("RECOVERY_POINTER_CHANGED");
  expect(await readSavePointer("a")).toEqual(a.pointer);
  await clearSavePointer("a", a.pointer);
  expect(await readSavePointer("a")).toBeNull();
  expect(await readSavePointer("b")).not.toBeNull();
});
test("tampered storage fails closed without silently clearing it", async () => {
  await reserveSave("a", command());
  const key = [...storage.keys()][0];
  storage.set(key, '{"schemaVersion":1,"recipient":"private"}');
  await expect(readSavePointer("a")).rejects.toThrow();
  await expect(reserveSave("a", command())).rejects.toThrow();
  expect(storage.has(key)).toBe(true);
});
test("unavailable lock or storage blocks reservation before dispatch", async () => {
  vi.stubGlobal("navigator", {});
  await expect(reserveSave("a", command())).rejects.toThrow(
    "RECOVERY_STORAGE_UNAVAILABLE",
  );
  expect(storage.size).toBe(0);
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw Error("DENIED");
    },
  });
  await expect(readSavePointer("a")).rejects.toThrow("DENIED");
});

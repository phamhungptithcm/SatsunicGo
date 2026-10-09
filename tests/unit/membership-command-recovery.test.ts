import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { randomUUID } from "node:crypto";
import {
  membershipAttemptSchema,
  readMembershipAttempt,
  reserveMembershipAttempt,
  clearMembershipAttempt,
  admitMembershipResult,
  type MembershipAttempt,
} from "../../src/features/membership/command-recovery";
const storage = new Map<string, string>();
const attempt = (action = "purchase", payload = { planId: "paid-plan" }) =>
  membershipAttemptSchema.parse({
    schemaVersion: 1,
    operationId: randomUUID(),
    action,
    payload,
  });
beforeEach(() => {
  storage.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  let queue = Promise.resolve();
  vi.stubGlobal("navigator", {
    locks: {
      request: (_key: string, work: () => unknown) => {
        const next = queue.then(work);
        queue = next.then(
          () => undefined,
          () => undefined,
        );
        return next;
      },
    },
  });
});
afterEach(() => vi.unstubAllGlobals());
test("reload retains exact customer command and stores only bounded metadata", async () => {
  const original = attempt();
  expect((await reserveMembershipAttempt("owner", original)).reserved).toBe(
    true,
  );
  expect(await readMembershipAttempt("owner")).toEqual(original);
  const [key, value] = [...storage.entries()][0];
  expect(key).not.toContain("owner");
  expect(JSON.parse(value)).toEqual(original);
  expect(value).not.toMatch(/email|recipient|address|amount|ownerId/);
});
test("parallel tab reservations keep one original operation", async () => {
  const results = await Promise.all([
    reserveMembershipAttempt("a", attempt()),
    reserveMembershipAttempt("a", attempt()),
  ]);
  expect(results.filter((r) => r.reserved)).toHaveLength(1);
  expect(results[0].attempt).toEqual(results[1].attempt);
});
test("owner separation and correlated clear never erase a different operation", async () => {
  const a = attempt();
  await reserveMembershipAttempt("a", a);
  expect(await readMembershipAttempt("b")).toBeNull();
  await reserveMembershipAttempt("b", attempt());
  await expect(clearMembershipAttempt("a", attempt())).rejects.toThrow(
    "MEMBERSHIP_ATTEMPT_CHANGED",
  );
  expect(await readMembershipAttempt("a")).toEqual(a);
  await clearMembershipAttempt("a", a);
  expect(await readMembershipAttempt("a")).toBeNull();
  expect(await readMembershipAttempt("b")).not.toBeNull();
});
test.each([
  { action: "confirm", payload: {} },
  { action: "grant", payload: { planId: "free" } },
  { action: "purchase", payload: {} },
  { action: "purchase", payload: { planId: "../private" } },
  { action: "purchase", payload: { planId: "paid", amount: 1 } },
  { action: "purchase", payload: { planId: "paid", recipient: "private" } },
  { action: "requestRenewal", payload: { planId: "paid" } },
  { action: "cancelInvoice", payload: { invoiceId: "../private" } },
])("invalid or privileged envelope fails closed: %j", (fields) => {
  expect(() =>
    membershipAttemptSchema.parse({
      schemaVersion: 1,
      operationId: randomUUID(),
      ...fields,
    }),
  ).toThrow();
});
test.each(["requestRenewal", "cancelRenewal", "cancelInvoice"])(
  "customer envelope %s round trips",
  async (action) => {
    const original = membershipAttemptSchema.parse({
      schemaVersion: 1,
      operationId: randomUUID(),
      action,
      payload: action === "cancelInvoice" ? { invoiceId: "invoice-one" } : {},
    });
    await reserveMembershipAttempt("a", original);
    expect(await readMembershipAttempt("a")).toEqual(original);
  },
);
test("corrupt persisted data stays present and blocks reservation", async () => {
  await reserveMembershipAttempt("a", attempt());
  const key = [...storage.keys()][0];
  storage.set(
    key,
    '{"schemaVersion":1,"action":"purchase","private":"sensitive"}',
  );
  await expect(readMembershipAttempt("a")).rejects.toThrow();
  await expect(reserveMembershipAttempt("a", attempt())).rejects.toThrow();
  expect(storage.has(key)).toBe(true);
});
test("locks or storage unavailable cannot reserve", async () => {
  vi.stubGlobal("navigator", {});
  await expect(reserveMembershipAttempt("a", attempt())).rejects.toThrow(
    "MEMBERSHIP_RECOVERY_UNAVAILABLE",
  );
  expect(storage.size).toBe(0);
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw Error("DENIED");
    },
  });
  await expect(readMembershipAttempt("a")).rejects.toThrow("DENIED");
});
test("silently dropped storage writes or deletes cannot retire an operation", async () => {
  const candidate = attempt();
  vi.stubGlobal("localStorage", {
    getItem: () => null,
    setItem: () => undefined,
  });
  await expect(reserveMembershipAttempt("a", candidate)).rejects.toThrow(
    "MEMBERSHIP_RECOVERY_UNAVAILABLE",
  );
  vi.stubGlobal("localStorage", {
    getItem: () => JSON.stringify(candidate),
    removeItem: () => undefined,
  });
  await expect(clearMembershipAttempt("a", candidate)).rejects.toThrow(
    "MEMBERSHIP_RECOVERY_UNAVAILABLE",
  );
  expect(await readMembershipAttempt("a")).toEqual(candidate);
});
test.each([
  { schemaVersion: 2 },
  { operationId: "not-an-operation" },
  { private: "sensitive" },
])("invalid envelope identity stays rejected: %j", (fields) => {
  expect(() =>
    membershipAttemptSchema.parse({ ...attempt(), ...fields }),
  ).toThrow();
});
test("successful response shape and owner or invoice correlation are required", () => {
  expect(
    admitMembershipResult({ id: "owner", state: "active" }, attempt(), "owner"),
  ).toEqual({ id: "owner", state: "active" });
  expect(
    admitMembershipResult(
      { id: randomUUID(), state: "pending" },
      attempt(),
      "owner",
    ),
  ).toMatchObject({ state: "pending" });
  for (const value of [
    { id: "other", state: "active" },
    { id: "owner" },
    { id: "owner", state: "paid" },
    { id: "owner", state: "active", extra: true },
  ])
    expect(() => admitMembershipResult(value, attempt(), "owner")).toThrow();
  const renewal = {
    schemaVersion: 1,
    operationId: randomUUID(),
    action: "requestRenewal",
    payload: {},
  } as MembershipAttempt;
  expect(() =>
    admitMembershipResult({ id: "other" }, renewal, "owner"),
  ).toThrow();
  const cancel = {
    ...renewal,
    action: "cancelInvoice",
    payload: { invoiceId: "invoice-one" },
  } as MembershipAttempt;
  expect(admitMembershipResult({ id: "invoice-one" }, cancel, "owner")).toEqual(
    { id: "invoice-one" },
  );
  expect(() =>
    admitMembershipResult({ id: "invoice-two" }, cancel, "owner"),
  ).toThrow();
});

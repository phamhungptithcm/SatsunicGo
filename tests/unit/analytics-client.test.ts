import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
vi.mock("../../src/shared/firebase", () => ({ functions: null }));
import {
  AnalyticsTracker,
  createNavigationIdentity,
  productRouteMatches,
} from "../../src/shared/analytics";
const storage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => data.set(k, v),
    removeItem: (k: string) => data.delete(k),
  };
};
beforeEach(() => {
  vi.stubGlobal("localStorage", storage());
  vi.stubGlobal("sessionStorage", storage());
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const event = () => ({
  id: crypto.randomUUID(),
  at: Date.now(),
  kind: "page" as const,
  route: "home" as const,
});
it("counts history revisits separately while sharing one occurrence across remounts", () => {
  const navigation = createNavigationIdentity();
  const home = { key: "A", pathname: "/" };
  const first = navigation(home);
  expect(navigation({ ...home })).toBe(first);
  const product = { key: "B", pathname: "/products/item" };
  const second = navigation(product);
  expect(navigation({ ...product })).toBe(second);
  const back = navigation(home);
  expect(back).not.toBe(first);
  expect(navigation(home)).toBe(back);
  expect(navigation(product)).not.toBe(second);
  navigation({ key: "C", pathname: "/profile" });
  expect(navigation(product)).not.toBe(second);
});
it("binds detail views to the current product route, including encoded and malformed paths", () => {
  expect(productRouteMatches("/products/product-b", "product-a")).toBe(false);
  expect(productRouteMatches("/products/product-a/", "product-a")).toBe(true);
  expect(productRouteMatches("/products/product%2Da", "product-a")).toBe(true);
  expect(productRouteMatches("/products/product-a/checkout", "product-a")).toBe(
    false,
  );
  expect(productRouteMatches("/products/%", "product-a")).toBe(false);
  expect(productRouteMatches("/products/product-a", undefined)).toBe(false);
});
describe("analytics client lifecycle", () => {
  it("sends nothing without consent, deduplicates remount and bounds queue", async () => {
    const send = vi.fn(async (name: string) =>
        name === "analyticsSession"
          ? { session: crypto.randomUUID(), startedAt: Date.now() }
          : {},
      ),
      t = new AnalyticsTracker(send);
    t.configure(false, null, true);
    t.record(event(), "private");
    await t.flush();
    expect(send).not.toHaveBeenCalled();
    t.configure(true, null, true);
    for (let i = 0; i < 105; i++) t.record(event(), `n${i}`);
    t.record(event(), "n104");
    await t.flush();
    expect(t.dropped).toBe(5);
    expect((send.mock.calls[1] as unknown[])[0]).toBe("analyticsIngest");
    t.dispose();
  });
  it("retries the same IDs and stops stale work on account switch", async () => {
    vi.useFakeTimers();
    let attempts = 0;
    const batches: unknown[] = [];
    const t = new AnalyticsTracker(async (name, data) => {
      if (name === "analyticsSession")
        return { session: crypto.randomUUID(), startedAt: Date.now() };
      batches.push(data);
      if (++attempts < 3) throw Error("offline");
      return {};
    });
    t.configure(true, "a", true);
    t.record(event(), "once");
    const flush = t.flush();
    await vi.runAllTimersAsync();
    await flush;
    expect(batches).toHaveLength(3);
    expect(batches[0]).toEqual(batches[2]);
    t.dispose();
    sessionStorage.removeItem("sg:analytics-session:v1");
    const resolvers: ((v: unknown) => void)[] = [];
    const send = vi.fn((name: string) =>
      name === "analyticsSession"
        ? new Promise((r) => resolvers.push(r))
        : Promise.resolve({}),
    );
    const switched = new AnalyticsTracker(send);
    switched.configure(true, "a", true);
    switched.record(event(), "before");
    const pending = switched.flush();
    switched.configure(true, "b", true);
    resolvers[0]({ session: crypto.randomUUID(), startedAt: Date.now() });
    resolvers[1]({ session: crypto.randomUUID(), startedAt: Date.now() });
    await pending;
    expect(
      send.mock.calls.filter((c) => c[0] === "analyticsIngest"),
    ).toHaveLength(0);
    expect(
      send.mock.calls.filter((c) => c[0] === "analyticsWithdraw"),
    ).toHaveLength(1);
    expect(
      (
        send.mock.calls.find((c) => c[0] === "analyticsWithdraw") as unknown[]
      )[1],
    ).toMatchObject({ reason: "account_change" });
    switched.dispose();
  });
  it("withdraws and discards queued data", async () => {
    const send = vi.fn(async (name: string) =>
      name === "analyticsSession"
        ? { session: crypto.randomUUID(), startedAt: Date.now() }
        : {},
    );
    const t = new AnalyticsTracker(send);
    t.configure(true, null, true);
    t.record(event(), "1");
    await t.flush();
    t.record(event(), "2");
    t.configure(false, null, true);
    await t.flush();
    expect(send.mock.calls.map((c) => c[0])).toEqual([
      "analyticsSession",
      "analyticsIngest",
      "analyticsWithdraw",
    ]);
    t.dispose();
  });
});

it("bounds unavailable session retries and pauses permanent failures", async () => {
  vi.useFakeTimers();
  const send = vi.fn(async () => {
    throw Error("offline");
  });
  const t = new AnalyticsTracker(send);
  t.configure(true, null, true);
  t.record(event(), "one");
  await vi.runAllTimersAsync();
  expect(send).toHaveBeenCalledTimes(3);
  expect(t.dropped).toBe(1);
  t.record(event(), "two");
  await vi.runAllTimersAsync();
  expect(send).toHaveBeenCalledTimes(3);
  expect(t.dropped).toBe(2);
  t.configure(false, null, true);
  t.dispose();
  const permanent = vi.fn(async () => {
    throw Object.assign(Error(), { code: "functions/failed-precondition" });
  });
  const p = new AnalyticsTracker(permanent);
  p.configure(true, null, true);
  p.record(event(), "disabled");
  await vi.runAllTimersAsync();
  expect(permanent).toHaveBeenCalledTimes(1);
  expect(p.dropped).toBe(1);
  p.dispose();
});

it("rotates expired sessions, preserves browser on reload, revokes late consent response", async () => {
  vi.useFakeTimers();
  const starts: unknown[] = [];
  const t = new AnalyticsTracker(async (name, data) => {
    if (name === "analyticsSession") {
      starts.push(data);
      return { session: crypto.randomUUID(), startedAt: Date.now() };
    }
    return {};
  });
  t.configure(true, null, true);
  await Promise.resolve();
  await Promise.resolve();
  t.record(event(), "first");
  await t.flush();
  vi.setSystemTime(Date.now() + 31 * 60_000);
  t.record(event(), "second");
  await t.flush();
  expect(starts).toHaveLength(2);
  expect((starts[0] as { requestId: string }).requestId).not.toBe(
    (starts[1] as { requestId: string }).requestId,
  );
  t.dispose();
  sessionStorage.removeItem("sg:analytics-session:v1");
  let resolve!: (x: unknown) => void;
  const send = vi.fn((name: string) =>
    name === "analyticsSession"
      ? new Promise((r) => (resolve = r))
      : Promise.resolve({}),
  );
  const late = new AnalyticsTracker(send);
  late.configure(true, null, true);
  late.configure(false, null, true);
  resolve({ session: crypto.randomUUID(), startedAt: Date.now() });
  await Promise.resolve();
  await Promise.resolve();
  expect(send.mock.calls.map((c) => c[0])).toEqual([
    "analyticsSession",
    "analyticsWithdraw",
  ]);
  late.dispose();
});

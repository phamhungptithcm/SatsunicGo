import { afterEach, describe, expect, it, vi } from "vitest";
import { createLiveCache } from "../../src/shared/live-cache";
import {
  beginProgress,
  createCountdown,
  dismissNotice,
  noticeSnapshot,
  notify,
  progressSnapshot,
  withProgress,
} from "../../src/shared/feedback";
afterEach(() => {
  vi.useRealTimers();
  const n = noticeSnapshot();
  if (n) dismissNotice(n.id);
});
describe("public-only live cache lifecycle", () => {
  it("shares a subscription and releases it once after the StrictMode grace window", () => {
    vi.useFakeTimers();
    const stop = vi.fn(),
      connect = vi.fn(() => stop);
    const cache = createLiveCache<string>(connect);
    const a = cache.subscribe(vi.fn()),
      b = cache.subscribe(vi.fn());
    expect(connect).toHaveBeenCalledTimes(1);
    a();
    vi.advanceTimersByTime(210);
    expect(stop).not.toHaveBeenCalled();
    b();
    vi.advanceTimersByTime(100);
    const c = cache.subscribe(vi.fn());
    vi.advanceTimersByTime(200);
    expect(connect).toHaveBeenCalledTimes(1);
    c();
    vi.advanceTimersByTime(210);
    expect(stop).toHaveBeenCalledTimes(1);
  });
  it("retains a short-lived snapshot, rejects late source writes, expires old content and revalidates", () => {
    vi.useFakeTimers();
    let now = 1000;
    const callbacks: Array<(rows: string[]) => void> = [];
    const cache = createLiveCache<string>(
      (next) => {
        callbacks.push(next);
        return vi.fn();
      },
      1000,
      () => now,
    );
    const a = cache.subscribe(vi.fn());
    callbacks[0](["published"]);
    a();
    vi.advanceTimersByTime(210);
    callbacks[0](["late old data"]);
    expect(cache.snapshot().rows).toEqual(["published"]);
    now = 1400;
    const b = cache.subscribe(vi.fn());
    expect(cache.snapshot().stale).toBe(true);
    callbacks[1]([]);
    expect(cache.snapshot().rows).toEqual([]);
    expect(cache.snapshot().stale).toBe(false);
    b();
    vi.advanceTimersByTime(210);
    now = 3000;
    const c = cache.subscribe(vi.fn());
    expect(cache.snapshot().loading).toBe(true);
    expect(cache.snapshot().rows).toEqual([]);
    c();
    vi.advanceTimersByTime(210);
  });
  it("distinguishes failure from empty and retries without stale callback overwrite", () => {
    vi.useFakeTimers();
    const callbacks: Array<{
      next: (rows: string[]) => void;
      fail: () => void;
    }> = [];
    const cache = createLiveCache<string>((next, fail) => {
      callbacks.push({ next, fail });
      return vi.fn();
    });
    const unsub = cache.subscribe(vi.fn());
    callbacks[0].fail();
    expect(cache.snapshot().loading).toBe(false);
    expect(cache.snapshot().error).toBeTruthy();
    cache.retry();
    callbacks[0].next(["obsolete"]);
    expect(cache.snapshot().rows).toEqual([]);
    callbacks[1].next(["current"]);
    expect(cache.snapshot().error).toBe("");
    unsub();
    vi.advanceTimersByTime(210);
  });
});
it("marks SDK memory/offline data stale and discards a revoked public query", () => {
  vi.useFakeTimers();
  let next!: (rows: string[], stale?: boolean) => void;
  let fail!: (discard?: boolean) => void;
  const cache = createLiveCache<string>((n, f) => {
    next = n;
    fail = f;
    return vi.fn();
  });
  const unsub = cache.subscribe(vi.fn());
  next(["old publication"], true);
  expect(cache.snapshot().stale).toBe(true);
  next(["server publication"], false);
  expect(cache.snapshot().stale).toBe(false);
  fail(true);
  expect(cache.snapshot().rows).toEqual([]);
  expect(cache.snapshot().error).toBeTruthy();
  unsub();
  vi.advanceTimersByTime(210);
});
it("does not show an empty catalog before the first authoritative result", () => {
  vi.useFakeTimers();
  let next!: (rows: string[], stale?: boolean) => void;
  const cache = createLiveCache<string>((n) => {
    next = n;
    return vi.fn();
  });
  const unsub = cache.subscribe(vi.fn());
  next([], true);
  expect(cache.snapshot().loading).toBe(true);
  next([], true);
  expect(cache.snapshot().loading).toBe(true);
  next([], false);
  expect(cache.snapshot().loading).toBe(false);
  expect(cache.snapshot().error).toBe("");
  unsub();
  vi.advanceTimersByTime(210);
});
describe("feedback concurrency and interruption", () => {
  it("reference-counts simultaneous operations and tolerates double cleanup", () => {
    const a = beginProgress(),
      b = beginProgress();
    expect(progressSnapshot()).toBe(2);
    a();
    a();
    expect(progressSnapshot()).toBe(1);
    b();
    expect(progressSnapshot()).toBe(0);
  });
  it("cleans progress after a failed operation without reporting success", async () => {
    await expect(
      withProgress(async () => {
        throw Error("failed");
      }),
    ).rejects.toThrow("failed");
    expect(progressSnapshot()).toBe(0);
  });
  it("does not allow an old timeout to dismiss a newer notice", () => {
    notify("old");
    const id = noticeSnapshot()!.id;
    notify("new");
    dismissNotice(id);
    expect(noticeSnapshot()?.text).toBe("new");
  });
  it("overlapping hover/focus/pending holds must all end before countdown resumes", () => {
    vi.useFakeTimers();
    let now = 0;
    const expire = vi.fn(),
      tick = vi.fn();
    const clock = createCountdown(5000, tick, expire, () => now);
    now = 1000;
    vi.advanceTimersByTime(1000);
    clock.hold("hover", true);
    clock.hold("focus", true);
    now = 8000;
    vi.advanceTimersByTime(7000);
    clock.hold("hover", false);
    vi.advanceTimersByTime(5000);
    expect(expire).not.toHaveBeenCalled();
    clock.hold("focus", false);
    vi.advanceTimersByTime(3999);
    expect(expire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(expire).toHaveBeenCalledTimes(1);
    clock.dispose();
  });
  it("cancels expiration after disposal", () => {
    vi.useFakeTimers();
    const expire = vi.fn();
    const clock = createCountdown(5000, vi.fn(), expire);
    clock.dispose();
    vi.advanceTimersByTime(10000);
    expect(expire).not.toHaveBeenCalled();
  });
});

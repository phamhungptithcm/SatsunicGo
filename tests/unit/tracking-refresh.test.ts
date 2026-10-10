import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TrackingRefreshLoop } from "../../src/features/ask/tracking-refresh";
const loops: TrackingRefreshLoop<unknown>[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1800000000000);
});
afterEach(() => {
  loops.forEach((l) => l.stop());
  loops.length = 0;
  vi.useRealTimers();
});
function fixture(guest = false) {
  let current = true,
    available = true;
  const data = vi.fn(),
    state = vi.fn(),
    read = vi.fn().mockResolvedValue({ version: 2 });
  const loop = new TrackingRefreshLoop({
    guest,
    current: () => current,
    available: () => available,
    read,
    data,
    state,
  });
  loops.push(loop);
  loop.start();
  return {
    loop,
    read,
    data,
    state,
    setCurrent: (v: boolean) => (current = v),
    setAvailable: (v: boolean) => (available = v),
  };
}
it("H05 P03 coalesces ten owner changes into one read", async () => {
  const h = fixture();
  for (let i = 0; i < 10; i++) h.loop.changed();
  await vi.advanceTimersByTimeAsync(250);
  expect(h.read).toHaveBeenCalledTimes(1);
  expect(h.data).toHaveBeenCalledOnce();
});
it("H06 N23 guest initial/manual/automatic share one minute budget", async () => {
  const h = fixture(true);
  await h.loop.refresh(true);
  expect(h.read).not.toHaveBeenCalled();
  expect(h.state).toHaveBeenLastCalledWith("cooldown");
  await vi.advanceTimersByTimeAsync(60000);
  expect(h.read).toHaveBeenCalledTimes(1);
  await h.loop.refresh(true);
  expect(h.read).toHaveBeenCalledTimes(1);
});
it.each([true, false])(
  "N17 hidden/offline defers %s then resumes",
  async (guest) => {
    const h = fixture(guest);
    h.setAvailable(false);
    await vi.advanceTimersByTimeAsync(60000);
    expect(h.read).not.toHaveBeenCalled();
    expect(h.state).toHaveBeenLastCalledWith("stale");
    h.setAvailable(true);
    await h.loop.refresh(true);
    expect(h.read).toHaveBeenCalledOnce();
  },
);
it("N19 N20 stale A→B→A loop cannot publish late data", async () => {
  const h = fixture();
  let resolve!: (v: unknown) => void;
  h.read.mockReturnValue(new Promise((r) => (resolve = r)));
  h.loop.changed();
  await vi.advanceTimersByTimeAsync(250);
  h.loop.stop();
  const next = fixture();
  resolve({ private: "old" });
  await Promise.resolve();
  expect(h.data).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(60000);
  expect(next.data).toHaveBeenCalledOnce();
});
it("N18 N21 stop releases pending and ignores late response", async () => {
  const h = fixture();
  h.read.mockReturnValue(new Promise(() => {}));
  h.loop.changed();
  await vi.advanceTimersByTimeAsync(250);
  h.loop.stop();
  await vi.advanceTimersByTimeAsync(600000);
  expect(h.read).toHaveBeenCalledOnce();
  expect(h.data).not.toHaveBeenCalled();
});
it("P03 one flight drains latest owner revision after in-flight changes", async () => {
  const h = fixture();
  let resolve!: (v: unknown) => void;
  h.read.mockReturnValueOnce(new Promise((r) => (resolve = r)));
  h.loop.changed();
  await vi.advanceTimersByTimeAsync(250);
  for (let i = 0; i < 10; i++) h.loop.changed();
  await vi.advanceTimersByTimeAsync(250);
  expect(h.read).toHaveBeenCalledOnce();
  resolve({ version: 2 });
  await vi.advanceTimersByTimeAsync(250);
  expect(h.read).toHaveBeenCalledTimes(2);
});
it.each([
  "functions/permission-denied",
  "functions/not-found",
  "functions/unauthenticated",
])("N22 N24 terminal %s clears and stops", async (code) => {
  const h = fixture();
  h.read.mockRejectedValueOnce({ code });
  h.loop.changed();
  await vi.advanceTimersByTimeAsync(250);
  expect(h.state).toHaveBeenLastCalledWith("unavailable");
  await vi.advanceTimersByTimeAsync(120000);
  expect(h.read).toHaveBeenCalledOnce();
});
it.each([
  null,
  undefined,
  { code: "functions/unavailable" },
  { code: "functions/resource-exhausted" },
])("N23 N24 failure is stale and bounded %s", async (error) => {
  const h = fixture(true);
  h.read.mockRejectedValueOnce(error);
  await vi.advanceTimersByTimeAsync(60000);
  expect(h.state).toHaveBeenLastCalledWith("stale");
  await h.loop.refresh(true);
  expect(h.read).toHaveBeenCalledOnce();
  await vi.advanceTimersByTimeAsync(60000);
  expect(h.read).toHaveBeenCalledTimes(2);
});
it("N25 untrusted diagnostic getter cannot escape recovery", async () => {
  const h = fixture();
  h.read.mockRejectedValueOnce(
    Object.defineProperty({}, "code", {
      get() {
        throw Error("PII");
      },
    }),
  );
  h.loop.changed();
  await vi.advanceTimersByTimeAsync(250);
  expect(h.state).toHaveBeenLastCalledWith("stale");
});
it("N19 current ownership mismatch never reads", async () => {
  const h = fixture();
  h.setCurrent(false);
  h.loop.changed();
  await vi.advanceTimersByTimeAsync(60000);
  expect(h.read).not.toHaveBeenCalled();
});
it("N21 no duplicate timer after stop", async () => {
  const h = fixture(true);
  h.loop.stop();
  await vi.advanceTimersByTimeAsync(120000);
  expect(h.read).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
it("N24 watcher rejection remains terminal when pending read is aborted", async () => {
  const h = fixture();
  h.read.mockReturnValue(new Promise(() => {}));
  h.loop.changed();
  await vi.advanceTimersByTimeAsync(250);
  h.loop.fail();
  await vi.advanceTimersByTimeAsync(120000);
  expect(h.state).toHaveBeenLastCalledWith("unavailable");
  expect(h.read).toHaveBeenCalledOnce();
  expect(h.data).not.toHaveBeenCalled();
});

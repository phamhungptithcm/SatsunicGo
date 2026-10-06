import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../src/shared/firebase", () => ({ callService: vi.fn() }));
import { callService } from "../../src/shared/firebase";
import {
  readRecords,
  requireSettled,
  recordIds,
  selectionIds,
  versionMap,
} from "../../src/features/shipping/queue-state";
const rpc = vi.mocked(callService);
beforeEach(() => rpc.mockReset());
describe("bounded shipping references", () => {
  it("deduplicates repeated allocation references without widening the read scope", async () => {
    rpc.mockResolvedValue({ rows: [{ id: "order-31", version: 8 }] });
    expect(await readRecords("orders", ["order-31", "order-31"], 10)).toEqual([
      { id: "order-31", version: 8 },
    ]);
    expect(rpc).toHaveBeenCalledExactlyOnceWith("listWork", {
      kind: "orders",
      id: "order-31",
    });
  });
  it("rejects empty, unsafe and oversized reference sets before network reads", async () => {
    for (const ids of [
      [],
      ["../private"],
      ["x".repeat(81)],
      Array.from({ length: 11 }, (_, i) => `order-${i}`),
    ])
      await expect(readRecords("orders", ids, 10)).rejects.toThrow(
        "INVALID_REFERENCES",
      );
    expect(rpc).not.toHaveBeenCalled();
    expect(recordIds(["x".repeat(80)], 1)).toHaveLength(1);
  });
  it("never substitutes a missing or different record for an authoritative reference", async () => {
    for (const rows of [
      [],
      [{ id: "other", version: 1 }],
      [
        { id: "own", version: 1 },
        { id: "extra", version: 1 },
      ],
    ]) {
      rpc.mockResolvedValueOnce({ rows });
      await expect(readRecords("packages", ["own"], 20)).rejects.toThrow(
        "MISSING_REFERENCE",
      );
    }
  });
  it("keeps authorization failures closed rather than returning cached snapshots", async () => {
    const denied = Object.assign(new Error("denied"), {
      code: "functions/permission-denied",
    });
    rpc.mockRejectedValueOnce(denied);
    await expect(
      readRecords("consolidationBatches", ["batch"], 1),
    ).rejects.toBe(denied);
  });
  it("finishes every bounded reference read before releasing a failed hydration", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    rpc.mockRejectedValueOnce(new Error("denied"));
    rpc.mockImplementationOnce(async () => {
      await gate;
      return { rows: [{ id: "second", version: 1 }] };
    });
    let finished = false;
    const hydration = readRecords("orders", ["first", "second"], 10).catch(
      (cause: Error) => {
        finished = true;
        return cause.message;
      },
    );
    await Promise.resolve();
    await Promise.resolve();
    expect(finished).toBe(false);
    release();
    expect(await hydration).toBe("denied");
    expect(rpc).toHaveBeenCalledTimes(2);
  });
  it.each(["missing", "network"])("waits for later actual authority failure when first read is %s", async (first) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const denied = Object.assign(new Error("denied"), { code: "functions/unauthenticated" });
    if (first === "missing") rpc.mockResolvedValueOnce({ rows: [] });
    else rpc.mockRejectedValueOnce(new Error("network"));
    rpc.mockImplementationOnce(async () => { await gate; throw denied; });
    let finished = false;
    const hydration = readRecords("orders", ["first", "second"], 10).catch((cause) => { finished = true; return cause; });
    await Promise.resolve();
    await Promise.resolve();
    expect(finished).toBe(false);
    release();
    expect(await hydration).toBe(denied);
    expect(rpc).toHaveBeenCalledTimes(2);
  });
  it("queue pairs prioritize known permission failure but preserve ordinary errors and success order", () => {
    const network = new Error("network"), denied = { code: "permission-denied" };
    expect(() => requireSettled([{ status: "rejected", reason: network }, { status: "rejected", reason: denied }])).toThrow();
    try { requireSettled([{ status: "rejected", reason: network }, { status: "rejected", reason: denied }]); } catch (cause) { expect(cause).toBe(denied); }
    expect(() => requireSettled([{ status: "rejected", reason: network }])).toThrow("network");
    expect(requireSettled([{ status: "fulfilled", value: "first" }, { status: "fulfilled", value: "second" }])).toEqual(["first", "second"]);
  });
  it("rejects absent and invalid versions, and freezes only referenced record versions", () => {
    for (const version of [0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])
      expect(() => versionMap([{ id: "order", version }])).toThrow(
        "INVALID_VERSION",
      );
    expect(versionMap([{ id: "order-31", version: 8 }])).toEqual({
      "order-31": 8,
    });
  });
  it("retains cross-page IDs, deduplicates selection and never silently prunes at the cap", () => {
    const selected = Array.from({ length: 20 }, (_, i) => `parcel-${i}`);
    expect(selectionIds(selected, "parcel-0", true, 20)).toEqual(selected);
    expect(() => selectionIds(selected, "parcel-31", true, 20)).toThrow(
      "SELECTION_LIMIT",
    );
    expect(selected).toHaveLength(20);
    expect(selectionIds(selected, "parcel-0", false, 20)).toEqual(
      selected.slice(1),
    );
  });
});

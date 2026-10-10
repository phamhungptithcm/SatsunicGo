import { expect, test } from "vitest";
import { withPurchaseMutation } from "../../functions/src/purchase-mutation-queue";
function deferred() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}
test("same checkout serializes bursts and keeps FIFO after a rejection", async () => {
  const gate = deferred(),
    order: number[] = [];
  const first = withPurchaseMutation("fifo", async () => {
    order.push(1);
    await gate.promise;
    return 1;
  });
  const second = withPurchaseMutation("fifo", async () => {
    order.push(2);
    throw Error("network");
  });
  const third = withPurchaseMutation("fifo", async () => {
    order.push(3);
    return 3;
  });
  const rejected = expect(second).rejects.toThrow("network");
  await Promise.resolve();
  expect(order).toEqual([1]);
  gate.release();
  expect(await first).toBe(1);
  await rejected;
  expect(await third).toBe(3);
  expect(order).toEqual([1, 2, 3]);
});
test("different checkout keys run independently", async () => {
  const gate = deferred(),
    first = withPurchaseMutation("independent-1", () => gate.promise);
  expect(await withPurchaseMutation("independent-2", async () => "done")).toBe(
    "done",
  );
  gate.release();
  await first;
});
test("same-key waiters are capped and released after completion", async () => {
  const gate = deferred(),
    jobs = Array.from({ length: 16 }, () =>
      withPurchaseMutation("bounded", () => gate.promise),
    );
  await expect(
    withPurchaseMutation("bounded", async () => 17),
  ).rejects.toMatchObject({ code: "resource-exhausted" });
  gate.release();
  await Promise.all(jobs);
  expect(await withPurchaseMutation("bounded", async () => "recovered")).toBe(
    "recovered",
  );
});
test("active-key memory is bounded and every failed/successful lane releases capacity", async () => {
  for (let iteration = 0; iteration < 10; iteration++) {
    const gate = deferred(),
      jobs = Array.from({ length: 64 }, (_, n) =>
        withPurchaseMutation(`capacity-${n}`, async () => {
          await gate.promise;
          if (n % 2) throw Error("expected failure");
          return n;
        }),
      );
    const completed = Promise.allSettled(jobs);
    await expect(
      withPurchaseMutation("capacity-extra", async () => true),
    ).rejects.toMatchObject({ code: "resource-exhausted" });
    gate.release();
    const outcomes = await completed;
    expect(outcomes.filter((o) => o.status === "fulfilled")).toHaveLength(32);
    expect(outcomes.filter((o) => o.status === "rejected")).toHaveLength(32);
  }
  expect(await withPurchaseMutation("capacity-extra", async () => true)).toBe(
    true,
  );
});

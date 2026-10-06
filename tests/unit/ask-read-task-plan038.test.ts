import { test, expect } from "vitest";
import {
  runBusinessReads,
  boundedJsonSnapshot,
  type ReadTask,
  type ReadAdapter,
  type JsonValue,
  type ReadResult,
} from "../../packages/domain/ask-read-task-plan";
const task = (
  id: string,
  tool: ReadTask["tool"],
  params: JsonValue = {},
): ReadTask => ({ id, tool, params });
const adapter = (read: ReadAdapter["read"]): ReadAdapter => ({
  parseParams: (v) => boundedJsonSnapshot(v, 3000),
  parseResult: (v) => boundedJsonSnapshot(v, 2500),
  read,
});
const args = (
  tasks: ReadTask[],
  adapters: Partial<Record<ReadTask["tool"], ReadAdapter>>,
) => ({
  subject: "u1",
  requestId: "r1",
  tasks,
  adapters,
  signal: new AbortController().signal,
});
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
test("fast independent result arrives while unrelated read waits", async () => {
  const slow = deferred<unknown>(),
    ready = deferred<void>(),
    seen: string[] = [];
  const p = runBusinessReads({
    ...args([task("a", "tracking"), task("b", "fees")], {
      tracking: adapter(() => slow.promise),
      fees: adapter(() => ({ price: 10 })),
    }),
    onResult: (r) => {
      seen.push(r.id);
      if (r.id === "b") ready.resolve();
    },
  });
  await ready.promise;
  expect(seen).toEqual(["b"]);
  slow.resolve({ stage: "packing" });
  expect(await p).toHaveLength(2);
});
test("equivalent normalized params coalesce only within request", async () => {
  let calls = 0;
  const a = args(
    [
      task("a", "catalog", { a: 1, b: 2 }),
      task("b", "catalog", { b: 2, a: 1 }),
    ],
    {
      catalog: adapter(() => {
        calls++;
        return [];
      }),
    },
  );
  await runBusinessReads(a);
  expect(calls).toBe(1);
  await runBusinessReads({ ...a, subject: "u2" });
  expect(calls).toBe(2);
});
test("complete plan including write tools validated before I/O", async () => {
  let calls = 0;
  await expect(
    runBusinessReads(
      args([task("a", "catalog"), task("b", "refund" as ReadTask["tool"])], {
        catalog: adapter(() => ++calls),
      }),
    ),
  ).rejects.toThrow();
  expect(calls).toBe(0);
});
test("schema parser rejection stops entire plan before reads", async () => {
  let calls = 0;
  const good = adapter(() => ++calls);
  await expect(
    runBusinessReads(
      args([task("a", "catalog"), task("b", "fees")], {
        catalog: good,
        fees: {
          ...good,
          parseParams: () => {
            throw Error("schema");
          },
        },
      }),
    ),
  ).rejects.toThrow();
  expect(calls).toBe(0);
});
test("private errors and malformed results become generic unavailable", async () => {
  for (const read of [
    () => {
      throw Error("PRIVATE");
    },
    () => ({ x: NaN }),
    () => "x".repeat(3000),
  ]) {
    const seen: ReadResult[] = [];
    expect(
      await runBusinessReads({
        ...args([task("a", "catalog")], { catalog: adapter(read) }),
        onResult: (r) => {
          seen.push(r);
        },
      }),
    ).toEqual([{ id: "a", status: "unavailable" }]);
    expect(seen).toEqual([{ id: "a", status: "unavailable" }]);
  }
});
test("result schema failure preserves independent success", async () => {
  const a = adapter(() => []);
  const r = await runBusinessReads(
    args([task("a", "tracking"), task("b", "catalog")], {
      tracking: {
        ...a,
        parseResult: () => {
          throw Error("PRIVATE");
        },
      },
      catalog: a,
    }),
  );
  expect(r).toEqual([
    { id: "a", status: "unavailable" },
    { id: "b", status: "ready", data: [] },
  ]);
});
test("duplicate IDs missing adapter oversized plans invalid concurrency rejected", async () => {
  const a = adapter(() => []);
  for (const p of [
    args([task("a", "catalog"), task("a", "catalog")], { catalog: a }),
    args([task("a", "tracking")], {}),
    args(
      Array.from({ length: 5 }, (_, i) => task(String(i), "catalog")),
      { catalog: a },
    ),
    { ...args([], { catalog: a }), concurrency: 4 },
  ])
    await expect(runBusinessReads(p)).rejects.toThrow();
});
test("accessors holes and custom array methods rejected without evaluation", () => {
  let calls = 0;
  const getter = [1];
  Object.defineProperty(getter, "0", {
    get() {
      calls++;
      return 1;
    },
    enumerable: true,
  });
  const custom = [1];
  custom.map = () => {
    calls++;
    return [];
  };
  for (const value of [getter, custom, new Array(1)])
    expect(() => boundedJsonSnapshot(value, 3000)).toThrow();
  expect(calls).toBe(0);
});
test("cycles nonfinite deep and oversized params rejected before I/O", async () => {
  let calls = 0;
  const cycle: Record<string, unknown> = {};
  cycle.self = cycle;
  let deep: unknown = {};
  for (let i = 0; i < 12; i++) deep = { child: deep };
  for (const value of [
    cycle,
    deep,
    { x: undefined },
    { x: Infinity },
    "x".repeat(4000),
  ])
    await expect(
      runBusinessReads(
        args([task("a", "catalog", value as JsonValue)], {
          catalog: adapter(() => ++calls),
        }),
      ),
    ).rejects.toThrow();
  expect(calls).toBe(0);
});
test("abort suppresses late observer results", async () => {
  const slow = deferred<unknown>(),
    started = deferred<void>(),
    c = new AbortController(),
    seen: ReadResult[] = [];
  const p = runBusinessReads({
    ...args([task("a", "tracking")], {
      tracking: adapter(() => {
        started.resolve();
        return slow.promise;
      }),
    }),
    signal: c.signal,
    onResult: (r) => {
      seen.push(r);
    },
  });
  await started.promise;
  c.abort(Error("superseded"));
  await expect(p).rejects.toThrow("superseded");
  slow.resolve([]);
  await Promise.resolve();
  expect(seen).toEqual([]);
});
test("observer failure aborts sibling read signal", async () => {
  const started = deferred<void>(),
    slow = deferred<unknown>();
  let siblingSignal: AbortSignal | undefined;
  const p = runBusinessReads({
    ...args([task("a", "tracking"), task("b", "fees")], {
      tracking: adapter((i) => {
        siblingSignal = i.signal;
        started.resolve();
        return slow.promise;
      }),
      fees: adapter(async () => {
        await started.promise;
        return [];
      }),
    }),
    onResult: () => {
      throw Error("observer");
    },
  });
  await expect(p).rejects.toThrow("observer");
  expect(siblingSignal?.aborted).toBe(true);
  slow.resolve([]);
});
test("plan snapshots isolate later caller mutation", async () => {
  const params = { q: "original" },
    gate = deferred<unknown>();
  const a = args([task("a", "catalog", params)], {
    catalog: adapter(async (i) => {
      await gate.promise;
      return i.params;
    }),
  });
  const p = runBusinessReads(a);
  params.q = "changed";
  gate.resolve(null);
  expect(await p).toEqual([
    { id: "a", status: "ready", data: { q: "original" } },
  ]);
});
test("bounded stream and final response reserve combined bytes", async () => {
  const seen: ReadResult[] = [];
  const tools: ReadTask["tool"][] = [
    "tracking",
    "catalog",
    "fees",
    "membership",
  ];
  const adapters = Object.fromEntries(
    tools.map((t) => [t, adapter(() => ({ body: "x".repeat(2400) }))]),
  );
  const results = await runBusinessReads({
    ...args(
      tools.map((t, i) => task(String(i), t)),
      adapters,
    ),
    onResult: (r) => {
      seen.push(r);
    },
  });
  const bytes = (v: unknown) =>
    new TextEncoder().encode(JSON.stringify(v)).length;
  expect(
    seen.reduce((n, r) => n + bytes({ type: "result", result: r }), 0) +
      bytes({ subject: "u1", requestId: "r1", results }) +
      2000,
  ).toBeLessThanOrEqual(30000);
});

test("observer mutation cannot alter retained results or a coalesced sibling", async () => {
  const observed: ReadResult[] = [];
  const results = await runBusinessReads({
    ...args([task("a", "catalog"), task("b", "catalog")], {
      catalog: adapter(() => ({ nested: { value: "original" } })),
    }),
    onResult: (r) => {
      observed.push(r);
      r.id = "changed";
      if (r.status === "ready") {
        (r.data as { nested: { value: string } }).nested.value = "changed";
        r.data = "x".repeat(40000);
      }
    },
  });
  expect(results).toEqual(
    ["a", "b"].map((id) => ({
      id,
      status: "ready",
      data: { nested: { value: "original" } },
    })),
  );
  expect(observed).toHaveLength(2);
  observed[0].status = "unavailable";
  expect(results[0].status).toBe("ready");
});

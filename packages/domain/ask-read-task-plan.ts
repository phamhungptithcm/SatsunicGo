/** Pure scheduler for trusted, validated read plans; adapters enforce authority. */
export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type ReadTool = "tracking" | "catalog" | "fees" | "membership";
export type ReadTask = { id: string; tool: ReadTool; params: JsonValue };
export type ReadResult =
  | { id: string; status: "ready"; data: JsonValue }
  | { id: string; status: "unavailable" };
export type ReadAdapter = {
  parseParams: (value: unknown) => JsonValue;
  parseResult: (value: unknown) => JsonValue;
  read: (input: {
    subject: string;
    requestId: string;
    params: JsonValue;
    signal: AbortSignal;
  }) => unknown | Promise<unknown>;
};
const allowed = new Set<ReadTool>([
  "tracking",
  "catalog",
  "fees",
  "membership",
]);
export function boundedIdentity(value: unknown): value is string {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= 160
  );
}
const size = (value: unknown) =>
  new TextEncoder().encode(JSON.stringify(value)).length;
/** Arbitrary proxies are excluded by the adapter's trusted JSON boundary. */
function canonical(value: unknown, maxBytes: number): string {
  const seen = new WeakSet<object>();
  let nodes = 0;
  function walk(v: unknown, depth: number): string {
    if (depth > 8 || ++nodes > 500) throw Error("INVALID_DATA");
    if (v === null || typeof v === "boolean") return JSON.stringify(v);
    if (typeof v === "string") {
      if (v.length > maxBytes) throw Error("INVALID_DATA");
      return JSON.stringify(v);
    }
    if (typeof v === "number" && Number.isFinite(v)) return JSON.stringify(v);
    if (typeof v !== "object" || v === null || seen.has(v))
      throw Error("INVALID_DATA");
    seen.add(v);
    let out: string;
    if (Array.isArray(v)) {
      if (
        Object.getPrototypeOf(v) !== Array.prototype ||
        v.length > 100 ||
        Reflect.ownKeys(v).length !== v.length + 1
      )
        throw Error("INVALID_DATA");
      const values: string[] = [];
      for (let i = 0; i < v.length; i++) {
        const d = Object.getOwnPropertyDescriptor(v, String(i));
        if (!d || !("value" in d) || d.get || d.set)
          throw Error("INVALID_DATA");
        values.push(walk(d.value as unknown, depth + 1));
      }
      out = "[" + values.join(",") + "]";
    } else {
      if (Object.getPrototypeOf(v) !== Object.prototype)
        throw Error("INVALID_DATA");
      const keys = Object.keys(v).sort();
      if (keys.length > 100 || Reflect.ownKeys(v).length !== keys.length)
        throw Error("INVALID_DATA");
      out =
        "{" +
        keys
          .map((k) => {
            const d = Object.getOwnPropertyDescriptor(v, k);
            if (!d || !("value" in d) || d.get || d.set)
              throw Error("INVALID_DATA");
            return (
              JSON.stringify(k) + ":" + walk(d.value as unknown, depth + 1)
            );
          })
          .join(",") +
        "}";
    }
    seen.delete(v);
    return out;
  }
  const out = walk(value, 0);
  if (new TextEncoder().encode(out).length > maxBytes)
    throw Error("INVALID_DATA");
  return out;
}
export function boundedJsonSnapshot(
  value: unknown,
  maxBytes: number,
): JsonValue {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 30000)
    throw Error("INVALID_LIMIT");
  return JSON.parse(canonical(value, maxBytes)) as JsonValue;
}
function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  let handler: () => void;
  const cancelled = new Promise<never>((_, reject) => {
    handler = () => reject(signal.reason ?? Error("CANCELLED"));
    signal.addEventListener("abort", handler, { once: true });
  });
  return Promise.race([promise, cancelled]).finally(() =>
    signal.removeEventListener("abort", handler),
  );
}
export async function runBusinessReads(p: {
  subject: string;
  requestId: string;
  tasks: readonly ReadTask[];
  adapters: Partial<Record<ReadTool, ReadAdapter>>;
  signal: AbortSignal;
  onResult?: (result: ReadResult) => void;
  concurrency?: number;
}): Promise<ReadResult[]> {
  const concurrency = p.concurrency ?? 2;
  if (
    !boundedIdentity(p.subject) ||
    !boundedIdentity(p.requestId) ||
    !Array.isArray(p.tasks) ||
    p.tasks.length > 4 ||
    ![1, 2, 3].includes(concurrency)
  )
    throw Error("INVALID_PLAN");
  const ids = new Set<string>();
  // Validate and snapshot the complete plan before any adapter can perform I/O.
  const plan = p.tasks.map((task: ReadTask) => {
    const adapter = p.adapters[task.tool];
    if (
      !boundedIdentity(task.id) ||
      ids.has(task.id) ||
      !allowed.has(task.tool) ||
      !adapter ||
      typeof adapter.read !== "function" ||
      typeof adapter.parseParams !== "function" ||
      typeof adapter.parseResult !== "function"
    )
      throw Error("INVALID_TASK");
    ids.add(task.id);
    const raw = boundedJsonSnapshot(task.params, 3000);
    const params = boundedJsonSnapshot(adapter.parseParams(raw), 3000);
    return {
      id: task.id,
      tool: task.tool,
      params,
      adapter,
      key: task.tool + ":" + canonical(params, 3000),
    };
  });
  p.signal.throwIfAborted();
  const inflight = new Map<string, Promise<unknown>>(),
    results = new Map<string, ReadResult>();
  const controller = new AbortController();
  const signal = AbortSignal.any([p.signal, controller.signal]);
  let cursor = 0,
    emittedBytes = 0;
  async function worker() {
    while (cursor < plan.length) {
      signal.throwIfAborted();
      const task = plan[cursor++];
      let result: ReadResult;
      try {
        if (!inflight.has(task.key))
          inflight.set(
            task.key,
            Promise.resolve().then(() => {
              signal.throwIfAborted();
              return task.adapter.read({
                subject: p.subject,
                requestId: p.requestId,
                params: boundedJsonSnapshot(task.params, 3000),
                signal,
              });
            }),
          );
        const raw = boundedJsonSnapshot(
          await abortable(inflight.get(task.key)!, signal),
          2500,
        );
        result = {
          id: task.id,
          status: "ready",
          data: boundedJsonSnapshot(task.adapter.parseResult(raw), 2500),
        };
      } catch {
        signal.throwIfAborted();
        result = { id: task.id, status: "unavailable" };
      }
      signal.throwIfAborted();
      results.set(task.id, result);
      const combined = {
        subject: p.subject,
        requestId: p.requestId,
        results: [...results.values()],
      };
      const nextBytes = size({ type: "result", result });
      const remaining = plan.length - results.size;
      if (
        size(combined) > 12000 ||
        emittedBytes + nextBytes + size(combined) + remaining * 7200 + 2000 >
          30000
      )
        throw Error("INVALID_RESULT_ENVELOPE");
      emittedBytes += nextBytes;
      // Observer ownership is separate from the validated retained result.
      p.onResult?.(boundedJsonSnapshot(result, 3000) as ReadResult);
    }
  }
  try {
    await Promise.all(
      Array.from({ length: Math.min(concurrency, plan.length) }, worker),
    );
  } catch (error) {
    controller.abort(error);
    throw error;
  }
  const final = plan.map((task) => results.get(task.id)!);
  if (
    emittedBytes +
      size({ subject: p.subject, requestId: p.requestId, results: final }) +
      2000 >
      30000 ||
    results.size + 1 + 7 > 12
  )
    throw Error("INVALID_RESULT_ENVELOPE");
  return final;
}

/** Admission guard for the bounded read/draft model loop. No mutation authority. */
export function createAskRunGuard(options: {
  signal: AbortSignal;
  tools: readonly string[];
  maxCalls: number;
  timeoutMs: number;
  now?: () => number;
}) {
  if (
    !Number.isSafeInteger(options.maxCalls) ||
    options.maxCalls < 1 ||
    options.maxCalls > 20 ||
    !Number.isSafeInteger(options.timeoutMs) ||
    options.timeoutMs < 1 ||
    options.timeoutMs > 30_000 ||
    !options.tools.length ||
    new Set(options.tools).size !== options.tools.length
  )
    throw Error("INVALID_RUN_POLICY");
  const now = options.now ?? Date.now;
  const { signal, maxCalls } = options;
  const deadline = now() + options.timeoutMs;
  const allowed = new Set(options.tools);
  let calls = 0;
  const check = () => {
    signal.throwIfAborted();
    if (now() >= deadline) throw Error("RUN_TIMEOUT");
  };
  return {
    check,
    admit(tool: string) {
      check();
      if (!allowed.has(tool)) throw Error("TOOL_NOT_ALLOWED");
      if (calls >= maxCalls) throw Error("TOOL_LIMIT");
      calls++;
    },
  };
}

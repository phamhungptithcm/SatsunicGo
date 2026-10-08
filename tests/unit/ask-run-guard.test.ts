import { expect, test } from "vitest";
import { createAskRunGuard } from "../../functions/src/ai/run-guard";
const policy = () => ({
  signal: new AbortController().signal,
  tools: ["read", "draft"],
  maxCalls: 4,
  timeoutMs: 20_000,
});
test("happy: authorized reads/drafts share one strict call budget", () => {
  const guard = createAskRunGuard(policy());
  for (const name of ["read", "draft", "read", "read"]) guard.admit(name);
  expect(() => guard.admit("draft")).toThrow("TOOL_LIMIT");
});
test("bad: privileged or unregistered tools cannot consume a permitted call", () => {
  const guard = createAskRunGuard({ ...policy(), maxCalls: 1 });
  expect(() => guard.admit("refund")).toThrow("TOOL_NOT_ALLOWED");
  expect(() => guard.admit("read")).not.toThrow();
});
test("bad: cancellation prevents both tool execution and final publication", () => {
  const controller = new AbortController();
  const guard = createAskRunGuard({ ...policy(), signal: controller.signal });
  controller.abort(new Error("cancelled"));
  expect(() => guard.admit("read")).toThrow("cancelled");
  expect(() => guard.check()).toThrow("cancelled");
});
test("bad: deadline is shared across calls and includes the exact expiry", () => {
  let clock = 0;
  const guard = createAskRunGuard({ ...policy(), now: () => clock });
  clock = 19999;
  expect(() => guard.admit("read")).not.toThrow();
  clock = 20000;
  expect(() => guard.admit("draft")).toThrow("RUN_TIMEOUT");
  expect(() => guard.check()).toThrow("RUN_TIMEOUT");
});
test.each([
  { maxCalls: 0 },
  { maxCalls: 1.1 },
  { maxCalls: Infinity },
  { timeoutMs: 30001 },
  { timeoutMs: 0 },
  { tools: [] },
  { tools: ["read", "read"] },
])("bad: invalid run policy fails closed %j", (change) => {
  expect(() => createAskRunGuard({ ...policy(), ...change })).toThrow(
    "INVALID_RUN_POLICY",
  );
});

test("bad: mutating policy after admission cannot widen the existing run", () => {
  const options = { ...policy(), maxCalls: 1 };
  const { admit } = createAskRunGuard(options);
  options.maxCalls = 20;
  options.tools.push("refund");
  expect(() => admit("refund")).toThrow("TOOL_NOT_ALLOWED");
  expect(() => admit("read")).not.toThrow();
  expect(() => admit("read")).toThrow("TOOL_LIMIT");
});

import { expect, it } from "vitest";
import { assertProductionTestCommand } from "../../functions/src/production-test-commands";
const order = { executionMode: "production_test", executionPolicyVersion: 1, testRunId: "8d4bd111-a42d-402c-ac3e-f2b323111111", testMode: true };
it.each(["issueQuote", "acceptQuote", "cancelRequest", "claimPurchase", "hold", "releaseHold", "finalize", "approveFinal"])("permits simulated decision %s with immutable provenance", action => {
  expect(() => assertProductionTestCommand(order, action)).not.toThrow();
});
it.each(["recordPurchase", "receive", "pack", "dispatch", "track", "confirmReceipt", "refund", "verifyTransfer", "transferReview", "unknown"])("test proof cannot authorize %s", action => {
  expect(() => assertProductionTestCommand(order, action)).toThrow(expect.objectContaining({ details: { reason: "TEST_OPERATION_NOT_SUPPORTED" } }));
});
it("does not change the existing live command domain; later domain authorization still applies", () => {
  expect(() => assertProductionTestCommand({ ownerId: "live", version: 1 }, "recordPurchase")).not.toThrow();
});
it.each([{ executionMode: "live" }, { executionMode: "production_test" }, { ...order, executionPolicyVersion: 0 }])("malformed provenance never becomes a permitted simulated command", value => {
  expect(() => assertProductionTestCommand(value, "hold")).toThrow(expect.objectContaining({ details: { reason: "PURCHASE_EXECUTION_INVALID" } }));
});
it("legacy sandbox tags still block real money and physical actions", () => {
  expect(() => assertProductionTestCommand({ testMode: true }, "refund")).toThrow();
  expect(() => assertProductionTestCommand({ provider: "sepay_sandbox" }, "recordPurchase")).toThrow();
});

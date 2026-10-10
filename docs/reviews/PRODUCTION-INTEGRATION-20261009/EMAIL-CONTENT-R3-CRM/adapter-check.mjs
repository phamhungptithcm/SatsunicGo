import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { callService, fixture } from "./fixture-service.ts";
const cases = [];
for (const [name, args, description] of [
  ["writeOrder", { orderId: "QA-A" }, "reject undeclared service"],
  ["readOrderOperations", { orderId: "REAL-ORDER" }, "reject nonfixture order"],
  ["readOrderOperations", { orderId: "QA-A", extra: true }, "reject extra payload"],
  ["readOrderOperations", null, "reject missing payload"],
]) {
  await assert.rejects(callService(name, args), /UNDECLARED_FIXTURE_CALL/);
  cases.push({ case: description, status: "PASSED" });
}
fixture.choose("success");
const normal = await callService("readOrderOperations", { orderId: "QA-A" });
assert.deepEqual(Object.keys(normal.recipient).sort(), ["address", "phone", "recipient"]);
assert.equal(normal.recipient.phone, "SỐ ĐIỆN THOẠI GIẢ");
cases.push({ case: "three-field synthetic response without real phone", status: "PASSED" });
fixture.choose("missing");
assert.equal((await callService("readOrderOperations", { orderId: "QA-A" })).recipient, null);
cases.push({ case: "explicit null recipient", status: "PASSED" });
fixture.choose("error");
await assert.rejects(callService("readOrderOperations", { orderId: "QA-A" }), /SYNTHETIC_READ_FAILURE/);
fixture.nextResponseSuccess();
assert.ok((await callService("readOrderOperations", { orderId: "QA-A" })).recipient);
cases.push({ case: "controlled read failure then explicit successful retry", status: "PASSED" });
fixture.choose("hold");
const lateA = callService("readOrderOperations", { orderId: "QA-A" });
assert.equal(fixture.pendingCount(), 1);
fixture.replaceOrder();
const nextB = await callService("readOrderOperations", { orderId: "QA-B" });
fixture.resolveOldest();
assert.equal((await lateA).recipient.recipient, "Khách kiểm thử A");
assert.equal(nextB.recipient.recipient, "Khách kiểm thử B");
assert.equal(fixture.pendingCount(), 0);
cases.push({ case: "held result captures original mode before replacement", status: "PASSED" });
const receipt = { at: new Date().toISOString(), scope: "QA adapter reliability only; not application/backend authorization tests", runtime: process.version, cases, passed: cases.length, failed: 0, providerIO: false };
await fs.writeFile(new URL("./ADAPTER-CONTRACTS.json", import.meta.url), JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify({ passed: cases.length, failed: 0, scope: receipt.scope }));

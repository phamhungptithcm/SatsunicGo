// Offline resource probe only: no Firebase client, customer data or network calls.
import assert from "node:assert/strict";
import process from "node:process";
import console from "node:console";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
const require = createRequire(import.meta.url);
const {
  withPurchaseMutation,
} = require("../functions/lib/functions/src/purchase-mutation-queue.js");
const {
  renderPurchaseReceipt,
} = require("../functions/lib/functions/src/purchase-pdf.js");
assert.equal(typeof globalThis.gc, "function", "Run with --expose-gc");
const receipt = {
  id: randomUUID(),
  ownerId: "synthetic-memory-probe",
  provider: "demo",
  reference: `DEMO-${randomUUID()}`,
  paidAt: 1791547200000,
  purpose: "initial",
  previouslyPaid: 0,
  snapshotHash: "synthetic-only",
  shipping: { state: "unknown" },
  total: 3150,
  lines: Array.from({ length: 30 }, (_, i) => ({
    lineId: randomUUID(),
    orderId: randomUUID(),
    kind: "custom",
    market: "US",
    name: `Món kiểm thử có tên dài và dấu tiếng Việt ${i + 1}`,
    variant: "Màu trắng · phiên bản kiểm thử",
    quantity: 1,
    goods: 100,
    service: 5,
    total: 105,
    termsVersion: "demo",
  })),
};
const samples = [],
  started = performance.now();
globalThis.gc();
const before = process.memoryUsage();
let pdfBytes = 0;
for (let round = 0; round < 5; round++) {
  for (let burst = 0; burst < 10; burst++) {
    const results = await Promise.allSettled(
      Array.from({ length: 64 }, (_, i) =>
        withPurchaseMutation(`memory-${i}`, async () => {
          if (i % 2) throw Error("expected failure");
          return i;
        }),
      ),
    );
    assert.equal(
      results.filter((row) => row.status === "fulfilled").length,
      32,
    );
    assert.equal(
      await withPurchaseMutation("released-capacity", async () => true),
      true,
    );
  }
  for (let render = 0; render < 10; render++) {
    const pdf = renderPurchaseReceipt(receipt);
    assert.ok(pdf.length > 1000 && pdf.length <= 3000000);
    pdfBytes = pdf.length;
  }
  globalThis.gc();
  samples.push(process.memoryUsage());
}
const after = samples.at(-1);
const evidence = {
  status: "PASSED",
  node: process.version,
  queueOperations: 3200,
  queueFailures: 1600,
  pdfRenders: 50,
  linesPerPdf: 30,
  pdfBytes,
  elapsedMs: Math.round(performance.now() - started),
  baseline: before,
  postGcSamples: samples,
  heapDeltaBytes: after.heapUsed - before.heapUsed,
  externalDeltaBytes: after.external - before.external,
  scope:
    "Finite offline Node probe with forced GC and synthetic data; capacity released after mixed failures. Measurements are not proof of production leak freedom or throughput.",
};
writeFileSync(
  "docs/reviews/PAYMENT-UPFRONT-20261008/GATEWAY-RESOURCES.json",
  JSON.stringify(evidence, null, 2) + "\n",
);
console.log(JSON.stringify(evidence));

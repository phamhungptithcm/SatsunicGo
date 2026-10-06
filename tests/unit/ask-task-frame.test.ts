import { test } from "vitest";
import assert from "node:assert/strict";
import {
  collectReadFrame,
  canonicalFrameDetectors,
} from "../../packages/domain/ask-task-frame";
import { extractOrderTrackingIntent } from "../../packages/domain/order-tracking";
import {
  catalogSearchIntent,
  normalizeCatalogText,
} from "../../packages/domain/catalog-search";
import { productQuery } from "../../packages/domain/ask-language-query";
import {
  shippingQuestionDirection,
  questionWeightKg,
} from "../../src/features/ask/ShippingQuote";
const canonical = {
  tracking: extractOrderTrackingIntent,
  catalog: catalogSearchIntent,
  product: productQuery,
  direction: shippingQuestionDirection,
  actionOrAmbiguity: (raw: string) =>
    /\b(?:mua|buy|pay|payment|refund|cancel|thanh toan|hoan tien|huy don)\b/.test(
      normalizeCatalogText(raw),
    ),
};
const detectors = canonicalFrameDetectors(canonical);
const frame = (raw: string) => collectReadFrame(raw, detectors);
const id = "123e4567-e89b-12d3-a456-426614174000";
const mixed = `mã đơn ${id} đến đâu rồi, tìm giúp chị kem dưỡng ẩm CeraVe và phí gửi từ Mỹ về Việt Nam`;
test("three actual goals preserve original raw slices and canonical payload", () => {
  const f = frame(mixed);
  assert.deepEqual(
    f.tasks.map((t) => t.kind),
    ["tracking", "catalog", "fees"],
  );
  assert.equal(f.requiresClarification, false);
  assert.ok(f.tasks[0].kind === "tracking");
  assert.equal(f.tasks[0].params.orderId, id);
  for (const t of f.tasks)
    assert.equal(t.span.raw, mixed.slice(t.span.start, t.span.end));
  assert.ok(f.tasks[1].kind === "catalog");
  assert.equal(f.tasks[1].params.question, " tìm giúp chị kem dưỡng ẩm CeraVe");
});
test("unaccented polite clauses and va separate three goals", () =>
  assert.deepEqual(
    frame(
      "ma don order-42, tim giup chi kem duong am va phi gui tu My ve Viet Nam",
    ).tasks.map((t) => t.kind),
    ["tracking", "catalog", "fees"],
  ));
for (const weight of ["0,5", "1,000", "1.5"])
  test("decimal preserved " + weight, () => {
    const raw = `phí gửi Mỹ về Việt Nam ${weight} kg`;
    const f = frame(raw);
    assert.equal(f.tasks.length, 1);
    assert.equal(f.tasks[0].span.raw, raw);
    assert.equal(
      questionWeightKg(raw),
      String(Number(weight.replace(",", "."))),
    );
  });
for (const raw of [
  "mã đơn ABC-123４",
  "mã đơn ＡBC-123",
  "mã đơn ABC-123é",
  "mã đơn ABC-123\u0301",
])
  test("whole Unicode ID rejection " + raw, () => {
    assert.equal(extractOrderTrackingIntent(raw).kind, "none");
    assert.equal(frame(raw).tasks.length, 0);
    assert.equal(frame(raw).requiresClarification, true);
  });
for (const raw of [
  "mã đơn order-42, mã đơn order-43",
  "mã đơn order-42, mã đơn order-42",
  "mã đơn order-42 và order-43",
])
  test("multiple or duplicate order references clarify " + raw, () => {
    const f = frame(raw);
    assert.equal(f.requiresClarification, true);
    assert.equal(f.tasks.length, 0);
  });
test("both shipping routes require clarification", () => {
  const f = frame("phí gửi Mỹ về Việt Nam và Việt Nam sang Mỹ");
  assert.equal(f.tasks.length, 0);
  assert.equal(f.unresolved[0].reason, "unsupported-conjunction");
});
test("missing shipping route never falls through to catalog", () => {
  const f = frame("phí gửi hàng");
  assert.equal(f.tasks.length, 0);
  assert.equal(f.unresolved[0].reason, "shipping-route-required");
});
for (const raw of [
  "mua kem và mã đơn order-42",
  "tìm kem và thanh toán đơn",
  "refund order-42",
])
  test("explicit action never becomes read execution " + raw, () => {
    assert.equal(frame(raw).tasks.length, 0);
    assert.equal(frame(raw).unresolved[0].reason, "explicit-action-review");
  });
for (const raw of [
  "đừng tìm kem",
  "tìm kem hay serum",
  "tìm sản phẩm dùng khi mang thai",
  "tìm vitamin 1000mcg/10ml",
])
  test("canonical uncertainty guard " + raw, () => {
    assert.equal(productQuery(raw).requiresInterpretation, true);
    assert.equal(frame(raw).tasks.length, 0);
  });
test("unknown comma tail retained alongside recognized goal", () => {
  const f = frame("tìm serum, giải thích điều bí ẩn");
  assert.equal(f.tasks.length, 1);
  assert.equal(f.unresolved.length, 1);
  assert.equal(f.requiresClarification, true);
  assert.equal(f.unresolved[0].raw, " giải thích điều bí ẩn");
});
test("unknown explanatory conjunction retained", () => {
  const f = frame("tìm serum và giải thích điều bí ẩn");
  assert.equal(f.unresolved.length, 1);
  assert.equal(f.requiresClarification, true);
});
test("brand conjunction stays single original clause", () => {
  const raw = "tìm Bath and Body Works";
  assert.equal(frame(raw).tasks.length, 1);
  assert.equal(frame(raw).tasks[0].span.raw, raw);
});
test("four task bound and no silent five-task truncation", () => {
  const raw = Array(4).fill("tìm kem").join(", ");
  assert.equal(frame(raw).tasks.length, 0);
  assert.equal(frame(raw).unresolved[0].reason, "multiple-catalog-panels");
  const f = frame(raw + ", tìm kem");
  assert.equal(f.tasks.length, 0);
  assert.equal(f.unresolved[0].reason, "task-bound");
});
test("input bound preserves entire overlong original for clarification", () => {
  const raw = "tìm " + "x".repeat(997);
  assert.equal(frame(raw).unresolved[0].reason, "input-bound");
  assert.equal(frame(raw).raw, raw);
});
test("emoji UTF16 offsets retain exact original spans", () => {
  const raw = `mã đơn ${id} 📦, tìm kem`;
  for (const t of frame(raw).tasks)
    assert.equal(t.span.raw, raw.slice(t.span.start, t.span.end));
});
test("collector has no scheduling or adapter side effects", () => {
  let calls = 0;
  const d = {
    ...detectors,
    classify: (s: string) => {
      calls++;
      return detectors.classify(s);
    },
  };
  const f = collectReadFrame(mixed, d);
  assert.equal(calls, 3);
  assert.equal(f.concurrency, 2);
  assert.equal(f.tasks.length, 3);
});
test("arbitrary unknown comma tail not misclassified by broad catalog fallback", () => {
  const f = frame("tìm serum, florb zarg");
  assert.equal(f.tasks.length, 1);
  assert.equal(f.unresolved[0].raw, " florb zarg");
  assert.equal(f.requiresClarification, true);
});
for (const raw of [
  "tìm kem và kể chuyện",
  "tìm kem and florb zarg",
  "tìm serum va xem thời tiết",
  "mã đơn order-42 và còn yêu cầu bí ẩn",
])
  test("unsupported conjunction explicitly clarifies entire raw " + raw, () => {
    const f = frame(raw);
    assert.equal(f.tasks.length, 0);
    assert.equal(f.requiresClarification, true);
    assert.equal(f.unresolved[0].raw, raw);
    assert.equal(f.unresolved[0].reason, "unsupported-conjunction");
  });
test("vetted Johnson and Johnson lexical name stays whole", () => {
  const raw = "tìm Johnson and Johnson";
  const f = frame(raw);
  assert.equal(f.tasks.length, 1);
  assert.equal(f.tasks[0].kind, "catalog");
  assert.equal(f.tasks[0].span.raw, raw);
});
test("vetted brand does not permit unrelated conjunction afterward", () => {
  const raw = "tìm Johnson and Johnson and tell me the weather";
  assert.equal(frame(raw).tasks.length, 0);
  assert.equal(frame(raw).unresolved[0].reason, "unsupported-conjunction");
});
test("brand clause followed by actual fee goal retains two exact spans", () => {
  const raw = "tìm Johnson and Johnson và phí gửi Mỹ về Việt Nam 0,5 kg";
  const f = frame(raw);
  assert.deepEqual(
    f.tasks.map((t) => t.kind),
    ["catalog", "fees"],
  );
  for (const t of f.tasks)
    assert.equal(t.span.raw, raw.slice(t.span.start, t.span.end));
  assert.ok(f.tasks[1].kind === "fees");
  assert.equal(questionWeightKg(f.tasks[1].params.question), "0.5");
});
for (const raw of [
  "phí gửi Mỹ về Việt Nam và phí gửi Việt Nam sang Mỹ",
  "phí gửi Mỹ về Việt Nam, phí gửi Việt Nam sang Mỹ",
  "phí gửi Mỹ về Việt Nam và phí gửi Mỹ về Việt Nam",
])
  test(
    "single-panel contract explicitly rejects duplicate fee intents " + raw,
    () => {
      const f = frame(raw);
      assert.equal(f.tasks.length, 0);
      assert.equal(f.requiresClarification, true);
      assert.equal(f.unresolved[0].raw, raw);
      assert.equal(f.unresolved[0].reason, "multiple-fee-panels");
    },
  );
test("ordinary tìm remains read despite commerce shoppingIntent-like verb", () => {
  const f = frame("tìm kem dưỡng ẩm");
  assert.equal(f.tasks.length, 1);
  assert.equal(f.tasks[0].kind, "catalog");
});

for (const raw of [
  "tìm kem CeraVe phí gửi Mỹ về Việt Nam",
  "phí gửi Mỹ về Việt Nam tìm kem CeraVe",
  "shipping US to Vietnam find CeraVe cream",
])
  test(
    "delimiter-free explicit catalog and fees never lose product goal " + raw,
    () => {
      const f = frame(raw);
      assert.equal(f.tasks.length, 0);
      assert.equal(f.requiresClarification, true);
      assert.equal(f.unresolved[0].reason, "unsplit-catalog-and-fees");
      assert.equal(f.unresolved[0].raw, raw);
      assert.equal(f.unresolved[0].start, 0);
      assert.equal(f.unresolved[0].end, raw.length);
    },
  );
test("duplicate catalog panels clarify entire original input", () => {
  const raw = "tìm kem CeraVe, tìm serum";
  const f = frame(raw);
  assert.equal(f.tasks.length, 0);
  assert.equal(f.requiresClarification, true);
  assert.equal(f.unresolved[0].reason, "multiple-catalog-panels");
  assert.equal(f.unresolved[0].raw, raw);
});
test("fees alone remain fees despite permissive catalog detector", () => {
  const raw = "phí gửi Mỹ về Việt Nam";
  assert.equal(catalogSearchIntent(raw), true);
  const f = frame(raw);
  assert.equal(f.tasks.length, 1);
  assert.equal(f.tasks[0].kind, "fees");
  assert.equal(f.tasks[0].span.raw, raw);
});

for (const raw of [
  "mã đơn order-42 tìm kem dưỡng ẩm",
  "tìm kem dưỡng ẩm mã đơn order-42",
  "order id order-42 find CeraVe cream",
  "search CeraVe cream order id order-42",
])
  test(
    "delimiter-free explicit tracking and catalog never lose either goal " +
      raw,
    () => {
      const f = frame(raw);
      assert.equal(f.tasks.length, 0);
      assert.equal(f.requiresClarification, true);
      assert.equal(f.unresolved[0].reason, "unsplit-tracking-and-catalog");
      assert.equal(f.unresolved[0].raw, raw);
      assert.equal(f.unresolved[0].start, 0);
      assert.equal(f.unresolved[0].end, raw.length);
    },
  );
for (const raw of [
  "mã đơn order-42",
  "mã đơn order-42 đến đâu rồi",
  "order id order-42",
  "order id find-42",
  "mã đơn search-42",
  "mã đơn tim-42",
])
  test(
    "standalone order does not trigger product cue from ID token " + raw,
    () => {
      const f = frame(raw);
      assert.equal(f.tasks.length, 1);
      assert.equal(f.tasks[0].kind, "tracking");
      assert.equal(f.tasks[0].span.raw, raw);
    },
  );

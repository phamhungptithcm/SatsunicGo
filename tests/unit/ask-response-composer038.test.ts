import { test } from "vitest";
import assert from "node:assert/strict";
import {
  startView,
  mergePanel,
  mergeExplanation,
  updateAddress,
} from "../../packages/domain/ask-response-composer";
const initial = () => startView("u1", "r1", "c1");
import type {
  BusinessPanel,
  ConversationView,
  Address,
} from "../../packages/domain/ask-response-composer";
const panel: BusinessPanel = {
  subject: "u1",
  requestId: "r1",
  conversationId: "c1",
  id: "order",
  kind: "tracking",
  resourceKey: "order1",
  revision: 1,
  status: "ready",
  payload: { stage: "packing" },
};
const explain = (v: ConversationView) => ({
  ...v,
  text: "Em gửi anh/chị tiến độ đơn.",
});
test("same request old evidence cannot attach after newer order facts", () => {
  const v = mergePanel(initial(), panel),
    old = explain(v),
    next = mergePanel(v, { ...panel, revision: 2 });
  assert.equal(mergeExplanation(next, old), next);
});
test("panel revision update invalidates existing explanation", () => {
  const v = mergePanel(initial(), panel),
    withText = mergeExplanation(v, explain(v));
  assert.ok(withText.explanation);
  assert.equal(
    mergePanel(withText, { ...panel, revision: 2 }).explanation,
    null,
  );
});
test("pronoun correction invalidates old AI text even in same request", () => {
  const v = initial(),
    old = explain(v),
    next = updateAddress(v, {
      subject: "u1",
      conversationId: "c1",
      provenance: "explicit-current-speaker",
      revision: 1,
      address: "chị",
    });
  assert.equal(mergeExplanation(next, old), next);
  assert.equal(next.address, "chị");
});
test("older preference, other conversation and third-party provenance rejected", () => {
  const v = updateAddress(initial(), {
    subject: "u1",
    conversationId: "c1",
    provenance: "explicit-current-speaker",
    revision: 2,
    address: "chị",
  });
  for (const p of [
    { revision: 1, address: "anh" as Address },
    { conversationId: "c2" },
    { provenance: "inferred-name" as "explicit-current-speaker" },
    { subject: "u2" },
  ])
    assert.equal(
      updateAddress(v, {
        subject: "u1",
        conversationId: "c1",
        provenance: "explicit-current-speaker",
        revision: 3,
        address: "anh",
        ...p,
      }),
      v,
    );
});
test("panel identity cannot change under same ID", () => {
  const v = mergePanel(initial(), panel);
  assert.equal(
    mergePanel(v, { ...panel, resourceKey: "foreign-order", revision: 2 }),
    v,
  );
  assert.equal(mergePanel(v, { ...panel, kind: "catalog", revision: 2 }), v);
});
test("oversized payload and write domain rejected", () => {
  const v = initial();
  assert.equal(mergePanel(v, { ...panel, payload: "x".repeat(6000) }), v);
  assert.equal(
    mergePanel(v, { ...panel, kind: "refund" as BusinessPanel["kind"] }),
    v,
  );
});
test("fresh explanation accepted only against exact address/evidence snapshot", () => {
  const v = mergePanel(initial(), panel);
  assert.ok(mergeExplanation(v, explain(v)).explanation);
  assert.equal(mergeExplanation(v, { ...explain(v), subject: "u2" }), v);
});
test("out-of-order same-revision ready result remains immutable", () => {
  const v = mergePanel(initial(), panel);
  assert.equal(mergePanel(v, { ...panel, payload: { stage: "delivered" } }), v);
});

test("panel from reset conversation rejected even with reused request", () => {
  const v = initial();
  assert.equal(mergePanel(v, { ...panel, conversationId: "old" }), v);
});
test("missing blank nonstring oversized panel IDs rejected", () => {
  const v = initial();
  for (const id of [undefined, "", " ", 99, "x".repeat(161)])
    assert.equal(mergePanel(v, { ...panel, id: id as string }), v);
});
test("invalid initial identity cannot create view", () => {
  for (const id of ["", null, 42, "x".repeat(161)])
    assert.throws(() => startView(id as string, "r1", "c1"));
});

test("serialized escaped explanation plus panels rejected before merge", () => {
  let v = initial();
  for (let i = 0; i < 4; i++)
    v = mergePanel(v, {
      ...panel,
      id: "p" + i,
      resourceKey: "o" + i,
      payload: "x".repeat(4600),
    });
  const escaped = "\u0000".repeat(5900);
  assert.equal(mergeExplanation(v, { ...explain(v), text: escaped }), v);
  assert.ok(new TextEncoder().encode(JSON.stringify(v)).length < 30000);
});
test("composed accepted panels and explanation reserve incremental+final total", () => {
  let v = initial();
  for (let i = 0; i < 4; i++)
    v = mergePanel(v, {
      ...panel,
      id: "p" + i,
      resourceKey: "o" + i,
      payload: "x".repeat(2300),
    });
  v = mergeExplanation(v, { ...explain(v), text: "Em hỗ trợ anh/chị." });
  const bytes = (o: unknown) =>
    new TextEncoder().encode(JSON.stringify(o)).length;
  assert.ok(
    bytes(v) +
      v.panels.reduce((n, p) => n + bytes({ type: "panel", panel: p }), 0) +
      2000 <=
      30000,
  );
});

test("accepted panel snapshots isolate external mutation", () => {
  const p = { ...panel, payload: { stage: "packing" } };
  const v = mergePanel(initial(), p);
  p.payload.stage = "delivered";
  assert.deepEqual(v.panels[0].payload, { stage: "packing" });
});

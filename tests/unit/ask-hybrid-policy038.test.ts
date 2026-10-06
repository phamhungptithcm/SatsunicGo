import { test } from "vitest";
import assert from "node:assert/strict";
import {
  routeAsk,
  reserveEnvelope,
  canAdmit,
} from "../../packages/domain/ask-hybrid-policy";
import type { HybridFacts } from "../../packages/domain/ask-hybrid-policy";
const base: HybridFacts = {
  scope: "business",
  authority: "needs-explanation",
  criticalAction: false,
  access: "allowed",
  pilotEligible: true,
  aiEnabled: true,
  evidenceCurrent: true,
  budgetAvailable: true,
  hasImage: false,
};
test("complete authoritative answers skip model even for a pilot", () =>
  assert.equal(routeAsk({ ...base, authority: "complete" }).path, "existing"));
test("financial and confirmation actions stay in existing workflow", () =>
  assert.equal(routeAsk({ ...base, criticalAction: true }).path, "existing"));
test("denied private access never reaches AI", () =>
  assert.equal(routeAsk({ ...base, access: "denied" }).path, "existing"));
test("outside business stays bounded; no model classifier required", () =>
  assert.equal(routeAsk({ ...base, scope: "outside" }).path, "boundary"));
test("ambiguous intent and missing data require clarification", () => {
  assert.equal(routeAsk({ ...base, scope: "unclear" }).path, "clarify");
  assert.equal(
    routeAsk({ ...base, authority: "needs-details" }).path,
    "clarify",
  );
});
test("tool outages do not become model guesses", () =>
  assert.equal(
    routeAsk({ ...base, authority: "unavailable" }).path,
    "support",
  ));
test("nonpilot, disabled and exhausted budget retain existing path", () => {
  for (const k of ["pilotEligible", "aiEnabled", "budgetAvailable"])
    assert.equal(routeAsk({ ...base, [k]: false }).path, "existing");
});
test("old or unpublished evidence denies model route", () =>
  assert.equal(routeAsk({ ...base, evidenceCurrent: false }).path, "support"));
test("grounded complex business explanation can use AI", () =>
  assert.deepEqual(routeAsk(base), {
    path: "ai",
    reason: "explanation-needed",
  }));
test("image is not a bypass for scope or entitlement", () => {
  assert.equal(
    routeAsk({ ...base, hasImage: true, pilotEligible: false }).path,
    "existing",
  );
  assert.equal(
    routeAsk({ ...base, hasImage: true, scope: "outside" }).path,
    "boundary",
  );
});
test("full four-call envelope with new pricing is 12800 microUSD", () =>
  assert.equal(
    reserveEnvelope({
      model: "gemini-3.1-flash-lite",
      location: "global",
      inputTokens: 8000,
      outputTokens: 800,
      calls: 4,
    }),
    12800,
  ));
test("one call rounds upward; rejects invalid limits and unapproved model/location", () => {
  assert.equal(
    reserveEnvelope({
      model: "gemini-3.1-flash-lite",
      location: "global",
      inputTokens: 1,
      outputTokens: 1,
      calls: 1,
    }),
    2,
  );
  for (const p of [
    { calls: 5 },
    { inputTokens: 8001 },
    { outputTokens: 801 },
    { model: "gemini-2.5-flash-lite" },
    { location: "asia-southeast1" },
    { calls: NaN },
  ])
    assert.throws(() =>
      reserveEnvelope({
        model: "gemini-3.1-flash-lite",
        location: "global",
        inputTokens: 1000,
        outputTokens: 800,
        calls: 1,
        ...p,
      }),
    );
});
test("exact budget and expiration fail closed", () => {
  const p = {
    remainingMicroUsd: 3200,
    reservationMicroUsd: 3200,
    expiresAt: 10,
    now: 9,
  };
  assert.equal(canAdmit(p), true);
  assert.equal(canAdmit({ ...p, now: 10 }), false);
  assert.equal(canAdmit({ ...p, remainingMicroUsd: 3199 }), false);
  assert.equal(canAdmit({ ...p, reservationMicroUsd: 0 }), false);
});

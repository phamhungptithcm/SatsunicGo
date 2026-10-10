import { expect, test } from "vitest";
import {
  askCostPolicy,
  askPriceReady,
  askWorstCaseVnd,
  admitSharedAskReservation,
} from "../../functions/src/ai/ask-cost-policy";
import { pilotLimits } from "../../functions/src/ai/ask-pilot";
import { researchGeminiLimits } from "../../functions/src/ai/research-gemini";

const now = askCostPolicy.verifiedAt + 1000;
test("reviewed standard rates reserve text and the full grounded context plus paid search", () => {
  expect(askWorstCaseVnd(10000, 800, false)).toBe(132);
  expect(askWorstCaseVnd(1048576, 800, true)).toBe(14018);
  expect(pilotLimits.reserveVnd).toBeGreaterThanOrEqual(132);
  expect(researchGeminiLimits.reserveVnd).toBeGreaterThanOrEqual(14018);
  expect(askCostPolicy.groundedPromptUsd).toBe(0.035);
  expect(pilotLimits.model).toBe(askCostPolicy.model);
  expect(researchGeminiLimits.model).toBe(askCostPolicy.model);
  expect(askCostPolicy.expiresAt).toBeLessThan(askCostPolicy.modelRetiresAt);
});
test("short price policy expires before model retirement; invalid clocks and envelopes fail closed", () => {
  expect(askPriceReady(now)).toBe(true);
  for (const time of [
    0,
    NaN,
    Infinity,
    1.5,
    askCostPolicy.expiresAt,
    askCostPolicy.modelRetiresAt,
  ])
    expect(askPriceReady(time)).toBe(false);
  for (const [input, output] of [
    [-1, 1],
    [1048577, 1],
    [1, 801],
    [NaN, 1],
    [1, 1.5],
  ])
    expect(() => askWorstCaseVnd(input, output, true)).toThrow();
});
test("mixed pilot and research counters share the unchanged50000 allocation", () => {
  expect(() =>
    admitSharedAskReservation(
      { reservedVnd: 10000 },
      { reservedVnd: 25000 },
      1000,
      now,
    ),
  ).not.toThrow();
  expect(() =>
    admitSharedAskReservation(
      { reservedVnd: 1000 },
      { reservedVnd: 25000 },
      25000,
      now,
    ),
  ).toThrow();
  expect(() =>
    admitSharedAskReservation(
      { reservedVnd: 10000 },
      { reservedVnd: 40000 },
      1000,
      now,
    ),
  ).toThrow();
  for (const ledger of [
    undefined,
    {},
    { reservedVnd: -1 },
    { reservedVnd: "0" },
    { reservedVnd: 0.5 },
    { reservedVnd: 50001 },
  ])
    for (const side of ["pilot", "research"])
      expect(() =>
        admitSharedAskReservation(
          side === "pilot" ? ledger : { reservedVnd: 0 },
          side === "research" ? ledger : { reservedVnd: 0 },
          1000,
          now,
        ),
      ).toThrow();
});
test("serialized final mixed reservations admit only available money, never release unknown outcomes", async () => {
  let pilot = 0,
    research = 25000,
    admitted = 0;
  let serial = Promise.resolve();
  const reserve = (kind: "pilot" | "research") => {
    const amount = kind === "pilot" ? 1000 : 25000;
    const result = serial.then(() => {
      admitSharedAskReservation(
        { reservedVnd: pilot },
        { reservedVnd: research },
        amount,
        now,
      );
      if (kind === "pilot") pilot += amount;
      else research += amount;
      admitted++;
      // A transport failure after this transaction intentionally does not refund.
    });
    serial = result.catch(() => {});
    return result;
  };
  await Promise.allSettled([
    reserve("research"),
    reserve("pilot"),
    reserve("research"),
  ]);
  expect(admitted).toBe(1);
  expect(pilot + research).toBe(50000);
  expect(() =>
    admitSharedAskReservation(
      { reservedVnd: pilot },
      { reservedVnd: research },
      1000,
      now,
    ),
  ).toThrow();
});

/** Reviewed standard Vertex rates, not Priority. Sources are immutable release
 * evidence in PRODUCTION-TEST-20261010/PROVIDER-RESEARCH.json. This is a cost
 * ceiling at100000VND/USD, not a billing statement or a foreign-exchange quote.
 * A pricing refresh never substitutes a model or bypasses countTokens readiness.
 */
export const askCostPolicy = {
  id: "vertex-flash-lite-standard-20261010-v1",
  model: "gemini-2.5-flash-lite",
  verifiedAt: Date.parse("2026-10-10T00:38:16Z"),
  expiresAt: Date.parse("2026-10-12T00:00:00Z"),
  modelRetiresAt: Date.parse("2026-10-20T00:00:00Z"),
  inputUsdPerMillion: 0.1,
  outputUsdPerMillion: 0.4,
  groundedPromptUsd: 0.035,
  vndPerUsdCeiling: 100000,
  maxAllocationVnd: 50000,
} as const;

export function askPriceReady(now: number) {
  return (
    Number.isSafeInteger(now) &&
    now > 0 &&
    now < askCostPolicy.expiresAt &&
    now < askCostPolicy.modelRetiresAt
  );
}

/** Grounding is priced as paid even when a shared free allowance might exist.
 * Billed grounded input includes retrieved context, not only client countTokens.
 */
export function askWorstCaseVnd(
  billedInputTokens: number,
  outputTokens: number,
  grounded: boolean,
) {
  if (
    !Number.isSafeInteger(billedInputTokens) ||
    billedInputTokens < 0 ||
    billedInputTokens > 1048576 ||
    !Number.isSafeInteger(outputTokens) ||
    outputTokens < 0 ||
    outputTokens > 800
  )
    throw Error("ASK_COST_ENVELOPE_INVALID");
  return Math.ceil(
    ((billedInputTokens * askCostPolicy.inputUsdPerMillion) / 1000000 +
      (outputTokens * askCostPolicy.outputUsdPerMillion) / 1000000 +
      (grounded ? askCostPolicy.groundedPromptUsd : 0)) *
      askCostPolicy.vndPerUsdCeiling,
  );
}

export function reservedCounter(ledger: unknown): number {
  if (!ledger || typeof ledger !== "object")
    throw Error("ASK_SHARED_BUDGET_UNAVAILABLE");
  const value = (ledger as Record<string, unknown>).reservedVnd;
  if (
    !Number.isSafeInteger(value) ||
    Number(value) < 0 ||
    Number(value) > askCostPolicy.maxAllocationVnd
  )
    throw Error("ASK_SHARED_BUDGET_UNAVAILABLE");
  return Number(value);
}

/** Both callers read both counters in the same Firestore transaction. Neither
 * initializes a missing production ledger nor refunds a failed/unknown dispatch.
 */
export function admitSharedAskReservation(
  pilotLedger: unknown,
  researchLedger: unknown,
  reserveVnd: number,
  now: number,
) {
  if (
    !askPriceReady(now) ||
    !Number.isSafeInteger(reserveVnd) ||
    reserveVnd <= 0 ||
    reservedCounter(pilotLedger) +
      reservedCounter(researchLedger) +
      reserveVnd >
      askCostPolicy.maxAllocationVnd
  )
    throw Error("ASK_SHARED_BUDGET_UNAVAILABLE");
}

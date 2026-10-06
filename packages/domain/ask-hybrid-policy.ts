/** Server-only policy candidate. Facts must come from validated tools/current
 * publication and authenticated entitlement; never spread a request body here. */
export type HybridFacts = {
  scope: "business" | "outside" | "unclear";
  authority: "complete" | "needs-explanation" | "needs-details" | "unavailable";
  criticalAction: boolean;
  access: "allowed" | "denied";
  pilotEligible: boolean;
  aiEnabled: boolean;
  evidenceCurrent: boolean;
  budgetAvailable: boolean;
  hasImage: boolean;
};
export type HybridDecision = {
  path: "existing" | "clarify" | "support" | "boundary" | "ai";
  reason: string;
};
export function routeAsk(f: HybridFacts): HybridDecision {
  if (f.access !== "allowed")
    return { path: "existing", reason: "access-denied" };
  // Never ask a model to execute or replace financial/confirmation workflows.
  if (f.criticalAction)
    return { path: "existing", reason: "explicit-workflow" };
  if (f.scope === "outside")
    return { path: "boundary", reason: "outside-business" };
  if (f.scope !== "business")
    return { path: "clarify", reason: "intent-unclear" };
  if (f.authority === "complete")
    return { path: "existing", reason: "answer-complete" };
  if (f.authority === "needs-details")
    return { path: "clarify", reason: "details-required" };
  if (f.authority === "unavailable")
    return { path: "support", reason: "authority-unavailable" };
  if (!f.pilotEligible || !f.aiEnabled)
    return { path: "existing", reason: "pilot-unavailable" };
  if (!f.evidenceCurrent)
    return { path: "support", reason: "evidence-not-current" };
  if (!f.budgetAvailable)
    return { path: "existing", reason: "budget-unavailable" };
  return {
    path: "ai",
    reason: f.hasImage ? "business-image" : "explanation-needed",
  };
}
const MODEL = "gemini-3.1-flash-lite";
const integer = (n: number) => Number.isSafeInteger(n) && n >= 0;
/** Standard/global: $0.25/M input, $1.50/M output (incl reasoning).
 * Return integer USD micro-units, rounding UP. Count complete request, not just question.
 * This is not an atomic spend limiter; reserve in Firestore before provider calls. */
export function reserveEnvelope(p: {
  model: string;
  location: string;
  inputTokens: number;
  outputTokens: number;
  calls: number;
}): number {
  if (p.model !== MODEL || p.location !== "global")
    throw Error("UNAPPROVED_PRICING");
  if (
    !integer(p.inputTokens) ||
    p.inputTokens > 8000 ||
    !integer(p.outputTokens) ||
    p.outputTokens < 1 ||
    p.outputTokens > 800 ||
    !integer(p.calls) ||
    p.calls < 1 ||
    p.calls > 4
  )
    throw Error("INVALID_ENVELOPE");
  return Math.ceil(p.inputTokens * 0.25 + p.outputTokens * 1.5) * p.calls;
}
export function canAdmit(p: {
  remainingMicroUsd: number;
  reservationMicroUsd: number;
  expiresAt: number;
  now: number;
}): boolean {
  return (
    integer(p.remainingMicroUsd) &&
    integer(p.reservationMicroUsd) &&
    p.reservationMicroUsd > 0 &&
    integer(p.expiresAt) &&
    integer(p.now) &&
    p.now < p.expiresAt &&
    p.reservationMicroUsd <= p.remainingMicroUsd
  );
}

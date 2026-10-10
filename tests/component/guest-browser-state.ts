// Synthetic SDK/auth only. Never imported by the application entry point.
export const auth = { currentUser: null as { uid: string } | null };
const listeners = new Set<(user: { uid: string } | null) => void>();
export const evidence = {
  calls: 0,
  forbiddenSinks: 0,
  scenario: "success",
  authTransitions: 0,
};
const commerce = {
  user: null as { uid: string } | null,
  conversationId: null as string | null,
  restorationReady: true,
  busy: false,
  pendingOperation: null,
  draft: {},
  order: null,
  conversation: null,
  error: null,
  resolved: forbidden,
};
function forbidden() {
  evidence.forbiddenSinks++;
  throw Error("Unexpected private sink");
}
export function trackAsk() {
  if (evidence.scenario !== "owner") forbidden();
}
export const askService = forbidden;
export function onAuthStateChanged(
  _: unknown,
  listener: (user: { uid: string } | null) => void,
) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function change(uid: string | null) {
  auth.currentUser = uid ? { uid } : null;
  commerce.user = auth.currentUser;
  commerce.conversationId = uid ? `synthetic-${uid}` : null;
  evidence.authTransitions++;
  for (const listener of listeners) listener(auth.currentUser);
}
export const useAskCommerce = () => commerce;
export const useActionPreview = () => ({
  commerce,
  invalidate() {},
  preview: null,
  hideReview() {},
});
export const useAskImages = () => ({
  photos: [],
  working: false,
  error: null,
  prepare: () => {
    if (evidence.scenario !== "owner") forbidden();
    return [];
  },
  add() {},
  remove() {},
  markSent() {},
});
export async function callService(
  name: string,
  args: { code?: string; orderId?: string },
) {
  if (
    evidence.scenario === "owner" &&
    auth.currentUser?.uid === "synthetic-owner" &&
    name === "customerOrderTracking" &&
    args.orderId === "SG-261009-024"
  ) {
    evidence.calls++;
    return {
      orderId: args.orderId,
      stage: "IN_TRANSIT",
      purchaseKind: "custom",
      upfrontPayment: true,
      version: 1,
      observedAt: Date.now(),
      onHold: false,
      timelinePartial: false,
      shipmentsPartial: false,
      shipments: [],
      estimate: null,
      timeline: [
        "verifyTransfer",
        "recordPurchase",
        "pack",
        "finalize",
        "dispatch",
      ].map((action, i) => ({
        action,
        createdAt: Date.now() - (5 - i) * 86400000,
      })),
    };
  }
  if (name !== "publicOrderTracking" || Object.keys(args).join() !== "code")
    return forbidden();
  evidence.calls++;
  const now = Date.now(),
    dto = {
      publicStatus: "shipping",
      updatedAt: now - 1000,
      observedAt: now,
      eta: {
        source: "staff",
        startAt: now + 86400000,
        endAt: now + 172800000,
        recordedAt: now - 1000,
      },
    };
  if (evidence.scenario === "offline")
    throw Object.assign(Error("PRIVATE_CANARY"), {
      code: "functions/unavailable",
    });
  if (evidence.scenario === "null-error") throw null;
  if (evidence.scenario === "tampered")
    return { ...dto, address: "PRIVATE_CANARY" };
  if (evidence.scenario === "timeout") return new Promise(() => {});
  if (evidence.scenario === "auth-ABA") {
    setTimeout(() => change("A"), 100);
    setTimeout(() => change("B"), 200);
    setTimeout(() => change("A"), 300);
  }
  await new Promise((resolve) =>
    setTimeout(resolve, evidence.scenario === "success" ? 100 : 1200),
  );
  return dto;
}

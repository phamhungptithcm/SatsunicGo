import { describe, expect, it } from "vitest";
import {
  createRetryIdentity,
  createRequestSequence,
  scheduledInput,
  scheduledTimestamp,
} from "../../src/features/content/editor-state";
import { notificationTarget } from "../../src/features/content/notification-target";
describe("CMS retry and schedule safety", () => {
  it("reuses exact failed payload and isolates edited payloads after response loss", () => {
    let n = 0;
    const key = createRetryIdentity(() => `operation-${++n}`);
    const payload = {
      title: "First draft",
      status: "scheduled",
      publishAt: 100,
    };
    expect(key.forPayload(payload)).toBe(key.forPayload({ ...payload }));
    expect(key.forPayload({ ...payload, title: "Edited draft" })).toBe(
      "operation-2",
    );
    key.clear();
    expect(key.forPayload(payload)).toBe("operation-3");
  });
  it("preserves saved seconds for an unchanged local schedule, supports edits and explicit clearing", () => {
    const timestamp = new Date(2026, 9, 4, 10, 30, 24).getTime();
    expect(scheduledTimestamp(scheduledInput(timestamp), timestamp)).toBe(
      timestamp,
    );
    expect(scheduledTimestamp("", timestamp)).toBeUndefined();
    expect(
      scheduledTimestamp(scheduledInput(timestamp + 120000), timestamp),
    ).toBe(new Date(2026, 9, 4, 10, 32).getTime());
  });
  it("rejects old completions after content kind/account switch or unmount", () => {
    const gate = createRequestSequence();
    const old = gate.next();
    gate.next();
    expect(gate.current(old)).toBe(false);
    const current = gate.next();
    expect(gate.current(current)).toBe(true);
    gate.invalidate();
    expect(gate.current(current)).toBe(false);
  });
  it("routes membership and unknown events without inventing an order link", () => {
    expect(notificationTarget("membershipActivated").path).toBe("/membership");
    expect(notificationTarget("membershipExpired").path).toBe("/membership");
    expect(notificationTarget("membershipExpiring").path).toBe("/membership");
    expect(notificationTarget("replyTicket").path).toBe("/support");
    expect(notificationTarget("unknown").path).toBe("/account");
    expect(notificationTarget("track", "bad/id").path).toBe("/account");
    expect(notificationTarget("track", "order-123").path).toBe(
      "/account/orders/order-123",
    );
  });
});

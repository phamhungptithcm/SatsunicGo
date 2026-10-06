import { describe, expect, it } from "vitest";
import {
  customerTagInputLimit,
  customerDraftNeedsReview,
} from "../../src/features/crm/Customer";
import { customerNotesSchema } from "../../packages/domain/crm";
import { assigneeDisplay } from "../../src/features/crm/Customers";

describe("authorized assignee identity presentation", () => {
  const staff = [{ id: "staff-a", displayName: "  Lan  " }];
  it("shows only the exact authorized roster match", () => {
    expect(assigneeDisplay("staff-a", staff)).toBe("Lan");
    expect(assigneeDisplay("staff-a-extra", staff)).toBe("staff-a-extra");
  });
  it("preserves the complete identity when the roster is unavailable", () => {
    expect(assigneeDisplay("full-unloaded-staff-id", [])).toBe(
      "full-unloaded-staff-id",
    );
  });
  it("distinguishes no assignment from an unnamed assigned person", () => {
    expect(assigneeDisplay("", staff)).toBe("Chưa phân công");
    expect(
      assigneeDisplay("staff-a", [{ id: "staff-a", displayName: " " }]),
    ).toBe("staff-a");
  });
});

describe("customer tags valid-domain input boundary", () => {
  it("allows every character of the maximum valid comma-space representation", () => {
    const tags = Array.from(
      { length: 15 },
      (_, index) => String(index).padStart(2, "0") + "a".repeat(38),
    );
    expect(customerNotesSchema.shape.tags.parse(tags)).toEqual(tags);
    expect(tags.join(", ").length).toBe(628);
    expect(tags.join(", ").length).toBeLessThanOrEqual(customerTagInputLimit);
    expect(() =>
      customerNotesSchema.shape.tags.parse([...tags, "extra"]),
    ).toThrow();
  });
});

describe("customer draft version authority", () => {
  it("requires explicit reconciliation for changed, created or removed care versions", () => {
    expect(customerDraftNeedsReview({ baseVersion: 3 }, 4)).toBe(true);
    expect(customerDraftNeedsReview({ baseVersion: undefined }, 1)).toBe(true);
    expect(customerDraftNeedsReview({ baseVersion: 3 }, undefined)).toBe(true);
    expect(customerDraftNeedsReview({ baseVersion: 3 }, 3)).toBe(false);
    expect(customerDraftNeedsReview(null, 4)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { validAccess } from "../../src/features/settings/StaffAccess";

describe("staff access read authority before editing", () => {
  it("distinguishes a verified absent record from an unavailable response", () => {
    expect(validAccess(null)).toBe(true);
    expect(validAccess(undefined)).toBe(false);
    expect(validAccess({})).toBe(false);
  });
  it("preserves server roles, assignment IDs and version without guessing defaults", () => {
    expect(
      validAccess({
        version: 8,
        roles: ["BUYER"],
        orderIds: ["full-order-id"],
        active: true,
        locked: false,
      }),
    ).toBe(true);
    expect(validAccess({ roles: [], orderIds: [] })).toBe(true);
  });
  it("rejects invalid version and boolean authority fields", () => {
    for (const version of [-1, 1.5, Number.MAX_SAFE_INTEGER, "8"]) {
      expect(validAccess({ version, roles: [], orderIds: [] })).toBe(false);
    }
    expect(validAccess({ roles: [], orderIds: [], active: "true" })).toBe(
      false,
    );
    expect(validAccess({ roles: [], orderIds: [], locked: 0 })).toBe(false);
  });
  it("rejects malformed role and assignment collections", () => {
    expect(validAccess({ roles: "OWNER", orderIds: [] })).toBe(false);
    expect(validAccess({ roles: [1], orderIds: [] })).toBe(false);
    expect(validAccess({ roles: [], orderIds: [null] })).toBe(false);
  });
});

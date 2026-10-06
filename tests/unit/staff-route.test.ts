import { expect, it } from "vitest";
import {
  isCrmPath,
  legacyStaffTarget,
} from "../../packages/domain/staff-route";
it("keeps old staff resource filters, escaped identifiers and anchors", () => {
  expect(
    legacyStaffTarget("/staff/orders/a%20b", "?order=a%2Fb", "#reply"),
  ).toBe("/crm/orders/a%20b?order=a%2Fb#reply");
  expect(isCrmPath("/crm/orders")).toBe(true);
  expect(isCrmPath("/staff")).toBe(true);
  expect(isCrmPath("/crmish")).toBe(false);
});

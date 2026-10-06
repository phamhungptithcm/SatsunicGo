import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Order } from "../../packages/domain";
vi.mock("../../src/shared/firebase", () => ({
  callService: vi.fn(),
  sendCommand: vi.fn(),
}));
import { ActionForm } from "../../src/features/operations/Workbench";
const order = {
  id: "fixture",
  market: "US",
  items: [{ name: "Fixture", quantity: 1 }],
  version: 1,
} as Order;
function render(roles: string[], catalog = false, busy = false) {
  return renderToStaticMarkup(
    createElement(ActionForm, {
      order: {
        ...order,
        ...(catalog ? { purchaseKind: "catalog" as const } : {}),
      },
      roles,
      busy,
      submit: async () => {},
    }),
  );
}
describe("Workbench operational action visibility", () => {
  it("never offers quote or final repricing for fixed-price catalog orders", () => {
    const html = render(["OWNER"], true);
    expect(html).not.toContain('value="issueQuote"');
    expect(html).not.toContain('value="finalize"');
    expect(html).toContain('value="recordPurchase"');
  });
  it("preserves custom quote actions for authorized buyers", () => {
    expect(render(["BUYER"])).toContain('value="issueQuote"');
  });
  it("does not offer an empty action form to support-only staff", () => {
    expect(render(["SUPPORT"])).toBe("");
  });
  it("freezes action selection and payload controls while pending", () => {
    expect(render(["OWNER"], false, true)).toContain('<fieldset disabled=""');
    expect(render(["WAREHOUSE"])).not.toContain('value="verifyTransfer"');
  });
});

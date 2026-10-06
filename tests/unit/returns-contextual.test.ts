import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("../../src/shared/firebase", () => ({ callService: vi.fn() }));
import {
  returnPayload,
  ReturnActionFields,
  ReturnQuantitySummary,
  type ReturnRow,
} from "../../src/features/operations/Returns";
const row: ReturnRow = {
  id: "return-fixture",
  orderId: "order-fixture",
  version: 3,
  state: "receiving",
  lines: [
    {
      line: 2,
      name: "Fixture",
      authorized: 2,
      received: 1,
      accepted: 0,
      damaged: 0,
    },
  ],
};
function form(action: string) {
  const f = new FormData();
  f.set("action", action);
  f.set("evidence", "Fixture evidence");
  f.set("line", "2");
  f.set("quantity", "1");
  f.set("condition", "damaged");
  return f;
}
describe("Contextual return decisions", () => {
  it("close excludes line, quantity and condition even when old controls exist", () => {
    expect(returnPayload(form("close"), row, true)).toEqual({
      id: row.id,
      expectedVersion: 3,
      action: "close",
      evidence: "Fixture evidence",
    });
  });
  it("receive preserves actual line identity without inspection condition", () => {
    expect(returnPayload(form("receive"), row, false)).toEqual({
      id: row.id,
      expectedVersion: 3,
      action: "receive",
      evidence: "Fixture evidence",
      line: 2,
      quantity: 1,
    });
  });
  it("inspection preserves result and optimistic version", () => {
    expect(returnPayload(form("inspect"), row, false)).toMatchObject({
      expectedVersion: 3,
      condition: "damaged",
      line: 2,
      quantity: 1,
    });
  });
  it("does not construct unauthorized close or unknown actions", () => {
    expect(() => returnPayload(form("close"), row, false)).toThrow();
    expect(() => returnPayload(form("refund"), row, true)).toThrow();
  });
  it("close has no unrelated required quantity controls", () => {
    expect(
      renderToStaticMarkup(
        createElement(ReturnActionFields, {
          action: "close",
          lines: row.lines,
        }),
      ),
    ).toBe("");
  });
  it("receive hides condition and inspect reveals it", () => {
    const render = (action: string) =>
      renderToStaticMarkup(
        createElement(ReturnActionFields, { action, lines: row.lines }),
      );
    expect(render("receive")).toContain('name="quantity"');
    expect(render("receive")).not.toContain('name="condition"');
    expect(render("inspect")).toContain('name="condition"');
  });
});

it("return progress counts damaged items as inspected without implying refund", () => {
  const html = renderToStaticMarkup(
    createElement(ReturnQuantitySummary, {
      lines: [
        {
          line: 0,
          name: "A",
          authorized: 3,
          received: 2,
          accepted: 1,
          damaged: 1,
        },
        {
          line: 1,
          name: "B",
          authorized: 2,
          received: 1,
          accepted: 0,
          damaged: 0,
        },
      ],
    }),
  );
  expect(html).toContain("3 / 5");
  expect(html).toContain("2 / 3");
  expect(html).not.toContain("hoàn tiền");
});

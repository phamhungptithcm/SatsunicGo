import { describe, expect, test } from "vitest";
import {
  admitAskCommands,
  askCommandPlanSchema,
} from "../../packages/domain/ask-command-plan";
import { askAnswerSchema } from "../../packages/domain/ask-stream";
const context = {
  visibleProductIds: ["shirt", "cream"],
  selected: { productId: "shirt", quantity: 2, variant: "Black / M" },
};
const catalog = [
  { id: "shirt", catalogOptions: ["Black / M", "White / L"] },
  { id: "cream", catalogOptions: [] },
];
const plan = (command: unknown) => ({ version: 1, commands: [command] });
describe("untrusted semantic proposal admission", () => {
  test.each([
    "open_cart",
    "checkout",
    "request_item",
    "profile",
    "membership",
    "shipping_quote",
    "review_order",
  ])("%s opens a canonical surface without a write command", (kind) => {
    expect(admitAskCommands(plan({ kind }), context, catalog).commands).toEqual(
      [{ kind }],
    );
  });
  test("structured search separates budget and preserves the real query", () => {
    expect(
      admitAskCommands(
        plan({
          kind: "search_catalog",
          query: "áo Uniqlo",
          maxPriceVnd: 500000,
        }),
        context,
        catalog,
      ).commands[0],
    ).toEqual({
      kind: "search_catalog",
      query: "áo Uniqlo",
      maxPriceVnd: 500000,
    });
  });
  test("selection binds known product and exact canonical variant", () => {
    expect(
      admitAskCommands(
        plan({
          kind: "select_product",
          productId: "shirt",
          quantity: 3,
          variant: "Black / M",
        }),
        context,
        catalog,
      ).commands,
    ).toHaveLength(1);
    expect(
      admitAskCommands(
        plan({ kind: "select_product", productId: "shirt" }),
        context,
        catalog,
      ).commands[0],
    ).not.toHaveProperty("quantity");
  });
  test.each([
    { kind: "select_product", productId: "secret" },
    { kind: "select_product", productId: "shirt", variant: "Red / M" },
    { kind: "select_product", productId: "shirt", quantity: 0 },
    { kind: "select_product", productId: "shirt", quantity: 1.5 },
    { kind: "select_product", productId: "shirt", quantity: 101 },
    { kind: "select_product", productId: "shirt", price: 1 },
    { kind: "checkout", approved: true },
    { kind: "refund", amount: 10 },
    { kind: "confirmReceipt" },
    { kind: "execute", code: "console.log(1)" },
    { kind: "track_order", orderId: "another-owner" },
    { kind: "search_catalog", query: "shirt", maxPriceVnd: -1 },
  ])("rejects malformed or unauthorized command %j", (command) => {
    expect(() =>
      admitAskCommands(plan(command), context, catalog, "my-order"),
    ).toThrow();
  });
  test("server catalogue membership alone cannot select a product absent from this client context", () => {
    expect(() =>
      admitAskCommands(
        plan({ kind: "select_product", productId: "cream" }),
        { visibleProductIds: [] },
        catalog,
      ),
    ).toThrow("SELECTION_CONTEXT_REQUIRED");
  });
  test("only current order may be resolved; unspecified order remains unresolved", () => {
    expect(
      admitAskCommands(
        plan({ kind: "track_order", orderId: "my-order" }),
        context,
        catalog,
        "my-order",
      ).commands,
    ).toHaveLength(1);
    expect(
      admitAskCommands(plan({ kind: "track_order" }), context, catalog)
        .commands[0],
    ).not.toHaveProperty("orderId");
  });
  test("ambiguity is an empty plan; mixed requests never silently drop one command", () => {
    expect(
      askCommandPlanSchema.parse({ version: 1, commands: [] }).commands,
    ).toEqual([]);
    expect(() =>
      askCommandPlanSchema.parse({
        version: 1,
        commands: [{ kind: "open_cart" }, { kind: "checkout" }],
      }),
    ).toThrow();
  });
  test("legacy response remains valid, unknown protocol version fails", () => {
    const answer = {
      language: "vi",
      title: "Tra cứu",
      paragraphs: ["Thông tin"],
      bullets: [],
      sourceIds: [],
      action: "workflow",
    };
    expect(askAnswerSchema.parse(answer)).not.toHaveProperty("commandPlan");
    expect(() =>
      askAnswerSchema.parse({
        ...answer,
        commandPlan: { version: 2, commands: [] },
      }),
    ).toThrow();
  });
});

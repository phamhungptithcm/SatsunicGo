import { describe, expect, test } from "vitest";
import {
  admitAskCommands,
  normalizeAskProviderQuantities,
  askCommandPlanSchema,
  askCommandResponseSchemaForSources,
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
describe("provider quantity normalization preserves the public total-only protocol", () => {
  test.each([
    ["increase", 1, 3],
    ["decrease", 1, 1],
    ["set", 4, 4],
  ])(
    "%s uses the current selection exactly once",
    (quantityMode, quantity, total) => {
      const value = {
        commandPlan: plan({
          kind: "select_product",
          productId: "shirt",
          quantityMode,
          quantity,
          variant: "Black / M",
        }),
      };
      const normalized = normalizeAskProviderQuantities(
        value,
        context,
      ) as typeof value;
      expect(normalized.commandPlan).toEqual(
        plan({
          kind: "select_product",
          productId: "shirt",
          quantity: total,
          variant: "Black / M",
        }),
      );
      expect(value.commandPlan.commands[0]).toHaveProperty("quantityMode");
      expect(normalizeAskProviderQuantities(normalized, context)).toEqual(
        normalized,
      );
      expect(
        askCommandPlanSchema.safeParse(normalized.commandPlan).success,
      ).toBe(true);
    },
  );
  test.each([
    { productId: "cream", quantityMode: "increase", quantity: 1 },
    { productId: "shirt", quantityMode: "increase" },
    { productId: "shirt", quantityMode: "decrease", quantity: 2 },
    { productId: "shirt", quantityMode: "increase", quantity: 100 },
    {
      productId: "shirt",
      quantityMode: "increase",
      quantity: 1,
      injected: true,
    },
  ])("rejects unsafe relative quantity %j", (fields) => {
    expect(() =>
      normalizeAskProviderQuantities(
        { commandPlan: plan({ kind: "select_product", ...fields }) },
        context,
      ),
    ).toThrow();
  });
});
test("provider citation schema cannot leak another request's evidence or cite catalog IDs", () => {
  const first = askCommandResponseSchemaForSources(["approved", "approved"]);
  const second = askCommandResponseSchemaForSources([]);
  const third = askCommandResponseSchemaForSources(["other-approved"]);
  expect(first.properties.sourceIds.items.enum).toEqual(["approved"]);
  expect(second.properties.sourceIds.maxItems).toBe(0);
  expect(second.properties.sourceIds.items).not.toHaveProperty("enum");
  expect(third.properties.sourceIds.items.enum).toEqual(["other-approved"]);
  expect(first.properties.sourceIds.items.enum).toEqual(["approved"]);
});
test("provider can select only current products and their exact variants", () => {
  const empty = askCommandResponseSchemaForSources([]);
  const bound = askCommandResponseSchemaForSources(
    [],
    [{ id: "shirt", catalogOptions: ["Black / M"] }],
    "owned-order",
  );
  const choices = bound.properties.commandPlan.properties.commands.items.anyOf;
  expect(
    JSON.stringify(empty.properties.commandPlan.properties.commands),
  ).not.toContain("select_product");
  expect(choices).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        properties: expect.objectContaining({
          productId: { type: "STRING", enum: ["shirt"] },
          variant: { type: "STRING", enum: ["Black / M"] },
        }),
      }),
      expect.objectContaining({
        properties: {
          kind: { type: "STRING", enum: ["track_order"] },
          orderId: { type: "STRING", enum: ["owned-order"] },
        },
      }),
    ]),
  );
  expect(
    JSON.stringify(
      askCommandResponseSchemaForSources([]).properties.commandPlan,
    ),
  ).not.toContain("owned-order");
});
describe("untrusted semantic proposal admission", () => {
  test("quantity guidance binds only the current product and request", () => {
    const bound = askCommandResponseSchemaForSources(
      [],
      catalog,
      undefined,
      context.selected,
    );
    const choices =
      bound.properties.commandPlan.properties.commands.items.anyOf;
    const selection = (productId: string) =>
      choices.find(
        (choice) =>
          "productId" in choice.properties &&
          choice.properties.productId &&
          "enum" in choice.properties.productId &&
          choice.properties.productId.enum[0] === productId,
      );
    expect(JSON.stringify(selection("shirt"))).toContain(
      "CURRENT selected total is 2",
    );
    expect(JSON.stringify(selection("cream"))).toContain(
      "no current selected quantity",
    );
    expect(
      JSON.stringify(askCommandResponseSchemaForSources([], catalog)),
    ).not.toContain("CURRENT selected total is 2");
  });
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

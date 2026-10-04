import { expect, test } from "vitest";
import { sourceLink } from "../../src/features/ask/knowledge";
test("AI citations resolve published post and product routes and reject injected paths", () => {
  expect(sourceLink("post:example").href).toBe("/posts/example");
  expect(sourceLink("product:example").href).toBe("/products/example");
  expect(sourceLink("product:../../account").href).toBe("/how-it-works");
});

import { it, expect } from "vitest";
import { selectedProducts } from "../../packages/domain/product-selection";
it("prioritizes selected products outside the legacy window and excludes deselected records", () => {
  const priority = [
    { id: "late-id", title: "Top", featured: true, featuredOrder: 1 },
    { id: "rank0", title: "First", featured: true, featuredOrder: 0 },
  ];
  const legacy = [
    { id: "off", title: "Hidden", featured: false },
    { id: "old", title: "Legacy" },
    priority[0],
  ];
  expect(selectedProducts(priority, legacy).map((x) => x.id)).toEqual([
    "rank0",
    "late-id",
    "old",
  ]);
  expect(selectedProducts(priority, legacy, 1).map((x) => x.id)).toEqual([
    "rank0",
  ]);
});

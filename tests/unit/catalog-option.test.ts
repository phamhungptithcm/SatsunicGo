import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CatalogOption } from "../../src/features/products/CatalogOption";
import { initialCatalogOption } from "../../src/features/products/catalog-option";

const render = (options: string[], value = "", disabled = false, vi = true) =>
  renderToStaticMarkup(
    createElement(CatalogOption, {
      options,
      value,
      disabled,
      vi,
      onChange: () => {},
    }),
  );

describe("catalog specifications and explicit choices", () => {
  it("defaults only an unambiguous fresh choice", () => {
    expect(initialCatalogOption([])).toBe("");
    expect(initialCatalogOption(["36 ml"])).toBe("36 ml");
    expect(initialCatalogOption(["36 ml", "60 ml"])).toBe("");
    expect(initialCatalogOption(["36 ml"], "old 12 ml")).toBe("old 12 ml");
  });
  it.each([
    "1 chai 36 ml; dùng ngoài da",
    "100 viên nang mềm; biotin 10000 mcg",
    "Cristal Clear 101; 5 ml",
  ])("shows the exact product specification: %s", (option) => {
    const html = render([option], option);
    expect(html).toContain(option);
    expect(html).toContain("Quy cách");
    expect(html).not.toContain("<select");
  });
  it("does not silently display a stale or empty choice as accepted", () => {
    for (const value of ["", "Old option"]) {
      const html = render(["New option"], value, true);
      expect(html).toContain("<select");
      expect(html).toContain("disabled");
      expect(html).toContain('value="" selected=""');
    }
  });
  it("retains explicit multiple-option selection and accessible native controls", () => {
    const html = render(["30 ml", "60 ml"], "60 ml");
    expect(html).toContain("<label>");
    expect(html).toContain("required");
    expect(html).toContain('value="60 ml" selected=""');
    expect(render(["30 ml", "60 ml"], "", false, false)).toContain(
      "Choose product option",
    );
  });
  it("does not invent a specification for a product without options", () => {
    expect(render([])).toBe("");
  });
});

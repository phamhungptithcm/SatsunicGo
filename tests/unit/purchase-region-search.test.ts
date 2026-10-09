import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { PurchaseRegionAutocomplete } from "../../src/features/cart/purchase-region-autocomplete";
import {
  filterRegionOptions,
  indexRegionOptions,
  normalizeRegionSearch,
  purchaseProvinceSelection,
  regionActiveIndex,
  type PurchaseProvince,
} from "../../src/features/cart/purchase-region-search";

const data = JSON.parse(
  readFileSync("functions/assets/purchase-vn-regions.json", "utf8"),
) as {
  provinces: PurchaseProvince[];
  source: string;
  asOf: string;
  sourceSha256: { provinces: string; communes: string };
};
const provinces = data.provinces;
const provinceIndex = indexRegionOptions(provinces);

describe("dated nationwide recipient directory", () => {
  it("contains every unique coded parent/child and has no empty province", () => {
    expect(provinces).toHaveLength(34);
    expect(new Set(provinces.map((p) => p.code)).size).toBe(34);
    const communes = provinces.flatMap((p) => p.communes);
    expect(communes).toHaveLength(3321);
    expect(new Set(communes.map((c) => c.code)).size).toBe(3321);
    for (const p of provinces) {
      expect(p.code).toMatch(/^\d{2}$/);
      expect(p.communes.length).toBeGreaterThan(0);
      for (const c of p.communes) expect(c.code).toMatch(/^\d{5}$/);
    }
  });
  it("binds the generated asset to dated official source responses", () => {
    expect(data.source).toBe("https://danhmuchanhchinh.nso.gov.vn/DMDVHC.asmx");
    expect(data.asOf).toBe("2026-10-09");
    for (const kind of ["provinces", "communes"] as const) {
      const raw = readFileSync(
        `docs/reviews/PAYMENT-UPFRONT-20261008/RECIPIENT-DIRECTORY-20261009/source/${kind}.xml`,
      );
      expect(createHash("sha256").update(raw).digest("hex")).toBe(
        data.sourceSha256[kind],
      );
    }
  });
  it("uses the current city and ward names rather than the old API labels", () => {
    expect(provinces.find((p) => p.code === "22")?.name).toBe(
      "Thành phố Quảng Ninh",
    );
    expect(provinces.find((p) => p.code === "24")?.name).toBe(
      "Thành phố Bắc Ninh",
    );
    const dongNai = provinces.find((p) => p.code === "75")!;
    expect(dongNai.name).toBe("Thành phố Đồng Nai");
    expect(dongNai.communes.find((c) => c.code === "26485")?.name).toBe(
      "Phường Nhơn Trạch",
    );
  });
  it.each(provinces.map((p) => [p.code, p] as const))(
    "makes every commune of province %s searchable by its exact code",
    (_code, province) => {
      const index = indexRegionOptions(province.communes);
      expect(filterRegionOptions(index, "")).toHaveLength(
        province.communes.length,
      );
      for (const commune of province.communes)
        expect(filterRegionOptions(index, commune.code)).toEqual([commune]);
    },
  );
});

describe("Vietnamese autocomplete search", () => {
  it.each([
    ["ha noi", "01"],
    ["HỒ CHÍ MINH", "79"],
    ["dak lak", "66"],
    ["ĐÀ NẴNG", "48"],
    ["thanh pho dong nai", "75"],
    ["01", "01"],
    ["  noi    ha ", "01"],
    ["HCM", "79"],
    ["TP.HCM", "79"],
    ["tphcm", "79"],
    ["hanoi", "01"],
  ])("finds %s without changing canonical labels", (query, code) => {
    expect(
      filterRegionOptions(provinceIndex, query).map((p) => p.code),
    ).toEqual([code]);
  });
  it("folds đ and combining marks, retains numeric leading zeroes", () => {
    expect(normalizeRegionSearch("ĐẮK LẮK · 01")).toBe("dak lak 01");
    expect(normalizeRegionSearch("ĐÀ NẴNG")).toBe("da nang");
  });
  it("distinguishes no results from unfiltered results", () => {
    expect(filterRegionOptions(provinceIndex, "khongco999")).toEqual([]);
    expect(filterRegionOptions([], "ha noi")).toEqual([]);
    expect(filterRegionOptions(provinceIndex, "  ")).toEqual(provinces);
  });
  it("searches a ward only inside its province, even when a name is duplicated", () => {
    const haNoi = provinces.find((p) => p.code === "01")!;
    const dongNai = provinces.find((p) => p.code === "75")!;
    expect(
      filterRegionOptions(indexRegionOptions(haNoi.communes), "26485"),
    ).toEqual([]);
    expect(
      filterRegionOptions(
        indexRegionOptions(dongNai.communes),
        "nhon trach",
      ).map((c) => c.code),
    ).toEqual(["26485"]);
    const duplicate = [
      { code: "00001", name: "Phường An Bình" },
      { code: "00002", name: "Phường An Bình" },
    ];
    expect(
      filterRegionOptions(indexRegionOptions(duplicate), "an binh"),
    ).toEqual(duplicate);
  });
  it("clears both child fields when a parent changes or search invalidates it", () => {
    const selected = purchaseProvinceSelection(provinces, "01");
    expect(selected).toEqual({
      provinceCode: "01",
      province: "Thành phố Hà Nội",
      communeCode: "",
      commune: "",
    });
    expect(purchaseProvinceSelection(provinces, "invalid")).toEqual({
      provinceCode: "",
      province: "",
      communeCode: "",
      commune: "",
    });
  });
  it("does not mutate reference options while searching", () => {
    const before = JSON.stringify(provinces);
    filterRegionOptions(provinceIndex, "ha noi");
    expect(JSON.stringify(provinces)).toBe(before);
  });
});

describe("autocomplete keyboard boundaries and render contract", () => {
  it.each([
    ["ArrowDown", -1, 3, 0],
    ["ArrowDown", 2, 3, 2],
    ["ArrowUp", -1, 3, 2],
    ["ArrowUp", 0, 3, 0],
    ["Home", 2, 3, 0],
    ["End", 0, 3, 2],
    ["ArrowDown", 0, 0, -1],
  ])(
    "navigates %s from %i in %i options to %i",
    (key, current, count, expected) => {
      expect(regionActiveIndex(key, current, count)).toBe(expected);
    },
  );
  const render = (value = "01", disabled = false) =>
    renderToStaticMarkup(
      createElement(PurchaseRegionAutocomplete, {
        id: "purchase-provinceCode",
        label: "Tỉnh / thành phố",
        name: "provinceCode",
        options: provinces,
        value,
        disabled,
        "aria-labelledby": "purchase-provinceCode-label",
        "aria-describedby": "purchase-provinceCode-error",
        "aria-invalid": true,
        placeholder: "Tìm tỉnh / thành phố",
        onSelect: () => {},
      }),
    );
  it("keeps the persistent label/error association, canonical value and collapsed ARIA state", () => {
    const html = render();
    expect(html).toContain('role="combobox"');
    expect(html).toContain(
      '<label for="purchase-provinceCode" id="purchase-provinceCode-label"',
    );
    expect(html).toContain(
      '<span class="requiredMark" aria-hidden="true">*</span>',
    );
    expect(html).toContain('required=""');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-labelledby="purchase-provinceCode-label"');
    expect(html).toContain('aria-describedby="purchase-provinceCode-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('value="Thành phố Hà Nội"');
    expect(html).not.toContain('role="listbox"');
    expect(html).not.toContain("aria-activedescendant=");
  });
  it("does not render an unknown saved code as an available region", () => {
    expect(render("99")).toContain('value=""');
    expect(render("", true)).toContain('disabled=""');
  });
  it("escapes remote directory text rather than rendering executable markup", () => {
    const html = renderToStaticMarkup(
      createElement(PurchaseRegionAutocomplete, {
        id: "region",
        label: "Tỉnh / thành phố",
        options: [{ code: "01", name: '<img src=x onerror="alert(1)">' }],
        value: "01",
        placeholder: "Tìm",
        onSelect: () => {},
      }),
    );
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});

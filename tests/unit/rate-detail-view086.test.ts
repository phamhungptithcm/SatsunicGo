import { describe, expect, it } from "vitest";
import {
  conditionGroup,
  filterConditions,
  filterRateRows,
  normalizeRateSearch,
} from "../../src/features/shipping/rate-detail-view";
import { vietCargoReferenceRates } from "../../packages/domain/shipping-rates";
describe("public shipping detail view", () => {
  it("matches Vietnamese without accents and all search tokens", () => {
    expect(normalizeRateSearch(" ĐIỀU KIỆN ")).toBe("dieu kien");
    expect(normalizeRateSearch("1,5 kg")).toBe(normalizeRateSearch("1.5 kg"));
    const rows = vietCargoReferenceRates.rows;
    const first = rows[0];
    expect(
      filterRateRows(rows, normalizeRateSearch(first.label), "all"),
    ).toContain(first);
    expect(filterRateRows(rows, "not-a-real-group", "all")).toEqual([]);
  });
  it("partitions confirmation and listed rates without treating zero as unknown", () => {
    const base = vietCargoReferenceRates.rows[0];
    const rows = [
      { ...base, amountMinor: 0 },
      { ...base, amountMinor: null },
      { ...base, pricing: "quote" as const },
    ];
    expect(filterRateRows(rows, "", "listed")).toEqual([rows[0]]);
    expect(filterRateRows(rows, "", "confirm")).toEqual(rows.slice(1));
    expect(filterRateRows(rows, "", "all")).toEqual(rows);
  });
  it("preserves all original condition text and order including ambiguous conditions", () => {
    const conditions = vietCargoReferenceRates.conditions;
    expect(filterConditions(conditions, "").map((item) => item.text)).toEqual(
      conditions,
    );
    expect(conditionGroup("Việt Nam → Mỹ: chưa gồm VAT")).toBe("VN_US");
    expect(conditionGroup("Mỹ → Việt Nam: tối thiểu 1 kg")).toBe("US_VN");
    expect(conditionGroup("Oregon: cần xác nhận")).toBe("general");
    expect(conditionGroup("Thông tin Việt Nam → Mỹ và Mỹ → Việt Nam")).toBe(
      "general",
    );
    expect(filterConditions(["Bảo hiểm 3% tùy chọn"], "bao hiem")[0].text).toBe(
      "Bảo hiểm 3% tùy chọn",
    );
  });
});

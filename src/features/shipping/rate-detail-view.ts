import type { ShippingRateRow } from "../../../packages/domain/shipping-rates";
export const normalizeRateSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/(\d),(?=\d)/g, "$1.")
    .toLowerCase()
    .trim();
export type PriceAvailability = "all" | "listed" | "confirm";
export function filterRateRows(
  rows: ShippingRateRow[],
  search: string,
  availability: PriceAvailability,
) {
  const terms = normalizeRateSearch(search).split(/\s+/).filter(Boolean);
  return rows.filter((row) => {
    const confirmation = row.pricing === "quote" || row.amountMinor === null;
    if (
      (availability === "listed" && confirmation) ||
      (availability === "confirm" && !confirmation)
    )
      return false;
    const text = normalizeRateSearch(
      `${row.label} ${row.priceDisplay} ${row.clearance}`,
    );
    return terms.every((term) => text.includes(term));
  });
}
export function conditionGroup(text: string): "general" | "VN_US" | "US_VN" {
  if (/^Việt Nam\s*→\s*Mỹ(?=\s|:|$)/u.test(text)) return "VN_US";
  if (/^Mỹ\s*→\s*Việt Nam(?=\s|:|$)/u.test(text)) return "US_VN";
  return "general";
}
export function filterConditions(conditions: string[], search: string) {
  const terms = normalizeRateSearch(search).split(/\s+/).filter(Boolean);
  return conditions
    .map((text, index) => ({ text, index, group: conditionGroup(text) }))
    .filter((item) =>
      terms.every((term) => normalizeRateSearch(item.text).includes(term)),
    );
}

export type PurchaseRegionOption = { code: string; name: string };
export type PurchaseProvince = PurchaseRegionOption & {
  communes: PurchaseRegionOption[];
};

export function normalizeRegionSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLocaleLowerCase("vi-VN")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function indexRegionOptions(options: readonly PurchaseRegionOption[]) {
  return options.map((option) => {
    const name = normalizeRegionSearch(option.name);
    const prefix = name.match(/^(thanh pho|tinh|phuong|xa|dac khu) /)?.[1];
    const short = prefix ? name.slice(prefix.length + 1) : name;
    const abbreviation = short
      .split(" ")
      .map((word) => word[0])
      .join("");
    const type =
      prefix
        ?.split(" ")
        .map((word) => word[0])
        .join("") ?? "";
    return {
      option,
      search: `${name} ${option.code} ${short.replace(/ /g, "")} ${abbreviation} ${type} ${type}${abbreviation}`,
    };
  });
}

export function filterRegionOptions(
  index: ReturnType<typeof indexRegionOptions>,
  query: string,
): PurchaseRegionOption[] {
  const terms = normalizeRegionSearch(query).split(" ").filter(Boolean);
  return index
    .filter(({ search }) => terms.every((term) => search.includes(term)))
    .map(({ option }) => option);
}

export function purchaseProvinceSelection(
  provinces: readonly PurchaseProvince[],
  code: string,
) {
  const province = provinces.find((item) => item.code === code);
  return {
    provinceCode: province?.code ?? "",
    province: province?.name ?? "",
    communeCode: "",
    commune: "",
  };
}

export function regionActiveIndex(key: string, current: number, count: number) {
  if (!count) return -1;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  if (key === "ArrowDown") return Math.min(current + 1, count - 1);
  if (key === "ArrowUp")
    return current < 0 ? count - 1 : Math.max(current - 1, 0);
  return current;
}

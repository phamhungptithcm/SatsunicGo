/** Priority query is authoritative across the catalog; legacy fallback is bounded. */
export function selectedProducts<
  T extends {
    id: string;
    featured?: boolean;
    featuredOrder?: number;
    title: string;
  },
>(selected: T[], legacy: T[], limit = 30): T[] {
  const priority = [...selected]
    .filter((row) => row.featured === true)
    .sort(
      (a, b) =>
        (a.featuredOrder ?? 9999) - (b.featuredOrder ?? 9999) ||
        a.title.localeCompare(b.title, "vi"),
    );
  const ids = new Set(priority.map((row) => row.id));
  return [
    ...priority,
    ...legacy.filter((row) => row.featured === undefined && !ids.has(row.id)),
  ].slice(0, limit);
}

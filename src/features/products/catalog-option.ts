/** Default a fresh choice only; never silently replace an obsolete selection. */
export function initialCatalogOption(
  options: readonly string[],
  selected = "",
) {
  return selected || (options.length === 1 ? options[0] : "");
}

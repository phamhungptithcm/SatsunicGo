/** Mermaid output is untrusted. Keep only an inert inline-vector subset inside img. */
export function sanitizeDiagramSvg(svg: string): string {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  if (
    doc.querySelector("parsererror") ||
    doc.documentElement.localName !== "svg"
  )
    throw Error("INVALID_DIAGRAM");
  const forbidden = new Set([
    "script",
    "foreignObject",
    "iframe",
    "object",
    "embed",
    "image",
    "audio",
    "video",
    "a",
    "use",
  ]);
  for (const element of Array.from(doc.querySelectorAll("*"))) {
    if (forbidden.has(element.localName)) {
      element.remove();
      continue;
    }
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase(),
        value = attribute.value;
      if (
        name.startsWith("on") ||
        name === "href" ||
        name === "xlink:href" ||
        /javascript:|data:|https?:|@import/i.test(value) ||
        /url\(\s*['"]?(?!#)/i.test(value)
      )
        element.removeAttribute(attribute.name);
    }
    if (
      element.localName === "style" &&
      /@import|https?:|javascript:|url\(\s*['"]?(?!#)/i.test(
        element.textContent ?? "",
      )
    )
      element.remove();
  }
  return new XMLSerializer().serializeToString(doc.documentElement);
}

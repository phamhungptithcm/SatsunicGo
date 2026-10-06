import type { RichNode } from "../../../../packages/domain/blog-studio";
export type ReadingHeading = { id: string; text: string; level: number };
function textOf(node: RichNode): string {
  return node.text ?? node.content?.map(textOf).join("") ?? "";
}
export function readingHeadings(body: RichNode): ReadingHeading[] {
  const headings: ReadingHeading[] = [];
  function visit(node: RichNode, key: string) {
    if (node.type === "heading") {
      const text = textOf(node).trim();
      if (text)
        headings.push({
          id: `section-${key}`,
          text,
          level: Number(node.attrs?.level ?? 2),
        });
    }
    node.content?.forEach((child, i) => visit(child, `${key}-${i}`));
  }
  visit(body, "0");
  return headings;
}
export function activeReadingSection(
  sections: { id: string; top: number }[],
  threshold = 120,
): string | null {
  let active: string | null = null;
  for (const section of sections) {
    if (section.top <= threshold) active = section.id;
    else break;
  }
  return active;
}

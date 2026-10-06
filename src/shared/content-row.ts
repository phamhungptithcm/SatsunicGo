import {
  bodyText,
  validateBody,
  type RichNode,
} from "../../packages/domain/blog-studio";
import type { ContentRow } from "./public-content";
export function contentRow(
  data: Record<string, unknown>,
  id: string,
): ContentRow {
  if (typeof data.body === "string") return { ...data, id } as ContentRow;
  try {
    const richBody = validateBody(data.body);
    return {
      ...data,
      id,
      body: bodyText(richBody),
      richBody,
      version: Number(data.revision ?? data.version ?? 1),
    } as ContentRow;
  } catch {
    return { ...data, id, body: "", richBody: undefined } as ContentRow;
  }
}
export type { RichNode };

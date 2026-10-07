import { z } from "zod";
import { imageDimension } from "./editor-image";

export class BlogError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
export const idSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,200}$/);
export const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export function safeUrl(value: string) {
  try {
    const u = new URL(value);
    return (
      ["https:", "http:"].includes(u.protocol) && !u.username && !u.password
    );
  } catch {
    return false;
  }
}
export type RichNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: RichNode[];
};
const types = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
  "hardBreak",
  "horizontalRule",
  "image",
  "table",
  "tableRow",
  "tableCell",
  "tableHeader",
]);
export function validateBody(input: unknown): RichNode {
  let count = 0;
  function visit(n: unknown, depth: number): RichNode {
    if (!n || typeof n !== "object" || depth > 12 || ++count > 10000)
      throw new BlogError(400, "INVALID_BODY");
    const node = n as RichNode;
    if (
      (node.content !== undefined && !Array.isArray(node.content)) ||
      (node.marks !== undefined && !Array.isArray(node.marks)) ||
      (node.attrs !== undefined &&
        (!node.attrs ||
          typeof node.attrs !== "object" ||
          Array.isArray(node.attrs)))
    )
      throw new BlogError(400, "INVALID_BODY");
    if (
      !types.has(node.type) ||
      (node.text !== undefined && typeof node.text !== "string")
    )
      throw new BlogError(400, "INVALID_BODY");
    const attrs: Record<string, unknown> = {};
    if (node.type === "heading")
      attrs.level = [2, 3, 4].includes(Number(node.attrs?.level))
        ? Number(node.attrs?.level)
        : 2;
    if (node.type === "codeBlock")
      attrs.language =
        typeof node.attrs?.language === "string"
          ? node.attrs.language.slice(0, 30)
          : "";
    if (node.type === "tableCell" || node.type === "tableHeader") {
      for (const key of ["colspan", "rowspan"]) {
        const span = node.attrs?.[key] ?? 1;
        if (!Number.isInteger(span) || Number(span) < 1 || Number(span) > 30) throw new BlogError(400, "INVALID_BODY");
        attrs[key] = span;
      }
    }
    if (node.type === "table" && (!node.content?.length || node.content.length > 100 || node.content.some(c => c.type !== "tableRow"))) throw new BlogError(400, "INVALID_BODY");
    if (node.type === "tableRow" && (!node.content?.length || node.content.length > 30 || node.content.some(c => !["tableCell", "tableHeader"].includes(c.type)))) throw new BlogError(400, "INVALID_BODY");
    if (node.type === "image") {
      if (
        typeof node.attrs?.src !== "string" ||
        !/^\/api\/blog\/media\/[a-zA-Z0-9_-]+$/.test(node.attrs.src)
      )
        throw new BlogError(400, "INVALID_IMAGE");
      attrs.src = node.attrs.src;
      attrs.alt = String(node.attrs.alt ?? "").slice(0, 300);
      attrs.title = String(node.attrs.title ?? "").slice(0, 300);
      for (const key of ["width", "height"]) {
        if (node.attrs[key] === undefined || node.attrs[key] === null) continue;
        const dimension = imageDimension(node.attrs[key]);
        if (dimension === null) throw new BlogError(400, "INVALID_IMAGE_SIZE");
        attrs[key] = dimension;
      }
    }
    const marks = (node.marks ?? []).map((m) => {
      if (!m || typeof m !== "object") throw new BlogError(400, "INVALID_MARK");
      if (
        !["bold", "italic", "strike", "code", "underline", "link"].includes(
          m.type,
        )
      )
        throw new BlogError(400, "INVALID_MARK");
      if (m.type === "link") {
        const href = String(m.attrs?.href ?? "");
        if (!safeUrl(href)) throw new BlogError(400, "INVALID_LINK");
        return { type: m.type, attrs: { href } };
      }
      return { type: m.type };
    });
    return {
      type: node.type,
      ...(node.text !== undefined ? { text: node.text } : {}),
      ...(Object.keys(attrs).length ? { attrs } : {}),
      ...(marks.length ? { marks } : {}),
      ...(node.content
        ? { content: node.content.map((c) => visit(c, depth + 1)) }
        : {}),
    };
  }
  const result = visit(input, 0);
  if (result.type !== "doc" || JSON.stringify(result).length > 200000)
    throw new BlogError(400, "INVALID_BODY");
  return result;
}
export function bodyText(node: RichNode): string {
  return [node.text ?? "", ...(node.content ?? []).map(bodyText)]
    .join(" ")
    .trim();
}
export function mediaIds(node: RichNode): string[] {
  return [
    ...new Set([
      ...(node.type === "image"
        ? [String(node.attrs?.src).split("/").pop()!]
        : []),
      ...(node.content ?? []).flatMap(mediaIds),
    ]),
  ];
}
export const draftSchema = z.object({
  title: z.string().trim().max(180),
  slug: z.union([slugSchema, z.literal("")]),
  summary: z.string().trim().max(500),
  answer: z.string().trim().max(1200).default(""),
  authorId: z.string().max(128),
  assignee: z.string().max(128).default(""),
  category: z.string().max(80),
  tags: z.array(z.string().trim().min(1).max(40)).max(10),
  language: z.enum(["vi", "en"]),
  coverId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]*$/)
    .max(128)
    .default(""),
  commentsEnabled: z.boolean(),
  seoTitle: z.string().max(180).default(""),
  seoDescription: z.string().max(500).default(""),
  sources: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
        url: z.string().max(2000).refine(safeUrl),
      }),
    )
    .max(30),
  body: z.unknown().transform(validateBody),
});
export type Draft = z.infer<typeof draftSchema>;
export type Role = "author" | "publisher" | "admin";
export type Actor = {
  email?: string;
  uid: string;
  verified: boolean;
  name: string;
  role?: Role;
  avatar?: string;
};
export type Post = Draft & {
  id: string;
  owner: string;
  revision: number;
  state: "draft" | "review" | "published" | "archived";
  publishedAt?: string;
  updatedAt: string;
  publishedSlug?: string;
};
export type WorkspacePost = Post & { schedule?: { dueAt: string; revision: number } };
export type PublishedPost = Draft & {
  authorBio?: string;
  authorAvatarId?: string;
  authorGoogleAvatar?: string;
  id: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  revision: number;
};
export function canEdit(actor: Actor, post: Pick<Post, "owner" | "assignee">) {
  return (
    actor.role === "admin" ||
    actor.role === "publisher" ||
    (actor.role === "author" &&
      (post.owner === actor.uid || post.assignee === actor.uid))
  );
}
export function requirePublisher(actor: Actor) {
  if (actor.role !== "admin" && actor.role !== "publisher")
    throw new BlogError(403, "FORBIDDEN");
}
export function validatePublish(draft: Draft) {
  if (
    !draft.title ||
    !draft.summary ||
    !draft.authorId ||
    !draft.category ||
    !draft.sources.length ||
    !bodyText(draft.body)
  )
    throw new BlogError(400, "PUBLICATION_INCOMPLETE");
  slugSchema.parse(draft.slug);
  if (mediaIds(draft.body).length > 30)
    throw new BlogError(400, "TOO_MANY_IMAGES");
}
export function searchTokens(text: string) {
  return [
    ...new Set(
      text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/gi, "d")
        .toLowerCase()
        .match(/[a-z0-9]{2,40}/g) ?? [],
    ),
  ].slice(0, 120);
}
export const emptyDraft: Draft = {
  title: "",
  slug: "",
  summary: "",
  answer: "",
  authorId: "",
  assignee: "",
  category: "Engineering Practice",
  tags: [],
  language: "vi",
  coverId: "",
  commentsEnabled: true,
  seoTitle: "",
  seoDescription: "",
  sources: [],
  body: { type: "doc", content: [{ type: "paragraph" }] },
};

/** Suggest a readable Vietnamese/English slug; the editor preserves manual overrides. */
export function titleSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100)
    .replace(/-$/g, "");
}

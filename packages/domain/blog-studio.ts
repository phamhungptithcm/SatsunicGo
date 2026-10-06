import { z } from "zod";

export type RichNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: RichNode[];
};
export function safeUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return (
      ["https:", "http:"].includes(u.protocol) && !u.username && !u.password
    );
  } catch {
    return false;
  }
}
const nodes = new Set([
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
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export function validateBody(input: unknown): RichNode {
  let count = 0;
  const invalid = (): never => {
    throw new Error("INVALID_BODY");
  };
  function visit(value: unknown, depth: number): RichNode {
    if (!object(value) || depth > 12 || ++count > 10000) return invalid();
    const n = value;
    if (
      typeof n.type !== "string" ||
      !nodes.has(n.type) ||
      (n.text !== undefined && typeof n.text !== "string") ||
      (n.content !== undefined && !Array.isArray(n.content)) ||
      (n.marks !== undefined && !Array.isArray(n.marks)) ||
      (n.attrs !== undefined && !object(n.attrs))
    )
      return invalid();
    if (n.type === "doc" && depth !== 0) return invalid();
    if (
      n.type === "text" &&
      (typeof n.text !== "string" || n.content !== undefined)
    )
      return invalid();
    const a = object(n.attrs) ? n.attrs : {},
      attrs: Record<string, unknown> = {};
    if (n.type === "heading") {
      attrs.level = [2, 3, 4].includes(Number(a.level)) ? Number(a.level) : 2;
    }
    if (n.type === "orderedList") {
      const start = a.start ?? 1;
      if (!Number.isSafeInteger(start) || Number(start) < 1) return invalid();
      attrs.start = start;
    }
    if (n.type === "codeBlock")
      attrs.language =
        typeof a.language === "string" ? a.language.slice(0, 30) : "";
    if (["tableCell", "tableHeader"].includes(n.type))
      for (const key of ["colspan", "rowspan"]) {
        const span = a[key] ?? 1;
        if (!Number.isInteger(span) || Number(span) < 1 || Number(span) > 30)
          return invalid();
        attrs[key] = span;
      }
    const children = n.content as unknown[] | undefined;
    if (
      n.type === "table" &&
      (!children?.length ||
        children.length > 100 ||
        children.some((c) => !object(c) || c.type !== "tableRow"))
    )
      return invalid();
    if (
      n.type === "tableRow" &&
      (!children?.length ||
        children.length > 30 ||
        children.some(
          (c) =>
            !object(c) ||
            !["tableCell", "tableHeader"].includes(String(c.type)),
        ))
    )
      return invalid();
    if (n.type === "image") {
      if (
        typeof a.src !== "string" ||
        !/^\/media\/[a-zA-Z0-9-]{1,80}$/.test(a.src)
      )
        return invalid();
      attrs.src = a.src;
      for (const key of ["alt", "title"]) {
        if (a[key] !== undefined && typeof a[key] !== "string")
          return invalid();
        attrs[key] = String(a[key] ?? "").slice(0, 300);
      }
      for (const key of ["width", "height"])
        if (a[key] !== undefined && a[key] !== null) {
          const v = a[key];
          if (
            typeof v !== "number" ||
            !Number.isFinite(v) ||
            v < 1 ||
            v > 10000
          )
            return invalid();
          attrs[key] = Math.round(Number(v));
        }
    }
    const marks = ((n.marks ?? []) as unknown[]).map((m) => {
      if (
        !object(m) ||
        typeof m.type !== "string" ||
        !["bold", "italic", "strike", "code", "underline", "link"].includes(
          m.type,
        )
      )
        return invalid();
      if (m.type === "link") {
        if (
          !object(m.attrs) ||
          typeof m.attrs.href !== "string" ||
          m.attrs.href.length > 2000 ||
          !safeUrl(m.attrs.href)
        )
          return invalid();
        return { type: m.type, attrs: { href: m.attrs.href } };
      }
      return { type: m.type };
    });
    return {
      type: n.type,
      ...(n.text !== undefined ? { text: n.text as string } : {}),
      ...(Object.keys(attrs).length ? { attrs } : {}),
      ...(marks.length ? { marks } : {}),
      ...(children
        ? { content: children.map((c) => visit(c, depth + 1)) }
        : {}),
    };
  }
  const result = visit(input, 0);
  if (result.type !== "doc" || JSON.stringify(result).length > 200000)
    return invalid();
  return result;
}
export function bodyText(n: RichNode): string {
  return [n.text ?? "", ...(n.content ?? []).map(bodyText)].join(" ").trim();
}
export function mediaIds(n: RichNode): string[] {
  return [
    ...new Set([
      ...(n.type === "image" ? [String(n.attrs?.src).split("/").pop()!] : []),
      ...(n.content ?? []).flatMap(mediaIds),
    ]),
  ];
}
export const studioIdSchema = z.string().regex(/^[a-zA-Z0-9-]{1,80}$/);
const slug = z
  .string()
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const studioDraftSchema = z
  .object({
    title: z.string().trim().max(180),
    slug: z.union([slug, z.literal("")]),
    summary: z.string().trim().max(500),
    answer: z.string().trim().max(1200).default(""),
    authorId: z.string().max(128),
    assignee: z.string().max(128).default(""),
    category: z.string().max(80),
    tags: z.array(z.string().trim().min(1).max(40)).max(10),
    language: z.enum(["vi", "en"]),
    coverId: z.union([studioIdSchema, z.literal("")]).default(""),
    commentsEnabled: z.boolean(),
    seoTitle: z.string().max(180).default(""),
    seoDescription: z.string().max(500).default(""),
    sources: z
      .array(
        z
          .object({
            title: z.string().trim().min(1).max(200),
            url: z.string().max(2000).refine(safeUrl),
          })
          .strict(),
      )
      .max(30),
    body: z.unknown().transform((v, ctx) => {
      try {
        return validateBody(v);
      } catch {
        ctx.addIssue({ code: "custom", message: "INVALID_BODY" });
        return z.NEVER;
      }
    }),
  })
  .strict();
export type StudioDraft = z.infer<typeof studioDraftSchema>;
export type StudioPost = StudioDraft & {
  id: string;
  owner: string;
  state: "draft" | "review" | "published" | "archived";
  revision: number;
  updatedAt: string;
  publishedSlug?: string;
  publishedAt?: string;
  scheduledAt?: string;
};
export const emptyStudioDraft: StudioDraft = {
  title: "",
  slug: "",
  summary: "",
  answer: "",
  authorId: "",
  assignee: "",
  category: "",
  tags: [],
  language: "vi",
  coverId: "",
  commentsEnabled: true,
  seoTitle: "",
  seoDescription: "",
  sources: [],
  body: { type: "doc", content: [{ type: "paragraph" }] },
};
export const studioSettingsSchema = z
  .object({
    commentsEnabled: z.boolean(),
    requireReview: z.boolean(),
    categories: z.array(z.string().trim().min(1).max(80)).max(100),
    authors: z
      .array(
        z
          .object({
            id: z.string().min(1).max(128),
            name: z.string().trim().min(1).max(120),
            bio: z.string().max(500).default(""),
            avatarId: z.union([studioIdSchema, z.literal("")]).optional(),
            googleAvatar: z
              .string()
              .max(2048)
              .refine((v) => {
                try {
                  const u = new URL(v);
                  return (
                    u.protocol === "https:" &&
                    !u.username &&
                    !u.password &&
                    !u.port &&
                    u.hostname.endsWith(".googleusercontent.com")
                  );
                } catch {
                  return false;
                }
              })
              .optional(),
          })
          .strict(),
      )
      .max(100),
  })
  .strict()
  .refine(
    (s) =>
      new Set(s.authors.map((a) => a.id)).size === s.authors.length &&
      new Set(s.categories).size === s.categories.length,
    "DUPLICATE_CATALOG",
  );
export const defaultStudioSettings = {
  commentsEnabled: true,
  requireReview: false,
  categories: [],
  authors: [],
};
export function nextStudioRevision(v: unknown): number {
  if (
    !Number.isSafeInteger(v) ||
    Number(v) < 1 ||
    Number(v) >= Number.MAX_SAFE_INTEGER
  )
    throw new Error("INVALID_REVISION");
  return Number(v) + 1;
}
export function validatePublish(d: StudioDraft): void {
  if (
    !d.title ||
    !d.slug ||
    !d.summary ||
    !d.authorId ||
    !d.category ||
    !d.sources.length ||
    !bodyText(d.body)
  )
    throw new Error("PUBLISH_REQUIRED");
  if (mediaIds(d.body).length > 30) throw new Error("TOO_MANY_IMAGES");
}
/** Public allowlist: never leak staff IDs, draft state, schedules or operation receipts. */
export function publishedStudioPost(
  d: StudioPost,
  author: {
    name: string;
    bio: string;
    avatarId?: string;
    googleAvatar?: string;
  },
  now: string,
) {
  validatePublish(d);
  return {
    id: d.id,
    title: d.title,
    slug: d.slug,
    summary: d.summary,
    answer: d.answer,
    category: d.category,
    tags: d.tags,
    language: d.language,
    body: d.body,
    content: bodyText(d.body),
    commentsEnabled: d.commentsEnabled,
    seoTitle: d.seoTitle,
    seoDescription: d.seoDescription,
    sources: d.sources,
    mediaId: d.coverId,
    mediaIds: [
      ...new Set([...mediaIds(d.body), ...(d.coverId ? [d.coverId] : [])]),
    ],
    author: author.name,
    authorBio: author.bio,
    authorAvatarId: author.avatarId ?? "",
    authorGoogleAvatar: author.googleAvatar ?? "",
    revision: d.revision,
    publishedAt: d.publishedAt ?? now,
    updatedAt: now,
    status: "published",
    readingMinutes: Math.max(
      1,
      Math.ceil(bodyText(d.body).split(/\s+/).length / 220),
    ),
  };
}

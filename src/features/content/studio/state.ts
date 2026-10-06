import {
  studioDraftSchema,
  bodyText,
  safeUrl,
  type RichNode,
  type StudioDraft,
  type StudioPost,
} from "../../../../packages/domain/blog-studio";
export function draftOf(post: StudioDraft | StudioPost): StudioDraft {
  const {
    title,
    slug,
    summary,
    answer,
    authorId,
    assignee,
    category,
    tags,
    language,
    coverId,
    commentsEnabled,
    seoTitle,
    seoDescription,
    sources,
    body,
  } = post;
  return {
    title,
    slug,
    summary,
    answer,
    authorId,
    assignee,
    category,
    tags,
    language,
    coverId,
    commentsEnabled,
    seoTitle,
    seoDescription,
    sources,
    body,
  };
}
export function titleSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100)
    .replace(/-$/g, "");
}
export const recoveryKey = (uid: string, id: string) =>
  `satsunicgo:studio:${uid}:${id}`;
export function parseRecovery(
  raw: string | null,
  uid: string,
  id: string,
  now = Date.now(),
): { draft: StudioDraft; revision: number; at: number } | null {
  try {
    if (!raw || raw.length > 250000) return null;
    const v = JSON.parse(raw);
    if (
      v.uid !== uid ||
      v.id !== id ||
      !Number.isSafeInteger(v.revision) ||
      v.revision < 1 ||
      !Number.isFinite(v.at) ||
      v.at > now ||
      now - v.at > 7 * 86400000
    )
      return null;
    return {
      draft: studioDraftSchema.parse(v.draft),
      revision: v.revision,
      at: v.at,
    };
  } catch {
    return null;
  }
}
/** Request responses apply only to the originating account/editor generation. */
export function createStudioFence() {
  let epoch = 0,
    generation = 0;
  return {
    epoch: () => epoch,
    generation: () => generation,
    edit: () => ++generation,
    invalidate: () => {
      epoch++;
      generation = 0;
    },
    current: (e: number) => e === epoch,
    unchanged: (e: number, g: number) => e === epoch && g === generation,
  };
}
export function publicationChecks(d: StudioDraft) {
  const nodes = (node: RichNode): RichNode[] => [
    node,
    ...(node.content ?? []).flatMap(nodes),
  ];
  const all = nodes(d.body);
  return [
    {
      ok: Boolean(d.title.trim() && d.summary.trim()),
      label: "Có tiêu đề và tóm tắt",
    },
    { ok: Boolean(d.authorId), label: "Đã chọn tác giả" },
    {
      ok: Boolean(d.seoDescription.trim() || d.summary.trim()),
      label: "Có mô tả SEO",
    },
    { ok: Boolean(d.coverId), label: "Có ảnh bìa" },
    {
      ok: all
        .filter((n) => n.type === "image")
        .every((n) => Boolean(String(n.attrs?.alt ?? "").trim())),
      label: "Ảnh trong bài có alt mô tả",
    },
    { ok: Boolean(d.answer.trim()), label: "Có ý chính cho người đọc" },
    { ok: d.sources.length > 0, label: "Có nguồn tham khảo (khi bài cần)" },
    {
      ok: all.every((n) =>
        (n.marks ?? []).every(
          (m) => m.type !== "link" || safeUrl(String(m.attrs?.href ?? "")),
        ),
      ),
      label: "Link dùng địa chỉ hợp lệ",
    },
    {
      ok: all.some(
        (n) =>
          n.type === "heading" &&
          /checklist|kiem tra|kiểm tra/i.test(bodyText(n)),
      ),
      label: "Có checklist áp dụng (nếu phù hợp)",
    },
  ];
}

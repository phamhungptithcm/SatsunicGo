type OrderedComment = { id: string; postId: string; createdAt?: string };
type Page<T> = { items: T[]; next: string | null };
const readError = () => Error("Chưa thực hiện được thao tác.");

function validBoundary(item: OrderedComment): item is OrderedComment & {
  createdAt: string;
} {
  return (
    typeof item.createdAt === "string" &&
    Number.isFinite(Date.parse(item.createdAt)) &&
    typeof item.id === "string" &&
    /^[a-zA-Z0-9-]{1,80}$/.test(item.id)
  );
}

/** Adapter for studioRead's existing UTF-8 base64url createdAt|id cursor. */
export function moderationCursor(item: OrderedComment): string {
  if (!validBoundary(item)) throw readError();
  const bytes = new TextEncoder().encode(`${item.createdAt}|${item.id}`);
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

/** Atomic bounded view; overflow resumes at the last displayed record. */
export async function readModerationWindow<T extends OrderedComment>(
  read: (after?: string) => Promise<Page<T>>,
  valid: () => boolean,
  after?: string,
): Promise<Page<T> | null> {
  const items: T[] = [],
    ids = new Set<string>(),
    cursors = new Set(after ? [after] : []);
  let previous: T | undefined;
  for (let request = 0; request < 4; request++) {
    if (!valid()) return null;
    const page = await read(after);
    if (!valid()) return null;
    if (
      !Array.isArray(page.items) ||
      page.items.length > 30 ||
      (page.next !== null &&
        (typeof page.next !== "string" || !page.next || !page.items.length))
    )
      throw readError();
    for (const item of page.items) {
      if (
        !validBoundary(item) ||
        ids.has(item.id) ||
        (previous &&
          (previous.createdAt! > item.createdAt ||
            (previous.createdAt === item.createdAt && previous.id >= item.id)))
      )
        throw readError();
      ids.add(item.id);
      previous = item;
    }
    if (
      page.next !== null &&
      (cursors.has(page.next) ||
        page.next !== moderationCursor(page.items.at(-1)!))
    )
      throw readError();
    const remaining = 100 - items.length;
    items.push(...page.items.slice(0, remaining));
    if (page.items.length > remaining)
      return { items, next: moderationCursor(items.at(-1)!) };
    if (items.length === 100 || page.next === null)
      return { items, next: page.next };
    cursors.add(page.next);
    after = page.next;
  }
  // The existing 30-record endpoint must fill or exhaust a window in four reads.
  throw readError();
}

/** At most four authorized title reads in flight; never publish a partial map. */
export async function readModerationTitles(
  comments: OrderedComment[],
  read: (postId: string) => Promise<{ title: string }>,
  valid: () => boolean,
): Promise<Record<string, string> | null> {
  const ids = [...new Set(comments.map((comment) => comment.postId))];
  if (comments.length > 100) throw readError();
  const titles: Record<string, string> = {};
  for (let offset = 0; offset < ids.length; offset += 4) {
    if (!valid()) return null;
    const batch = ids.slice(offset, offset + 4);
    const results = await Promise.allSettled(
      batch.map(async (id) => {
        if (!valid()) return null;
        return read(id);
      }),
    );
    if (!valid()) return null;
    for (const [index, result] of results.entries()) {
      if (result.status === "rejected") {
        if (
          (result.reason as { code?: string } | null)?.code !==
          "functions/not-found"
        )
          throw result.reason;
      } else if (result.value) titles[batch[index]] = result.value.title;
    }
  }
  return valid() ? titles : null;
}

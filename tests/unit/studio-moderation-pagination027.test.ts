import { expect, it, vi } from "vitest";
import {
  moderationCursor,
  readModerationWindow,
  readModerationTitles,
} from "../../src/features/content/studio/moderation-pagination";

const records = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `comment-${String(index).padStart(4, "0")}`,
    postId: `post-${index}`,
    createdAt: "2026-10-06T00:00:00.000Z",
  }));
function endpoint(all: ReturnType<typeof records>) {
  return vi.fn(async (after?: string) => {
    const offset = after
      ? all.findIndex((item) => moderationCursor(item) === after) + 1
      : 0;
    const items = all.slice(offset, offset + 30);
    return {
      items,
      next: offset + 30 < all.length ? moderationCursor(items.at(-1)!) : null,
    };
  });
}

it.each([0, 1, 30, 31, 90, 100, 101, 120, 121, 301])(
  "traverses %i tied-timestamp records without overflow loss or duplicates",
  async (count) => {
    const all = records(count),
      read = endpoint(all),
      seen: string[] = [];
    let after: string | undefined;
    do {
      const before = read.mock.calls.length;
      const page = await readModerationWindow(read, () => true, after);
      expect(page).not.toBeNull();
      expect(page!.items.length).toBeLessThanOrEqual(100);
      expect(read.mock.calls.length - before).toBeLessThanOrEqual(4);
      seen.push(...page!.items.map((item) => item.id));
      after = page!.next ?? undefined;
    } while (after);
    expect(seen).toEqual(all.map((item) => item.id));
  },
);
it.each([101, 120])(
  "cold continuation survives exhausted fourth page at %i",
  async (count) => {
    const all = records(count),
      read = endpoint(all);
    const first = await readModerationWindow(read, () => true);
    expect(first!.next).toBe(moderationCursor(all[99]));
    const cold = await readModerationWindow(
      endpoint(all),
      () => true,
      first!.next!,
    );
    expect(cold!.items).toEqual(all.slice(100));
  },
);
it("matches server Buffer base64url cursor contract", () => {
  const item = records(1)[0];
  expect(moderationCursor(item)).toBe(
    Buffer.from(`${item.createdAt}|${item.id}`, "utf8").toString("base64url"),
  );
});
it("hydrates only the visible 100 records, never the fetched overflow", async () => {
  const page = await readModerationWindow(endpoint(records(120)), () => true);
  const read = vi.fn(async (id: string) => ({ title: id }));
  await readModerationTitles(page!.items, read, () => true);
  expect(read).toHaveBeenCalledTimes(100);
  expect(read.mock.calls.at(-1)).toEqual(["post-99"]);
});
it("bounds inconsistent short pages and rejects reversed timestamps", async () => {
  const all = records(5);
  let index = 0;
  const read = vi.fn(async () => {
    const item = all[index++];
    return { items: [item], next: moderationCursor(item) };
  });
  await expect(readModerationWindow(read, () => true)).rejects.toThrow();
  expect(read).toHaveBeenCalledTimes(4);
  const items = [{ ...all[0], createdAt: "2026-10-07T00:00:00.000Z" }, all[1]];
  await expect(
    readModerationWindow(
      async () => ({ items, next: null }),
      () => true,
    ),
  ).rejects.toThrow();
});
it.each([
  { ...records(1)[0], createdAt: undefined },
  { ...records(1)[0], createdAt: "bad" },
  { ...records(1)[0], id: "bad|id" },
])("rejects malformed cursor fields", (item) => {
  expect(() => moderationCursor(item)).toThrow();
});
it("rejects duplicate, reversed, oversized and nonprogressing responses", async () => {
  const all = records(31);
  for (const items of [[all[0], all[0]], [all[1], all[0]], all]) {
    await expect(
      readModerationWindow(
        async () => ({ items, next: null }),
        () => true,
      ),
    ).rejects.toThrow();
  }
  await expect(
    readModerationWindow(
      async () => ({ items: [], next: "cursor" }),
      () => true,
    ),
  ).rejects.toThrow();
  await expect(
    readModerationWindow(
      async () => ({ items: [all[0]], next: "wrong" }),
      () => true,
    ),
  ).rejects.toThrow();
  const cursor = moderationCursor(all[0]);
  await expect(
    readModerationWindow(
      async () => ({ items: [all[0]], next: cursor }),
      () => true,
      cursor,
    ),
  ).rejects.toThrow();
});
it("rejects cross-page overlap rather than labeling a partial window complete", async () => {
  const all = records(31);
  const read = vi
    .fn()
    .mockResolvedValueOnce({
      items: all.slice(0, 30),
      next: moderationCursor(all[29]),
    })
    .mockResolvedValueOnce({ items: [all[29]], next: null });
  await expect(readModerationWindow(read, () => true)).rejects.toThrow();
});
it.each([2, 3, 4])(
  "propagates page %i failure and retry starts from original URL cursor",
  async (failure) => {
    const all = records(160),
      original = moderationCursor(all[9]),
      service = endpoint(all);
    let calls = 0;
    const read = vi.fn(async (after?: string) => {
      if (++calls === failure) throw Error("network");
      return service(after);
    });
    await expect(
      readModerationWindow(read, () => true, original),
    ).rejects.toThrow("network");
    const retry = await readModerationWindow(service, () => true, original);
    expect(retry!.items).toEqual(all.slice(10, 110));
  },
);
it("stops stale route/account reads before issuing another page", async () => {
  let valid = true;
  const read = vi.fn(async () => {
    valid = false;
    const items = records(30);
    return { items, next: moderationCursor(items[29]) };
  });
  expect(await readModerationWindow(read, () => valid)).toBeNull();
  expect(read).toHaveBeenCalledTimes(1);
  expect(await readModerationWindow(read, () => false)).toBeNull();
  expect(read).toHaveBeenCalledTimes(1);
});
it("hydrates distinct visible titles in bounded batches and skips not-found", async () => {
  let active = 0,
    peak = 0;
  const read = vi.fn(async (id: string) => {
    peak = Math.max(peak, ++active);
    await Promise.resolve();
    active--;
    if (id === "post-2") throw { code: "functions/not-found" };
    return { title: id };
  });
  const comments = records(100);
  comments[1].postId = comments[0].postId;
  const titles = await readModerationTitles(comments, read, () => true);
  expect(peak).toBe(4);
  expect(read).toHaveBeenCalledTimes(99);
  expect(Object.keys(titles!)).toHaveLength(98);
  expect(titles!["post-2"]).toBeUndefined();
});
it("title failure waits for its batch and stops later reads without a partial map", async () => {
  let settled = 0;
  const read = vi.fn(async (id: string) => {
    await Promise.resolve();
    settled++;
    if (id === "post-0") throw { code: "functions/permission-denied" };
    return { title: id };
  });
  await expect(
    readModerationTitles(records(8), read, () => true),
  ).rejects.toEqual({ code: "functions/permission-denied" });
  expect(settled).toBe(4);
  expect(read).toHaveBeenCalledTimes(4);
});
it("discards stale title batch and schedules no further reads", async () => {
  let valid = true;
  const read = vi.fn(async (id: string) => {
    await Promise.resolve();
    valid = false;
    return { title: id };
  });
  expect(await readModerationTitles(records(8), read, () => valid)).toBeNull();
  expect(read).toHaveBeenCalledTimes(4);
});

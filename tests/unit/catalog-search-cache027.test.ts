import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ getDocs: vi.fn() }));
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  documentId: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  startAfter: vi.fn(),
  limit: vi.fn(),
  getDocs: mock.getDocs,
}));
vi.mock("../../src/shared/firebase", () => ({ db: {} }));
function snapshot(count: number, match = true, stale = false) {
  return {
    size: count,
    metadata: { fromCache: stale },
    docs: Array.from({ length: count }, (_, index) => ({
      id: `p-${index}`,
      data: () => ({
        title: match ? "Cream" : "Oil",
        slug: `product-${index}`,
        status: "published",
      }),
    })),
  };
}
beforeEach(() => {
  vi.resetModules();
  mock.getDocs.mockReset();
  vi.stubGlobal("navigator", { onLine: true });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("published catalog memory cache", () => {
  it("cancels a waiting consumer promptly without cancelling another shared reader", async () => {
    let complete!: (value: ReturnType<typeof snapshot>) => void;
    mock.getDocs.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const { searchPublishedCatalog } =
      await import("../../src/features/ask/catalog-search");
    const controller = new AbortController();
    const cancelled = searchPublishedCatalog("cream", controller.signal);
    const surviving = searchPublishedCatalog(
      "cream",
      new AbortController().signal,
    );
    const rejected = expect(cancelled).rejects.toMatchObject({
      name: "AbortError",
    });
    controller.abort();
    await rejected;
    expect(mock.getDocs).toHaveBeenCalledTimes(1);
    complete(snapshot(1));
    expect((await surviving).rows).toHaveLength(1);
  });
  it("expires a hung shared page and ignores its late result during a fresh retry", async () => {
    vi.useFakeTimers();
    let late!: (value: ReturnType<typeof snapshot>) => void;
    mock.getDocs.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          late = resolve;
        }),
    );
    const { searchPublishedCatalog } =
      await import("../../src/features/ask/catalog-search");
    const pending = searchPublishedCatalog(
      "cream",
      new AbortController().signal,
    );
    const rejected = expect(pending).rejects.toThrow("CATALOG_READ_TIMEOUT");
    await vi.advanceTimersByTimeAsync(5000);
    await rejected;
    mock.getDocs.mockResolvedValue(snapshot(1, false));
    expect(
      (await searchPublishedCatalog("cream", new AbortController().signal))
        .rows,
    ).toHaveLength(0);
    late(snapshot(1));
    await Promise.resolve();
    await Promise.resolve();
    expect(
      (await searchPublishedCatalog("oil", new AbortController().signal)).rows,
    ).toHaveLength(1);
    expect(mock.getDocs).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("bounds distinct inflight public pages and releases them after timeout", async () => {
    vi.useFakeTimers();
    mock.getDocs.mockImplementation(() => new Promise(() => {}));
    const { searchPublishedCatalog } =
      await import("../../src/features/ask/catalog-search");
    const waiting = Array.from({ length: 10 }, (_, index) =>
      searchPublishedCatalog(
        "cream",
        new AbortController().signal,
        `cursor-${index}`,
      ),
    );
    const settled = Promise.allSettled(waiting);
    await expect(
      searchPublishedCatalog("cream", new AbortController().signal, "overflow"),
    ).rejects.toThrow("CATALOG_BUSY");
    expect(mock.getDocs).toHaveBeenCalledTimes(10);
    await vi.advanceTimersByTimeAsync(5000);
    expect(
      (await settled).every((result) => result.status === "rejected"),
    ).toBe(true);
    mock.getDocs.mockResolvedValue(snapshot(1));
    expect(
      (
        await searchPublishedCatalog(
          "cream",
          new AbortController().signal,
          "overflow",
        )
      ).rows,
    ).toHaveLength(1);
  });
  it("skips malformed public records without losing valid matches or page continuation", async () => {
    const valid = snapshot(1);
    mock.getDocs.mockResolvedValue({
      ...valid,
      size: 3,
      docs: [
        {
          id: "bad-title",
          data: () => ({ status: "published", slug: "bad-title" }),
        },
        ...valid.docs,
        {
          id: "bad-slug",
          data: () => ({
            title: "Cream",
            status: "published",
            slug: "../private",
          }),
        },
      ],
    });
    const { searchPublishedCatalog } =
      await import("../../src/features/ask/catalog-search");
    const result = await searchPublishedCatalog(
      "cream",
      new AbortController().signal,
    );
    expect(result.rows.map((row) => row.id)).toEqual(["p-0"]);
    expect(result.cursor).toBe("bad-slug");
    expect(result.hasMore).toBe(false);
  });
  it("deduplicates concurrent reads and reuses only current public pages", async () => {
    mock.getDocs.mockResolvedValue(snapshot(1));
    const { searchPublishedCatalog } =
      await import("../../src/features/ask/catalog-search");
    const signal = new AbortController().signal;
    const [one, two] = await Promise.all([
      searchPublishedCatalog("cream", signal),
      searchPublishedCatalog("cream", signal),
    ]);
    expect(one.rows).toHaveLength(1);
    expect(two.rows).toHaveLength(1);
    expect(mock.getDocs).toHaveBeenCalledTimes(1);
    await searchPublishedCatalog("cream", signal);
    expect(mock.getDocs).toHaveBeenCalledTimes(1);
  });
  it("never labels stale page as current or retains it in shared TTL", async () => {
    mock.getDocs.mockResolvedValue(snapshot(1, true, true));
    const { searchPublishedCatalog } =
      await import("../../src/features/ask/catalog-search");
    expect(
      (await searchPublishedCatalog("cream", new AbortController().signal))
        .stale,
    ).toBe(true);
    await searchPublishedCatalog("cream", new AbortController().signal);
    expect(mock.getDocs).toHaveBeenCalledTimes(2);
  });
  it("stops bounded scanning with explicit continuation rather than false global no-match", async () => {
    mock.getDocs.mockResolvedValue(snapshot(100, false));
    const { searchPublishedCatalog } =
      await import("../../src/features/ask/catalog-search");
    const result = await searchPublishedCatalog(
      "cream",
      new AbortController().signal,
    );
    expect(result.rows).toHaveLength(0);
    expect(result.hasMore).toBe(true);
    expect(result.cursor).toBe("p-99");
  });
  it("caps each panel at eight without losing unconsumed matches on continuation", async () => {
    const all = snapshot(20);
    mock.getDocs
      .mockResolvedValueOnce(all)
      .mockResolvedValueOnce({ ...all, size: 12, docs: all.docs.slice(8) });
    const { searchPublishedCatalog } =
      await import("../../src/features/ask/catalog-search");
    const signal = new AbortController().signal;
    const first = await searchPublishedCatalog("cream", signal);
    expect(first.rows.map((row) => row.id)).toEqual(
      all.docs.slice(0, 8).map((row) => row.id),
    );
    expect(first.cursor).toBe("p-7");
    expect(first.hasMore).toBe(true);
    const second = await searchPublishedCatalog("cream", signal, first.cursor);
    expect(second.rows.map((row) => row.id)).toEqual(
      all.docs.slice(8, 16).map((row) => row.id),
    );
    expect(second.cursor).toBe("p-15");
    expect(second.hasMore).toBe(true);
    await searchPublishedCatalog("CRÉAM", signal);
    expect(mock.getDocs).toHaveBeenCalledTimes(2);
  });
  it("expires query results and bypasses online cache when offline", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1000);
    try {
      mock.getDocs.mockResolvedValue(snapshot(1));
      const { searchPublishedCatalog } =
        await import("../../src/features/ask/catalog-search");
      const signal = new AbortController().signal;
      await searchPublishedCatalog("cream", signal);
      now.mockReturnValue(61001);
      await searchPublishedCatalog("cream", signal);
      expect(mock.getDocs).toHaveBeenCalledTimes(2);
      vi.stubGlobal("navigator", { onLine: false });
      expect((await searchPublishedCatalog("cream", signal)).stale).toBe(true);
      expect(mock.getDocs).toHaveBeenCalledTimes(3);
    } finally {
      now.mockRestore();
    }
  });
  it("does not start a read for cancelled work", async () => {
    const { searchPublishedCatalog } =
      await import("../../src/features/ask/catalog-search");
    const controller = new AbortController();
    controller.abort();
    await expect(
      searchPublishedCatalog("cream", controller.signal),
    ).rejects.toBeDefined();
    expect(mock.getDocs).not.toHaveBeenCalled();
  });
});

it("isolates positive, fragrance-constrained and refusal search cache entries", async () => {
  mock.getDocs.mockResolvedValue(snapshot(1));
  const { searchPublishedCatalog } =
    await import("../../src/features/ask/catalog-search");
  const search = (q: string) =>
    searchPublishedCatalog(q, new AbortController().signal);
  expect((await search("cream")).rows).toHaveLength(1);
  expect((await search("cream không hương liệu")).rows).toHaveLength(0);
  expect((await search("không cần cream")).rows).toHaveLength(0);
  expect((await search("cream")).rows).toHaveLength(1);
  // Public page may coalesce; semantic result entries must not coalesce.
  expect(mock.getDocs).toHaveBeenCalledTimes(1);
});
it("keeps exact strength and continuation separate while reusing identical public reads", async () => {
  const data = snapshot(1);
  data.docs[0].data = () => ({
    title: "vitamin c 1000 mg",
    slug: "vitamin-c",
    status: "published",
  });
  mock.getDocs.mockResolvedValue(data);
  const { searchPublishedCatalog } =
    await import("../../src/features/ask/catalog-search");
  const search = (q: string, after: string | null = null) =>
    searchPublishedCatalog(q, new AbortController().signal, after);
  expect((await search("vitamin c 1000 mg")).rows).toHaveLength(1);
  expect((await search("vitamin c 1000 mcg")).rows).toHaveLength(0);
  await search("vitamin c 1000 mg", "next-page");
  expect(mock.getDocs).toHaveBeenCalledTimes(2);
  await search("vitamin c 1000 mg");
  expect(mock.getDocs).toHaveBeenCalledTimes(2);
});

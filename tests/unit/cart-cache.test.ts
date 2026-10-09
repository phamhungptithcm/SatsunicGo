import { afterEach, beforeEach, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  get: vi.fn(),
  query: vi.fn((...args: unknown[]) => args),
}));
vi.mock("firebase/firestore", () => ({
  collection: (_db: unknown, name: string) => name,
  documentId: () => "id",
  where: (...args: unknown[]) => args,
  query: fixture.query,
  getDocsFromServer: fixture.get,
}));
vi.mock("../../src/shared/firebase", () => ({
  app: { options: { projectId: "demo-satsunicgo" } },
  db: {},
}));
const product = (id = "synthetic-product") => ({
  id,
  data: () => ({
    title: "Sản phẩm",
    slug: "synthetic",
    status: "published",
    version: 1,
    market: "US",
    listedPrice: 100000,
    orderable: true,
    termsVersion: "v1",
    privateValue: "never cache",
  }),
});
beforeEach(() => {
  vi.resetModules();
  fixture.get.mockReset();
  fixture.query.mockClear();
  const data = new Map<string, string>();
  vi.stubGlobal("navigator", { onLine: true });
  vi.stubGlobal("sessionStorage", {
    getItem: vi.fn((key) => data.get(key) ?? null),
    setItem: vi.fn((key, value) => {
      data.set(key, value);
    }),
  });
});
afterEach(() => vi.unstubAllGlobals());

it("does not access storage or fetch prices for empty and custom-only cart ID lists", async () => {
  const { cartProducts } = await import("../../src/features/cart/cart-cache");
  expect(await cartProducts([])).toEqual({
    rows: {},
    cached: false,
    error: "",
  });
  expect(fixture.get).not.toHaveBeenCalled();
  expect(sessionStorage.getItem).not.toHaveBeenCalled();
});
it("deduplicates simultaneous product reads and caches only public preview fields", async () => {
  fixture.get.mockResolvedValue({ docs: [product()] });
  const { cartProducts } = await import("../../src/features/cart/cart-cache");
  const [a, b] = await Promise.all([
    cartProducts(["synthetic-product", "synthetic-product"]),
    cartProducts(["synthetic-product"]),
  ]);
  expect(a).toEqual(b);
  expect(a.cached).toBe(false);
  expect(fixture.get).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(a)).not.toContain("privateValue");
  expect(
    JSON.stringify(vi.mocked(sessionStorage.setItem).mock.calls),
  ).not.toContain("never cache");
});
it("keeps stale price informational after service failure and allows a fresh retry", async () => {
  fixture.get
    .mockResolvedValueOnce({ docs: [product()] })
    .mockRejectedValueOnce(Error("Permission denied"))
    .mockResolvedValueOnce({ docs: [] });
  const { cartProducts, productPreviewFresh } =
    await import("../../src/features/cart/cart-cache");
  await cartProducts(["synthetic-product"]);
  expect(productPreviewFresh("synthetic-product")).toBe(true);
  const failed = await cartProducts(["synthetic-product"]);
  expect(failed.cached).toBe(true);
  expect(failed.rows["synthetic-product"].listedPrice).toBe(100000);
  expect(failed.error).toContain("Chưa tải được giá mới");
  expect(failed.error).not.toContain("Kết nối");
  expect(await cartProducts(["synthetic-product"])).toEqual({
    rows: {},
    cached: false,
    error: "",
  });
  expect(productPreviewFresh("synthetic-product")).toBe(false);
});
it("does not query while offline and distinguishes unavailable price from zero", async () => {
  vi.stubGlobal("navigator", { onLine: false });
  const { cartProducts } = await import("../../src/features/cart/cart-cache");
  expect(await cartProducts(["synthetic-product"])).toEqual({
    rows: {},
    cached: true,
    error: "Kết nối mạng để cập nhật giá.",
  });
  expect(fixture.get).not.toHaveBeenCalled();
});
it("handles both30-item carts using at most two30-ID queries", async () => {
  fixture.get.mockResolvedValue({ docs: [] });
  const { cartProducts } = await import("../../src/features/cart/cart-cache");
  await cartProducts(
    Array.from(
      { length: 70 },
      (_, i) => `product-${i.toString().padStart(2, "0")}`,
    ),
  );
  expect(fixture.get).toHaveBeenCalledTimes(2);
  const ids = fixture.query.mock.calls.map(
    (call) => (call[2] as unknown[])[2] as string[],
  );
  expect(ids.map((batch) => batch.length)).toEqual([30, 30]);
  expect(new Set(ids.flat()).size).toBe(60);
});
it("isolates a removed/private ID without hiding the other public product prices", async () => {
  fixture.get.mockImplementation(async (constraints) => {
    const ids = constraints[2][2] as string[];
    if (ids.includes("missing"))
      throw Object.assign(Error("Private details"), {
        code: "permission-denied",
      });
    return { docs: ids.map((id) => product(id)) };
  });
  const { cartProducts } = await import("../../src/features/cart/cart-cache");
  const result = await cartProducts(["missing", "synthetic-product"]);
  expect(result.cached).toBe(false);
  expect(result.error).toBe("");
  expect(Object.keys(result.rows)).toEqual(["synthetic-product"]);
  expect(fixture.get).toHaveBeenCalledTimes(3);
  expect(JSON.stringify(result)).not.toContain("Private details");
});
it("still treats a network failure during the per-item fallback as unverified", async () => {
  fixture.get.mockImplementation(async (constraints) => {
    const ids = constraints[2][2] as string[];
    if (ids.length > 1)
      throw Object.assign(Error("Denied batch"), { code: "permission-denied" });
    if (ids[0] === "network")
      throw Object.assign(Error("Unavailable"), { code: "unavailable" });
    return { docs: [] };
  });
  const { cartProducts } = await import("../../src/features/cart/cart-cache");
  const result = await cartProducts(["missing", "network"]);
  expect(result.cached).toBe(true);
  expect(result.error).toContain("Chưa tải được giá mới");
});

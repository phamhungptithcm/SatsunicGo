import { beforeEach, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { CartItem } from "../../packages/domain/cart";
import { writeFileSync } from "node:fs";

const fixture = vi.hoisted(() => ({
  cart: {} as Record<string, unknown>,
  products: { rows: {} as Record<string, unknown>, cached: false, error: "" },
  reading: false,
}));
vi.mock("react", async (load) => {
  const react = await load<typeof import("react")>();
  return {
    ...react,
    useState: (value: unknown) => [
      typeof value === "object" && value !== null && "rows" in value
        ? fixture.products
        : value === true
          ? fixture.reading
          : value,
      vi.fn(),
    ],
  };
});
vi.mock("../../src/features/cart/cart-store", () => ({
  useCart: () => fixture.cart,
}));
vi.mock("../../src/features/cart/cart-cache", () => ({
  cartProducts: vi.fn(),
}));
vi.mock("../../src/shared/firebase", () => ({
  emulatorMode: true,
  app: null,
  db: null,
  callService: vi.fn(),
}));
import { CartPage } from "../../src/features/cart/Cart";
const item: CartItem = {
  lineId: "00000000-0000-4000-8000-000000000001",
  productId: "synthetic-product",
  variant: "",
  quantity: 2,
};
const product = {
  title: "Tai nghe kiểm thử",
  slug: "synthetic-product",
  status: "published",
  version: 1,
  market: "US",
  listedPrice: 100000,
  orderable: true,
  termsVersion: "v1",
  catalogOptions: [],
};
const render = () =>
  renderToStaticMarkup(
    createElement(
      MemoryRouter,
      {},
      createElement(CartPage, { signIn: vi.fn() }),
    ),
  );
beforeEach(() => {
  fixture.cart = {
    cart: { ownerId: "synthetic-owner", revision: 1, items: [item] },
    user: { uid: "synthetic-owner" },
    loading: false,
    busy: false,
    cached: false,
    online: true,
    error: "",
    storageWarning: "",
    guestItems: [],
    pending: false,
    change: vi.fn(),
    changeGuest: vi.fn(),
    mergeGuest: vi.fn(),
    resetGuest: vi.fn(),
    refresh: vi.fn(),
    retryPending: vi.fn(),
  };
  fixture.products = {
    rows: { "synthetic-product": product },
    cached: false,
    error: "",
  };
  fixture.reading = false;
});
it("normal cart has only products, summary and the existing review action", () => {
  const html = render();
  expect(html).toContain("Tai nghe kiểm thử");
  expect(html).toContain("200.000 ₫");
  expect(html).not.toContain("Gộp vào giỏ");
  expect(html).not.toContain("cartNotice107");
  expect(html).not.toMatch(/disabled=""[^>]*>Xem lại để đặt mua/);
});
it("keeps unavailable guest choices visible and removable without presenting a false empty cart", () => {
  fixture.cart.guestItems = [
    {
      ...item,
      lineId: "00000000-0000-4000-8000-000000000002",
      productId: "unavailable",
    },
  ];
  fixture.cart.error = "Sản phẩm hoặc mẫu này chưa thể thêm vào giỏ.";
  const html = render();
  expect(html).toContain("Sản phẩm chưa có thông tin");
  expect(html).toContain("Xóa sản phẩm khỏi giỏ");
  expect(html).toContain('disabled="">Xem lại để đặt mua');
  expect(html).not.toContain("Giỏ hàng đang trống");
  expect(html).not.toContain("Gộp vào giỏ");
});
it("keeps failed price recovery inside the summary and prevents review of cached prices", () => {
  fixture.products.cached = true;
  fixture.products.error = "Chưa tải được giá mới. Thử lại để tiếp tục.";
  const html = render();
  expect(html).toContain("Tạm tính · giá chưa cập nhật");
  expect(html).toContain("cartPriceState107");
  expect(html.indexOf(fixture.products.error)).toBeGreaterThan(
    html.indexOf("cartSummary107"),
  );
  expect(html).toContain('disabled="">Xem lại để đặt mua');
  expect(html).not.toContain("cartNotice107");
  if (process.env.CART_RECOVERY_UI_EXPORT)
    writeFileSync(
      process.env.CART_RECOVERY_UI_EXPORT,
      `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/src/styles/global.css"><link rel="stylesheet" href="/src/features/cart/cart.css"><style>body{margin:0;background:#fff}.page{margin:auto}</style><title>Cart recovery - rendered component proxy</title><body>${html}</body></html>`,
    );
});
it("empty cart does not show product-price failure or retry controls", () => {
  (fixture.cart.cart as { items: CartItem[] }).items = [];
  fixture.products.cached = true;
  fixture.products.error = "Chưa tải được giá mới.";
  const html = render();
  expect(html).toContain("Giỏ hàng đang trống");
  expect(html).not.toContain("Thử lại");
  expect(html).not.toContain(fixture.products.error);
});
it("pending checkout preserves the existing payment route and defers guest transfer", () => {
  (fixture.cart.cart as Record<string, unknown>).activeCheckoutId =
    "00000000-0000-4000-8000-000000000099";
  fixture.cart.guestItems = [
    { ...item, lineId: "00000000-0000-4000-8000-000000000002" },
  ];
  const html = render();
  expect(html).toContain("Hoàn tất thanh toán đang chờ");
  expect(html).toContain("Tiếp tục thanh toán đang chờ");
  expect(html).not.toContain(">Thử lại<");
});

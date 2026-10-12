import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { User } from "firebase/auth";
import type { PurchaseCheckout } from "../../packages/domain/purchase-checkout";

const state = vi.hoisted(() => ({ call: vi.fn(), refresh: vi.fn() }));
vi.mock("../../src/shared/firebase", () => ({ callService: state.call }));
vi.mock("../../src/features/cart/cart-store", () => ({
  useCart: () => ({ refresh: state.refresh }),
}));
vi.mock("../../src/features/cart/purchase-checkout", () => ({
  PurchaseJourney: () => null,
}));
vi.mock("../../src/features/cart/purchase-completion", () => ({
  PurchaseCompletion: () => createElement("p", null, "Đã ghi nhận thanh toán"),
}));
import { PurchasePayment } from "../../src/features/cart/purchase-payment";

const fixture = (overrides: Partial<PurchaseCheckout> = {}) =>
  ({
    id: "00000000-0000-4000-8000-000000000001",
    ownerId: "expiry-owner",
    provider: "sepay_sandbox",
    state: "pending",
    total: 125000,
    expiresAt: Date.now() + 60000,
    sepayInvoice: "SSG-SBX-00000000000040008000000000000001",
    lines: [],
    ...overrides,
  }) as PurchaseCheckout;
let container: HTMLDivElement;
let root: Root;
async function render(uid = "expiry-owner") {
  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        {
          initialEntries: [
            "/checkout/payment/00000000-0000-4000-8000-000000000001",
          ],
        },
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: "/checkout/payment/:id",
            element: createElement(PurchasePayment, {
              user: { uid } as User,
              signIn: vi.fn(),
            }),
          }),
        ),
      ),
    );
  });
}
const buttons = () => [...container.querySelectorAll("button")];
const checkButton = () =>
  buttons().find((b) => b.textContent === "Kiểm tra thanh toán")!;
async function click(button: HTMLButtonElement) {
  await act(async () => {
    button.click();
  });
}
beforeEach(() => {
  vi.useRealTimers();
  state.call.mockReset();
  state.refresh.mockReset();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
});

it.each(["unknown", "pending", "cancelled", "review_required"] as const)(
  "renders %s with compact state, test badge and collapsed reference",
  async (paymentState) => {
    state.call.mockImplementation(async (name: string) =>
      name === "purchaseCheckout" ? fixture({ state: paymentState }) : {},
    );
    await render();
    expect(container.querySelector("h2[aria-live=polite]")?.textContent).toBe(
      {
        unknown: "Chưa xác nhận thanh toán",
        pending: "Chờ thanh toán",
        cancelled: "Đã hủy thanh toán",
        review_required: "Cần đối chiếu thanh toán",
      }[paymentState],
    );
    expect(container.querySelector("details")?.open).toBe(false);
    expect(container.querySelector("details dd")?.textContent).toBe(
      fixture().id,
    );
    expect(container.textContent).toContain("Thanh toán thử");
    expect(container.textContent).not.toContain("Tiếp tục với đúng lượt");
    expect(buttons()).toHaveLength(
      paymentState === "unknown" ? 1 : paymentState === "pending" ? 2 : 0,
    );
  },
);
it("unknown SePay checks original checkout only without opening payment or refreshing cart", async () => {
  state.call.mockImplementation(async (name: string) =>
    name === "purchaseCheckout" ? fixture({ state: "unknown" }) : {},
  );
  await render();
  await click(checkButton());
  expect(
    state.call.mock.calls.every(
      ([, body]) =>
        ["status", "reconcile"].includes(body.action) &&
        body.id === fixture().id,
    ),
  ).toBe(true);
  expect(container.textContent).toContain("Không thanh toán lại");
  expect(state.refresh).not.toHaveBeenCalled();
});
it("provider failure retains owned amount, retry and safe unknown warning", async () => {
  state.call.mockImplementation(async (name: string) => {
    if (name === "purchaseCheckout") return fixture({ state: "unknown" });
    throw Error("offline");
  });
  await render();
  expect(container.querySelector("[role=alert]")?.textContent).toContain(
    "Chưa cập nhật được thanh toán",
  );
  expect(container.querySelector(".paymentAmount")?.textContent).toContain(
    "125.000",
  );
  expect(checkButton()).toBeDefined();
  expect(state.refresh).not.toHaveBeenCalled();
});
it("initial failure offers recovery and never renders unknown as paid", async () => {
  state.call.mockRejectedValue(Error("timeout"));
  await render();
  expect(container.querySelector("[role=alert]")).not.toBeNull();
  expect(container.textContent).not.toContain("Đã ghi nhận thanh toán");
  expect(buttons().some((b) => b.textContent === "Kiểm tra lại")).toBe(true);
});
it("paid delegates unchanged receipt completion and refreshes cart", async () => {
  state.call.mockResolvedValue(fixture({ state: "paid" }));
  await render();
  expect(container.textContent).toContain("Đã ghi nhận thanh toán");
  expect(container.querySelector("details")).toBeNull();
  expect(state.refresh).toHaveBeenCalledTimes(1);
});
it("financial review preserves received amount including zero and no gateway action", async () => {
  state.call.mockResolvedValue(
    fixture({ state: "review_required", receivedAmount: 0 }),
  );
  await render();
  expect(container.querySelector("[role=alert]")?.textContent).toContain(
    "Đã nhận 0 ₫",
  );
  expect(container.textContent).toContain("Không thanh toán lại");
  expect(buttons()).toHaveLength(0);
});
it("demo unknown retains distinct gateway recovery with accurate label", async () => {
  state.call.mockResolvedValue(
    fixture({ state: "unknown", provider: "demo", sepayInvoice: undefined }),
  );
  await render();
  expect(buttons().map((b) => b.textContent)).toEqual([
    "Mở thanh toán thử",
    "Kiểm tra thanh toán",
  ]);
});
it("product quantity and line total remain distinct from checkout total", async () => {
  state.call.mockResolvedValue(
    fixture({
      lines: [
        {
          lineId: "line1",
          name: "Sách Nhật",
          quantity: 2,
          total: 100000,
        } as PurchaseCheckout["lines"][number],
      ],
    }),
  );
  await render();
  expect(container.querySelector("li")?.textContent).toContain("Sách Nhật × 2");
  expect(container.querySelector("li")?.textContent).toContain("100.000");
  expect(container.querySelector(".paymentAmount")?.textContent).toContain(
    "125.000",
  );
});
it("deferred reconciliation disables retry, announces loading and prevents duplicate checks", async () => {
  let resolve!: (value: unknown) => void;
  state.call.mockImplementation(async (name: string) =>
    name === "purchaseCheckout"
      ? fixture({ state: "unknown" })
      : new Promise((r) => {
          resolve = r;
        }),
  );
  await render();
  const pending = buttons()[0];
  expect(pending.textContent).toBe("Đang kiểm tra…");
  expect(pending.disabled).toBe(true);
  await click(pending);
  expect(
    state.call.mock.calls.filter(([name]) => name === "purchaseSePayPayment"),
  ).toHaveLength(1);
  await act(async () => resolve({}));
  expect(checkButton().disabled).toBe(false);
});
it("switching account during reconciliation ignores old response and clears new loading", async () => {
  let reads = 0;
  let oldResolve!: (value: unknown) => void;
  state.call.mockImplementation(async (name: string) => {
    if (name === "purchaseCheckout")
      return fixture({ state: ++reads === 1 ? "unknown" : "cancelled" });
    return new Promise((r) => {
      oldResolve = r;
    });
  });
  await render();
  await render("other-owner");
  expect(container.textContent).toContain("Đã hủy thanh toán");
  await act(async () => oldResolve({}));
  expect(container.textContent).toContain("Đã hủy thanh toán");
  expect(
    state.call.mock.calls.filter(([name]) => name === "purchaseCheckout"),
  ).toHaveLength(2);
});
it("shows only the persisted known payment method without offering a replacement", async () => {
  state.call.mockResolvedValue(
    fixture({ paymentMethod: "BANK_TRANSFER", state: "unknown" }),
  );
  await render();
  expect(container.querySelector(".paymentSelectedMethod")?.textContent).toBe(
    "QR chuyển khoản ngân hàng",
  );
  expect(container.querySelector('input[type="radio"]')).toBeNull();
  expect(buttons()).toHaveLength(1);
});
it("absent payment method is not invented from provider", async () => {
  state.call.mockResolvedValue(fixture({ paymentMethod: undefined }));
  await render();
  expect(container.querySelector(".paymentSelectedMethod")).toBeNull();
});

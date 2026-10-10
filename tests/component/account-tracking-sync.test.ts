import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
const state = vi.hoisted(() => ({
  auth: { currentUser: { uid: "owner" } as { uid: string } | null },
  call: vi.fn(),
}));
vi.mock("../../src/shared/firebase", () => ({
  auth: state.auth,
  callService: state.call,
}));
vi.mock("../../src/features/orders/PublicTrackingCode", () => ({
  PublicTrackingCode: () => null,
}));
import { AccountTracking } from "../../src/features/orders/AccountTracking";
let root: Root, host: HTMLDivElement;
const dto = (version = 1, stage = "IN_TRANSIT") => ({
  orderId: "order",
  version,
  stage,
  purchaseKind: "catalog",
  upfrontPayment: true,
  observedAt: Date.now(),
  onHold: false,
  timeline: [],
  timelinePartial: false,
  shipmentsPartial: false,
  shipments: [],
  estimate: null,
});
const render = (version = 1, uid = "owner") =>
  act(async () =>
    root.render(
      createElement(
        MemoryRouter,
        {},
        createElement(AccountTracking, { uid, orderId: "order", version }),
      ),
    ),
  );
beforeEach(() => {
  vi.useFakeTimers();
  state.auth.currentUser = { uid: "owner" };
  state.call.mockReset().mockResolvedValue(dto());
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.useRealTimers();
});
it("H04 authoritative order version reloads an already mounted Account", async () => {
  await render();
  expect(state.call).toHaveBeenCalledTimes(1);
  state.call.mockResolvedValue(dto(2, "DELIVERED"));
  await render(2);
  expect(state.call).toHaveBeenCalledTimes(2);
  expect(host.textContent).toContain("Đã giao hàng");
});
it("N08 P03 periodic Account read reevaluates expired ETA and stops on unmount", async () => {
  const observedAt = Date.now();
  state.call
    .mockResolvedValueOnce({
      ...dto(),
      estimate: {
        source: "staff_aggregate",
        startAt: observedAt + 1000,
        endAt: observedAt + 30000,
        oldestRecordedAt: observedAt - 1,
        latestRecordedAt: observedAt - 1,
      },
    })
    .mockImplementation(async () => dto());
  await render();
  expect(host.textContent).toContain("Dự kiến nhận hàng");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60000);
  });
  expect(host.textContent).not.toContain("Dự kiến nhận hàng");
  expect(state.call).toHaveBeenCalledTimes(2);
  await act(async () => root.unmount());
  root = createRoot(host);
  await vi.advanceTimersByTimeAsync(120000);
  expect(state.call).toHaveBeenCalledTimes(2);
});
it("N17 skips offline/hidden ticks and retries online", async () => {
  const now = Date.now();
  state.call.mockResolvedValue({
    ...dto(),
    estimate: {
      source: "staff_aggregate",
      startAt: now + 1000,
      endAt: now + 300000,
      oldestRecordedAt: now - 1,
      latestRecordedAt: now - 1,
    },
    shipments: [
      {
        id: "parcel",
        state: "in_transit",
        route: "US-VN",
        updatedAt: now,
        deliveryEstimate: {
          source: "staff",
          startAt: now + 1000,
          endAt: now + 300000,
          recordedAt: now - 1,
          freshness: "current",
        },
      },
    ],
  });
  await render();
  expect(host.textContent).toContain("Dự kiến giao");
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: false,
  });
  await act(async () => {
    window.dispatchEvent(new Event("offline"));
    await vi.advanceTimersByTimeAsync(60000);
  });
  expect(host.textContent).toContain("Đang mất kết nối");
  expect(host.textContent).not.toContain("Dự kiến giao");
  expect(
    Array.from(host.querySelectorAll("time")).some(
      (time) => time.dateTime === new Date(now + 1000).toISOString(),
    ),
  ).toBe(false);
  expect(state.call).toHaveBeenCalledTimes(1);
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "hidden",
  });
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });
  await act(async () => {
    window.dispatchEvent(new Event("online"));
  });
  expect(state.call).toHaveBeenCalledTimes(1);
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(state.call).toHaveBeenCalledTimes(2);
});
it("N19 pending response cannot cross changed account", async () => {
  let resolve!: (v: unknown) => void;
  state.call
    .mockReturnValueOnce(new Promise((r) => (resolve = r)))
    .mockReturnValue(new Promise(() => {}));
  await render();
  state.auth.currentUser = { uid: "other" };
  await render(1, "other");
  await act(async () => resolve(dto()));
  expect(host.textContent).not.toContain("Đã giao hàng");
  expect(host.textContent).toContain("Đang tải");
});
it("N24 invalid revision fails safely and retry recovers", async () => {
  state.call.mockResolvedValue(dto(1));
  await render(2);
  expect(host.textContent).toContain("Chưa tải được");
  state.call.mockResolvedValue(dto(2));
  await act(async () => host.querySelector("button")!.click());
  expect(host.textContent).not.toContain("Chưa tải được");
});

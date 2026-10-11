import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
const state = vi.hoisted(() => ({
  auth: { currentUser: { uid: "owner" } as { uid: string } | null },
  call: vi.fn(),
}));
vi.mock("../../src/shared/firebase", () => ({
  auth: state.auth,
  callService: state.call,
}));
import { PublicTrackingCode } from "../../src/features/orders/PublicTrackingCode";
let root: Root, host: HTMLDivElement;
const code = "SGT-" + "a".repeat(64),
  value = { code, expiresAt: Date.now() + 3600000 };
const render = (uid = "owner", version = 1) =>
  act(async () =>
    root.render(
      createElement(PublicTrackingCode, { uid, orderId: "order", version }),
    ),
  );
const click = () =>
  act(async () => host.querySelector<HTMLButtonElement>("button")!.click());
beforeEach(() => {
  state.auth.currentUser = { uid: "owner" };
  state.call.mockReset();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});
it("N28 auth A→B→A never exposes late owner capability", async () => {
  let resolve!: (v: unknown) => void;
  state.call.mockReturnValueOnce(new Promise((r) => (resolve = r)));
  await render();
  await click();
  state.auth.currentUser = { uid: "other" };
  await render("other");
  state.auth.currentUser = { uid: "owner" };
  await render();
  await act(async () => resolve(value));
  expect(host.textContent).not.toContain(code);
});
it("N11 N16 lost issuance response retries the same operation and never persists capability", async () => {
  const local = vi.spyOn(localStorage, "setItem"),
    session = vi.spyOn(sessionStorage, "setItem");
  state.call
    .mockRejectedValueOnce({ code: "functions/unavailable" })
    .mockResolvedValueOnce(value);
  await render();
  await click();
  expect(host.textContent).toContain("Chưa xử lý được");
  await click();
  expect(state.call.mock.calls[1][1].operationId).toBe(
    state.call.mock.calls[0][1].operationId,
  );
  expect(host.textContent).toContain(code);
  expect(local).not.toHaveBeenCalled();
  expect(session).not.toHaveBeenCalled();
});
it("N25 malformed issuance result cannot expose code or private fields", async () => {
  state.call.mockResolvedValue({ ...value, phone: "PRIVATE_CANARY" });
  await render();
  await click();
  expect(host.textContent).not.toContain(code);
  expect(host.textContent).not.toContain("PRIVATE_CANARY");
  expect(host.textContent).toContain("Chưa xử lý được");
});
it("N28 revision switch fences issuance response", async () => {
  let resolve!: (v: unknown) => void;
  state.call.mockReturnValueOnce(new Promise((r) => (resolve = r)));
  await render();
  await click();
  await render("owner", 2);
  await act(async () => resolve(value));
  expect(host.textContent).not.toContain(code);
});

it("stale revoke retry shows recovery instead of claiming replacement code is revoked", async () => {
  state.call
    .mockRejectedValueOnce({ code: "functions/unavailable" })
    .mockRejectedValueOnce({ code: "functions/failed-precondition" });
  await render();
  const revoke = () =>
    act(async () =>
      host.querySelectorAll<HTMLButtonElement>("button")[1].click(),
    );
  await revoke();
  await revoke();
  expect(state.call.mock.calls[1][1].operationId).toBe(
    state.call.mock.calls[0][1].operationId,
  );
  expect(state.call.mock.calls[1][1].action).toBe("revoke");
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    "Chưa xử lý được mã tra cứu",
  );
  expect(host.textContent).not.toContain("Đã thu hồi mã tra cứu.");
  expect(host.querySelectorAll<HTMLButtonElement>("button")[1].disabled).toBe(false);
});

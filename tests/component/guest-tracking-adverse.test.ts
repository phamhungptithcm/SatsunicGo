import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
const state = vi.hoisted(() => {
  const commerce = {
    user: null as null | { uid: string },
    conversationId: null as string | null,
    restorationReady: true,
    busy: false,
    pendingOperation: null,
    draft: {},
    order: null,
    conversation: null,
    error: null,
    resolved: vi.fn(),
    resume: vi.fn(),
  };
  return {
    commerce,
    auth: { currentUser: null as null | { uid: string } },
    listeners: new Set<(user: null | { uid: string }) => void>(),
    call: vi.fn(),
    analytics: vi.fn(),
    provider: vi.fn(),
    invalidate: vi.fn(),
    prepare: vi.fn(),
  };
});
vi.mock("../../src/shared/firebase", () => ({
  auth: state.auth,
  callService: state.call,
}));
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (
    _: unknown,
    listener: (user: null | { uid: string }) => void,
  ) => {
    state.listeners.add(listener);
    return () => state.listeners.delete(listener);
  },
}));
vi.mock("../../src/shared/analytics", () => ({ trackAsk: state.analytics }));
vi.mock("../../src/features/ask/transport", () => ({
  askService: state.provider,
  askRateLimited: () => false,
}));
vi.mock("../../src/features/ask/Commerce", () => ({
  useAskCommerce: () => state.commerce,
  CommercePanel: () => null,
  askReadinessMessage: () => "",
}));
vi.mock("../../src/features/ask/useActionPreview", () => ({
  useActionPreview: () => ({
    commerce: state.commerce,
    invalidate: state.invalidate,
    preview: null,
    hideReview: vi.fn(),
  }),
}));
vi.mock("../../src/features/ask/ImageIntake", () => ({
  useAskImages: () => ({
    photos: [],
    working: false,
    error: null,
    prepare: state.prepare,
    add: vi.fn(),
    remove: vi.fn(),
    markSent: vi.fn(),
  }),
}));
vi.mock("../../src/features/ask/CustomerWorkspace", () => ({
  CustomerWorkspace: () => null,
}));
vi.mock("../../src/features/ask/AnswerFeedback", () => ({
  AnswerFeedback: () => null,
}));
vi.mock("../../src/features/ask/ActionWindow", () => ({
  ActionWindow: () => null,
  actionLabel: () => "",
}));
vi.mock("../../src/features/ask/CatalogChat", () => ({
  CatalogChat: () => null,
}));
vi.mock("../../src/features/ask/WebDiscovery", () => ({
  WebDiscovery: () => null,
}));
vi.mock("../../src/features/ask/catalog-search", () => ({
  searchPublishedCatalog: vi.fn(),
}));
import { Ask } from "../../src/features/ask/Ask";
const A = "SGT-" + "a".repeat(64),
  B = "SGT-" + "b".repeat(64);
const now = 1800000000000;
const dto = (publicStatus = "shipping") => ({
  publicStatus,
  observedAt: now,
  updatedAt: now - 1000,
  eta: null,
});
function deferred() {
  let resolve!: (value: unknown) => void, reject!: (value: unknown) => void;
  const promise = new Promise((r, j) => {
    resolve = r;
    reject = j;
  });
  return { promise, resolve, reject };
}
let root: Root, host: HTMLDivElement;
const text = () => host.querySelector('[role="log"]')?.textContent || "";
const input = () =>
  host.querySelector<HTMLDialogElement>("dialog")!.open
    ? host.querySelector<HTMLInputElement>("dialog input[aria-label]")!
    : host.querySelector<HTMLInputElement>("aside input[aria-label]")!;
async function submit(value: string) {
  await act(async () => {
    const element = input();
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    input()
      .closest("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}
async function signIn(uid: string | null) {
  await act(async () => {
    state.auth.currentUser = uid ? { uid } : null;
    state.commerce.user = state.auth.currentUser;
    state.commerce.conversationId = uid ? `conversation-${uid}` : null;
    for (const listener of state.listeners) listener(state.auth.currentUser);
  });
}
function privacy() {
  expect(host.innerHTML).not.toMatch(
    /SGT-[a-f0-9]{64}|PRIVATE_CANARY|owner-secret@example/,
  );
  expect(
    JSON.stringify(
      [localStorage, sessionStorage].map((storage) =>
        Array.from({ length: storage.length }, (_, index) => {
          const key = storage.key(index)!;
          return [key, storage.getItem(key)];
        }),
      ),
    ),
  ).not.toMatch(/SGT-|PRIVATE_CANARY|owner-secret@example/);
  expect(state.analytics).not.toHaveBeenCalled();
  expect(state.provider).not.toHaveBeenCalled();
  expect(state.commerce.resolved).not.toHaveBeenCalled();
  expect(state.prepare).not.toHaveBeenCalled();
  expect(
    state.call.mock.calls.every(
      ([name, args]) =>
        name === "publicOrderTracking" && Object.keys(args).join() === "code",
    ),
  ).toBe(true);
}
beforeEach(async () => {
  vi.clearAllMocks();
  state.listeners.clear();
  state.auth.currentUser = null;
  Object.assign(state.commerce, { user: null, conversationId: null });
  localStorage.clear();
  sessionStorage.clear();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root.render(createElement(MemoryRouter, null, createElement(Ask)));
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});
it("offline rejects safely, re-entering code retries successfully without private sinks", async () => {
  state.call.mockRejectedValueOnce(
    Object.assign(new Error("PRIVATE_CANARY"), {
      code: "functions/unavailable",
    }),
  );
  await submit(A);
  expect(text()).toContain("Kiểm tra kết nối");
  privacy();
  state.call.mockResolvedValueOnce(dto());
  await submit(A);
  expect(host.querySelector('[aria-current="step"]')?.textContent).toContain(
    "Đang vận chuyển",
  );
  privacy();
});
it.each([
  null,
  undefined,
  "PRIVATE_CANARY",
  { code: "PRIVATE_CANARY", message: "owner-secret@example" },
])("unknown rejection %s shows safe recovery", async (error) => {
  state.call.mockRejectedValueOnce(error);
  await submit(A);
  expect(text()).toContain("Kiểm tra kết nối");
  privacy();
});
it("15s timeout settles pending UI and late SDK success never replaces newer response", async () => {
  const late = deferred();
  state.call.mockReturnValueOnce(late.promise);
  let timeout!: AbortController;
  vi.spyOn(AbortSignal, "timeout").mockImplementation((ms) => {
    expect(ms).toBe(15000);
    timeout = new AbortController();
    return timeout.signal;
  });
  await submit(A);
  await act(async () =>
    timeout.abort(new DOMException("PRIVATE_CANARY", "TimeoutError")),
  );
  expect(text()).toContain("Tra cứu mất nhiều thời gian");
  state.call.mockResolvedValueOnce(dto("preparing"));
  await submit(B);
  await act(async () => late.resolve(dto("delivered")));
  expect(host.querySelectorAll("section.orderTracking")).toHaveLength(1);
  expect(host.querySelector('[aria-current="step"]')?.textContent).toContain(
    "Đang chuẩn bị",
  );
  privacy();
});
it.each(["login", "logout", "A→B→A"])(
  "%s while pending clears old turns and ignores late success",
  async (scenario) => {
    if (scenario !== "login") await signIn("A");
    const pending = deferred();
    state.call.mockReturnValueOnce(pending.promise);
    await submit(A);
    if (scenario === "login") await signIn("B");
    else if (scenario === "logout") await signIn(null);
    else {
      await signIn("B");
      await signIn("A");
    }
    await act(async () => pending.resolve(dto("delivered")));
    expect(text()).toBe("");
    expect(input().value).toBe("");
    state.call.mockResolvedValueOnce(dto("preparing"));
    await submit(B);
    expect(host.querySelector('[aria-current="step"]')?.textContent).toContain(
      "Đang chuẩn bị",
    );
    privacy();
  },
);
it.each(["old-first", "old-last"])(
  "lookup A1→B→A2 %s cannot publish either superseded response",
  async (order) => {
    const first = deferred(),
      second = deferred(),
      third = deferred();
    state.call
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockReturnValueOnce(third.promise);
    await submit(A);
    await submit(B);
    await submit(A);
    if (order === "old-first")
      await act(async () => {
        first.resolve(dto("delivered"));
        second.resolve(dto("received"));
      });
    await act(async () => third.resolve(dto("preparing")));
    if (order === "old-last")
      await act(async () => {
        second.resolve(dto("received"));
        first.resolve(dto("delivered"));
      });
    expect(state.call.mock.calls.map(([, args]) => args.code)).toEqual([
      A,
      B,
      A,
    ]);
    expect(host.querySelectorAll("section.orderTracking")).toHaveLength(1);
    expect(host.querySelector('[aria-current="step"]')?.textContent).toContain(
      "Đang chuẩn bị",
    );
    privacy();
  },
);
it("late rejection after account change cannot reveal SDK diagnostic or block next lookup", async () => {
  const pending = deferred();
  state.call.mockReturnValueOnce(pending.promise);
  await submit(A);
  await signIn("B");
  await act(async () =>
    pending.reject({ code: "functions/internal", message: "PRIVATE_CANARY" }),
  );
  expect(text()).toBe("");
  state.call.mockResolvedValueOnce(dto());
  await submit(B);
  privacy();
});
it("untrusted DTO with private field is rejected before rendering", async () => {
  state.call.mockResolvedValueOnce({ ...dto(), address: "PRIVATE_CANARY" });
  await submit(A);
  expect(text()).toContain("Kiểm tra kết nối");
  expect(host.querySelector("section.orderTracking")).toBeNull();
  privacy();
});
it("async completion preserves focus moved to another control", async () => {
  const pending = deferred();
  state.call.mockReturnValueOnce(pending.promise);
  await submit(A);
  const control = [
    ...host.querySelectorAll<HTMLButtonElement>("dialog button"),
  ].find((button) => button.textContent === "EN")!;
  control.focus();
  expect(document.activeElement).toBe(control);
  await act(async () => pending.resolve(dto()));
  expect(document.activeElement).toBe(control);
  privacy();
});
it("keyboard stop cancels pending result and modal exposes named log and labelled controls", async () => {
  const pending = deferred();
  state.call.mockReturnValueOnce(pending.promise);
  await submit(A);
  const stop = host.querySelector<HTMLButtonElement>(
    'dialog button[aria-label="Dừng câu trả lời"]',
  );
  expect(stop).not.toBeNull();
  stop!.focus();
  await act(async () => stop!.click());
  expect(document.activeElement).toBe(input());
  await act(async () => pending.resolve(dto("delivered")));
  expect(host.querySelector("section.orderTracking")).toBeNull();
  expect(host.querySelector("dialog")?.getAttribute("aria-labelledby")).toBe(
    "ask-title",
  );
  expect(
    host.querySelector('[role="log"]')?.getAttribute("aria-label"),
  ).toBeTruthy();
  expect(input().getAttribute("aria-label")).toBe("Hỏi SatsunicGo");
  privacy();
});
it("native 15000ms deadline releases a permanently hanging SDK request", async () => {
  state.call.mockReturnValueOnce(new Promise(() => {}));
  await submit(A);
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 15100));
  });
  expect(text()).toContain("Tra cứu mất nhiều thời gian");
  state.call.mockResolvedValueOnce(dto());
  await submit(B);
  expect(host.querySelector('[aria-current="step"]')).not.toBeNull();
  privacy();
}, 20000);
it("close aborts pending request and late success stays absent after reopen", async () => {
  const pending = deferred();
  state.call.mockReturnValueOnce(pending.promise);
  await submit(A);
  await act(async () =>
    host
      .querySelector<HTMLButtonElement>(
        'dialog button[aria-label="Đóng hội thoại"]',
      )!
      .click(),
  );
  await act(async () => pending.resolve(dto("delivered")));
  expect(host.querySelector("dialog")!.open).toBe(false);
  expect(host.querySelector("section.orderTracking")).toBeNull();
  privacy();
});
it("auth transition forgets selected code so a followup cannot query previous visitor capability", async () => {
  state.call.mockResolvedValueOnce(dto());
  await submit(A);
  await signIn("B");
  await signIn(null);
  await submit("tra đơn");
  expect(state.call).toHaveBeenCalledTimes(1);
  expect(text()).toMatch(/mã tra cứu/);
  privacy();
});
it("initial same-uid auth event preserves an active request", async () => {
  const pending = deferred();
  state.call.mockReturnValueOnce(pending.promise);
  await submit(A);
  await signIn(null);
  await act(async () => pending.resolve(dto()));
  expect(host.querySelector('[aria-current="step"]')).not.toBeNull();
  privacy();
});
it("unmount removes auth subscription and ignores late SDK response", async () => {
  const pending = deferred();
  state.call.mockReturnValueOnce(pending.promise);
  await submit(A);
  await act(async () => root.unmount());
  expect(state.listeners.size).toBe(0);
  await act(async () => pending.resolve(dto("delivered")));
  expect(host.innerHTML).toBe("");
  privacy();
});
it("scrollable conversation is a keyboard stop and language choices form a named group", async () => {
  state.call.mockResolvedValueOnce(dto());
  await submit(A);
  const log = host.querySelector<HTMLElement>('[role="log"]')!;
  expect(log.tabIndex).toBe(0);
  log.focus();
  expect(document.activeElement).toBe(log);
  expect(
    host.querySelector('[role="group"][aria-label="Ngôn ngữ"]'),
  ).not.toBeNull();
  privacy();
});
it("cancelled guest lookup offers honest recovery without retrying a redacted question", async () => {
  const pending = deferred();
  state.call.mockReturnValueOnce(pending.promise);
  await submit(A);
  await act(async () =>
    host
      .querySelector<HTMLButtonElement>(
        'dialog button[aria-label="Dừng câu trả lời"]',
      )!
      .click(),
  );
  expect(text()).toContain("Nhập lại mã để thử lại");
  expect(host.querySelector('[role="log"] button')).toBeNull();
  expect(host.querySelector('[role="log"] a')).toBeNull();
  privacy();
});
it.each(["vi", "en"])(
  "%s unexpected SDK diagnostic shows guest recovery without private CTAs",
  async (language) => {
    await submit("tra đơn");
    if (language === "en")
      await act(async () =>
        [...host.querySelectorAll<HTMLButtonElement>("dialog button")]
          .find((button) => button.textContent === "EN")!
          .click(),
      );
    state.call.mockRejectedValueOnce(
      Object.defineProperty({}, "code", {
        get() {
          throw Error("PRIVATE_CANARY");
        },
      }),
    );
    await submit(A);
    expect(text()).toContain(
      language === "vi"
        ? "Chưa thể tra cứu lúc này. Nhập lại mã để thử lại."
        : "Tracking is unavailable. Enter the code again to retry.",
    );
    expect(host.querySelector('[role="log"] button')).toBeNull();
    privacy();
  },
);
it("English cancellation keeps keyboard focus and asks for the code again", async () => {
  await submit("tra đơn");
  await act(async () =>
    [...host.querySelectorAll<HTMLButtonElement>("dialog button")]
      .find((button) => button.textContent === "EN")!
      .click(),
  );
  state.call.mockReturnValueOnce(new Promise(() => {}));
  await submit(A);
  const stop = host.querySelector<HTMLButtonElement>(
    'dialog button[aria-label="Stop response"]',
  )!;
  stop.focus();
  await act(async () => stop.click());
  expect(text()).toContain("Tracking stopped. Enter the code again to retry.");
  expect(document.activeElement).toBe(input());
  privacy();
});

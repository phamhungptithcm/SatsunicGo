import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
const state = vi.hoisted(() => ({
  auth: { currentUser: null as null | { uid: string } },
  listeners: new Set<(user: null | { uid: string }) => void>(),
  snapshots: [] as {
    next: (snap: unknown) => void;
    error: () => void;
    path: string;
  }[],
  call: vi.fn(),
}));
vi.mock("../../src/shared/firebase", () => ({
  auth: state.auth,
  db: {},
  callService: state.call,
  login: vi.fn(),
}));
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (
    _: unknown,
    callback: (u: null | { uid: string }) => void,
  ) => {
    state.listeners.add(callback);
    callback(state.auth.currentUser);
    return () => state.listeners.delete(callback);
  },
}));
vi.mock("firebase/firestore", () => ({
  doc: (_: unknown, collection: string, id: string) => `${collection}/${id}`,
  onSnapshot: (
    path: string,
    _: unknown,
    next: (snap: unknown) => void,
    error: () => void,
  ) => {
    state.snapshots.push({ path, next, error });
    return vi.fn();
  },
  collection: vi.fn(),
  limit: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));
import { useAskCommerce } from "../../src/features/ask/Commerce";
const cid = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const restore = vi.fn();
let current: ReturnType<typeof useAskCommerce>,
  root: Root,
  host: HTMLDivElement;
function Probe() {
  current = useAskCommerce(restore);
  return createElement("output", null, String(current.restorationReady));
}
async function auth(uid: string | null) {
  await act(async () => {
    state.auth.currentUser = uid ? { uid } : null;
    for (const callback of state.listeners) callback(state.auth.currentUser);
  });
}
async function snapshot(
  raw: unknown,
  fromCache = false,
  index = state.snapshots.length - 1,
) {
  await act(async () =>
    state.snapshots[index].next({ data: () => raw, metadata: { fromCache } }),
  );
}
const conversation = (ownerId = "alice") => ({
  ownerId,
  version: 0,
  updatedAt: 1,
  turns: [],
});
beforeEach(async () => {
  vi.clearAllMocks();
  state.listeners.clear();
  state.snapshots = [];
  state.auth.currentUser = null;
  state.call.mockResolvedValue({ conversationId: cid });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(createElement(Probe)));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
it("probes authenticated admission without an opt-in build flag and waits for verified server hydration", async () => {
  expect(state.call).not.toHaveBeenCalled();
  await auth("alice");
  expect(state.call).toHaveBeenCalledExactlyOnceWith(
    "currentAskConversation",
    {},
  );
  expect(current.restorationReady).toBe(false);
  await snapshot(conversation(), true);
  expect(current.restorationReady).toBe(false);
  await snapshot(conversation());
  expect(current.restorationReady).toBe(true);
  expect(restore).toHaveBeenLastCalledWith(conversation(), "hydrate");
});
it.each([
  null,
  undefined,
  {},
  { conversationId: null },
  { conversationId: "../foreign" },
  { conversationId: cid, secret: "private" },
])(
  "rejects malformed admission response %j without a generated ID or private listener",
  async (response) => {
    state.call.mockResolvedValue(response);
    await auth("alice");
    expect(current.conversationId).toBeUndefined();
    expect(current.restorationReady).toBe(false);
    expect(state.snapshots).toHaveLength(0);
    expect(current.error).not.toContain("private");
  },
);
it.each(["permission-denied", "unavailable", "deadline-exceeded"])(
  "%s leaves admission closed without exposing raw errors",
  async (code) => {
    state.call.mockRejectedValue(
      Object.assign(new Error("private-secret"), { code }),
    );
    await auth("alice");
    expect(current.restorationReady).toBe(false);
    expect(current.conversationId).toBeUndefined();
    expect(current.error).not.toContain("private-secret");
  },
);
it.each([undefined, {}, conversation("bob")])(
  "missing/malformed/foreign snapshot cannot admit UI: %j",
  async (raw) => {
    await auth("alice");
    await snapshot(raw);
    expect(current.restorationReady).toBe(false);
    expect(current.conversation).toBeNull();
    expect(restore).toHaveBeenLastCalledWith({ ...conversation(), updatedAt: 0 }, "hydrate");
  },
);
it("listener failure closes admission, cached data cannot reopen, verified recovery can", async () => {
  await auth("alice");
  await snapshot(conversation());
  expect(current.restorationReady).toBe(true);
  await act(async () => state.snapshots.at(-1)!.error());
  expect(current.restorationReady).toBe(false);
  await snapshot(conversation(), true);
  expect(current.restorationReady).toBe(false);
  await snapshot(conversation());
  expect(current.restorationReady).toBe(true);
});
it("A-B-A delayed admission and old snapshots cannot revive an earlier generation", async () => {
  let resolve!: (value: unknown) => void;
  state.call.mockReturnValueOnce(
    new Promise((r) => {
      resolve = r;
    }),
  );
  await auth("alice");
  await auth("bob");
  const oldBob = state.snapshots.length - 1;
  await auth("alice");
  await snapshot(conversation());
  const count = state.snapshots.length;
  await act(async () =>
    resolve({ conversationId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }),
  );
  expect(state.snapshots).toHaveLength(count);
  expect(current.conversationId).toBe(cid);
  await snapshot(conversation("bob"), false, oldBob);
  expect(current.conversation?.ownerId).toBe("alice");
  await auth(null);
  await snapshot(conversation());
  expect(current.restorationReady).toBe(false);
  expect(current.conversation).toBeNull();
});

it("invalid snapshot after a restored private conversation resets the old UI instead of retaining it", async () => {
  await auth("alice");
  await snapshot(conversation());
  await snapshot(conversation("bob"));
  expect(current.restorationReady).toBe(false);
  expect(current.conversation).toBeNull();
  expect(restore).toHaveBeenLastCalledWith({ ...conversation(), updatedAt: 0 }, undefined);
});

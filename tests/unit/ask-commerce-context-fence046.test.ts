import { describe, expect, it, vi } from "vitest";
// Controller-only evidence: no SDK instantiation or fake workflow success.
vi.mock("../../src/shared/firebase", () => ({
  auth: null,
  db: null,
  callService: vi.fn(),
  login: vi.fn(),
}));
import { createCommerceContextFence } from "../../src/features/ask/Commerce";
function deferred() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}
describe("actual Commerce UI context ownership", () => {
  it("auth before React identity updates immediately rejects old private context", () => {
    const fence = createCommerceContextFence();
    fence.reset("alice", "a");
    const priorRender = fence.snapshot();
    expect(fence.current(priorRender, "alice")).toBe(true);
    expect(fence.current(priorRender, null)).toBe(false);
    expect(fence.current(priorRender, "bob")).toBe(false);
  });
  it("guest answer completion cannot populate signed-in catalog/draft", async () => {
    const fence = createCommerceContextFence(),
      held = deferred();
    const guest = fence.snapshot();
    let slugs = ["new-customer-product"];
    const old = held.promise.then(() => {
      if (fence.current(guest, "alice")) slugs = ["old-guest-product"];
    });
    fence.reset("alice", "a");
    held.release();
    await old;
    expect(slugs).toEqual(["new-customer-product"]);
  });
  it("old snapshot and error delivery cannot replace a new conversation", async () => {
    const fence = createCommerceContextFence(),
      held = deferred();
    fence.reset("alice", "a");
    const oldScope = fence.snapshot();
    let order = "new-order",
      error = "";
    const old = held.promise.then(() => {
      if (fence.current(oldScope, "alice")) {
        order = "old-order";
        error = "old error";
      }
    });
    fence.reset("alice", "b");
    held.release();
    await old;
    expect({ order, error }).toEqual({ order: "new-order", error: "" });
  });
  it("signout then same UID and conversation restoration fences ABA responses", async () => {
    const fence = createCommerceContextFence(),
      held = deferred();
    fence.reset("alice", "a");
    const oldScope = fence.snapshot(),
      token = fence.begin();
    let changed = false;
    const old = held.promise.then(() => {
      changed =
        fence.current(oldScope, "alice") ||
        fence.ownsBusy(oldScope, token, "alice");
    });
    fence.reset(null, undefined);
    fence.reset("alice", "a");
    held.release();
    await old;
    expect(changed).toBe(false);
    expect(fence.current(fence.snapshot(), "alice")).toBe(true);
  });
  it("late failed operation cleanup cannot unlock newer busy operation", async () => {
    const fence = createCommerceContextFence(),
      held = deferred();
    fence.reset("alice", "a");
    const scope = fence.snapshot(),
      oldToken = fence.begin();
    let busy = true;
    const old = held.promise.then(() => {
      if (fence.ownsBusy(scope, oldToken, "alice")) busy = false;
    });
    const newToken = fence.begin();
    held.release();
    await old;
    expect(busy).toBe(true);
    expect(fence.ownsBusy(scope, oldToken, "alice")).toBe(false);
    expect(fence.ownsBusy(scope, newToken, "alice")).toBe(true);
  });
  it("current completion is permitted and context reset revokes current busy ownership", () => {
    const fence = createCommerceContextFence();
    fence.reset("alice", "a");
    const scope = fence.snapshot(),
      token = fence.begin();
    expect(fence.ownsBusy(scope, token, "alice")).toBe(true);
    fence.reset("alice", "b");
    expect(fence.ownsBusy(scope, token, "alice")).toBe(false);
  });
});

describe("consumed Commerce panel resource fences", () => {
  it("late address/recipient callback is fenced by resource version and actual auth", async () => {
    const fence = createCommerceContextFence(),
      held = deferred();
    const resource = (version: number) =>
      JSON.stringify(["chat-a", "order-a", version]);
    fence.reset("alice", resource(1));
    const snapshot = fence.snapshot();
    let recipient = "current recipient";
    const old = held.promise.then(() => {
      if (fence.current(snapshot, "alice")) recipient = "old recipient";
    });
    fence.reset("alice", resource(2));
    held.release();
    await old;
    expect(recipient).toBe("current recipient");
    expect(fence.current(fence.snapshot(), "bob")).toBe(false);
  });
  it("same UID/CID/order/version ABA cannot revive old payment completion", async () => {
    const fence = createCommerceContextFence(),
      held = deferred();
    const key = JSON.stringify(["chat-a", "order-a", 4]);
    fence.reset("alice", key);
    const scope = fence.snapshot(),
      token = fence.begin();
    let checkout = "";
    const old = held.promise.then(() => {
      if (fence.ownsBusy(scope, token, "alice")) checkout = "old payment link";
    });
    fence.reset(null, undefined);
    fence.reset("alice", key);
    held.release();
    await old;
    expect(checkout).toBe("");
    expect(fence.current(fence.snapshot(), "alice")).toBe(true);
  });
  it("auth-before-render payment response cannot publish link, error or busy completion", () => {
    const fence = createCommerceContextFence();
    fence.reset("alice", JSON.stringify(["chat-a", "order-a", 4]));
    const scope = fence.snapshot(),
      token = fence.begin();
    expect(fence.ownsBusy(scope, token, "alice")).toBe(true);
    expect(fence.ownsBusy(scope, token, null)).toBe(false);
    expect(fence.ownsBusy(scope, token, "bob")).toBe(false);
  });
  it("effect cleanup and subsequent setup preserve fresh current ownership only", () => {
    const fence = createCommerceContextFence();
    const key = JSON.stringify(["chat-a", "order-a", 4]);
    fence.reset("alice", key);
    const old = fence.snapshot(),
      token = fence.begin();
    fence.reset(null, undefined);
    fence.reset("alice", key);
    expect(fence.ownsBusy(old, token, "alice")).toBe(false);
    const fresh = fence.snapshot(),
      freshToken = fence.begin();
    expect(fence.ownsBusy(fresh, freshToken, "alice")).toBe(true);
  });
});

describe("consumed parent authority before child commit", () => {
  it("A guest A before render or cleanup cannot revive old local payment/address callbacks", async () => {
    const parent = createCommerceContextFence(),
      child = createCommerceContextFence();
    const resource = JSON.stringify(["chat-a", "order-a", 4]);
    parent.reset("alice", resource);
    child.reset("alice", resource);
    const parentScope = parent.snapshot(),
      childScope = child.snapshot(),
      token = child.begin();
    const held = deferred();
    let published = false;
    const old = held.promise.then(() => {
      if (
        parent.current(parentScope, "alice") &&
        child.ownsBusy(childScope, token, "alice")
      )
        published = true;
    });
    // No child reset/remount: parent invalidation must work synchronously.
    parent.reset(null, resource);
    parent.reset("alice", resource);
    expect(child.ownsBusy(childScope, token, "alice")).toBe(true);
    expect(parent.current(parentScope, "alice")).toBe(false);
    held.release();
    await old;
    expect(published).toBe(false);
  });
  it("parent resource advances before old child cleanup, rejecting old recipient/error callback", async () => {
    const parent = createCommerceContextFence(),
      child = createCommerceContextFence();
    parent.reset("alice", JSON.stringify(["chat-a", "order-a", 4]));
    child.reset("alice", JSON.stringify(["chat-a", "order-a", 4]));
    const parentScope = parent.snapshot(),
      childScope = child.snapshot(),
      held = deferred();
    let error = "",
      recipient = "current";
    const old = held.promise.then(() => {
      if (
        parent.current(parentScope, "alice") &&
        child.current(childScope, "alice")
      ) {
        error = "old error";
        recipient = "old";
      }
    });
    parent.reset("alice", JSON.stringify(["chat-b", "order-b", 1]));
    expect(child.current(childScope, "alice")).toBe(true);
    expect(parent.current(parentScope, "alice")).toBe(false);
    held.release();
    await old;
    expect({ error, recipient }).toEqual({ error: "", recipient: "current" });
  });
});

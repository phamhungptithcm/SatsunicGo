import { describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import {
  mergeCart,
  type CartCommand,
  type CartItem,
} from "../../packages/domain/cart";
import {
  guestSchema,
  readGuestTransfer,
  reconcileGuestTransfer,
  transferGuestCart,
  type TransferOutcome,
} from "../../src/features/cart/cart-guest-transfer";

const key = "synthetic-guest-cart",
  ownerId = "synthetic-owner";
function fixture() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
  const item: CartItem = {
    lineId: randomUUID(),
    productId: "synthetic-product",
    variant: "Blue",
    quantity: 2,
  };
  const save = (items = [item]) =>
    storage.setItem(
      key,
      JSON.stringify({ version: 1, revision: 1, items, appliedMerges: [] }),
    );
  save();
  let tail = Promise.resolve();
  const lock = <T>(run: () => Promise<T>) => {
    const next = tail.then(run);
    tail = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  };
  const commands = new Map<string, string>();
  const account = {
    revision: 0,
    items: [] as CartItem[],
    activeCheckoutId: null as string | null,
  };
  const send = vi.fn(async (command: CartCommand): Promise<TransferOutcome> => {
    if (command.action !== "merge") throw Error("Unexpected command");
    expect(readGuestTransfer(storage, key)?.command).toEqual(command);
    const previous = commands.get(command.operationId);
    if (previous) expect(previous).toBe(JSON.stringify(command));
    else {
      if (command.expectedRevision !== account.revision) return "rejected";
      account.items = mergeCart(account.items, command.items);
      account.revision++;
      commands.set(command.operationId, JSON.stringify(command));
    }
    return "confirmed";
  });
  const input = {
    storage,
    key,
    ownerId,
    current: () => account,
    active: () => true,
    lock,
    send,
  };
  const guest = () => guestSchema.parse(JSON.parse(storage.getItem(key)!));
  return { values, storage, item, save, guest, account, commands, send, input };
}

describe("guest cart continuity", () => {
  it("transfers once, preserves variants and existing account quantities", async () => {
    const f = fixture();
    f.account.items = [
      { ...f.item, lineId: randomUUID(), quantity: 3 },
      { ...f.item, lineId: randomUUID(), variant: "White", quantity: 1 },
    ];
    expect(await transferGuestCart(f.input)).toBe("confirmed");
    expect(f.account.items.map((item) => item.quantity)).toEqual([5, 1]);
    expect(f.guest().items).toEqual([]);
    expect(readGuestTransfer(f.storage, key)).toBeNull();
    await transferGuestCart(f.input);
    expect(f.send).toHaveBeenCalledTimes(1);
  });
  it("serializes simultaneous tabs without double quantities", async () => {
    const f = fixture();
    await Promise.all([
      transferGuestCart(f.input),
      transferGuestCart(f.input),
      transferGuestCart(f.input),
    ]);
    expect(f.account.items[0].quantity).toBe(2);
    expect(f.send).toHaveBeenCalledTimes(1);
  });
  it("replays the exact command after a commit with a lost response, even when the account revision advanced", async () => {
    const f = fixture(),
      original = f.send;
    let lose = true;
    f.input.send = vi.fn(async (command) => {
      const outcome = await original(command);
      if (lose) {
        lose = false;
        return "uncertain";
      }
      return outcome;
    });
    expect(await transferGuestCart(f.input)).toBe("uncertain");
    const pending = readGuestTransfer(f.storage, key)!;
    expect(f.guest().items).toEqual([f.item]);
    f.account.revision += 4;
    expect(await transferGuestCart(f.input)).toBe("confirmed");
    expect(original.mock.calls[1][0]).toEqual(pending.command);
    expect(f.account.items[0].quantity).toBe(2);
  });
  it("never sends if the durable journal cannot be written", async () => {
    const f = fixture();
    vi.spyOn(f.storage, "setItem").mockImplementation(() => {
      throw Error("Storage unavailable");
    });
    await expect(transferGuestCart(f.input)).rejects.toThrow();
    expect(f.send).not.toHaveBeenCalled();
    expect(f.guest().items).toEqual([f.item]);
  });
  it("preserves the journal and source if reconciliation storage fails after the remote commit", async () => {
    const f = fixture(),
      write = f.storage.setItem;
    vi.spyOn(f.storage, "setItem").mockImplementation((target, value) => {
      if (target === key) throw Error("Quota");
      write(target, value);
    });
    await expect(transferGuestCart(f.input)).rejects.toThrow("Quota");
    expect(f.account.items[0].quantity).toBe(2);
    expect(f.guest().items).toEqual([f.item]);
    expect(readGuestTransfer(f.storage, key)).not.toBeNull();
    vi.restoreAllMocks();
    await transferGuestCart(f.input);
    expect(f.account.items[0].quantity).toBe(2);
    expect(f.guest().items).toEqual([]);
  });
  it("keeps a reconciliation tombstone when journal removal fails and preserves a later addition", async () => {
    const f = fixture(),
      remove = f.storage.removeItem;
    vi.spyOn(f.storage, "removeItem").mockImplementation(() => {
      throw Error("Storage unavailable");
    });
    await expect(transferGuestCart(f.input)).rejects.toThrow();
    const guest = f.guest();
    f.storage.setItem(
      key,
      JSON.stringify({
        ...guest,
        items: [{ ...f.item, quantity: 1 }],
        revision: guest.revision + 1,
      }),
    );
    vi.restoreAllMocks();
    f.storage.removeItem = remove;
    await transferGuestCart(f.input);
    expect(f.account.items[0].quantity).toBe(3);
    expect(f.commands.size).toBe(2);
    expect(f.guest().items).toEqual([]);
  });
  it("preserves guest choices and clears only a definitely rejected transfer", async () => {
    const f = fixture();
    f.input.send = vi.fn(async () => "rejected");
    expect(await transferGuestCart(f.input)).toBe("rejected");
    expect(readGuestTransfer(f.storage, key)).toBeNull();
    expect(f.guest().items).toEqual([f.item]);
    expect(f.account.items).toEqual([]);
  });
  it("defers active checkout without writing or sending", async () => {
    const f = fixture();
    f.account.activeCheckoutId = randomUUID();
    expect(await transferGuestCart(f.input)).toBe("deferred");
    expect(f.send).not.toHaveBeenCalled();
    expect(readGuestTransfer(f.storage, key)).toBeNull();
  });
  it("never transfers an uncertain command to a different account", async () => {
    const f = fixture();
    f.input.send = vi.fn(async () => "uncertain");
    await transferGuestCart(f.input);
    const before = f.storage.getItem(`${key}:transfer`);
    await expect(
      transferGuestCart({ ...f.input, ownerId: "other-owner" }),
    ).rejects.toThrow("tài khoản trước");
    expect(f.input.send).toHaveBeenCalledTimes(1);
    expect(f.storage.getItem(`${key}:transfer`)).toBe(before);
  });
  it("does not reconcile or discard journal when the account changes during the request", async () => {
    const f = fixture();
    let active = true;
    f.input.active = () => active;
    f.input.send = vi.fn(async (command) => {
      const result = await f.send(command);
      active = false;
      return result;
    });
    expect(await transferGuestCart(f.input)).toBe("deferred");
    expect(f.guest().items).toEqual([f.item]);
    expect(readGuestTransfer(f.storage, key)).not.toBeNull();
  });
  it("reconciles only the submitted quantity and preserves a concurrent addition", async () => {
    const f = fixture();
    f.input.send = vi.fn(async (command) => {
      const result = await f.send(command);
      f.save([{ ...f.item, quantity: 5 }]);
      return result;
    });
    await transferGuestCart(f.input);
    expect(f.guest().items[0].quantity).toBe(3);
    expect(f.account.items[0].quantity).toBe(2);
  });
  it("rejects corrupt, injected or unbounded guest storage without a remote request", async () => {
    for (const value of [
      "{",
      JSON.stringify({
        version: 1,
        revision: 0,
        items: [{ ...fixture().item, quantity: 101 }],
      }),
      JSON.stringify({
        version: 1,
        revision: 0,
        items: [{ ...fixture().item, price: 1 }],
      }),
    ]) {
      const f = fixture();
      f.storage.setItem(key, value);
      await expect(transferGuestCart(f.input)).rejects.toThrow();
      expect(f.send).not.toHaveBeenCalled();
    }
  });
});

it("unrelated account additions do not mutate guest choices or age reconciliation markers", () => {
  const f = fixture(),
    before = f.storage.getItem(key);
  reconcileGuestTransfer(f.storage, key, {
    action: "merge",
    operationId: randomUUID(),
    expectedRevision: 0,
    items: [{ ...f.item, lineId: randomUUID() }],
  });
  expect(f.storage.getItem(key)).toBe(before);
});

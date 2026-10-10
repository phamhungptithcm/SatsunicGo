import { z } from "zod";
import {
  cartCommandSchema,
  cartItemsSchema,
  cartKey,
  consumeCart,
  type CartCommand,
} from "../../../packages/domain/cart";

export const guestSchema = z.object({
  version: z.literal(1),
  revision: z.number().int().nonnegative(),
  items: cartItemsSchema,
  appliedMerges: z.array(z.string().uuid()).max(100).default([]),
});
const transferSchema = z.object({
  ownerId: z.string().min(1).max(128),
  command: cartCommandSchema.options[0],
});
export class GuestTransferError extends Error {}
type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type TransferOutcome =
  "confirmed" | "rejected" | "uncertain" | "deferred";

export function readGuestTransfer(storage: Store, key: string) {
  const value = storage.getItem(`${key}:transfer`);
  return value ? transferSchema.parse(JSON.parse(value)) : null;
}

// Keep an empty tombstone too: a retry after a failed journal deletion must not
// subtract a later addition of the same line for a second time.
export function reconcileGuestTransfer(
  storage: Store,
  key: string,
  command: Extract<CartCommand, { action: "merge" }>,
) {
  const value = storage.getItem(key);
  if (!value) return;
  const guest = guestSchema.parse(JSON.parse(value));
  if (guest.appliedMerges.includes(command.operationId)) return;
  const shared = command.items.filter((item) =>
    guest.items.some(
      (saved) =>
        saved.lineId === item.lineId && cartKey(saved) === cartKey(item),
    ),
  );
  if (!shared.length) return;
  let items = guest.items;
  for (const item of shared) items = consumeCart(items, item, item.lineId);
  storage.setItem(
    key,
    JSON.stringify({
      ...guest,
      revision: guest.revision + 1,
      items,
      appliedMerges: [...guest.appliedMerges, command.operationId].slice(-100),
    }),
  );
}

export async function transferGuestCart(input: {
  storage: Store;
  key: string;
  ownerId: string;
  current: () => { revision: number; activeCheckoutId?: string | null };
  active: () => boolean;
  lock: <T>(run: () => Promise<T>) => Promise<T>;
  send: (command: CartCommand) => Promise<TransferOutcome>;
}): Promise<TransferOutcome> {
  return input.lock(async () => {
    // Finish an older uncertain transfer before handling a later guest choice.
    // At most one recovered command and one fresh command per invocation.
    for (let pass = 0; pass < 2; pass++) {
      if (!input.active()) return "deferred";
      const { storage, key, ownerId } = input;
      let transfer = readGuestTransfer(storage, key);
      const recovered = Boolean(transfer);
      if (transfer && transfer.ownerId !== ownerId)
        throw new GuestTransferError(
          "Có món đang được lưu vào tài khoản trước. Đăng nhập lại tài khoản đó để hoàn tất.",
        );
      if (!transfer) {
        const value = storage.getItem(key);
        if (!value) return "confirmed";
        const guest = guestSchema.parse(JSON.parse(value));
        if (!guest.items.length) return "confirmed";
        if (input.current().activeCheckoutId) return "deferred";
        transfer = {
          ownerId,
          command: {
            action: "merge",
            operationId: crypto.randomUUID(),
            expectedRevision: input.current().revision,
            items: guest.items,
          },
        };
        // Shared across tabs and reloads; no request may precede this write.
        storage.setItem(`${key}:transfer`, JSON.stringify(transfer));
      }
      if (!input.active()) return "deferred";
      const outcome = await input.send(transfer.command);
      if (!input.active()) return "deferred";
      if (outcome === "confirmed")
        reconcileGuestTransfer(storage, key, transfer.command);
      if (outcome === "confirmed" || outcome === "rejected")
        storage.removeItem(`${key}:transfer`);
      if (recovered && outcome === "confirmed" && pass === 0) continue;
      return outcome;
    }
    return "confirmed";
  });
}

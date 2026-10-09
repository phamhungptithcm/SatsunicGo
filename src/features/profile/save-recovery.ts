import {
  customerSavePointerSchema,
  type CustomerSavePointer,
} from "../../../packages/domain/customer-save";
export type SaveCommand = {
  action: "saveProfile" | "saveAddress";
  operationId: string;
  expectedVersion?: number;
  payload: Record<string, string | boolean>;
};
async function digest(value: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
async function key(owner: string) {
  return `satsunicgo.customer-save.v1.${await digest(owner)}`;
}
export async function readSavePointer(owner: string) {
  const value = localStorage.getItem(await key(owner));
  if (value === null) return null;
  return customerSavePointerSchema.parse(
    JSON.parse(value),
  ) as CustomerSavePointer;
}
export async function reserveSave(owner: string, command: SaveCommand) {
  const storageKey = await key(owner);
  const commandHash = await digest(JSON.stringify(command));
  const pointer = customerSavePointerSchema.parse({
    schemaVersion: 1,
    action: command.action,
    operationId: command.operationId,
    commandHash,
    expectedVersion: command.expectedVersion ?? 0,
  });
  if (!navigator.locks) throw Error("RECOVERY_STORAGE_UNAVAILABLE");
  return navigator.locks.request(storageKey, () => {
    const previous = localStorage.getItem(storageKey);
    if (previous !== null)
      return {
        pointer: customerSavePointerSchema.parse(JSON.parse(previous)),
        reserved: false,
      };
    localStorage.setItem(storageKey, JSON.stringify(pointer));
    return { pointer, reserved: true };
  });
}
export async function clearSavePointer(
  owner: string,
  pointer: CustomerSavePointer,
) {
  const storageKey = await key(owner);
  if (!navigator.locks) throw Error("RECOVERY_STORAGE_UNAVAILABLE");
  await navigator.locks.request(storageKey, () => {
    const previous = localStorage.getItem(storageKey);
    if (previous === null) return;
    const stored = customerSavePointerSchema.parse(JSON.parse(previous));
    if (
      stored.operationId !== pointer.operationId ||
      stored.commandHash !== pointer.commandHash
    )
      throw Error("RECOVERY_POINTER_CHANGED");
    localStorage.removeItem(storageKey);
  });
}

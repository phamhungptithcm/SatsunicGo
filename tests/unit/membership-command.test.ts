import { beforeEach, describe, expect, it, vi } from "vitest";
const memory = vi.hoisted(() => ({
  rows: new Map<string, Record<string, unknown>>(),
  sequence: 0,
}));
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => {
    const doc = (path: string) => ({ path, id: path.split("/").at(-1) });
    return {
      doc,
      collection: (name: string) => ({
        doc: () => doc(`${name}/generated-${++memory.sequence}`),
      }),
      runTransaction: async (run: (tx: unknown) => Promise<unknown>) => {
        const writes: (() => void)[] = [];
        const tx = {
          get: async (ref: { path: string }) => ({
            exists: memory.rows.has(ref.path),
            data: () => memory.rows.get(ref.path),
          }),
          create: (ref: { path: string }, value: Record<string, unknown>) =>
            writes.push(() => {
              if (memory.rows.has(ref.path)) throw new Error("exists");
              memory.rows.set(ref.path, value);
            }),
          set: (
            ref: { path: string },
            value: Record<string, unknown>,
            options?: { merge?: boolean },
          ) =>
            writes.push(() =>
              memory.rows.set(ref.path, {
                ...(options?.merge ? memory.rows.get(ref.path) : {}),
                ...value,
              }),
            ),
          update: (ref: { path: string }, value: Record<string, unknown>) =>
            writes.push(() =>
              memory.rows.set(ref.path, {
                ...memory.rows.get(ref.path),
                ...value,
              }),
            ),
        };
        const result = await run(tx);
        writes.forEach((write) => write());
        return result;
      },
    };
  },
}));
import { membershipCommand } from "../../functions/src/membership";
const operationId = "b828c7ac-a72e-4cef-8538-c7f9d47d1bfd";
const invoke = (data: Record<string, unknown>, uid = "customer") =>
  membershipCommand.run({
    auth: {
      uid,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data: { operationId, ...data },
  } as never);
beforeEach(() => {
  memory.rows.clear();
  memory.sequence = 0;
  process.env.FUNCTIONS_EMULATOR = "true";
  memory.rows.set("users/customer", {});
  memory.rows.set("membershipPlans/plus", {
    name: "PLUS",
    status: "published",
    price: 100000,
    periodDays: 30,
  });
});
describe("membership transaction command", () => {
  it("replays purchase without creating another invoice; rejects changed operation payload", async () => {
    const first = await invoke({ action: "purchase", planId: "plus" });
    expect(await invoke({ action: "purchase", planId: "plus" })).toEqual(first);
    expect(
      [...memory.rows.keys()].filter((key) =>
        key.startsWith("membershipInvoices/"),
      ),
    ).toHaveLength(1);
    await expect(
      invoke({ action: "purchase", planId: "other" }),
    ).rejects.toThrow(/Mã thao tác/);
  });
  it("does not create a phantom subscription when cancelling renewal", async () => {
    await expect(invoke({ action: "cancelRenewal" })).rejects.toThrow(
      /chưa có membership/,
    );
    expect(memory.rows.has("membershipSubscriptions/customer")).toBe(false);
  });
  it("records intent without ending the current subscription", async () => {
    const endsAt = Date.now() + 86400000;
    memory.rows.set("membershipSubscriptions/customer", {
      ownerId: "customer",
      endsAt,
      state: "active",
    });
    await invoke({ action: "requestRenewal" });
    expect(memory.rows.get("membershipSubscriptions/customer")).toMatchObject({
      endsAt,
      state: "active",
      renewalIntent: true,
    });
  });
  it("cancels only the owner's pending invoice", async () => {
    memory.rows.set("membershipInvoices/invoice", {
      ownerId: "other",
      state: "pending",
    });
    await expect(
      invoke({ action: "cancelInvoice", invoiceId: "invoice" }),
    ).rejects.toThrow(/Không thể/);
    memory.rows.set("membershipInvoices/invoice", {
      ownerId: "customer",
      state: "paid",
    });
    await expect(
      invoke({ action: "cancelInvoice", invoiceId: "invoice" }),
    ).rejects.toThrow(/Chỉ hủy/);
    memory.rows.set("membershipInvoices/invoice", {
      ownerId: "customer",
      state: "pending",
    });
    await invoke({ action: "cancelInvoice", invoiceId: "invoice" });
    expect(memory.rows.get("membershipInvoices/invoice")?.state).toBe(
      "cancelled",
    );
  });
  it("rejects grant to an absent target even for owner", async () => {
    memory.rows.set("staffAccess/customer", { active: true, roles: ["OWNER"] });
    await expect(
      invoke({
        action: "grant",
        ownerId: "missing",
        planId: "plus",
        reason: "Recorded gift",
      }),
    ).rejects.toThrow(/tài khoản này/);
  });
  it("keeps membership receipts separate and rejects bank reference reuse", async () => {
    memory.rows.set("staffAccess/customer", {
      active: true,
      roles: ["FINANCE"],
    });
    const invoice = {
      ownerId: "customer",
      state: "pending",
      planId: "plus",
      amount: 100000,
      planSnapshot: memory.rows.get("membershipPlans/plus"),
    };
    memory.rows.set("membershipInvoices/invoice", invoice);
    await invoke({
      action: "confirm",
      invoiceId: "invoice",
      amount: 100000,
      bankTransactionId: "bank-001",
      evidence: "Verified statement",
    });
    expect(memory.rows.get("membershipInvoices/invoice")?.state).toBe("paid");
    const entries = [...memory.rows.values()].filter(
      (row) => row.kind === "membershipPayment" && !row.evidence,
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ invoiceId: "invoice", amount: 100000 });
    memory.rows.set("membershipInvoices/second", invoice);
    await expect(
      invoke({
        action: "confirm",
        invoiceId: "second",
        amount: 100000,
        bankTransactionId: "bank-001",
        evidence: "Verified statement",
        operationId: "4fcfe53e-3a3d-4e46-af2b-a3f4b0bce707",
      }),
    ).rejects.toThrow(/đã được phân bổ/);
    expect(memory.rows.get("membershipInvoices/second")?.state).toBe("pending");
  });
});
describe("published FREE entitlement activation", () => {
  const free = {
    name: "FREE",
    status: "published",
    price: 0,
    periodDays: 30,
    serviceDiscountBps: 0,
    discountCap: 0,
  };
  it("activates and replays without a zero invoice, bank receipt or financial entry", async () => {
    memory.rows.set("membershipPlans/free", free);
    const first = await invoke({ action: "purchase", planId: "free" });
    expect(first).toEqual({ id: "customer", state: "active" });
    expect(await invoke({ action: "purchase", planId: "free" })).toEqual(first);
    const subscription = memory.rows.get("membershipSubscriptions/customer")!;
    expect(subscription).toMatchObject({
      state: "active",
      planSnapshot: free,
      planId: "free",
    });
    expect(Number(subscription.endsAt) - Number(subscription.startsAt)).toBe(
      30 * 86400000,
    );
    for (const prefix of [
      "membershipInvoices/",
      "financialEntries/",
      "bankTransactions/",
    ])
      expect(
        [...memory.rows.keys()].filter((key) => key.startsWith(prefix)),
      ).toHaveLength(0);
    expect(
      [...memory.rows.values()].filter((row) => row.action === "activateFree"),
    ).toHaveLength(1);
    expect(
      [...memory.rows.keys()].filter((key) => key.startsWith("outboxJobs/")),
    ).toHaveLength(1);
  });
  it("does not stack active FREE terms or replace its snapshot with a new click", async () => {
    memory.rows.set("membershipPlans/free", free);
    await invoke({ action: "purchase", planId: "free" });
    const previous = memory.rows.get("membershipSubscriptions/customer");
    memory.rows.set("membershipPlans/free", { ...free, periodDays: 60 });
    await invoke({
      action: "purchase",
      planId: "free",
      operationId: "4fcfe53e-3a3d-4e46-af2b-a3f4b0bce707",
    });
    expect(memory.rows.get("membershipSubscriptions/customer")).toEqual(
      previous,
    );
    expect(
      [...memory.rows.values()].filter((row) => row.action === "activateFree"),
    ).toHaveLength(1);
  });
  it("refuses unpublished or malformed FREE and nonFREE zero-price purchases", async () => {
    for (const plan of [
      { ...free, status: "draft" },
      { ...free, periodDays: 0 },
      { ...free, name: "PLUS" },
    ]) {
      memory.rows.set("membershipPlans/free", plan);
      await expect(
        invoke({ action: "purchase", planId: "free" }),
      ).rejects.toThrow();
      expect(memory.rows.has("membershipSubscriptions/customer")).toBe(false);
    }
  });
  it("preserves active paid rights even when the published same-ID plan was changed to FREE", async () => {
    const previous = {
      state: "active",
      planId: "free",
      startsAt: Date.now() - 1000,
      endsAt: Date.now() + 86400000,
      planSnapshot: { ...free, name: "PLUS", price: 100000 },
    };
    memory.rows.set("membershipSubscriptions/customer", previous);
    memory.rows.set("membershipPlans/free", free);
    await expect(
      invoke({ action: "purchase", planId: "free" }),
    ).rejects.toThrow(/đổi gói/);
    expect(memory.rows.get("membershipSubscriptions/customer")).toEqual(
      previous,
    );
  });
  it("denies activation to locked customers", async () => {
    memory.rows.set("membershipPlans/free", free);
    memory.rows.set("users/customer", { locked: true });
    await expect(
      invoke({ action: "purchase", planId: "free" }),
    ).rejects.toThrow(/không thể thao tác/);
  });
  it("refuses legacy zero invoices instead of recording a fictitious bank payment", async () => {
    memory.rows.set("staffAccess/customer", {
      active: true,
      roles: ["FINANCE"],
    });
    memory.rows.set("membershipInvoices/zero", {
      ownerId: "customer",
      state: "pending",
      planId: "free",
      amount: 0,
      planSnapshot: free,
    });
    await expect(
      invoke({
        action: "confirm",
        invoiceId: "zero",
        amount: 0,
        bankTransactionId: "bank-zero",
        evidence: "Fixture only",
      }),
    ).rejects.toThrow(/miễn phí không cần/);
    expect(
      [...memory.rows.keys()].filter((key) =>
        key.startsWith("financialEntries/"),
      ),
    ).toHaveLength(0);
  });
});

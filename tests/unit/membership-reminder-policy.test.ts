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
            ref,
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
import {
  membershipReminderInput,
  membershipReminderPolicy,
} from "../../functions/src/membership-reminder-policy";
const operationId = "b828c7ac-a72e-4cef-8538-c7f9d47d1bfd";
const invoke = (data: Record<string, unknown>, verified = true) =>
  membershipReminderPolicy.run({
    auth: {
      uid: "owner",
      token: {
        email_verified: verified,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  } as never);
const save = {
  action: "save",
  operationId,
  expectedVersion: 0,
  approved: true,
  daysBeforeExpiry: 7,
};
beforeEach(() => {
  memory.rows.clear();
  memory.sequence = 0;
  process.env.FUNCTIONS_EMULATOR = "true";
  memory.rows.set("users/owner", { locked: false });
  memory.rows.set("staffAccess/owner", { active: true, roles: ["OWNER"] });
});
describe("owner-approved membership reminder policy", () => {
  it("has no invented threshold and refuses invalid/extra input", async () => {
    expect(await invoke({ action: "read" })).toEqual({
      version: 0,
      approved: false,
      daysBeforeExpiry: null,
    });
    for (const daysBeforeExpiry of [0, 31, 1.5, "7", undefined])
      expect(
        membershipReminderInput.safeParse({ ...save, daysBeforeExpiry })
          .success,
      ).toBe(false);
    expect(
      membershipReminderInput.safeParse({ ...save, roles: ["OWNER"] }).success,
    ).toBe(false);
  });
  it("saves one version and audit on replay", async () => {
    expect(await invoke(save)).toEqual({
      version: 1,
      approved: true,
      daysBeforeExpiry: 7,
    });
    expect(await invoke(save)).toEqual({
      version: 1,
      approved: true,
      daysBeforeExpiry: 7,
    });
    expect(
      [...memory.rows.keys()].filter((key) => key.startsWith("auditEvents/")),
    ).toHaveLength(1);
    expect(memory.rows.get("settings/membershipReminders")).toMatchObject({
      version: 1,
      approved: true,
      daysBeforeExpiry: 7,
    });
    await expect(invoke({ ...save, daysBeforeExpiry: 8 })).rejects.toThrow(
      /Mã thao tác/,
    );
  });
  it("rejects stale version and checks current authority before replay", async () => {
    await invoke(save);
    await expect(
      invoke({ ...save, operationId: "4fcfe53e-3a3d-4e46-af2b-a3f4b0bce707" }),
    ).rejects.toThrow(/Tải lại/);
    memory.rows.set("staffAccess/owner", { active: false, roles: ["OWNER"] });
    await expect(invoke(save)).rejects.toThrow(/quyền chủ doanh nghiệp/);
  });
  it("denies unverified, nonowner and locked sessions", async () => {
    await expect(invoke({ action: "read" }, false)).rejects.toThrow(
      /Google đã xác thực/,
    );
    memory.rows.set("users/owner", { locked: true });
    await expect(invoke(save)).rejects.toThrow(/quyền chủ doanh nghiệp/);
    memory.rows.set("users/owner", {});
    memory.rows.set("staffAccess/owner", { active: true, roles: ["FINANCE"] });
    await expect(invoke({ action: "read" })).rejects.toThrow(
      /quyền chủ doanh nghiệp/,
    );
  });
  it("requires recent MFA for production mutation and disables without deleting old notifications", async () => {
    process.env.FUNCTIONS_EMULATOR = "false";
    await expect(invoke(save)).rejects.toThrow(/hai lớp/);
    process.env.FUNCTIONS_EMULATOR = "true";
    await invoke({ ...save, approved: false, daysBeforeExpiry: undefined });
    expect(memory.rows.get("settings/membershipReminders")).toMatchObject({
      approved: false,
      version: 1,
    });
    expect(
      memory.rows.get("settings/membershipReminders")?.daysBeforeExpiry,
    ).toBeUndefined();
  });
});

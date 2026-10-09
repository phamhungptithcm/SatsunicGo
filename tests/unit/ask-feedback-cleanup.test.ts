import { beforeEach, expect, test, vi } from "vitest";
const state = vi.hoisted(() => ({
  reads: [] as {
    collection: string;
    field: string;
    value: Date;
    limit: number;
  }[],
  deletes: [] as { ref: string; precondition: unknown }[],
  commits: 0,
  changed: false,
}));
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: (collection: string) => ({
      where: (field: string, _operator: string, value: Date) => ({
        limit: (limit: number) => ({
          get: async () => {
            state.reads.push({ collection, field, value, limit });
            return {
              size: 1,
              docs: [
                {
                  ref: `synthetic/${collection}`,
                  updateTime: "immutable-snapshot-time",
                },
              ],
            };
          },
        }),
      }),
    }),
    batch: () => ({
      delete: (ref: string, precondition: unknown) =>
        state.deletes.push({ ref, precondition }),
      commit: async () => {
        if (state.changed) throw Error("Synthetic update-time mismatch");
        state.commits++;
      },
    }),
  }),
}));
import { purgeExpiredFeedback } from "../../functions/src/ai/feedback-lifecycle";
beforeEach(() => {
  state.reads = [];
  state.deletes = [];
  state.commits = 0;
  state.changed = false;
});
test("cleanup bounds each expiry query and deletes only the exact read version", async () => {
  const now = Date.now();
  expect(await purgeExpiredFeedback(now)).toEqual({ deleted: 3 });
  expect(state.reads).toHaveLength(3);
  for (const read of state.reads) {
    expect(read.field).toBe("expiresAt");
    expect(read.limit).toBe(100);
    expect(read.value.getTime()).toBe(now);
  }
  for (const deletion of state.deletes)
    expect(deletion.precondition).toEqual({
      lastUpdateTime: "immutable-snapshot-time",
    });
});
test("cleanup changed record aborts batch; malformed time performs no database work", async () => {
  state.changed = true;
  await expect(purgeExpiredFeedback()).rejects.toThrow(
    "Synthetic update-time mismatch",
  );
  expect(state.commits).toBe(0);
  state.reads = [];
  await expect(purgeExpiredFeedback(NaN)).rejects.toThrow("INVALID_PURGE_TIME");
  expect(state.reads).toEqual([]);
});

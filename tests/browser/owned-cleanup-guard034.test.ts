import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkedCleanup,
  checkedMutationDelete,
  type CleanupRecord,
  type Snapshot,
  type CleanupPort,
} from "./owned-cleanup-guard034";
function fake(initial: Snapshot[], race?: () => void) {
  const docs = new Map(initial.map((s) => [s.path, { ...s }]));
  let calls = 0;
  const port: CleanupPort = {
    async read(paths) {
      return paths.map((path) => ({
        path,
        ...(docs.get(path) ?? { fingerprint: null, version: null }),
      }));
    },
    async commit(deletes) {
      calls++;
      race?.();
      // Fake transaction verifies ALL predicates before ANY deletion.
      for (const d of deletes)
        if (docs.get(d.path)?.version !== d.version)
          throw Error("FAILED_PRECONDITION");
      for (const d of deletes) docs.delete(d.path);
    },
  };
  return { docs, port, calls: () => calls };
}
const records: CleanupRecord[] = [
  { path: "plans/owned", acknowledged: true, fingerprint: "exact-canonical" },
];
const initial: Snapshot[] = [
  { path: "plans/owned", fingerprint: "exact-canonical", version: "1:5" },
];
const safe = { collision: false, unknown: false, quiescent: true };
test("collision cannot delete planned existing resource", async () => {
  const f = fake(initial);
  await assert.rejects(
    checkedCleanup(records, { ...safe, collision: true }, f.port),
  );
  assert.equal(f.calls(), 0);
  assert.equal(f.docs.size, 1);
});
test("unknown create ACK preserves whole cohort", async () => {
  const f = fake(initial);
  await assert.rejects(
    checkedCleanup(records, { ...safe, unknown: true }, f.port),
  );
  assert.equal(f.calls(), 0);
  assert.equal(f.docs.size, 1);
});
test("partial preparation planned path is never ownership", async () => {
  const f = fake(initial);
  await assert.rejects(
    checkedCleanup([{ ...records[0], acknowledged: false }], safe, f.port),
  );
  assert.equal(f.calls(), 0);
  assert.equal(f.docs.size, 1);
});
test("changed canonical root rejected before first delete", async () => {
  const f = fake([
    { ...initial[0], fingerprint: "foreign-root", version: "2:0" },
  ]);
  await assert.rejects(checkedCleanup(records, safe, f.port));
  assert.equal(f.calls(), 0);
  assert.equal(f.docs.size, 1);
});
test("updateTime race enforces atomic precondition and retains resource", async () => {
  const f: ReturnType<typeof fake> = fake(initial, () =>
    f.docs.set("plans/owned", { ...initial[0], version: "1:6" }),
  );
  await assert.rejects(
    checkedCleanup(records, safe, f.port),
    /FAILED_PRECONDITION/,
  );
  assert.equal(f.docs.size, 1);
});
test("acknowledged exact cohort deletes and proves absence", async () => {
  const f = fake(initial);
  await checkedCleanup(records, safe, f.port);
  assert.equal(f.calls(), 1);
  assert.equal(f.docs.size, 0);
});
test("unquiesced consumer holds whole cohort", async () => {
  const f = fake(initial);
  await assert.rejects(
    checkedCleanup(records, { ...safe, quiescent: false }, f.port),
  );
  assert.equal(f.calls(), 0);
});

test("native mutation delete rejects changed owned root before commit", async () => {
  const f = fake([{ ...initial[0], fingerprint: "altered", version: "3:0" }]);
  await assert.rejects(checkedMutationDelete(records, f.port));
  assert.equal(f.calls(), 0);
  assert.equal(f.docs.size, 1);
});
test("native mutation delete rejects updateTime race atomically", async () => {
  const f: ReturnType<typeof fake> = fake(initial, () =>
    f.docs.set("plans/owned", { ...initial[0], version: "4:0" }),
  );
  await assert.rejects(
    checkedMutationDelete(records, f.port),
    /FAILED_PRECONDITION/,
  );
  assert.equal(f.docs.size, 1);
});
test("native mutation delete requires ACK and proves absence", async () => {
  const f = fake(initial);
  await assert.rejects(
    checkedMutationDelete([{ ...records[0], acknowledged: false }], f.port),
  );
  assert.equal(f.calls(), 0);
  await checkedMutationDelete(records, f.port);
  assert.equal(f.docs.size, 0);
});

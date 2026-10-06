export type CleanupRecord = {
  path: string;
  acknowledged: boolean;
  fingerprint: string | null;
};
export type Snapshot = {
  path: string;
  fingerprint: string | null;
  version: string | null;
};
export type Delete = { path: string; version: string };
export type CleanupPort = {
  read(paths: string[]): Promise<Snapshot[]>;
  commit(deletes: Delete[]): Promise<void>;
};
export async function checkedCleanup(
  records: CleanupRecord[],
  fence: {
    collision: boolean;
    unknown: boolean;
    quiescent: boolean;
  },
  port: CleanupPort,
) {
  if (
    fence.collision ||
    fence.unknown ||
    !fence.quiescent ||
    records.some((r) => !r.acknowledged)
  )
    throw Error("Ownership ACK or quiescence missing; retain cohort");
  await deleteVerified(records, port);
}
export async function checkedMutationDelete(
  records: CleanupRecord[],
  port: CleanupPort,
) {
  if (records.some((r) => !r.acknowledged || r.fingerprint === null))
    throw Error(
      "Mutation delete requires acknowledged existing canonical roots",
    );
  await deleteVerified(records, port);
}
async function deleteVerified(records: CleanupRecord[], port: CleanupPort) {
  const unique = new Map(records.map((r) => [r.path, r]));
  if (unique.size !== records.length) throw Error("Duplicate cleanup custody");
  const snapshots = await port.read([...unique.keys()]);
  if (
    snapshots.length !== unique.size ||
    new Set(snapshots.map((s) => s.path)).size !== unique.size
  )
    throw Error("Incomplete cleanup manifest readback");
  const deletes: Delete[] = [];
  for (const snapshot of snapshots) {
    const record = unique.get(snapshot.path);
    if (
      !record ||
      snapshot.fingerprint !== record.fingerprint ||
      (snapshot.fingerprint === null) !== (snapshot.version === null)
    )
      throw Error("Cleanup fingerprint mismatch; retain cohort");
    if (snapshot.version !== null)
      deletes.push({ path: snapshot.path, version: snapshot.version });
  }
  // Port must enforce exact document updateTime in each atomic batch.
  // A later-batch race can leave partial cleanup; never report rollback/complete.
  for (let i = 0; i < deletes.length; i += 400)
    await port.commit(deletes.slice(i, i + 400));
  const after = await port.read([...unique.keys()]);
  if (
    after.length !== unique.size ||
    new Set(after.map((s) => s.path)).size !== unique.size ||
    after.some(
      (s) =>
        !unique.has(s.path) || s.fingerprint !== null || s.version !== null,
    )
  )
    throw Error("Cleanup absence not verified");
}

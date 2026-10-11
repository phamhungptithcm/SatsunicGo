import { db, notificationRows } from "./synthetic-adapter";

type Constraint = { kind: string; field?: string; value?: unknown };
type NotificationRead = { collection: "notifications"; constraints: Constraint[] };
const denied = () => { throw Error("Preview denies provider access"); };

export function collection(database: unknown, name: string) {
  if (database !== db || name !== "notifications") return denied();
  return { collection: "notifications" as const };
}
export function where(field: string, operator: string, value: unknown): Constraint {
  if (field !== "ownerId" || operator !== "==" || value !== "preview-synthetic-owner") return denied();
  return { kind: "owner", field, value };
}
export function orderBy(field: string, direction: string): Constraint {
  if (field !== "createdAt" || direction !== "desc") return denied();
  return { kind: "order", field, value: direction };
}
export function limit(value: number): Constraint {
  if (value !== 30) return denied();
  return { kind: "limit", value };
}
export function query(source: { collection: string }, ...constraints: Constraint[]): NotificationRead {
  if (source.collection !== "notifications" || JSON.stringify(constraints) !== JSON.stringify([
    { kind: "owner", field: "ownerId", value: "preview-synthetic-owner" },
    { kind: "order", field: "createdAt", value: "desc" },
    { kind: "limit", value: 30 },
  ])) return denied();
  return { collection: "notifications", constraints };
}
export function onSnapshot(
  source: NotificationRead,
  next: (snapshot: { docs: { id: string; data: () => Record<string, unknown> }[] }) => void,
) {
  query({ collection: source.collection }, ...source.constraints);
  let active = true;
  queueMicrotask(() => {
    if (active) next({ docs: notificationRows.map(({ id, ...record }) => ({ id, data: () => structuredClone(record) })) });
  });
  return () => { active = false; };
}
export const doc = denied;

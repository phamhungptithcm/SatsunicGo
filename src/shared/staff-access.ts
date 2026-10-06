// Firestore snapshots are untrusted even when callers annotate their shape.
export function staffRoles(value: unknown): string[] | null {
  if (!value || typeof value !== "object") return null;
  const access = value as {
    active?: unknown;
    locked?: unknown;
    roles?: unknown;
  };
  if (
    access.active !== true ||
    access.locked ||
    !Array.isArray(access.roles) ||
    !access.roles.every((role): role is string => typeof role === "string")
  )
    return null;
  return access.roles;
}

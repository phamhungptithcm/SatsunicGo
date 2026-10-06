import { z } from "zod";
import { studioIdSchema } from "./blog-studio";
export const studioAdvancedReadSchema = z
  .object({
    kind: z.enum([
      "list",
      "summary",
      "catalog",
      "members",
      "assignable",
      "export",
      "reports",
    ]),
    reportState: z.enum(["open", "resolved"]).optional(),
    catalog: z.enum(["authors", "taxonomy"]).optional(),
    q: z.string().max(200).optional(),
    state: z
      .enum(["draft", "review", "published", "archived", "open", "resolved"])
      .optional(),
    category: z.string().max(80).optional(),
    after: z.string().max(256).optional(),
  })
  .strict();
export const studioAdvancedCommandSchema = z
  .object({
    action: z.enum([
      "categoryCreate",
      "catalogUpdate",
      "memberSave",
      "memberRevoke",
      "cancelSchedule",
      "reportResolve",
    ]),
    id: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{1,200}$/u)
      .optional(),
    operationId: studioIdSchema,
    expectedVersion: z
      .number()
      .int()
      .positive()
      .max(Number.MAX_SAFE_INTEGER - 1)
      .optional(),
    payload: z.unknown().optional(),
  })
  .strict();
export function taxonomyKey(v: string) {
  return v.trim().normalize("NFC").toLowerCase();
}
export function studioSearchTokens(v: string) {
  return [
    ...new Set(
      v
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/gu, "")
        .toLowerCase()
        .replace(/đ/gu, "d")
        .split(/[^a-z0-9]+/u)
        .filter((t) => t.length >= 2),
    ),
  ].slice(0, 100);
}
export function googleStudioAvatar(v: unknown): string | undefined {
  if (typeof v !== "string" || v.length > 2048) return;
  try {
    const u = new URL(v);
    if (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.port &&
      u.hostname.endsWith(".googleusercontent.com")
    )
      return u.toString();
  } catch {
    /* Invalid external identity metadata is ignored. */
  }
}
export function studioCursor(time: string, id: string) {
  return btoa(`${time}|${id}`)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
}
export function readStudioCursor(value: string) {
  if (!/^[A-Za-z0-9_-]{1,256}$/u.test(value)) throw new Error("INVALID_CURSOR");
  const [time, id, ...extra] = atob(
    value.replace(/-/g, "+").replace(/_/g, "/"),
  ).split("|");
  if (
    extra.length ||
    !time ||
    !Number.isFinite(Date.parse(time)) ||
    !studioIdSchema.safeParse(id).success
  )
    throw new Error("INVALID_CURSOR");
  return [time, id] as const;
}

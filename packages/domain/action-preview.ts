import { conversationActionSchema } from "./ask-workflow";
import { parseChatDraftEdits } from "./chat-draft";
/** UI consent only. Typed domain commands retain server authority and recovery. */
export const previewActions = [
  "submitRequest",
  "catalogCheckout",
  "acceptQuote",
  "approveFinal",
  "confirmReceipt",
] as const;
export type PreviewAction = (typeof previewActions)[number];
export type PreviewCommand = {
  action: PreviewAction;
  payload: unknown;
  expectedOrderVersion?: number;
};
export type PreviewScope = {
  ownerId: string;
  conversationId: string;
  epoch: number;
  conversationVersion: number;
  orderId: string | null;
  orderVersion: number | null;
  draftSignature: string;
  localRevision: number;
  history: boolean;
};
export type ActionPreview = Readonly<{
  id: string;
  command: PreviewCommand;
  commandJson: string;
  payloadHash: string;
  scopeJson: string;
  details: PreviewDetail[];
  createdAt: number;
  expiresAt: number;
}>;
export type PreviewDetail = {
  vi: string;
  en: string;
  value: string | number;
  kind?: "money" | "time";
  secondary?: boolean;
};
export function isPreviewAction(action: string): action is PreviewAction {
  return (previewActions as readonly string[]).includes(action);
}
/** Deterministic, bounded JSON; no getters, prototypes, missing/unsafe numbers. */
export function previewJson(value: unknown): string {
  function normalize(input: unknown, depth: number): unknown {
    if (depth > 12) throw Error("INVALID_PREVIEW");
    if (
      input === null ||
      typeof input === "string" ||
      typeof input === "boolean"
    )
      return input;
    if (typeof input === "number" && Number.isFinite(input)) return input;
    if (Array.isArray(input))
      return input.map((item) => normalize(item, depth + 1));
    if (
      typeof input !== "object" ||
      Object.getPrototypeOf(input) !== Object.prototype
    )
      throw Error("INVALID_PREVIEW");
    return Object.fromEntries(
      Object.keys(input)
        .sort()
        .map((key) => {
          const descriptor = Object.getOwnPropertyDescriptor(input, key)!;
          if (!Object.hasOwn(descriptor, "value"))
            throw Error("INVALID_PREVIEW");
          return [key, normalize(descriptor.value, depth + 1)];
        }),
    );
  }
  const json = JSON.stringify(normalize(value, 0));
  if (new TextEncoder().encode(json).byteLength > 32000)
    throw Error("INVALID_PREVIEW");
  return json;
}
function freeze(value: unknown): void {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
}
export async function createActionPreview(
  command: PreviewCommand,
  scope: PreviewScope,
  now = Date.now(),
  sourceExpiry = now + 300000,
  details: PreviewDetail[] = [],
): Promise<ActionPreview> {
  // Canonicalize before schema access: caller-supplied getters must never run.
  const safeCommand = JSON.parse(previewJson(command)) as PreviewCommand;
  const parsed = conversationActionSchema.safeParse({
    action: safeCommand.action,
    payload: safeCommand.payload,
  });
  if (
    !parsed.success ||
    !isPreviewAction(parsed.data.action) ||
    (parsed.data.action === "submitRequest" &&
      parsed.data.payload.desiredAt !== undefined &&
      !Number.isFinite(new Date(parsed.data.payload.desiredAt).getTime())) ||
    (safeCommand.expectedOrderVersion !== undefined &&
      (!Number.isSafeInteger(safeCommand.expectedOrderVersion) ||
        safeCommand.expectedOrderVersion < 0)) ||
    !scope.ownerId ||
    !scope.conversationId ||
    scope.history ||
    !Number.isSafeInteger(now) ||
    !Number.isSafeInteger(sourceExpiry) ||
    sourceExpiry <= now ||
    [
      scope.epoch,
      scope.conversationVersion,
      scope.localRevision,
      ...(scope.orderVersion === null ? [] : [scope.orderVersion]),
    ].some((value) => !Number.isSafeInteger(value) || value < 0) ||
    details.length > 40
  )
    throw Error("INVALID_PREVIEW");
  const commandJson = previewJson({
    action: parsed.data.action,
    payload: parsed.data.payload,
    ...(safeCommand.expectedOrderVersion === undefined
      ? {}
      : { expectedOrderVersion: safeCommand.expectedOrderVersion }),
  });
  const scopeJson = previewJson(scope);
  const detailsJson = previewJson(details);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(
      previewJson({
        command: JSON.parse(commandJson),
        details: JSON.parse(detailsJson),
      }),
    ),
  );
  const preview = {
    id: crypto.randomUUID(),
    command: JSON.parse(commandJson) as PreviewCommand,
    commandJson,
    payloadHash: Array.from(new Uint8Array(digest), (n) =>
      n.toString(16).padStart(2, "0"),
    ).join(""),
    scopeJson,
    details: JSON.parse(detailsJson) as PreviewDetail[],
    createdAt: now,
    expiresAt: Math.min(sourceExpiry, now + 300000),
  };
  freeze(preview);
  return preview;
}
export function previewCurrent(
  preview: ActionPreview,
  scope: PreviewScope | null,
  now = Date.now(),
) {
  return (
    !!scope &&
    !scope.history &&
    Number.isSafeInteger(now) &&
    now >= preview.createdAt &&
    now < preview.expiresAt &&
    preview.scopeJson === previewJson(scope)
  );
}
/** Exact short replies only. Questions, quoted/conditional/mixed speech never consent. */
export function contextualReply(
  raw: string,
): "approve" | "decline" | "review" | null {
  if (!raw || raw.length > 100 || /[?？\n\r"'“”‘’]/u.test(raw)) return null;
  const text = raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[đĐ]/gu, "d")
    .trim()
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .replace(/[.!]+$/u, "")
    .trim();
  if (/^(dong y|toi dong y|minh dong y|yes|i agree|agree|ok|okay)$/u.test(text))
    return "approve";
  if (/^(khong|chua|chua gui|khong gui|no|not yet|do not send)$/u.test(text))
    return "decline";
  if (
    /^(tiep tuc|kiem tra|xem lai|continue|review|review details)$/u.test(text)
  )
    return "review";
  return null;
}
/** A mixed edit + yes can edit only; never carry consent to the changed draft. */
export function draftEditOnly(raw: string): string | null {
  if (raw.length > 1000 || /[?？\n\r"'“”‘’]/u.test(raw)) return null;
  const clauses = raw
    .normalize("NFC")
    .split(/[,;]|\s+(?:và|va|and)\s+/iu)
    .map((value) => value.trim());
  if (
    clauses.length < 2 ||
    clauses.length > 4 ||
    clauses.filter((value) => contextualReply(value) === "approve").length !== 1
  )
    return null;
  const edits = clauses
    .filter((value) => contextualReply(value) !== "approve")
    .join(", ");
  return parseChatDraftEdits(edits)?.kind === "fields" ? edits : null;
}
/** Consume at queue execution time, never during click/chat parsing. */
export function createPreviewAdmission() {
  const consumed = new Map<string, number>();
  return {
    consume(
      preview: ActionPreview,
      scope: PreviewScope | null,
      command: PreviewCommand,
      renderedId: string | null,
      now = Date.now(),
    ) {
      for (const [id, expiresAt] of consumed)
        if (expiresAt <= now) consumed.delete(id);
      if (
        consumed.has(preview.id) ||
        consumed.size >= 128 ||
        renderedId !== preview.id ||
        !previewCurrent(preview, scope, now) ||
        preview.commandJson !== previewJson(command)
      )
        return false;
      consumed.set(preview.id, preview.expiresAt);
      return true;
    },
  };
}

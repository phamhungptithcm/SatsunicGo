import {
  boundedIdentity,
  boundedJsonSnapshot,
  type JsonValue,
  type ReadTool,
} from "./ask-read-task-plan";
/** Equality and provenance fields are validated boundary facts, never access grants. */
export type Address = "anh" | "chị" | "anh/chị";
export type BusinessPanel = {
  id: string;
  subject: string;
  requestId: string;
  conversationId: string;
  kind: ReadTool;
  resourceKey: string;
  revision: number;
  status: "ready" | "unavailable" | "pending";
  payload: JsonValue;
};
export type ConversationView = {
  subject: string;
  requestId: string;
  conversationId: string;
  evidenceVersion: number;
  addressRevision: number;
  address: Address;
  panels: BusinessPanel[];
  explanation: string | null;
};
const bytes = (v: unknown) =>
  new TextEncoder().encode(JSON.stringify(v)).length;
function fits(v: ConversationView) {
  try {
    return (
      bytes(v) +
        v.panels.reduce((n, p) => n + bytes({ type: "panel", panel: p }), 0) +
        2000 <=
      30000
    );
  } catch {
    return false;
  }
}
export function startView(
  subject: string,
  requestId: string,
  conversationId: string,
): ConversationView {
  if (![subject, requestId, conversationId].every(boundedIdentity))
    throw Error("INVALID_IDENTITY");
  return {
    subject,
    requestId,
    conversationId,
    evidenceVersion: 0,
    addressRevision: 0,
    address: "anh/chị",
    panels: [],
    explanation: null,
  };
}
export function updateAddress(
  v: ConversationView,
  p: {
    subject: string;
    conversationId: string;
    provenance: "explicit-current-speaker";
    revision: number;
    address: Address;
  },
): ConversationView {
  if (
    p.subject !== v.subject ||
    p.conversationId !== v.conversationId ||
    p.provenance !== "explicit-current-speaker" ||
    !Number.isSafeInteger(p.revision) ||
    p.revision <= v.addressRevision ||
    !["anh", "chị", "anh/chị"].includes(p.address)
  )
    return v;
  return {
    ...v,
    address: p.address,
    addressRevision: p.revision,
    explanation: null,
  };
}
export function mergePanel(
  v: ConversationView,
  p: BusinessPanel,
): ConversationView {
  if (
    p.conversationId !== v.conversationId ||
    !boundedIdentity(p.id) ||
    !boundedIdentity(p.resourceKey) ||
    p.subject !== v.subject ||
    p.requestId !== v.requestId ||
    !Number.isSafeInteger(p.revision) ||
    p.revision < 0 ||
    !["tracking", "catalog", "fees", "membership"].includes(p.kind) ||
    !["ready", "unavailable", "pending"].includes(p.status)
  )
    return v;
  const old = v.panels.find((x) => x.id === p.id);
  if (
    old &&
    (old.kind !== p.kind ||
      old.resourceKey !== p.resourceKey ||
      old.revision > p.revision ||
      (old.revision === p.revision && old.status === "ready"))
  )
    return v;
  let snapshot: BusinessPanel;
  try {
    snapshot = boundedJsonSnapshot(p, 5000) as unknown as BusinessPanel;
  } catch {
    return v;
  }
  const panels = old
    ? v.panels.map((x) => (x.id === p.id ? snapshot : x))
    : [...v.panels, snapshot];
  if (panels.length > 4 || bytes(panels) > 22000) return v;
  const next = {
    ...v,
    panels,
    evidenceVersion: v.evidenceVersion + 1,
    explanation: null,
  };
  return fits(next) ? next : v;
}
export function mergeExplanation(
  v: ConversationView,
  p: {
    subject: string;
    requestId: string;
    conversationId: string;
    evidenceVersion: number;
    addressRevision: number;
    text: string;
  },
): ConversationView {
  if (
    p.subject !== v.subject ||
    p.requestId !== v.requestId ||
    p.conversationId !== v.conversationId ||
    p.evidenceVersion !== v.evidenceVersion ||
    p.addressRevision !== v.addressRevision ||
    typeof p.text !== "string" ||
    !p.text.trim() ||
    new TextEncoder().encode(p.text).length > 6000
  )
    return v;
  const next = { ...v, explanation: p.text };
  return fits(next) ? next : v;
}

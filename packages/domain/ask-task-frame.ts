/** Bounded readonly task parsing. No adapter calls, authorization, persistence or monetary actions. */
export type ReadKind = "tracking" | "catalog" | "fees";
export type RawSpan = Readonly<{ start: number; end: number; raw: string }>;
export type TaskPayloads = {
  tracking: unknown;
  catalog: unknown;
  fees: unknown;
};
export type ReadTask<P extends TaskPayloads> = {
  [K in ReadKind]: Readonly<{ kind: K; span: RawSpan; params: P[K] }>;
}[ReadKind];
export type Detection<P extends TaskPayloads> =
  | {
      kind: "read";
      task: { [K in ReadKind]: { kind: K; params: P[K] } }[ReadKind];
    }
  | { kind: "clarify"; reason: string }
  | { kind: "unknown" };
export type TrustedDetectors<P extends TaskPayloads> = Readonly<{
  /** Canonical source detectors must reject fuzzy IDs and expose multi-ID ambiguity. */
  classify: (raw: string) => Detection<P>;
  /** True ONLY for explicit new task starts, not arbitrary product words. */
  explicitReadStart: (raw: string) => boolean;
  /** Vetted lexical compound only; no product/purchase/safety authority. */
  preserveNameConjunction?: (
    raw: string,
    start: number,
    end: number,
  ) => boolean;
  /** Conservative whole-input check; monetary text is never a read adapter. */
  consequentialOrAmbiguousAction: (raw: string) => boolean;
  /** Canonical language guards: any uncertain negation/comparison blocks segmentation. */
  segmentationUnsafe: (raw: string) => boolean;
}>;
export type TaskFrame<P extends TaskPayloads> = Readonly<{
  raw: string;
  tasks: readonly ReadTask<P>[];
  unresolved: readonly (RawSpan & { reason: string })[];
  concurrency: 2;
  requiresClarification: boolean;
}>;
const MAX_INPUT = 1000,
  MAX_TASKS = 4;
export function collectReadFrame<P extends TaskPayloads>(
  raw: string,
  detectors: TrustedDetectors<P>,
): TaskFrame<P> {
  const span = (start: number, end: number): RawSpan => ({
    start,
    end,
    raw: raw.slice(start, end),
  });
  const blocked = (reason: string): TaskFrame<P> => ({
    raw,
    tasks: [],
    unresolved: [{ ...span(0, raw.length), reason }],
    concurrency: 2,
    requiresClarification: true,
  });
  if (!raw.trim() || raw.length > MAX_INPUT) return blocked("input-bound");
  if (detectors.consequentialOrAmbiguousAction(raw))
    return blocked("explicit-action-review");
  if (detectors.segmentationUnsafe(raw)) return blocked("unsafe-segmentation");
  // Delimiters are merely proposals. A trusted explicit task prefix is required.
  // Raw offsets use JS UTF-16 consistently with slice; no normalization of IDs/spans.
  const boundaries: { start: number; end: number }[] = [];
  const separators = /[,;\n]|\s+(?:và|va|and)\s+/giu;
  for (const match of raw.matchAll(separators)) {
    const start = match.index!,
      end = start + match[0].length;
    if (
      match[0] === "," &&
      /\d/u.test(raw[start - 1] ?? "") &&
      /\d/u.test(raw[end] ?? "")
    )
      continue;
    const punctuation =
      match[0] === "," || match[0] === ";" || match[0] === "\n";
    const explicitStart = detectors.explicitReadStart(raw.slice(end));
    if (punctuation || explicitStart) boundaries.push({ start, end });
    else if (!detectors.preserveNameConjunction?.(raw, start, end))
      return blocked("unsupported-conjunction");
  }
  const clauses: RawSpan[] = [];
  let cursor = 0;
  for (const boundary of boundaries) {
    if (raw.slice(cursor, boundary.start).trim())
      clauses.push(span(cursor, boundary.start));
    cursor = boundary.end;
  }
  if (raw.slice(cursor).trim()) clauses.push(span(cursor, raw.length));
  // Overflow is clarification, never silently truncated execution.
  if (clauses.length > MAX_TASKS) return blocked("task-bound");
  const tasks: ReadTask<P>[] = [],
    unresolved: (RawSpan & { reason: string })[] = [];
  for (const clause of clauses) {
    const result =
      clause !== clauses[0] && !detectors.explicitReadStart(clause.raw)
        ? { kind: "unknown" as const }
        : detectors.classify(clause.raw);
    if (result.kind === "read") {
      tasks.push({ ...result.task, span: clause } as ReadTask<P>);
    } else {
      unresolved.push({
        ...clause,
        reason: result.kind === "clarify" ? result.reason : "unknown-clause",
      });
    }
  }
  if (tasks.filter((task) => task.kind === "tracking").length > 1)
    return blocked("multiple-order-references");
  if (tasks.filter((task) => task.kind === "fees").length > 1)
    return blocked("multiple-fee-panels");
  if (tasks.filter((task) => task.kind === "catalog").length > 1)
    return blocked("multiple-catalog-panels");
  return {
    raw,
    tasks,
    unresolved,
    concurrency: 2,
    requiresClarification: unresolved.length > 0,
  };
}

export type VerifiedPayloads = {
  tracking: { orderId: string };
  catalog: { question: string };
  fees: { direction: "US_VN" | "VN_US"; question: string };
};
/** Canonical signatures verified at current28. Root injects actual imports;
 * action ambiguity remains a separate conservative root command policy. */
export type CanonicalReadDetectors = {
  tracking: (
    raw: string,
  ) =>
    | { kind: "none" }
    | { kind: "order"; orderId: string }
    | { kind: "ambiguous"; orderIds: string[] };
  catalog: (raw: string) => boolean;
  product: (raw: string) => { requiresInterpretation: boolean };
  direction: (raw: string) => "US_VN" | "VN_US" | null;
  actionOrAmbiguity: (raw: string) => boolean;
};
export function canonicalFrameDetectors(
  d: CanonicalReadDetectors,
): TrustedDetectors<VerifiedPayloads> {
  return {
    consequentialOrAmbiguousAction: d.actionOrAmbiguity,
    segmentationUnsafe: (raw) => d.product(raw).requiresInterpretation,
    // Syntax gate only; classification remains canonical. Short generic brand names
    // are intentionally insufficient to split a product conjunction.
    explicitReadStart: (raw) =>
      /^(?:\s*)(?:track\s+(?:my\s+)?order(?=\s|$|[:#])|(?:mã\s+đơn|ma\s+don|order\s+(?:id|code)|tìm|tim|find|search|phí|phi|cước|cuoc|shipping|freight|giải\s+thích|giai\s+thich|explain)(?=\s|$|:))/iu.test(
        raw,
      ),
    // Finite vetted spelling list, not a semantic permission or inferred product.
    preserveNameConjunction: (raw, start, end) => {
      for (const match of raw.matchAll(
        /(?:\bJohnson\s+and\s+Johnson\b|\bBath\s+and\s+Body\s+Works\b)/giu,
      )) {
        if (match.index! <= start && match.index! + match[0].length >= end)
          return true;
      }
      return false;
    },
    classify: (raw) => {
      const tracking = d.tracking(raw);
      if (tracking.kind === "none" && /^\s*track\s+(?:my\s+)?order(?=\s|$|[:#])/iu.test(raw)) return {kind: "clarify", reason: "tracking-id-required"};
      if (/^\s*(?:giải\s+thích|giai\s+thich|explain)(?=\s|$)/iu.test(raw))
        return { kind: "unknown" };
      if (
        tracking.kind === "order" &&
        /(?:\s(?:và|va|and)\s+|,\s*)[a-z0-9]+-/iu.test(raw)
      )
        return { kind: "clarify", reason: "additional-order-token" };
      if (tracking.kind === "ambiguous")
        return { kind: "clarify", reason: "multiple-order-ids" };
      const folded = raw
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .toLowerCase();
      const us = "(?:my|usa|us|america|united states)",
        vn = "(?:viet nam|vietnam|vn)";
      const forward = new RegExp("\\b" + us + "\\b.*\\b" + vn + "\\b").test(
        folded,
      );
      const reverse = new RegExp("\\b" + vn + "\\b.*\\b" + us + "\\b").test(
        folded,
      );
      if (forward && reverse)
        return { kind: "clarify", reason: "both-shipping-directions" };
      const direction = d.direction(raw);
      if (!direction && /^(?:\s*)(?:phi|cuoc|shipping|freight)\b/.test(folded))
        return { kind: "clarify", reason: "shipping-route-required" };
      // Explicit lexical product-read cues only; broad canonical catalog fallback
      // also accepts shipping text and cannot discriminate coexisting goals.
      const explicitCatalogRead =
        /(?:^|\s)(?:tim|kiem|find|search)(?=\s|$)/u.test(folded);
      if (tracking.kind === "order" && explicitCatalogRead)
        return { kind: "clarify", reason: "unsplit-tracking-and-catalog" };
      if (direction && explicitCatalogRead)
        return { kind: "clarify", reason: "unsplit-catalog-and-fees" };
      if (tracking.kind === "order" && direction)
        return { kind: "clarify", reason: "unsplit-multiple-goals" };
      if (tracking.kind === "order")
        return {
          kind: "read",
          task: { kind: "tracking", params: { orderId: tracking.orderId } },
        };
      if (direction)
        return {
          kind: "read",
          task: { kind: "fees", params: { direction, question: raw } },
        };
      if (d.product(raw).requiresInterpretation)
        return { kind: "clarify", reason: "interpretation-required" };
      if (d.catalog(raw))
        return {
          kind: "read",
          task: { kind: "catalog", params: { question: raw } },
        };
      return { kind: "unknown" };
    },
  };
}

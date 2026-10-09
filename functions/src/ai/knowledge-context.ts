import { createHash } from "node:crypto";
import { chunkKnowledge } from "./knowledge-retrieval";

export type ContextChunk = {
  id: string;
  documentId: string;
  revision: string;
  position: number;
  headingPath: string[];
  text: string;
};
/** Stable revision/span identity; headings provide context without rewriting evidence. */
export function revisionChunks(document: {
  id: string;
  body: string;
  revision: string;
}): ContextChunk[] {
  if (
    !/^[a-f0-9]{64}$/.test(document.revision) ||
    document.body.length > 20000 ||
    document.id.length > 108
  )
    throw Error("INVALID_CONTEXT_SOURCE");
  const headings = [...document.body.matchAll(/^(#{1,6})\s+([^\n]+)$/gm)];
  return chunkKnowledge(document.body).map((span) => {
    const path: string[] = [];
    for (const heading of headings) {
      if (heading.index! > span.position) break;
      path.length = heading[1].length - 1;
      path.push(heading[2]);
    }
    return {
      id: createHash("sha256")
        .update(
          JSON.stringify([
            document.id,
            document.revision,
            span.position,
            span.text,
          ]),
        )
        .digest("hex"),
      documentId: document.id,
      revision: document.revision,
      position: span.position,
      headingPath: path.filter(Boolean),
      text: span.text,
    };
  });
}
export type AskContext = {
  instruction: string;
  question: string;
  task: unknown;
  currentFacts: unknown;
  evidence: ContextChunk[];
  recentTurns: string[];
};
type Counter = (
  serializedRequest: string,
  signal: AbortSignal,
) => Promise<number>;
async function cancellableCount(
  count: Counter,
  serialized: string,
  signal: AbortSignal,
) {
  let aborted: () => void = () => {};
  try {
    return await Promise.race([
      count(serialized, signal),
      new Promise<never>((_, reject) => {
        aborted = () => reject(signal.reason ?? Error("CONTEXT_CANCELLED"));
        signal.addEventListener("abort", aborted, { once: true });
        if (signal.aborted) aborted();
      }),
    ]);
  } finally {
    signal.removeEventListener("abort", aborted);
  }
}

/** Counts the complete serialized model input. Protected task/facts never get
 * summarized, truncated or inferred; overflow fails instead of losing authority.
 * A model-specific exact counter must be supplied by the admitted provider.
 */
export async function packAskContext(
  input: AskContext,
  limits: {
    inputTokens: number;
    outputTokens: number;
    windowTokens: number;
    maximumBytes?: number;
  },
  count: Counter,
  signal: AbortSignal,
  serialize: (context: AskContext) => string = JSON.stringify,
) {
  if (
    ![limits.inputTokens, limits.outputTokens, limits.windowTokens].every(
      (n) => Number.isSafeInteger(n) && n > 0,
    ) ||
    limits.inputTokens + limits.outputTokens > limits.windowTokens ||
    (limits.maximumBytes !== undefined &&
      (!Number.isSafeInteger(limits.maximumBytes) ||
        limits.maximumBytes <= 0 ||
        limits.maximumBytes > 100000)) ||
    input.evidence.length > 8 ||
    input.recentTurns.length > 6
  )
    throw Error("INVALID_CONTEXT_LIMITS");
  const context: AskContext = JSON.parse(JSON.stringify(input)) as AskContext;
  const dropped = { turns: 0, evidence: 0 };
  for (let step = 0; step < 15; step++) {
    signal.throwIfAborted();
    const serialized = serialize(context);
    if (Buffer.byteLength(serialized, "utf8") > 100000)
      throw Error("CONTEXT_TOO_LARGE");
    const bytesFit =
      Buffer.byteLength(serialized, "utf8") <= (limits.maximumBytes ?? 100000);
    const tokens = bytesFit
      ? await cancellableCount(count, serialized, signal)
      : Infinity;
    signal.throwIfAborted();
    if (bytesFit && (!Number.isSafeInteger(tokens) || tokens <= 0))
      throw Error("INVALID_TOKEN_COUNT");
    if (tokens <= limits.inputTokens)
      return { context, serialized, tokens, dropped };
    if (context.recentTurns.length) {
      context.recentTurns.shift();
      dropped.turns++;
    } else if (context.evidence.length) {
      context.evidence.pop();
      dropped.evidence++;
    } else throw Error("REQUIRED_CONTEXT_OVERFLOW");
  }
  throw Error("CONTEXT_OVERFLOW");
}

/** Honest local bound while exact provider counting is unavailable. UTF-8 bytes
 * are not reported as tokens; excerpt text/title/id are included in the budget.
 */
export function boundKnowledgeContext<
  T extends { id: string; title: string; text: string },
>(rows: readonly T[], maximumBytes = 12000): T[] {
  if (
    !Number.isSafeInteger(maximumBytes) ||
    maximumBytes < 0 ||
    maximumBytes > 12000
  )
    return [];
  const result: T[] = [];
  for (const row of rows.slice(0, 8)) {
    const size = Buffer.byteLength(JSON.stringify([...result, row]), "utf8");
    if (size > maximumBytes) continue;
    result.push(row);
  }
  return result;
}

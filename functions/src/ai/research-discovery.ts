import { z } from "zod";
import {
  researchMerchant,
  researchPolicySchema,
} from "../../../packages/domain/ask-research";

const grounded = z
  .object({
    candidates: z
      .array(
        z
          .object({
            finishReason: z.literal("STOP"),
            groundingMetadata: z
              .object({
                groundingChunks: z
                  .array(
                    z
                      .object({
                        web: z
                          .object({
                            uri: z.string().max(4096),
                            title: z.string().max(160),
                          })
                          .passthrough(),
                      })
                      .strict(),
                  )
                  .max(30),
                webSearchQueries: z
                  .array(z.string().min(1).max(200))
                  .min(1)
                  .max(5),
                searchEntryPoint: z
                  .object({ renderedContent: z.string().min(1).max(30000) })
                  .strict(),
              })
              .passthrough(),
          })
          .passthrough(),
      )
      .length(1),
  })
  .passthrough();

/** Transport seam only. Never dispatch without reviewed cost/terms admission.
 * Grounding is discovery, not a verified offer. Keep Suggestions separate for
 * compliant rendering; never insert provider HTML into the host application.
 */
export async function discoverWebCandidates(
  input: { query: string; market: "US" | "JP" | "KR" },
  policy: unknown,
  transport: (query: string, signal: AbortSignal) => Promise<unknown>,
  signal: AbortSignal,
  resolveRedirect?: (
    uri: string,
    signal: AbortSignal,
  ) => Promise<string | null>,
) {
  const p = researchPolicySchema.parse(policy);
  if (
    !p.enabled ||
    p.expiresAt <= Date.now() ||
    input.query.length < 2 ||
    input.query.length > 200
  )
    throw Error("RESEARCH_UNAVAILABLE");
  signal.throwIfAborted();
  const response = grounded.parse(await transport(input.query, signal));
  signal.throwIfAborted();
  if (p.expiresAt <= Date.now()) throw Error("RESEARCH_UNAVAILABLE");
  const metadata = response.candidates[0].groundingMetadata;
  const seen = new Set<string>();
  const candidates: {
    url: string;
    title: string;
    price: null;
    reviews: null;
    verified: false;
  }[] = [];
  let resolved = 0;
  for (const { web } of metadata.groundingChunks) {
    // A discovery link has no seller proof. Only first-party retailer policies
    // can admit it; marketplace sellers must be verified by a separate adapter.
    let uri = web.uri;
    if (resolveRedirect && groundingRedirect(uri) && resolved < 5) {
      resolved++;
      signal.throwIfAborted();
      uri = (await resolveRedirect(uri, signal)) ?? "";
      signal.throwIfAborted();
      if (p.expiresAt <= Date.now()) throw Error("RESEARCH_UNAVAILABLE");
    }
    const url = researchMerchant(uri, input.market, "first-party", p);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    candidates.push({
      url,
      title: web.title,
      price: null,
      reviews: null,
      verified: false as const,
    });
    if (candidates.length === 5) break;
  }
  return {
    candidates,
    searchQueries: metadata.webSearchQueries,
    suggestionsHtml: metadata.searchEntryPoint.renderedContent,
  };
}

/** Only Google's fixed citation redirect surface is fetched, never supplied
 * merchant/private URLs. Resolve at most two hops; admit only reviewed targets.
 */
function groundingRedirect(value: string) {
  try {
    const u = new URL(value);
    return (
      value.length <= 4096 &&
      u.protocol === "https:" &&
      u.hostname === "vertexaisearch.cloud.google.com" &&
      !u.username &&
      !u.password &&
      !u.port &&
      !u.hash &&
      !u.search &&
      /^\/grounding-api-redirect\/[A-Za-z0-9_-]{10,4000}$/.test(u.pathname)
    );
  } catch {
    return false;
  }
}
export async function resolveGroundingRedirect(
  uri: string,
  policy: unknown,
  market: "US" | "JP" | "KR",
  getLocation: (uri: string, signal: AbortSignal) => Promise<string | null>,
  signal: AbortSignal,
) {
  const p = researchPolicySchema.parse(policy);
  if (!p.enabled || p.expiresAt <= Date.now()) return null;
  let current = uri;
  for (let hop = 0; hop < 2; hop++) {
    if (!groundingRedirect(current)) return null;
    signal.throwIfAborted();
    const target = await getLocation(current, signal);
    signal.throwIfAborted();
    if (p.expiresAt <= Date.now()) return null;
    if (!target) return null;
    const admitted = researchMerchant(target, market, "first-party", p);
    if (admitted) return admitted;
    current = target;
  }
  return null;
}

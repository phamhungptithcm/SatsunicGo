import { z } from "zod";
import { researchSearchSchema } from "./ask-research";
import { requestSchema } from "./index";
const time = z.number().int().positive().safe();
export const webDiscoveryInputSchema = researchSearchSchema.safeExtend({
  conversationId: z.string().uuid(),
  expectedVersion: z.number().int().nonnegative().safe(),
});
export const webDiscoveryResultSchema = z
  .object({
    conversationId: z.string().uuid(),
    expectedVersion: z.number().int().nonnegative().safe(),
    market: z.enum(["US", "JP", "KR"]),
    queryHash: z.string().regex(/^[a-f0-9]{64}$/),
    discoveryId: z.string().regex(/^[a-f0-9]{64}$/),
    observedAt: time,
    expiresAt: time,
    candidates: z
      .array(
        z
          .object({
            url: z
              .string()
              .url()
              .max(4096)
              .refine((value) => {
                const u = new URL(value);
                return (
                  u.protocol === "https:" &&
                  !u.username &&
                  !u.password &&
                  !u.port &&
                  !u.hash
                );
              }),
            title: z.string().min(1).max(160),
            price: z.null(),
            reviews: z.null(),
            verified: z.literal(false),
          })
          .strict(),
      )
      .max(5),
    suggestionsHtml: z.string().min(1).max(30000),
  })
  .strict()
  .refine(
    (row) =>
      row.expiresAt > row.observedAt &&
      row.expiresAt - row.observedAt <= 600000,
  );
export type WebDiscoveryResult = z.infer<typeof webDiscoveryResultSchema>;
export const webSelectInputSchema = z
  .object({
    discoveryId: z.string().regex(/^[a-f0-9]{64}$/),
    conversationId: z.string().uuid(),
    expectedVersion: z.number().int().nonnegative().safe(),
    index: z.number().int().min(0).max(4),
    quantity: z.number().int().min(1).max(99),
    variant: z.string().trim().min(1).max(160),
  })
  .strict();
export const webSelectResultSchema = z
  .object({ draft: requestSchema })
  .strict();
export function webReferenceDraft(
  result: WebDiscoveryResult,
  index: number,
  quantity: number,
  variant: string,
) {
  const candidate = result.candidates[index];
  if (!candidate || result.expiresAt <= Date.now())
    throw Error("WEB_REFERENCE_EXPIRED");
  return requestSchema.parse({
    market: result.market,
    items: [{ name: candidate.title, url: candidate.url, quantity, variant }],
    notes: `Nguồn tìm web chưa được xác minh; cần nhân viên kiểm tra và báo giá. Tham chiếu ${result.discoveryId}. Giá và đánh giá chưa xác nhận.`,
  });
}
/** Only an explicit selection can prepare a draft. A question never selects. */
export function webChatSelection(text: string, count: number) {
  const folded = text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .toLowerCase();
  if (
    !/^(?:chon|toi chon|minh chon|choose|select|i choose)\s+(?:nguon|source|option)\s+/u.test(
      folded,
    )
  )
    return null;
  const parts = text.split(/[,;]+/).map((part) => part.trim());
  const source = folded.match(
    /^(?:chon|toi chon|minh chon|choose|select|i choose)\s+(?:nguon|source|option)\s+(\d+)\s*(?:[,;]|$)/u,
  );
  if (!source || parts.length !== 3 || /[?？]/u.test(text))
    return { kind: "clarify" as const };
  const quantity = parts[1]
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .match(/^(?:so luong|quantity)\s+(\d+)$/u);
  const variant = parts[2].match(
    /^(?:mẫu|màu|mau|mau sac|variant)\s+(.{1,160})$/iu,
  );
  const index = Number(source[1]) - 1,
    n = quantity ? Number(quantity[1]) : NaN;
  if (
    !variant ||
    !Number.isSafeInteger(index) ||
    index < 0 ||
    index >= count ||
    !Number.isSafeInteger(n) ||
    n < 1 ||
    n > 99
  )
    return { kind: "clarify" as const };
  return {
    kind: "select" as const,
    index,
    quantity: n,
    variant: variant[1].trim(),
  };
}
/** A market must be explicit; never infer it from language or account location. */
export function discoveryMarket(text: string): "US" | "JP" | "KR" | null {
  const folded = text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .toLowerCase();
  const found = (
    [
      ["US", /\b(?:us|usa|america)\b|\b(?:o|tai|tu) my\b/],
      ["JP", /\b(?:jp|japan)\b|\b(?:o|tai|tu) nhat\b/],
      ["KR", /\b(?:kr|korea|han quoc)\b/],
    ] as const
  ).filter(
    ([market, re]) =>
      re.test(folded) ||
      (market === "US" && /(?:^|\s)Mỹ(?=\s|$|[.,!?])/u.test(text)) ||
      (market === "JP" && /(?:^|\s)Nhật(?=\s|$|[.,!?])/u.test(text)),
  );
  return found.length === 1 ? found[0][0] : null;
}

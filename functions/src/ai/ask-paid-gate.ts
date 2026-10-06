import { HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";

const unavailableCopy =
  "Em chưa thể hỗ trợ yêu cầu này lúc này. Anh/chị có thể gửi yêu cầu mua hộ.";

const pilotPolicy = z
  .object({
    schemaVersion: z.literal(1),
    enabled: z.literal(true),
    approved: z.literal(true),
    pilotUids: z
      .array(
        z
          .string()
          .min(1)
          .max(128)
          .refine((uid) => uid === uid.trim() && !/^(TODO|PLACEHOLDER)$/i.test(uid)),
      )
      .length(2)
      .refine((uids) => new Set(uids).size === 2),
  })
  .strict();

/** This guard deliberately denies every paid generation. No live provider
 * capability exists until full serialized input, billed reasoning/output and
 * one network attempt are verified independently. Settings cannot enable it.
 * uid must originate from requireVerifiedGoogle, never request data or email.
 * Do not import the private fake-adapter ledger as production authority. */
export function assertPaidAskReadiness(
  verifiedUid: string,
  serverPolicy: unknown,
): void {
  const parsed = pilotPolicy.safeParse(serverPolicy);
  if (
    !parsed.success ||
    typeof verifiedUid !== "string" ||
    !parsed.data.pilotUids.includes(verifiedUid)
  )
    throw new HttpsError("unavailable", unavailableCopy);

  // Even a valid server policy cannot replace verified provider cost bounds.
  // A future dispatching path requires a separately reviewed implementation.
  throw new HttpsError("unavailable", unavailableCopy);
}

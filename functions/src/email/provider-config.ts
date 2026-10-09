import { z } from "zod";

// Leave room for a next-day retry timestamp within the four-digit UTC year range.
export const MAX_EMAIL_TIMESTAMP = 253_402_214_399_999;
const timestamp = z.number().int().nonnegative().max(MAX_EMAIL_TIMESTAMP);
const providerConfig = z
  .object({
    approved: z.literal(true),
    provider: z.literal("resend"),
    enabled: z.boolean(),
    subscriptionsEnabled: z.boolean(),
    from: z.literal("contact@hunpeolabs.com"),
    verifiedDomain: z.literal("hunpeolabs.com"),
    cutoverAt: timestamp.positive(),
    dailyAttemptLimit: z.number().int().min(1).max(100),
    domainVerificationEvidenceId: z
      .string()
      .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/)
      .optional(),
    domainVerifiedAt: timestamp.positive().optional(),
  })
  .strict();

export type EmailProviderConfig = Readonly<z.infer<typeof providerConfig>>;

/** Trusted settings only. A configuration document is not provider verification proof. */
export function parseEmailProviderConfig(
  input: unknown,
): EmailProviderConfig | null {
  const parsed = providerConfig.safeParse(input);
  return parsed.success ? parsed.data : null;
}

/** Release orchestration must verify the referenced authenticated receipt independently. */
export function emailProviderReady(
  config: EmailProviderConfig | null,
  now = Date.now(),
): config is EmailProviderConfig {
  const parsed = parseEmailProviderConfig(config);
  return (
    !!parsed &&
    parsed.enabled &&
    !!parsed.domainVerificationEvidenceId &&
    !!parsed.domainVerifiedAt &&
    Number.isSafeInteger(now) &&
    now >= parsed.domainVerifiedAt &&
    now >= parsed.cutoverAt &&
    now <= MAX_EMAIL_TIMESTAMP
  );
}

import { z } from "zod";

export type EmailContent = Readonly<{
  subject: string;
  text: string;
  html: string;
}>;

export type SendOutcome =
  | { state: "accepted"; providerId: string }
  | { state: "rejected"; reason: "configuration" | "provider_rejected" }
  | { state: "unknown"; reason: "provider_unknown" };

export const resendMessageSchema = z.object({
  from: z.email().max(254),
  to: z.email().max(254),
  subject: z.string().min(1).max(200).regex(/^[^\r\n]+$/),
  text: z.string().min(1).max(16_000),
  html: z.string().min(1).max(32_000),
}).strict();

export type ResendMessage = z.infer<typeof resendMessageSchema>;
const providerResponse = z.object({ id: z.uuid() });

/** Server-only adapter. The caller must authorize recipient/content before claiming. */
export async function sendResend(
  message: ResendMessage,
  apiKey: string,
  idempotencyKey: string,
  request: typeof fetch = fetch,
): Promise<SendOutcome> {
  const validated = resendMessageSchema.safeParse(message);
  if (!validated.success || !/^re_[A-Za-z0-9_-]{16,200}$/.test(apiKey) ||
      !/^[A-Za-z0-9/_-]{1,200}$/.test(idempotencyKey)) {
    return { state: "rejected", reason: "configuration" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await request("https://api.resend.com/emails", {
      method: "POST",
      redirect: "error",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(validated.data),
    });
    if (!response.ok) {
      // Do not parse/log rejection bodies; they may contain recipient or key data.
      await response.body?.cancel();
      return [400, 401, 403, 404, 422, 429].includes(response.status)
        ? { state: "rejected", reason: "provider_rejected" }
        : { state: "unknown", reason: "provider_unknown" };
    }
    const reader = response.body?.getReader();
    if (!reader) return { state: "unknown", reason: "provider_unknown" };
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > 4_096) {
          await reader.cancel();
          return { state: "unknown", reason: "provider_unknown" };
        }
        chunks.push(chunk.value);
      }
    } finally {
      reader.releaseLock();
    }
    const parsed = providerResponse.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    return parsed.success
      ? { state: "accepted", providerId: parsed.data.id }
      : { state: "unknown", reason: "provider_unknown" };
  } catch {
    // A timeout/connection failure cannot prove that the provider did not accept.
    return { state: "unknown", reason: "provider_unknown" };
  } finally {
    clearTimeout(timer);
  }
}

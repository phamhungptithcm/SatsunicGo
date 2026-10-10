import { timingSafeEqual, createHash } from "node:crypto";
import { defineSecret } from "firebase-functions/params";
import { SePayPgClient } from "sepay-pg-node";
import {
  SEPAY_CHECKOUT_URL,
  SEPAY_MERCHANT,
  admitSePayForm,
  type SePayIntent,
} from "../../../packages/domain/purchase-sepay";
import { purchaseDemoEnvironment } from "../purchase-environment";
import {
  sepayArtifactEnvironment,
  productionTestEnvironment,
} from "../production-test-policy";
import { purchaseExecutionProvenance } from "../../../packages/domain/purchase-checkout";

// defineSecret registers deploy-time params even when no endpoint binds them.
const registerSecrets = sepayArtifactEnvironment();
export const sepaySandboxSecret = registerSecrets
  ? defineSecret("SEPAY_SANDBOX_SECRET_KEY")
  : undefined;
// IPN authentication is independently configured in the merchant dashboard.
export const sepaySandboxIpnSecret = registerSecrets
  ? defineSecret("SEPAY_SANDBOX_IPN_SECRET_KEY")
  : undefined;
export const sepaySecrets = [sepaySandboxSecret, sepaySandboxIpnSecret].filter(
  (secret) => secret !== undefined,
);
export function sandboxPaymentReady() {
  return (
    !!sepaySandboxSecret &&
    !!sepaySandboxIpnSecret &&
    (purchaseDemoEnvironment() || productionTestEnvironment()) &&
    process.env.PURCHASE_SEPAY_SANDBOX_ENABLED === "true" &&
    Boolean(process.env.SEPAY_SANDBOX_SECRET_KEY) &&
    Boolean(process.env.SEPAY_SANDBOX_IPN_SECRET_KEY)
  );
}
export function authenticSePayIpn(header: unknown, expected: string) {
  if (typeof header !== "string" || !expected || header.length > 512)
    return false;
  return timingSafeEqual(
    createHash("sha256").update(header).digest(),
    createHash("sha256").update(expected).digest(),
  );
}
export interface SePayAdapter {
  form(intent: SePayIntent): ReturnType<typeof admitSePayForm>;
  readback(orderId: string): Promise<unknown>;
}
export function sandboxAdapter(): SePayAdapter {
  if (!sepaySandboxSecret || !sandboxPaymentReady())
    throw Error("SEPAY_NOT_CONFIGURED");
  // SDK is used only for signing. Its axios API has no default timeout and
  // shares static base URLs, so all readback uses the fixed, bounded client below.
  return createSandboxAdapter(sepaySandboxSecret.value());
}
/** Injectable only in internal tests; never accepts a client-supplied secret or URL. */
export function createSandboxAdapter(
  secret: string,
  transport: typeof fetch = fetch,
): SePayAdapter {
  if (!secret || secret.length > 512) throw Error("SEPAY_NOT_CONFIGURED");
  const client = new SePayPgClient({
    env: "sandbox",
    merchant_id: SEPAY_MERCHANT,
    secret_key: secret,
  });
  return {
    form(intent) {
      // The injectable signer is shared with unit tests; hosted admission checks
      // the persisted mode before it reaches this boundary.
      if (
        intent.merchant !== SEPAY_MERCHANT ||
        intent.provider !== "sepay_sandbox" ||
        intent.paymentMethod !== "BANK_TRANSFER"
      )
        throw Error("SEPAY_BINDING_MISMATCH");
      const provenance = purchaseExecutionProvenance(intent);
      const base = `${provenance ? "https://satsunicgo.web.app" : "http://127.0.0.1:5207"}/checkout/payment/${intent.checkoutId}`;
      const signed = client.checkout.initOneTimePaymentFields({
        payment_method: "BANK_TRANSFER",
        order_invoice_number: intent.invoice,
        order_amount: intent.amount,
        currency: "VND",
        order_description: `SatsunicGo ${intent.invoice}`,
        success_url: `${base}?sepay=success`,
        error_url: `${base}?sepay=error`,
        cancel_url: `${base}?sepay=cancel`,
      });
      if (client.checkout.initCheckoutUrl() !== SEPAY_CHECKOUT_URL)
        throw Error("SEPAY_HOST_INVALID");
      return admitSePayForm(
        {
          action: SEPAY_CHECKOUT_URL,
          fields: Object.entries(signed).map(([key, value]) => [
            key,
            String(value),
          ]),
        },
        { id: intent.checkoutId, total: intent.amount, ...(provenance ?? {}) },
      );
    },
    async readback(orderId) {
      if (!/^[A-Za-z0-9_-]{1,100}$/.test(orderId))
        throw Error("SEPAY_ORDER_INVALID");
      const controller = new AbortController(),
        timer = setTimeout(() => controller.abort(), 10000);
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      try {
        const response = await transport(
          `https://pgapi-sandbox.sepay.vn/v1/order/detail/${orderId}`,
          {
            method: "GET",
            redirect: "error",
            signal: controller.signal,
            headers: {
              authorization: `Basic ${Buffer.from(`${SEPAY_MERCHANT}:${secret}`).toString("base64")}`,
              accept: "application/json",
            },
          },
        );
        if (
          !response.ok ||
          !response.body ||
          !/^application\/json(?:;|$)/i.test(
            response.headers.get("content-type") ?? "",
          )
        )
          throw Error("SEPAY_READBACK_FAILED");
        reader = response.body.getReader();
        let size = 0;
        const chunks: Uint8Array[] = [];
        for (;;) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.length;
          if (size > 262144) throw Error("SEPAY_RESPONSE_TOO_LARGE");
          chunks.push(part.value);
        }
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        // Never propagate SDK/fetch errors containing headers, URL or raw body.
        throw Error("SEPAY_READBACK_UNAVAILABLE");
      } finally {
        clearTimeout(timer);
        controller.abort();
        if (reader) {
          await reader.cancel().catch(() => undefined);
          reader.releaseLock();
        }
      }
    },
  };
}

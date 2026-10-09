import { z } from "zod";

export const demoGatewayInput = z
  .object({
    id: z.string().uuid(),
    action: z.enum([
      "createLink",
      "linkStatus",
      "reconcile",
      "pay",
      "cancel",
      "loseResponse",
      "payWithoutWebhook",
      "underpay",
      "overpay",
      "decline",
    ]),
  })
  .strict();
export const demoWebhookSchema = z
  .object({
    code: z.literal("00"),
    desc: z.string().max(100),
    success: z.literal(true),
    data: z
      .object({
        orderCode: z.number().int().positive().safe(),
        amount: z.number().int().positive().safe(),
        description: z.string().max(80),
        accountNumber: z.literal("DEMO-NO-BANK"),
        reference: z.string().regex(/^DEMO-[a-zA-Z0-9-]{1,80}$/),
        transactionDateTime: z.string().min(1).max(50),
        currency: z.literal("VND"),
        paymentLinkId: z.string().regex(/^[a-f0-9]{32}$/),
        code: z.literal("00"),
        desc: z.string().max(100),
      })
      .strict(),
    signature: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export type DemoPaymentLink = {
  paymentLinkId: string;
  orderCode: number;
  amount: number;
  currency: "VND";
  status:
    | "PENDING"
    | "PROCESSING"
    | "PAID"
    | "CANCELLED"
    | "EXPIRED"
    | "UNDERPAID"
    | "FAILED";
  expiresAt: number;
  checkoutUrl: string;
};
export function assertDemoProviderBinding(
  data: z.infer<typeof demoWebhookSchema>["data"],
  expected: {
    paymentLinkId: string;
    orderCode: number;
    amount: number;
    currency: string;
    reference?: string;
    paidAmount?: number;
    paidAt?: number;
    status: string;
  },
) {
  if (
    !["PAID", "UNDERPAID"].includes(expected.status) ||
    data.paymentLinkId !== expected.paymentLinkId ||
    data.orderCode !== expected.orderCode ||
    data.amount !== (expected.paidAmount ?? expected.amount) ||
    data.currency !== expected.currency ||
    data.reference !== expected.reference ||
    !Number.isSafeInteger(expected.paidAt) ||
    expected.paidAt! < 0 ||
    Date.parse(data.transactionDateTime) !== expected.paidAt
  )
    throw Error("PROVIDER_PROOF_MISMATCH");
}

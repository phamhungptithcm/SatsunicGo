import { z } from "zod";

export const notificationConsentVersion = "notification-preferences-v1";
export const notificationTopics = [
  "orderEmail",
  "promotionsEmail",
  "orderSms",
] as const;
export type NotificationTopic = (typeof notificationTopics)[number];
export type NotificationChannel = "email" | "sms";
export const notificationSelectionsSchema = z
  .object({
    orderEmail: z.boolean(),
    promotionsEmail: z.boolean(),
    orderSms: z.boolean(),
  })
  .strict();
export type NotificationSelections = z.infer<
  typeof notificationSelectionsSchema
>;
export const notificationPhoneSchema = z
  .string()
  .trim()
  .max(20)
  .transform((s) => s.replace(/\s/g, "").replace(/^0/, "+84"))
  .refine(
    (s) => s === "" || /^\+84[35789][0-9]{8}$/.test(s),
    "Số điện thoại Việt Nam chưa hợp lệ.",
  );
const topicSchema = z
  .object({
    requested: z.boolean(),
    generation: z.number().int().nonnegative(),
    confirmedGeneration: z.number().int().nonnegative().nullable(),
  })
  .strict();
export const notificationPreferencesSchema = z
  .object({
    schemaVersion: z.literal(1),
    version: z.number().int().nonnegative(),
    email: z.string().max(254),
    phone: notificationPhoneSchema,
    topics: z
      .object({
        orderEmail: topicSchema,
        promotionsEmail: topicSchema,
        orderSms: topicSchema,
      })
      .strict(),
    updatedAt: z.number().int().nonnegative(),
  })
  .strict();
export type NotificationPreferencesData = z.infer<
  typeof notificationPreferencesSchema
>;
export type NotificationPreferencesView = NotificationPreferencesData & {
  availability: { email: boolean; sms: boolean };
};
export function notificationChannel(
  topic: NotificationTopic,
): NotificationChannel {
  return topic === "orderSms" ? "sms" : "email";
}
export function notificationState(
  topic: z.infer<typeof topicSchema>,
): "off" | "pending" | "active" {
  return !topic.requested
    ? "off"
    : topic.confirmedGeneration === topic.generation
      ? "active"
      : "pending";
}
export function emptyNotificationPreferences(
  email: string,
): NotificationPreferencesData {
  return {
    schemaVersion: 1,
    version: 0,
    email,
    phone: "",
    topics: {
      orderEmail: {
        requested: false,
        generation: 0,
        confirmedGeneration: null,
      },
      promotionsEmail: {
        requested: false,
        generation: 0,
        confirmedGeneration: null,
      },
      orderSms: { requested: false, generation: 0, confirmedGeneration: null },
    },
    updatedAt: 0,
  };
}
export function changeNotificationPreferences(
  previous: NotificationPreferencesData,
  email: string,
  phone: string,
  selected: NotificationSelections,
  now: number,
): NotificationPreferencesData {
  if (selected.orderSms && !phone) throw Error("PHONE_REQUIRED");
  const next = structuredClone(previous);
  let changed = previous.email !== email || previous.phone !== phone;
  next.email = email;
  next.phone = phone;
  for (const key of notificationTopics) {
    const old = previous.topics[key];
    const destinationChanged =
      notificationChannel(key) === "email"
        ? previous.email !== email
        : previous.phone !== phone;
    if (old.requested !== selected[key] || destinationChanged) {
      changed = true;
      next.topics[key] = {
        requested: selected[key],
        generation: old.generation + 1,
        confirmedGeneration: null,
      };
    }
  }
  if (changed) {
    next.version++;
    next.updatedAt = now;
  }
  return next;
}
export const notificationRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("read") }).strict(),
  z
    .object({
      action: z.literal("save"),
      operationId: z.uuid(),
      expectedVersion: z.number().int().nonnegative(),
      selected: notificationSelectionsSchema,
      phone: notificationPhoneSchema,
      source: z.enum(["checkout", "profile"]),
    })
    .strict(),
  z
    .object({
      action: z.literal("resend"),
      operationId: z.uuid(),
      expectedVersion: z.number().int().nonnegative(),
      channel: z.enum(["email", "sms"]),
    })
    .strict(),
  z
    .object({
      action: z.literal("confirm"),
      token: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .strict(),
  z
    .object({
      action: z.literal("unsubscribe"),
      token: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .strict(),
]);
export type NotificationRequest = z.infer<typeof notificationRequestSchema>;

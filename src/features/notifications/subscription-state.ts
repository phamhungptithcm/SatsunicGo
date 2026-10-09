import {
  notificationPreferencesSchema,
  notificationSelectionsSchema,
} from "../../../packages/domain/notification-preferences";
import { z } from "zod";
export const notificationViewSchema = notificationPreferencesSchema.extend({
  availability: z.object({ email: z.boolean(), sms: z.boolean() }).strict(),
});
export function selectedNotifications(
  view: z.infer<typeof notificationViewSchema>,
) {
  return notificationSelectionsSchema.parse(
    Object.fromEntries(
      Object.entries(view.topics).map(([key, value]) => [key, value.requested]),
    ),
  );
}

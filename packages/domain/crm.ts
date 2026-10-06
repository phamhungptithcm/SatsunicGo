import { z } from "zod";

export const customerId = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
export const crmRoles = ["OWNER", "OPERATIONS_MANAGER", "SUPPORT"] as const;
export function normalizeCustomerName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
export const customerNotesSchema = z
  .object({
    id: customerId,
    operationId: z.string().uuid(),
    expectedVersion: z.number().int().positive().optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(15),
    notes: z.string().max(4000),
    assigneeId: customerId.or(z.literal("")),
    followUpAt: z.number().int().nonnegative().max(8640000000000000),
  })
  .strict();
export type CustomerNotes = z.infer<typeof customerNotesSchema>;
export type CustomerRow = {
  id: string;
  displayName: string;
  businessName: string;
  tags: string[];
  assigneeId: string;
  followUpAt: number;
};
export function localDateTime(value: number) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(value - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function appointmentTimestamp(input: string, previous = 0) {
  if (!input) return 0;
  if (input === localDateTime(previous)) return previous;
  return new Date(input).getTime();
}

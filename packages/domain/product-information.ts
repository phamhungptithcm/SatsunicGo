import { z } from "zod";
export const productSourceUrl = z
  .string()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return (
        ["https:", "http:"].includes(url.protocol) &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  });
export const productInformationShape = {
  manufacturingOrigin: z.string().trim().max(200).optional(),
  brand: z.string().trim().max(120).optional(),
  productSummary: z.string().trim().max(500).optional(),
  retailer: z.string().trim().max(120).optional(),
  sourceUrl: productSourceUrl.optional(),
  usageSteps: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
};
export const productInformationSchema = z.object(productInformationShape);
export type ProductInformation = z.infer<typeof productInformationSchema>;
export function usageLines(info: ProductInformation & { usage?: string }) {
  return info.usageSteps?.length
    ? info.usageSteps
    : info.usage
      ? [info.usage]
      : [];
}

import { z } from 'zod/v4';

// Cashier
export const CashierResponseSchema = z.object({
  success: z.string(),
  saleOrderId: z.string(),
  paymentId: z.string(),
  totalPaid: z.union([z.number(), z.string()]).transform(Number),
  profit: z.union([z.number(), z.string()]).transform(Number),
});

/** Validate API response data or throw a descriptive error */
export function validateOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.error) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Response validation failed: ${errors.join(', ')}`);
  }
  return result.data;
}

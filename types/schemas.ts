import { z } from 'zod/v4';

// Common
export const PaginatedMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

// Auth
export const LoginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  }),
});

// SKU Info
export const SkuInfoSchema = z.object({
  skuId: z.string().nullable(),
  category: z.string().nullable(),
});

// IMEI Check
export const ImeiCheckSchema = z.object({
  sn: z.string(),
  blocked: z.boolean(),
  blacklistReason: z.string().nullable(),
  existingDeviceId: z.string().nullable(),
  inThisStore: z.boolean(),
  inOtherStore: z.boolean(),
  otherStoreName: z.string().nullable(),
  inventoryStatus: z.string().nullable(),
});

// Quick Inbound
export const QuickInboundResponseSchema = z.object({
  success: z.string(),
  deviceId: z.string(),
  goodsInboundOrderId: z.string(),
  paymentId: z.string().nullable(),
});

// Device
export const DeviceSchema = z.object({
  id: z.string(),
  sn: z.string(),
  internalSn: z.string().nullable(),
  skuId: z.string(),
  storeId: z.string(),
  organizationId: z.string(),
  inventoryStatus: z.enum(['IN_STOCK', 'SOLD', 'RETURNED_OUT']),
  batteryHealthPercent: z.number().nullable(),
  inboundAt: z.string().nullable(),
  warrantyDays: z.number().nullable(),
  warrantyStartDate: z.string().nullable(),
  warrantyEndDate: z.string().nullable(),
  warrantyType: z.string().nullable(),
  version: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Device Pricing
export const DevicePricingSchema = z.object({
  id: z.string(),
  deviceId: z.string(),
  unitCost: z.string(),
  peerPrice: z.string().nullable(),
  retailPrice: z.string().nullable(),
  otherCost: z.string(),
  settlementStatus: z.string(),
  settlementMethod: z.string().nullable(),
});

// Ledger Entry
export const LedgerEntrySchema = z.object({
  id: z.string(),
  storeId: z.string(),
  organizationId: z.string(),
  type: z.string(),
  amount: z.string(),
  deviceId: z.string().nullable(),
  relatedOrderId: z.string().nullable(),
  relatedOrderType: z.string().nullable(),
  itemCategory: z.string().nullable(),
  description: z.string(),
  userId: z.string(),
  createdAt: z.string(),
});

// Customer
export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  level: z.string(),
  lifetimeValue: z.string(),
  createdAt: z.string(),
});

// Repair
export const RepairSchema = z.object({
  id: z.string(),
  status: z.string(),
  description: z.string(),
  sn: z.string().nullable(),
  estimatedCost: z.union([z.string(), z.number()]).nullable(),
  actualCost: z.union([z.string(), z.number()]).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Cashier
export const CashierResponseSchema = z.object({
  success: z.string(),
  saleOrderId: z.string(),
  paymentId: z.string(),
  totalPaid: z.number(),
  profit: z.number(),
});

// Daily Report
export const DailyReportSchema = z.object({
  date: z.string(),
  purchase: z.object({
    count: z.number(),
    cost: z.number(),
  }),
  sales: z.object({
    count: z.number(),
    amount: z.number(),
  }),
  netCashFlow: z.number(),
  profitTop5: z.array(z.object({
    modelName: z.string(),
    profit: z.number(),
  })),
  stockAgeWarning: z.number(),
  receivableDue: z.number(),
  payableDue: z.number(),
});

// Store
export const StoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  organizationId: z.string(),
  Organization: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

// Store Member
export const StoreMemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  storeId: z.string(),
  role: z.string(),
  Store: StoreSchema,
});

// Error response
export const ErrorResponseSchema = z.object({
  error: z.string().optional(),
  错误: z.string().optional(),
});

// Helper to validate or throw
export function validateOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.error) {
    // In development, log the validation error
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Response validation failed: ${errors.join(', ')}`);
  }
  return result.data;
}

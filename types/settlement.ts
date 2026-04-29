/** GET /api/daily-settlements 单行（Decimal 已由后端 toNum）；可选字段与后端一致用 `| null` */
export interface DailySettlement {
  id: string;
  storeId: string;
  organizationId: string;
  date: string;
  settledById: string;
  settledAt: string;
  nextShiftId: string | null;
  shiftStartedAt: string | null;
  shiftEndedAt: string | null;
  openingCash: number;
  closingCash: number;
  expectedCash: number;
  cashDifference: number;
  totalSales: number;
  totalPurchases: number;
  totalRefunds: number;
  totalExpenses: number;
  devicesIn: number;
  devicesOut: number;
  paymentBreakdown: Record<string, number> | null;
  discrepancyNote: string | null;
  isBalanced: boolean;
  approvedById: string | null;
  approvedAt: string | null;
  status: string;
}

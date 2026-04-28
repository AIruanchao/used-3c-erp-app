import { api } from '../lib/api';

export interface DailyReport {
  date: string;
  purchase: {
    count: number;
    cost: number;
  };
  sales: {
    count: number;
    amount: number;
  };
  netCashFlow: number;
  profitTop5: Array<{ modelName: string; profit: number }>;
  stockAgeWarning: number;
  receivableDue: number;
  payableDue: number;
}

export async function getDailyReport(params: {
  storeId?: string;
  organizationId?: string;
  date?: string;
}): Promise<DailyReport> {
  const res = await api.get('/api/dashboard/daily-report', { params });
  return res.data;
}

export interface InventorySummary {
  inStockCount: number;
  inStockCost: string;
  avgUnitCost: string;
  ageBuckets: { lt15: number; d15to30: number; gt30: number };
}

export async function getInventorySummary(params: {
  storeId?: string;
  organizationId?: string;
}): Promise<InventorySummary> {
  const res = await api.get('/api/dashboard/inventory-summary', { params });
  return res.data;
}

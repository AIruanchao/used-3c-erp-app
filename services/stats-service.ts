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

export async function getSalesStats(params: {
  storeId?: string;
  organizationId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const res = await api.get('/api/dashboard/daily-report', { params });
  return res.data;
}

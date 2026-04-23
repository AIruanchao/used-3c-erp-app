import { api } from '../lib/api';

export interface DailyReport {
  date: string;
  totalSales: string;
  totalPurchases: string;
  totalDevicesIn: number;
  totalDevicesOut: number;
  totalRepairs: number;
  profit: string;
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

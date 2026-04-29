import { api } from '../lib/api';
import type { DailySettlement } from '../types/settlement';

export async function getSettlementList(params: {
  organizationId: string;
  storeId: string;
  date?: string;
}): Promise<{ items: DailySettlement[] }> {
  const res = await api.get<{ items: DailySettlement[] }>('/api/daily-settlements', { params });
  return res.data;
}

export async function createSettlement(params: {
  storeId: string;
  organizationId: string;
  openingCash: number;
  closingCash: number;
  discrepancyNote?: string;
}): Promise<{ success: string; id: string; isBalanced: boolean; cashDifference: number }> {
  const res = await api.post<{ success: string; id: string; isBalanced: boolean; cashDifference: number }>(
    '/api/daily-settlements',
    params,
  );
  return res.data;
}

import { api } from '../lib/api';
import type { OutboundItem, OutboundDetail } from '../types/outbound';

export interface OutboundListResult {
  items: OutboundItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getOutboundList(params: {
  organizationId: string;
  storeId: string;
  page?: number;
  pageSize?: number;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}): Promise<OutboundListResult> {
  const res = await api.get<OutboundListResult>('/api/outbound', { params });
  return res.data;
}

export async function getOutboundPrintDetail(orderId: string): Promise<OutboundDetail> {
  const res = await api.get<OutboundDetail>(`/api/outbound/print/${orderId}`);
  return res.data;
}

import { api } from '../lib/api';
import type { TradeOrderDto } from '../types/trade-order';

export async function listTradeOrders(params: {
  organizationId: string;
  storeId: string;
  status?: string;
}) {
  const res = await api.get<{ items: TradeOrderDto[] }>('/api/trade-orders', { params });
  return res.data;
}

export async function createTradeOrder(body: {
  organizationId: string;
  storeId: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    sn: string;
    appraisedValue: string;
    skuId?: string;
    condition?: string;
    note?: string;
    inspectionResult?: Record<string, boolean>;
    marketRefPrice?: string;
    tradeOfferPrice?: string;
    photos?: string[];
  }>;
}) {
  const res = await api.post<{ id: string; status: string }>('/api/trade-orders', body);
  return res.data;
}

export async function patchTradeOrder(
  id: string,
  body: { organizationId: string; storeId: string; action: 'COMPLETE' | 'CANCEL' },
) {
  const res = await api.patch<{ ok: boolean; status: string }>(`/api/trade-orders/${id}`, body);
  return res.data;
}

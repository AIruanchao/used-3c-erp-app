import { api } from '../lib/api';
import type {
  QuickInboundRequest,
  QuickInboundResponse,
  SkuInfoResponse,
  ImeiCheckResponse,
} from '../types/api';

export async function quickInbound(
  data: QuickInboundRequest,
): Promise<QuickInboundResponse> {
  const res = await api.post('/api/quick-inbound', data);
  return res.data;
}

export async function getSkuInfo(modelId: string): Promise<SkuInfoResponse> {
  const res = await api.get('/api/inbound/sku-info', { params: { modelId } });
  return res.data;
}

export async function checkImei(params: {
  sn: string;
  organizationId: string;
  storeId: string;
}): Promise<ImeiCheckResponse> {
  const res = await api.post('/api/imei/check', params);
  return res.data;
}

export async function getInboundReceived(params: {
  storeId?: string;
  organizationId?: string;
  page?: number;
  pageSize?: number;
}) {
  const res = await api.get('/api/inbound/received', { params });
  return res.data;
}

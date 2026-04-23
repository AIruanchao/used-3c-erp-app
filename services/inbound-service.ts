import { api } from '../lib/api';
import type { Device } from '../types/device';

export interface QuickInboundResult {
  success: string;
  deviceId: string;
  goodsInboundOrderId: string;
  paymentId: string | null;
}

export async function quickInbound(data: {
  sn: string;
  skuId: string;
  storeId: string;
  organizationId: string;
  unitCost: string;
  peerPrice?: string;
  retailPrice?: string;
  condition?: string;
  channel?: string;
  supplierId?: string;
  remark?: string;
}): Promise<QuickInboundResult> {
  const res = await api.post('/api/devices/quick-inbound', data);
  return res.data;
}

export async function getSkuInfo(barcode: string) {
  const res = await api.get('/api/inbound/sku-info', { params: { barcode } });
  return res.data;
}

export async function checkImei(sn: string, storeId?: string, organizationId?: string): Promise<{
  sn: string;
  blocked: boolean;
  blacklistReason: string | null;
  existingDeviceId: string | null;
  inThisStore: boolean;
  inOtherStore: boolean;
  otherStoreName: string | null;
  inventoryStatus: string | null;
}> {
  const res = await api.get('/api/imei/check', {
    params: { sn, storeId, organizationId },
  });
  return res.data;
}

export async function getInboundReceived(params: {
  storeId?: string;
  organizationId?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: Array<{
  id: string;
  status: string;
  remark: string | null;
  createdAt: string;
  GoodsInboundLine?: Array<{
    id: string;
    sn?: string;
    quantity: number;
    unitCost: string;
    Sku?: { name: string };
  }>;
}> }> {
  const res = await api.get('/api/inbound/received', { params });
  return res.data;
}

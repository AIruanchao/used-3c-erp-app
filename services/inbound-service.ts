import { api } from '../lib/api';
import type { Device } from '../types/device';
import type { PaginatedResponse } from '../types/api';

export interface InboundParams {
  storeId?: string;
  organizationId?: string;
  page?: number;
  pageSize?: number;
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
}): Promise<Device> {
  const res = await api.post('/api/devices/quick-inbound', data);
  return res.data;
}

export async function getSkuInfo(barcode: string) {
  const res = await api.get('/api/sku/info', { params: { barcode } });
  return res.data;
}

export async function checkImei(imei: string): Promise<{
  valid: boolean;
  blocked: boolean;
  blacklistReason: string | null;
  existingDeviceId: string | null;
  inThisStore: boolean;
  inOtherStore: boolean;
  otherStoreName: string | null;
  inventoryStatus: string | null;
  message: string;
  device?: Device;
}> {
  const res = await api.get('/api/imei/check', { params: { imei } });
  return res.data;
}

export async function getInboundReceived(
  params: InboundParams,
): Promise<PaginatedResponse<{
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
}>> {
  const res = await api.get('/api/inbound/received', { params });
  return res.data;
}

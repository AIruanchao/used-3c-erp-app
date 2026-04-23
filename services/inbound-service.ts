import { api } from '../lib/api';

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

export async function getSkuInfo(modelId: string): Promise<{ skuId: string | null; category: string | null }> {
  const res = await api.get('/api/inbound/sku-info', { params: { modelId } });
  return res.data;
}

export async function checkImei(sn: string, storeId: string, organizationId: string): Promise<{
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

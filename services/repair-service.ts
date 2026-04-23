import { api } from '../lib/api';

export interface RepairItem {
  id: string;
  status: string;
  faultDescription: string;
  deviceSn: string | null;
  customerName: string | null;
  customerPhone: string | null;
  deviceBrand: string | null;
  deviceModel: string | null;
  quoteAmount: number | null;
  createdAt: string;
  updatedAt: string;
}

export async function createRepair(data: {
  storeId: string;
  organizationId: string;
  deviceId?: string | null;
  deviceSn?: string | null;
  customerId?: string | null;
  customerName?: string;
  customerPhone?: string;
  deviceBrand?: string;
  deviceModel?: string;
  faultCategory?: string;
  faultDescription: string;
  estimatedCost?: number | null;
}): Promise<{ ok: boolean; order: RepairItem }> {
  const res = await api.post('/api/repair/create', data);
  return res.data;
}

export async function quoteRepair(
  repairId: string,
  data: { estimatedCost: number; note?: string },
): Promise<{ ok: boolean }> {
  const res = await api.post('/api/repair/quote', { repairId, ...data });
  return res.data;
}

export async function startRepair(repairId: string): Promise<{ ok: boolean }> {
  const res = await api.post('/api/repair/start', { repairId });
  return res.data;
}

export async function completeRepair(
  repairId: string,
  data?: { actualCost?: number; note?: string },
): Promise<{ ok: boolean }> {
  const res = await api.post('/api/repair/complete', { repairId, ...data });
  return res.data;
}

export async function qcRepair(repairId: string): Promise<{ ok: boolean }> {
  const res = await api.post('/api/repair/qc', { repairId });
  return res.data;
}

export async function deliverRepair(repairId: string): Promise<{ ok: boolean }> {
  const res = await api.post('/api/repair/deliver', { repairId });
  return res.data;
}

import { api } from '../lib/api';

export interface RepairItem {
  id: string;
  status: string;
  description: string;
  sn: string | null;
  estimatedCost: string | null;
  actualCost: string | null;
  createdAt: string;
  updatedAt: string;
  Device?: {
    id: string;
    sn: string;
    Sku?: {
      id: string;
      name: string;
    };
  };
  Customer?: {
    id: string;
    name: string;
    phone: string;
  };
}

export async function createRepair(data: {
  storeId: string;
  organizationId: string;
  deviceId?: string | null;
  sn?: string | null;
  customerId?: string | null;
  description: string;
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

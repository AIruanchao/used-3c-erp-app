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
  customerId: string;
  deviceId?: string | null;
  deviceSn?: string | null;
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
  data: {
    lines: Array<{
      type: string;
      sparePartName: string;
      quantity: number;
      unitCost: number;
      unitPrice: number;
    }>;
    laborCost: number;
    quoteValidDays?: number;
    repairMode?: string;
    estimatedHours?: number;
  },
): Promise<{ ok: boolean }> {
  const res = await api.post('/api/repair/quote', { orderId: repairId, ...data });
  return res.data;
}

export async function startRepair(repairId: string, technicianId?: string): Promise<{ ok: boolean }> {
  const res = await api.post('/api/repair/start', {
    orderId: repairId,
    technicianId: technicianId || undefined,
  });
  return res.data;
}

export async function completeRepair(
  repairId: string,
  data?: { repairNotes?: string },
): Promise<{ ok: boolean }> {
  const res = await api.post('/api/repair/complete', { orderId: repairId, ...data });
  return res.data;
}

export async function qcRepair(repairId: string): Promise<{ ok: boolean }> {
  const res = await api.post('/api/repair/qc', { orderId: repairId, qcStatus: 'PASS' });
  return res.data;
}

export async function deliverRepair(repairId: string): Promise<{ ok: boolean }> {
  const res = await api.post('/api/repair/deliver', { orderId: repairId, pickupMode: 'SELF' });
  return res.data;
}

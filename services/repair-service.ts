import { offlinePost } from './api-helpers';
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
  customerName: string;
  customerPhone?: string;
  deviceBrand: string;
  deviceModel: string;
  faultCategory?: string;
  faultDescription: string;
  estimatedCost?: number | null;
  faultPhotos?: string[];
  source?: string;
  password?: string;
  keepStatus?: string;
  repairStatusTags?: string[];
  deviceConditionTags?: string[];
}): Promise<{ ok: boolean; order: RepairItem }> {
  return offlinePost('/api/repair/create', data as Record<string, unknown>);
}

export interface RepairActionResult {
  ok: boolean;
  error?: string;
}

export interface RepairListResult<T = RepairItem> {
  data: T[];
  total: number;
}

export async function getRepairList(params: {
  organizationId: string;
  storeId: string;
  status?: string;
  warrantyFilter?: string;
  page?: number;
  pageSize?: number;
}): Promise<RepairListResult> {
  const res = await api.get<RepairListResult>('/api/repair', { params });
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
): Promise<RepairActionResult> {
  return offlinePost('/api/repair/quote', { orderId: repairId, ...data } as Record<string, unknown>);
}

export async function startRepair(repairId: string, technicianId?: string): Promise<RepairActionResult> {
  return offlinePost('/api/repair/start', {
    orderId: repairId,
    technicianId: technicianId || undefined,
  });
}

export async function acceptRepairQuote(repairId: string): Promise<RepairActionResult> {
  return offlinePost('/api/repair/accept', { orderId: repairId });
}

export async function completeRepair(
  repairId: string,
  data?: { repairNotes?: string },
): Promise<RepairActionResult> {
  return offlinePost('/api/repair/complete', { orderId: repairId, ...data } as Record<string, unknown>);
}

export async function qcRepair(repairId: string): Promise<RepairActionResult> {
  return offlinePost('/api/repair/qc', { orderId: repairId, qcStatus: 'PASS' });
}

export async function deliverRepair(repairId: string): Promise<RepairActionResult> {
  return offlinePost('/api/repair/deliver', { orderId: repairId, pickupMode: 'SELF' });
}

export async function createRepairPayment(data: {
  repairOrderId: string;
  amount: number;
  method: string;
  referenceNo?: string;
  note?: string;
}): Promise<{ ok: boolean; success?: string; paymentStatus?: string }> {
  return offlinePost('/api/repair/payment', data as Record<string, unknown>);
}

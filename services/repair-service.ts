import { api } from '../lib/api';
import type { RepairCreateRequest, RepairItem, PaginatedResponse } from '../types/api';

export async function getRepairs(params: {
  storeId?: string;
  organizationId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<RepairItem>> {
  const res = await api.get('/api/repair/create', { params });
  return res.data;
}

export async function createRepair(data: RepairCreateRequest): Promise<RepairItem> {
  const res = await api.post('/api/repair/create', data);
  return res.data;
}

export async function getRepairById(id: string): Promise<RepairItem> {
  const res = await api.get(`/api/repair/create/${id}`);
  return res.data;
}

export async function quoteRepair(
  id: string,
  data: { estimatedCost: number; note?: string },
): Promise<RepairItem> {
  const res = await api.post(`/api/repair/quote`, { repairId: id, ...data });
  return res.data;
}

export async function startRepair(id: string): Promise<RepairItem> {
  const res = await api.post('/api/repair/start', { repairId: id });
  return res.data;
}

export async function completeRepair(
  id: string,
  data?: { actualCost?: number; note?: string },
): Promise<RepairItem> {
  const res = await api.post('/api/repair/complete', { repairId: id, ...data });
  return res.data;
}

export async function qcRepair(id: string): Promise<RepairItem> {
  const res = await api.post('/api/repair/qc', { repairId: id });
  return res.data;
}

export async function deliverRepair(id: string): Promise<RepairItem> {
  const res = await api.post('/api/repair/deliver', { repairId: id });
  return res.data;
}

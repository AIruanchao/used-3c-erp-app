import { api } from '../lib/api';
import { offlinePost } from './api-helpers';
import type { Device } from '../types/device';

export async function searchDevice(params: {
  id?: string;
  sn?: string;
  q?: string;
  storeId?: string;
  organizationId: string;
}): Promise<Device | null> {
  const res = await api.get('/api/inventory/search', { params });
  return res.data?.device ?? null;
}

export async function getStocktakeSessions(params: {
  storeId: string;
  organizationId: string;
  status?: string;
}): Promise<{ items: Array<{ id: string; scope: string; status: string; createdAt: string }> }> {
  const res = await api.get('/api/stocktake-sessions', { params });
  return res.data;
}

export async function createStocktake(data: {
  storeId: string;
  organizationId: string;
  scope?: string;
}) {
  return offlinePost('/api/stocktake-sessions', data as Record<string, unknown>);
}

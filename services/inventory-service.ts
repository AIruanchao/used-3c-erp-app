import { api } from '../lib/api';
import type { Device } from '../types/device';

/**
 * Search for a single device by SN, ID, or query.
 * Uses /api/inventory/search which is a single-device lookup.
 */
export async function searchDevice(params: {
  id?: string;
  sn?: string;
  q?: string;
  organizationId: string;
}): Promise<Device | null> {
  const res = await api.get('/api/inventory/search', { params });
  return res.data?.device ?? null;
}

/**
 * Get stocktake sessions for a store.
 * Backend returns { items: StocktakeSession[] } with a take: 30 limit.
 */
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
  const res = await api.post('/api/stocktake-sessions', data);
  return res.data;
}

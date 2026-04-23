import { api } from '../lib/api';
import type { Device } from '../types/device';
import type { PaginatedResponse } from '../types/api';

export interface InventoryListParams {
  page?: number;
  pageSize?: number;
  storeId?: string;
  organizationId?: string;
  inventoryStatus?: string;
  search?: string;
  skuCategory?: string;
}

export async function getInventory(
  params: InventoryListParams,
): Promise<PaginatedResponse<Device>> {
  const res = await api.get('/api/inventory/search', { params });
  return res.data;
}

export async function getStocktakeSessions(params?: {
  storeId?: string;
  organizationId?: string;
}) {
  const res = await api.get('/api/stocktake-sessions', { params });
  return res.data;
}

export async function createStocktake(data: {
  storeId: string;
  organizationId: string;
  description?: string;
}) {
  const res = await api.post('/api/stocktake-sessions', data);
  return res.data;
}

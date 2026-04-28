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

// ─── New inventory list API ────────────────────────────────────

export interface InventoryListParams {
  organizationId: string;
  storeId?: string;
  brandId?: string;
  modelId?: string;
  status?: string;
  channel?: string;
  condition?: string;
  category?: string;
  age?: string;
  q?: string;
  storage?: string;
  inboundStart?: string;
  inboundEnd?: string;
  unitCostMin?: string;
  unitCostMax?: string;
  peerPriceMin?: string;
  peerPriceMax?: string;
  retailPriceMin?: string;
  retailPriceMax?: string;
  page?: number;
  pageSize?: number;
}

export interface InventoryListResult {
  items: Device[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BrandItem {
  id: string;
  name: string;
  deviceCount: number;
}

export interface ModelItem {
  id: string;
  name: string;
  deviceCount: number;
}

export async function getInventoryList(params: InventoryListParams): Promise<InventoryListResult> {
  const res = await api.get<InventoryListResult>('/api/inventory/list', { params });
  return res.data;
}

export async function getBrands(organizationId: string): Promise<BrandItem[]> {
  const res = await api.get<{ brands: BrandItem[] }>('/api/brands', {
    params: { organizationId },
  });
  return res.data.brands;
}

export async function getModels(organizationId: string, brandId: string): Promise<ModelItem[]> {
  const res = await api.get<{ models: ModelItem[] }>('/api/models', {
    params: { organizationId, brandId },
  });
  return res.data.models;
}

import { api } from '../lib/api';

export async function searchMarketplace(params: {
  organizationId: string;
  storeId: string;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  const res = await api.get<{
    items: Array<{
      id: string;
      sn: string;
      storeId: string;
      storeName: string;
      modelName: string;
      referencePrice: number | null;
      franchiseListingStatus: string;
    }>;
  }>('/api/marketplace/search', { params });
  return res.data;
}

export async function getMyListings(params: { organizationId: string; storeId: string }) {
  const res = await api.get<{
    items: Array<{ id: string; sn: string; modelName: string; referencePrice: number | null }>;
  }>('/api/marketplace/my-listings', { params });
  return res.data;
}

export async function batchListDevices(params: {
  storeId: string;
  ids: string[];
  action: 'LIST' | 'DELIST';
}) {
  const res = await api.post('/api/inventory/batch-listing', params);
  return res.data as {
    ok: boolean;
    succeeded?: number;
    failed?: Array<{ sn?: string; error?: string }>;
    errors?: unknown;
  };
}

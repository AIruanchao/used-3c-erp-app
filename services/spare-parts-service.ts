import { api } from '../lib/api';
import type { SparePart } from '../types/spare-parts';

export async function getSpareParts(params: {
  storeId: string;
  category?: string;
  keyword?: string;
  lowStockOnly?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{ data: SparePart[]; total: number }> {
  const { lowStockOnly, ...rest } = params;
  const res = await api.get<{ data: SparePart[]; total: number }>('/api/spare-parts', {
    params: {
      ...rest,
      lowStockOnly: lowStockOnly === undefined ? undefined : String(lowStockOnly),
    },
  });
  return res.data;
}

export async function inboundSparePart(data: {
  sparePartId: string;
  quantity: number;
  unitCost: string | number;
  relatedType?: string;
  relatedId?: string;
  note?: string;
}) {
  const res = await api.post<{ success: string }>('/api/spare-parts/inbound', {
    ...data,
    unitCost: typeof data.unitCost === 'number' ? String(data.unitCost) : data.unitCost,
  });
  return res.data;
}

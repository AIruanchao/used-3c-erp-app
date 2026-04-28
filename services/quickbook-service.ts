import { api } from '../lib/api';

export interface QuickBookItem {
  id: string;
  organizationId: string;
  storeId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  remark: string | null;
  createdById: string;
  createdAt: string;
}

export interface QuickBookListResult {
  items: QuickBookItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listQuickBooks(params: {
  organizationId: string;
  storeId: string;
  type?: 'INCOME' | 'EXPENSE';
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}): Promise<QuickBookListResult> {
  const res = await api.get<QuickBookListResult>('/api/quick-books', { params });
  return res.data;
}

export async function createQuickBook(body: {
  organizationId: string;
  storeId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  remark?: string | null;
}): Promise<{ id: string; item: QuickBookItem }> {
  const res = await api.post<{ id: string; item: QuickBookItem }>('/api/quick-books', body);
  return { id: res.data.id, item: res.data.item };
}


import { api } from '../lib/api';
import type { CustomerItem } from '../types/finance';

export async function getCustomers(params: {
  storeId?: string;
  organizationId?: string;
  q?: string;
  skip?: number;
  take?: number;
}): Promise<{ total: number; items: CustomerItem[] }> {
  const res = await api.get('/api/customers', { params });
  return res.data;
}

export async function getCustomerById(
  id: string,
  organizationId: string,
  storeId: string,
): Promise<CustomerItem> {
  const res = await api.get(`/api/customers/${id}`, {
    params: { organizationId, storeId },
  });
  return res.data;
}

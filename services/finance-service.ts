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

export async function findOrCreateCustomer(params: {
  storeId: string;
  organizationId: string;
  name: string;
  phone?: string;
}): Promise<{ id: string }> {
  // Try to find existing customer by phone
  if (params.phone) {
    const existing = await getCustomers({
      storeId: params.storeId,
      organizationId: params.organizationId,
      q: params.phone,
      take: 5,
    });
    const match = existing.items.find((c) => c.phone === params.phone);
    if (match) return { id: match.id };
  }

  // Create new customer
  const res = await api.post('/api/customers', {
    storeId: params.storeId,
    organizationId: params.organizationId,
    name: params.name,
    phone: params.phone || undefined,
  });
  return { id: res.data?.id ?? res.data?.customer?.id };
}

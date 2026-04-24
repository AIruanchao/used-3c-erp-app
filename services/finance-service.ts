import { api } from '../lib/api';
import { offlinePost } from './api-helpers';
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
): Promise<CustomerItem | null> {
  const res = await api.get(`/api/customers/${id}`, {
    params: { organizationId, storeId },
  });
  return res.data ?? null;
}

export async function findOrCreateCustomer(params: {
  storeId: string;
  organizationId: string;
  name: string;
  phone?: string;
}): Promise<{ id: string }> {
  if (params.phone) {
    const existing = await getCustomers({
      storeId: params.storeId,
      organizationId: params.organizationId,
      q: params.phone,
      take: 20,
    });
    const match = existing.items.find((c) => c.phone === params.phone);
    if (match) return { id: match.id };
  } else if (params.name) {
    const existing = await getCustomers({
      storeId: params.storeId,
      organizationId: params.organizationId,
      q: params.name,
      take: 20,
    });
    const match = existing.items.find((c) => c.name === params.name && !c.phone);
    if (match) return { id: match.id };
  }

  const res = await offlinePost<{ id?: string; customer?: { id: string } }>(
    '/api/customers',
    {
      storeId: params.storeId,
      organizationId: params.organizationId,
      name: params.name,
      phone: params.phone || undefined,
    },
  );
  if ('queued' in res && res.queued) {
    const tempId = 'pending-' + Date.now().toString(36);
    return { id: tempId };
  }
  const customerId = res.id ?? res.customer?.id;
  if (!customerId) {
    throw new Error('创建客户失败：未返回客户ID');
  }
  return { id: customerId };
}

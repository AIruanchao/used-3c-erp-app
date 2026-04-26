import { offlinePost } from './api-helpers';
import { api } from '../lib/api';
import type { PickupOrder } from '../types/pickup';

export async function getPickupOrders(params: {
  organizationId: string;
  storeId: string;
  status?: string;
}): Promise<{ items: PickupOrder[] }> {
  const res = await api.get<{ items: PickupOrder[] }>('/api/pickup-orders', { params });
  return res.data;
}

export async function createPickupOrder(data: {
  organizationId: string;
  storeId: string;
  customerName: string;
  customerPhone?: string;
  pickupAddress: string;
  appointmentTime?: string;
  estimatedDevices?: number;
  estimatedValue?: string | number;
  note?: string;
  customerId?: string;
}) {
  return offlinePost<{ success: string; id: string }>('/api/pickup-orders', data as Record<string, unknown>);
}

export async function updatePickupStatus(
  id: string,
  data: {
    organizationId: string;
    storeId: string;
    status: string;
    actualValue?: string | number;
    note?: string;
  },
) {
  const res = await api.patch<{ success: string; id: string; status: string; actualValue: string | number }>(
    `/api/pickup-orders/${id}`,
    data,
  );
  return res.data;
}

import { api } from '../lib/api';
import type { PreOrder, PreOrderDetail } from '../types/pre-order';

export async function getPreOrders(params: {
  storeId: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: PreOrder[]; total: number }> {
  const res = await api.get<{ data: PreOrder[]; total: number }>('/api/pre-orders', { params });
  return res.data;
}

export async function getPreOrderDetail(id: string): Promise<PreOrderDetail> {
  const res = await api.get<PreOrderDetail>(`/api/pre-orders/${id}`);
  return res.data;
}

export async function createPreOrder(formData: FormData) {
  const res = await api.post<{ success: string; id?: string }>('/api/pre-orders', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function updatePreOrderStatus(data: { preOrderId: string; status: string; storeId: string }) {
  const res = await api.post<{ success: string }>('/api/pre-orders/status', data);
  return res.data;
}

export async function postPreOrderCommunication(body: {
  preOrderId: string;
  content: string;
  type?: 'PHONE' | 'WECHAT' | 'INSTORE' | 'OTHER';
}) {
  const res = await api.post<{ success: string }>('/api/pre-orders/communication', body);
  return res.data;
}

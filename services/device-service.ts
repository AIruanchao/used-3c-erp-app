import { api } from '../lib/api';
import type { Device, DevicePricing } from '../types/device';
import type { PaginatedResponse } from '../types/api';

export interface DeviceListParams {
  page?: number;
  pageSize?: number;
  storeId?: string;
  organizationId?: string;
  inventoryStatus?: string;
  search?: string;
}

export async function getDevices(
  params: DeviceListParams,
): Promise<PaginatedResponse<Device>> {
  const res = await api.get('/api/devices', { params });
  return res.data;
}

export async function getDeviceById(id: string): Promise<Device> {
  const res = await api.get(`/api/devices/${id}`);
  return res.data;
}

export async function getDeviceLabel(deviceId: string): Promise<string> {
  const res = await api.get(`/api/device/label/${deviceId}`);
  return res.data?.label ?? res.data?.url ?? '';
}

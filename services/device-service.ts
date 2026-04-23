import { api } from '../lib/api';
import type { Device } from '../types/device';

export async function getDeviceById(id: string): Promise<Device> {
  const res = await api.get(`/api/inventory/search`, { params: { id } });
  return res.data?.device;
}

export async function getDeviceLabel(deviceId: string): Promise<string> {
  const res = await api.get(`/api/device/label/${deviceId}`);
  return res.data?.label ?? res.data?.url ?? '';
}

import { api } from '../lib/api';
import type { Device } from '../types/device';

export async function getDeviceById(
  id: string,
  organizationId: string,
): Promise<Device | null> {
  const res = await api.get('/api/inventory/search', {
    params: { id, organizationId },
  });
  return res.data?.device ?? null;
}

import { api } from '../lib/api';
import type { Announcement } from '../types/announcement';

export async function getAnnouncements(params: {
  organizationId: string;
  storeId?: string;
}): Promise<{ items: Announcement[] }> {
  const res = await api.get<{ items: Announcement[] }>('/api/announcements', { params });
  return res.data;
}

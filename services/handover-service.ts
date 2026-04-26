import { api } from '../lib/api';
import type { HandoverItem, StoreTeamMember } from '../types/handover';

export async function getHandoverList(params: {
  organizationId: string;
  storeId: string;
}): Promise<{ items: HandoverItem[] }> {
  const res = await api.get<{ items: HandoverItem[] }>('/api/shift-handovers', { params });
  return res.data;
}

export async function getStoreTeam(params: {
  organizationId: string;
  storeId: string;
}): Promise<{ items: StoreTeamMember[] }> {
  const res = await api.get<{ items: StoreTeamMember[] }>('/api/store-team', { params });
  return res.data;
}

export async function createHandover(data: {
  organizationId: string;
  storeId: string;
  toUserId: string;
  cashHandover?: number | null;
  keyHandover?: boolean;
  safeHandover?: boolean;
  specialNotes?: string;
}) {
  const res = await api.post<{ ok: boolean; message: string; id: string }>('/api/shift-handovers', data);
  return res.data;
}

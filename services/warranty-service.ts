import { api } from '../lib/api';

export interface WarrantyResult {
  found: boolean;
  deviceId?: string;
  isInWarranty?: boolean;
  warrantyType?: string;
  warrantyTypeLabel?: string;
  warrantyStartDate?: string | null;
  warrantyEndDate?: string | null;
  warrantyDays?: number | null;
  warrantyLabel?: string;
  repairHistory?: Array<{
    id: string;
    orderNo: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
  }>;
}

export async function checkWarranty(sn: string): Promise<WarrantyResult> {
  const res = await api.get<WarrantyResult>(`/api/repair/check-warranty?sn=${encodeURIComponent(sn)}`);
  return res.data;
}

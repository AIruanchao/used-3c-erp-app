import { api } from './api';

/** GET /api/payment-channels 管理列表，用于 code → 展示名（含已停用，便于展示历史数据） */
export async function fetchOrgPaymentLabelMap(organizationId: string): Promise<Record<string, string>> {
  const res = await api.get<{
    channels: Array<{ code: string; label: string }>;
  }>('/api/payment-channels', { params: { organizationId } });
  const map: Record<string, string> = {};
  for (const c of res.data?.channels ?? []) {
    map[c.code] = c.label;
  }
  return map;
}

/** GET activeOnly=1，收银/预订单下单选用 */
export async function fetchActivePosMethodOptions(organizationId: string): Promise<
  Array<{ value: string; label: string }>
> {
  const res = await api.get<{
    channels: Array<{ code: string; label: string }>;
  }>('/api/payment-channels', { params: { organizationId, activeOnly: 1 } });
  return (res.data?.channels ?? []).map((c) => ({ value: c.code, label: c.label }));
}

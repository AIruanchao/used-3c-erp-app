import { offlinePost } from './api-helpers';
import type { CashierRequest, CashierResponse } from '../types/api';
import { CashierResponseSchema, validateOrThrow } from '../types/schemas';

export async function cashierCheckout(data: CashierRequest): Promise<CashierResponse> {
  const res = await offlinePost<CashierResponse>('/api/cashier', data as unknown as Record<string, unknown>);
  if ('queued' in res && res.queued) {
    return res;
  }
  return validateOrThrow(CashierResponseSchema, res);
}

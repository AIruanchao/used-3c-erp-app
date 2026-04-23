import { api } from '../lib/api';
import type { CashierRequest, CashierResponse } from '../types/api';
import { CashierResponseSchema, validateOrThrow } from '../types/schemas';

export async function cashierCheckout(data: CashierRequest): Promise<CashierResponse> {
  const res = await api.post('/api/cashier', data);
  return validateOrThrow(CashierResponseSchema, res.data);
}

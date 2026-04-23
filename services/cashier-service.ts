import { api } from '../lib/api';
import type { CashierRequest, CashierResponse } from '../types/api';

export async function cashierCheckout(data: CashierRequest): Promise<CashierResponse> {
  const res = await api.post('/api/cashier', data);
  return res.data;
}

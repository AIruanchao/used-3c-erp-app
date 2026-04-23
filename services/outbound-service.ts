import { api } from '../lib/api';

/**
 * Outbound service - uses the cashier API for checkout,
 * and inventory/search for device lookup.
 */
export async function getOutboundPrint(orderId: string): Promise<string> {
  const res = await api.get(`/api/outbound/print/${orderId}`);
  return res.data;
}

import { api } from '../lib/api';
import type {
  LedgerEntry,
  PayableItem,
  ReceivableItem,
  CustomerItem,
  SupplierItem,
} from '../types/finance';

export async function getLedgerEntries(params: {
  storeId?: string;
  organizationId?: string;
  type?: string;
  skip?: number;
  take?: number;
}): Promise<{ total: number; items: LedgerEntry[] }> {
  const res = await api.get('/api/ledger/entry', { params });
  return res.data;
}

export async function getPayables(params: {
  storeId?: string;
  organizationId?: string;
}): Promise<{ items: PayableItem[] }> {
  const res = await api.get('/api/finance/payable', { params });
  return res.data;
}

export async function getReceivables(params: {
  storeId?: string;
  organizationId?: string;
}): Promise<{ items: ReceivableItem[] }> {
  const res = await api.get('/api/finance/receivable', { params });
  return res.data;
}

export async function getCustomers(params: {
  storeId?: string;
  organizationId?: string;
  q?: string;
  skip?: number;
  take?: number;
}): Promise<{ total: number; items: CustomerItem[] }> {
  const res = await api.get('/api/customers', { params });
  return res.data;
}

export async function getCustomerById(id: string): Promise<CustomerItem> {
  const res = await api.get(`/api/customers/${id}`);
  return res.data;
}

export async function getSuppliers(params: {
  organizationId?: string;
  q?: string;
  skip?: number;
  take?: number;
}): Promise<{ total: number; items: SupplierItem[] }> {
  const res = await api.get('/api/suppliers', { params });
  return res.data;
}

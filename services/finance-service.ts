import { api } from '../lib/api';
import type {
  LedgerEntry,
  PayableItem,
  ReceivableItem,
  CustomerItem,
  SupplierItem,
} from '../types/finance';
import type { PaginatedResponse } from '../types/api';

export async function getLedgerEntries(params: {
  storeId?: string;
  organizationId?: string;
  type?: string;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}): Promise<PaginatedResponse<LedgerEntry>> {
  const res = await api.get('/api/ledger/entry', { params });
  return res.data;
}

export async function getPayables(params: {
  storeId?: string;
  organizationId?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<PayableItem>> {
  const res = await api.get('/api/finance/payable', { params });
  return res.data;
}

export async function getReceivables(params: {
  storeId?: string;
  organizationId?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<ReceivableItem>> {
  const res = await api.get('/api/finance/receivable', { params });
  return res.data;
}

export async function getCustomers(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedResponse<CustomerItem>> {
  const res = await api.get('/api/customers', { params });
  return res.data;
}

export async function getCustomerById(id: string): Promise<CustomerItem> {
  const res = await api.get(`/api/customers/${id}`);
  return res.data;
}

export async function getSuppliers(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedResponse<SupplierItem>> {
  const res = await api.get('/api/suppliers', { params });
  return res.data;
}

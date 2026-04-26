import { api } from '../lib/api';
import type { CustomerDetail, CustomerDetailResponse, CustomerListItem } from '../types/customer';

function toStr(v: unknown, fallback = ''): string {
  if (v == null) return fallback;
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  return fallback;
}

function mapToCustomer(r: Record<string, unknown>): CustomerDetail {
  return {
    id: toStr(r['id']),
    name: toStr(r['name'], '未命名'),
    phone: r['phone'] == null || r['phone'] === '' ? null : String(r['phone']),
    wechat: r['wechat'] == null ? null : String(r['wechat']),
    email: r['email'] == null ? null : String(r['email']),
    address: r['address'] == null ? null : String(r['address']),
    note: r['note'] == null ? null : String(r['note']),
    source: r['source'] == null ? null : String(r['source']),
    memberLevel: r['memberLevel'] == null ? null : String(r['memberLevel']),
    tier: r['tier'] == null ? null : String(r['tier']),
    memberPoints: typeof r['memberPoints'] === 'number' ? r['memberPoints'] : 0,
    balance: toStr(r['balance'], '0'),
    creditUsed: toStr(r['creditUsed'], '0'),
    creditLimit: r['creditLimit'] == null ? null : toStr(r['creditLimit']),
    creditAvailable: r['creditAvailable'] == null ? null : toStr(r['creditAvailable']),
    lifetimeValue: toStr(r['lifetimeValue'], '0'),
    profitScore: r['profitScore'] == null ? null : toStr(r['profitScore']),
    loyaltyScore: r['loyaltyScore'] == null ? null : toStr(r['loyaltyScore']),
    compositeScore: r['compositeScore'] == null ? null : toStr(r['compositeScore']),
    createdAt: toStr(r['createdAt']),
  };
}

function normalizeDetail(raw: unknown): CustomerDetailResponse {
  if (raw && typeof raw === 'object' && 'Customer' in raw) {
    const b = raw as { Customer: Record<string, unknown> } & Record<string, unknown>;
    return {
      Customer: mapToCustomer(b.Customer as Record<string, unknown>),
      interactions: (Array.isArray(b['interactions']) ? b['interactions'] : []) as CustomerDetailResponse['interactions'],
      memberCards: (Array.isArray(b['memberCards']) ? b['memberCards'] : []) as CustomerDetailResponse['memberCards'],
      pointRecords: (Array.isArray(b['pointRecords']) ? b['pointRecords'] : []) as CustomerDetailResponse['pointRecords'],
      balanceRecords: (Array.isArray(b['balanceRecords']) ? b['balanceRecords'] : []) as CustomerDetailResponse['balanceRecords'],
      serviceVouchers: (Array.isArray(b['serviceVouchers']) ? b['serviceVouchers'] : []) as CustomerDetailResponse['serviceVouchers'],
      opportunities: (Array.isArray(b['opportunities']) ? b['opportunities'] : []) as CustomerDetailResponse['opportunities'],
    };
  }
  if (raw && typeof raw === 'object' && 'id' in raw) {
    const c = mapToCustomer(raw as Record<string, unknown>);
    const o = raw as Record<string, unknown>;
    return {
      Customer: c,
      interactions: (Array.isArray(o['interactions']) ? o['interactions'] : []) as CustomerDetailResponse['interactions'],
      memberCards: (Array.isArray(o['memberCards']) ? o['memberCards'] : []) as CustomerDetailResponse['memberCards'],
      pointRecords: (Array.isArray(o['pointRecords']) ? o['pointRecords'] : []) as CustomerDetailResponse['pointRecords'],
      balanceRecords: (Array.isArray(o['balanceRecords']) ? o['balanceRecords'] : []) as CustomerDetailResponse['balanceRecords'],
      serviceVouchers: (Array.isArray(o['serviceVouchers']) ? o['serviceVouchers'] : []) as CustomerDetailResponse['serviceVouchers'],
      opportunities: (Array.isArray(o['opportunities']) ? o['opportunities'] : []) as CustomerDetailResponse['opportunities'],
    };
  }
  throw new Error('Invalid customer response');
}

export interface CustomerListResult {
  total: number;
  items: CustomerListItem[];
}

export async function listCustomers(params: {
  organizationId: string;
  storeId: string;
  keyword?: string;
  tier?: string;
  page?: number;
  pageSize?: number;
}): Promise<CustomerListResult> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 30;
  const res = await api.get<CustomerListResult>('/api/customers', {
    params: {
      organizationId: params.organizationId,
      storeId: params.storeId,
      q: params.keyword,
      keyword: params.keyword,
      tier: params.tier,
      skip: (page - 1) * pageSize,
      take: pageSize,
    },
  });
  return res.data;
}

export async function getCustomerDetail(
  id: string,
  organizationId: string,
  storeId: string,
): Promise<CustomerDetailResponse> {
  const res = await api.get<unknown>(`/api/customers/${id}`, {
    params: { organizationId, storeId },
  });
  return normalizeDetail(res.data);
}

export async function createCustomer(data: {
  organizationId: string;
  storeId: string;
  name: string;
  phone?: string;
  wechat?: string;
  email?: string;
  address?: string;
  note?: string;
  source?: string;
  memberLevel?: string;
}) {
  const res = await api.post<{ success: string; id?: string; Customer?: { id: string } }>(
    '/api/customers',
    data,
  );
  return res.data;
}

export async function updateCustomer(
  id: string,
  data: {
    organizationId: string;
    storeId: string;
    name?: string;
    phone?: string | null;
    wechat?: string | null;
    email?: string | null;
    address?: string | null;
    note?: string | null;
    source?: string | null;
    memberLevel?: string;
  },
) {
  const res = await api.patch<{ success: string; Customer?: { id: string } }>(`/api/customers/${id}`, data);
  return res.data;
}

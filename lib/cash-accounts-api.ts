import { api } from './api';

export type CashAccountRow = {
  id: string;
  organizationId: string;
  storeId: string | null;
  name: string;
  accountType: string;
  flowKind: string;
  balance: number;
  isActive: boolean;
};

/** 下拉/收银：按用途筛选；含本门店 + 全组织（storeId 为 null）账户 */
export async function fetchCashAccountsForFlow(
  organizationId: string,
  storeId: string,
  flowKind: 'RECEIVE' | 'PAY',
): Promise<CashAccountRow[]> {
  const res = await api.get<{ items: CashAccountRow[] }>('/api/cash-accounts', {
    params: { organizationId, storeId, flowKind },
  });
  return res.data?.items ?? [];
}

/** 管理页：含停用项 */
export async function fetchCashAccountsAdmin(organizationId: string, storeId: string): Promise<CashAccountRow[]> {
  const res = await api.get<{ items: CashAccountRow[] }>('/api/cash-accounts', {
    params: { organizationId, storeId, includeInactive: 1, forAdmin: 1 },
  });
  return res.data?.items ?? [];
}

export async function createCashAccount(body: {
  organizationId: string;
  storeId: string;
  name: string;
  accountType: string;
  flowKind: 'RECEIVE' | 'PAY' | 'BOTH';
}): Promise<{ id: string }> {
  const res = await api.post<{ id?: string; success?: string }>('/api/cash-accounts', body);
  return { id: res.data?.id ?? '' };
}

export async function patchCashAccount(
  id: string,
  body: {
    organizationId: string;
    storeId: string;
    name?: string;
    isActive?: boolean;
    flowKind?: 'RECEIVE' | 'PAY' | 'BOTH';
    accountType?: string;
  },
): Promise<void> {
  await api.patch(`/api/cash-accounts/${id}`, body);
}

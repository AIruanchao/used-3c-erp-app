import { api } from '../lib/api';
import { removeAuthSessionCookie, removeAuthToken } from '../lib/storage';

/**
 * POST /api/auth/mobile-login
 * 移动端专用 — JWT token 直接返回在 JSON body 中
 * （RN 的 fetch/axios 无法读取 Set-Cookie 响应头）
 */
export async function loginWithEmail(
  email: string,
  password: string,
): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
  removeAuthToken();
  removeAuthSessionCookie();

  const BASE = process.env['EXPO_PUBLIC_API_BASE']?.trim() || 'https://erp.nenie.vip';

  const res = await fetch(`${BASE}/api/auth/mobile-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const data = await res.json() as {
    token?: string;
    user?: { id: string; email: string; name: string };
    error?: string;
  };

  if (!res.ok || !data.token || !data.user?.id) {
    throw new Error(data.error || '登录失败，请检查用户名和密码');
  }

  return {
    token: data.token,
    user: data.user,
  };
}

export interface UserStoreItem {
  storeMemberId: string;
  role: string;
  storeId: string;
  storeName: string;
  organizationId: string;
  orgName: string;
}

export async function getUserStores(): Promise<UserStoreItem[]> {
  const res = await api.get('/api/user/stores');
  const data = res.data as { items: UserStoreItem[] };
  return data.items ?? [];
}

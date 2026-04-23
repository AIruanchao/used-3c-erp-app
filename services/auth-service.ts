import { api } from '../lib/api';
import type { StoreMemberItem } from '../types/api';
import { StoreMemberSchema, validateOrThrow } from '../types/schemas';

/** Login using next-auth credentials provider */
function extractTokenFromHeaders(headers: Record<string, unknown>): string {
  const cookieHeader = headers['set-cookie'];
  if (!cookieHeader) return '';
  const cookies = Array.isArray(cookieHeader)
    ? cookieHeader.join('; ')
    : String(cookieHeader);
  const match = cookies.match(/next-auth\.session-token=([^;]+)/);
  return match?.[1] ?? '';
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
  const csrfRes = await api.get('/api/auth/csrf');
  const csrfToken = csrfRes.data?.csrfToken as string;

  const formData = new URLSearchParams();
  formData.append('email', email);
  formData.append('password', password);
  formData.append('csrfToken', csrfToken);
  formData.append('callbackUrl', '/');

  const signInRes = await api.post('/api/auth/callback/credentials', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 400,
  });

  const sessionRes = await api.get('/api/auth/session');
  const session = sessionRes.data as {
    user?: { id?: string; email?: string; name?: string };
  };

  if (!session?.user?.id) {
    throw new Error('登录失败，请检查用户名和密码');
  }

  let token = extractTokenFromHeaders(signInRes.headers as Record<string, unknown>);
  if (!token) {
    token = extractTokenFromHeaders(sessionRes.headers as Record<string, unknown>);
  }
  if (!token) {
    token = `session-${session.user.id}`;
  }

  return {
    token,
    user: {
      id: session.user.id,
      email: session.user.email ?? '',
      name: session.user.name ?? '',
    },
  };
}

export async function getUserStores(): Promise<StoreMemberItem[]> {
  const res = await api.get('/api/store-team');
  const items = res.data as StoreMemberItem[];
  for (const item of items) {
    validateOrThrow(StoreMemberSchema, item);
  }
  return items;
}

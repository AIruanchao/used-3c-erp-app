import { api } from '../lib/api';

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

function extractSessionCookie(headers: Record<string, unknown>): string {
  const cookieHeader = headers['set-cookie'];
  if (!cookieHeader) return '';
  const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
  // Extract just the name=value part of session cookie
  for (const c of cookies) {
    const match = String(c).match(/(next-auth\.session-token=[^;]+)/);
    if (match) return match[1] ?? '';
  }
  return '';
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
  const csrfRes = await api.get('/api/auth/csrf');
  const csrfToken = (csrfRes.data as { csrfToken?: string })?.csrfToken;
  if (!csrfToken) throw new Error('获取CSRF令牌失败');

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

  // Extract the session cookie from the sign-in response and forward it
  // because React Native doesn't automatically manage cookies between requests
  const sessionCookie = extractSessionCookie(signInRes.headers as Record<string, unknown>);
  const sessionHeaders: Record<string, string> = {};
  if (sessionCookie) {
    sessionHeaders['Cookie'] = sessionCookie;
  }

  const sessionRes = await api.get('/api/auth/session', {
    headers: sessionHeaders,
  });
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

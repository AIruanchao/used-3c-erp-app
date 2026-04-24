import { api } from '../lib/api';
import { removeAuthSessionCookie, removeAuthToken } from '../lib/storage';

type HeaderBag = Record<string, unknown>;

function getSetCookieValues(headers: HeaderBag): string[] {
  const h = headers as Record<string, unknown>;
  const v = h['set-cookie'] ?? h['Set-Cookie'] ?? h['SET-COOKIE'];
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  return [String(v)];
}

function pickCookieNameValue(setCookieLines: string[], nameRe: RegExp): string | null {
  for (const line of setCookieLines) {
    // Each Set-Cookie line begins with "name=value; ..."
    const m = line.match(nameRe);
    if (m?.[0]) {
      const nv = m[0].split(';')[0]?.trim();
      if (nv) return nv;
    }
  }
  return null;
}

function extractAuthCookieHeader(headers: HeaderBag): string {
  const setCookies = getSetCookieValues(headers);
  const session =
    pickCookieNameValue(setCookies, /(?:^|,\s*)(__Host-|__Secure-)?next-auth\.session-token=[^;]+/i) ??
    pickCookieNameValue(setCookies, /(?:^|,\s*)next-auth\.session-token=[^;]+/i);
  const csrf =
    pickCookieNameValue(setCookies, /(?:^|,\s*)(__Host-|__Secure-)?next-auth\.csrf-token=[^;]+/i) ??
    pickCookieNameValue(setCookies, /(?:^|,\s*)next-auth\.csrf-token=[^;]+/i);
  const parts = [session, csrf].filter(Boolean) as string[];
  return parts.join('; ');
}

function formUrlEncode(data: Record<string, string>): string {
  const keys = Object.keys(data);
  return keys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(data[k] ?? '')}`)
    .join('&');
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
  // Clear stale auth so interceptor doesn't inject old cookies during login
  removeAuthToken();
  removeAuthSessionCookie();

  const csrfRes = await api.get('/api/auth/csrf');
  const csrfToken = (csrfRes.data as { csrfToken?: string })?.csrfToken;
  if (!csrfToken) throw new Error('获取CSRF令牌失败');

  // Avoid relying on URLSearchParams availability in RN runtimes.
  const formData = formUrlEncode({
    email,
    password,
    csrfToken,
    callbackUrl: '/',
  });

  const signInRes = await api.post('/api/auth/callback/credentials', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 400,
  });

  // Extract the session cookie from the sign-in response and forward it
  // because React Native doesn't automatically manage cookies between requests
  let cookieHeader = extractAuthCookieHeader(signInRes.headers as HeaderBag);
  const sessionHeaders: Record<string, string> = {};
  if (cookieHeader) {
    sessionHeaders['Cookie'] = cookieHeader;
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

  if (!cookieHeader) {
    const cookie2 = extractAuthCookieHeader(sessionRes.headers as HeaderBag);
    if (cookie2) cookieHeader = cookie2;
  }
  if (!cookieHeader) {
    throw new Error('登录失败：未获取到会话 Cookie（可能是 Set-Cookie 不可见或 Cookie 名不兼容）');
  }

  return {
    token: cookieHeader,
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

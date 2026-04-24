import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import * as SentryRN from '@sentry/react-native';
import {
  getAuthSessionCookie,
  getAuthToken,
  removeAuthSessionCookie,
  removeAuthToken,
} from './storage';

const API_BASE = __DEV__
  ? (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000')
  : 'https://erp.nenie.vip';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // React Native doesn't reliably manage cookies, so we inject them manually.
  // Prefer full cookie header ("name=value; name2=value2") when available.
  const sessionCookieHeader = getAuthSessionCookie();
  const legacyToken = getAuthToken();
  const cookieValue = sessionCookieHeader
    ? sessionCookieHeader
    : legacyToken
      ? `next-auth.session-token=${legacyToken}`
      : '';

  if (cookieValue) {
    const headersAny = config.headers as unknown as {
      get?: (k: string) => string | null | undefined;
      set?: (k: string, v: string) => void;
      Cookie?: string;
      cookie?: string;
    };

    const existing =
      (typeof headersAny.get === 'function' ? headersAny.get('Cookie') : undefined) ??
      headersAny.Cookie ??
      headersAny.cookie ??
      '';

    const merged = existing
      ? (existing.includes(cookieValue) ? existing : `${existing}; ${cookieValue}`)
      : cookieValue;

    if (typeof headersAny.set === 'function') {
      headersAny.set('Cookie', merged);
    } else {
      headersAny.Cookie = merged;
      headersAny.cookie = merged;
    }
  }
  SentryRN.addBreadcrumb({
    category: 'api',
    message: `${config.method?.toUpperCase() ?? 'GET'} ${(config.baseURL ?? '') + (config.url ?? '')}`,
    level: 'info',
  });
  return config;
});

let globalNavigationRef: ((path: string) => void) | null = null;
let globalLogoutRef: (() => void) | null = null;
let isHandling401 = false;

export function setNavigationRef(ref: (path: string) => void): void {
  globalNavigationRef = ref;
}

export function setLogoutRef(ref: () => void): void {
  globalLogoutRef = ref;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && !isHandling401) {
      isHandling401 = true;
      removeAuthToken();
      removeAuthSessionCookie();
      globalLogoutRef?.();
      if (globalNavigationRef) {
        globalNavigationRef('/(auth)/login');
      }
      setTimeout(() => { isHandling401 = false; }, 2000);
    } else if (error.response?.status !== 401) {
      SentryRN.captureException(error, {
        extra: {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data,
        },
      });
    }
    return Promise.reject(error);
  }
);

export { API_BASE };

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  getAuthSessionCookie,
  getAuthToken,
  getApiBaseUrl,
  removeAuthSessionCookie,
  removeAuthToken,
} from './storage';

function normalizeApiBaseUrl(input: string): string {
  const s = input.trim();
  if (!s) return s;
  // axios baseURL should not end with "/"
  return s.endsWith('/') ? s.slice(0, -1) : s;
}

function getExtraApiBaseUrl(): string | undefined {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const v = extra?.['apiBaseUrl'];
  return typeof v === 'string' && v.trim() ? v : undefined;
}

/**
 * API base selection order:
 * 1) `EXPO_PUBLIC_API_BASE` (recommended for EAS + local .env)
 * 2) `expo.extra.apiBaseUrl` (optional in app config)
 * 3) Dev default (Android emulator can reach host via 10.0.2.2)
 * 4) Prod default (legacy)
 */
const DEFAULT_API_BASE = (() => {
  const fromEnv = process.env['EXPO_PUBLIC_API_BASE']?.trim();
  if (fromEnv) return normalizeApiBaseUrl(fromEnv);

  const fromExtra = getExtraApiBaseUrl();
  if (fromExtra) return normalizeApiBaseUrl(fromExtra);

  if (__DEV__) {
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
  }
  return 'https://erp.nenie.vip';
})();

export const api = axios.create({
  baseURL: DEFAULT_API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Allow overriding API base at runtime (persisted in AsyncStorage and hydrated at boot).
  const runtimeBase = getApiBaseUrl();
  if (runtimeBase) {
    config.baseURL = normalizeApiBaseUrl(runtimeBase);
  }

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
    } else if (error.response?.status !== 401 && __DEV__) {
      console.warn('[api]', error.config?.method, error.config?.url, error.response?.status);
    }
    return Promise.reject(error);
  }
);

export const API_BASE = DEFAULT_API_BASE;

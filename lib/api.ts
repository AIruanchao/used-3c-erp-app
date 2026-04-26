import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  getAuthToken,
  getApiBaseUrl,
  removeAuthToken,
} from './storage';

function normalizeApiBaseUrl(input: string): string {
  const s = input.trim();
  if (!s) return s;
  return s.endsWith('/') ? s.slice(0, -1) : s;
}

function getExtraApiBaseUrl(): string | undefined {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const v = extra?.['apiBaseUrl'];
  return typeof v === 'string' && v.trim() ? v : undefined;
}

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
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const runtimeBase = getApiBaseUrl();
  if (runtimeBase) {
    config.baseURL = normalizeApiBaseUrl(runtimeBase);
  }

  // Mobile auth: JWT token via Authorization Bearer header
  const token = getAuthToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
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

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { getAuthToken, removeAuthToken } from './storage';

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
  const token = getAuthToken();
  if (token) {
    // next-auth uses a session cookie, so we inject it as a Cookie header
    // since React Native doesn't automatically send cookies
    config.headers['Cookie'] = `next-auth.session-token=${token}`;
  }
  return config;
});

let globalNavigationRef: ((path: string) => void) | null = null;
let globalLogoutRef: (() => void) | null = null;

export function setNavigationRef(ref: (path: string) => void): void {
  globalNavigationRef = ref;
}

export function setLogoutRef(ref: () => void): void {
  globalLogoutRef = ref;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      removeAuthToken();
      globalLogoutRef?.();
      if (globalNavigationRef) {
        globalNavigationRef('(auth)/login');
      }
    }
    return Promise.reject(error);
  }
);

export { API_BASE };

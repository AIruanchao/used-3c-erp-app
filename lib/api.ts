import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAuthToken, removeAuthToken } from './storage';

const API_BASE = __DEV__
  ? 'http://10.0.2.2:3000'
  : 'https://erp.nenie.vip';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      removeAuthToken();
      // Use a global navigation ref to avoid require() at runtime
      if (globalNavigationRef) {
        globalNavigationRef('(auth)/login');
      }
    }
    return Promise.reject(error);
  }
);

// Global navigation callback - set by root layout
let globalNavigationRef: ((path: string) => void) | null = null;

export function setNavigationRef(ref: (path: string) => void): void {
  globalNavigationRef = ref;
}

export { API_BASE };

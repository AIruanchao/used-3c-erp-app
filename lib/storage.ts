import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';

export const mmkv: MMKV = createMMKV({ id: 'nenie-erp' });

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  STORES_DATA: 'stores_data',
  SELECTED_STORE: 'selected_store',
  SELECTED_ORG: 'selected_org',
  THEME: 'theme',
  SCAN_HISTORY: 'scan_history',
  OFFLINE_QUEUE: 'offline_queue',
} as const;

export function getAuthToken(): string | undefined {
  return mmkv.getString(STORAGE_KEYS.AUTH_TOKEN);
}

export function setAuthToken(token: string): void {
  mmkv.set(STORAGE_KEYS.AUTH_TOKEN, token);
}

export function removeAuthToken(): void {
  mmkv.remove(STORAGE_KEYS.AUTH_TOKEN);
}

export function setUserData(data: Record<string, unknown>): void {
  mmkv.set(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
}

export function getUserData(): Record<string, unknown> | null {
  const raw = mmkv.getString(STORAGE_KEYS.USER_DATA);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function setStoresData(stores: Record<string, unknown>[]): void {
  mmkv.set(STORAGE_KEYS.STORES_DATA, JSON.stringify(stores));
}

export function getStoresData(): Record<string, unknown>[] {
  const raw = mmkv.getString(STORAGE_KEYS.STORES_DATA);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Record<string, unknown>[];
  } catch {
    return [];
  }
}

export function setSelectedStore(storeId: string): void {
  mmkv.set(STORAGE_KEYS.SELECTED_STORE, storeId);
}

export function getSelectedStore(): string | undefined {
  return mmkv.getString(STORAGE_KEYS.SELECTED_STORE);
}

export function setSelectedOrg(orgId: string): void {
  mmkv.set(STORAGE_KEYS.SELECTED_ORG, orgId);
}

export function getSelectedOrg(): string | undefined {
  return mmkv.getString(STORAGE_KEYS.SELECTED_ORG);
}

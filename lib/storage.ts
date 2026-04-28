import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persistent key-value storage without react-native-mmkv / Nitro.
 * MMKV+Nitro caused native crashes on some devices; AsyncStorage is the
 * Expo-default, battle-tested path.
 *
 * In-memory cache + async persistence. Call `hydrateStorage()` once at boot
 * before reading auth/theme (see `app/_layout.tsx`).
 */
const PREFIX = '@nenie-erp/';

const mem = new Map<string, string>();

const EXTRA_KEYS = ['push_enabled', 'print_history', 'offline_queue_notif_log'] as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  AUTH_SESSION_COOKIE: 'auth_session_cookie',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  STORES_DATA: 'stores_data',
  SELECTED_STORE: 'selected_store',
  SELECTED_ORG: 'selected_org',
  THEME: 'theme',
  HIDE_AMOUNTS: 'hide_amounts',
  SCAN_HISTORY: 'scan_history',
  OFFLINE_QUEUE: 'offline_queue',
  API_BASE_URL: 'api_base_url',
} as const;

const ALL_PERSISTED_KEYS: string[] = [...Object.values(STORAGE_KEYS), ...EXTRA_KEYS];

function k(key: string): string {
  return PREFIX + key;
}

/** Load all known keys from disk into `mem`. Call once at app start. */
export async function hydrateStorage(): Promise<void> {
  const pairs = await AsyncStorage.multiGet(ALL_PERSISTED_KEYS.map((x) => k(x)));
  mem.clear();
  for (const [full, value] of pairs) {
    if (value == null) continue;
    const short = full.startsWith(PREFIX) ? full.slice(PREFIX.length) : full;
    mem.set(short, value);
  }
}

let hydratePromise: Promise<void> | null = null;

export function ensureStorageHydrated(): Promise<void> {
  if (!hydratePromise) {
    hydratePromise = hydrateStorage();
  }
  return hydratePromise;
}

type ThemeMode = 'light' | 'dark' | 'system';

export function getStoredThemeOrDefault(): ThemeMode {
  const v = mem.get(STORAGE_KEYS.THEME);
  if (v === 'light' || v === 'dark' || v === 'system') return v;
  return 'system';
}

/**
 * drop-in for legacy `mmkv` usage: getString / set (string|boolean|number) / remove / getBoolean
 */
export const mmkv = {
  getString(key: string): string | undefined {
    return mem.get(key);
  },
  getBoolean(key: string): boolean | undefined {
    const v = mem.get(key);
    if (v === undefined) return undefined;
    return v === '1' || v === 'true';
  },
  set(key: string, value: string | number | boolean): void {
    const s = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
    mem.set(key, s);
    void AsyncStorage.setItem(k(key), s);
  },
  remove(key: string): void {
    mem.delete(key);
    void AsyncStorage.removeItem(k(key));
  },
};

export function getAuthToken(): string | undefined {
  return mem.get(STORAGE_KEYS.AUTH_TOKEN);
}

export function setAuthToken(token: string): void {
  mem.set(STORAGE_KEYS.AUTH_TOKEN, token);
  void AsyncStorage.setItem(k(STORAGE_KEYS.AUTH_TOKEN), token);
}

export function removeAuthToken(): void {
  mem.delete(STORAGE_KEYS.AUTH_TOKEN);
  void AsyncStorage.removeItem(k(STORAGE_KEYS.AUTH_TOKEN));
}

export function getAuthSessionCookie(): string | undefined {
  return mem.get(STORAGE_KEYS.AUTH_SESSION_COOKIE);
}

export function setAuthSessionCookie(cookieHeader: string): void {
  mem.set(STORAGE_KEYS.AUTH_SESSION_COOKIE, cookieHeader);
  void AsyncStorage.setItem(k(STORAGE_KEYS.AUTH_SESSION_COOKIE), cookieHeader);
}

export function removeAuthSessionCookie(): void {
  mem.delete(STORAGE_KEYS.AUTH_SESSION_COOKIE);
  void AsyncStorage.removeItem(k(STORAGE_KEYS.AUTH_SESSION_COOKIE));
}

export function setUserData(data: Record<string, unknown>): void {
  const json = JSON.stringify(data);
  mem.set(STORAGE_KEYS.USER_DATA, json);
  void AsyncStorage.setItem(k(STORAGE_KEYS.USER_DATA), json);
}

export function getUserData(): Record<string, unknown> | null {
  const raw = mem.get(STORAGE_KEYS.USER_DATA);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function setStoresData(stores: Record<string, unknown>[]): void {
  const json = JSON.stringify(stores);
  mem.set(STORAGE_KEYS.STORES_DATA, json);
  void AsyncStorage.setItem(k(STORAGE_KEYS.STORES_DATA), json);
}

export function getStoresData(): Record<string, unknown>[] {
  const raw = mem.get(STORAGE_KEYS.STORES_DATA);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Record<string, unknown>[];
  } catch {
    return [];
  }
}

export function setSelectedStore(storeId: string): void {
  mem.set(STORAGE_KEYS.SELECTED_STORE, storeId);
  void AsyncStorage.setItem(k(STORAGE_KEYS.SELECTED_STORE), storeId);
}

export function getSelectedStore(): string | undefined {
  return mem.get(STORAGE_KEYS.SELECTED_STORE);
}

export function setSelectedOrg(orgId: string): void {
  mem.set(STORAGE_KEYS.SELECTED_ORG, orgId);
  void AsyncStorage.setItem(k(STORAGE_KEYS.SELECTED_ORG), orgId);
}

export function getSelectedOrg(): string | undefined {
  return mem.get(STORAGE_KEYS.SELECTED_ORG);
}

export function getApiBaseUrl(): string | undefined {
  const v = mem.get(STORAGE_KEYS.API_BASE_URL);
  return v && v.trim() ? v : undefined;
}

export function setApiBaseUrl(url: string): void {
  const v = url.trim();
  mem.set(STORAGE_KEYS.API_BASE_URL, v);
  void AsyncStorage.setItem(k(STORAGE_KEYS.API_BASE_URL), v);
}

export function removeApiBaseUrl(): void {
  mem.delete(STORAGE_KEYS.API_BASE_URL);
  void AsyncStorage.removeItem(k(STORAGE_KEYS.API_BASE_URL));
}

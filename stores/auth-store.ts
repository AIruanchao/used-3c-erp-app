import { create } from 'zustand';
import {
  setAuthToken,
  setUserData,
  getUserData,
  getAuthToken,
  getSelectedStore,
  setSelectedStore,
  getSelectedOrg,
  setSelectedOrg,
  setStoresData,
  getStoresData,
  mmkv,
  STORAGE_KEYS,
} from '../lib/storage';

export interface UserInfo {
  id: string;
  email: string;
  name: string;
}

export interface StoreInfo {
  storeId: string;
  storeName: string;
  organizationId: string;
  orgName: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  stores: StoreInfo[];
  currentStore: StoreInfo | null;
  token: string | null;

  setAuth: (user: UserInfo, token: string, stores: StoreInfo[]) => void;
  selectStore: (store: StoreInfo) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  stores: [],
  currentStore: null,
  token: null,

  setAuth: (user, token, stores) => {
    setAuthToken(token);
    setUserData(user as unknown as Record<string, unknown>);
    setStoresData(stores as unknown as Record<string, unknown>[]);

    const savedStoreId = getSelectedStore();
    const savedOrgId = getSelectedOrg();
    let currentStore = stores[0] ?? null;

    if (savedStoreId && savedOrgId) {
      const found = stores.find(
        (s) => s.storeId === savedStoreId && s.organizationId === savedOrgId,
      );
      if (found) currentStore = found;
    }

    if (currentStore) {
      setSelectedStore(currentStore.storeId);
      setSelectedOrg(currentStore.organizationId);
    }

    set({
      isAuthenticated: true,
      user,
      token,
      stores,
      currentStore,
    });
  },

  selectStore: (store) => {
    setSelectedStore(store.storeId);
    setSelectedOrg(store.organizationId);
    set({ currentStore: store });
  },

  logout: () => {
    // Clear all auth-related MMKV keys
    mmkv.remove(STORAGE_KEYS.AUTH_TOKEN);
    mmkv.remove(STORAGE_KEYS.REFRESH_TOKEN);
    mmkv.remove(STORAGE_KEYS.USER_DATA);
    mmkv.remove(STORAGE_KEYS.STORES_DATA);
    mmkv.remove(STORAGE_KEYS.SELECTED_STORE);
    mmkv.remove(STORAGE_KEYS.SELECTED_ORG);

    set({
      isAuthenticated: false,
      user: null,
      token: null,
      stores: [],
      currentStore: null,
    });
  },

  hydrate: () => {
    const userData = getUserData();
    const savedStoreId = getSelectedStore();
    const savedOrgId = getSelectedOrg();
    if (!userData) return;

    const user: UserInfo = {
      id: userData['id'] as string,
      email: userData['email'] as string,
      name: userData['name'] as string,
    };

    const storesRaw = getStoresData();
    const stores = storesRaw.map((s) => ({
      storeId: s['storeId'] as string,
      storeName: s['storeName'] as string,
      organizationId: s['organizationId'] as string,
      orgName: s['orgName'] as string,
    }));
    let currentStore = stores[0] ?? null;

    if (savedStoreId && savedOrgId) {
      const found = stores.find(
        (s) => s.storeId === savedStoreId && s.organizationId === savedOrgId,
      );
      if (found) currentStore = found;
    }

    set({
      isAuthenticated: true,
      user,
      token: getAuthToken() ?? null,
      stores,
      currentStore,
    });
  },
}));

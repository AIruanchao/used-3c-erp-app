import { useAuthStore } from '../stores/auth-store';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

export function useAuth() {
  const router = useRouter();

  // Use individual selectors to avoid unnecessary re-renders
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const stores = useAuthStore((s) => s.stores);
  const currentStore = useAuthStore((s) => s.currentStore);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const selectStore = useAuthStore((s) => s.selectStore);
  const logout = useAuthStore((s) => s.logout);
  const hydrate = useAuthStore((s) => s.hydrate);

  const requireAuth = useCallback(() => {
    if (!isAuthenticated || !token) {
      router.replace('/(auth)/login');
      return false;
    }
    return true;
  }, [isAuthenticated, token, router]);

  const requireStore = useCallback(() => {
    if (!currentStore) {
      return null;
    }
    return currentStore;
  }, [currentStore]);

  return {
    isAuthenticated,
    user,
    stores,
    currentStore,
    token,
    setAuth,
    selectStore,
    logout,
    hydrate,
    requireAuth,
    requireStore,
    storeId: currentStore?.storeId ?? null,
    organizationId: currentStore?.organizationId ?? null,
    storeName: currentStore?.storeName ?? null,
  };
}

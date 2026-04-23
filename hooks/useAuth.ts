import { useAuthStore } from '../stores/auth-store';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();

  const requireAuth = useCallback(() => {
    if (!store.isAuthenticated) {
      router.replace('/(auth)/login');
      return false;
    }
    return true;
  }, [store.isAuthenticated, router]);

  const requireStore = useCallback(() => {
    if (!store.currentStore) {
      return null;
    }
    return store.currentStore;
  }, [store.currentStore]);

  return {
    ...store,
    requireAuth,
    requireStore,
    storeId: store.currentStore?.storeId ?? null,
    organizationId: store.currentStore?.organizationId ?? null,
    storeName: store.currentStore?.storeName ?? null,
  };
}

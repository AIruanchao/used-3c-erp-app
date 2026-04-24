import { useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { useAppStore } from '../stores/app-store';
import { api } from '../lib/api';
import {
  getOfflineQueue,
  saveOfflineQueue,
  getPendingCount,
  type OfflineAction,
} from '../services/offline-queue';

export { enqueueAction, getPendingCount, type OfflineAction } from '../services/offline-queue';

export function useOffline() {
  const isOffline = useAppStore((s) => s.isOffline);
  const setOffline = useAppStore((s) => s.setOffline);
  const pendingCount = useAppStore((s) => s.offlineQueueCount);
  const setPendingCount = useAppStore((s) => s.setOfflineQueueCount);
  const flushQueueRef = useRef<(() => Promise<void>) | null>(null);

  const flushQueue = useCallback(async () => {
    const now = Date.now();
    let queue = getOfflineQueue();

    queue = queue.filter((action) => now - action.timestamp < action.ttlMs);

    const failed: OfflineAction[] = [];

    for (const action of queue) {
      try {
        const res = await api.request({
          url: action.url,
          method: action.method,
          data: action.data,
        });
        if (res.status >= 400) {
          action.retries += 1;
          if (action.retries < 3) failed.push(action);
        }
      } catch {
        action.retries += 1;
        if (action.retries < 3) failed.push(action);
      }
    }

    saveOfflineQueue(failed);
    setPendingCount(getPendingCount());
  }, [setPendingCount]);

  flushQueueRef.current = flushQueue;

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await api.get('/api/health', { timeout: 5000 });
        setOffline(false);
        flushQueueRef.current?.();
      } catch {
        setOffline(true);
      }
    };

    checkConnection();
    setPendingCount(getPendingCount());

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkConnection();
      }
    });

    return () => subscription.remove();
  }, [setOffline, setPendingCount]);

  return {
    isOffline,
    flushQueue,
    pendingCount,
  };
}

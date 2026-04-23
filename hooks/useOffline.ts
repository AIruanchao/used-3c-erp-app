import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useAppStore } from '../stores/app-store';
import { api } from '../lib/api';
import { mmkv, STORAGE_KEYS } from '../lib/storage';

interface OfflineAction {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

export function useOffline() {
  const isOffline = useAppStore((s) => s.isOffline);
  const setOffline = useAppStore((s) => s.setOffline);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await api.get('/api/health', { timeout: 5000 });
        setOffline(false);
      } catch {
        setOffline(true);
      }
    };

    checkConnection();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkConnection();
      }
    });

    return () => subscription.remove();
  }, [setOffline]);

  const enqueueAction = (type: string, data: Record<string, unknown>) => {
    const queue = getOfflineQueue();
    queue.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    });
    saveOfflineQueue(queue);
  };

  const flushQueue = async () => {
    const queue = getOfflineQueue();
    const failed: OfflineAction[] = [];

    for (const action of queue) {
      try {
        const res = await api.post(`/api/${action.type}`, action.data);
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
  };

  return {
    isOffline,
    enqueueAction,
    flushQueue,
  };
}

function getOfflineQueue(): OfflineAction[] {
  const raw = mmkv.getString(STORAGE_KEYS.OFFLINE_QUEUE);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OfflineAction[];
  } catch {
    return [];
  }
}

function saveOfflineQueue(queue: OfflineAction[]): void {
  mmkv.set(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
}

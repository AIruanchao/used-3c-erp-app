import { useEffect, useState, useCallback } from 'react';
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
  ttlMs: number;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_QUEUE_SIZE = 100;

export function useOffline() {
  const isOffline = useAppStore((s) => s.isOffline);
  const setOffline = useAppStore((s) => s.setOffline);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await api.get('/api/health', { timeout: 5000 });
        setOffline(false);
        // Try to flush queue when coming back online
        flushQueue();
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

  const enqueueAction = useCallback((type: string, data: Record<string, unknown>, ttlMs = DEFAULT_TTL_MS) => {
    const queue = getOfflineQueue();
    // Enforce capacity limit
    if (queue.length >= MAX_QUEUE_SIZE) {
      queue.shift(); // Remove oldest
    }
    queue.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
      ttlMs,
    });
    saveOfflineQueue(queue);
  }, []);

  const flushQueue = useCallback(async () => {
    const now = Date.now();
    let queue = getOfflineQueue();

    // Remove expired entries
    queue = queue.filter((action) => now - action.timestamp < action.ttlMs);

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
  }, []);

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

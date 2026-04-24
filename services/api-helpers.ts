import { api } from '../lib/api';
import { enqueueAction } from './offline-queue';
import { useAppStore } from '../stores/app-store';
import type { OfflineAction } from './offline-queue';

export type { OfflineAction };

/**
 * Perform a POST request with offline fallback.
 * If the request fails due to network error and the app is offline,
 * the action is enqueued for later retry.
 */
export async function offlinePost<T = unknown>(
  url: string,
  data: Record<string, unknown>,
): Promise<T> {
  try {
    const res = await api.post(url, data);
    return res.data as T;
  } catch (error: unknown) {
    const isOffline = useAppStore.getState().isOffline;
    if (isOffline && isNetworkError(error)) {
      enqueueAction(url, 'POST', data);
      return { offline: true, queued: true } as T;
    }
    throw error;
  }
}

function isNetworkError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as { message: unknown }).message).toLowerCase();
    return (
      msg.includes('network') ||
      msg.includes('timeout') ||
      msg.includes('econnrefused') ||
      msg.includes('econnreset') ||
      msg.includes('net::err')
    );
  }
  return false;
}

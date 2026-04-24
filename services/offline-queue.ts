import { mmkv, STORAGE_KEYS } from '../lib/storage';

export interface OfflineAction {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
  ttlMs: number;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_QUEUE_SIZE = 100;

const OFFLINE_ACTION_WHITELIST = new Set<string>([
  // Keep this list tight: only allow known API endpoints to be queued.
  '/api/stocktake-sessions',
  '/api/repair/create',
  '/api/repair/quote',
  '/api/repair/start',
  '/api/repair/accept',
  '/api/repair/complete',
  '/api/repair/qc',
  '/api/repair/deliver',
]);

function isSafeRelativeApiPath(url: string): boolean {
  if (!url.startsWith('/')) return false;
  if (url.startsWith('//')) return false;
  // Avoid protocol injection via encoded strings or path tricks.
  if (url.includes('://')) return false;
  return true;
}

export function getOfflineQueue(): OfflineAction[] {
  const raw = mmkv.getString(STORAGE_KEYS.OFFLINE_QUEUE);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineAction[]): void {
  mmkv.set(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
}

export function getPendingCount(): number {
  return getOfflineQueue().length;
}

export function enqueueAction(
  url: string,
  method: OfflineAction['method'],
  data: Record<string, unknown>,
  ttlMs: number = DEFAULT_TTL_MS,
): void {
  if (!isSafeRelativeApiPath(url) || !OFFLINE_ACTION_WHITELIST.has(url)) {
    throw new Error(`Offline queue blocked unsafe url: ${url}`);
  }
  const queue = getOfflineQueue();
  if (queue.length >= MAX_QUEUE_SIZE) {
    queue.shift();
  }
  queue.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    url,
    method,
    data,
    timestamp: Date.now(),
    retries: 0,
    ttlMs,
  });
  saveOfflineQueue(queue);
}

export function removeAction(id: string): void {
  const queue = getOfflineQueue().filter((a) => a.id !== id);
  saveOfflineQueue(queue);
}

export function clearQueue(): void {
  saveOfflineQueue([]);
}

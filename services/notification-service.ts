import { mmkv, STORAGE_KEYS } from '../lib/storage';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
}

const MAX_LOG_SIZE = 50;

// Navigation callback - set by root layout
let navigationCallback: ((path: string) => void) | null = null;

export function setNotificationNavigation(cb: (path: string) => void): void {
  navigationCallback = cb;
}

class PushNotificationService {
  private token: string | null = null;
  private enabled: boolean = true;

  async requestPermission(): Promise<boolean> {
    return true;
  }

  async getToken(): Promise<string | null> {
    return this.token;
  }

  async registerToken(token: string): Promise<void> {
    this.token = token;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    mmkv.set('push_enabled', on);
  }

  hydrate(): void {
    this.enabled = mmkv.getBoolean('push_enabled') ?? true;
  }

  async handleForegroundMessage(message: NotificationPayload): Promise<void> {
    if (!this.enabled) return;
    this.addLog(message);
  }

  async handleBackgroundMessage(message: NotificationPayload): Promise<void> {
    if (!this.enabled) return;
    this.addLog(message);
  }

  async navigateToScreen(data: Record<string, string>): Promise<void> {
    const type = data['type'];
    const id = data['id'];
    if (!type || !id || !navigationCallback) return;

    switch (type) {
      case 'new_order':
        navigationCallback(`/device/${id}`);
        break;
      case 'repair_complete':
        navigationCallback(`/repair/${id}`);
        break;
      case 'inventory_alert':
        navigationCallback('/(tabs)/inventory');
        break;
    }
  }

  getLogs(): NotificationLog[] {
    const raw = mmkv.getString(STORAGE_KEYS.OFFLINE_QUEUE + '_notif_log');
    if (!raw) return [];
    try {
      return JSON.parse(raw) as NotificationLog[];
    } catch {
      return [];
    }
  }

  clearLogs(): void {
    mmkv.remove(STORAGE_KEYS.OFFLINE_QUEUE + '_notif_log');
  }

  private addLog(message: NotificationPayload): void {
    const logs = this.getLogs();
    logs.unshift({
      id: Date.now().toString(36),
      title: message.title,
      body: message.body,
      timestamp: Date.now(),
      read: false,
    });
    const trimmed = logs.slice(0, MAX_LOG_SIZE);
    mmkv.set(STORAGE_KEYS.OFFLINE_QUEUE + '_notif_log', JSON.stringify(trimmed));
  }
}

export const notificationService = new PushNotificationService();

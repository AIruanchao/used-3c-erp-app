import { Platform } from 'react-native';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

class PushNotificationService {
  private token: string | null = null;

  async requestPermission(): Promise<boolean> {
    // FCM notification permission is handled at native level
    // For Expo, this is configured in app.json
    return true;
  }

  async getToken(): Promise<string | null> {
    // In a production app, this would use expo-notifications or @react-native-firebase/messaging
    // For now, return a placeholder
    return this.token;
  }

  async registerToken(token: string): Promise<void> {
    this.token = token;
  }

  async handleForegroundMessage(message: NotificationPayload): Promise<void> {
    // Display in-app notification or update badge
    console.info('[Push] Foreground:', message.title);
  }

  async handleBackgroundMessage(message: NotificationPayload): Promise<void> {
    console.info('[Push] Background:', message.title);
  }

  async navigateToScreen(data: Record<string, string>): Promise<void> {
    const type = data['type'];
    const id = data['id'];

    if (!type || !id) return;

    // Navigate based on notification type
    const router = require('expo-router');
    switch (type) {
      case 'new_order':
        router.router.push(`/device/${id}` as never);
        break;
      case 'repair_complete':
        router.router.push(`/repair/${id}` as never);
        break;
      case 'inventory_alert':
        router.router.push('/(tabs)/inventory' as never);
        break;
    }
  }
}

export const notificationService = new PushNotificationService();

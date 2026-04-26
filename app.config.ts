import type { ExpoConfig, ConfigContext } from 'expo/config';

const APP_DISPLAY_NAME = '咖机汇SVIP';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: APP_DISPLAY_NAME,
    slug: 'used-3c-erp-app',
    version: '1.0.3',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    scheme: 'nenie-erp',
    newArchEnabled: false,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#e8e8e8',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.nenie.erp',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#e8e8e8',
      },
      // Expo SDK 54 / Android 16: edge-to-edge is enabled for all apps.
      edgeToEdgeEnabled: true,
      package: 'com.nenie.erp',
      versionCode: 3,
      allowBackup: false,
      permissions: [
        'android.permission.CAMERA',
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.VIBRATE',
        'android.permission.WAKE_LOCK',
      ],
    },
    plugins: [
      'expo-router',
      ['expo-camera', { barcodeScannerEnabled: true }],
    ],
    extra: {
      eas: {
        projectId: '23a4dc07-f9b5-41a1-bcfa-1df52f98197d',
      },
    },
  };
};
